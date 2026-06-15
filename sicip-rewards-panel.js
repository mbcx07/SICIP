// SICIP - Panel Home de Recompensas v5.19.4
// Centraliza Aura laboral anual, entrega oportuna y asiduidad para futuras integraciones.
(function(){
  'use strict';
  var VERSION='5.19.4-aura-420-quincenal';
  var STORE='sicip_pases_rewards_v1';
  var PANEL_ID='sicip-rewards-home-panel';
  var AURA_RANKS=['Iniciado','Aprendiz','Custodio','Centinela','Adeptus','Vanguardia','Maestro','Ascendente','Mítico','Legendario'];
  var AURA_GRADES=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  function $(id){return document.getElementById(id)}
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function getUser(){try{return JSON.parse(sessionStorage.getItem('sicip_usuario')||'null')}catch(e){return null}}
  function loadRewards(){try{return JSON.parse(localStorage.getItem(STORE)||'{"totals":{},"events":[]}')}catch(e){return{totals:{},events:[]}}}
  function matriculaUser(u){return String((u&&(u.matricula||u.uid||u.id))||sessionStorage.getItem('sicip_matricula')||'').trim()}
  function levelName(level){level=Math.max(1,Math.min(100,level));return AURA_RANKS[Math.floor((level-1)/10)]+' '+AURA_GRADES[(level-1)%10]}
  function currentYear(){return String(new Date().getFullYear())}
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
    s.textContent='.sicip-rewards-home{background:rgba(255,255,255,.92);border:1px solid #dbe5df;border-radius:14px;padding:14px 16px;margin:0 0 14px;box-shadow:0 6px 16px rgba(15,23,42,.05);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2937}.sicip-aura-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.sicip-aura-title{display:flex;align-items:center;gap:10px;min-width:0}.sicip-aura-orb{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d1fae5,#10b981 58%,#005235);box-shadow:0 0 0 4px #ecfdf5,0 0 18px rgba(16,185,129,.24);flex-shrink:0}.sicip-aura-title h2{margin:0;color:#005235;font-size:15px;line-height:1.1}.sicip-aura-title span{display:block;color:#6b7280;font-size:11px;margin-top:2px}.sicip-aura-level{border:1px solid #bbf7d0;background:#ecfdf5;color:#065f46;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;white-space:nowrap}.sicip-aura-bar{height:10px;background:#edf5f0;border-radius:999px;overflow:hidden;border:1px solid #dbe5df}.sicip-aura-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#10b981,#5eead4);box-shadow:0 0 12px rgba(16,185,129,.45);transition:width .3s ease}.sicip-aura-meta{display:flex;justify-content:space-between;gap:10px;margin-top:7px;color:#6b7280;font-size:11px}.sicip-aura-events{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.sicip-aura-chip{background:#f8faf9;border:1px solid #dbe5df;border-radius:999px;padding:5px 8px;font-size:11px;color:#4b5563}.sicip-aura-chip strong{color:#005235}@media(max-width:640px){.sicip-aura-head{align-items:flex-start}.sicip-rewards-home{padding:12px}.sicip-aura-level{font-size:10px}}';
    document.head.appendChild(s);
  }
  function render(){
    var m=main(),u=getUser();
    if(!m||!u||!isHome()){var old=$(PANEL_ID);if(old)old.remove();return}
    css();
    var mat=matriculaUser(u),r=loadRewards(),year=currentYear();
    var allEvents=(r.events||[]).filter(function(e){return (!mat||String(e.matricula)===String(mat))&&String(e.fecha||'').slice(0,4)===year});
    var total=allEvents.reduce(function(sum,e){return sum+Number(e.points||0)},0);
    var events=allEvents.slice(0,3);
    var level=Math.min(100,Math.floor(total/100)+1), aura=level>=100?100:(total%100), next=level>=100?0:(100-aura);
    var label=levelName(level);
    var panel=$(PANEL_ID)||document.createElement('section');
    panel.id=PANEL_ID;panel.className='sicip-rewards-home';
    panel.innerHTML='<div class="sicip-aura-head"><div class="sicip-aura-title"><div class="sicip-aura-orb"></div><div><h2>Aura laboral</h2><span>'+esc(label)+' · temporada '+year+'</span></div></div><div class="sicip-aura-level">Nivel '+level+'</div></div><div class="sicip-aura-bar" aria-label="Progreso de aura"><div class="sicip-aura-fill" style="width:'+aura+'%"></div></div><div class="sicip-aura-meta"><span>'+aura+'/100 aura · '+total+' pts</span><span>'+(level>=100?'Nivel máximo':next+' pts para subir')+'</span></div><div class="sicip-aura-events">'+(events.length?events.map(function(e){return '<span class="sicip-aura-chip"><strong>+'+e.points+'</strong> '+esc(String(e.reason||'').replace(/^Cerró la quincena /,'Q ').replace(/^Aura quincenal /,'Q ').replace('Entregó documento de pase manual dentro de los primeros 3 días de la incidencia.','Entrega oportuna'))+'</span>'}).join(''):'<span class="sicip-aura-chip">Sin movimientos aún</span>')+'</div>';
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
