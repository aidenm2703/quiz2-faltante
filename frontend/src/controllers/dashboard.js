import {api} from './api.js';

export async function dashboard() {
  const [materials,sites,alerts,duplicates]=await Promise.all([
    api('/materiales'),api('/ubicaciones'),api('/alertas/reorden'),api('/ordenes/posibles-duplicados')
  ]);
  const summaries=[
    ['Materiales registrados',materials.length,'existencias','Consultar existencias'],
    ['Bodegas y obras',sites.length,'existencias','Ver ubicaciones'],
    ['Alertas activas',alerts.length,'alertas','Revisar reposición'],
    ['Posibles duplicados',duplicates.pares.length,'ordenes','Revisar órdenes']
  ];
  return root=>{
    root.innerHTML=`<h1>Panel de inventario</h1><p>Revisa qué materiales requieren reposición y qué compras necesitan revisión.</p>
      <div class="dashboard-grid">${summaries.map(([name,total,route,action])=>`<section class="panel metric">
      <h2>${name}</h2><strong>${total}</strong><a href="#${route}">${action} →</a></section>`).join('')}</div>
      <section class="panel"><h2>Déficits prioritarios</h2><ul id="top-alerts"></ul></section>`;
    const list=root.querySelector('#top-alerts');
    const amount=new Intl.NumberFormat('es-CR',{maximumFractionDigits:3});
    for (const alert of alerts.slice(0,5)) {
      const item=document.createElement('li');
      item.textContent=alert.nombre+' · '+alert.ubicacion+' · faltan '+amount.format(alert.faltante)+' '+alert.unidad;
      list.append(item);
    }
    if (!alerts.length) list.textContent='Todas las existencias alcanzan su punto de reorden.';
  };
}