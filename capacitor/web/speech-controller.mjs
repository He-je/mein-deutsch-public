// A stopped/replaced request must not start after an earlier async call settles.
export function createSpeechController(plugin) {
  let tail=Promise.resolve(),revision=0,listener;
  function ordered(work){const result=tail.then(work);tail=result.catch(()=>{});return result;}
  return {
    async listen(handler){if(listener)await listener.remove();listener=await plugin.addListener('speechEvent',handler);},
    status:()=>ordered(()=>plugin.status()),
    configure(options){revision++;return ordered(()=>plugin.configure(options));},
    speak(options){const current=revision;return ordered(()=>current===revision?plugin.speak(options):{cancelled:true});},
    stop(){revision++;return ordered(()=>plugin.stop());},
    openSettings(){revision++;return ordered(()=>plugin.openSettings());},
    finishApp(){revision++;return ordered(()=>plugin.finishApp());}
  };
}
