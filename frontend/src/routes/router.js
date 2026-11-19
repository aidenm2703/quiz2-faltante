import {api} from '../controllers/api.js';
import {loginScreen,roleNames} from '../controllers/account.js';
import {dashboard} from '../controllers/dashboard.js';
import {stock,movements,orders,alerts} from '../controllers/views.js';

const routes=new Map([['inicio',dashboard],['existencias',stock],['movimientos',movements],['ordenes',orders],['alertas',alerts]]);
const app=document.querySelector('#app');
const status=document.querySelector('#status');
const nav=document.querySelector('nav');
const account=document.querySelector('#account');
const logout=document.querySelector('#logout');
let revision=0;
let user=null;

function feedback(message,error=false) {
  status.textContent=message;
  status.hidden=!message;
  status.classList.toggle('error',error);
}

function showLogin(message='') {
  user=null;
  revision++;
  nav.hidden=true;
  account.hidden=true;
  app.setAttribute('aria-busy','false');
  feedback(message,Boolean(message));
  loginScreen(app,current=>{
    user=current;
    navigate();
  });
}

export async function start() {
  try {
    user=await api('/sesion');
    await navigate();
  } catch (error) {
    showLogin(error.status===401?'':error.message);
  }
}

export async function navigate(message='') {
  if (!user) return;
  const current=++revision;
  const hash=location.hash.slice(1);
  const route=routes.has(hash)?hash:'inicio';
  nav.hidden=false;
  account.hidden=false;
  document.querySelector('#account-label').textContent=user.nombre+' · '+roleNames[user.rol];
  nav.querySelectorAll('a').forEach(link=>{
    if (link.hash==='#'+route) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  feedback(message);
  app.setAttribute('aria-busy','true');
  app.textContent='Cargando…';
  try {
    const render=await routes.get(route)(user);
    if (current===revision) render(app);
  } catch(error) {
    if (current!==revision) return;
    if (error.status===401) return showLogin('La sesión terminó. Ingresa de nuevo.');
    app.textContent='';
    feedback(error.message,true);
  } finally {
    if (current===revision) app.setAttribute('aria-busy','false');
  }
}

logout.addEventListener('click',async()=>{
  logout.disabled=true;
  try {
    await api('/sesion/salida',{});
    history.replaceState(null,'',location.pathname);
    showLogin();
  } catch (error) {
    feedback(error.message,true);
  } finally {
    logout.disabled=false;
  }
});

app.addEventListener('submit',async event=>{
  const form=event.target;
  if (!form.dataset.path) return;
  event.preventDefault();
  const button=form.querySelector('button');
  const current=revision;
  const data=Object.fromEntries([...new FormData(form)].filter(([,value])=>value!=='').map(([name,value])=>[
    name,form.elements[name].matches('[type=number], select[data-number]')?Number(value):value
  ]));
  button.disabled=true;
  feedback('');
  try {
    await api(form.dataset.path,data);
    if (current===revision) await navigate('Registro guardado.');
  } catch(error) {
    if (current!==revision) return;
    if (error.status===401) return showLogin('La sesión terminó. Ingresa de nuevo.');
    feedback(error.message,true);
  } finally {
    button.disabled=false;
  }
});