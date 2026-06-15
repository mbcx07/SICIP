// SICIP - Panel Home de Recompensas v5.19.1
// Centraliza puntos de entrega oportuna y asiduidad para futuras integraciones.
(function(){
  'use strict';
  var VERSION='5.19.1-home-rewards';
  var STORE='sicip_pases_rewards_v1';
  var PANEL_ID='sicip-rewards-home-panel';
  function $(id){return document.getElementById(id)}
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function getUser(){try{return JSON.parse(sessionStorage.getItem('sicip_usuario')||'null')}catch(e){return null}}
  function loadRewards(){try{return JSON.parse(localStorage.getItem(STORE)||'{"totals":{},"events":[]}')}catch(e){return{totals:{},events:[]}}}
  function matriculaUser(u){return String((u&&(u.matricula||u.uid||u.id))||sessionStorage.getItem('sicip_matricula')||'').trim()}
  function main(){return document.querySelector('main')||document.querySelector('[role="main"]')||document.querySelector('#root main')}
  function isHome(){
    var path=location.pathname.replace(/\/$/,'')||'/';
    var hash=(location.hash||'').replace(/^#/,'').replace(/\/$/,'')||'/';
    if(document.getElementById('sicip-pases-view')||document.getElementById('sicip-herramientas-view'))return false;
    return path==='/'&&(hash==='/'||hash===''||hash==='/dashboard'||hash==='/inicio');
  }
  function css(){
    if($('sicip-rewards-home-css'))return;
    var s=document.createElement('style');s.id='sicip-rewards-home-css';
    s.textContent='.sicip-rewards-home{background:#fff;border:1px solid #dbe5df;border-radius:18px;padding:18px;margin:0 0 18px;box-shadow:0 8px 18px rgba(15,23,42,.06);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2937}.sicip-rewards-home h2{margin:0;color:#005235;font-size:18px}.sicip-rewards-sub{margin:4px 0 14px;color:#6b7280;font-size:12px}.sicip-rewards-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.sicip-rewards-score{background:linear-gradient(135deg,#005235,#0b6b43);color:#fff;border-radius:16px;padding:16px}.sicip-rewards-score b{display:block;font-size:34px;line-height:1}.sicip-rewards-note{color:rgba(255,255,255,.86);font-size:12px;margin:8px 0 0;line-height:1.35}.sicip-rewards-list{display:grid;gap:8px;max-height:188px;overflow:auto}.sicip-rewards-item{background:#f8faf9;border:1px solid #dbe5df;border-radius:12px;padding:9px 10px;font-size:12px}.sicip-rewards-item strong{color:#005235}.sicip-rewards-small{font-size:12px;color:#6b7280;line-height:1.45}@media(max-width:760px){.sicip-rewards-grid{grid-template-columns:1fr}.sicip-rewards-home{margin:0 0 14px;padding:14px}}';
    document.head.appendChild(s);
  }
  function render(){
    var m=main(),u=getUser();
    if(!m||!u||!isHome()){var old=$(PANEL_ID);if(old)old.remove();return}
    css();
    var mat=matriculaUser(u),r=loadRewards(),total=mat?(r.totals&&r.totals[mat]||0):0;
    var events=(r.events||[]).filter(function(e){return !mat||String(e.matricula)===String(mat)}).slice(0,5);
    var leaders=Object.keys(r.totals||{}).sort(function(a,b){return(r.totals[b]||0)-(r.totals[a]||0)}).slice(0,5);
    var panel=$(PANEL_ID)||document.createElement('section');
    panel.id=PANEL_ID;panel.className='sicip-rewards-home';
    panel.innerHTML='<h2>Recompensas</h2><p class="sicip-rewards-sub">Entrega oportuna, asiduidad y próximos documentos integrados.</p><div class="sicip-rewards-grid"><div class="sicip-rewards-score"><span>'+(mat?'Matrícula '+esc(mat):'Usuario activo')+'</span><b>'+total+'</b><span>puntos acumulados</span><p class="sicip-rewards-note">+10 por entrega manual en 3 días. +25 por quincena cerrada sin pase particular. Oficiales y médicos no descuentan.</p></div><div><strong style="color:#005235">Últimas recompensas</strong><div class="sicip-rewards-list">'+(events.length?events.map(function(e){return '<div class="sicip-rewards-item"><strong>+'+e.points+' pts</strong> '+esc(e.reason)+'<br><span class="sicip-rewards-small">'+esc(String(e.fecha).slice(0,10))+'</span></div>'}).join(''):'<div class="sicip-rewards-item">Sin recompensas registradas todavía.</div>')+'</div><strong style="display:block;color:#005235;margin-top:10px">Top local</strong><div class="sicip-rewards-small">'+(leaders.length?leaders.map(function(x,i){return (i+1)+'. '+esc(x)+' - '+(r.totals[x]||0)+' pts'}).join('<br>'):'Sin puntaje aún')+'</div></div></div>';
    if(!panel.parentNode)m.insertBefore(panel,m.firstChild);
  }
  var t=null;function schedule(){clearTimeout(t);t=setTimeout(render,180)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);
  window.addEventListener('storage',schedule);
  document.addEventListener('click',function(e){if(e.target.closest('nav button,aside button,nav a,aside a'))setTimeout(schedule,350)},true);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.__SICIP_REWARDS_HOME={version:VERSION,render:render};
  console.log('[SICIP] Rewards home panel '+VERSION+' cargado');
})();
