import {material,movement} from '../services/inventory.js';
import {order,duplicates} from '../services/orders.js';
import {exists} from '../services/validation.js';

export function controllers(db,rule) {
  const list=sql=>(_req,res)=>res.json(db.prepare(sql).all());
  const create=action=>(req,res)=>res.status(201).json(action(db,req.body??{}));
  const byMaterial=sql=>(req,res)=>{
    const id=exists(db,'materiales',Number(req.params.id));
    res.json(db.prepare(sql).all(id));
  };
  return {
    materials:list('SELECT * FROM materiales ORDER BY nombre'),
    sites:list('SELECT * FROM ubicaciones ORDER BY id'),
    suppliers:list('SELECT * FROM proveedores ORDER BY nombre'),
    stock:list('SELECT * FROM existencias ORDER BY ubicacion_id,nombre'),
    stockFor:byMaterial('SELECT * FROM existencias WHERE material=? ORDER BY ubicacion_id'),
    history:byMaterial(`SELECT m.fecha,m.tipo,m.cantidad,m.usuario,m.documento,a.nombre AS origen,b.nombre AS destino,
      o.numero AS oc,p.nombre AS proveedor FROM movimientos m
      LEFT JOIN ubicaciones a ON a.id=m.origen LEFT JOIN ubicaciones b ON b.id=m.destino
      LEFT JOIN lineas l ON l.id=m.linea LEFT JOIN ordenes o ON o.id=l.orden
      LEFT JOIN proveedores p ON p.id=o.proveedor WHERE m.material=? ORDER BY m.fecha DESC,m.id DESC`),
    alerts:list('SELECT * FROM alertas ORDER BY stock/reorden,nombre,ubicacion_id'),
    orders:list(`SELECT o.id,o.numero,o.fecha,o.area,p.nombre AS proveedor,l.material,
      m.nombre AS articulo,l.cantidad,l.precio FROM ordenes o JOIN proveedores p ON p.id=o.proveedor
      JOIN lineas l ON l.orden=o.id JOIN materiales m ON m.id=l.material ORDER BY o.fecha DESC,o.id DESC`),
    duplicates:(_req,res)=>res.json({regla:rule,pares:duplicates(db,rule)}),
    addMaterial:create(material),addMovement:(req,res)=>res.status(201).json(movement(db,{...req.body,usuario:req.user.usuario})),addOrder:create(order)
  };
}