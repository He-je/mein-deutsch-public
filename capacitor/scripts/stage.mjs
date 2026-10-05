import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageStorage} from './stage-storage.mjs';
import {stageSpeech} from './stage-speech.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const assets=path.join(root,'build/capacitor/assets'), web=path.join(assets,'public');
await mkdir(web,{recursive:true});
for(const name of ['core.mjs','style.css','icon.png','grammar.json','grammar-levels.json','chatgpt-prompt.txt','sample.json'])
  await copyFile(path.join(root,'app',name),path.join(web,name));
let app=await readFile(path.join(root,'app/app.mjs'),'utf8');
app=app.replaceAll("'mein-deutsch-v1'","'mein-deutsch-captest-v1'").replaceAll("'mein-deutsch-vocab-view'","'mein-deutsch-captest-vocab-view'");
app=stageSpeech(stageStorage(app)).replaceAll('mein-deutsch-captest-v1','mein-deutsch-v1').replaceAll('mein-deutsch-captest-vocab-view','mein-deutsch-vocab-view').replace('Mein Deutsch TEST 0.3.0','Mein Deutsch 1.0.7');
await writeFile(path.join(web,'app.mjs'),app);
await writeFile(path.join(web,'index.html'),(await readFile(path.join(root,'app/index.html'),'utf8')).replace('src="app.mjs"','src="startup.mjs"'));
for(const name of ['platform-services.mjs','speech-services.mjs','speech-controller.mjs','startup.mjs'])
  await writeFile(path.join(web,name),(await readFile(path.join(root,'capacitor/web',name),'utf8')).replaceAll('mein-deutsch-captest-v1','mein-deutsch-v1'));
await copyFile(path.join(root,'node_modules/@capacitor/core/dist/index.js'),path.join(web,'capacitor-core.mjs'));
await writeFile(path.join(assets,'capacitor.config.json'),JSON.stringify({appId:'de.meindeutsch.publicapp',appName:'Mein Deutsch Public',webDir:'build/capacitor/assets/public',server:{hostname:'app.meindeutsch.local',androidScheme:'https'},android:{allowMixedContent:false,webContentsDebuggingEnabled:false}},null,2));
await writeFile(path.join(assets,'capacitor.plugins.json'),'[]');
console.log('Staged public Capacitor 1.0.7 with original demo and separate Android application ID.');
