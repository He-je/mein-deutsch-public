// Fictional public fixture only. Outputs stay in ignored build/.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import path from 'node:path';
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
import {validateBackup,vocabulary,defaults,importStudy} from '../../app/core.mjs';
const fixture=JSON.parse(await readFile(path.join(root,'app/sample.json'),'utf8'));
let seeded=importStudy(defaults(),fixture).state;
const second=structuredClone(fixture);second.id='public-second-source';second.title='Public second source';
seeded=importStudy(seeded,second).state;
const word=vocabulary(seeded)[0];seeded.words[word.key].known=true;seeded.words[word.key].seen=3;
seeded.settings.textSize=110;seeded.settings.theme='dark';seeded.settings.colours=true;
seeded.reading[fixture.id]={scroll:120};
const backup={type:'mein-deutsch-backup',version:1,state:seeded};
const bytes=Buffer.from(JSON.stringify(backup));
const clean=validateBackup(backup),raw=JSON.stringify(clean);
assert.ok(isDeepStrictEqual(clean,backup.state),'Backup validation would change supplied state; investigate before application.');
const digest=value=>createHash('sha256').update(value).digest('hex');
const stateHash=value=>digest(JSON.stringify(validateBackup({type:'mein-deutsch-backup',version:1,state:value})));
assert.equal(stateHash(backup.state),digest(raw));
const output=path.join(root,'build/capacitor-verification');await mkdir(output,{recursive:true});
const origin='https://app.meindeutsch.local';let phase='old';
const nativeBridge=await readFile(path.join(root,'node_modules/@capacitor/android/capacitor/src/main/assets/native-bridge.js'),'utf8');

const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(origin+'/**',async route=>{
    const pathname=new URL(route.request().url()).pathname;
    const dir=phase==='old'?'app':'build/capacitor/assets/public';
    const asset=path.join(root,dir,pathname==='/'?'index.html':pathname.slice(1));
    try{await route.fulfill({body:await readFile(asset),contentType:asset.endsWith('.mjs')?'application/javascript':asset.endsWith('.html')?'text/html':asset.endsWith('.css')?'text/css':asset.endsWith('.png')?'image/png':'application/json'});}catch{await route.fulfill({status:404,body:''});}
  });
  await page.addInitScript({content:`
    if(!localStorage.getItem('__initialized')){localStorage.setItem('__initialized','yes');localStorage.setItem('__native_file',${JSON.stringify(raw)});localStorage.setItem('mein-deutsch-vocab-view',JSON.stringify({mode:'list',key:'',index:0,query:'',kind:'all',article:''}));}
    window.exports=[];window.saveCount=0;window.picked=null;
    const info={ready:true,mode:'system',engine:'Mock offline engine',voice:'de',locale:'de-DE'};
    if(localStorage.getItem('__phase')!=='new'){
      window.Native={load:()=>localStorage.getItem('__native_file'),save:raw=>{saveCount++;localStorage.setItem('__native_file',raw);return '';},voices:()=> '[]',speechInfo:()=>JSON.stringify(info),configureSpeech:()=>{},stopSpeech:()=>{},speak:()=>''};
    }else{
      window.Capacitor={PluginHeaders:[{name:'AppEnvironment',methods:[{name:'status',rtype:'promise'}]},
        {name:'StudyStorage',methods:['load','save','pick','exportFile','copy'].map(name=>({name,rtype:'promise'}))},
        {name:'StudySpeech',methods:[...['status','configure','stop','speak','openSettings','finishApp','removeListener'].map(name=>({name,rtype:'promise'})),{name:'addListener',rtype:'callback'}]}]};
      window.androidBridge={postMessage(raw){const c=JSON.parse(raw);let data={};
        if(c.pluginId==='AppEnvironment')data={package:'de.meindeutsch.publicapp'};
        if(c.pluginId==='StudyStorage'){
          if(c.methodName==='load')data={raw:localStorage.getItem('__native_file')};
          if(c.methodName==='save'){saveCount++;localStorage.setItem('__native_file',c.options.raw);}
          if(c.methodName==='pick')data=picked===null?{cancelled:true}:{raw:picked};
          if(c.methodName==='exportFile'){exports.push(c.options);data={saved:true};}
        }
        if(c.pluginId==='StudySpeech')data={info,voices:[]};
        if(c.methodName==='addListener')return;
        queueMicrotask(()=>Capacitor.fromNative({callbackId:c.callbackId,pluginId:c.pluginId,methodName:c.methodName,success:true,data}));
      }};
      ${nativeBridge}
    }
  `});
  await page.goto(origin);await page.locator('[data-act="article"]').first().waitFor();
  assert.equal(await page.locator('[data-act="article"]').count(),clean.articles.length);
  const oldHash=digest(await page.evaluate(()=>localStorage.getItem('__native_file')));
  phase='new';await page.evaluate(()=>localStorage.setItem('__phase','new'));await page.reload();
  await page.locator('[data-act="article"]').first().waitFor();
  assert.equal(await page.locator('[data-act="article"]').count(),clean.articles.length);
  assert.equal(digest(await page.evaluate(()=>localStorage.getItem('__native_file'))),oldHash);
  assert.equal(await page.evaluate(()=>saveCount),0);
  assert.equal(await page.locator('#prototype-banner').count(),0);
  await page.locator('nav [data-tab="vocab"]').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mein-deutsch-vocab-view')).mode),'list');
  await page.locator('[data-act="settings"]').click();
  assert.equal(await page.locator('[data-setting="textSize"]').inputValue(),String(clean.settings.textSize));
  assert.equal(await page.locator('[data-setting="theme"]').inputValue(),clean.settings.theme);
  await page.locator('[data-act="backup"]').click();await page.waitForFunction(()=>exports.length===1);
  const exported=await page.evaluate(()=>exports[0].content);
  assert.equal(stateHash(JSON.parse(exported).state),digest(raw));
  await writeFile(path.join(output,'candidate-export.json'),exported);
  await page.locator('[data-setting="textSize"]').selectOption(clean.settings.textSize===120?'110':'120');
  await page.waitForFunction(()=>saveCount>0);await page.reload();
  assert.notEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('__native_file'))).settings.textSize,clean.settings.textSize);
  await page.locator('[data-act="settings"]').click();
  await page.evaluate(text=>window.picked=text,bytes.toString('utf8'));
  await page.locator('[data-act="restore"]').click();await page.locator('[data-act="commit-backup"]').click();
  await page.locator('[data-act="article"]').first().waitFor();await page.reload();
  await page.locator('[data-act="article"]').first().waitFor();
  const recovered=JSON.parse(await page.evaluate(()=>localStorage.getItem('__native_file')));
  assert.equal(stateHash(recovered),digest(raw));
  // Render one annotated sentence from the original public fixture; no content is logged.
  const article=clean.articles.find(a=>a.sentences.some(s=>s.segments.some(x=>x.role==='subject')));
  if(article){
    await page.locator('[data-act="settings"]').click();await page.locator('[data-setting="colours"]').check();
    await page.locator('nav [data-tab="texts"]').click();
    await page.locator('[data-act="article"][data-id="'+article.id+'"]').click();
    const i=article.sentences.findIndex(s=>s.segments.some(x=>x.role==='subject'));
    await page.locator('[data-act="sentence"][data-index="'+i+'"]').first().click();
    assert.ok(await page.locator('.german .subject').count()>0);
  }
  await page.locator('[data-act="settings"]').click();
  await page.screenshot({path:path.join(output,'candidate-settings.png'),fullPage:true});
  assert.deepEqual(errors,[]);

  const items=vocabulary(recovered);
  const report={backupSha256:digest(bytes),articles:recovered.articles.length,vocabulary:items.length,examples:items.reduce((n,w)=>n+w.examples.length,0),stateHash:digest(raw),
    unchangedOnUpgrade:true,startupWrites:0,settingsAndProgressPreserved:true,backupExportRoundTrip:true,restoreAfterModificationAndReload:true,annotatedSentenceRendered:!!article,
    nativeTransport:'mocked Capacitor protocol; not a device test',productionInstalled:false};
  await writeFile(path.join(output,'candidate-verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
