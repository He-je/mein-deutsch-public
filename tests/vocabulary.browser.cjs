const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const source=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(source,'build'),{recursive:true});
test('vocabulary card/list browsing preserves word identity, filters and library data',async()=>{
 const {defaults,importStudy,vocabulary}=await import(pathToFileURL(path.join(source,'app/core.mjs')));
 const sample=JSON.parse(fs.readFileSync(path.join(source,'app/sample.json'),'utf8'));
 const library=importStudy(defaults(),sample).state;
 const words=vocabulary(library);const second=structuredClone(sample);second.id='other';second.title='Other article';second.sentences[0].vocabulary.push({kind:'noun',lemma:'der Testeintrag',plural:'die Testeinträge',meaning:'test entry'});
 const updated=importStudy(library,second).state;
 const server=spawn(process.execPath,[path.join(source,'preview.mjs')],{env:{...process.env,PORT:'4185'},windowsHide:true});let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(Error('server exited '+c)));});
  browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(library=>{
   if(!localStorage.getItem('mein-deutsch-v1'))localStorage.setItem('mein-deutsch-v1',JSON.stringify(library));
   window.calls=[];window.Native={load:()=>localStorage.getItem('mein-deutsch-v1'),save:x=>(localStorage.setItem('mein-deutsch-v1',x),''),voices:()=> '[]',stopSpeech:()=>{},speak:(text,...rest)=>(calls.push(text),'')};
  },library);
  await page.goto('http://127.0.0.1:4185');await page.locator('[data-act="nav"][data-tab="vocab"]').click();
  const lemma=()=>page.locator('#vocab-card h2').textContent();
  assert.equal(await lemma(),words[0].lemma);assert.ok(await page.locator('[data-step="-1"]').isDisabled());
  await page.locator('[data-step="1"]').click();assert.equal(await lemma(),words[1].lemma);
  await page.locator('#vocab-card').focus();await page.keyboard.press('ArrowRight');assert.equal(await lemma(),words[2].lemma);
  // Horizontal gesture changes card; vertical gesture does not.
  async function swipe(dx,dy){await page.locator('#vocab-card h2').evaluate((el,[dx,dy])=>{el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,button:0,pointerId:1,clientX:170,clientY:300}));el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerId:1,clientX:170+dx,clientY:300+dy}));},[dx,dy]);}
  await swipe(-90,4);assert.equal(await lemma(),words[3].lemma);await swipe(4,90);assert.equal(await lemma(),words[3].lemma);
  await page.locator('#vocab-position').fill('12');await page.locator('#vocab-position').press('Enter');assert.equal(await lemma(),words[11].lemma);
  await page.locator('[data-mode="list"]').click();const rows=await page.locator('.vocab-row').count();assert.ok(rows>=2&&rows<=6);
  await page.locator('[data-act="vocab-open"]').first().click();const selected=await lemma();
  await page.locator('#vocab-card [data-act="speak"]').click();assert.equal(await page.evaluate(()=>calls.at(-1)),selected);
  await page.locator('[data-act="vocab-detail"]').click();assert.equal(await page.locator('dialog[open]').count(),1);await page.locator('dialog [data-act="close"]').first().click();assert.equal(await lemma(),selected);
  await page.locator('#vocab-card [data-act="example-open"]').click();await page.locator('[data-act="nav"][data-tab="vocab"]').click();assert.equal(await lemma(),selected);
  await page.reload();await page.locator('[data-act="nav"][data-tab="vocab"]').click();assert.equal(await lemma(),selected);
  // New words do not shift the remembered identity.
  await page.evaluate(x=>localStorage.setItem('mein-deutsch-v1',JSON.stringify(x)),updated);await page.reload();await page.locator('[data-act="nav"][data-tab="vocab"]').click();assert.equal(await lemma(),selected);
  await page.locator('#vocab-kind-filter').selectOption('expressions');assert.equal(await page.locator('#vocab-card .tag').textContent(),'Expression');
  await page.locator('#search').fill('nonexistent-zzyy');assert.equal(await page.locator('#vocab-card').count(),0);assert.match(await page.locator('#results').textContent(),/No matching/);
  await page.locator('#search').fill('');await page.locator('#vocab-kind-filter').selectOption('all');await page.locator('#search').fill('Testeintrag');assert.equal(await lemma(),'der Testeintrag');
  await page.locator('#vocab-article-filter').selectOption(sample.id);assert.equal(await page.locator('#vocab-card').count(),0);
  await page.locator('#vocab-article-filter').selectOption('other');assert.equal(await lemma(),'der Testeintrag');
  await page.locator('#search').fill('');await page.locator('#vocab-article-filter').selectOption('');
  // Bounds, persistence, and no library mutations from browsing.
  const before=await lemma();await page.locator('#vocab-position').fill('999999');await page.locator('[data-act="vocab-jump"]').click();assert.equal(await lemma(),before);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('mein-deutsch-v1'))),updated);
  await page.locator('[data-mode="list"]').click();await page.locator('[data-step="1"]').click();const pagePosition=await page.locator('#vocab-position').inputValue();await page.reload();await page.locator('[data-act="nav"][data-tab="vocab"]').click();assert.equal(await page.locator('#vocab-position').inputValue(),pagePosition);
  for(const mode of ['cards','list']){
   await page.locator('[data-mode="'+mode+'"]').click();
   for(const [width,height] of [[390,844],[320,740],[844,390]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(180);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),mode+' horizontal overflow');
    if(height>=740)assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),mode+' page should fit vertically');
   }
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(180);await page.screenshot({path:path.join(source,'build','vocab-'+mode+'.png'),fullPage:true});
  }
  await page.locator('[data-act="settings"]').click();await page.locator('[data-setting="language"]').selectOption('de');await page.locator('[data-setting="textSize"]').selectOption('150');await page.locator('[data-act="nav"][data-tab="vocab"]').click();await page.locator('[data-mode="cards"]').click();await page.setViewportSize({width:320,height:740});assert.ok(await page.getByRole('button',{name:'Karten',exact:true}).isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();server.kill();}
});
