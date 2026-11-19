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