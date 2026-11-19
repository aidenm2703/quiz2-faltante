import { atomic } from '../db/database.js';
import { date, exists, label, number } from './validation.js';

export function order(db,b) {
  return atomic(db,()=>{
    const row=db.prepare('INSERT INTO ordenes VALUES (NULL,?,?,?,?) RETURNING *').get(
      label(b.numero,'Número de orden').toUpperCase(),exists(db,'proveedores',b.proveedor),date(b.fecha),label(b.area,'Área')
    );
    const linea=db.prepare('INSERT INTO lineas VALUES (NULL,?,?,?,?) RETURNING *').get(
      row.id,exists(db,'materiales',b.material),number(b.cantidad,'Cantidad',0.001),number(b.precio,'Precio',0.001)
    );
    return {...row,linea};
  });
}

export function duplicates(db,{days,percent}) {
  return db.prepare(`SELECT a.numero AS primera,b.numero AS segunda,a.fecha AS fecha_primera,b.fecha AS fecha_segunda,
    p.nombre AS proveedor,m.nombre AS material,x.cantidad AS cantidad_primera,y.cantidad AS cantidad_segunda
    FROM lineas x JOIN lineas y ON x.material=y.material AND x.orden<y.orden
    JOIN ordenes a ON a.id=x.orden JOIN ordenes b ON b.id=y.orden AND a.proveedor=b.proveedor
    JOIN proveedores p ON p.id=a.proveedor JOIN materiales m ON m.id=x.material
    WHERE ABS(julianday(a.fecha)-julianday(b.fecha))<=?
    AND ABS(x.cantidad-y.cantidad)*100<=MAX(x.cantidad,y.cantidad)*?
    ORDER BY a.fecha,a.numero,b.numero`).all(days,percent);
}