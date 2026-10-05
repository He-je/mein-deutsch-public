import {Capacitor, registerPlugin} from './capacitor-core.mjs';

// Android owns the same test-app library.json used in phase 1. There is no
// fallback to an empty browser library when native storage fails.
const android = Capacitor.getPlatform() === 'android';
const plugin = android ? registerPlugin('StudyStorage') : null;
export const platform = {
  async load() {
    return android ? (await plugin.load()).raw : localStorage.getItem('mein-deutsch-captest-v1');
  },
  async save(raw) {
    if (new TextEncoder().encode(raw).byteLength > 25000000) throw Error('Library exceeds 25 MB.');
    if (android) await plugin.save({raw});
    else localStorage.setItem('mein-deutsch-captest-v1', raw);
  },
  async pick() {
    if (!android) return {browser:true};
    return plugin.pick();
  },
  async exportFile(name, type, content) {
    if (new TextEncoder().encode(content).byteLength > 25000000) throw Error('File exceeds 25 MB.');
    if (android) return plugin.exportFile({name,type,content});
    const url=URL.createObjectURL(new Blob([content],{type})), a=document.createElement('a');
    a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    return {downloadStarted:true};
  },
  async copy(text) {
    if (android) await plugin.copy({text});
    else await navigator.clipboard.writeText(text);
  }
};
