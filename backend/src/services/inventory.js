import { atomic } from '../db/database.js';
import { check, date, exists, label, number } from './validation.js';

export function material(db,b) {
  const min=number(b.minimo,'Stock mínimo');
  const average=number(b.demanda,'Demanda promedio');
  return db.prepare('INSERT INTO materiales VALUES (NULL,?,?,?,?,?,?,?,?) RETURNING *').get(
    label(b.codigo,'Código').toUpperCase(),label(b.nombre,'Nombre'),label(b.unidad,'Unidad'),
    min,number(b.maximo,'Stock máximo',min),average,number(b.demanda_max,'Demanda máxima',average),
    number(b.entrega,'Días de entrega',1,true)
  );
}

export function movement(db,b) {
  const cantidad=number(b.cantidad,'Cantidad',0.001);
  const fecha=date(b.fecha);
  const usuario=label(b.usuario,'Usuario');
  return atomic(db,()=>{
    const material=exists(db,'materiales',b.material);
    const origen=b.origen==null?null:exists(db,'ubicaciones',b.origen);
    const destino=b.destino==null?null:exists(db,'ubicaciones',b.destino);
    const allowed=new Map([
      ['entrada',origen===null && destino!==null],
      ['salida',origen!==null && destino===null],
      ['traslado',origen!==null && destino!==null && origen!==destino],
      ['ajuste',(origen===null)!==(destino===null)]
    ]);
    check(allowed.get(b.tipo),'Tipo o ubicaciones inválidas para el movimiento.');
    let linea=null;
    let documento;
    if (b.tipo==='entrada') {
      const order=db.prepare(`SELECT l.id,o.numero,ROUND(l.cantidad-COALESCE(SUM(m.cantidad),0),3) AS pendiente
        FROM lineas l JOIN ordenes o ON o.id=l.orden LEFT JOIN movimientos m ON m.linea=l.id
        WHERE o.id=? AND l.material=? AND o.fecha<=? GROUP BY l.id`).get(number(b.orden,'Orden',1,true),material,fecha);
      check(order,'La OC debe incluir el material y tener fecha igual o anterior a la entrada.');
      check(order.pendiente>=cantidad,'La cantidad supera el saldo pendiente de la OC.',409);
      linea=order.id;
      documento=order.numero;
    } else {
      documento=label(b.documento,'Documento de respaldo');
    }
    if (origen!==null) {
      const {stock}=db.prepare('SELECT stock FROM existencias WHERE material=? AND ubicacion_id=?').get(material,origen);
      check(stock>=cantidad,'Existencias insuficientes en la ubicación de origen.',409);
    }
    return db.prepare('INSERT INTO movimientos VALUES (NULL,?,?,?,?,?,?,?,?,?) RETURNING *')
      .get(material,b.tipo,cantidad,fecha,usuario,origen,destino,documento,linea);
  });
}