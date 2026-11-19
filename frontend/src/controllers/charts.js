const percent=new Intl.NumberFormat('es-CR',{style:'percent',maximumFractionDigits:1});

export function coverageChart(root,stock,sites) {
  const location=root.querySelector('select');
  const list=root.querySelector('.chart-bars');
  for (const site of sites) location.add(new Option(site.nombre,site.id));

  function render() {
    list.replaceChildren();
    const rows=stock.filter(row=>row.ubicacion_id===Number(location.value) && row.reorden>0);
    for (const row of rows) {
      const ratio=row.stock/row.reorden;
      const item=document.createElement('li');
      const name=document.createElement('span');
      name.textContent=row.nombre;
      const track=document.createElement('div');
      track.className='chart-track';
      track.setAttribute('aria-hidden','true');
      const bar=document.createElement('div');
      bar.className='chart-bar'+(ratio<1?' below-target':'');
      bar.style.width=Math.min(ratio,1)*100+'%';
      const value=document.createElement('strong');
      value.textContent=percent.format(ratio);
      track.append(bar);
      item.append(name,track,value);
      list.append(item);
    }
    if (!rows.length) {
      const empty=document.createElement('li');
      empty.textContent='No hay materiales con punto de reorden en esta ubicación.';
      list.append(empty);
    }
  }

  location.addEventListener('change',render);
  render();
}

const types=[['entrada','Entradas'],['salida','Salidas'],['traslado','Traslados'],['ajuste','Ajustes']];

export function activityChart(root,rows) {
  if (!rows.length) {
    root.textContent='Aún no hay movimientos registrados.';
    return;
  }
  const dates=new Map();
  for (const {fecha,tipo,total} of rows) {
    if (!dates.has(fecha)) dates.set(fecha,new Map());
    dates.get(fecha).set(tipo,total);
  }
  const max=Math.max(...Array.from(dates.values(),counts=>Array.from(counts.values()).reduce((sum,n)=>sum+n,0)));
  root.innerHTML='<ul class="activity-legend">'+types.map(([type,label])=>
    '<li><span class="key '+type+'"></span>'+label+'</li>').join('')+'</ul><ul class="activity-days"></ul>';
  const list=root.querySelector('.activity-days');

  for (const [date,counts] of dates) {
    const item=document.createElement('li');
    const caption=document.createElement('time');
    caption.dateTime=date;
    caption.textContent=date.slice(8)+'/'+date.slice(5,7);
    const track=document.createElement('div');
    track.className='activity-track';
    track.setAttribute('aria-hidden','true');
    const values=document.createElement('span');
    values.className='activity-values';
    values.textContent=types.filter(([type])=>counts.has(type)).map(([type,label])=>label+': '+counts.get(type)).join(' · ');
    for (const [type] of types) {
      const count=counts.get(type)??0;
      if (!count) continue;
      const segment=document.createElement('span');
      segment.className=type;
      segment.style.width=count/max*100+'%';
      track.append(segment);
    }
    item.append(caption,track,values);
    list.append(item);
  }
}