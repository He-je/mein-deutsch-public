const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const source=path.resolve(__dirname,'..');
const content={A1:JSON.parse(fs.readFileSync(path.join(source,'app/grammar.json'),'utf8')),...JSON.parse(fs.readFileSync(path.join(source,'app/grammar-levels.json'),'utf8'))};
test('all grammar levels render, retain navigation, and fit narrow and wide readers',async()=>{
 fs.mkdirSync(path.join(source,'build'),{recursive:true});
 const server=spawn(process.execPath,[path.join(source,'preview.mjs')],{env:{...process.env,PORT:'4184'},windowsHide:true});let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(Error('preview exited '+c)));});
  browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  const page=await browser.newPage({viewport:{width:320,height:780}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.calls=[];window.Native={load:()=>'',save:()=>'',voices:()=> '[]',stopSpeech:()=>{},speak:(text,...rest)=>(calls.push(text),'')};});
  await page.goto('http://127.0.0.1:4184');await page.locator('[data-act="nav"][data-tab="grammar"]').click();
  let total=0;
  for(const [level,lessons] of Object.entries(content)){
   assert.equal(lessons.length,level==='A1'?20:12);
   assert.equal(new Set(lessons.map(x=>x.title)).size,lessons.length);
   await page.locator('[data-level="'+level+'"]').click();
   assert.equal(await page.locator('[data-act="topic"]').count(),lessons.length);
   for(let i=0;i<lessons.length;i++){
    await page.locator('[data-topic="'+i+'"]').click();assert.equal(await page.locator('main h1').textContent(),lessons[i].title);
    assert.match(await page.locator('.eyebrow').textContent(),new RegExp('^'+level+' /'));
    assert.ok(await page.locator('.grammar-block').count()>0);
    if(level!=='A1'){
     assert.ok(lessons[i].blocks.filter(b=>b.type==='example').length>=2);
     assert.ok(await page.getByRole('heading',{name:'Watch out',exact:true}).count());
     assert.ok(await page.getByRole('heading',{name:'Try it',exact:true}).count());
     assert.doesNotMatch(await page.locator('main').textContent(),/undefined|\uFFFD|Ã|Â/);
    }
    for(const width of [320,844]){
     await page.setViewportSize({width,height:780});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),level+' '+i+' overflow at '+width);
    }
    if(i===0&&level!=='A1'){
     const example=lessons[i].blocks.find(b=>b.type==='example').de.replace(/<[^>]*>/g,'');
     await page.locator('.grammar-example [data-act="speak"]').first().click();assert.equal(await page.evaluate(()=>calls.at(-1)),example);
     await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(source,'build','grammar-'+level+'.png'),fullPage:true});
    }
    await page.locator('main [data-act="nav"][data-tab="grammar"]').click();
    assert.ok(await page.locator('[data-level="'+level+'"]').evaluate(e=>e.classList.contains('chosen')));total++;
   }
  }
  assert.equal(total,80);
  // Menu translation, large text, and level context survive leaving Grammar.
  await page.locator('[data-act="settings"]').click();await page.locator('[data-setting="language"]').selectOption('de');await page.locator('[data-setting="textSize"]').selectOption('150');
  await page.locator('[data-act="nav"][data-tab="grammar"]').click();await page.locator('[data-level="C2"]').click();await page.locator('[data-topic="0"]').click();await page.setViewportSize({width:320,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('main [data-act="nav"][data-tab="grammar"]').click();assert.ok(await page.locator('[data-level="C2"]').evaluate(e=>e.classList.contains('chosen')));
  // Reader role palette and accessible icon controls.
  await page.locator('[data-act="settings"]').click();await page.locator('[data-setting="textSize"]').selectOption('100');await page.locator('[data-setting="language"]').selectOption('en');
  await page.locator('[data-act="nav"][data-tab="texts"]').first().click();await page.locator('[data-act="sample"]').click();await page.locator('[data-act="commit-study"]').click();await page.locator('.sentence').nth(1).click();
  await page.locator('[data-act="read"]').click();
  assert.ok(await page.getByRole('button',{name:'Pause',exact:true}).isVisible());assert.equal(await page.locator('[data-act="pause"]').textContent(),'');assert.equal(await page.locator('[data-act="pause"] svg').count(),1);
  await page.getByRole('button',{name:'Pause',exact:true}).click();assert.ok(await page.getByRole('button',{name:'Resume',exact:true}).isVisible());assert.equal(await page.locator('[data-act="resume"]').textContent(),'');
  for(const theme of ['light','dark']){
   await page.emulateMedia({colorScheme:theme});await page.setViewportSize({width:390,height:844});
   const colours=await page.locator('.legend').evaluate(el=>Array.from(el.children,e=>getComputedStyle(e).color));assert.equal(new Set(colours).size,4);
   await page.screenshot({path:path.join(source,'build','roles-'+theme+'.png'),fullPage:true});
  }
  assert.deepEqual(errors,[]);console.log('Verified 80 lessons at 320/844px; large text, EN/DE navigation, TTS example text, and icon accessibility.');
 }finally{if(browser)await browser.close();server.kill();}
});
