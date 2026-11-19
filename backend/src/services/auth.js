import {createHash,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {check} from './validation.js';

const lifetime=8*60*60;
const demo=[
  ['admin','Administración','admin','DemoAdmin2026!'],
  ['bodega','Operaciones de bodega','bodega','DemoBodega2026!'],
  ['consulta','Consulta de inventario','consulta','DemoConsulta2026!']
];

function digest(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function seedUsers(db) {
  if (db.prepare('SELECT 1 FROM usuarios LIMIT 1').get()) return;
  const insert=db.prepare('INSERT INTO usuarios (usuario,nombre,rol,sal,clave) VALUES (?,?,?,?,?)');
  for (const [usuario,nombre,rol,password] of demo) {
    const salt=randomBytes(16).toString('hex');
    insert.run(usuario,nombre,rol,salt,scryptSync(password,salt,64).toString('hex'));
  }
}

export function login(db,body) {
  const {usuario,clave}=body;
  check(typeof usuario==='string' && usuario.length<=120 && typeof clave==='string' && clave.length<=120,'Credenciales inválidas.',401);
  const found=db.prepare('SELECT * FROM usuarios WHERE usuario=?').get(usuario.trim().toLowerCase());
  const calculated=scryptSync(clave,found?.sal??'inventario-demo',64);
  check(found && timingSafeEqual(calculated,Buffer.from(found.clave,'hex')),'Usuario o contraseña incorrectos.',401);
  const token=randomBytes(32).toString('hex');
  const now=Math.floor(Date.now()/1000);
  db.prepare('DELETE FROM sesiones WHERE vence<=?').run(now);
  db.prepare('INSERT INTO sesiones VALUES (?,?,?)').run(digest(token),found.id,now+lifetime);
  return {token,user:{usuario:found.usuario,nombre:found.nombre,rol:found.rol}};
}

export const cookieOptions={httpOnly:true,sameSite:'strict',path:'/',maxAge:lifetime*1000};

export function sessionToken(req) {
  return req.headers.cookie?.match(/(?:^|;\s*)inventario=([a-f0-9]{64})(?:;|$)/)?.[1];
}

export function logout(db,token) {
  if (token) db.prepare('DELETE FROM sesiones WHERE token=?').run(digest(token));
}

export function authenticate(db) {
  return (req,_res,next)=>{
    const token=sessionToken(req);
    const user=token && db.prepare(`SELECT u.usuario,u.nombre,u.rol FROM sesiones s
      JOIN usuarios u ON u.id=s.usuario_id WHERE s.token=? AND s.vence>?`).get(digest(token),Math.floor(Date.now()/1000));
    check(user,'Inicia sesión para continuar.',401);
    req.user=user;
    next();
  };
}

export function authorize(...roles) {
  return (req,_res,next)=>{
    check(roles.includes(req.user.rol),'Tu usuario no tiene permiso para esta acción.',403);
    next();
  };
}