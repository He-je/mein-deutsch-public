package de.meindeutsch.app;
import android.app.*;
import android.os.*;
import android.webkit.*;
import android.content.*;
import android.net.Uri;
import android.speech.tts.*;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.util.AtomicFile;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class MainActivity extends Activity {
  private WebView web;
  private TextToSpeech tts;
  private volatile boolean ready=false;
  private volatile boolean initFailed=false;
  private boolean refreshTts=false;
  private Handler handler=new Handler(Looper.getMainLooper());
  private String exportContent;
  private String repeatText="";
  private boolean repeating=false;
  private int generation=0;
  private String speechRequest="";
  private String speechMode="system",configuredVoice="";
  private double configuredRate=1,configuredPitch=1;
  private int speechInit=0;
  private boolean destroyed=false;
  private volatile String speechInfoJson="{\"ready\":false}";
  private String voiceNotice="";

  private static final int IMPORT=41,EXPORT=42,MAX=25000000;
  @Override public void onCreate(Bundle saved){
    super.onCreate(saved);
    web=new WebView(this);setContentView(web);
    web.getSettings().setJavaScriptEnabled(true);
    web.getSettings().setDomStorageEnabled(true);
    web.getSettings().setAllowFileAccess(false);
    web.getSettings().setAllowContentAccess(false);
    web.getSettings().setTextZoom((int)(getResources().getConfiguration().fontScale*100));
    web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    web.setWebViewClient(new WebViewClient(){
      @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
        Uri uri=r.getUrl();
        if(!"https".equals(uri.getScheme())||!"app.meindeutsch.local".equals(uri.getHost()))return blocked();
        String path=uri.getPath();if(path==null||path.equals("/"))path="/index.html";
        if(path.contains(".."))return blocked();
        try{
          String mime=path.endsWith(".html")?"text/html":path.endsWith(".css")?"text/css":path.endsWith(".mjs")?"application/javascript":path.endsWith(".json")?"application/json":path.endsWith(".png")?"image/png":"text/plain";
          return new WebResourceResponse(mime,"UTF-8",getAssets().open("web"+path));
        }catch(IOException e){return blocked();}
      }
      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return true;}
    });
    web.addJavascriptInterface(new Bridge(),"Native");
    setVolumeControlStream(AudioManager.STREAM_MUSIC);
    initSpeech();
    web.loadUrl("https://app.meindeutsch.local/index.html");
  }
  private void initSpeech(){
    ready=false;initFailed=false;stopSpeech();final int init=++speechInit;publishSpeechInfo();
    if(tts!=null){tts.stop();tts.shutdown();}
    tts=new TextToSpeech(this,status->handler.post(()->{
      if(destroyed||init!=speechInit)return;
      initFailed=status!=TextToSpeech.SUCCESS;
      if(!initFailed){
        tts.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){
          public void onStart(String id){handler.post(()->{if(init==speechInit&&id.endsWith("-"+generation))js("onNativeSpeechStarted",speechRequest);});}
          public void onError(String id){onError(id,TextToSpeech.ERROR);}
          public void onError(String id,int code){handler.post(()->{if(init==speechInit&&id.endsWith("-"+generation))speechError("Android TTS failed (code "+code+"). Check the installed offline German voice.");});}
          public void onDone(String id){
            handler.post(()->{if(init!=speechInit||!id.equals("last-"+generation))return;
              if(repeating){final int g=generation;handler.postDelayed(()->{if(repeating&&g==generation)enqueue(repeatText);},700);}
              else js("onNativeSpeechDone",speechRequest);
            });
          }
        });
        ready=true;applySpeechConfig();
      }
      publishSpeechInfo();js("onNativeVoicesChanged",null);
    }));
  }
  private boolean offlineGerman(Voice voice){return voice!=null&&"de".equals(voice.getLocale().getLanguage())&&!voice.isNetworkConnectionRequired();}
  private String applySpeechConfig(){
    voiceNotice="";
    try{
      // getDefaultVoice is independent of the voice selected by a previous setVoice call.
      Voice chosen=tts.getDefaultVoice();
      if(!offlineGerman(chosen)){
        tts.setLanguage(Locale.GERMANY);
        chosen=tts.getVoice();
      }
      ArrayList<Voice> available=new ArrayList<>();Set<Voice> all=tts.getVoices();
      if(all!=null)for(Voice v:all)if(offlineGerman(v))available.add(v);
      available.sort((a,b)->a.getName().compareTo(b.getName()));
      if(!offlineGerman(chosen)){
        chosen=available.isEmpty()?null:available.get(0);
        voiceNotice="offlineFallback";
      }
      if("custom".equals(speechMode)&&!configuredVoice.isEmpty()){
        Voice selected=null;for(Voice v:available)if(v.getName().equals(configuredVoice)){selected=v;break;}
        if(selected!=null){chosen=selected;voiceNotice="";}else voiceNotice="missingVoice";
      }
      if(chosen==null){voiceNotice="noGerman";return "NO_GERMAN";}
      if(tts.setVoice(chosen)==TextToSpeech.ERROR)return "The German voice could not be loaded. Check Android TTS settings.";
      // A fresh system-mode instance has no rate/pitch overrides. Android's service supplies its defaults.
      if("custom".equals(speechMode)){
        if(tts.setSpeechRate((float)configuredRate)==TextToSpeech.ERROR)return "Android could not apply the playback speed.";
        if(tts.setPitch((float)configuredPitch)==TextToSpeech.ERROR)return "Android could not apply the voice pitch.";
      }
      return "";
    }catch(Exception e){return "Speech settings could not be applied: "+e.getClass().getSimpleName();}
  }
  private void publishSpeechInfo(){
    try{
      JSONObject info=new JSONObject();info.put("ready",ready);info.put("failed",initFailed);info.put("mode",speechMode);info.put("notice",voiceNotice);
      if(tts!=null&&ready){
        String engine=tts.getDefaultEngine(),label=engine;
        for(TextToSpeech.EngineInfo e:tts.getEngines())if(e.name.equals(engine)){label=e.label;break;}
        info.put("engine",label==null?"":label);info.put("enginePackage",engine==null?"":engine);
        Voice voice=tts.getVoice();if(offlineGerman(voice)){info.put("voice",voice.getName());info.put("locale",voice.getLocale().toLanguageTag());}
      }
      speechInfoJson=info.toString();js("onNativeSpeechInfo",speechInfoJson);
    }catch(Exception ignored){speechInfoJson="{\"ready\":false}";}
  }
  private void speechError(String message){stopSpeech();try{JSONObject event=new JSONObject();event.put("token",speechRequest);event.put("message",message);js("onNativeSpeechError",event.toString());}catch(JSONException ignored){}}
  private WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));}
  private void js(String fn,String value){handler.post(()->{if(web!=null)web.evaluateJavascript("window."+fn+" && window."+fn+"("+(value==null?"":JSONObject.quote(value))+")",null);});}
  private void stopSpeech(){generation++;repeating=false;if(tts!=null)tts.stop();}
  private void enqueue(String text){
    int max=Math.min(3000,TextToSpeech.getMaxSpeechInputLength()-50),start=0;ArrayList<String> chunks=new ArrayList<>();
    while(start<text.length()){int end=Math.min(text.length(),start+max);if(end<text.length()){int space=text.lastIndexOf(' ',end);if(space>start)end=space;}chunks.add(text.substring(start,end));start=end;}
    for(int i=0;i<chunks.size();i++){
      int result=tts.speak(chunks.get(i),i==0?TextToSpeech.QUEUE_FLUSH:TextToSpeech.QUEUE_ADD,null,(i==chunks.size()-1?"last-":"part-"+i+"-")+generation);
      if(result==TextToSpeech.ERROR){speechError("Android rejected the speech request. Reopen the app after checking TTS settings.");return;}
    }
  }
  public class Bridge{
    @JavascriptInterface public String load(){try{return new String(new AtomicFile(new File(getFilesDir(),"library.json")).readFully(),StandardCharsets.UTF_8);}catch(FileNotFoundException e){return "";}catch(Exception e){return "INVALID_SAVED_DATA";}}
    @JavascriptInterface public String save(String value){
      if(value.length()>MAX)return "Library too large.";
      AtomicFile file=new AtomicFile(new File(getFilesDir(),"library.json"));FileOutputStream out=null;
      try{new JSONObject(value);out=file.startWrite();out.write(value.getBytes(StandardCharsets.UTF_8));file.finishWrite(out);return "";}
      catch(Exception e){if(out!=null)file.failWrite(out);return "Device storage could not save the library.";}
    }
    @JavascriptInterface public void importFile(){handler.post(()->{try{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,IMPORT);}catch(Exception e){js("onNativeError","No file picker available.");}});}
    @JavascriptInterface public void exportFile(String name,String type,String content){handler.post(()->{if(content.length()>MAX){js("onNativeError","File too large.");return;}try{exportContent=content;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(type).putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(i,EXPORT);}catch(Exception e){js("onNativeError","Could not open the save dialog.");}});}
    @JavascriptInterface public void copy(String value){handler.post(()->((android.content.ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("Mein Deutsch prompt",value)));}
    @JavascriptInterface public String speechInfo(){return speechInfoJson;}
    @JavascriptInterface public void configureSpeech(String mode,String voice,double rate,double pitch){
      handler.post(()->{
        String nextMode="custom".equals(mode)?"custom":"system";
        String nextVoice=voice==null?"":voice;
        double nextRate=Double.isFinite(rate)?Math.max(.5,Math.min(1.5,rate)):1;
        double nextPitch=Double.isFinite(pitch)?Math.max(.5,Math.min(1.5,pitch)):1;
        boolean changed=!nextMode.equals(speechMode)||!nextVoice.equals(configuredVoice)||nextRate!=configuredRate||nextPitch!=configuredPitch;
        boolean reset=!nextMode.equals(speechMode);
        speechMode=nextMode;configuredVoice=nextVoice;configuredRate=nextRate;configuredPitch=nextPitch;
        if(changed)MainActivity.this.stopSpeech();
        if(reset){initSpeech();return;}
        if(ready){applySpeechConfig();publishSpeechInfo();}
      });
    }
    @JavascriptInterface public String voices(){
      JSONArray a=new JSONArray();if(!ready)return a.toString();
      try{Set<Voice> all=tts.getVoices();if(all!=null)for(Voice v:all)if("de".equals(v.getLocale().getLanguage())&&!v.isNetworkConnectionRequired()){JSONObject o=new JSONObject();o.put("id",v.getName());o.put("label",v.getName()+" · "+v.getLocale().toLanguageTag());a.put(o);}}catch(Exception ignored){}
      return a.toString();
    }
    @JavascriptInterface public String speak(String text,double rate,String voice,boolean repeat,String request){
      if(initFailed)return "Android TTS could not start. Check the preferred engine in TTS settings, then reopen the app.";
      if(!ready)return "Speech engine is starting. Try again in a moment.";
      if(text==null||text.trim().isEmpty()||text.length()>2000000)return "No valid text to read.";
      handler.post(()->{
        try{
          // Call the Activity method now. Bridge.stopSpeech() would post a second
          // task that runs AFTER enqueue(), cancelling the new utterance.
          MainActivity.this.stopSpeech();
          speechRequest=request;
          if(!ready){speechError("Speech engine is starting. Try again in a moment.");return;}
          String error=applySpeechConfig();publishSpeechInfo();
          if(!error.isEmpty()){speechError(error);return;}
          repeatText=text;repeating=repeat;enqueue(text);
        }catch(Exception e){speechError("Android speech connection failed: "+e.getClass().getSimpleName());}
      });
      return "";
    }
    @JavascriptInterface public void stopSpeech(){handler.post(()->MainActivity.this.stopSpeech());}
    @JavascriptInterface public void openTtsSettings(){handler.post(()->{refreshTts=true;try{startActivity(new Intent("com.android.settings.TTS_SETTINGS"));}catch(Exception e){startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS));}});}
    @JavascriptInterface public void finishApp(){handler.post(()->finish());}
  }
  @Override protected void onActivityResult(int request,int result,Intent data){
    super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null||data.getData()==null)return;
    final Uri uri=data.getData();
    new Thread(()->{
      try{
        if(request==IMPORT){
          ByteArrayOutputStream out=new ByteArrayOutputStream();
          try(InputStream in=getContentResolver().openInputStream(uri)){byte[] buffer=new byte[8192];int count;while((count=in.read(buffer))!=-1){if(out.size()+count>MAX)throw new IOException("File exceeds 25 MB.");out.write(buffer,0,count);}}
          js("onNativeImport",new String(out.toByteArray(),StandardCharsets.UTF_8));
        }else if(request==EXPORT){
          if(exportContent==null)throw new IOException("Export expired. Please retry.");
          try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){out.write(exportContent.getBytes(StandardCharsets.UTF_8));}
          exportContent=null;js("onNativeError","File saved.");
        }
      }catch(Exception e){js("onNativeError","File operation failed: "+e.getMessage());}
    }).start();
  }
  @Override public void onBackPressed(){web.evaluateJavascript("window.onNativeBack && window.onNativeBack()",null);}
  @Override protected void onPause(){super.onPause();stopSpeech();js("onNativeSpeechStopped",speechRequest);}
  @Override protected void onResume(){super.onResume();if(refreshTts){refreshTts=false;initSpeech();}}
  @Override protected void onDestroy(){destroyed=true;speechInit++;stopSpeech();if(tts!=null)tts.shutdown();if(web!=null){web.removeJavascriptInterface("Native");web.destroy();web=null;}super.onDestroy();}
}
