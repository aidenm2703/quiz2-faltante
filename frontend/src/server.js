import {createServer,request} from 'node:http';
import {readFile} from 'node:fs/promises';

const api=new URL(process.env.API_URL||'http://127.0.0.1:3000');
const files=/^\/(index\.html|styles\.css|src\/(main|controllers\/[a-z]+|routes\/[a-z]+)\.js)$/;
const types={html:'text/html',css:'text/css',js:'text/javascript'};
const port=Number(process.env.WEB_PORT||5173);

createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const proxy=request(new URL(url.pathname+url.search,api),{method:req.method,headers:req.headers},upstream=>{
      res.writeHead(upstream.statusCode,upstream.headers);
      upstream.pipe(res);
    });
    proxy.on('error',()=>{
      if (res.headersSent) return res.destroy();
      res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({error:'La API de inventario no está disponible.'}));
    });
    proxy.setTimeout(10000,()=>proxy.destroy());
    req.pipe(proxy);
    return;
  }
  const path=url.pathname==='/'?'/index.html':url.pathname;
  if (!files.test(path)) return res.writeHead(404).end();
  try {
    const content=await readFile(new URL('..'+path,import.meta.url));
    res.writeHead(200,{'Content-Type':types[path.split('.').at(-1)]+'; charset=utf-8'});
    res.end(content);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port,'127.0.0.1',()=>console.log('Panel en http://127.0.0.1:'+port));