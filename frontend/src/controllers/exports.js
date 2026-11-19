function cell(value) {
  const text=String(value??'');
  const safe=typeof value==='string' && /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? "'"+text : text;
  return '"'+safe.replaceAll('"','""')+'"';
}

export function exportCsv(filename,rows) {
  const contents=rows.map(row=>row.map(cell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF',contents],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');
  link.href=url;
  link.download=filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}