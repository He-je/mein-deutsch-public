const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const source=path.resolve(__dirname,'..');
test('audio modes, custom settings, default restoration, persistence and native status',async()=>{
 const server=spawn(process.execPath,[path.join(source,'preview.mjs')],{env:{...process.env,PORT:'4186'},windowsHide:true});let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(Error('server exited '+c)));});
  browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.configs=[];window.spoken=[];window.info={ready:true,engine:'Phone engine',voice:'default-de',locale:'de-DE'};
   window.Native={load:()=>localStorage.getItem('mein-deutsch-v1')||'',save:x=>(localStorage.setItem('mein-deutsch-v1',x),''),voices:()=>JSON.stringify([{id:'alternate-de',label:'Alternate German'}]),speechInfo:()=>JSON.stringify(info),stopSpeech:()=>{},
    configureSpeech:(mode,voice,rate,pitch)=>{configs.push({mode,voice,rate,pitch});setTimeout(()=>{info={ready:true,mode,engine:'Phone engine',voice:mode==='custom'&&voice?voice:'default-de',locale:'de-DE'};window.onNativeSpeechInfo?.(JSON.stringify(info));},20);},
    speak:(text,...args)=>(spoken.push({text,config:configs.at(-1)}),window.onNativeSpeechStarted?.(String(args.at(-1))),''),openTtsSettings:()=>{window.openedSettings=true;}
   };
  });
  await page.goto('http://127.0.0.1:4186');await page.locator('[data-act="settings"]').click();
  const setting=k=>page.locator('[data-setting="'+k+'"]');
  await page.waitForFunction(()=>document.querySelector('#speech-info')?.textContent.includes('default-de'));
  assert.equal(await setting('speechMode').inputValue(),'system');for(const k of ['voice','rate','pitch'])assert.ok(await setting(k).isDisabled());
  await setting('speechMode').selectOption('custom');await setting('voice').selectOption('alternate-de');await setting('rate').selectOption('0.8');await setting('pitch').selectOption('1.2');
  await page.getByRole('button',{name:'Test voice',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>spoken.at(-1).config),{mode:'custom',voice:'alternate-de',rate:.8,pitch:1.2});
  await setting('voice').selectOption('');await page.waitForFunction(()=>document.querySelector('#speech-info')?.textContent.includes('default-de'));
  await setting('voice').selectOption('alternate-de');await setting('speechMode').selectOption('system');
  await page.waitForFunction(()=>document.querySelector('#speech-info')?.textContent.includes('default-de'));assert.ok(await setting('pitch').isDisabled());
  await page.reload();await page.locator('[data-act="settings"]').click();assert.equal(await setting('speechMode').inputValue(),'system');await setting('speechMode').selectOption('custom');assert.equal(await setting('pitch').inputValue(),'1.2');assert.equal(await setting('voice').inputValue(),'alternate-de');
  await page.locator('[data-act="tts-settings"]').click();assert.equal(await page.evaluate(()=>openedSettings),true);
  await page.waitForTimeout(80);
  await page.evaluate(()=>onNativeSpeechInfo(JSON.stringify({ready:true,engine:'<img src=x onerror=alert(1)>',voice:'alternate-de',notice:'missingVoice'})));assert.equal(await page.locator('#speech-info img').count(),0);assert.match(await page.locator('#speech-info').textContent(),/saved voice is unavailable/);
  await setting('language').selectOption('de');await setting('textSize').selectOption('150');await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await setting('textSize').selectOption('100');await setting('language').selectOption('en');await page.setViewportSize({width:390,height:844});await page.evaluate(()=>onNativeSpeechInfo(JSON.stringify({ready:true,engine:'Phone engine',voice:'alternate-de',locale:'de-DE'})));
  await page.screenshot({path:path.join(source,'build','audio-settings.png'),fullPage:true});assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();server.kill();}
});
