import {Router} from 'express';
import {controllers} from '../controllers/api.js';
import {session} from '../controllers/session.js';
import {authenticate,authorize} from '../services/auth.js';

export function routes(db,rule) {
  const router=Router();
  router.use((_req,res,next)=>{
    res.set('Cache-Control','no-store');
    next();
  });
  const c=controllers(db,rule);
  const account=session(db);
  router.post('/sesion/entrada',account.login);
  router.post('/sesion/salida',account.logout);
  router.use(authenticate(db));
  router.get('/sesion',account.current);
  router.get('/materiales',c.materials);
  router.post('/materiales',authorize('admin'),c.addMaterial);
  router.get('/materiales/:id/stock',c.stockFor);
  router.get('/materiales/:id/historial',c.history);
  router.get('/ubicaciones',c.sites);
  router.get('/proveedores',c.suppliers);
  router.get('/existencias',c.stock);
  router.get('/alertas/reorden',c.alerts);
  router.post('/movimientos',authorize('admin','bodega'),c.addMovement);
  router.get('/ordenes',c.orders);
  router.post('/ordenes',authorize('admin'),c.addOrder);
  router.get('/ordenes/posibles-duplicados',c.duplicates);
  return router;
}