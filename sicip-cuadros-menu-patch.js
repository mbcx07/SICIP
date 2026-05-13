// SICIP Cuadros Menu Patch v5.0
// - UN SOLO módulo "📋 Cuadros de Reemplazo" en el sidebar
// - Al hacer click se despliegan los 3 submódulos (acordeón)
// - Submódulos: Resumen CR, Mi Cuadro de Reemplazo, Solicitar Puesto de Confianza
// - "Mi Cuadro de Reemplazo" → panel inline instantáneo

(function() {
  'use strict';
  
  var VERSION = '5.0.0';
  
  function log(msg) {
    console.log('[SICIP-Cuadros v' + VERSION + '] ' + msg);
  }
  
  function getUsuario() {
    try {
      var s = sessionStorage.getItem('sicip_usuario');
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  }
  
  function getSicipData() {
    return window.__SICIP_DATA__ || {};
  }
  
  // ========== MI CUADRO DE REEMPLAZO - Panel ==========
  function buildMiCuadroPanel(usuario) {
    var data = getSicipData();
    var matricula = usuario.matricula;
    var nombre = (usuario.nombre || '').replace(/\//g, ' ');
    var puesto = usuario.puesto || usuario.descripcion || '';
    
    var cuadro = null;
    var jefe = null;
    
    if (data.cuadros && data.cuadros.length > 0) {
      cuadro = data.cuadros.find(function(c) {
        return String(c.jefeMatricula || c.id) === String(matricula);
      });
    }
    
    if (data.jefesServicio && data.jefesServicio.length > 0) {
      jefe = data.jefesServicio.find(function(j) {
        return String(j.matricula || j.id) === String(matricula);
      });
    }
    
    if (!cuadro) {
      try { var cache = window.sessionStorage.getItem('sicip_cuadros_cache'); if (cache) { var cacheData = JSON.parse(cache); cuadro = cacheData[matricula]; } } catch(e) {}
    }
    if (!jefe) {
      try { var jcache = window.sessionStorage.getItem('sicip_jefes_cache'); if (jcache) { var jcacheData = JSON.parse(jcache); jefe = jcacheData.find(function(j) { return String(j.matricula) === String(matricula); }); } } catch(e) {}
    }
    
    var status = cuadro ? (cuadro.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR';
    var candidatos = cuadro ? (cuadro.candidatos || []) : [];
    var numCandidatos = candidatos.length;
    
    var statusLabels = {'SIN_ASIGNAR':'Sin Asignar','PARCIAL':'Parcial','COMPLETO':'Completo','CERRADO':'Cerrado'};
    var statusColors = {'SIN_ASIGNAR':'#ef4444','PARCIAL':'#f59e0b','COMPLETO':'#10b981','CERRADO':'#005235'};
    var statusBgs = {'SIN_ASIGNAR':'#fef2f2','PARCIAL':'#fffbeb','COMPLETO':'#f0fdf4','CERRADO':'#e8f5e9'};
    
    var sLabel = statusLabels[status]||status;
    var sColor = statusColors[status]||'#6b7280';
    var sBg = statusBgs[status]||'#f3f4f6';
    
    var depto = (jefe && jefe.departamentoNombre) ? jefe.departamentoNombre : (usuario.departamentoNombre || '');
    var localidad = jefe ? (jefe.localidad || '') : '';
    var turno = jefe ? (jefe.turno || '') : '';
    
    var candHtml = '';
    if (numCandidatos > 0) {
      candHtml = [].concat(candidatos).sort(function(a,b){return (a.posicion||0)-(b.posicion||0)}).map(function(c){
        return '<div style="display:flex;align-items:center;gap:0.75rem;background:#f0fdf4;border:1px solid #c8e6c9;border-radius:8px;padding:0.7rem 0.9rem;margin-bottom:0.5rem">' +
          '<div style="width:30px;height:30px;border-radius:50%;background:#005235;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.85rem;flex-shrink:0">' + (c.posicion||'?') + '</div>' +
          '<div style="flex:1"><div style="font-weight:700;font-size:0.85rem;color:#111827">' + (c.nombre||'').replace(/\//g,' ') + '</div>' +
          '<div style="font-size:0.72rem;color:#6b7280">Mat. ' + (c.matricula||'') + (c.descripcion?' · '+c.descripcion:'') + '</div></div></div>';
      }).join('');
    } else {
      candHtml = '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.85rem">Sin candidatos asignados aún</div>';
    }
    
    var reqHtml = '';
    if (cuadro && (cuadro.escolaridadRequerida||cuadro.experienciaRequerida)) {
      reqHtml = '<div style="margin-top:1rem"><h4 style="margin:0 0 0.5rem;font-size:0.88rem;font-weight:700;color:#005235">📋 Requisitos de Convocatoria</h4>' +
        '<div style="font-size:0.82rem;color:#374151">' +
        (cuadro.escolaridadRequerida?'<div style="margin-bottom:0.3rem"><strong>Escolaridad:</strong> '+cuadro.escolaridadRequerida+'</div>':'') +
        (cuadro.experienciaRequerida?'<div><strong>Experiencia:</strong> '+cuadro.experienciaRequerida+'</div>':'') + '</div></div>';
    }
    
    return '<div data-sicip-cr-panel="mi-cuadro" style="flex:1;overflow-x:hidden;min-height:calc(100dvh - 56px);padding:1.5rem 1rem 0;background:#f9fafb">' +
      '<div style="max-width:860px;margin:0 auto">' +
        '<div style="margin-bottom:1.25rem">' +
          '<button onclick="(function(){var p=document.querySelector(\'[data-sicip-cr-panel]\');if(p)p.remove();var r=document.getElementById(\'root\');if(r)r.style.display=\'\';var m=document.querySelectorAll(\'main\');for(var i=0;i<m.length;i++)m[i].style.display=\'\';})()" style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:#005235;font-weight:600;padding:0 0 1rem 0;display:flex;align-items:center;gap:6px">← Volver al inicio</button>' +
          '<h2 style="margin:0;font-size:1.2rem;font-weight:800;color:#003324">Mi Cuadro de Reemplazo</h2>' +
          '<p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.8rem">' + nombre + (puesto?' · '+puesto:'') + '</p>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:0.85rem">' +
          '<div style="background:'+sBg+';border:2px solid '+sColor+'20;border-radius:12px;padding:1rem 1.25rem">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
              '<div><div style="font-size:0.7rem;font-weight:700;color:'+sColor+';text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">Estatus</div>' +
              '<div style="font-size:1.1rem;font-weight:800;color:'+sColor+'">'+sLabel+' — '+numCandidatos+'/3 candidatos</div></div>' +
              '<span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:999px;background:'+sColor+';color:white">'+sLabel+'</span></div></div>' +
          '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem">' +
            '<div style="font-size:0.7rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">Jefe de Servicio</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.5rem;font-size:0.82rem">' +
              '<div><span style="color:#888">Nombre:</span> <strong>'+nombre+'</strong></div>' +
              '<div><span style="color:#888">Matrícula:</span> <strong>'+matricula+'</strong></div>' +
              (depto?'<div><span style="color:#888">Depto:</span> <strong>'+depto+'</strong></div>':'') +
              (localidad?'<div><span style="color:#888">Localidad:</span> <strong>'+localidad+'</strong></div>':'') +
              (turno?'<div><span style="color:#888">Turno:</span> <strong>'+turno+'</strong></div>':'') + '</div></div>' +
          '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem">' +
            '<div style="font-size:0.7rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem">Candidatos de la Terna</div>' +
            candHtml + '</div>' + reqHtml + '</div></div></div>';
  }
  
  function showMiCuadro(usuario) {
    log('🔍 Mostrando Mi Cuadro...');
    var old = document.querySelector('[data-sicip-cr-panel]');
    if (old) old.remove();
    var root = document.getElementById('root');
    if (root) root.style.display = 'none';
    var mains = document.querySelectorAll('main');
    for (var i = 0; i < mains.length; i++) mains[i].style.display = 'none';
    var temp = document.createElement('div');
    temp.innerHTML = buildMiCuadroPanel(usuario);
    document.body.appendChild(temp.firstChild);
  }
  
  // ========== ACORDEON: menú desplegable ==========
  var accordionState = {};
  
  function createAccordionItem(key, label, iconSvg, onClick) {
    var item = document.createElement('button');
    item.setAttribute('data-sicip-sub', key);
    item.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1rem 0.65rem 2.2rem;border:none;cursor:pointer;font-size:0.82rem;font-weight:500;color:rgba(255,255,255,0.65);background:rgba(0,0,0,0.15);border-left:3px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif';
    item.innerHTML = '<span style="color:rgba(255,255,255,0.5);flex-shrink:0;width:18px;display:flex;align-items:center;justify-content:center">'+iconSvg+'</span><span>'+label+'</span>';
    item.addEventListener('click', function(e) { e.stopPropagation(); onClick(); });
    item.addEventListener('mouseenter', function() { this.style.background = 'rgba(255,255,255,0.1)'; });
    item.addEventListener('mouseleave', function() { this.style.background = 'rgba(0,0,0,0.15)'; });
    return item;
  }
  
  function buildAccordion(usuario) {
    var rol = usuario.rol;
    var isAdmin = rol === 'ADMIN';
    var isAP = rol === 'AREA_PERSONAL';
    var isJS = rol === 'JEFE_SERVICIO';
    var matricula = usuario.matricula || '';
    
    var container = document.createElement('div');
    container.setAttribute('data-sicip-mod', 'cuadros');
    
    // HEADER del acordeón
    var header = document.createElement('button');
    header.setAttribute('data-sicip-accordion', 'toggle');
    header.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;border:none;cursor:pointer;font-size:0.88rem;font-weight:600;color:rgba(255,255,255,0.85);background:transparent;border-left:4px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif';
    header.innerHTML = '<span style="color:#5cff5c;flex-shrink:0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>' +
      '<span style="flex:1;text-align:left">Cuadros de Reemplazo</span>' +
      '<span data-sicip-arrow style="color:rgba(255,255,255,0.4);transition:transform 0.2s;font-size:0.7rem">▼</span>';
    
    // SUBMÓDULOS (inicialmente ocultos)
    var submenu = document.createElement('div');
    submenu.setAttribute('data-sicip-submenu', '');
    submenu.style.cssText = 'overflow:hidden;max-height:0;transition:max-height 0.25s ease-out;background:rgba(0,0,0,0.05)';
    
    var subitems = document.createElement('div');
    subitems.style.cssText = 'padding:2px 0 4px 0';
    
    // a) Resumen CR
    subitems.appendChild(createAccordionItem('resumen-cr', 'Resumen CR',
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>',
      function() {
        hidePanel();
        window.history.replaceState({}, '', '/aprobacion');
        window.dispatchEvent(new Event('popstate'));
      }
    ));
    
    // b) Mi Cuadro de Reemplazo (panel inline)
    if (isAdmin || isJS) {
      subitems.appendChild(createAccordionItem('mi-cuadro', 'Mi Cuadro de Reemplazo',
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        function() { showMiCuadro(usuario); }
      ));
    }
    
    // c) Solicitar Puesto de Confianza
    subitems.appendChild(createAccordionItem('solicitar-puesto', 'Solicitar Puesto de Confianza',
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      function() {
        hidePanel();
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
        submenu.style.maxHeight = submenu.scrollHeight + 'px';
        // Force recalc height after items are rendered
        requestAnimationFrame(function() {
          submenu.style.maxHeight = subitems.offsetHeight + 8 + 'px';
        });
        header.querySelector('[data-sicip-arrow]').style.transform = 'rotate(180deg)';
        header.style.background = 'rgba(39,174,96,0.15)';
        header.style.borderLeftColor = '#5cff5c';
      }
    });
    
    return container;
  }
  
  function hidePanel() {
    var panel = document.querySelector('[data-sicip-cr-panel]');
    if (panel) panel.remove();
    var root = document.getElementById('root');
    if (root) root.style.display = '';
    var mains = document.querySelectorAll('main');
    for (var i = 0; i < mains.length; i++) mains[i].style.display = '';
  }
  
  // ========== PATCH SIDEBAR ==========
  function patchSidebar() {
    var usuario = getUsuario();
    if (!usuario) return;
    
    var sidebar = document.querySelector('nav');
    if (!sidebar || !sidebar.querySelector('div')) return;
    
    var container = sidebar.querySelector('div');
    
    // Already patched?
    if (sidebar.querySelector('[data-sicip-mod="cuadros"]')) {
      log('Ya parcheado');
      return;
    }
    
    // 1. Ocultar botones React originales que no queremos
    var allButtons = sidebar.querySelectorAll('button');
    for (var i = 0; i < allButtons.length; i++) {
      var btn = allButtons[i];
      var text = (btn.textContent || '').trim();
      if (text === 'Cuadros Reemplazo' || text === 'Mi Cuadro de Reemplazo' || text === 'Aprobaciones' || text === 'Crear Plaza' || text === 'Explorar Plazas') {
        btn.style.display = 'none';
        btn.setAttribute('data-sicip-hidden', '1');
      }
    }
    
    // 2. Encontrar dónde insertar (después de "Solicitudes" o al inicio)
    var insertAfter = null;
    for (var i = 0; i < allButtons.length; i++) {
      if (allButtons[i].getAttribute('data-sicip-hidden') !== '1' && allButtons[i].offsetParent !== null) {
        var txt = (allButtons[i].textContent || '').trim();
        if (txt === 'Solicitudes' || txt === 'Bandeja de Trámites' || txt === 'Bandeja') {
          insertAfter = allButtons[i];
          break;
        }
      }
    }
    
    // 3. Construir acordeón e insertar
    var accordion = buildAccordion(usuario);
    
    if (insertAfter && insertAfter.nextElementSibling) {
      insertAfter.parentNode.insertBefore(accordion, insertAfter.nextElementSibling);
    } else if (container.firstChild) {
      container.insertBefore(accordion, container.firstChild.nextSibling || container.firstChild);
    } else {
      container.appendChild(accordion);
    }
    
    log('✅ Acordeón "Cuadros de Reemplazo" insertado');
  }
  
  // ========== START ==========
  var started = false;
  var attempts = 0;
  var maxAttempts = 50;
  
  function tryPatch() {
    if (started) return;
    attempts++;
    
    var sidebar = document.querySelector('nav');
    if (sidebar && sidebar.querySelector('div') && sidebar.querySelector('button')) {
      started = true;
      log('Sidebar encontrado, parcheando...');
      patchSidebar();
      return;
    }
    
    if (attempts >= maxAttempts) return;
    setTimeout(tryPatch, 200);
  }
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(tryPatch, 100);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryPatch, 100); });
  }
  
  setTimeout(tryPatch, 500);
  setTimeout(tryPatch, 1000);
  setTimeout(tryPatch, 1500);
  setTimeout(tryPatch, 2500);
  setTimeout(tryPatch, 4000);
  
  window.__SICIP_CUADROS_PATCH = { VERSION: VERSION, patchSidebar: patchSidebar, showMiCuadro: showMiCuadro };
  
  log('v' + VERSION + ' cargado');
})();
