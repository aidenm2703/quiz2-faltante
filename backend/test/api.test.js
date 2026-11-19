import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {connect} from '../src/db/database.js';
import {app} from '../src/app.js';

test('API, persistencia y reglas de inventario',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'del-valle-'));
  const path=join(dir,'test.sqlite');
  const db=connect(path);
  const server=app(db,{days:3,percent:10}).listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(async()=>{
    await new Promise(resolve=>server.close(resolve));
    db.close();
    rmSync(dir,{recursive:true});
  });
  const base='http://127.0.0.1:'+server.address().port+'/api';
  let cookie='';
  async function call(path,status,data) {
    const headers={Cookie:cookie};
    const response=await fetch(base+path,data===undefined?{headers}:{
      method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(data)
    });
    const token=response.headers.get('set-cookie');
    if (token) cookie=token.split(';')[0];
    const result=await response.json();
    assert.equal(response.status,status,JSON.stringify(result));
    return result;
  }
  await t.test('inicio de sesión y permisos por rol',async()=>{
    await call('/existencias',401);
    await call('/sesion/entrada',401,{usuario:'admin',clave:'incorrecta'});
    await call('/sesion/entrada',200,{usuario:'consulta',clave:'DemoConsulta2026!'});
    assert.equal((await call('/sesion',200)).rol,'consulta');
    await call('/movimientos',403,{});
    await call('/sesion/salida',200,{});
    await call('/existencias',401);
    await call('/sesion/entrada',200,{usuario:'bodega',clave:'DemoBodega2026!'});
    await call('/ordenes',403,{});
    await call('/materiales',403,{});
    await call('/movimientos',400,{});
    await call('/sesion/entrada',200,{usuario:'admin',clave:'DemoAdmin2026!'});
  });
  const getStock=async()=> (await call('/materiales/1/stock',200)).map(row=>row.stock);
  const getAlerts=async()=> (await call('/alertas/reorden',200)).some(row=>row.ubicacion_id===1 && row.material===1);
  const move={tipo:'traslado',material:1,origen:1,destino:2,cantidad:25,fecha:'2026-10-20',usuario:'Ana',documento:'TR-01'};
  await t.test('stock inicial y traslado atómico; igualdad con PR sin alerta',async()=>{
    assert.deepEqual(await getStock(),[190,0]);
    const row=(await call('/materiales/1/stock',200))[0];
    assert.equal(row.seguridad,45);
    assert.equal(row.reorden,165);
    await call('/movimientos',201,move);
    assert.deepEqual(await getStock(),[165,25]);
    assert.equal(await getAlerts(),false);
    await call('/movimientos',409,{...move,cantidad:166});
    await call('/movimientos',400,{...move,destino:1});
    assert.deepEqual(await getStock(),[165,25]);
  });
  await t.test('salida, ajuste, alerta y fecha inválida',async()=>{
    const out={...move,tipo:'salida',destino:null,cantidad:1,documento:'VS-01'};
    await call('/movimientos',400,{...out,fecha:'2026-02-30'});
    await call('/movimientos',201,out);
    assert.equal(await getAlerts(),true);
    assert.ok(db.prepare('SELECT 1 FROM alertas_reorden WHERE material=1 AND ubicacion_id=1').get());
    await call('/movimientos',201,{...move,tipo:'ajuste',origen:null,destino:1,cantidad:1,documento:'AJ-01'});
    assert.equal(await getAlerts(),false);
  });
  await t.test('entrada limitada a saldo de OC y trazabilidad',async()=>{
    const inbound={...move,tipo:'entrada',origen:null,destino:1,cantidad:110,orden:7};
    await call('/movimientos',409,{...inbound,cantidad:111});
    await call('/movimientos',400,{...inbound,orden:4});
    await call('/movimientos',201,inbound);
    assert.deepEqual(await getStock(),[275,25]);
    const history=await call('/materiales/1/historial',200);
    assert.deepEqual([history[0].oc,history[0].proveedor,history[0].usuario],['OC-1061','Proveedor A','admin']);
    const reopened=connect(path);
    try {
      assert.equal(reopened.prepare('SELECT COUNT(*) AS n FROM movimientos').get().n,8);
      assert.equal(reopened.prepare('SELECT 1 FROM alertas_reorden WHERE material=1 AND ubicacion_id=1').get(),undefined);
    } finally {
      reopened.close();
    }
  });
  await t.test('duplicados, límites inclusivos y rollback de OC',async()=>{
    const original=(await call('/ordenes/posibles-duplicados',200)).pares;
    assert.deepEqual(original.map(p=>[p.primera,p.segunda]),[['OC-1041','OC-1042'],['OC-1050','OC-1053']]);
    const oc={numero:'OC-PRUEBA',proveedor:1,material:1,cantidad:180,precio:6300,fecha:'2026-10-05',area:'Obras'};
    await call('/ordenes',404,{...oc,material:999});
    await call('/ordenes',201,oc);
    await call('/ordenes',409,oc);
    const report=(await call('/ordenes/posibles-duplicados',200)).pares;
    assert.equal(report.filter(p=>p.segunda===oc.numero).length,2);
    await call('/ordenes',201,{...oc,numero:'OC-FUERA',cantidad:179.999});
    assert.equal((await call('/ordenes/posibles-duplicados',200)).pares.some(p=>p.primera==='OC-1041'&&p.segunda==='OC-FUERA'),false);
  });
  await t.test('actividad agrupada por fecha y tipo sin mezclar unidades',async()=>{
    const rows=await call('/movimientos/actividad',200);
    assert.deepEqual(rows.filter(r=>r.fecha==='2026-10-16').map(r=>[r.tipo,r.total]),[['ajuste',3],['entrada',1]]);
    assert.equal(rows.find(r=>r.fecha==='2026-10-20' && r.tipo==='traslado').total,1);
  });
  await t.test('validación y registro de materiales',async()=>{
    const b={codigo:'TEST',nombre:'Prueba',unidad:'kg',minimo:2,maximo:10,demanda:1,demanda_max:2,entrega:3};
    await call('/materiales',400,{...b,maximo:1});
    const row=await call('/materiales',201,b);
    await call('/materiales',409,b);
    assert.equal((await call('/materiales/'+row.id+'/stock',200))[0].reorden,6);
  });
});