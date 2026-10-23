(function(){
 'use strict';
 var lastPath='',lastActive=null,timer;
 function norm(s){return(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
 var routes={'/':'inicio','/admin':'administracion','/buscar-jefe':'solicitar puesto de confianza','/mis-tramites':'mis tramites','/reportes':'reportes','/nuevo-tramite':'nueva solicitud','/cuadros':'resumen cr','/recepciones':'recepciones','/bandeja':'bandeja de tramites'};
 function sync(){
  var nav=document.querySelector('nav.sidebar');if(!nav)return;
  if(document.body.dataset.sicipRoute!==location.pathname)document.body.dataset.sicipRoute=location.pathname;
  var home=document.querySelector('#sicip-home-enhancements');if(home&&location.pathname==='/')document.querySelectorAll('#sicip-photo-prompt,#sicip-pwa-install,#sicip-pwa-notif').forEach(function(prompt){if(prompt.parentElement!==home)home.appendChild(prompt);});
  var head=document.querySelector('#root>div>header'),shell=nav.parentElement;
  if(head&&shell){var h=window.innerHeight-head.getBoundingClientRect().height;shell.style.height=Math.max(0,h)+'px';}
  document.querySelectorAll('main input[placeholder]').forEach(function(e){if(e.previousElementSibling?.tagName.toLowerCase()==='svg')e.setAttribute('data-search-icon','');});
  var menu=nav.firstElementChild;
  if(menu){if(!menu.querySelector('[data-personal-heading]')){var heading=document.createElement('div');heading.dataset.personalHeading='1';heading.textContent='Trámites personales';menu.appendChild(heading);}
   Array.from(menu.children).forEach(function(node){if(node.hasAttribute('data-personal-heading'))return;var button=node.matches('button,a')?node:node.querySelector('button,a'),label=norm(button?.textContent),order=45;
    if(label==='inicio')order=0;else if(label==='mis tramites')order=10;else if(node.hasAttribute('data-sicip-solicitudes-root')||label==='solicitudes')order=11;else if(label.includes('cuadros de reemplazo')||label.includes('cuadro de reemplazo'))order=8;else if(label.includes('herramientas'))order=40;else if(node.hasAttribute('data-sicip-jefe-servicio-root')||label==='jefe de servicio')order=60;else if(node.hasAttribute('data-sicip-depto-personal-root')||label==='departamento de personal')order=70;else if(label==='administracion')order=100;
    if(label==='reportes'||label==='reportes y estadisticas'||node.hasAttribute('data-sicip-worker-stats-root')){if(!node.hasAttribute('data-hide-report'))node.setAttribute('data-hide-report','1');}
    if(node.style.order!==String(order))node.style.order=String(order);
   });}
  document.querySelectorAll('[data-sicip-worker-stats-root]').forEach(function(n){if(!n.hasAttribute('data-hide-report'))n.setAttribute('data-hide-report','1');});
  var buttons=Array.from(nav.querySelectorAll('button,a'));
  if(lastActive&&!lastActive.isConnected)lastActive=null;
  if(lastPath!==location.pathname){lastPath=location.pathname;lastActive=null;}
  var custom=document.querySelector('#sicip-pases-view,#sicip-herramientas-view,[data-sicip-module-panel]:not([data-central-embedded]),[data-sicip-cr-panel],[data-sicip-recepciones-panel]');
  if(custom){var hostSelected=buttons.find(function(b){return b.getAttribute('data-sicip-active')==='1';});if(hostSelected)lastActive=hostSelected;}
  if(!custom){var label=routes[location.pathname]||(location.pathname.startsWith('/cuadro/')?'mi cuadro de reemplazo':null);if(location.pathname==='/nuevo-tramite'&&new URLSearchParams(location.search).get('tipo'))lastActive=nav.querySelector('[data-jefe-form="'+CSS.escape(new URLSearchParams(location.search).get('tipo'))+'"]')||lastActive;else if(label)lastActive=buttons.find(function(b){return norm(b.textContent)===label;})||lastActive;}
  if(lastActive)buttons.forEach(function(b){var on=b===lastActive;if(on){if(b.getAttribute('data-sicip-active')!=='1')b.setAttribute('data-sicip-active','1');if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page');}else{if(b.hasAttribute('data-sicip-active'))b.removeAttribute('data-sicip-active');if(b.hasAttribute('aria-current'))b.removeAttribute('aria-current');}if(b.dataset.active!==(on?'1':''))b.dataset.active=on?'1':'';});

 }
 document.addEventListener('click',function(e){var b=e.target.closest('nav.sidebar button,nav.sidebar a');if(!b)return;var p=b.parentElement;var expandable=b.hasAttribute('aria-expanded')||p?.matches('[data-sicip-mod-v2],[data-sicip-depto-personal-root],[data-sicip-solicitudes-root],[data-sicip-herramientas-root],[data-sicip-jefe-servicio-root]')&&b===p.firstElementChild;if(!expandable){lastActive=b;lastPath=location.pathname;setTimeout(function(){lastPath=location.pathname;sync();},60);}},true);
 window.addEventListener('resize',sync);window.addEventListener('popstate',function(){lastActive=null;setTimeout(sync,80);});
 new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(sync,120);}).observe(document.documentElement,{childList:true,subtree:true});
 setInterval(sync,800);sync();
})();
