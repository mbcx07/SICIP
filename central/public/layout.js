(function(){
 'use strict';
 var lastPath='',lastActive=null,timer;
 function norm(s){return(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
 var routes={'/':'inicio','/admin':'usuarios y permisos','/buscar-jefe':'solicitar puesto de confianza','/mis-tramites':'mis tramites','/reportes':'reportes','/nuevo-tramite':'nueva solicitud','/cuadros':'resumen cr','/recepciones':'recepciones','/bandeja':'bandeja de tramites'};
 function sync(){
  var nav=document.querySelector('nav.sidebar');if(!nav)return;
  if(document.body.dataset.sicipRoute!==location.pathname)document.body.dataset.sicipRoute=location.pathname;
  var home=document.querySelector('#sicip-home-enhancements');if(home&&location.pathname==='/')document.querySelectorAll('#sicip-photo-prompt,#sicip-pwa-install,#sicip-pwa-notif').forEach(function(prompt){if(prompt.parentElement!==home)home.appendChild(prompt);});
  var head=document.querySelector('#root>div>header'),shell=nav.parentElement;
  if(head&&shell){var h=window.innerHeight-head.getBoundingClientRect().height;shell.style.height=Math.max(0,h)+'px';}
  document.querySelectorAll('main input[placeholder]').forEach(function(e){if(e.previousElementSibling?.tagName.toLowerCase()==='svg')e.setAttribute('data-search-icon','');});
  var buttons=Array.from(nav.querySelectorAll('button,a'));
  if(lastActive&&!lastActive.isConnected)lastActive=null;
  if(lastPath!==location.pathname){lastPath=location.pathname;lastActive=null;}
  var custom=document.querySelector('#sicip-pases-view,#sicip-herramientas-view,[data-sicip-module-panel],[data-sicip-cr-panel],[data-sicip-recepciones-panel]');
  if(!custom){var label=routes[location.pathname]||(location.pathname.startsWith('/cuadro/')?'mi cuadro de reemplazo':null);if(location.pathname==='/nuevo-tramite'&&new URLSearchParams(location.search).get('tipo'))lastActive=nav.querySelector('[data-jefe-form="'+CSS.escape(new URLSearchParams(location.search).get('tipo'))+'"]')||lastActive;else if(label)lastActive=buttons.find(function(b){return norm(b.textContent)===label;})||lastActive;}
  if(lastActive)buttons.forEach(function(b){var on=b===lastActive;if(on){if(b.getAttribute('data-sicip-active')!=='1')b.setAttribute('data-sicip-active','1');if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page');}else{if(b.hasAttribute('data-sicip-active'))b.removeAttribute('data-sicip-active');if(b.hasAttribute('aria-current'))b.removeAttribute('aria-current');}if(b.dataset.active!==(on?'1':''))b.dataset.active=on?'1':'';});
  var admin=buttons.find(function(b){return norm(b.textContent)==='administracion'&&!b.hasAttribute('data-admin-root');});
  var central=nav.querySelector('[data-central-nav]');
  if(admin&&central&&!nav.querySelector('[data-admin-root]')){
   var group=document.createElement('div');group.setAttribute('data-sicip-custom-nav','1');group.setAttribute('data-admin-root','');
   var toggle=document.createElement('button');toggle.setAttribute('data-admin-toggle','');toggle.textContent='Administración ▾';toggle.style.cssText=admin.style.cssText;toggle.setAttribute('aria-expanded','false');
   var panel=document.createElement('div');panel.setAttribute('data-admin-panel','');panel.hidden=true;
   admin.parentNode.insertBefore(group,admin);group.append(toggle,panel);panel.append(admin,central);central.textContent='Control de personal y plazas';central.style.cssText=admin.style.cssText;central.style.paddingLeft='2rem';central.style.fontSize='.8rem';admin.textContent='Usuarios y permisos';admin.dataset.adminUsers='1';
   toggle.onclick=function(e){e.stopPropagation();panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
  }
 }
 document.addEventListener('click',function(e){var b=e.target.closest('nav.sidebar button,nav.sidebar a');if(!b)return;var p=b.parentElement;var expandable=b.hasAttribute('aria-expanded')||p?.matches('[data-sicip-mod-v2],[data-sicip-depto-personal-root],[data-sicip-solicitudes-root],[data-sicip-herramientas-root],[data-sicip-jefe-servicio-root]')&&b===p.firstElementChild;if(!expandable){lastActive=b;lastPath=location.pathname;setTimeout(function(){lastPath=location.pathname;sync();},60);}},true);
 window.addEventListener('resize',sync);window.addEventListener('popstate',function(){lastActive=null;setTimeout(sync,80);});
 new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(sync,120);}).observe(document.documentElement,{childList:true,subtree:true});
 setInterval(sync,800);sync();
})();
