package de.meindeutsch.app;

import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;

/** All engine commands and callbacks are ordered on Android's main thread. */
@CapacitorPlugin(name="StudySpeech")
public class StudySpeechPlugin extends Plugin {
    private final Handler main=new Handler(Looper.getMainLooper());
    private TextToSpeech tts;
    private boolean ready,failed,destroyed,paused,refreshTts,repeating,active;
    private int generation,initialization;
    private String token="",mode="system",configuredVoice="",notice="",repeatText="";
    private double rate=1,pitch=1;

    @Override public void load() { main.post(this::initEngine); }
    private void run(PluginCall call,Runnable action) {
        main.post(()->{
            if(destroyed){call.reject("Speech service has closed. Reopen the app.");return;}
            try{action.run();}catch(Exception e){call.reject(e.getMessage()==null?"Speech operation failed.":e.getMessage(),e);}
        });
    }
    private void emit(String type,JSObject data){
        if(!destroyed)notifyListeners("speechEvent",new JSObject().put("type",type).put("data",data));
    }
    private void event(String type){emit(type,new JSObject().put("token",token));}
    private boolean current(String id,int init){return !destroyed&&active&&init==initialization&&id!=null&&id.endsWith("-"+generation);}
    private void stopEngine(){generation++;active=false;repeating=false;if(tts!=null)tts.stop();}
    private void failSpeech(String message){stopEngine();emit("error",new JSObject().put("token",token).put("message",message));}
    private void initEngine(){
        if(destroyed)return;
        ready=false;failed=false;stopEngine();final int init=++initialization;publish();
        if(tts!=null){tts.shutdown();tts=null;}
        try{
            tts=new TextToSpeech(getContext(),status->main.post(()->{
                if(destroyed||init!=initialization)return;
                failed=status!=TextToSpeech.SUCCESS;
                if(!failed){
                    tts.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
                    tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){
                        public void onStart(String id){main.post(()->{if(current(id,init))event("started");});}
                        public void onError(String id){onError(id,TextToSpeech.ERROR);}
                        public void onError(String id,int code){main.post(()->{if(current(id,init))failSpeech("Android TTS failed (code "+code+"). Check the installed offline German voice.");});}
                        public void onDone(String id){main.post(()->{
                            if(!current(id,init)||!id.equals("last-"+generation))return;
                            if(repeating){active=false;final int g=generation;main.postDelayed(()->{
                                if(!destroyed&&!paused&&repeating&&g==generation){generation++;active=true;String error=enqueue(repeatText);if(!error.isEmpty())failSpeech(error);}
                            },700);}else{active=false;event("done");}
                        });}
                    });
                    ready=true;applyConfig();
                }
                publish();
            }));
        }catch(Exception e){failed=true;publish();}
    }
    private boolean offlineGerman(Voice v){return v!=null&&"de".equals(v.getLocale().getLanguage())&&!v.isNetworkConnectionRequired();}
    private ArrayList<Voice> available(){
        ArrayList<Voice> result=new ArrayList<>();
        if(tts!=null&&ready){Set<Voice> all=tts.getVoices();if(all!=null)for(Voice v:all)if(offlineGerman(v))result.add(v);}
        result.sort((a,b)->a.getName().compareTo(b.getName()));return result;
    }
    private String applyConfig(){
        notice="";
        try{
            Voice chosen=tts.getDefaultVoice();
            if(!offlineGerman(chosen)){tts.setLanguage(Locale.GERMANY);chosen=tts.getVoice();}
            ArrayList<Voice> all=available();
            if(!offlineGerman(chosen)){chosen=all.isEmpty()?null:all.get(0);notice="offlineFallback";}
            if("custom".equals(mode)&&!configuredVoice.isEmpty()){
                Voice selected=null;for(Voice v:all)if(v.getName().equals(configuredVoice)){selected=v;break;}
                if(selected!=null){chosen=selected;notice="";}else notice="missingVoice";
            }
            if(chosen==null){notice="noGerman";return "NO_GERMAN";}
            if(tts.setVoice(chosen)==TextToSpeech.ERROR)return "The German voice could not be loaded. Check Android TTS settings.";
            // System mode gets a fresh engine on mode switches; do not override
            // Android's rate or pitch with the app's saved custom settings.
            if("custom".equals(mode)){
                if(tts.setSpeechRate((float)rate)==TextToSpeech.ERROR)return "Android could not apply the playback speed.";
                if(tts.setPitch((float)pitch)==TextToSpeech.ERROR)return "Android could not apply the voice pitch.";
            }
            return "";
        }catch(Exception e){return "Speech settings could not be applied: "+e.getClass().getSimpleName();}
    }
    private JSObject snapshot(){
        JSObject info=new JSObject().put("ready",ready).put("failed",failed).put("mode",mode).put("notice",notice);
        JSArray voices=new JSArray();
        try{
            for(Voice v:available())voices.put(new JSObject().put("id",v.getName()).put("label",v.getName()+" · "+v.getLocale().toLanguageTag()));
            if(ready&&tts!=null){
                String engine=tts.getDefaultEngine(),label=engine;
                for(TextToSpeech.EngineInfo e:tts.getEngines())if(e.name.equals(engine)){label=e.label;break;}
                info.put("engine",label==null?"":label).put("enginePackage",engine==null?"":engine);
                Voice voice=tts.getVoice();if(offlineGerman(voice))info.put("voice",voice.getName()).put("locale",voice.getLocale().toLanguageTag());
            }
        }catch(Exception e){info.put("notice","noGerman");}
        return new JSObject().put("info",info).put("voices",voices);
    }
    private void publish(){emit("status",snapshot());}
    private String enqueue(String text){
        int limit=Math.min(3000,TextToSpeech.getMaxSpeechInputLength()-50);
        if(limit<2)return "Android returned an invalid speech length limit.";
        ArrayList<String> chunks=SpeechChunks.split(text,limit);
        for(int i=0;i<chunks.size();i++){
            int result=tts.speak(chunks.get(i),i==0?TextToSpeech.QUEUE_FLUSH:TextToSpeech.QUEUE_ADD,null,(i==chunks.size()-1?"last-":"part-"+i+"-")+generation);
            if(result==TextToSpeech.ERROR)return "Android rejected the speech request. Check TTS settings and try again.";
        }
        return "";
    }
    @PluginMethod public void status(PluginCall call){run(call,()->call.resolve(snapshot()));}
    @PluginMethod public void configure(PluginCall call){run(call,()->{
        String nextMode="custom".equals(call.getString("mode"))?"custom":"system";
        String voice=call.getString("voice","");double nextRate=call.getDouble("rate",1.0),nextPitch=call.getDouble("pitch",1.0);
        nextRate=Double.isFinite(nextRate)?Math.max(.5,Math.min(1.5,nextRate)):1;
        nextPitch=Double.isFinite(nextPitch)?Math.max(.5,Math.min(1.5,nextPitch)):1;
        boolean reset=!mode.equals(nextMode),changed=reset||!configuredVoice.equals(voice)||rate!=nextRate||pitch!=nextPitch;
        mode=nextMode;configuredVoice=voice;rate=nextRate;pitch=nextPitch;
        if(changed)stopEngine();
        if(reset)initEngine();else if(ready){applyConfig();publish();}
        call.resolve(snapshot());
    });}
    @PluginMethod public void speak(PluginCall call){run(call,()->{
        if(paused){call.reject("Return to the app before starting speech.");return;}
        if(failed){call.reject("Android TTS could not start. Check the preferred engine in TTS settings, then reopen the app.");return;}
        if(!ready){call.reject("Speech engine is starting. Try again in a moment.");return;}
        String text=call.getString("text"),request=call.getString("token");
        if(text==null||text.trim().isEmpty()||text.length()>2000000||request==null||request.length()>80){call.reject("No valid text or playback request.");return;}
        // Synchronous engine stop inside this main-thread command preserves the
        // historical fix: never post another stop after enqueueing speech.
        stopEngine();token=request;String error=applyConfig();publish();
        if(!error.isEmpty()){call.reject(error);return;}
        repeatText=text;repeating=call.getBoolean("repeat",false);active=true;
        error=enqueue(text);if(!error.isEmpty()){stopEngine();call.reject(error);return;}
        call.resolve();
    });}
    @PluginMethod public void stop(PluginCall call){run(call,()->{stopEngine();call.resolve();});}
    @PluginMethod public void openSettings(PluginCall call){run(call,()->{
        stopEngine();event("stopped");refreshTts=true;
        try{getActivity().startActivity(new Intent("com.android.settings.TTS_SETTINGS"));}
        catch(Exception e){getActivity().startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS));}
        call.resolve();
    });}
    @PluginMethod public void finishApp(PluginCall call){run(call,()->{stopEngine();call.resolve();getActivity().finish();});}
    @Override protected void handleOnPause(){paused=true;stopEngine();event("stopped");}
    @Override protected void handleOnResume(){paused=false;if(refreshTts){refreshTts=false;initEngine();}else publish();}
    @Override protected void handleOnDestroy(){destroyed=true;initialization++;main.removeCallbacksAndMessages(null);stopEngine();if(tts!=null){tts.shutdown();tts=null;}ready=false;}
}
