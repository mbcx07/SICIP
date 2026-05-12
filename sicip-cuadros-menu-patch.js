// SICIP Cuadros Menu Patch v4.0
// - Agrupa los 3 submódulos bajo "📋 Cuadros de Reemplazo"
// - Cambia "Cuadros Reemplazo" → "Resumen CR" (submódulo)
// - "Mi Cuadro de Reemplazo" → panel inline instantáneo
// - "Solicitar Puesto de Confianza" → el botón React original

(function() {
  'use strict';
  
  var VERSION = '4.0.0';
  
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
  
  // ========== MI CUADRO DE REEMPLAZO - Panel Inline ==========
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
      try {
        var cache = window.sessionStorage.getItem('sicip_cuadros_cache');
        if (cache) {
          var cacheData = JSON.parse(cache);
          cuadro = cacheData[matricula];
        }
      } catch(e) {}
    }
    
    if (!jefe) {
      try {
        var jcache = window.sessionStorage.getItem('sicip_jefes_cache');
        if (jcache) {
          var jcacheData = JSON.parse(jcache);
          jefe = jcacheData.find(function(j) { return String(j.matricula) === String(matricula); });
        }
      } catch(e) {}
    }
    
    var status = cuadro ? (cuadro.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR';
    var candidatos = cuadro ? (cuadro.candidatos || []) : [];
    var numCandidatos = candidatos.length;
    
    var STATUS_LABELS = {
      'SIN_ASIGNAR': 'Sin Asignar',
      'PARCIAL': 'Parcial',
      'COMPLETO': 'Completo',
      'CERRADO': 'Cerrado'
    };
    var STATUS_COLORS = {
      'SIN_ASIGNAR': '#ef4444',
      'PARCIAL': '#f59e0b',
      'COMPLETO': '#10b981',
      'CERRADO': '#005235'
    };
    var STATUS_BG = {
      'SIN_ASIGNAR': '#fef2f2',
      'PARCIAL': '#fffbeb',
      'COMPLETO': '#f0fdf4',
      'CERRADO': '#e8f5e9'
    };
    
    var statusLabel = STATUS_LABELS[status] || status;
    var statusColor = STATUS_COLORS[status] || '#6b7280';
    var statusBg = STATUS_BG[status] || '#f3f4f6';
    
    var departamento = (jefe && jefe.departamentoNombre) ? jefe.departamentoNombre : (usuario.departamentoNombre || '');
    var localidad = jefe ? (jefe.localidad || '') : '';
    var turno = jefe ? (jefe.turno || '') : '';
    
    var candidatosHTML = '';
    if (numCandidatos > 0) {
      var sorted = [].concat(candidatos).sort(function(a, b) { return (a.posicion || 0) - (b.posicion || 0); });
      candidatosHTML = sorted.map(function(c) {
        var pos = c.posicion || '?';
        var cNombre = (c.nombre || '').replace(/\//g, ' ');
        var cMat = c.matricula || '';
        var cDesc = c.descripcion || '';
        return '<div style="display:flex;align-items:center;gap:0.75rem;background:#f0fdf4;border:1px solid #c8e6c9;border-radius:8px;padding:0.7rem 0.9rem;margin-bottom:0.5rem">' +
          '<div style="width:30px;height:30px;border-radius:50%;background:#005235;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.85rem;flex-shrink:0">' + pos + '</div>' +
          '<div style="flex:1">' +
            '<div style="font-weight:700;font-size:0.85rem;color:#111827">' + cNombre + '</div>' +
            '<div style="font-size:0.72rem;color:#6b7280">Mat. ' + cMat + (cDesc ? ' · ' + cDesc : '') + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    } else {
      candidatosHTML = '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.85rem">Sin candidatos asignados aún</div>';
    }
    
    var requisitosHTML = '';
    if (cuadro && (cuadro.escolaridadRequerida || cuadro.experienciaRequerida)) {
      requisitosHTML = '<div style="margin-top:1rem">' +
        '<h4 style="margin:0 0 0.5rem;font-size:0.88rem;font-weight:700;color:#005235">📋 Requisitos de Convocatoria</h4>' +
        '<div style="font-size:0.82rem;color:#374151">' +
          (cuadro.escolaridadRequerida ? '<div style="margin-bottom:0.3rem"><strong>Escolaridad:</strong> ' + cuadro.escolaridadRequerida + '</div>' : '') +
          (cuadro.experienciaRequerida ? '<div><strong>Experiencia:</strong> ' + cuadro.experienciaRequerida + '</div>' : '') +
        '</div>' +
      '</div>';
    }
    
    return '<div data-sicip-cr-panel="mi-cuadro" style="flex:1;overflow-x:hidden;min-height:calc(100dvh - 56px);padding:1.5rem 1rem 0">' +
      '<div style="max-width:860px;margin:0 auto">' +
        '<div style="margin-bottom:1.25rem">' +
          '<h2 style="margin:0;font-size:1.2rem;font-weight:800;color:#003324">Mi Cuadro de Reemplazo</h2>' +
          '<p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.8rem">' + nombre + (puesto ? ' · ' + puesto : '') + '</p>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:0.85rem">' +
          '<div style="background:' + statusBg + ';border:2px solid ' + statusColor + '20;border-radius:12px;padding:1rem 1.25rem">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
              '<div>' +
                '<div style="font-size:0.7rem;font-weight:700;color:' + statusColor + ';text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">Estatus</div>' +
                '<div style="font-size:1.1rem;font-weight:800;color:' + statusColor + '">' + statusLabel + ' — ' + numCandidatos + '/3 candidatos</div>' +
              '</div>' +
              '<span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:999px;background:' + statusColor + ';color:white">' + statusLabel + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem">' +
            '<div style="font-size:0.7rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">Jefe de Servicio</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.5rem;font-size:0.82rem">' +
              '<div><span style="color:#888">Nombre:</span> <strong>' + nombre + '</strong></div>' +
              '<div><span style="color:#888">Matrícula:</span> <strong>' + matricula + '</strong></div>' +
              (departamento ? '<div><span style="color:#888">Depto:</span> <strong>' + departamento + '</strong></div>' : '') +
              (localidad ? '<div><span style="color:#888">Localidad:</span> <strong>' + localidad + '</strong></div>' : '') +
              (turno ? '<div><span style="color:#888">Turno:</span> <strong>' + turno + '</strong></div>' : '') +
            '</div>' +
          '</div>' +
          '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem">' +
            '<div style="font-size:0.7rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem">Candidatos de la Terna</div>' +
            candidatosHTML +
          '</div>' +
          requisitosHTML +
        '</div>' +
      '</div>' +
    '</div>';
  }
  
  function showMiCuadro(usuario) {
    log('🔍 Mostrando Mi Cuadro de Reemplazo...');
    
    // Remove any old CR panels
    var old = document.querySelector('[data-sicip-cr-panel]');
    if (old) old.remove();
    
    // Hide all React content — completely destroy it
    var root = document.getElementById('root');
    if (root) root.style.display = 'none';
    
    var mains = document.querySelectorAll('main');
    for (var i = 0; i < mains.length; i++) mains[i].style.display = 'none';
    
    // Insert panel
    var temp = document.createElement('div');
    temp.innerHTML = buildMiCuadroPanel(usuario);
    document.body.appendChild(temp.firstChild);
    
    log('✅ Mi Cuadro de Reemplazo mostrado');
  }
  
  function hideMiCuadro() {
    var panel = document.querySelector('[data-sicip-cr-panel]');
    if (panel) panel.remove();
    
    var root = document.getElementById('root');
    if (root) root.style.display = '';
    
    var mains = document.querySelectorAll('main');
    for (var i = 0; i < mains.length; i++) mains[i].style.display = '';
  }
  
  // ========== CORE: PATCH THE SIDEBAR ==========
  function patchSidebar() {
    var usuario = getUsuario();
    if (!usuario) return;
    
    var sidebar = document.querySelector('nav');
    if (!sidebar || !sidebar.querySelector('div')) return;
    
    // Already patched? Skip.
    if (sidebar.querySelector('[data-sicip-mod="cuadros"]')) {
      log('Ya parcheado, saltando');
      return;
    }
    
    var container = sidebar.querySelector('div');
    
    // 1. RENOMBRAR botón "Cuadros Reemplazo" → "Resumen CR"
    var allButtons = sidebar.querySelectorAll('button');
    for (var i = 0; i < allButtons.length; i++) {
      var btn = allButtons[i];
      var text = (btn.textContent || '').trim();
      
      // "Cuadros Reemplazo" → RENOMBRAR a "Resumen CR" (no ocultar)
      if (text === 'Cuadros Reemplazo') {
        var span = btn.querySelector('span') || btn.querySelector('div');
        if (span) {
          span.textContent = 'Resumen CR';
        } else {
          // Replace text node content
          for (var c = 0; c < btn.childNodes.length; c++) {
            if (btn.childNodes[c].nodeType === 3) {
              btn.childNodes[c].textContent = btn.childNodes[c].textContent.replace('Cuadros Reemplazo', 'Resumen CR');
            }
          }
        }
        btn.setAttribute('data-sicip-hidden', 'resumen-cr');
        log('✅ Renombrado "Cuadros Reemplazo" → "Resumen CR"');
      }
      
      // Ocultar "Mi Cuadro de Reemplazo" original (lo reemplazamos)
      if (text === 'Mi Cuadro de Reemplazo') {
        btn.style.display = 'none';
        btn.setAttribute('data-sicip-hidden', '1');
      }
      
      // Ocultar "Aprobaciones" original
      if (text === 'Aprobaciones') {
        btn.style.display = 'none';
        btn.setAttribute('data-sicip-hidden', '1');
      }
      
      // Ocultar "Crear Plaza", "Explorar Plazas"
      if (text === 'Crear Plaza' || text === 'Explorar Plazas') {
        btn.style.display = 'none';
        btn.setAttribute('data-sicip-hidden', '1');
      }
    }
    
    // 2. CREAR el grupo "📋 Cuadros de Reemplazo" con los 3 submódulos juntos
    var rol = usuario.rol;
    var isAdmin = rol === 'ADMIN';
    var isAP = rol === 'AREA_PERSONAL';
    var isJS = rol === 'JEFE_SERVICIO';
    var matricula = usuario.matricula || '';
    
    var groupHTML = '';
    
    // Header del grupo
    groupHTML += '<div data-sicip-mod="cuadros" style="padding:0.5rem 1rem 0.25rem;font-size:0.65rem;font-weight:700;color:#5cff5c;text-transform:uppercase;letter-spacing:0.08em;opacity:0.7;margin-top:4px">📋 Cuadros de Reemplazo</div>';
    
    // a) Resumen CR (renombrado, usando el botón React original)
    // Ya lo renombramos arriba, así que no creamos otro
    
    // b) Mi Cuadro de Reemplazo (panel inline)
    if ((isAdmin || isJS) && matricula) {
      groupHTML += '<button data-sicip-mod="cuadros" data-sicip-action="mi-cuadro" style="width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.8rem 1rem;border:none;cursor:pointer;font-size:0.9rem;font-weight:500;color:rgba(255,255,255,0.72);background:transparent;border-left:4px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:3px;transition:all 0.15s;text-align:left;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif">' +
        '<span style="color:rgba(255,255,255,0.6);flex-shrink:0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>' +
        'Mi Cuadro de Reemplazo' +
      '</button>';
    }
    
    // c) Solicitar Puesto de Confianza (se mantiene el React original si existe, si no lo agregamos)
    var hasSPC = false;
    for (var i = 0; i < allButtons.length; i++) {
      if ((allButtons[i].textContent || '').trim() === 'Solicitar Puesto de Confianza') {
        hasSPC = true;
        break;
      }
    }
    if (!hasSPC && (isAdmin || isJS || isAP)) {
      groupHTML += '<button data-sicip-mod="cuadros" data-sicip-action="solicitar-puesto" style="width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.8rem 1rem;border:none;cursor:pointer;font-size:0.9rem;font-weight:500;color:rgba(255,255,255,0.72);background:transparent;border-left:4px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:3px;transition:all 0.15s;text-align:left;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif">' +
        '<span style="color:rgba(255,255,255,0.6);flex-shrink:0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>' +
        'Solicitar Puesto de Confianza' +
      '</button>';
    }
    
    // Insertar el grupo DESPUÉS del botón "Resumen CR" ya renombrado
    var resumenBtn = sidebar.querySelector('[data-sicip-hidden="resumen-cr"]');
    if (resumenBtn && resumenBtn.nextElementSibling) {
      resumenBtn.insertAdjacentHTML('afterend', groupHTML);
    } else {
      // Fallback: insertar al inicio del menú
      var firstBtn = container.querySelector('button');
      if (firstBtn) {
        firstBtn.insertAdjacentHTML('beforebegin', groupHTML);
      } else {
        container.insertAdjacentHTML('afterbegin', groupHTML);
      }
    }
    
    // 3. Click handlers
    var miCuadroBtn = container.querySelector('[data-sicip-action="mi-cuadro"]');
    if (miCuadroBtn) {
      miCuadroBtn.addEventListener('click', function() {
        showMiCuadro(usuario);
      });
    }
    
    var spcBtn = container.querySelector('[data-sicip-action="solicitar-puesto"]');
    if (spcBtn) {
      spcBtn.addEventListener('click', function() {
        // Navegar a la ruta de solicitar puesto si existe
        hideMiCuadro();
        window.history.replaceState({}, '', '/solicitar-puesto');
        window.dispatchEvent(new Event('popstate'));
      });
    }
    
    log('✅ Grupo "Cuadros de Reemplazo" inyectado con submódulos');
  }
  
  // ========== START ==========
  var started = false;
  var attempts = 0;
  var maxAttempts = 30;
  
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
    
    if (attempts >= maxAttempts) {
      log('Máximo de intentos alcanzado');
      return;
    }
    
    setTimeout(tryPatch, 200);
  }
  
  // Start as soon as possible
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tryPatch();
  } else {
    document.addEventListener('DOMContentLoaded', tryPatch);
  }
  
  // Also keep trying in case React replaces the sidebar later
  setTimeout(tryPatch, 500);
  setTimeout(tryPatch, 1000);
  setTimeout(tryPatch, 1500);
  setTimeout(tryPatch, 2000);
  
  // Expose for debugging
  window.__SICIP_CUADROS_PATCH = { VERSION: VERSION, patchSidebar: patchSidebar, showMiCuadro: showMiCuadro, hideMiCuadro: hideMiCuadro };
  
  log('v' + VERSION + ' cargado');
})();
