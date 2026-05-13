// SICIP Cuadros Menu Patch v5.2
// Acordeón "Cuadros de Reemplazo" con 3 submódulos:
// 1. Resumen CR → panel inline con TODAS las plazas + buscador + filtro unidad
// 2. Mi Cuadro de Reemplazo → panel inline con info del jefe
// 3. Solicitar Puesto de Confianza → navega a /buscar-jefe (componente React)

(function() {
  'use strict';
  
  var VERSION = '5.2.0';
  
  function log(msg) { console.log('[SICIP-Cuadros v' + VERSION + '] ' + msg); }
  
  function getUsuario() {
    try { var s = sessionStorage.getItem('sicip_usuario'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }
  
  function getSicipData() { return window.__SICIP_DATA__ || {}; }
  
  // ========== HELPERS ==========
  function hideReactRoot() {
    var r = document.getElementById('root'); if (r) r.style.display = 'none';
    var ms = document.querySelectorAll('main'); for (var i=0;i<ms.length;i++) ms[i].style.display = 'none';
  }
  function showReactRoot() {
    var r = document.getElementById('root'); if (r) r.style.display = '';
    var ms = document.querySelectorAll('main'); for (var i=0;i<ms.length;i++) ms[i].style.display = '';
  }
  function removePanel() {
    var p = document.querySelector('[data-sicip-cr-panel]'); if (p) p.remove();
  }
  
  function showPanel(html) {
    removePanel();
    hideReactRoot();
    var temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp.firstChild);
  }
  
  // ========== 1. RESUMEN CR - Panel con todas las confianzas ==========
  function buildResumenCRPanel(usuario) {
    var data = getSicipData();
    var jefes = data.jefesServicio || [];
    var cuadros = data.cuadros || [];
    var rol = usuario.rol;
    var isAP = rol === 'AREA_PERSONAL';
    var isAdmin = rol === 'ADMIN';
    
    // Mapa de matricula -> cuadro
    var cuadroMap = {};
    cuadros.forEach(function(c) {
      var key = String(c.jefeMatricula || c.id);
      if (!cuadroMap[key]) cuadroMap[key] = c;
    });
    
    // Generar rows
    var rows = '';
    jefes.forEach(function(j, idx) {
      var mat = String(j.matricula || j.id || '');
      var nombre = (j.nombre || '').replace(/\//g, ' ');
      var depto = j.departamentoNombre || j.departamento || '';
      var localidad = j.localidad || '';
      var puesto = j.puesto || j.descripcion || '';
      var turno = j.turno || '';
      
      var cr = cuadroMap[mat];
      var status = cr ? (cr.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR';
      var candidatos = cr ? (cr.candidatos || []) : [];
      var numCand = candidatos.length;
      
      var statusClass = status === 'COMPLETO' ? 'completo' : status === 'PARCIAL' ? 'parcial' : status === 'CERRADO' ? 'cerrado' : 'sin-asignar';
      var statusLabel = status === 'COMPLETO' ? '✅ Completo' : status === 'PARCIAL' ? '⚠️ Parcial' : status === 'CERRADO' ? '🔒 Cerrado' : '🔴 Sin Asignar';
      
      rows += '<tr style="border-bottom:1px solid #e5e7eb;cursor:pointer" onclick="window.__SICIP_VER_JEFE__(\''+mat+'\')">' +
        '<td style="padding:0.6rem 0.75rem;white-space:nowrap;font-weight:600;font-size:0.82rem">' + nombre + '</td>' +
        '<td style="padding:0.6rem 0.75rem;white-space:nowrap;font-size:0.78rem;font-family:monospace;color:#6b7280">' + mat + '</td>' +
        '<td style="padding:0.6rem 0.75rem;font-size:0.78rem;color:#374151">' + (depto || '—') + '</td>' +
        '<td style="padding:0.6rem 0.75rem;font-size:0.78rem;color:#374151">' + (puesto || '—') + '</td>' +
        '<td style="padding:0.6rem 0.75rem;white-space:nowrap;font-size:0.78rem">' +
          '<span style="background:'+(status==='COMPLETO'?'#d4edda':status==='PARCIAL'?'#fff3cd':status==='CERRADO'?'#e2e3e5':'#f8d7da')+';color:'+(status==='COMPLETO'?'#155724':status==='PARCIAL'?'#856404':status==='CERRADO'?'#383d41':'#721c24')+';padding:0.2rem 0.5rem;border-radius:999px;font-size:0.7rem;font-weight:600">'+statusLabel+'</span>' +
        '</td>' +
        '<td style="padding:0.6rem 0.75rem;text-align:center;font-size:0.78rem;font-weight:700;color:'+(numCand===3?'#10b981':numCand>0?'#f59e0b':'#ef4444')+'">'+numCand+'/3</td>' +
        '<td style="padding:0.6rem 0.75rem">' +
          '<button onclick="event.stopPropagation();window.__SICIP_ASIGNAR_CUADRO__(\''+mat+'\',\''+(nombre.replace(/'/g,"\\'"))+'\')" style="background:#005235;color:white;border:none;padding:0.3rem 0.7rem;border-radius:6px;font-size:0.72rem;font-weight:600;cursor:pointer;white-space:nowrap">Asignar Cuadro</button>' +
        '</td>' +
      '</tr>';
    });
    
    if (!rows) {
      rows = '<tr><td colspan="7" style="padding:3rem;text-align:center;color:#9ca3af">No hay plazas de confianza registradas</td></tr>';
    }
    
    return '<div data-sicip-cr-panel="resumen-cr" style="position:fixed;top:0;left:72px;right:0;bottom:0;z-index:9998;overflow-y:auto;background:#f9fafb;padding:1.5rem 1.5rem 3rem">' +
      '<div style="max-width:1200px;margin:0 auto">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem">' +
          '<div>' +
            '<button onclick="var p=document.querySelector(\'[data-sicip-cr-panel]\');if(p)p.remove();showReactRoot();" style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:#005235;font-weight:600;padding:0 0 0.5rem 0;display:flex;align-items:center;gap:6px">← Volver al inicio</button>' +
            '<h2 style="margin:0;font-size:1.25rem;font-weight:800;color:#003324">Resumen de Cuadros de Reemplazo</h2>' +
            '<p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.8rem">' + jefes.length + ' plazas de confianza registradas</p>' +
          '</div>' +
          '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">' +
            '<div style="position:relative">' +
              '<input type="text" id="sicip-cr-search" oninput="window.__SICIP_FILTRAR__()" placeholder="Buscar nombre, matrícula, unidad..." style="padding:0.5rem 0.75rem 0.5rem 2rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.82rem;width:220px;max-width:100%;box-sizing:border-box">' +
              '<span style="position:absolute;left:0.6rem;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:0.8rem">🔍</span>' +
            '</div>' +
            '<select id="sicip-cr-filtro-status" onchange="window.__SICIP_FILTRAR__()" style="padding:0.5rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.82rem">' +
              '<option value="TODOS">Todos los estados</option>' +
              '<option value="SIN_ASIGNAR">Sin Asignar</option>' +
              '<option value="PARCIAL">Parcial</option>' +
              '<option value="COMPLETO">Completo</option>' +
              '<option value="CERRADO">Cerrado</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);border:1px solid #e5e7eb">' +
          '<div style="overflow-x:auto">' +
            '<table id="sicip-cr-table" style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:750px">' +
              '<thead>' +
                '<tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb">' +
                  '<th style="padding:0.75rem;text-align:left;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">Nombre</th>' +
                  '<th style="padding:0.75rem;text-align:left;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">Matrícula</th>' +
                  '<th style="padding:0.75rem;text-align:left;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">Unidad/Depto</th>' +
                  '<th style="padding:0.75rem;text-align:left;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">Puesto</th>' +
                  '<th style="padding:0.75rem;text-align:left;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">Estatus</th>' +
                  '<th style="padding:0.75rem;text-align:center;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">Cands</th>' +
                  '<th style="padding:0.75rem;text-align:left;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">Acción</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody id="sicip-cr-tbody">' + rows + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  
  function showResumenCR(usuario) {
    log('📊 Mostrando Resumen CR...');
    var html = buildResumenCRPanel(usuario);
    showPanel(html);
    
    // Exponer funciones de filtrado
    var allJefes = (getSicipData().jefesServicio || []);
    var allCuadros = (getSicipData().cuadros || []);
    var cuadroMap = {};
    allCuadros.forEach(function(c) { cuadroMap[String(c.jefeMatricula || c.id)] = c; });
    
    window.__SICIP_FILTRAR__ = function() {
      var search = (document.getElementById('sicip-cr-search')?.value || '').toLowerCase();
      var filtroStatus = document.getElementById('sicip-cr-filtro-status')?.value || 'TODOS';
      var tbody = document.getElementById('sicip-cr-tbody');
      if (!tbody) return;
      
      var trs = tbody.querySelectorAll('tr');
      trs.forEach(function(tr) {
        var txt = (tr.textContent || '').toLowerCase();
        var matchSearch = !search || txt.indexOf(search) !== -1;
        var matchStatus = true;
        if (filtroStatus !== 'TODOS') {
          var statusSpan = tr.querySelector('span');
          if (statusSpan) {
            var statusTxt = statusSpan.textContent || '';
            if (filtroStatus === 'SIN_ASIGNAR' && statusTxt.indexOf('Sin Asignar') === -1) matchStatus = false;
            else if (filtroStatus === 'PARCIAL' && statusTxt.indexOf('Parcial') === -1) matchStatus = false;
            else if (filtroStatus === 'COMPLETO' && statusTxt.indexOf('Completo') === -1) matchStatus = false;
            else if (filtroStatus === 'CERRADO' && statusTxt.indexOf('Cerrado') === -1) matchStatus = false;
          }
        }
        tr.style.display = (matchSearch && matchStatus) ? '' : 'none';
      });
    };
    
    // Exponer "Ver Jefe" (para futuro detalle)
    window.__SICIP_VER_JEFE__ = function(matricula) {
      log('Ver detalle de jefe: ' + matricula);
      // Por ahora no hacemos nada, en el futuro podría abrir un modal
    };
    
    // Exponer "Asignar Cuadro"
    window.__SICIP_ASIGNAR_CUADRO__ = function(matricula, nombre) {
      log('Asignar cuadro para: ' + nombre + ' (' + matricula + ')');
      // Navegar a la ruta de asignación
      removePanel();
      showReactRoot();
      window.history.replaceState({}, '', '/cuadro/' + matricula);
      window.dispatchEvent(new Event('popstate'));
    };
    
    // Exponer showReactRoot para el botón volver
    window.showReactRoot = showReactRoot;
  }
  
  // ========== 2. MI CUADRO - Panel inline ==========
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
      reqHtml = '<div style="margin-top:1rem"><h4 style="margin:0 0 0.5rem;font-size:0.88rem;font-weight:700;color:#005235">📋 Requisitos</h4>'+
        '<div style="font-size:0.82rem;color:#374151">'+
        (cuadro.escolaridadRequerida?'<div style="margin-bottom:0.3rem"><strong>Escolaridad:</strong> '+cuadro.escolaridadRequerida+'</div>':'')+
        (cuadro.experienciaRequerida?'<div><strong>Experiencia:</strong> '+cuadro.experienciaRequerida+'</div>':'')+'</div></div>';
    }
    
    return '<div data-sicip-cr-panel="mi-cuadro" style="position:fixed;top:0;left:72px;right:0;bottom:0;z-index:9998;overflow-y:auto;background:#f9fafb;padding:1.5rem 1.5rem 3rem">'+
      '<div style="max-width:860px;margin:0 auto">'+
        '<div style="margin-bottom:1.25rem">'+
          '<button onclick="var p=document.querySelector(\'[data-sicip-cr-panel]\');if(p)p.remove();var r=document.getElementById(\'root\');if(r)r.style.display=\'\';var ms=document.querySelectorAll(\'main\');for(var i=0;i<ms.length;i++)ms[i].style.display=\'\';" style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:#005235;font-weight:600;padding:0 0 0.5rem 0;display:flex;align-items:center;gap:6px">← Volver al inicio</button>'+
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
    log('Mostrando Mi Cuadro');
    showPanel(buildMiCuadroPanel(usuario));
  }
  
  // ========== 3. SOLICITAR PUESTO ==========
  function goToSolicitarPuesto() {
    removePanel();
    showReactRoot();
    window.history.replaceState({}, '', '/buscar-jefe');
    window.dispatchEvent(new Event('popstate'));
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
    
    var container = document.createElement('div');
    container.setAttribute('data-sicip-mod', 'cuadros');
    
    var header = document.createElement('button');
    header.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1rem;border:none;cursor:pointer;font-size:0.88rem;font-weight:600;color:rgba(255,255,255,0.85);background:transparent;border-left:4px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,sans-serif';
    header.innerHTML = '<span style="color:#5cff5c;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>'+
      '<span style="flex:1;text-align:left">Cuadros de Reemplazo</span>'+
      '<span data-sicip-arrow style="color:rgba(255,255,255,0.4);transition:transform 0.2s;font-size:0.65rem">▼</span>';
    
    var submenu = document.createElement('div');
    submenu.style.cssText = 'overflow:hidden;max-height:0;transition:max-height 0.25s ease-out;background:rgba(0,0,0,0.05)';
    
    var subitems = document.createElement('div');
    subitems.style.padding = '2px 0 4px 0';
    
    // 1. Resumen CR (Área Personal + Admin)
    if (isAP || isAdmin) {
      subitems.appendChild(createSubItem('resumen-cr', 'Resumen CR',
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>',
        function() { showResumenCR(usuario); }
      ));
    }
    
    // 2. Mi Cuadro de Reemplazo (Jefe Servicio + Admin)
    if (isJS || isAdmin) {
      subitems.appendChild(createSubItem('mi-cuadro', 'Mi Cuadro de Reemplazo',
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        function() { showMiCuadro(usuario); }
      ));
    }
    
    // 3. Solicitar Puesto de Confianza (todos los roles)
    subitems.appendChild(createSubItem('solicitar-puesto', 'Solicitar Puesto de Confianza',
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      goToSolicitarPuesto
    ));
    
    submenu.appendChild(subitems);
    container.appendChild(header);
    container.appendChild(submenu);
    
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
    if (!usuario) { log('No user found'); return; }
    
    var sidebar = document.querySelector('nav');
    if (!sidebar || !sidebar.querySelector('div')) { log('No sidebar'); return; }
    var container = sidebar.querySelector('div');
    if (sidebar.querySelector('[data-sicip-mod="cuadros"]')) { log('Ya parcheado'); return; }
    
    // Ocultar botones React originales que ya no necesitamos
    var allButtons = sidebar.querySelectorAll('button');
    for (var i = 0; i < allButtons.length; i++) {
      var btn = allButtons[i];
      var text = (btn.textContent || '').trim();
      // Ocultar todo lo relacionado a cuadros reemplazo OPCIONAL
      // Dejamos "Solicitar Puesto de Confianza" visible POR SI las dudas
      if (text === 'Cuadros Reemplazo' || text === 'Mi Cuadro de Reemplazo' || text === 'Aprobaciones' || text === 'Crear Plaza' || text === 'Explorar Plazas') {
        btn.style.display = 'none';
        btn.setAttribute('data-sicip-hidden', '1');
      }
    }
    
    // Insertar acordeón después de "Solicitudes" o al inicio
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
  
  function tryPatch() {
    if (started) return;
    var sidebar = document.querySelector('nav');
    if (sidebar && sidebar.querySelector('div') && sidebar.querySelector('button') && !sidebar.querySelector('[data-sicip-mod="cuadros"]')) {
      started = true;
      log('Sidebar listo, parcheando...');
      patchSidebar();
      return;
    }
  }
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(tryPatch, 50);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryPatch, 50); });
  }
  
  setTimeout(tryPatch, 300);
  setTimeout(tryPatch, 700);
  setTimeout(tryPatch, 1500);
  setTimeout(tryPatch, 3000);
  setTimeout(tryPatch, 5000);
  
  window.__SICIP_CUADROS_PATCH = { VERSION: VERSION };
  
  log('v' + VERSION + ' cargado');
})();
