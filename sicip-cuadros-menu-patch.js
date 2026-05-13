// SICIP Cuadros Menu Patch v5.1
// - Acordeón "Cuadros de Reemplazo" con 3 submódulos
// - Mi Cuadro: panel inline INSTANT con fondo completo y botón volver
// - Resumen CR: navega a /aprobacion esperando datos

(function() {
  'use strict';
  
  var VERSION = '5.1.0';
  
  function log(msg) { console.log('[SICIP-Cuadros v' + VERSION + '] ' + msg); }
  
  function getUsuario() {
    try { var s = sessionStorage.getItem('sicip_usuario'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }
  
  function getSicipData() { return window.__SICIP_DATA__ || {}; }
  
  function waitForData(callback, timeoutMs) {
    var maxTime = timeoutMs || 15000;
    var start = Date.now();
    function check() {
      var data = getSicipData();
      if (data.cuadros && data.cuadros.length > 0 && data.jefesServicio && data.jefesServicio.length > 0) {
        callback(data);
        return;
      }
      if (Date.now() - start > maxTime) {
        log('Timeout esperando datos, usando lo disponible');
        callback(getSicipData());
        return;
      }
      setTimeout(check, 100);
    }
    check();
  }
  
  // ========== MI CUADRO - Panel con fondo completo ==========
  function buildMiCuadroPanel(usuario) {
    var data = getSicipData();
    var matricula = usuario.matricula;
    var nombre = (usuario.nombre || '').replace(/\//g, ' ');
    var puesto = usuario.puesto || usuario.descripcion || '';
    
    var cuadro = null;
    var jefe = null;
    
    if (data.cuadros && data.cuadros.length > 0) {
      cuadro = data.cuadros.find(function(c) { return String(c.jefeMatricula || c.id) === String(matricula); });
    }
    if (data.jefesServicio && data.jefesServicio.length > 0) {
      jefe = data.jefesServicio.find(function(j) { return String(j.matricula || j.id) === String(matricula); });
    }
    if (!cuadro) { try { var cache = sessionStorage.getItem('sicip_cuadros_cache'); if (cache) { var cd = JSON.parse(cache); cuadro = cd[matricula]; } } catch(e) {} }
    if (!jefe) { try { var jcache = sessionStorage.getItem('sicip_jefes_cache'); if (jcache) { var jd = JSON.parse(jcache); jefe = jd.find(function(j){return String(j.matricula)===String(matricula);}); } } catch(e) {} }
    
    var status = cuadro ? (cuadro.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR';
    var candidatos = cuadro ? (cuadro.candidatos || []) : [];
    var numCandidatos = candidatos.length;
    
    var SL = {'SIN_ASIGNAR':'Sin Asignar','PARCIAL':'Parcial','COMPLETO':'Completo','CERRADO':'Cerrado'};
    var SC = {'SIN_ASIGNAR':'#ef4444','PARCIAL':'#f59e0b','COMPLETO':'#10b981','CERRADO':'#005235'};
    var SB = {'SIN_ASIGNAR':'#fef2f2','PARCIAL':'#fffbeb','COMPLETO':'#f0fdf4','CERRADO':'#e8f5e9'};
    var sL = SL[status]||status; var sC = SC[status]||'#6b7280'; var sB = SB[status]||'#f3f4f6';
    
    var depto = (jefe&&jefe.departamentoNombre)||usuario.departamentoNombre||'';
    var localidad = jefe?jefe.localidad||'':'';
    var turno = jefe?jefe.turno||'':'';
    
    var candHtml = '';
    if (numCandidatos > 0) {
      candHtml = [].concat(candidatos).sort(function(a,b){return(a.posicion||0)-(b.posicion||0)}).map(function(c){
        return '<div style="display:flex;align-items:center;gap:0.75rem;background:#f0fdf4;border:1px solid #c8e6c9;border-radius:8px;padding:0.7rem 0.9rem;margin-bottom:0.5rem">'+
          '<div style="width:30px;height:30px;border-radius:50%;background:#005235;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.85rem;flex-shrink:0">'+(c.posicion||'?')+'</div>'+
          '<div style="flex:1"><div style="font-weight:700;font-size:0.85rem;color:#111827">'+(c.nombre||'').replace(/\//g,' ')+'</div>'+
          '<div style="font-size:0.72rem;color:#6b7280">Mat. '+(c.matricula||'')+(c.descripcion?' · '+c.descripcion:'')+'</div></div></div>';
      }).join('');
    } else {
      candHtml = '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.85rem">Sin candidatos asignados aún</div>';
    }
    
    var reqHtml = '';
    if (cuadro&&(cuadro.escolaridadRequerida||cuadro.experienciaRequerida)) {
      reqHtml = '<div style="margin-top:1rem"><h4 style="margin:0 0 0.5rem;font-size:0.88rem;font-weight:700;color:#005235">📋 Requisitos de Convocatoria</h4>'+
        '<div style="font-size:0.82rem;color:#374151">'+
        (cuadro.escolaridadRequerida?'<div style="margin-bottom:0.3rem"><strong>Escolaridad:</strong> '+cuadro.escolaridadRequerida+'</div>':'')+
        (cuadro.experienciaRequerida?'<div><strong>Experiencia:</strong> '+cuadro.experienciaRequerida+'</div>':'')+'</div></div>';
    }
    
    // Fondo: ocupar todo el viewport
    return '<div data-sicip-cr-panel="mi-cuadro" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;background:#f9fafb;padding:1.5rem 1rem">'+
      '<div style="max-width:860px;margin:0 auto">'+
        '<div style="margin-bottom:1.25rem">'+
          '<button onclick="var p=document.querySelector(\'[data-sicip-cr-panel]\');if(p)p.remove();var r=document.getElementById(\'root\');if(r)r.style.display=\'\';var ms=document.querySelectorAll(\'main\');for(var i=0;i<ms.length;i++)ms[i].style.display=\'\';" style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:#005235;font-weight:600;padding:0 0 1rem 0;display:flex;align-items:center;gap:6px">← Volver al inicio</button>'+
          '<h2 style="margin:0;font-size:1.2rem;font-weight:800;color:#003324">Mi Cuadro de Reemplazo</h2>'+
          '<p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.8rem">'+nombre+(puesto?' · '+puesto:'')+'</p>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;gap:0.85rem">'+
          '<div style="background:'+sB+';border:2px solid '+sC+'20;border-radius:12px;padding:1rem 1.25rem">'+
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'+
              '<div><div style="font-size:0.7rem;font-weight:700;color:'+sC+';text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">Estatus</div>'+
              '<div style="font-size:1.1rem;font-weight:800;color:'+sC+'">'+sL+' — '+numCandidatos+'/3 candidatos</div></div>'+
              '<span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:999px;background:'+sC+';color:white">'+sL+'</span></div></div>'+
          '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem">'+
            '<div style="font-size:0.7rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">Jefe de Servicio</div>'+
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.5rem;font-size:0.82rem">'+
              '<div><span style="color:#888">Nombre:</span> <strong>'+nombre+'</strong></div>'+
              '<div><span style="color:#888">Matrícula:</span> <strong>'+matricula+'</strong></div>'+
              (depto?'<div><span style="color:#888">Depto:</span> <strong>'+depto+'</strong></div>':'')+
              (localidad?'<div><span style="color:#888">Localidad:</span> <strong>'+localidad+'</strong></div>':'')+
              (turno?'<div><span style="color:#888">Turno:</span> <strong>'+turno+'</strong></div>':'')+'</div></div>'+
          '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem">'+
            '<div style="font-size:0.7rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem">Candidatos de la Terna</div>'+
            candHtml+'</div>'+reqHtml+'</div></div></div>';
  }
  
  function showMiCuadro(usuario) {
    log('🔍 Mostrando Mi Cuadro...');
    // Eliminar panel anterior
    var old = document.querySelector('[data-sicip-cr-panel]');
    if (old) old.remove();
    // Ocultar root de React completamente
    var root = document.getElementById('root');
    if (root) root.style.display = 'none';
    var mains = document.querySelectorAll('main');
    for (var i = 0; i < mains.length; i++) mains[i].style.display = 'none';
    // Insertar panel
    var temp = document.createElement('div');
    temp.innerHTML = buildMiCuadroPanel(usuario);
    document.body.appendChild(temp.firstChild);
    log('✅ Mi Cuadro mostrado');
  }
  
  // ========== ACORDEON ==========
  function createSubItem(key, label, iconSvg, onClick) {
    var el = document.createElement('button');
    el.setAttribute('data-sicip-sub', key);
    el.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.65rem;padding:0.6rem 1rem 0.6rem 2rem;border:none;cursor:pointer;font-size:0.82rem;font-weight:500;color:rgba(255,255,255,0.65);background:rgba(0,0,0,0.15);border-left:3px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,sans-serif';
    el.innerHTML = '<span style="color:rgba(255,255,255,0.5);flex-shrink:0;width:16px;display:flex;align-items:center;justify-content:center">'+iconSvg+'</span><span>'+label+'</span>';
    el.addEventListener('click', function(e) { e.stopPropagation(); onClick(); });
    el.addEventListener('mouseenter', function() { this.style.background = 'rgba(255,255,255,0.1)'; });
    el.addEventListener('mouseleave', function() { this.style.background = 'rgba(0,0,0,0.15)'; });
    return el;
  }
  
  function buildAccordion(usuario) {
    var rol = usuario.rol;
    var isAdmin = rol === 'ADMIN';
    var isAP = rol === 'AREA_PERSONAL';
    var isJS = rol === 'JEFE_SERVICIO';
    var matricula = usuario.matricula || '';
    
    var container = document.createElement('div');
    container.setAttribute('data-sicip-mod', 'cuadros');
    
    // Header del acordeón
    var header = document.createElement('button');
    header.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1rem;border:none;cursor:pointer;font-size:0.88rem;font-weight:600;color:rgba(255,255,255,0.85);background:transparent;border-left:4px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,sans-serif';
    header.innerHTML = '<span style="color:#5cff5c;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>'+
      '<span style="flex:1;text-align:left">Cuadros de Reemplazo</span>'+
      '<span data-sicip-arrow style="color:rgba(255,255,255,0.4);transition:transform 0.2s;font-size:0.65rem">▼</span>';
    
    var submenu = document.createElement('div');
    submenu.style.cssText = 'overflow:hidden;max-height:0;transition:max-height 0.25s ease-out;background:rgba(0,0,0,0.05)';
    
    var subitems = document.createElement('div');
    subitems.style.padding = '2px 0 4px 0';
    
    // Resumen CR
    subitems.appendChild(createSubItem('resumen-cr', 'Resumen CR',
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>',
      function() {
        // Ocultar panel si existe
        var p = document.querySelector('[data-sicip-cr-panel]'); if (p) p.remove();
        var r = document.getElementById('root'); if (r) r.style.display = '';
        var ms = document.querySelectorAll('main'); for (var i=0;i<ms.length;i++) ms[i].style.display = '';
        // Navegar a Resumen CR
        window.history.replaceState({}, '', '/aprobacion');
        window.dispatchEvent(new Event('popstate'));
      }
    ));
    
    // Mi Cuadro de Reemplazo
    if (isAdmin || isJS) {
      subitems.appendChild(createSubItem('mi-cuadro', 'Mi Cuadro de Reemplazo',
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        function() { showMiCuadro(usuario); }
      ));
    }
    
    // Solicitar Puesto de Confianza
    subitems.appendChild(createSubItem('solicitar-puesto', 'Solicitar Puesto de Confianza',
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      function() {
        var p = document.querySelector('[data-sicip-cr-panel]'); if (p) p.remove();
        var r = document.getElementById('root'); if (r) r.style.display = '';
        var ms = document.querySelectorAll('main'); for (var i=0;i<ms.length;i++) ms[i].style.display = '';
        window.history.replaceState({}, '', '/solicitar-puesto');
        window.dispatchEvent(new Event('popstate'));
      }
    ));
    
    submenu.appendChild(subitems);
    container.appendChild(header);
    container.appendChild(submenu);
    
    // Toggle acordeón
    header.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = submenu.style.maxHeight !== '0px' && submenu.style.maxHeight !== '';
      if (isOpen) {
        submenu.style.maxHeight = '0px';
        header.querySelector('[data-sicip-arrow]').style.transform = 'rotate(0deg)';
        header.style.background = 'transparent';
        header.style.borderLeftColor = 'transparent';
      } else {
        submenu.style.maxHeight = '300px';
        header.querySelector('[data-sicip-arrow]').style.transform = 'rotate(180deg)';
        header.style.background = 'rgba(39,174,96,0.15)';
        header.style.borderLeftColor = '#5cff5c';
      }
    });
    
    return container;
  }
  
  // ========== PATCH SIDEBAR ==========
  function patchSidebar() {
    var usuario = getUsuario();
    if (!usuario) return;
    
    var sidebar = document.querySelector('nav');
    if (!sidebar || !sidebar.querySelector('div')) return;
    var container = sidebar.querySelector('div');
    if (sidebar.querySelector('[data-sicip-mod="cuadros"]')) { log('Ya parcheado'); return; }
    
    // Ocultar botones React originales
    var allButtons = sidebar.querySelectorAll('button');
    for (var i = 0; i < allButtons.length; i++) {
      var btn = allButtons[i];
      var text = (btn.textContent || '').trim();
      if (text === 'Cuadros Reemplazo' || text === 'Mi Cuadro de Reemplazo' || text === 'Aprobaciones' || text === 'Crear Plaza' || text === 'Explorar Plazas') {
        btn.style.display = 'none';
        btn.setAttribute('data-sicip-hidden', '1');
      }
    }
    
    // Insertar acordeón después del primer botón visible
    var insertBefore = null;
    for (var i = 0; i < allButtons.length; i++) {
      if (allButtons[i].getAttribute('data-sicip-hidden') !== '1' && allButtons[i].offsetParent !== null) {
        var txt = (allButtons[i].textContent || '').trim();
        if (txt === 'Solicitudes' || txt === 'Bandeja de Trámites' || txt === 'Bandeja') {
          insertBefore = allButtons[i];
          break;
        }
      }
    }
    
    var accordion = buildAccordion(usuario);
    if (insertBefore) {
      container.insertBefore(accordion, insertBefore.nextSibling);
    } else if (container.firstChild) {
      container.insertBefore(accordion, container.firstChild.nextSibling);
    } else {
      container.appendChild(accordion);
    }
    
    log('✅ Acordeón "Cuadros de Reemplazo" insertado');
  }
  
  // ========== START ==========
  var started = false;
  var attempts = 0;
  
  function tryPatch() {
    if (started) return;
    attempts++;
    var sidebar = document.querySelector('nav');
    if (sidebar && sidebar.querySelector('div') && sidebar.querySelector('button') && !sidebar.querySelector('[data-sicip-mod="cuadros"]')) {
      started = true;
      log('Sidebar listo, parcheando...');
      patchSidebar();
      return;
    }
    if (attempts >= 50) return;
    setTimeout(tryPatch, 200);
  }
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(tryPatch, 50);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryPatch, 50); });
  }
  
  setTimeout(tryPatch, 300);
  setTimeout(tryPatch, 600);
  setTimeout(tryPatch, 1200);
  setTimeout(tryPatch, 2000);
  setTimeout(tryPatch, 3500);
  
  window.__SICIP_CUADROS_PATCH = { VERSION: VERSION };
  
  log('v' + VERSION + ' cargado');
})();
