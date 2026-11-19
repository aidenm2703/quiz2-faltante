import express from 'express';
import {routes} from './routes/api.js';

export function app(db,rule) {
  const server=express();
  server.disable('x-powered-by');
  server.use(express.json({limit:'32kb'}));
  server.use('/api',routes(db,rule));
  server.use((_req,res)=>res.status(404).json({error:'Ruta inexistente.'}));
  server.use((error,_req,res,_next)=>{
    if (error.type==='entity.parse.failed') return res.status(400).json({error:'JSON inválido.'});
    if (error.errcode===2067) return res.status(409).json({error:'El código o número ya existe.'});
    if (error.status>=400 && error.status<500) return res.status(error.status).json({error:error.message});
    console.error(error);
    return res.status(500).json({error:'Error interno.'});
  });
  return server;
}