import {Capacitor,registerPlugin} from './capacitor-core.mjs';
import {createSpeechController} from './speech-controller.mjs';
const native=Capacitor.getPlatform()==='android';
export const speech={native,...(native?createSpeechController(registerPlugin('StudySpeech')):{})};
