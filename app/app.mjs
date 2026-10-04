import {defaults,parseFile,importStudy,vocabulary,validateBackup} from './core.mjs';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
pause:'<path d="M8 5v14M16 5v14" stroke-width="4"/>',play:'<path d="m8 4 12 8-12 8Z" fill="currentColor" stroke="none"/>',
book:'<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
words:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 8h9M8 12h7M2 7v12"/>',
review:'<path d="M4 6h16M4 12h16M4 18h10"/><path d="m16 18 2 2 4-5"/>',
grammar:'<path d="m2 8 10-5 10 5-10 5Z"/><path d="M6 10v7c3 3 9 3 12 0v-7M22 8v8"/>',
gear:'<path d="m9 3 1-1h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1Z" transform="translate(1 0) scale(.9)"/><circle cx="12" cy="12" r="3"/>',
sound:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
back:'<path d="m14 5-7 7 7 7"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
plus:'<path d="M12 4v16M4 12h16"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
close:'<path d="m6 6 12 12M6 18 18 6"/>',stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',check:'<path d="m4 12 5 5L20 6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>'};
const ico=n=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+(icons[n]||icons.book)+'</svg>';
const translations={
en:{speechMode:'Voice settings',phoneSpeech:'Use phone settings',customSpeech:'Set in this app',pitch:'Pitch',phoneEngine:'Phone default engine',activeVoice:'Selected voice',startingVoice:'Starting speech engine…',voiceFailed:'Speech engine unavailable',phoneHint:'Phone speed and pitch are used. An offline German voice is selected for reading.',customHint:'These choices affect Mein Deutsch only.',offlineFallback:'The default German voice is unavailable offline; another installed German voice is selected.',missingVoice:'The saved voice is unavailable. Using the German default instead.',noGerman:'No offline German voice is available.',previewHint:'Browser preview cannot read Android voice settings.',cards:'Cards',list:'List',page:'Page',goToCard:'Go to card',goToPage:'Go to page',go:'Go',swipe:'Swipe to browse',sourceExample:'Source example',openSource:'Open source text',fullEntry:'Full entry & examples',kindFilter:'Word type',items:'items',texts:'My Texts',vocab:'Vocabulary',review:'Review',grammar:'Grammar',settings:'Settings',import:'Import study file',search:'Search your texts',searchWords:'Search words and expressions',open:'Open text',sentences:'sentences',back:'Back to text',listen:'Listen',listenAll:'Listen to full text',stop:'Stop',pause:'Pause',resume:'Resume',paused:'Paused - resumes from the start of this sentence',translation:'Translation',expressions:'Expressions',words:'Words',all:'All',example:'View example',examples:'Examples',previous:'Previous',next:'Next',newest:'Newest added first',allTexts:'All texts',show:'Show answer',again:'Practice again',known:'I know this',start:'Start review',done:'Session complete',restart:'Review again',emptyWords:'Your vocabulary will appear here',emptyText:'Your reading journey starts here',hint:'Import a study file from ChatGPT, or try the included article.',guide:'How to import from ChatGPT',sample:'Try the sample article',tap:'Tap a sentence to see its explanation.',offline:'Your offline grammar library',topics:'topics',language:'App language',reading:'Reading',size:'Text size',theme:'Theme',colours:'Sentence colours',audio:'Audio',voice:'German voice',speed:'Playback speed',repeat:'Repeat sentence',files:'Study files',backup:'Export backup',restore:'Restore backup',system:'System',light:'Light',dark:'Dark',defaultVoice:'Device default',noun:'Noun',verb:'Verb',other:'Word',expression:'Expression',singular:'Singular',plural:'Plural',past:'Past',perfect:'Perfect',cancel:'Cancel',replace:'Update article',delete:'Delete article',confirm:'Confirm',subject:'Subject',modal:'Modal',object:'Object',verbLabel:'Verb',noMatches:'No matching items',onlyPractice:'Still learning',allItems:'All vocabulary',direction:'Direction',library:'Personal reading library',saved:'Saved on this device',unavailable:'Not included yet',english:'Explanations are in English.',save:'Save',edit:'Edit sentence',copy:'Copy ChatGPT prompt',downloadPrompt:'Save prompt file',downloadSample:'Save sample file',paste:'Paste study JSON',importPaste:'Import pasted JSON',close:'Close',reviewHint:'Reveal the meaning, then decide what needs more practice.',selected:'Selected text',remove:'Remove',noVoices:'No German voice available. Install a German voice in Android text-to-speech settings.',ttsSettings:'Open Android TTS settings'},
de:{speechMode:'Spracheinstellungen',phoneSpeech:'Telefoneinstellungen verwenden',customSpeech:'In dieser App einstellen',pitch:'Tonhöhe',phoneEngine:'Standard-Engine des Telefons',activeVoice:'Ausgewählte Stimme',startingVoice:'Sprachausgabe wird gestartet…',voiceFailed:'Sprachausgabe nicht verfügbar',phoneHint:'Tempo und Tonhöhe folgen dem Telefon. Zum Lesen wird eine deutsche Offline-Stimme gewählt.',customHint:'Diese Auswahl gilt nur für Mein Deutsch.',offlineFallback:'Die deutsche Standardstimme ist offline nicht verfügbar; eine andere installierte Stimme wird verwendet.',missingVoice:'Die gespeicherte Stimme fehlt. Die deutsche Standardstimme wird verwendet.',noGerman:'Keine deutsche Offline-Stimme verfügbar.',previewHint:'Die Browser-Vorschau kann Android-Spracheinstellungen nicht lesen.',cards:'Karten',list:'Liste',page:'Seite',goToCard:'Zur Karte',goToPage:'Zur Seite',go:'Los',swipe:'Zum Blättern wischen',sourceExample:'Originalbeispiel',openSource:'Originaltext öffnen',fullEntry:'Eintrag & Beispiele',kindFilter:'Worttyp',items:'Einträge',texts:'Meine Texte',vocab:'Wortschatz',review:'Wiederholen',grammar:'Grammatik',settings:'Einstellungen',import:'Lerndatei importieren',search:'Texte durchsuchen',searchWords:'Wörter und Ausdrücke suchen',open:'Text öffnen',sentences:'Sätze',back:'Zurück zum Text',listen:'Anhören',listenAll:'Gesamten Text anhören',stop:'Stopp',pause:'Pause',resume:'Weiterhören',paused:'Pausiert - weiter ab Satzanfang',translation:'Übersetzung',expressions:'Ausdrücke',words:'Wörter',all:'Alle',example:'Beispiel ansehen',examples:'Beispiele',previous:'Zurück',next:'Weiter',newest:'Neueste zuerst',allTexts:'Alle Texte',show:'Antwort zeigen',again:'Weiter üben',known:'Das weiß ich',start:'Übung starten',done:'Runde abgeschlossen',restart:'Noch einmal üben',emptyWords:'Hier erscheint dein Wortschatz',emptyText:'Hier beginnt deine Lesereise',hint:'Importiere eine Lerndatei aus ChatGPT oder teste den Beispieltext.',guide:'Aus ChatGPT importieren',sample:'Beispieltext ausprobieren',tap:'Tippe auf einen Satz, um die Erklärung zu sehen.',offline:'Deine Offline-Grammatikbibliothek',topics:'Themen',language:'App-Sprache',reading:'Lesen',size:'Schriftgröße',theme:'Design',colours:'Satzfarben',audio:'Audio',voice:'Deutsche Stimme',speed:'Sprechtempo',repeat:'Satz wiederholen',files:'Lerndateien',backup:'Sicherung exportieren',restore:'Sicherung wiederherstellen',system:'System',light:'Hell',dark:'Dunkel',defaultVoice:'Gerätestandard',noun:'Nomen',verb:'Verb',other:'Wort',expression:'Ausdruck',singular:'Singular',plural:'Plural',past:'Präteritum',perfect:'Perfekt',cancel:'Abbrechen',replace:'Text aktualisieren',delete:'Text löschen',confirm:'Bestätigen',subject:'Subjekt',modal:'Modalverb',object:'Objekt',verbLabel:'Verb',noMatches:'Keine passenden Einträge',onlyPractice:'Noch lernen',allItems:'Gesamter Wortschatz',direction:'Richtung',library:'Persönliche Textsammlung',saved:'Auf diesem Gerät gespeichert',unavailable:'Noch nicht enthalten',english:'Die Erklärungen sind auf Englisch.',save:'Speichern',edit:'Satz bearbeiten',copy:'ChatGPT-Prompt kopieren',downloadPrompt:'Prompt-Datei speichern',downloadSample:'Beispieldatei speichern',paste:'Lern-JSON einfügen',importPaste:'Eingefügte JSON importieren',close:'Schließen',reviewHint:'Zeige die Bedeutung und entscheide, was du weiter üben möchtest.',selected:'Ausgewählter Text',remove:'Entfernen',noVoices:'Keine deutsche Stimme verfügbar. Installiere eine deutsche Stimme in den Android-TTS-Einstellungen.',ttsSettings:'Android-TTS-Einstellungen öffnen'}};
let state=defaults(),route={tab:'texts'},query='',articleFilter='',reviewMode='all',direction='de-en',session=null,grammar={},grammarLevel='A1',sample=null,prompt='',voices=[],speechInfo={},readingSpeech=null,speaking=false,speechToken=0,repeatTimer,speechWatchdog,storageFailed=false,conjugation=1;
try{const raw=window.Native?Native.load():localStorage.getItem('mein-deutsch-v1');if(raw)state=validateBackup({type:'mein-deutsch-backup',version:1,state:JSON.parse(raw)});}catch(e){storageFailed=true;}
const vocabBrowse=(()=>{try{const x=JSON.parse(localStorage.getItem('mein-deutsch-vocab-view')||'{}');return {mode:x.mode==='list'?'list':'cards',key:typeof x.key==='string'?x.key:'',index:Number.isSafeInteger(x.index)&&x.index>=0?x.index:0,query:typeof x.query==='string'?x.query.slice(0,500):'',kind:['all','words','expressions'].includes(x.kind)?x.kind:'all',article:typeof x.article==='string'?x.article:''};}catch{return {mode:'cards',key:'',index:0,query:'',kind:'all',article:''};}})();
function rememberVocabulary(){try{localStorage.setItem('mein-deutsch-vocab-view',JSON.stringify(vocabBrowse));}catch{/* Browsing remains usable when UI storage is unavailable. */}}
const t=k=>translations[state.settings.language][k]||k;
const button=(label,act,cls='',extra='')=>'<button class="'+cls+'" data-act="'+act+'" '+extra+'>'+label+'</button>';
const sound=(text)=>button(ico('sound'),'speak','icon-btn','aria-label="'+esc(t('listen'))+'" data-speech="'+esc(text)+'"');
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('toast-show');setTimeout(()=>$('#toast').classList.remove('toast-show'),4500);}
function save(next=state,recovery=false){try{if(storageFailed&&!recovery)throw Error('Previous data could not be loaded. Restore a valid backup before saving.');const raw=JSON.stringify(next);if(raw.length>25000000)throw Error('Library exceeds 25 MB. Export a backup and remove unused texts.');if(window.Native){const error=Native.save(raw);if(error)throw Error(error);}else localStorage.setItem('mein-deutsch-v1',raw);state=next;storageFailed=false;return true;}catch(e){toast('Could not save: '+e.message);return false;}}
function stop(preserveReading=false){if(!preserveReading)readingSpeech=null;speechToken++;clearTimeout(repeatTimer);clearTimeout(speechWatchdog);speaking=false;if(window.Native){try{Native.stopSpeech();}catch(e){console.warn('Native stop failed',e);}}else window.speechSynthesis?.cancel();updateSpeechUI();}
function go(r){rememberScroll();stop();route=r;query=r.tab==='vocab'?vocabBrowse.query:'';render();window.scrollTo(0,0);if(r.tab==='reader'&&!Number.isInteger(r.sentence))requestAnimationFrame(()=>window.scrollTo(0,state.reading[r.id]?.scroll||0));}
function rememberScroll(){if(route.tab==='reader'&&!Number.isInteger(route.sentence)){state.reading[route.id]={scroll:window.scrollY};save();}}
function applySettings(){const s=state.settings;document.documentElement.lang=s.language;document.documentElement.dataset.theme=s.theme==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):s.theme;document.documentElement.style.fontSize=s.textSize+'%';document.documentElement.classList.toggle('large',s.textSize>=130);}
function shell(body,tab){
 const active=tab==='reader'?'texts':tab;
 $('#app').innerHTML='<div class="layout '+(tab==='vocab'?'vocab-layout':'')+'"><header class="topbar"><div class="brand"><img src="icon.png" alt=""><span>Mein Deutsch</span></div>'+button(ico('gear'),'settings','icon-btn','aria-label="'+esc(t('settings'))+'"')+'</header><main class="'+(tab==='vocab'?'vocab-main':'')+'">'+body+'</main></div><nav class="nav" aria-label="Main navigation">'+[['texts','book'],['vocab','words'],['review','review'],['grammar','grammar']].map(([key,icon])=>button(ico(icon)+'<span>'+t(key)+'</span>','nav',''+(active===key?'active':''),'data-tab="'+key+'" '+(active===key?'aria-current="page"':''))).join('')+'</nav>';
}
function empty(title,desc=''){return '<div class="empty"><div class="symbol">'+ico('book')+'</div><h2>'+esc(title)+'</h2><p class="muted">'+esc(desc)+'</p></div>';}
function searchBox(placeholder){return '<label class="search">'+ico('search')+'<input id="search" type="search" value="'+esc(query)+'" placeholder="'+esc(placeholder)+'" aria-label="'+esc(placeholder)+'"></label>';}
function articleCards(){return state.articles.filter(a=>(a.title+' '+a.sentences.map(s=>s.text).join(' ')).toLowerCase().includes(query.toLowerCase())).map(a=>button('<span class="eyebrow">'+esc(t('selected'))+'</span><h3>'+esc(a.title)+'</h3><small>'+a.sentences.length+' '+t('sentences')+'</small><span class="open">'+t('open')+ico('arrow')+'</span>','article','card article-card','data-id="'+esc(a.id)+'"')).join('')||empty(t('noMatches'));}
function library(){return '<div class="eyebrow">'+t('library')+'</div><div class="split-header"><h1>'+t('texts')+'</h1>'+button(ico('plus')+' '+t('import'),'import','primary inline')+'</div>'+(!state.articles.length?'<div class="banner"><div class="row"><img src="icon.png" alt=""><div><h2>'+t('emptyText')+'</h2></div></div><p>'+t('hint')+'</p><div class="toolbar">'+button(t('sample'),'sample','primary')+button(t('guide'),'guide')+'</div></div>':'')+searchBox(t('search'))+'<div class="cards library" id="results">'+(state.articles.length?articleCards():'')+'</div><p>'+button(t('guide'),'guide','back')+'</p>';}
function audio(text,all=false){return '<div class="audio" data-reader-mode="'+(all?'all':'sentence')+'">'+button(ico('sound')+' '+t(all?'listenAll':'listen'),'read','inline','data-all="'+all+'"')+button(ico('pause'),'pause','icon-btn','aria-label="'+esc(t('pause'))+'" title="'+esc(t('pause'))+'" hidden')+button(ico('play'),'resume','icon-btn','aria-label="'+esc(t('resume'))+'" title="'+esc(t('resume'))+'" hidden')+button(ico('stop'),'stop','icon-btn','aria-label="'+t('stop')+'" hidden')+'<span class="muted">'+(state.settings.speechMode==='system'?t('phoneSpeech'):state.settings.rate+'×')+'</span><small class="reading-status" role="status" hidden>'+t('paused')+'</small></div>';}
function updateSpeechUI(){
 const r=readingSpeech;
 document.querySelectorAll('[data-act="stop"]').forEach(b=>b.hidden=!speaking&&!r);
 document.querySelectorAll('[data-reader-mode]').forEach(bar=>{
  const active=!!r&&bar.dataset.readerMode===(r.all?'all':'sentence');
  bar.querySelector('[data-act="pause"]').hidden=!active||r.paused;
  bar.querySelector('[data-act="resume"]').hidden=!active||!r.paused;
  bar.querySelector('.reading-status').hidden=!active||!r.paused;
 });
 document.querySelectorAll('[data-reading-index]').forEach(el=>{
  const active=!!r&&r.articleId===route.id&&Number(el.dataset.readingIndex)===r.items[r.index].index&&(r.started||r.paused);
  el.classList.toggle('reading-active',active);el.classList.toggle('reading-paused',active&&r.paused);
  if(active)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');
 });
}
function startReading(all){
 stop();const article=state.articles.find(a=>a.id===route.id);if(!article)return;
 const items=article.sentences.map((s,index)=>({text:s.text,index})).filter(s=>all||s.index===route.sentence);
 if(!items.length)return;
 readingSpeech={articleId:article.id,items,index:0,all,paused:false,started:false};playReading();
}
function playReading(){
 const r=readingSpeech;if(!r)return;r.paused=false;r.started=false;
 speak(r.items[r.index].text,true,true);updateSpeechUI();
}
function pauseReading(){if(!readingSpeech||readingSpeech.paused)return;readingSpeech.paused=true;stop(true);}
function resumeReading(){if(readingSpeech?.paused)playReading();}
function speechStarted(token){
 if(String(token)!==String(speechToken)||!speaking)return;
 clearTimeout(speechWatchdog);if(readingSpeech){readingSpeech.started=true;updateSpeechUI();}
}
function speechDone(token){
 if(String(token)!==String(speechToken)||!speaking)return;
 clearTimeout(speechWatchdog);speaking=false;
 const r=readingSpeech;
 if(r&&!r.paused){
  if(r.index+1<r.items.length){r.index++;playReading();return;}
  if(!r.all&&state.settings.repeat){repeatTimer=setTimeout(()=>{if(String(token)===String(speechToken)&&readingSpeech===r&&!r.paused)playReading();},700);updateSpeechUI();return;}
  readingSpeech=null;
 }
 updateSpeechUI();
}
function wordCard(w,withExamples=true){return '<article class="card word"><div class="row between"><span class="tag">'+esc(t(w.kind))+'</span>'+sound(w.lemma)+'</div><h3>'+esc(w.lemma)+'</h3><div class="forms">'+(w.plural?t('plural')+': <strong>'+esc(w.plural)+'</strong><br>':'')+(w.past?t('past')+': <strong>'+esc(w.past)+'</strong><br>':'')+(w.perfect?t('perfect')+': <strong>'+esc(w.perfect)+'</strong>':'')+'</div><p class="meaning">'+esc(w.meaning)+'</p>'+(withExamples?button(t('example'),'examples','view','data-key="'+esc(w.key)+'"'):'')+'</article>';}
function details(a,index){
 const s=a.sentences[index];if(!s)return '';
 const original=state.settings.colours&&s.segments.length?s.segments.map(x=>'<span class="'+esc(x.role)+'">'+esc(x.text)+'</span>').join(''):esc(s.text);
 return '<section class="detail"><div class="row between">'+button(ico('back')+t('back'),'back-text','back')+'<small>'+(index+1)+' / '+a.sentences.length+'</small></div>'+audio(s.text)+'<div class="german" data-reading-index="'+index+'" lang="de">'+original+'</div>'+(state.settings.colours?'<div class="legend">'+['subject','modal','object','verb'].map(k=>'<span class="'+k+'">'+t(k==='verb'?'verbLabel':k)+'</span>').join('')+'</div>':'')+'<h2>'+t('translation')+'</h2><div class="translation">'+esc(s.translation)+'</div>'+(s.expressions.length?'<h2>'+t('expressions')+'</h2><div class="cards">'+s.expressions.map(e=>wordCard(e,false)).join('')+'</div>':'')+(s.vocabulary.length?'<h2>'+t('vocab')+'</h2><div class="cards">'+s.vocabulary.map(v=>wordCard(v,false)).join('')+'</div>':'')+'<div class="row between" style="margin-top:20px">'+button(t('previous'),'sentence','', 'data-index="'+(index-1)+'" '+(index===0?'disabled':''))+button(t('next'),'sentence','secondary','data-index="'+(index+1)+'" '+(index===a.sentences.length-1?'disabled':''))+'</div>'+button(t('edit'),'edit','back')+'</section>';
}
function reader(){
 const a=state.articles.find(a=>a.id===route.id);if(!a){route={tab:'texts'};return library();}
 const selected=Number.isInteger(route.sentence)?route.sentence:null;
 const wide=matchMedia('(orientation:landscape) and (min-width:740px)').matches&&state.settings.textSize<130;
 if(selected!==null&&!wide)return details(a,selected);
 return '<div class="row between">'+button(ico('back')+t('texts'),'nav','back','data-tab="texts"')+button(ico('trash'),'delete','icon-btn danger','aria-label="'+t('delete')+'"')+'</div><h1>'+esc(a.title)+'</h1>'+(a.source?'<p class="source">'+esc(a.source)+'</p>':'')+'<div class="reader-grid '+(selected!==null?'has-detail':'')+'"><section>'+audio(a.sentences.map(s=>s.text).join(' '),true)+'<p class="muted">'+t('tap')+'</p><div class="article-body" lang="de">'+a.sentences.map((s,i)=>button(esc(s.text),'sentence','sentence '+(i===selected?'selected':''),'data-index="'+i+'" data-reading-index="'+i+'"')).join('')+'</div></section>'+(selected!==null?details(a,selected):'')+'</div>';
}
function articleOptions(){return '<option value="">'+t('allTexts')+'</option>'+state.articles.map(a=>'<option value="'+esc(a.id)+'" '+(articleFilter===a.id?'selected':'')+'>'+esc(a.title)+'</option>').join('');}
function filteredWords(){return vocabulary(state).filter(w=>(vocabBrowse.kind==='all'||vocabBrowse.kind==='words'&&w.kind!=='expression'||vocabBrowse.kind==='expressions'&&w.kind==='expression')&&(!vocabBrowse.article||w.examples.some(e=>e.articleId===vocabBrowse.article))&&(w.lemma+' '+w.meaning).toLowerCase().includes(vocabBrowse.query.toLowerCase()));}
function vocabPage(){
 if(vocabBrowse.article&&!state.articles.some(a=>a.id===vocabBrowse.article)){vocabBrowse.article='';vocabBrowse.key='';vocabBrowse.index=0;}
 query=vocabBrowse.query;
 return '<h1>'+t('vocab')+'</h1>'+searchBox(t('searchWords'))+'<div class="vocab-modes" role="group" aria-label="'+t('vocab')+'">'+['cards','list'].map(mode=>button(t(mode),'vocab-mode',vocabBrowse.mode===mode?'chosen':'','data-mode="'+mode+'" aria-pressed="'+(vocabBrowse.mode===mode)+'"')).join('')+'</div><div class="vocab-filters"><select id="vocab-article-filter" aria-label="'+t('allTexts')+'"><option value="">'+t('allTexts')+'</option>'+state.articles.map(a=>'<option value="'+esc(a.id)+'" '+(vocabBrowse.article===a.id?'selected':'')+'>'+esc(a.title)+'</option>').join('')+'</select><select id="vocab-kind-filter" aria-label="'+t('kindFilter')+'">'+['all','words','expressions'].map(k=>'<option value="'+k+'" '+(vocabBrowse.kind===k?'selected':'')+'>'+t(k)+'</option>').join('')+'</select></div><div id="results" class="vocab-results">'+wordResults()+'</div>';
}
function vocabPageSize(){return Math.max(2,Math.min(6,Math.floor((window.innerHeight-350*state.settings.textSize/100-85)/(58*state.settings.textSize/100))));}
function wordResults(){
 const words=filteredWords();let index=words.findIndex(w=>w.key===vocabBrowse.key);
 if(index<0)index=Math.min(vocabBrowse.index,Math.max(0,words.length-1));
 vocabBrowse.index=index;vocabBrowse.key=words[index]?.key||'';rememberVocabulary();
 if(!words.length)return empty(state.articles.length?t('noMatches'):t('emptyWords'),state.articles.length?'':t('hint'));
 const list=vocabBrowse.mode==='list',size=vocabPageSize(),page=Math.floor(index/size),count=list?Math.ceil(words.length/size):words.length,position=list?page:index;
 const summary='<div class="vocab-summary"><span aria-live="polite">'+(list?words.length+' '+t('items'):(index+1)+' / '+words.length)+'</span><small>'+t('newest')+'</small></div>';
 let body;
 if(list){body='<div class="vocab-list">'+words.slice(page*size,(page+1)*size).map((w,i)=>'<div class="vocab-row">'+button('<span class="tag">'+esc(t(w.kind))+'</span><span class="vocab-row-copy"><strong lang="de">'+esc(w.lemma)+'</strong><small>'+esc(w.meaning)+'</small></span>','vocab-open','vocab-row-open','data-index="'+(page*size+i)+'"')+sound(w.lemma)+'</div>').join('')+'</div>';}
 else{
  const w=words[index],ref=w.examples.find(e=>!vocabBrowse.article||e.articleId===vocabBrowse.article),article=state.articles.find(a=>a.id===ref?.articleId),sentence=article?.sentences.find(x=>x.id===ref?.sentenceId);
  const forms=[w.plural?t('plural')+': '+w.plural:'',w.past?t('past')+': '+w.past:'',w.perfect?t('perfect')+': '+w.perfect:''].filter(Boolean);
  body='<article id="vocab-card" class="card vocab-card" tabindex="0" aria-label="'+esc(w.lemma)+'"><div class="row between"><span class="tag">'+esc(t(w.kind))+'</span>'+sound(w.lemma)+'</div><div class="vocab-card-body"><h2 lang="de">'+esc(w.lemma)+'</h2><p class="vocab-forms">'+forms.map(esc).join('<br>')+'</p><p class="vocab-meaning">'+esc(w.meaning)+'</p>'+(sentence?'<div class="vocab-example"><small>'+t('sourceExample')+'</small><p lang="de">'+esc(sentence.text)+'</p><p class="muted">'+esc(sentence.translation)+'</p>'+button(t('openSource')+' '+ico('arrow'),'example-open','back','data-id="'+esc(article.id)+'" data-sentence-id="'+esc(sentence.id)+'"')+'</div>':'')+'</div>'+button(t('fullEntry'),'vocab-detail','back','data-key="'+esc(w.key)+'"')+'</article>';
 }
 return summary+body+'<div class="vocab-pager">'+button(ico('back'),'vocab-step','icon-btn','data-step="-1" aria-label="'+t('previous')+'" '+(position===0?'disabled':''))+'<span>'+(list?t('page')+' '+(page+1)+' / '+count:t('swipe'))+'</span>'+button(ico('arrow'),'vocab-step','icon-btn','data-step="1" aria-label="'+t('next')+'" '+(position===count-1?'disabled':''))+'</div><div class="vocab-jump"><label for="vocab-position">'+t(list?'goToPage':'goToCard')+'</label><input id="vocab-position" type="number" inputmode="numeric" min="1" max="'+count+'" value="'+(position+1)+'">'+button(t('go'),'vocab-jump','back')+'</div>';
}
function refreshVocabulary(){stop();const focused=document.activeElement;const step=focused?.dataset.act==='vocab-step'?focused.dataset.step:null;$('#results').innerHTML=wordResults();if(step)document.querySelector('[data-act="vocab-step"][data-step="'+step+'"]')?.focus({preventScroll:true});}
function setVocabPosition(index){const words=filteredWords();vocabBrowse.index=Math.max(0,Math.min(words.length-1,index));vocabBrowse.key=words[vocabBrowse.index]?.key||'';refreshVocabulary();}
function stepVocabulary(step){const size=vocabPageSize();setVocabPosition(vocabBrowse.mode==='list'?(Math.floor(vocabBrowse.index/size)+step)*size:vocabBrowse.index+step);}
function filterVocabulary(){vocabBrowse.index=0;vocabBrowse.key='';refreshVocabulary();}
function vocabDetail(key){const w=vocabulary(state).find(w=>w.key===key);if(!w)return;dialog(w.lemma,wordCard(w,false)+w.examples.filter(e=>!vocabBrowse.article||e.articleId===vocabBrowse.article).map(e=>{const a=state.articles.find(a=>a.id===e.articleId),s=a?.sentences.find(s=>s.id===e.sentenceId);return s?'<section class="card"><small>'+esc(a.title)+'</small><p lang="de">'+esc(s.text)+'</p><p>'+esc(s.translation)+'</p>'+sound(s.text)+button(t('openSource'),'example-open','back','data-id="'+esc(a.id)+'" data-sentence-id="'+esc(s.id)+'"')+'</section>':'';}).join(''),button(t('close'),'close'));}
let vocabGesture=null;
document.addEventListener('pointerdown',e=>{if(route.tab!=='vocab'||vocabBrowse.mode!=='cards'||!e.isPrimary||e.button!==0||!e.target.closest('#vocab-card')||e.target.closest('button,input,select,a'))return;vocabGesture={id:e.pointerId,x:e.clientX,y:e.clientY};});
document.addEventListener('pointerup',e=>{const start=vocabGesture;vocabGesture=null;if(!start||start.id!==e.pointerId||route.tab!=='vocab')return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)stepVocabulary(dx<0?1:-1);});
document.addEventListener('pointercancel',()=>{vocabGesture=null;});
document.addEventListener('keydown',e=>{if(route.tab!=='vocab')return;if(e.target.id==='vocab-position'&&e.key==='Enter'){e.preventDefault();document.querySelector('[data-act="vocab-jump"]').click();}else if(e.target.id==='vocab-card'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();stepVocabulary(e.key==='ArrowRight'?1:-1);document.querySelector('#vocab-card')?.focus({preventScroll:true});}});
let vocabResizeTimer;
window.addEventListener('resize',()=>{clearTimeout(vocabResizeTimer);vocabResizeTimer=setTimeout(()=>{if(route.tab==='vocab'&&!$('#modal').open)$('#results').innerHTML=wordResults();},150);});
function reviewPage(){
 let body='<h1>'+t('review')+'</h1>';
 if(!session){const total=vocabulary(state).filter(w=>(!articleFilter||w.examples.some(e=>e.articleId===articleFilter))&&(reviewMode==='all'||!w.known)).length;return body+'<div class="card"><p>'+t('reviewHint')+'</p><label>'+t('allTexts')+'<select class="wide" id="article-filter">'+articleOptions()+'</select></label><div class="chips">'+button(t('allItems'),'review-mode',reviewMode==='all'?'chosen':'','data-mode="all"')+button(t('onlyPractice'),'review-mode',reviewMode==='learning'?'chosen':'','data-mode="learning"')+'</div><label>'+t('direction')+'<select class="wide" id="direction"><option value="de-en" '+(direction==='de-en'?'selected':'')+'>Deutsch → English</option><option value="en-de" '+(direction==='en-de'?'selected':'')+'>English → Deutsch</option></select></label><p class="muted">'+total+' '+t('vocab').toLowerCase()+'</p>'+button(t('start'),'start-review','primary wide',total?'':'disabled')+'</div>';}
 if(session.index>=session.items.length)return body+'<div class="empty"><div class="symbol">'+ico('check')+'</div><h2>'+t('done')+'</h2><p>'+session.items.length+' / '+session.items.length+'</p>'+button(t('restart'),'reset-review','primary')+'</div>';
 const w=session.items[session.index],reverse=direction==='en-de';
 return body+'<div class="row between"><span class="tag">'+(reverse?'English → Deutsch':'Deutsch → English')+'</span><small>'+(session.index+1)+' / '+session.items.length+'</small></div><div class="progress"><div style="width:'+(session.index/session.items.length*100)+'%"></div></div><div class="card review-card"><h2>'+esc(reverse?w.meaning:w.lemma)+'</h2>'+(!reverse?sound(w.lemma):'')+(session.revealed?'<div class="answer"><h3>'+esc(reverse?w.lemma:w.meaning)+'</h3><p class="muted">'+esc([w.plural,w.past,w.perfect].filter(Boolean).join(' · '))+'</p>'+(reverse?sound(w.lemma):'')+'</div>':'')+'</div>'+(!session.revealed?button(t('show'),'reveal','primary wide'):'<div class="row">'+button(t('again'),'grade','', 'data-known="false"')+button(ico('check')+' '+t('known'),'grade','primary inline','data-known="true"')+'</div>')+'<p>'+button(t('example'),'examples','secondary wide','data-key="'+esc(w.key)+'"')+'</p>'+button(t('cancel'),'reset-review','back');
}
function safeGrammar(s){return String(s).replace(/<font color="#087E83">/g,'<span class="verb">').replace(/<\/font>/g,'</span>');}
function grammarBlock(block){
 if(block.type==='table'){
   const hs=block.headers,rows=block.rows;
   if(hs.includes('können')&&hs.includes('möchte')){
     const index=Math.min(conjugation,hs.length-1);
     return '<label class="muted">Verb forms<select class="wide" id="conjugation">'+hs.slice(1).map((x,i)=>'<option value="'+(i+1)+'" '+(index===i+1?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label><table><thead><tr><th>Person</th><th>'+esc(hs[index])+'</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+esc(r[index])+'</td></tr>').join('')+'</tbody></table>';
   }
   if(hs.length>2)return '<div class="table-cards">'+rows.map(r=>'<div class="table-row">'+r.map((c,i)=>'<div class="table-field"><small>'+safeGrammar(hs[i])+'</small><span>'+safeGrammar(c)+'</span></div>').join('')+'</div>').join('')+'</div>';
   return '<table><thead><tr>'+hs.map(x=>'<th>'+safeGrammar(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+safeGrammar(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 }
 if(block.type==='example')return '<div class="grammar-example"><div class="row between"><div class="de" lang="de">'+safeGrammar(block.de)+'</div>'+sound(block.de.replace(/<[^>]*>/g,''))+'</div><div class="en">'+safeGrammar(block.en)+'</div></div>';
 if(block.type==='heading')return '<h2>'+esc(block.text)+'</h2>';
 return '<p>'+safeGrammar(block.text)+'</p>';
}
function grammarPage(){
 const lessons=grammar[grammarLevel]||[];
 if(Number.isInteger(route.topic)){
   const item=lessons[route.topic];if(!item)return '';
   const groups=[];let current=[];
   for(const b of item.blocks){if(b.type==='heading'&&current.length){groups.push(current);current=[];}current.push(b);}if(current.length)groups.push(current);
   let intro='';
   if(groups[0]?.[0]?.type==='text')intro=grammarBlock(groups[0].shift());
   if(!groups[0]?.length)groups.shift();
   if(groups[0]?.some(x=>x.type==='table')&&groups[1]?.[0]?.text==='The rule'){const first=groups.shift();groups.splice(1,0,first);}
   return button(ico('back')+grammarLevel+' '+t('grammar'),'nav','back','data-tab="grammar"')+'<div class="eyebrow">'+grammarLevel+' / '+String(route.topic+1).padStart(2,'0')+'</div><h1>'+esc(item.title)+'</h1><div class="intro">'+intro+'</div><div class="grammar-grid">'+groups.map(g=>'<section class="card grammar-block">'+g.map(grammarBlock).join('')+'</section>').join('')+'</div>';
 }
 return '<h1>'+t('grammar')+'</h1><p class="muted">'+t('offline')+'</p><div class="levels">'+['A1','A2','B1','B2','C1','C2'].map(x=>button(x,'level',x===grammarLevel?'chosen':'','data-level="'+x+'"')).join('')+'</div><h2>'+grammarLevel+' · '+lessons.length+' '+t('topics')+'</h2><div class="cards">'+lessons.map((g,i)=>button('<span class="n">'+String(i+1).padStart(2,'0')+'</span><span class="label">'+esc(g.title)+'</span>'+ico('arrow'),'topic','topic','data-topic="'+i+'"')).join('')+'</div><p class="muted">Original review lessons. Levels are approximate study groupings, not a complete exam syllabus.</p>';
}
function setting(label,control){return '<div class="setting"><label>'+label+'</label>'+control+'</div>';}
function selectSetting(key,opts){return '<select data-setting="'+key+'" aria-label="'+t(({language:'language',textSize:'size',rate:'speed',voice:'voice',theme:'theme',speechMode:'speechMode',pitch:'pitch'})[key]||key)+'" '+(['voice','rate','pitch'].includes(key)&&state.settings.speechMode==='system'?'disabled':'')+'>'+opts.map(([v,l])=>'<option value="'+esc(v)+'" '+(String(state.settings[key])===String(v)?'selected':'')+'>'+esc(l)+'</option>').join('')+'</select>';}
function toggle(key){return '<input class="switch" type="checkbox" data-setting="'+key+'" aria-label="'+t(key)+'" '+(state.settings[key]?'checked':'')+'>';}
function speechInfoView(){
 if(!window.Native)return '<small>'+t('previewHint')+'</small>';
 if(!speechInfo.ready)return '<small>'+t(speechInfo.failed?'voiceFailed':'startingVoice')+'</small>';
 return '<small>'+t('phoneEngine')+'</small><p>'+esc(speechInfo.engine||'—')+'</p><small>'+t('activeVoice')+'</small><p>'+esc(speechInfo.voice||t('noGerman'))+(speechInfo.locale?' · '+esc(speechInfo.locale):'')+'</p>'+(speechInfo.notice?'<p class="muted">'+esc(t(speechInfo.notice))+'</p>':'');
}
function configureSpeech(){
 if(window.Native?.configureSpeech){speechInfo={ready:false};Native.configureSpeech(state.settings.speechMode,String(state.settings.voice||''),Number(state.settings.rate),Number(state.settings.pitch));}
}
function settingsPage(){return button(ico('back'),'nav','back','data-tab="texts" aria-label="'+t('texts')+'"')+'<h1>'+t('settings')+'</h1><section class="card settings-group"><h2>Language / Sprache</h2>'+setting(t('language'),selectSetting('language',[['en','English'],['de','Deutsch']]))+'<small>'+t('english')+'</small></section><section class="card settings-group"><h2>'+t('reading')+'</h2>'+setting(t('size'),selectSetting('textSize',[90,100,110,120,130,150].map(n=>[n,n+'%'])))+setting(t('theme'),selectSetting('theme',['system','light','dark'].map(s=>[s,t(s)])))+setting(t('colours'),toggle('colours'))+'</section><section class="card settings-group"><h2>'+t('audio')+'</h2>'+setting(t('speechMode'),selectSetting('speechMode',[['system',t('phoneSpeech')],['custom',t('customSpeech')]]))+'<p class="muted speech-hint">'+t(state.settings.speechMode==='system'?'phoneHint':'customHint')+'</p>'+setting(t('voice'),selectSetting('voice',[['',t('defaultVoice')],...voices.map(v=>[v.id,v.label])]))+setting(t('speed'),selectSetting('rate',[.6,.8,1,1.2].map(x=>[x,x+'×'])))+setting(t('pitch'),selectSetting('pitch',[.6,.8,1,1.2,1.4].map(x=>[x,x+'×'])))+'<div id="speech-info" class="speech-info" role="status">'+speechInfoView()+'</div>'+setting(t('repeat'),toggle('repeat'))+(window.Native?button(t('ttsSettings'),'tts-settings','back'):'')+button(state.settings.language==='de'?'Stimme testen':'Test voice','speak','back','data-speech="Hallo! Willkommen bei Mein Deutsch." data-all="true" '+(window.Native?.speechInfo&&!speechInfo.ready?'disabled':''))+'<small class="wide">Device speech · No AI API</small></section><section class="card settings-group"><h2>'+t('files')+'</h2><div class="cards">'+button(t('import'),'import')+button(t('guide'),'guide')+button(t('backup'),'backup')+button(t('restore'),'restore')+'</div></section><p class="muted">Mein Deutsch 1.0.6 · '+t('saved')+'</p>';}
function guidePage(){const de=state.settings.language==='de';return button(ico('back')+t('texts'),'nav','back','data-tab="texts"')+'<h1>'+t('guide')+'</h1><div class="card">'+[
 [de?'Bild in ChatGPT hochladen':'Upload your article image to ChatGPT',de?'Nutze dein bestehendes ChatGPT-Konto.':'Use your existing ChatGPT account.'],
 [de?'Den App-Prompt einfügen':'Paste the app prompt',de?'Kopiere den Prompt unten und füge ihn mit dem Bild ein.':'Copy the prompt below and send it with your article image. It requests the exact study-file format.'],
 [de?'Die JSON-Datei herunterladen':'Download the JSON file',de?'Bitte um eine herunterladbare .json-Datei. Kein PDF.':'Ask ChatGPT for a downloadable .json file. If it only shows code, copy the JSON and use Paste study JSON below.'],
 [de?'In Mein Deutsch importieren':'Import into Mein Deutsch',de?'Wähle Lerndatei importieren und dann die heruntergeladene Datei.':'Tap Import study file and select the downloaded file. Review the title before adding it.']].map(([a,b],i)=>'<div class="help-step"><span class="number">'+(i+1)+'</span><div><h3>'+a+'</h3><p class="muted">'+b+'</p></div></div>').join('')+'<div class="cards">'+button(t('copy'),'copy-prompt','primary')+button(t('downloadPrompt'),'save-prompt')+button(t('downloadSample'),'save-sample')+button(t('import'),'import','secondary')+'</div></div><h2>'+t('paste')+'</h2><textarea id="paste-json" aria-label="'+t('paste')+'" placeholder="Paste JSON here"></textarea><p>'+button(t('importPaste'),'paste-import','secondary wide')+'</p><small>Translations and grammar labels are AI-generated study notes. You can correct a sentence from its detail screen. Grammar lessons are bundled separately.</small>';}
function render(){applySettings();const tab=route.tab;let body=tab==='texts'?library():tab==='reader'?reader():tab==='vocab'?vocabPage():tab==='review'?'<div class="review-wrap">'+reviewPage()+'</div>':tab==='grammar'?grammarPage():tab==='settings'?settingsPage():guidePage();shell(body,tab);updateSpeechUI();}
function dialog(title,body,actions){stop();$('#modal').innerHTML=button(ico('close'),'close','icon-btn close','aria-label="'+t('close')+'"')+'<h2>'+esc(title)+'</h2>'+body+'<div class="toolbar" style="margin-top:20px">'+actions+'</div>';$('#modal').showModal();}
let pending=null;
function receiveFile(raw){
 try{const result=parseFile(raw);pending=result;
 if(result.backup){dialog(t('restore'),'<p>This replaces the library and settings on this device with '+result.backup.articles.length+' texts from the backup. Export your current backup first if needed.</p>',button(t('cancel'),'close')+button(t('restore'),'commit-backup','primary'));return;}
 const a=result.study,dup=importStudy(state,a);
 dialog(dup.duplicate?t('replace'):t('import'),'<h3>'+esc(a.title)+'</h3><p>'+a.sentences.length+' '+t('sentences')+'</p>'+(dup.duplicate?'<p>This text already exists. Updating keeps review history for unchanged words and meanings.</p>':'<p>The text, vocabulary and expressions will be saved on this device.</p>'),button(t('cancel'),'close')+button(dup.duplicate?t('replace'):t('import'),'commit-study','primary'));
 }catch(e){dialog('Import needs attention','<p>'+esc(e.message)+'</p><p>'+button(t('guide'),'guide','back')+'</p>',button(t('close'),'close'));}
}
function download(name,type,content){if(window.Native){Native.exportFile(name,type,content);return;}const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function fetchVoices(){if(window.Native){try{voices=JSON.parse(Native.voices());if(Native.speechInfo)speechInfo=JSON.parse(Native.speechInfo());}catch{voices=[];}}else voices=(window.speechSynthesis?.getVoices()||[]).filter(v=>v.lang.toLowerCase().startsWith('de')).map(v=>({id:v.voiceURI,label:v.name}));}
function speechFailure(message){
 stop();
 dialog(state.settings.language==='de'?'Sprachausgabe':'Speech playback','<p>'+esc(message==='NO_GERMAN'?t('noVoices'):message)+'</p>',button(t('close'),'close')+(window.Native?button(t('ttsSettings'),'tts-settings'):''));
}
function speak(text,all=false,preserveReading=false){
 stop(preserveReading);const token=speechToken;speaking=true;
 if(window.Native){
  try{
   const err=Native.speak(String(text||''),Number(state.settings.rate),String(state.settings.voice||''),Boolean(state.settings.repeat&&!all),String(token));
   if(err){speechFailure(String(err));return;}
   document.querySelectorAll('[data-act="stop"]').forEach(b=>b.hidden=false);
   if(!preserveReading)toast(state.settings.language==='de'?'Sprachausgabe wird gestartet…':'Starting speech…');
   speechWatchdog=setTimeout(()=>{if(token===speechToken&&speaking){stop();speechFailure('Android did not start playback within 15 seconds. Check the selected offline German voice and try again.');}},15000);
  }catch(e){speechFailure('App speech connection failed: '+e.message);}
  return;
 }
 if(!window.speechSynthesis){speechFailure('Speech is unavailable in this browser. Use the Android app.');return;}
 fetchVoices();if(!voices.length){speechFailure(t('noVoices'));return;}
 const parts=preserveReading?[text]:(text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text]);let i=0;
 function run(){if(token!==speechToken)return;const u=new SpeechSynthesisUtterance(parts[i]);u.lang='de-DE';if(state.settings.speechMode==='custom'){u.rate=state.settings.rate;u.pitch=state.settings.pitch;}u.voice=(state.settings.speechMode==='custom'?speechSynthesis.getVoices().find(v=>v.voiceURI===state.settings.voice):null)||speechSynthesis.getVoices().find(v=>v.lang.startsWith('de'))||null;u.onstart=()=>speechStarted(token);u.onend=()=>{if(token!==speechToken)return;i++;if(i<parts.length)run();else if(state.settings.repeat&&!all){i=0;repeatTimer=setTimeout(run,700);}else speechDone(token);};u.onerror=()=>{if(token===speechToken)speechFailure('Speech could not be played. Check your German voice.');};speechSynthesis.speak(u);}run();document.querySelectorAll('[data-act="stop"]').forEach(b=>b.hidden=false);
}
function examples(key){const w=vocabulary(state).find(w=>w.key===key);if(!w)return;dialog(w.lemma,w.examples.map(e=>{const a=state.articles.find(a=>a.id===e.articleId),s=a?.sentences.find(s=>s.id===e.sentenceId);return s?'<div class="card" style="margin:10px 0"><small>'+esc(a.title)+'</small><p lang="de">'+esc(s.text)+'</p>'+sound(s.text)+button(t('open'),'example-open','back','data-id="'+esc(a.id)+'" data-sentence-id="'+esc(s.id)+'"')+'</div>':'';}).join(''),button(t('close'),'close'));}
document.addEventListener('click',async ev=>{
 const b=ev.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;
 if(a==='nav'){if(route.tab==='review')session=null;go({tab:b.dataset.tab});}
 else if(a==='settings'){fetchVoices();go({tab:'settings'});}
 else if(a==='guide'){$('#modal').close();go({tab:'guide'});}
 else if(a==='article')go({tab:'reader',id:b.dataset.id});
 else if(a==='sentence'){rememberScroll();stop();route.sentence=Number(b.dataset.index);render();if(!matchMedia('(orientation:landscape) and (min-width:740px)').matches)window.scrollTo(0,0);}
 else if(a==='back-text'){go({tab:'reader',id:route.id});}
 else if(a==='topic')go({tab:'grammar',topic:Number(b.dataset.topic)});
 else if(a==='level'){if(grammar[b.dataset.level]){grammarLevel=b.dataset.level;go({tab:'grammar'});}}
 else if(a==='vocab-mode'){stop();vocabBrowse.mode=b.dataset.mode==='list'?'list':'cards';rememberVocabulary();render();}
 else if(a==='vocab-step')stepVocabulary(Number(b.dataset.step));
 else if(a==='vocab-open'){vocabBrowse.mode='cards';setVocabPosition(Number(b.dataset.index));render();}
 else if(a==='vocab-jump'){const input=$('#vocab-position'),n=Number(input.value);if(Number.isInteger(n)&&n>=1&&n<=Number(input.max))setVocabPosition((n-1)*(vocabBrowse.mode==='list'?vocabPageSize():1));else input.reportValidity();}
 else if(a==='vocab-detail')vocabDetail(b.dataset.key);
 else if(a==='examples')examples(b.dataset.key);
 else if(a==='example-open'){const art=state.articles.find(x=>x.id===b.dataset.id);$('#modal').close();go({tab:'reader',id:art.id,sentence:art.sentences.findIndex(s=>s.id===b.dataset.sentenceId)});}
 else if(a==='read')startReading(b.dataset.all==='true');
 else if(a==='pause')pauseReading();
 else if(a==='resume')resumeReading();
 else if(a==='speak')speak(b.dataset.speech,b.dataset.all==='true');
 else if(a==='stop')stop();
 else if(a==='tts-settings'&&window.Native)Native.openTtsSettings();
 else if(a==='import'||a==='restore'){stop();if(window.Native)Native.importFile();else{$('#file').value='';$('#file').click();}}
 else if(a==='sample')receiveFile(JSON.stringify(sample));
 else if(a==='paste-import')receiveFile($('#paste-json').value);
 else if(a==='close')$('#modal').close();
 else if(a==='commit-study'){const r=importStudy(state,pending.study,true);if(save(r.state)){$('#modal').close();go({tab:'reader',id:r.state.articles.find(x=>x.id===pending.study.id)?.id||r.state.articles.find(x=>x.title===pending.study.title).id});}}
 else if(a==='commit-backup'){if(save(pending.backup,true)){$('#modal').close();session=null;configureSpeech();go({tab:'texts'});toast(t('saved'));}}
 else if(a==='backup')download('Mein-Deutsch-backup.json','application/json',JSON.stringify({type:'mein-deutsch-backup',version:1,state},null,2));
 else if(a==='save-prompt')download('Mein-Deutsch-ChatGPT-Prompt.txt','text/plain',prompt);
 else if(a==='save-sample')download('Mein-Deutsch-sample.json','application/json',JSON.stringify(sample,null,2));
 else if(a==='copy-prompt'){try{if(window.Native)Native.copy(prompt);else await navigator.clipboard.writeText(prompt);toast(state.settings.language==='de'?'Prompt kopiert':'Prompt copied');}catch{download('Mein-Deutsch-ChatGPT-Prompt.txt','text/plain',prompt);}}
 else if(a==='review-mode'){reviewMode=b.dataset.mode;render();}
 else if(a==='start-review'){let items=vocabulary(state).filter(w=>(!articleFilter||w.examples.some(e=>e.articleId===articleFilter))&&(reviewMode==='all'||!w.known));for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}session={items:items.slice(0,20),index:0,revealed:false};render();}
 else if(a==='reveal'){session.revealed=true;render();}
 else if(a==='grade'){const w=session.items[session.index],next=structuredClone(state);next.words[w.key]={...next.words[w.key],known:b.dataset.known==='true',seen:(next.words[w.key]?.seen||0)+1};if(save(next)){stop();session.index++;session.revealed=false;render();}}
 else if(a==='reset-review'){session=null;stop();render();}
 else if(a==='delete'){dialog(t('delete'),'<p>Remove this text and its example links? Words used in other texts remain. Export a backup first if you want to keep a copy.</p>',button(t('cancel'),'close')+button(t('delete'),'confirm-delete','danger'));}
 else if(a==='confirm-delete'){const next=structuredClone(state);next.articles=next.articles.filter(x=>x.id!==route.id);delete next.reading[route.id];if(save(next)){$('#modal').close();go({tab:'texts'});}}
 else if(a==='edit'){const s=state.articles.find(x=>x.id===route.id).sentences[route.sentence];dialog(t('edit'),'<p>Editing the original removes its colour spans until the study file is updated. Vocabulary and expressions are unchanged.</p><label>Deutsch<textarea id="edit-de">'+esc(s.text)+'</textarea></label><label>English<textarea id="edit-en">'+esc(s.translation)+'</textarea></label>',button(t('cancel'),'close')+button(t('save'),'save-edit','primary'));}
 else if(a==='save-edit'){const de=$('#edit-de').value.trim(),en=$('#edit-en').value.trim();if(!de||!en||de.length>20000||en.length>20000){toast('Enter both texts, up to 20,000 characters each.');return;}const next=structuredClone(state),s=next.articles.find(x=>x.id===route.id).sentences[route.sentence];if(s.text!==de)s.segments=[];s.text=de;s.translation=en;if(save(next)){$('#modal').close();render();}}
});
document.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value;if(route.tab==='vocab'){vocabBrowse.query=query;filterVocabulary();}else $('#results').innerHTML=articleCards();}});
document.addEventListener('change',e=>{if(e.target.id==='vocab-article-filter'){vocabBrowse.article=e.target.value;filterVocabulary();}else if(e.target.id==='vocab-kind-filter'){vocabBrowse.kind=e.target.value;filterVocabulary();}else if(e.target.id==='conjugation'){conjugation=Number(e.target.value);render();}else if(e.target.id==='article-filter'){articleFilter=e.target.value;render();}else if(e.target.id==='direction')direction=e.target.value;else if(e.target.dataset.setting){stop();const key=e.target.dataset.setting;const v=e.target.type==='checkbox'?e.target.checked:['textSize','rate','pitch'].includes(key)?Number(e.target.value):e.target.value;const next=structuredClone(state);next.settings[key]=v;if(save(next)){if(['speechMode','voice','rate','pitch'].includes(key))configureSpeech();render();}}});
$('#file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;e.target.value='';if(f.size>25000000){toast('File too large (25 MB maximum).');return;}try{receiveFile(await f.text());}catch(err){toast('Could not read file: '+err.message);}});
window.onNativeImport=text=>receiveFile(text);
window.onNativeError=message=>toast(message);
window.onNativeSpeechStarted=speechStarted;
window.onNativeSpeechError=value=>{const event=JSON.parse(value);if(event.token===String(speechToken))speechFailure(event.message);};
window.onNativeSpeechStopped=token=>{if(token===String(speechToken))stop();};
window.onNativeSpeechInfo=value=>{try{speechInfo=JSON.parse(value);if(route.tab==='settings')render();}catch{}};
window.onNativeVoicesChanged=()=>{fetchVoices();if(route.tab==='settings')render();};
window.onNativeSpeechDone=speechDone;
window.onNativeBack=()=>{if($('#modal').open){$('#modal').close();return;}if(route.tab==='reader'&&Number.isInteger(route.sentence))go({tab:'reader',id:route.id});else if(route.tab==='reader'||route.tab==='settings'||route.tab==='guide')go({tab:'texts'});else if(route.tab==='grammar'&&Number.isInteger(route.topic))go({tab:'grammar'});else if(route.tab!=='texts')go({tab:'texts'});else if(window.Native)Native.finishApp();};
window.addEventListener('pagehide',()=>{rememberScroll();stop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){rememberScroll();stop();}});
matchMedia('(orientation:landscape) and (min-width:740px)').addEventListener('change',()=>{if(route.tab==='reader')render();});
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',applySettings);
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=fetchVoices;
try{[grammar,sample,prompt]=await Promise.all([Promise.all([fetch('grammar.json').then(r=>r.json()),fetch('grammar-levels.json').then(r=>r.json())]).then(([a1,levels])=>({A1:a1,...levels})),fetch('sample.json').then(r=>r.json()),fetch('chatgpt-prompt.txt').then(r=>r.text())]);fetchVoices();configureSpeech();render();if(storageFailed)dialog('Saved data could not be read','<p>Your previous data was not overwritten. Close the app and preserve a backup before importing anything. Restore a valid backup if you have one.</p>',button(t('close'),'close'));}catch(e){$('#app').innerHTML='<main class="layout"><h1>Mein Deutsch</h1><p>App files could not be loaded. Please reinstall the complete package.</p><p>'+esc(e.message)+'</p></main>';}
