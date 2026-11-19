import {api} from './api.js';

const demo=[
  ['admin','DemoAdmin2026!','Administra materiales, compras y movimientos'],
  ['bodega','DemoBodega2026!','Registra movimientos y consulta inventario'],
  ['consulta','DemoConsulta2026!','Consulta inventario, alertas y órdenes']
];

export const roleNames={admin:'Administración',bodega:'Bodega',consulta:'Solo lectura'};

export function loginScreen(root,onLogin) {
  root.innerHTML=`<div class="login-layout">
    <div class="welcome"><p>CONSTRUCTORA DEL VALLE</p><h1>Control de inventario</h1>
    <p>Consulta el stock por ubicación y registra las compras y los movimientos de cada obra.</p></div>
    <div class="login-panel">
      <form id="login-form"><h2>Iniciar sesión</h2>
        <label>Usuario<input name="usuario" autocomplete="username" maxlength="120" required></label>
        <label>Contraseña<input name="clave" type="password" autocomplete="current-password" maxlength="120" required></label>
        <p id="login-error" role="alert" hidden></p>
        <button type="submit">Entrar al sistema</button>
      </form>
      <section class="demo-users"><h2>Usuarios de prueba</h2><p>Selecciona una cuenta para llenar los campos.</p>
        ${demo.map(([user,password,description])=>`<button type="button" data-user="${user}">
          <strong>${user}</strong><code>${password}</code><span>${description}</span></button>`).join('')}
      </section>
    </div></div>`;
  const form=root.querySelector('form');
  const error=root.querySelector('#login-error');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const button=form.querySelector('button');
    button.disabled=true;
    error.hidden=true;
    try {
      const user=await api('/sesion/entrada',Object.fromEntries(new FormData(form)));
      onLogin(user);
    } catch (failure) {
      error.textContent=failure.message;
      error.hidden=false;
    } finally {
      button.disabled=false;
    }
  });
  for (const button of root.querySelectorAll('[data-user]')) {
    button.addEventListener('click',()=>{
      const [user,password]=demo.find(([name])=>name===button.dataset.user);
      form.elements.usuario.value=user;
      form.elements.clave.value=password;
      form.querySelector('button').focus();
    });
  }
}