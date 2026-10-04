const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
fs.mkdirSync(path.resolve(__dirname,'../build'),{recursive:true});
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {spawn}=require('node:child_process');
const source=path.resolve(__dirname,'..');
test('reader playback controls and stale callbacks in the native bridge UI',async()=>{
 const server=spawn(process.execPath,[path.join(source,'preview.mjs')],{env:{...process.env,PORT:'4183'},windowsHide:true});
 let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(Error('preview exited '+c)));});
  browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.calls=[];window.saved='';window.Native={load:()=>saved,save:x=>(saved=x,''),voices:()=> '[]',stopSpeech:()=>{},speak:(text,rate,voice,repeat,token)=>{calls.push({text,repeat,token});return '';}};
  });
  await page.goto('http://127.0.0.1:4183');
  await page.locator('[data-act="sample"]').click();
  await page.locator('[data-act="commit-study"]').click();
  if(await page.locator('[data-act="article"]').count())await page.locator('[data-act="article"]').first().click();
  const sentences=await page.locator('.article-body .sentence').allTextContents();assert.ok(sentences.length>1);
  const last=()=>page.evaluate(()=>calls.at(-1));
  const emit=(fn,token)=>page.evaluate(([fn,token])=>window[fn](token),[fn,token]);
  await page.locator('[data-act="read"]').click();let first=await last();assert.equal(first.text,sentences[0]);assert.equal(first.repeat,false);
  await emit('onNativeSpeechStarted',first.token);assert.equal(await page.locator('.reading-active').count(),1);
  await emit('onNativeSpeechDone',first.token);let second=await last();assert.equal(second.text,sentences[1]);
  await emit('onNativeSpeechStarted',second.token);
  await page.locator('[data-act="pause"]').click();assert.equal(await page.locator('.reading-paused').count(),1);assert.ok(await page.locator('[data-act="resume"]').isVisible());
  await emit('onNativeSpeechDone',second.token);assert.equal((await last()).token,second.token);
  await page.locator('[data-act="resume"]').click();let resumed=await last();assert.equal(resumed.text,sentences[1]);assert.notEqual(resumed.token,second.token);
  await emit('onNativeSpeechStarted',resumed.token);
  await emit('onNativeSpeechError',JSON.stringify({token:second.token,message:'stale'}));assert.equal(await page.locator('dialog[open]').count(),0);
  await page.locator('[data-act="stop"]').click();await emit('onNativeSpeechStarted',resumed.token);assert.equal(await page.locator('.reading-active').count(),0);
  await page.locator('.sentence').nth(1).click();
  await page.locator('[data-act="read"]').click();let single=await last();assert.equal(single.text,sentences[1]);
  await emit('onNativeSpeechStarted',single.token);assert.ok(await page.locator('.german').evaluate(el=>el.classList.contains('reading-active')));
  await page.locator('[data-act="pause"]').click();
  await page.screenshot({path:path.join(source,'build','reader-paused.png'),fullPage:true});
  await page.locator('[data-act="resume"]').click();single=await last();await emit('onNativeSpeechDone',single.token);assert.equal(await page.locator('.reading-active').count(),0);
  await page.locator('[data-act="read"]').click();single=await last();await emit('onNativeSpeechStarted',single.token);
  await page.locator('[data-act="speak"]').first().click();assert.equal(await page.locator('.reading-active').count(),0);assert.ok(await page.locator('[data-act="pause"]').isHidden());
  await page.locator('[data-act="back-text"]').click();await page.locator('[data-act="read"]').click();
  for(let i=0;i<sentences.length;i++){const c=await last();assert.equal(c.text,sentences[i]);await emit('onNativeSpeechStarted',c.token);await emit('onNativeSpeechDone',c.token);}
  assert.equal(await page.locator('.reading-active').count(),0);assert.ok(await page.locator('[data-act="stop"]').isHidden());
  // A failed request clears the whole reading session.
  await page.locator('[data-act="read"]').click();let c=await last();await emit('onNativeSpeechError',JSON.stringify({token:c.token,message:'test failure'}));assert.equal(await page.locator('dialog[open]').count(),1);await page.locator('[data-act="close"]').first().click();assert.ok(await page.locator('[data-act="resume"]').isHidden());
  // Repeated sentence can be paused between repetitions and cancelled by navigation.
  await page.locator('[data-act="settings"]').click();
  await page.locator('[data-setting="repeat"]').check();
  await page.locator('[data-act="nav"][data-tab="texts"]').first().click();await page.locator('[data-act="article"]').first().click();await page.locator('.sentence').first().click();
  await page.locator('[data-act="read"]').click();c=await last();await emit('onNativeSpeechStarted',c.token);await emit('onNativeSpeechDone',c.token);await page.locator('[data-act="pause"]').click();
  const count=await page.evaluate(()=>calls.length);await page.waitForTimeout(850);assert.equal(await page.evaluate(()=>calls.length),count);
  await page.locator('[data-act="resume"]').click();c=await last();await emit('onNativeSpeechStarted',c.token);await emit('onNativeSpeechDone',c.token);await page.waitForTimeout(850);assert.ok((await last()).token!==c.token);
  await page.locator('[data-act="back-text"]').click();assert.equal(await page.locator('.reading-active').count(),0);
  // Both reader panels stay in sync after an orientation change.
  await page.setViewportSize({width:844,height:390});await page.locator('.sentence').first().click();await page.locator('[data-reader-mode="sentence"] [data-act="read"]').click();c=await last();await emit('onNativeSpeechStarted',c.token);assert.equal(await page.locator('.reading-active').count(),2);
  await page.locator('[data-reader-mode="sentence"] [data-act="pause"]').click();assert.ok(await page.locator('[data-reader-mode="all"] [data-act="resume"]').isHidden());
  for(const width of [320,390,844]){await page.setViewportSize({width,height:700});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.emulateMedia({colorScheme:'dark'});await page.screenshot({path:path.join(source,'build','reader-paused-dark.png'),fullPage:true});
  await emit('onNativeSpeechStopped',(await last()).token);
  // Start timeout must discard the resumable session and present the error.
  await page.locator('[data-act="stop"]').first().click();
  await page.clock.install();await page.locator('[data-act="read"]').first().click();await page.clock.fastForward(15001);
  assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await page.locator('.reading-active').count(),0);
  assert.deepEqual(errors,[]);
  // Exercise the browser speech fallback independently of Android mocks.
  const fallback=await browser.newPage({viewport:{width:390,height:844}});
  fallback.on('pageerror',e=>errors.push(e.message));
  await fallback.addInitScript(()=>{
   window.utterances=[];
   window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'de-DE',voiceURI:'test',name:'Test'}],cancel:()=>{},speak:u=>utterances.push(u)}});
  });
  await fallback.goto('http://127.0.0.1:4183');await fallback.locator('[data-act="sample"]').click();await fallback.locator('[data-act="commit-study"]').click();
  await fallback.locator('[data-act="read"]').click();await fallback.evaluate(()=>utterances.at(-1).onstart());assert.equal(await fallback.locator('.reading-active').count(),1);
  await fallback.locator('[data-act="pause"]').click();await fallback.evaluate(()=>utterances.at(-1).onend());assert.equal(await fallback.evaluate(()=>utterances.length),1);
  await fallback.locator('[data-act="resume"]').click();assert.equal(await fallback.evaluate(()=>utterances.at(-1).text),sentences[0]);await fallback.evaluate(()=>utterances.at(-1).onstart());await fallback.evaluate(()=>utterances.at(-1).onend());assert.equal(await fallback.evaluate(()=>utterances.at(-1).text),sentences[1]);
  await fallback.locator('[data-act="stop"]').click();assert.equal(await fallback.locator('.reading-active').count(),0);
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();server.kill();}
});
