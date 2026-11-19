export function check(condition, message, status=400) {
  if (!condition) throw Object.assign(new Error(message),{status});
}

export function label(value, field) {
  check(typeof value==='string' && value.trim().length>0 && value.trim().length<=120, field+' es obligatorio (máximo 120 caracteres).');
  return value.trim();
}

export function number(value, field, min=0, integer=false) {
  check(Number.isFinite(value) && value>=min && value<=1e9 &&
    (integer ? Number.isInteger(value) : Number(value.toFixed(3))===value),field+' inválido.');
  return value;
}

export function date(value) {
  check(typeof value==='string' && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0,10)===value,'Usa una fecha válida en formato AAAA-MM-DD.');
  return value;
}

export function exists(db, table, value) {
  const id=number(value,table,1,true);
  check(db.prepare('SELECT 1 FROM '+table+' WHERE id=?').get(id),'Registro inexistente en '+table+'.',404);
  return id;
}