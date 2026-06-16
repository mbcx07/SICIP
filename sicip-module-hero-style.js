// SICIP - Estilo unificado de títulos de módulos/submódulos v1.0
// Aplica encabezado tipo hero verde como estándar visual.
(function(){
  'use strict';
  var VERSION='1.0.0';

  var TITLES={
    'dashboard':'Panel principal|Resumen operativo del sistema SICIP',
    'solicitudes':'Solicitudes|Captura, consulta y seguimiento de solicitudes',
    'contrato':'Contrato|Gestión y validación de procesos de contratación',
    'cuadros':'Cuadro de Reemplazo|Busca un Jefe de Servicio para participar en su cuadro de reemplazo',
    'pases':'Pases|Control de pases de entrada y salida',
    'licencias':'Licencias|Gestión de licencias y permisos del personal',
    'recepciones':'Recepciones|Control y seguimiento de recepciones documentales',
    'reportes':'Reportes|Consulta, filtra y exporta información operativa',
    'plantilla':'Plantilla|Consulta y administración de plantilla y plazas',
    'plazas':'Plazas|Consulta y seguimiento de plazas institucionales',
    'vacantes':'Vacantes|Seguimiento de plazas vacantes y cobertura',
    'usuarios':'Usuarios|Administración de usuarios y perfiles de acceso',
    'roles':'Roles|Control de permisos y módulos por perfil',
    'admin':'Administración|Herramientas de administración del sistema',
    'herramientas':'Herramientas|Accede a utilidades operativas del sistema',
    'calculadora':'Calculadora de Nivelación|Calcula, relaciona y reporta casos de nivelación'
  };

  function injectCSS(){
    if(document.getElementById('sicip-module-hero-css'))return;
    var st=document.createElement('style');st.id='sicip-module-hero-css';
    st.textContent='\n.sicip-module-hero{background:linear-gradient(135deg,#005235 0%,#006d48 52%,#1fb86b 100%)!important;color:#fff!important;border-radius:22px!important;padding:24px 26px!important;margin:0 0 22px 0!important;box-shadow:0 16px 36px rgba(0,82,53,.22)!important;border:1px solid rgba(255,255,255,.16)!important;position:relative!important;overflow:hidden!important}\n.sicip-module-hero:after{content:"";position:absolute;right:-45px;top:-55px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.10);pointer-events:none}\n.sicip-module-hero h1,.sicip-module-hero h2,.sicip-module-hero h3{color:#fff!important;margin:0!important;font-weight:900!important;letter-spacing:-.03em!important;font-size:clamp(1.55rem,4.8vw,2.15rem)!important;line-height:1.05!important}\n.sicip-module-hero p,.sicip-module-hero .sicip-module-hero-subtitle{color:rgba(255,255,255,.88)!important;margin:.55rem 0 0!important;font-size:clamp(.96rem,3.2vw,1.08rem)!important;line-height:1.35!important;max-width:780px!important}\n.sicip-module-hero .badge,.sicip-module-hero span{color:inherit}\n@media(max-width:640px){.sicip-module-hero{border-radius:18px!important;padding:20px 18px!important;margin-bottom:18px!important}.sicip-module-hero h1,.sicip-module-hero h2{font-size:1.65rem!important}}\n';
    document.head.appendChild(st);
  }
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
  function infoFromText(t){var n=norm(t);for(var k in TITLES){if(n.includes(k)){var parts=TITLES[k].split('|');return{title:parts[0],sub:parts[1]}}}return null}
  function currentInfo(){var key=norm(location.pathname+' '+location.hash);for(var k in TITLES){if(key.includes(k)){var p=TITLES[k].split('|');return{title:p[0],sub:p[1]}}}return null}
  function isBad(h){return !h||h.closest('nav,aside,table,.modal,[role="dialog"],.sicip-module-hero,#sicip-herramientas-view iframe')||h.dataset.sicipHeroDone}
  function makeHero(container,h,info){
    if(!container||container.dataset.sicipHeroApplied)return;
    container.classList.add('sicip-module-hero');container.dataset.sicipHeroApplied='1';
    if(info&&info.title&&h.textContent.trim().length<45)h.textContent=info.title;
    var p=container.querySelector('p');
    if(!p&&info&&info.sub){p=document.createElement('p');p.className='sicip-module-hero-subtitle';p.textContent=info.sub;h.insertAdjacentElement('afterend',p)}
    else if(p){p.classList.add('sicip-module-hero-subtitle')}
  }
  function apply(){
    injectCSS();
    var main=document.querySelector('main,[role="main"]')||document.querySelector('#root')||document.body;
    var heads=Array.prototype.slice.call(document.querySelectorAll('main h1,main h2,[role="main"] h1,[role="main"] h2,#root h1,#root h2'));
    heads.forEach(function(h){
      if(isBad(h))return;
      var txt=h.textContent.trim(); if(!txt||txt.length>80)return;
      var info=infoFromText(txt)||currentInfo();
      var c=h.parentElement;
      if(!c)return;
      var childCount=c.children.length;
      if(childCount<=4 || c.querySelector('p')){
        makeHero(c,h,info||{title:txt,sub:''}); h.dataset.sicipHeroDone='1';
      }
    });
  }
  var t=null;function schedule(){clearTimeout(t);t=setTimeout(apply,180)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.__SICIP_MODULE_HERO_STYLE={version:VERSION,apply:apply};
})();
