import {connect} from './db/database.js';
import {app} from './app.js';

function setting(name,fallback,min,max) {
  const value=Number(process.env[name]??fallback);
  if (!Number.isInteger(value)||value<min||value>max) throw new Error(name+' fuera de rango.');
  return value;
}

const port=setting('PORT',3000,1,65535);
const rule={days:setting('DUPLICATE_DAYS',3,0,365),percent:setting('DUPLICATE_PERCENT',10,0,100)};
app(connect(process.env.DATABASE_PATH||'inventario.sqlite'),rule)
  .listen(port,'127.0.0.1',()=>console.log('API en http://127.0.0.1:'+port+'/api'));