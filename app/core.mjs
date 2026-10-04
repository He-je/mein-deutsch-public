export const VERSION=1;
const roles=new Set(['plain','subject','verb','modal','object']);
const limit=(s,n=20000)=>typeof s==='string'&&s.length<=n;
const required=(s,n=20000)=>limit(s,n)&&s.trim().length>0;
const fail=m=>{throw new Error(m)};
function str(x,key,max=20000,optional=false){
  if(optional&&(x[key]===undefined||x[key]===null))return '';
  if(!(optional?limit(x[key],max):required(x[key],max)))fail('Invalid '+key+'. Expected text (max '+max+' characters).');
  return x[key].trim();
}
function list(x,max,name){if(!Array.isArray(x)||x.length>max)fail('Invalid '+name+' list.');return x;}
export function validateStudy(input){
  if(!input||input.type!=='mein-deutsch-study'||input.version!==1)fail('Use a Mein Deutsch study file, version 1.');
  const doc={type:input.type,version:1,id:str(input,'id',120),title:str(input,'title',300),language:'de',explanationLanguage:'en',source:str(input,'source',1000,true),sentences:[]};
  if(input.language!=='de'||input.explanationLanguage!=='en')fail('This edition requires German text and English explanations.');
  if(!/^[a-zA-Z0-9_-]+$/.test(doc.id)||['__proto__','constructor','prototype'].includes(doc.id))fail('Article id must use a normal slug of letters, numbers, underscores or hyphens.');
  const ids=new Set();
  for(const s of list(input.sentences,500,'sentences')){
    if(!s||typeof s!=='object')fail('Invalid sentence.');
    const id=str(s,'id',120);if(ids.has(id))fail('Duplicate sentence id: '+id);ids.add(id);
    const row={id,text:str(s,'text'),translation:str(s,'translation'),segments:[],vocabulary:[],expressions:[]};
    for(const seg of list(s.segments||[],150,'segments')){
      if(!seg||!limit(seg.text,20000)||!roles.has(seg.role))fail('Invalid sentence colour segment.');
      row.segments.push({text:seg.text,role:seg.role});
    }
    if(row.segments.length&&row.segments.map(x=>x.text).join('')!==row.text)fail('Colour segments do not exactly match sentence '+id+'. Ask ChatGPT to preserve spaces and punctuation.');
    for(const v of list(s.vocabulary||[],100,'vocabulary')){
      if(!v||!['noun','verb','other'].includes(v.kind))fail('Invalid vocabulary kind.');
      row.vocabulary.push({kind:v.kind,lemma:str(v,'lemma',250),meaning:str(v,'meaning',2000),plural:str(v,'plural',250,true),past:str(v,'past',250,true),perfect:str(v,'perfect',250,true)});
    }
    for(const e of list(s.expressions||[],50,'expressions'))row.expressions.push({kind:'expression',text:str(e,'text',350),lemma:str(e,'text',350),meaning:str(e,'meaning',2000)});
    doc.sentences.push(row);
  }
  if(!doc.sentences.length)fail('The file contains no sentences.');
  return doc;
}
const norm=s=>s.normalize('NFKC').trim().toLocaleLowerCase('de').replace(/\s+/g,' ');
export const wordKey=w=>JSON.stringify([w.kind,norm(w.lemma),norm(w.meaning)]);
export const defaults=()=>({version:1,articles:[],words:{},seq:0,settings:{language:'en',theme:'system',textSize:100,colours:true,speechMode:'system',rate:1,pitch:1,voice:'',repeat:false},reading:{}});
export function vocabulary(state){
  const items=new Map();
  for(const a of state.articles)for(const s of a.sentences)for(const w of [...s.vocabulary,...s.expressions]){
    const key=wordKey(w);
    if(!items.has(key))items.set(key,{...w,key,examples:[],...state.words[key]});
    const item=items.get(key);
    if(!item.examples.some(r=>r.articleId===a.id&&r.sentenceId===s.id))item.examples.push({articleId:a.id,sentenceId:s.id});
  }
  return [...items.values()].sort((a,b)=>(b.order||0)-(a.order||0));
}
export function importStudy(state,doc,replace=false){
  doc=validateStudy(doc);const next=structuredClone(state);
  const i=next.articles.findIndex(a=>a.id===doc.id||norm(a.title)===norm(doc.title)&&a.sentences.map(s=>s.text).join(' ')===doc.sentences.map(s=>s.text).join(' '));
  if(i>=0&&!replace)return {duplicate:true,existing:next.articles[i].title};
  if(i>=0){doc.id=next.articles[i].id;doc.addedOrder=next.articles[i].addedOrder;next.articles[i]=doc;}
  else{doc.addedOrder=++next.seq;next.articles.unshift(doc);}
  for(const s of doc.sentences)for(const w of [...s.vocabulary,...s.expressions]){
    const key=wordKey(w);if(!Object.hasOwn(next.words,key))next.words[key]={order:++next.seq,known:false,seen:0};
  }
  return {state:next,duplicate:false};
}
export function validateBackup(raw){
  if(!raw||raw.type!=='mein-deutsch-backup'||raw.version!==1||!raw.state)fail('This is not a version 1 backup.');
  const clean=defaults(),src=raw.state;
  for(const a of list(src.articles,3000,'articles')){
    const doc=validateStudy(a);if(clean.articles.some(x=>x.id===doc.id))fail('Duplicate article in backup.');
    doc.addedOrder=Number.isSafeInteger(a.addedOrder)?a.addedOrder:++clean.seq;clean.articles.push(doc);
  }
  const entries=vocabulary(clean);
  for(const w of entries){const x=src.words?.[w.key]||{};clean.words[w.key]={order:Number.isSafeInteger(x.order)&&x.order>=0?x.order:++clean.seq,known:x.known===true,seen:Number.isSafeInteger(x.seen)&&x.seen>=0?x.seen:0};}
  clean.seq=Math.max(clean.seq,...clean.articles.map(a=>a.addedOrder),...Object.values(clean.words).map(w=>w.order),0);
  const s=src.settings||{};clean.settings={language:s.language==='de'?'de':'en',theme:['dark','light','system'].includes(s.theme)?s.theme:'system',textSize:[90,100,110,120,130,150].includes(s.textSize)?s.textSize:100,colours:s.colours!==false,speechMode:s.speechMode==='custom'?'custom':'system',pitch:[.6,.8,1,1.2,1.4].includes(s.pitch)?s.pitch:1,rate:[.6,.8,1,1.2].includes(s.rate)?s.rate:1,voice:typeof s.voice==='string'?s.voice.slice(0,200):'',repeat:s.repeat===true};
  for(const a of clean.articles){const v=src.reading?.[a.id];if(v&&Number.isFinite(v.scroll)&&v.scroll>=0)clean.reading[a.id]={scroll:Math.min(v.scroll,1000000)};}
  return clean;
}
export function parseFile(text){
  if(typeof text!=='string'||text.length>25000000)fail('This file is too large (25 MB maximum).');
  let raw;try{raw=JSON.parse(text.replace(/^\uFEFF/,''));}catch{fail('This is not valid JSON. Import the downloaded .json file, not a PDF or screenshot.');}
  return raw.type==='mein-deutsch-backup'?{backup:validateBackup(raw)}:{study:validateStudy(raw)};
}
