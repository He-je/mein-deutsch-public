// Prototype-only async speech boundary. Keep the released UI source unchanged.
export function stageSpeech(source){
  function once(from,to){if(source.split(from).length!==2)throw Error('Speech overlay anchor changed: '+from.slice(0,100));source=source.replace(from,to);}
  source="import {speech} from './speech-services.mjs';\n"+source;
  once("if(window.Native){try{Native.stopSpeech();}catch(e){console.warn('Native stop failed',e);}}", "if(speech.native){speech.stop().catch(e=>console.warn('Speech stop failed',e));}");
  const configureStart=source.indexOf('function configureSpeech(){'),configureEnd=source.indexOf('\nfunction settingsPage',configureStart);
  if(configureStart<0||configureEnd<0)throw Error('Missing speech config boundary');
  source=source.slice(0,configureStart)+`function acceptSpeechStatus(value){
    voices=Array.isArray(value.voices)?value.voices:[];speechInfo=value.info||{ready:false};
    if(route.tab==='settings')render();
  }
  async function configureSpeech(){
    if(!speech.native)return;
    speechInfo={ready:false};
    try{acceptSpeechStatus(await speech.configure({mode:state.settings.speechMode,voice:String(state.settings.voice||''),rate:Number(state.settings.rate),pitch:Number(state.settings.pitch)}));}
    catch(e){speechInfo={ready:false,failed:true};if(route.tab==='settings')render();toast('Speech settings: '+e.message);}
  }`+source.slice(configureEnd);
  const fetchStart=source.indexOf('function fetchVoices(){'),fetchEnd=source.indexOf('\nfunction speechFailure',fetchStart);
  if(fetchStart<0||fetchEnd<0)throw Error('Missing voices boundary');
  source=source.slice(0,fetchStart)+`async function fetchVoices(){
    if(speech.native){try{acceptSpeechStatus(await speech.status());}catch{voices=[];speechInfo={ready:false,failed:true};}}
    else voices=(window.speechSynthesis?.getVoices()||[]).filter(v=>v.lang.toLowerCase().startsWith('de')).map(v=>({id:v.voiceURI,label:v.name}));
  }`+source.slice(fetchEnd);
  const speakStart=source.indexOf('function speak(text,'),browserStart=source.indexOf(' if(!window.speechSynthesis)',speakStart);
  if(speakStart<0||browserStart<0)throw Error('Missing speak boundary');
  source=source.slice(0,speakStart)+`function speak(text,all=false,preserveReading=false){
    stop(preserveReading);const token=speechToken;speaking=true;
    if(speech.native){
      document.querySelectorAll('[data-act="stop"]').forEach(b=>b.hidden=false);
      if(!preserveReading)toast(state.settings.language==='de'?'Sprachausgabe wird gestartet…':'Starting speech…');
      // Install the watchdog before calling native: onStart can precede resolve.
      speechWatchdog=setTimeout(()=>{if(token===speechToken&&speaking)speechFailure('Android did not start playback within 15 seconds. Check the selected offline German voice and try again.');},15000);
      speech.speak({text:String(text||''),repeat:Boolean(state.settings.repeat&&!all),token:String(token)})
        .catch(e=>{if(token===speechToken&&speaking)speechFailure(e.message);});
      return;
    }
`+source.slice(browserStart);
  once("else if(a==='tts-settings'&&window.Native)Native.openTtsSettings();", "else if(a==='tts-settings'&&speech.native){try{await speech.openSettings();}catch(e){toast('Could not open speech settings: '+e.message);}}");
  once('else if(window.Native)Native.finishApp();', "else if(speech.native){try{await speech.finishApp();}catch(e){toast(e.message);}}");
  // Install one Capacitor event subscription, before querying/configuring the
  // engine. No legacy global speech callbacks or JavaScript interface remain.
  const callbacksStart=source.indexOf('window.onNativeImport='),callbacksEnd=source.indexOf('window.onNativeBack=',callbacksStart);
  if(callbacksStart<0||callbacksEnd<0)throw Error('Missing legacy callbacks');
  source=source.slice(0,callbacksStart)+`if(speech.native)await speech.listen(event=>{
    const value=event.data||{};
    if(event.type==='status')acceptSpeechStatus(value);
    else if(event.type==='started')speechStarted(value.token);
    else if(event.type==='done')speechDone(value.token);
    else if(event.type==='stopped'){if(String(value.token)===String(speechToken))stop();}
    else if(event.type==='error'){if(String(value.token)===String(speechToken)&&speaking)speechFailure(value.message);}
  });
`+source.slice(callbacksEnd);
  source=source.replaceAll('window.Native?.speechInfo','speech.native').replaceAll('window.Native','speech.native');
  // Await explicit refresh/configuration at initialization, restore and settings
  // changes. Browser speak can keep its synchronous voice enumeration.
  source=source.replaceAll('configureSpeech();','await configureSpeech();');
  once("else if(a==='settings'){fetchVoices();", "else if(a==='settings'){await fetchVoices();");
  once(']);fetchVoices();await configureSpeech();render();', ']);await fetchVoices();await configureSpeech();render();');
  source=source.replace('Mein Deutsch 1.0.6 · ', 'Mein Deutsch TEST 0.3.0 · ');
  if(/\bNative\.|window\.Native|onNativeSpeech/.test(source))throw Error('Legacy speech call survived');
  return source;
}
