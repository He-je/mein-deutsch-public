import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults,validateStudy,parseFile,importStudy,vocabulary,validateBackup} from '../app/core.mjs';
const sample=JSON.parse(fs.readFileSync(new URL('./fixtures/study.json',import.meta.url)));

test('bundled demonstration article validates independently of the test fixture',()=>{
 const bundled=JSON.parse(fs.readFileSync(new URL('../app/sample.json',import.meta.url)));
 assert.ok(validateStudy(bundled).sentences.length>0);
});
test('complete article and exact colour spans validate',()=>{const d=validateStudy(sample);assert.equal(d.sentences.length,5);for(const s of d.sentences)assert.equal(s.segments.map(x=>x.text).join(''),s.text);});
test('first import registers all items and newest order is independent of alphabet',()=>{const {state}=importStudy(defaults(),sample);assert.equal(state.articles.length,1);const vs=vocabulary(state);assert.equal(vs[0].lemma,'Schritt für Schritt');assert.equal(vs.length,25);assert.ok(vs[0].order>vs.at(-1).order);});
test('duplicate requires explicit update and does not reset review progress',()=>{let s=importStudy(defaults(),sample).state;const key=vocabulary(s)[0].key;s.words[key].known=true;s.words[key].seen=3;assert.equal(importStudy(s,sample).duplicate,true);const u=importStudy(s,sample,true).state;assert.equal(u.articles.length,1);assert.equal(u.words[key].seen,3);assert.equal(u.words[key].known,true);});
test('new article links existing vocabulary and inserts new words above it',()=>{let s=importStudy(defaults(),sample).state;const n=structuredClone(sample);n.id='new-article';n.title='Ein neuer Text';n.sentences[0].vocabulary.push({kind:'noun',lemma:'der Zoo',plural:'die Zoos',meaning:'zoo'});const count=vocabulary(s).length;s=importStudy(s,n).state;assert.equal(vocabulary(s).length,count+1);assert.equal(vocabulary(s)[0].lemma,'der Zoo');assert.equal(vocabulary(s).find(w=>w.lemma==='die Bibliothek').examples.length,2);});
test('different meanings are kept separately',()=>{const n=structuredClone(sample);n.sentences[0].vocabulary.push({kind:'noun',lemma:'der Kurs',plural:'die Kurse',meaning:'exchange rate'});const vs=vocabulary(importStudy(defaults(),n).state);assert.equal(vs.filter(w=>w.lemma==='der Kurs').length,2);});
test('broken segments, empty sentences and unsupported format rejected before mutation',()=>{const a=structuredClone(sample);a.sentences[0].segments[0].text='wrong';assert.throws(()=>validateStudy(a),/exactly match/);assert.throws(()=>validateStudy({...sample,sentences:[]}),/no sentences/);assert.throws(()=>parseFile('not JSON'),/valid JSON/);assert.throws(()=>validateStudy({...sample,version:9}),/version 1/);});
test('backup round trip preserves progress and settings; excludes invalid values',()=>{const s=importStudy(defaults(),sample).state;s.settings.language='de';const key=vocabulary(s)[0].key;s.words[key].known=true;const b=validateBackup({type:'mein-deutsch-backup',version:1,state:s});assert.equal(b.settings.language,'de');assert.equal(b.words[key].known,true);assert.deepEqual(vocabulary(b).map(w=>w.lemma),vocabulary(s).map(w=>w.lemma));});
test('deleted article leaves shared example links only',()=>{let s=importStudy(defaults(),sample).state;const n=structuredClone(sample);n.id='second';n.title='Second';s=importStudy(s,n).state;s.articles=s.articles.filter(a=>a.id==='second');assert.ok(vocabulary(s).every(w=>w.examples.every(e=>e.articleId==='second')));});
test('untrusted text remains data, never accepted as UI HTML',()=>{const a=structuredClone(sample);a.title='<img src=x onerror=alert(1)>';const d=validateStudy(a);assert.equal(d.title,a.title);});

test('audio settings migrate old backups and preserve valid custom choices',()=>{
 const old=defaults();delete old.settings.speechMode;delete old.settings.pitch;old.settings.voice='old-voice';old.settings.rate=.8;
 const restore=state=>validateBackup({type:'mein-deutsch-backup',version:1,state});
 const migrated=restore(old);assert.equal(migrated.settings.speechMode,'system');assert.equal(migrated.settings.pitch,1);assert.equal(migrated.settings.voice,'old-voice');assert.equal(migrated.settings.rate,.8);
 migrated.settings.speechMode='custom';migrated.settings.pitch=1.4;assert.deepEqual(restore(migrated).settings,migrated.settings);
 migrated.settings.speechMode='invalid';migrated.settings.pitch=999;const safe=restore(migrated);assert.equal(safe.settings.speechMode,'system');assert.equal(safe.settings.pitch,1);
});
