// SICIP Cuadros Menu Patch v3.0
// - Renombra "Cuadros Reemplazo" → "Resumen CR" (ruta /aprobacion)
// - "Solicitar Puesto de Confianza" NO se toca
// - "Mi Cuadro de Reemplazo" → panel inline con datos cacheados, SIN Firestore

(function() {
  'use strict';
  
  var VERSION = '3.0.2';
  var PATCH_DELAY_MS = 300;
  var MAX_ATTEMPTS = 60;
  
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
  
  var ICONS = {
    chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>',
    briefcase: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'
  };
  
  function makeMenuItem(key, label, iconHTML, isActive) {
    var bg = isActive ? 'rgba(39,174,96,0.3)' : 'transparent';
    var border = isActive ? '4px solid #5cff5c' : '4px solid transparent';
    var color = isActive ? 'white' : 'rgba(255,255,255,0.72)';
    var iconColor = isActive ? '#5cff5c' : 'rgba(255,255,255,0.6)';
    var weight = isActive ? '700' : '500';
    
    return '<button data-sicip-cr="' + key + '" style="' +
      'width:100%;display:flex;align-items:center;gap:0.75rem;' +
      'padding:0.8rem 1rem;border:none;cursor:pointer;font-size:0.9rem;' +
      'font-weight:' + weight + ';color:' + color + ';background:' + bg + ';' +
      'border-left:' + border + ';border-radius:0 0.5rem 0.5rem 0;' +
      'margin-bottom:3px;transition:all 0.15s;text-align:left;' +
      'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif">' +
      '<span style="color:' + iconColor + ';flex-shrink:0">' + iconHTML + '</span>' +
      label +
    '</button>';
  }
  
  // ========== MI CUADRO DE REEMPLAZO - Panel Inline ==========
  function buildMiCuadroPanel(usuario) {
    var data = getSicipData();
    var matricula = usuario.matricula;
    var nombre = (usuario.nombre || '').replace(/\//g, ' ');
    var puesto = usuario.puesto || usuario.descripcion || '';
    
    // Buscar cuadro del usuario
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
    
    // Si no hay datos, buscar en sessionStorage cache
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
    
    // Construir HTML de candidatos
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
    
    // Requisitos de convocatoria
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
    
    var html = '<div data-sicip-cr-panel="mi-cuadro" style="flex:1;overflow-x:hidden;min-height:calc(100dvh - 56px);padding:1.5rem 1rem 0">' +
      '<div style="max-width:860px;margin:0 auto">' +
        // Header
        '<div style="margin-bottom:1.25rem">' +
          '<h2 style="margin:0;font-size:1.2rem;font-weight:800;color:#003324">Mi Cuadro de Reemplazo</h2>' +
          '<p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.8rem">' + nombre + (puesto ? ' · ' + puesto : '') + '</p>' +
        '</div>' +
        // Status y datos del jefe
        '<div style="display:flex;flex-direction:column;gap:0.85rem">' +
          // Status card
          '<div style="background:' + statusBg + ';border:2px solid ' + statusColor + '20;border-radius:12px;padding:1rem 1.25rem">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
              '<div>' +
                '<div style="font-size:0.7rem;font-weight:700;color:' + statusColor + ';text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">Estatus</div>' +
                '<div style="font-size:1.1rem;font-weight:800;color:' + statusColor + '">' + statusLabel + ' — ' + numCandidatos + '/3 candidatos</div>' +
              '</div>' +
              '<span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:999px;background:' + statusColor + ';color:white">' + statusLabel + '</span>' +
            '</div>' +
          '</div>' +
          // Datos del jefe
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
          // Candidatos
          '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem">' +
            '<div style="font-size:0.7rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem">Candidatos de la Terna</div>' +
            candidatosHTML +
          '</div>' +
          // Requisitos
          requisitosHTML +
        '</div>' +
      '</div>' +
    '</div>';
    
    return html;
  }
  
  function showMiCuadro(usuario) {
    log('🔍 Mostrando Mi Cuadro de Reemplazo...');
    
    // 1. MATAR cualquier spinner/cargando de React inmediatamente
    var spinners = document.querySelectorAll('.loading, .spinner, [class*="spin"], [class*="loader"], svg[class*="animate"], .animate-spin');
    for (var i = 0; i < spinners.length; i++) { spinners[i].remove(); }
    
    // 2. Quitar panel anterior
    var old = document.querySelector('[data-sicip-cr-panel]');
    if (old) old.remove();
    
    // 3. Vaciar el root completamente — no solo ocultar
    var root = document.getElementById('root');
    if (root) { root.innerHTML = ''; root.style.display = 'none'; }
    
    // 4. Esconder main
    var main = document.querySelector('main');
    if (main) main.style.display = 'none';
    
    // 5. Insertar panel DIRECTO — instantáneo
    var temp = document.createElement('div');
    temp.innerHTML = buildMiCuadroPanel(usuario);
    var panel = temp.firstChild;
    document.body.appendChild(panel);
    
    log('✅ Mi Cuadro de Reemplazo mostrado INSTANTÁNEO');
  }
  
  function hideMiCuadro() {
    var panel = document.querySelector('[data-sicip-cr-panel]');
    if (panel) panel.remove();
    
    var root = document.getElementById('root');
    if (root) root.style.display = '';
    
    var main = document.querySelector('main');
    if (main) main.style.display = '';
    
    var header = document.querySelector('header');
    var nextDiv = header ? header.nextElementSibling : null;
    if (nextDiv && nextDiv.tagName === 'DIV') {
      nextDiv.style.display = '';
    }
    
    log('⬅️ Volviendo al inicio');
  }
  
  // ========== MENU INJECTION ==========
  function findSidebar() {
    var sidebar = document.querySelector('nav');
    if (!sidebar) return null;
    
    var bg = window.getComputedStyle(sidebar).background || '';
    if (bg.indexOf('1F') < 0 && bg.indexOf('0A') < 0 && bg.indexOf('25') < 0) {
      var allNavs = document.querySelectorAll('nav');
      for (var n = 0; n < allNavs.length; n++) {
        bg = window.getComputedStyle(allNavs[n]).background || '';
        if (bg.indexOf('1F') >= 0 || bg.indexOf('0A') >= 0 || bg.indexOf('25') >= 0) {
          return allNavs[n];
        }
      }
      return sidebar; // return first nav anyway
    }
    return sidebar;
  }
  
  function injectMenu() {
    var usuario = getUsuario();
    if (!usuario) return;
    
    var rol = usuario.rol;
    var isAdmin = rol === 'ADMIN';
    var isAP = rol === 'AREA_PERSONAL';
    var isJS = rol === 'JEFE_SERVICIO';
    var currentPath = window.location.pathname;
    var matricula = usuario.matricula || '';
    
    var sidebar = findSidebar();
    if (!sidebar) return;
    
    // Check if already patched
    if (sidebar.querySelector('[data-sicip-cr]')) {
      updateActiveStates(sidebar, currentPath, matricula);
      return;
    }
    
    // Ocultar botones React originales que no queremos
    var allButtons = sidebar.querySelectorAll('button');
    for (var b = 0; b < allButtons.length; b++) {
      var text = (allButtons[b].textContent || '').trim();
      if (text === 'Cuadros Reemplazo' || text === 'Crear Plaza' || text === 'Explorar Plazas') {
        allButtons[b].style.display = 'none';
        allButtons[b].setAttribute('data-sicip-hidden', '1');
      }
      if (text === 'Mi Cuadro de Reemplazo') {
        allButtons[b].style.display = 'none';
        allButtons[b].setAttribute('data-sicip-hidden', '1');
      }
      if (text === 'Aprobaciones') {
        allButtons[b].style.display = 'none';
        allButtons[b].setAttribute('data-sicip-hidden', '1');
      }
    }
    
    var container = sidebar.querySelector('div');
    if (!container) return;
    
    log('Inyectando menú. Rol: ' + rol);
    
    var items = [];
    
    // 1. RESUMEN CR — Admin + Área Personal → ruta /aprobacion (componente wY)
    if (isAdmin || isAP) {
      items.push({
        key: 'resumen-cr',
        html: makeMenuItem('resumen-cr', 'Resumen CR', ICONS.chart, false),
        action: function() { navigateTo('/aprobacion'); }
      });
    }
    
    // 2. MI CUADRO DE REEMPLAZO — Admin + Jefe Servicio → panel inline
    if ((isAdmin || isJS) && matricula) {
      items.push({
        key: 'mi-cuadro',
        html: makeMenuItem('mi-cuadro', 'Mi Cuadro de Reemplazo', ICONS.briefcase, false),
        action: function() { showMiCuadro(usuario); }
      });
    }
    
    // Insertar
    var insertHTML = items.map(function(it) { return it.html; }).join('');
    
    var firstVisibleBtn = null;
    for (var i = 0; i < allButtons.length; i++) {
      if (allButtons[i].getAttribute('data-sicip-hidden') !== '1' && allButtons[i].offsetParent !== null) {
        firstVisibleBtn = allButtons[i];
        break;
      }
    }
    
    if (firstVisibleBtn) {
      firstVisibleBtn.insertAdjacentHTML('beforebegin', insertHTML);
    } else {
      container.insertAdjacentHTML('afterbegin', insertHTML);
    }
    
    // Click handlers
    items.forEach(function(item) {
      var btn = container.querySelector('[data-sicip-cr="' + item.key + '"]');
      if (btn) {
        btn.addEventListener('click', function() {
          // Update active states
          var allItems = sidebar.querySelectorAll('[data-sicip-cr]');
          allItems.forEach(function(el) {
            var isActive = el.getAttribute('data-sicip-cr') === item.key;
            el.style.background = isActive ? 'rgba(39,174,96,0.3)' : 'transparent';
            el.style.borderLeft = isActive ? '4px solid #5cff5c' : '4px solid transparent';
            el.style.color = isActive ? 'white' : 'rgba(255,255,255,0.72)';
            el.style.fontWeight = isActive ? '700' : '500';
            var span = el.querySelector('span');
            if (span) span.style.color = isActive ? '#5cff5c' : 'rgba(255,255,255,0.6)';
          });
          item.action();
        });
      }
    });
    
    log('✅ ' + items.length + ' items inyectados');
  }
  
  function updateActiveStates(sidebar, currentPath, matricula) {
    var items = sidebar.querySelectorAll('[data-sicip-cr]');
    items.forEach(function(item) {
      var key = item.getAttribute('data-sicip-cr');
      var isActive = (key === 'resumen-cr' && currentPath === '/aprobacion') ||
                     (key === 'mi-cuadro' && document.querySelector('[data-sicip-cr-panel]'));
      
      item.style.background = isActive ? 'rgba(39,174,96,0.3)' : 'transparent';
      item.style.borderLeft = isActive ? '4px solid #5cff5c' : '4px solid transparent';
      item.style.color = isActive ? 'white' : 'rgba(255,255,255,0.72)';
      item.style.fontWeight = isActive ? '700' : '500';
      var span = item.querySelector('span');
      if (span) span.style.color = isActive ? '#5cff5c' : 'rgba(255,255,255,0.6)';
    });
  }
  
  function navigateTo(path) {
    log('⚡ Navegando (instantáneo): ' + path);
    hideMiCuadro();
    window.history.replaceState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('hashchange'));
    if (window.__REACT_ROUTER_FORCE__) {
      window.__REACT_ROUTER_FORCE__(path);
    }
  }
  
  // ========== STARTUP ==========
  var attempts = 0;
  
  function tryInject() {
    attempts++;
    injectMenu();
    
    if (attempts >= MAX_ATTEMPTS) {
      log('⚠️ Timeout');
      return;
    }
    
    var patched = document.querySelector('[data-sicip-cr]');
    var usuario = getUsuario();
    if (!patched && usuario) {
      setTimeout(tryInject, 500);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tryInject, PATCH_DELAY_MS);
    });
  } else {
    setTimeout(tryInject, PATCH_DELAY_MS);
  }
  
  // Session update
  window.addEventListener('sicip:session-update', function() {
    var old = document.querySelectorAll('[data-sicip-cr]');
    old.forEach(function(el) { el.remove(); });
    setTimeout(tryInject, 1500);
  });
  
})();
