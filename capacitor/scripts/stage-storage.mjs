// Bounded prototype overlay: production source remains the release baseline.
// Anchors deliberately fail closed if upstream handlers change.
export function stageStorage(source) {
  function once(from,to) {
    if(source.split(from).length!==2) throw Error('Storage overlay anchor changed: '+from.slice(0,100));
    source=source.replace(from,to);
  }
  source="import {platform} from './platform-services.mjs';\n"+source;
  once("window.Native?Native.load():localStorage.getItem('mein-deutsch-captest-v1')",'await platform.load()');
  const start=source.indexOf('function save('), end=source.indexOf('\nfunction stop(',start);
  if(start<0||end<0) throw Error('Missing save boundary');
  source=source.slice(0,start)+`let storageBusy=false;
async function storageOperation(work) {
  if(storageBusy) throw Error('Please wait for the current file operation.');
  storageBusy=true;document.body.setAttribute('aria-busy','true');
  try{return await work();}finally{storageBusy=false;document.body.removeAttribute('aria-busy');}
}
// Prevent stale snapshots and double submission while an async commit is pending.
document.addEventListener('click',e=>{if(storageBusy){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('change',e=>{if(storageBusy){e.preventDefault();e.stopImmediatePropagation();render();}},true);
async function save(next=state,recovery=false){
  try{
    if(storageFailed&&!recovery)throw Error('Previous data could not be loaded. Restore a valid backup before saving.');
    const snapshot=structuredClone(next), raw=JSON.stringify(snapshot);
    await storageOperation(()=>platform.save(raw));
    state=snapshot;storageFailed=false;return true;
  }catch(e){toast('Could not save: '+e.message);return false;}
}`+source.slice(end);
  once("function rememberScroll(){if(route.tab==='reader'&&!Number.isInteger(route.sentence)){state.reading[route.id]={scroll:window.scrollY};save();}}",
    "async function rememberScroll(){if(!storageBusy&&!storageFailed&&route.tab==='reader'&&!Number.isInteger(route.sentence)&&state.articles.some(a=>a.id===route.id)){const next=structuredClone(state);next.reading[route.id]={scroll:window.scrollY};return await save(next);}return true;}");
  once('function go(r){rememberScroll();', 'async function go(r,preserveScroll=true){if(preserveScroll&&!(await rememberScroll()))return;');
  source=source.replaceAll('if(save(', 'if(await save(');
  source=source.replaceAll("go({", "await go({");
  once("else if(a==='sentence'){rememberScroll();", "else if(a==='sentence'){if(!(await rememberScroll()))return;");
  once("document.addEventListener('change',e=>{if(e.target.id===", "document.addEventListener('change',async e=>{if(e.target.id===");
  once('window.onNativeBack=()=>{', 'window.onNativeBack=async()=>{if(storageBusy)return;');
  // A restore must not overwrite the backup's reading position with the old view.
  once("session=null;configureSpeech();await go({tab:'texts'});", "session=null;configureSpeech();await go({tab:'texts'},false);");
  once("if(window.Native)Native.importFile();else{$('#file').value='';$('#file').click();}",
    "try{const result=await storageOperation(()=>platform.pick());if(result.browser){$('#file').value='';$('#file').click();}else if(!result.cancelled)receiveFile(result.raw);}catch(e){toast('Could not import: '+e.message);}");
  const dlStart=source.indexOf('function download('), dlEnd=source.indexOf('\nfunction fetchVoices',dlStart);
  if(dlStart<0||dlEnd<0)throw Error('Missing download boundary');
  source=source.slice(0,dlStart)+`async function download(name,type,content){
    try{const result=await storageOperation(()=>platform.exportFile(name,type,content));if(result.saved)toast('File saved.');}
    catch(e){toast('Could not export: '+e.message);}
  }`+source.slice(dlEnd);
  source=source.replaceAll(")download('",")await download('");
  once("else if(a==='backup')await download(","else if(a==='backup'&&storageFailed)toast('Saved data could not be read. Export is blocked to protect your previous library.');\n else if(a==='backup')await download(");
  once("if(window.Native)Native.copy(prompt);else await navigator.clipboard.writeText(prompt);", "await storageOperation(()=>platform.copy(prompt));");
  once("catch{download('Mein-Deutsch-ChatGPT-Prompt.txt','text/plain',prompt);}", "catch{await download('Mein-Deutsch-ChatGPT-Prompt.txt','text/plain',prompt);}");
  // Settings controls must reflect committed state even when a write fails.
  once("if(['speechMode','voice','rate','pitch'].includes(key))configureSpeech();render();}}});", "if(['speechMode','voice','rate','pitch'].includes(key))configureSpeech();render();}else render();}});");
  if(/Native\.(load|save|importFile|exportFile|copy)\(/.test(source))throw Error('Legacy storage call survived staging');
  return source;
}
