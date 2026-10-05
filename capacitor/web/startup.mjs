import {Capacitor,registerPlugin} from './capacitor-core.mjs';
if(Capacitor.isNativePlatform()){
  try{
    const value=await Promise.race([registerPlugin('AppEnvironment').status(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Native services did not respond')),8000))]);
    if(value.package!=='de.meindeutsch.publicapp')throw Error('Unexpected application package');
  }catch(error){document.getElementById('app').textContent='The app could not start safely: '+error.message;throw error;}
}
await import('./app.mjs');
