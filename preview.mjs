import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'app');
const port=Number(process.env.PORT||4173);
http.createServer((req,res)=>{
 try{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const ext=path.extname(file);res.setHeader('Content-Type',({'.mjs':'application/javascript','.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.txt':'text/plain'})[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-store');const data=fs.readFileSync(file);res.end(data);}catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Mein Deutsch preview: http://127.0.0.1:'+port));
