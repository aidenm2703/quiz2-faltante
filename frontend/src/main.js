import {navigate,start} from './routes/router.js';
window.addEventListener('hashchange',()=>navigate());
start();