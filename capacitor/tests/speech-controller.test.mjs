import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSpeechController} from '../web/speech-controller.mjs';
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
test('stop cancels unsent speech while preserving configure/stop command order',async()=>{
  const config=deferred(),calls=[];
  const control=createSpeechController({configure:()=>{calls.push('configure');return config.promise;},speak:o=>{calls.push(o.token);},stop:()=>calls.push('stop')});
  const configuring=control.configure({}),old=control.speak({token:'old'}),stopping=control.stop(),newest=control.speak({token:'new'});
  config.resolve({});await Promise.all([configuring,old,stopping,newest]);
  assert.deepEqual(calls,['configure','stop','new']);assert.deepEqual(await old,{cancelled:true});
});
test('rejected native speech does not poison later stop/retry commands',async()=>{
  const calls=[];let fail=true;
  const control=createSpeechController({speak:()=>{calls.push('speak');if(fail)throw Error('Engine failed');},stop:()=>calls.push('stop')});
  await assert.rejects(control.speak({}),/Engine failed/);await control.stop();fail=false;await control.speak({});
  assert.deepEqual(calls,['speak','stop','speak']);
});
test('opening settings cancels queued playback and replaces listener only after removal',async()=>{
  const delay=deferred(),calls=[];
  const control=createSpeechController({status:()=>delay.promise,speak:()=>calls.push('speak'),openSettings:()=>calls.push('settings'),
    addListener:async()=>{calls.push('listen');return {remove:async()=>calls.push('remove')};}});
  await control.listen(()=>{});await control.listen(()=>{});
  const status=control.status(),play=control.speak({}),settings=control.openSettings();delay.resolve({});
  await Promise.all([status,play,settings]);assert.deepEqual(calls,['listen','remove','listen','settings']);
});
