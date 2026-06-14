// SICIP PRO DESIGN v5.0 — Limpio y directo
(function(){
  'use strict';
  var VERSION = '5.17.3-fase1-login';

  var css = '';
  
  // ====== LOGIN ======
  css += 'div[style*="min-height: 100dvh"][style*="#0d3b1e"]{background:#f0f4f2!important}';
  css += 'span[style*="WebkitBackgroundClip"]{background:none!important;-webkit-background-clip:unset!important;-webkit-text-fill-color:#005235!important;color:#005235!important}';
  css += 'input[placeholder*="Matricula"],input[placeholder*="Contrasena"],input[placeholder*="Primera"],input[placeholder*="Repite"]{border:1.5px solid #d1d5db!important;border-radius:12px!important;padding:13px 16px!important;font-size:1rem!important;background:#fafafa!important}';
  css += 'input[placeholder*="Matricula"]:focus,input[placeholder*="Contrasena"]:focus,input[placeholder*="Primera"]:focus,input[placeholder*="Repite"]:focus{border-color:#005235!important;box-shadow:0 0 0 3px rgba(0,82,53,.08)!important;background:#fff!important;outline:none!important}';
  css += 'button[style*="#1a5c32"][style*="#27ae60"]{background:#005235!important;border-radius:12px!important;padding:14px 24px!important;font-weight:700!important;font-size:1rem!important;border:none!important}';
  css += 'button[style*="#1a5c32"][style*="#27ae60"]:hover{background:#006d48!important;box-shadow:0 4px 16px rgba(0,82,53,.2)!important}';
  
  // ====== QUITAR RECTÁNGULO VERDE ======
  // El hero tiene: linear-gradient(135deg, #005235 ...) + border-radius: 14px + padding: 1.25rem 1.5rem
  // Selector: cualquier div cuyo style contenga el gradiente Y border-radius:14
  // Lo convertimos a fondo blanco con borde verde sutil
  css += 'div[style*="linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)"]{background:#ffffff!important;border:1.5px solid #005235!important}';
  // Y forzamos que los hijos directos tengan texto oscuro legible
  css += 'div[style*="linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)"] > div > h2,'; 
  css += 'div[style*="linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)"] h2,';
  css += 'div[style*="linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)"] h1{color:#005235!important}';
  css += 'div[style*="linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)"] p,';
  css += 'div[style*="linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)"] span{color:#4b5563!important}';
  // Cualquier botón dentro del hero
  css += 'div[style*="linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)"] button{background:#005235!important;color:#fff!important}';

  // ====== BOTONES GRISES A VERDES ======
  css += 'button[style*="#f3f4f6"]{background:#005235!important;color:#fff!important;border:1px solid #005235!important;border-radius:10px!important;font-weight:600!important}';
  css += 'button[style*="#f9fafb"]{background:#005235!important;color:#fff!important;border:1px solid #005235!important;border-radius:10px!important;font-weight:600!important}';
  css += 'button[style*="#e5e7eb"]{background:#005235!important;color:#fff!important;border:1px solid #005235!important;border-radius:10px!important;font-weight:600!important}';
  // Respetar botones rojos
  css += 'button[style*="color:#991b1b"],button[style*="color:#dc2626"],button[style*="color:#ef4444"]{background:transparent!important;color:#dc2626!important;border:1px solid #fecaca!important}';
  
  // ====== OCULTAR BOTÓN "NUEVA SOLICITUD" EN DASHBOARD ======
  css += '.btn-institutional{display:none!important}';

  // ====== TABLAS ======
  css += 'th{background:#005235!important;color:#fff!important;padding:10px 14px!important;font-size:.74rem!important;font-weight:700!important;text-transform:uppercase}';
  css += 'td{padding:9px 14px!important;border-bottom:1px solid #f0f0f0!important;font-size:.84rem!important}';
  css += 'tbody tr:hover td{background:#f8faf9!important}';

  // ====== SIDEBAR ======
  css += 'div[style*="linear-gradient(180deg, #0A3D1F"]{background:linear-gradient(180deg,#00462e,#002b1c)!important}';
  css += '[data-sicip-active="1"]{background:rgba(39,174,96,.3)!important;border-left:4px solid #5cff5c!important;color:#fff!important;font-weight:700!important}';
  css += 'nav button[style*="rgba(39,174,96"]:not([data-sicip-active="1"]){background:transparent!important;border-left:4px solid transparent!important;color:rgba(255,255,255,.72)!important;font-weight:500!important}';

  // ====== BADGES ======
  css += 'div[style*="background: #dcfce7"]{background:#ecfdf5!important;color:#065f46!important;border-radius:8px!important;font-weight:600!important;padding:4px 10px!important}';
  css += 'div[style*="background: #fee2e2"]{background:#fef2f2!important;color:#991b1b!important;border-radius:8px!important;font-weight:600!important;padding:4px 10px!important}';

  // ====== INPUTS ======
  css += 'input:not([type="checkbox"]):not([type="radio"]),select,textarea{border:1.5px solid #d1d5db!important;border-radius:10px!important;padding:10px 12px!important;font-size:.9rem!important}';
  css += 'input:not([type="checkbox"]):not([type="radio"]):focus,select:focus,textarea:focus{border-color:#005235!important;box-shadow:0 0 0 3px rgba(0,82,53,.08)!important;outline:none!important}';

  // ====== OVERFLOW FIX MOBILE ======
  css += 'main *,[role="main"] *{max-width:100vw!important;overflow-x:hidden!important}';

  // ====== MOBILE 768 ======
  css += '@media(max-width:768px){main,[role="main"],#root>div>div>div:last-child{padding:1rem!important}input,select,textarea{font-size:16px!important}h1{font-size:1.3rem!important}h2{font-size:1.1rem!important}th,td{padding:6px 8px!important;font-size:.72rem!important}}';

  // ====== MOBILE 480 ======
  css += '@media(max-width:480px){main,[role="main"],#root>div>div>div:last-child{padding:.75rem!important}h1{font-size:1.2rem!important}h2{font-size:1rem!important}div[style*="max-width: 440px"],div[style*="max-width: 460px"],div[style*="maxWidth: 440"],div[style*="maxWidth: 460"]{max-width:100%!important;margin-left:8px!important;margin-right:8px!important}div[style*="padding: 2.5rem"]{padding:1rem!important}div[style*="display: grid"]{gap:.5rem!important}div[style*="gridTemplateColumns"],div[style*="grid-template-columns"]{grid-template-columns:1fr!important}div[style*="flexWrap: wrap"]>*{flex:1 1 100%!important;min-width:100%!important}}';

  // ====== LOGIN MÓVIL: EVITAR ENCABEZADO CORTADO ======
  css += '@media(max-width:560px){div[style*="display: flex"][style*="min-height: 100dvh"][style*="justify-content: center"]{align-items:center!important;justify-content:flex-start!important;flex-direction:column!important;min-height:100svh!important;height:auto!important;padding:calc(env(safe-area-inset-top,0px) + 10px) 10px calc(118px + env(safe-area-inset-bottom,0px))!important;overflow-y:auto!important;overflow-x:hidden!important;background:linear-gradient(180deg,#00462e,#002b1c)!important}div[style*="position: fixed"][style*="top: 1.5rem"][style*="translateX(-50%)"]{position:static!important;top:auto!important;left:auto!important;transform:none!important;margin:0 auto 10px!important;width:calc(100vw - 20px)!important;max-width:430px!important;box-sizing:border-box!important;padding:.44rem .62rem!important;font-size:.62rem!important;line-height:1.18!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;justify-content:center!important;text-align:center!important;gap:.32rem!important;flex-wrap:wrap!important;z-index:1!important}div[style*="position: fixed"][style*="top: 1.5rem"][style*="translateX(-50%)"] span{display:inline!important;white-space:normal!important;min-width:0!important}div[style*="max-width: 440px"][style*="box-shadow: 0 20px 60px"]{margin:0 auto!important;padding:1.15rem 1.05rem!important;border-radius:1.15rem!important;max-height:none!important;overflow:visible!important}div[style*="max-width: 440px"] div[style*="margin-bottom: 2rem"]{margin-bottom:1rem!important;margin-top:.1rem!important}div[style*="max-width: 440px"] svg[width="72"]{width:54px!important;height:54px!important}div[style*="max-width: 440px"] h1{font-size:1.62rem!important;line-height:1.05!important}div[style*="max-width: 440px"] form{gap:.76rem!important}div[style*="max-width: 440px"] div[style*="margin-top: 2rem"]{margin-top:1rem!important;padding-top:.7rem!important}}';

  // ====== INYECTAR CSS ======
  if (!document.getElementById('sicip-pro-v5-css')) {
    var style = document.createElement('style');
    style.id = 'sicip-pro-v5-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ====== FIX TEXTOS ======
  function fixTexts(root) {
    var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    var n, c = 0;
    while ((n = w.nextNode())) {
      if (!n.nodeValue) continue;
      var v = n.nodeValue, changed = false;
      var fixes = {
        'x Vencer':'Por vencer','x Solicitud':'Por Solicitud','x solicitud':'Por solicitud',
        'x Tramite':'Por Tramite','x tramite':'Por tramite','x Pase':'Por Pase','x pase':'Por pase',
        'x Licencia':'Por Licencia','x licencia':'Por licencia','x Recepcion':'Por Recepcion',
        'x recepcion':'Por recepcion','x Contrato':'Por Contrato','x contrato':'Por contrato',
        'x Vacaciones':'Por Vacaciones','x vacaciones':'Por vacaciones','x Guardia':'Por Guardia',
        'x guardia':'Por guardia','x Nivelacion':'Por Nivelacion','x nivelacion':'Por nivelacion',
        'x Sustitucion':'Por Sustitucion','x sustitucion':'Por sustitucion','x Tiempo':'Por Tiempo',
        'x tiempo':'Por tiempo'
      };
      for (var k in fixes) { if (v.indexOf(k) >= 0) { v = v.split(k).join(fixes[k]); changed = true; } }
      if (/^\s*x [A-Z]/.test(v)) { v = v.replace(/^(\s*)x ([A-Z])/, '$1Por $2'); changed = true; }
      if (/([A-Za-z\u00c0-\u024f])\/([A-Za-z\u00c0-\u024f])/.test(v)) { var b = v; v = v.replace(/([A-Za-z\u00c0-\u024f])\/([A-Za-z\u00c0-\u024f])/g, '$1 $2'); if (v !== b) changed = true; }
      var t = v.replace(/[\u2190\u2B05\uFE0E]\s*/g, '').trim();
      if (t === 'Volver' || t === 'Volver a la lista' || t === 'Ir al inicio' || t === 'Ir a inicio' || t === 'Volver al inicio' || t === 'Inicio' || (t.indexOf('Volver') >= 0 && t.indexOf('inicio') >= 0)) {
        var p = n.parentElement;
        if (p && !p.closest('nav') && !p.closest('aside') && !p.closest('[role="navigation"]')) {
          if (p.children.length <= 3 && (p.tagName === 'BUTTON' || p.tagName === 'A' || p.getAttribute('role') === 'button' || p.style.cursor === 'pointer')) { p.style.display = 'none'; c++; }
          var g = p.parentElement;
          if (g && g.children.length <= 2 && !g.closest('nav') && !g.closest('aside') && g.offsetHeight < 60) { g.style.display = 'none'; c++; }
        }
        continue;
      }
      if ((t === 'Inicio' || t.indexOf('Volver') === 0) && p && (p.tagName === 'A' || p.tagName === 'BUTTON') && !p.closest('nav') && !p.closest('aside')) { p.style.display = 'none'; c++; continue; }
      if (changed) { n.nodeValue = v; c++; }
    }
    if (c) console.log('[SICIP v5] Textos corregidos: ' + c);
  }

  // ====== SIDEBAR SINGLE ACTIVE ======
  function fixSidebar() {
    var btns = document.querySelectorAll('nav button, aside button, div[style*="linear-gradient(180deg"] button');
    var cp = window.location.pathname.replace(/\/$/, '') || '/';
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      var lb = (btn.textContent || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var act = false;
      if (cp === '/' && (lb === 'inicio' || lb === 'dashboard' || lb === 'panel')) act = true;
      if (cp.indexOf('/solicitudes') >= 0 && lb === 'solicitudes') act = true;
      if (cp.indexOf('/contrato') >= 0 && lb === 'contrato') act = true;
      if (cp.indexOf('/cuadro') >= 0 && (lb.indexOf('cuadro') >= 0 || lb.indexOf('reemplazo') >= 0)) act = true;
      if (cp.indexOf('/pases') >= 0 && lb === 'pases') act = true;
      if (cp.indexOf('/licencias') >= 0 && lb === 'licencias') act = true;
      if (cp.indexOf('/recepcion') >= 0 && lb === 'recepciones') act = true;
      if (cp.indexOf('/reportes') >= 0 && lb === 'reportes') act = true;
      if (cp.indexOf('/plantilla') >= 0 && lb === 'plantilla') act = true;
      if (cp.indexOf('/plazas') >= 0 && lb === 'plazas') act = true;
      if (cp.indexOf('/vacantes') >= 0 && lb === 'vacantes') act = true;
      if (cp.indexOf('/admin') >= 0 && (lb === 'administracion' || lb === 'admin')) act = true;
      if (cp.indexOf('/tramites') >= 0 && (lb === 'mis tramites' || lb === 'tramites')) act = true;
      if (cp.indexOf('/tramite') >= 0 && lb === 'nuevo tramite') act = true;
      if (cp.indexOf('/bandeja') >= 0 && lb === 'bandeja') act = true;
      if (cp.indexOf('/herramientas') >= 0 && lb === 'herramientas') act = true;
      if (act) { btn.setAttribute('data-sicip-active', '1'); }
      else { btn.removeAttribute('data-sicip-active'); }
    }
  }

  function run() {
    fixTexts(document.body);
    fixSidebar();
  }

  var t = null;
  function sched() { clearTimeout(t); t = setTimeout(run, 80); }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', sched); }
  else { sched(); }

  window.addEventListener('hashchange', sched);
  window.addEventListener('popstate', sched);
  document.addEventListener('click', function(e) {
    if (e.target.closest('nav button, aside button, nav a, aside a')) { setTimeout(sched, 200); }
  });

  new MutationObserver(function() { sched(); }).observe(document.documentElement, { childList: true, subtree: true });

  window.__SICIP_V5 = { version: VERSION, run: run };
  console.log('[SICIP v' + VERSION + '] Listo — CSS directo, sin JS frágil para el hero verde');
})();
