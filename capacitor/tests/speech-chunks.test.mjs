import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
test('Java speech chunks preserve text and Unicode within TTS limits',()=>{
  const suffix=process.platform==='win32'?'.exe':'';
  const command=name=>process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin',name+suffix):name+suffix;
  const out=path.join(root,'build/java-test');mkdirSync(out,{recursive:true});
  execFileSync(command('javac'),['-encoding','UTF-8','-d',out,path.join(root,'capacitor/android/app/src/main/java/de/meindeutsch/app/SpeechChunks.java'),path.join(root,'capacitor/tests/java/SpeechChunksTest.java')],{windowsHide:true});
  execFileSync(command('java'),['-cp',out,'de.meindeutsch.app.SpeechChunksTest'],{windowsHide:true});
});
