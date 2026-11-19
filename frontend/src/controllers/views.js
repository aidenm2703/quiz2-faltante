import {api} from './api.js';

const nf=new Intl.NumberFormat('es-CR',{maximumFractionDigits:3});
const crc=new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC'});
const escape=value=>String(value??'—').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const normalize=value=>value.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu,'');
const title=(name,text)=>`<h1>${name}</h1><p>${text}</p>`;
const options=(rows,key='nombre')=>rows.map(r=>`<option value="${r.id}">${escape(r[key])}</option>`).join('');
const select=(label,name,rows,key)=>`<label>${label}<select data-number name="${name}" required><option value="">Selecciona</option>${options(rows,key)}</select></label>`;
const text=(label,name,type='text')=>`<label>${label}<input name="${name}" type="${type}" maxlength="120" required></label>`;
const numeric=(label,name,min=0,step=0.001)=>`<label>${label}<input name="${name}" type="number" min="${min}" max="1000000000" step="${step}" required></label>`;
const form=(endpoint,fields,action)=>`<form data-path="${endpoint}"><div class="fields">${fields}</div><button>${action}</button></form>`;

function table(headers,rows,empty) {
  if (!rows.length) return `<p>${empty}</p>`;
  const cells=(values,tag)=>values.map(value=>`<${tag}${tag==='th'?' scope="col"':''}>${escape(value)}</${tag}>`).join('');
  return `<div class="table"><table><thead><tr>${cells(headers,'th')}</tr></thead>
    <tbody>${rows.map(row=>`<tr>${cells(row,'td')}</tr>`).join('')}</tbody></table></div>`;
}

export async function stock(user) {
  const [rows,sites]=await Promise.all([api('/existencias'),api('/ubicaciones')]);
  return root=>{
    root.innerHTML=title('Existencias','Consulta el saldo y el punto de reorden de cada material por ubicación.')+
      `<div class="panel"><div class="fields"><label>Ubicación<select id="site">${options(sites)}</select></label><label>Buscar material<input id="search" type="search" placeholder="Código o nombre"></label>
      <label>Estado<select id="stock-state"><option value="all">Todos</option><option value="reorder">Reponer</option>
      <option value="healthy">Disponible</option></select></label></div><p id="stock-count" role="status"></p><div id="stock"></div></div>
      <details class="panel"><summary>Registrar material</summary>${form('/materiales',
        text('Código','codigo')+text('Nombre','nombre')+text('Unidad','unidad')+numeric('Stock mínimo','minimo')+
        numeric('Stock máximo','maximo')+numeric('Demanda diaria promedio','demanda')+
        numeric('Demanda diaria máxima','demanda_max')+numeric('Tiempo de entrega (días)','entrega',1,1),'Guardar material')}</details>`;
    if (user.rol!=='admin') root.querySelector('details').remove();
    const site=root.querySelector('#site');
    const search=root.querySelector('#search');
    const state=root.querySelector('#stock-state');
    const count=root.querySelector('#stock-count');
    const render=()=>{
      const query=normalize(search.value.trim());
      const visible=rows.filter(row=>{
        const reorder=row.stock<row.reorden;
        return row.ubicacion_id===Number(site.value) &&
          normalize(row.codigo+' '+row.nombre).includes(query) &&
          (state.value==='all' || reorder===(state.value==='reorder'));
      });
      count.textContent=nf.format(visible.length)+' de '+nf.format(rows.filter(row=>row.ubicacion_id===Number(site.value)).length)+' materiales';
      root.querySelector('#stock').innerHTML=table(['Código','Material','Saldo','Mín.','Máx.','Seguridad','Reorden','Estado'],
        visible.map(r=>[r.codigo,r.nombre,nf.format(r.stock)+' '+r.unidad,
          ...[r.minimo,r.maximo,r.seguridad,r.reorden].map(x=>nf.format(x)),r.stock<r.reorden?'Reponer':'Disponible']),
        'No se encontraron materiales.');
    };
    site.addEventListener('change',render);
    search.addEventListener('input',render);
    state.addEventListener('change',render);
    render();
  };
}

export async function movements(user) {
  const [materials,sites,orders]=await Promise.all([api('/materiales'),api('/ubicaciones'),api('/ordenes')]);
  return root=>{
    root.innerHTML=title('Movimientos','Registra cambios de stock y consulta el historial y las órdenes de origen.')+
      `<section class="panel"><h2>Registrar movimiento</h2>${form('/movimientos',
        '<label>Tipo<select name="tipo"><option value="entrada">Entrada</option><option value="salida">Salida</option>'+
        '<option value="traslado">Traslado</option><option value="ajuste">Ajuste</option></select></label>'+
        select('Material','material',materials)+numeric('Cantidad','cantidad',0.001)+text('Fecha','fecha','date')+
        select('Origen','origen',sites)+select('Destino','destino',sites)+
        select('Orden de compra','orden',orders,'numero')+text('Documento de respaldo','documento'),'Guardar movimiento')}
        <p id="adjust-help" hidden>Para sumar stock, indica solo el destino. Para restar stock, indica solo el origen.</p></section>
      <section class="panel"><h2>Historial por material</h2><div class="filter" id="history-filter">${select('Material','filtro',materials)}</div>
      <div id="history" aria-live="polite"><p>Selecciona un material para ver su historial.</p></div></section>`;
    const movementForm=root.querySelector('form');
    if (user.rol==='consulta') movementForm.closest('section').remove();
    else {
      const {elements}=movementForm;
      const adjustHelp=root.querySelector('#adjust-help');
      function updateFields() {
        const type=elements.tipo.value;
        adjustHelp.hidden=type!=='ajuste';
        for (const [name,visible] of [['origen',type!=='entrada'],['destino',type!=='salida'],['orden',type==='entrada'],['documento',type!=='entrada']]) {
          const input=elements[name];
          input.closest('label').hidden=!visible;
          input.disabled=!visible;
          input.required=visible && !(type==='ajuste' && ['origen','destino'].includes(name));
        }
        elements.orden.innerHTML='<option value="">Selecciona</option>'+
          options(orders.filter(o=>String(o.material)===elements.material.value),'numero');
      }
      elements.tipo.addEventListener('change',updateFields);
      elements.material.addEventListener('change',updateFields);
      updateFields();
    }
    const filter=root.querySelector('#history-filter select');
    const history=root.querySelector('#history');
    let request=0;
    filter.addEventListener('change',async()=>{
      const current=++request;
      const id=filter.value;
      history.textContent=id?'Cargando…':'Selecciona un material.';
      if (!id) return;
      try {
        const rows=await api('/materiales/'+id+'/historial');
        if (current===request) history.innerHTML=table(['Fecha','Tipo','Cantidad','Origen','Destino','Usuario','Documento','OC','Proveedor'],
          rows.map(r=>[r.fecha,r.tipo,nf.format(r.cantidad),r.origen,r.destino,r.usuario,r.documento,r.oc,r.proveedor]),'Sin movimientos.');
      } catch(error) {
        if (current===request) history.textContent=error.message;
      }
    });
  };
}

export async function orders(user) {
  const [materials,suppliers,rows,report]=await Promise.all([
    api('/materiales'),api('/proveedores'),api('/ordenes'),api('/ordenes/posibles-duplicados')
  ]);
  return root=>{
    root.innerHTML=title('Órdenes de compra','Registra órdenes y revisa coincidencias antes de procesarlas.')+
      `<details class="panel"><summary>Registrar orden de compra</summary>${form('/ordenes',
        text('Número de OC','numero')+text('Fecha','fecha','date')+text('Área','area')+select('Proveedor','proveedor',suppliers)+
        select('Material','material',materials)+numeric('Cantidad','cantidad',0.001)+numeric('Precio unitario (₡)','precio',0.001),'Guardar orden')}</details>
      <section class="panel"><h2>Posibles duplicados</h2><p>Mismo proveedor y material, con hasta ${report.regla.days} días y ${report.regla.percent} % de diferencia en cantidad.</p>
      ${table(['Primera OC','Segunda OC','Proveedor','Material','Cantidades'],report.pares.map(r=>[
        r.primera+' · '+r.fecha_primera,r.segunda+' · '+r.fecha_segunda,r.proveedor,r.material,
        nf.format(r.cantidad_primera)+' / '+nf.format(r.cantidad_segunda)]),'Sin coincidencias.')}</section>
      <section class="panel"><h2>Historial de órdenes</h2><div class="fields">
        <label>Buscar orden<input type="search" id="order-search" placeholder="Número, área o material"></label>
        <label>Proveedor<select id="order-supplier"><option value="">Todos los proveedores</option>${options(suppliers)}</select></label>
      </div><p id="order-total" role="status"></p><div id="order-results"></div></section>`;
    if (user.rol!=='admin') root.querySelector('details').remove();
    const search=root.querySelector('#order-search');
    const supplier=root.querySelector('#order-supplier');
    const total=root.querySelector('#order-total');
    const results=root.querySelector('#order-results');
    const render=()=>{
      const provider=suppliers.find(item=>String(item.id)===supplier.value)?.nombre;
      const query=normalize(search.value.trim());
      const visible=rows.filter(row=>(!provider || row.proveedor===provider) &&
        normalize([row.numero,row.area,row.articulo].join(' ')).includes(query));
      const amount=visible.reduce((sum,row)=>sum+row.cantidad*row.precio,0);
      total.textContent=nf.format(new Set(visible.map(row=>row.id)).size)+' órdenes · Total '+crc.format(amount);
      results.innerHTML=table(['OC','Fecha','Área','Proveedor','Material','Cantidad','Precio unitario','Importe'],
        visible.map(row=>[row.numero,row.fecha,row.area,row.proveedor,row.articulo,nf.format(row.cantidad),
          crc.format(row.precio),crc.format(row.cantidad*row.precio)]),'No se encontraron órdenes.');
    };
    search.addEventListener('input',render);
    supplier.addEventListener('change',render);
    render();
  };
}

export async function alerts() {
  const rows=await api('/alertas/reorden');
  return root=>{
    root.innerHTML=title('Alertas de reorden','Saldos inferiores al punto de reorden, ordenados por cobertura relativa.')+
      `<section class="panel">${table(['Ubicación','Material','Stock','Punto de reorden','Faltante'],
        rows.map(r=>[r.ubicacion,r.nombre,nf.format(r.stock)+' '+r.unidad,nf.format(r.reorden),nf.format(r.faltante)]),
        'Todas las existencias alcanzan el punto de reorden.')}</section>`;
  };
}