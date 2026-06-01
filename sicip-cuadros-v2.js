// SICIP Cuadros v2.0 — Rediseño completo
// ========================================
// Resumen CR + Mi Cuadro de Reemplazo + Asignación con búsqueda y prioridades
// Paneles DENTRO del layout — conserva sidebar + header
// Firestore REST API para persistencia
// Carga INSTANTÁNEA desde window.__SICIP_DATA__

(function() {
  'use strict';
  var VERSION = '2.0.0';
  var FS_PROJECT = 'sicip-bcs';
  var FS_BASE = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents';

  function log(msg) { console.log('[SICIP-Cuadros v' + VERSION + '] ' + msg); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function getUsuario() {
    try { var s = sessionStorage.getItem('sicip_usuario'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }
  function getData() { return window.__SICIP_DATA__ || {}; }

  // ════════════════ FIRESTORE REST API ════════════════
  function docPath(coll, id) { return FS_BASE + '/' + encodeURIComponent(coll) + '/' + encodeURIComponent(String(id)); }
  
  function fromFSVal(v) {
    if (!v || v.nullValue !== undefined) return null;
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
    if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.arrayValue) return (v.arrayValue.values || []).map(fromFSVal);
    if (v.mapValue) { var o={}; if(v.mapValue.fields) for(var k in v.mapValue.fields) o[k]=fromFSVal(v.mapValue.fields[k]); return o; }
    return null;
  }

  function fromFSDoc(doc) {
    var obj = { _id: doc.name ? doc.name.split('/').pop() : null };
    if (doc.fields) for (var k in doc.fields) obj[k] = fromFSVal(doc.fields[k]);
    return obj;
  }

  function toFSVal(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toFSVal) } };
    if (typeof v === 'object') { var f={}; for(var k in v) f[k]=toFSVal(v[k]); return { mapValue: { fields: f } }; }
    return { stringValue: String(v) };
  }

  function toFSDoc(obj) { var f={}; for(var k in obj) { if(k==='_id') continue; f[k]=toFSVal(obj[k]); } return { fields: f }; }

  async function fsGet(path) {
    try { var r = await fetch(path); if(!r.ok) return null; var d=await r.json(); return d.error?null:fromFSDoc(d); } catch(e) { return null; }
  }

  async function fsSet(path, obj) {
    var r = await fetch(path, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(toFSDoc(obj)) });
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  }

  // ════════════════ LAYOUT HELPERS ════════════════
  function getContentContainer() {
    var main = document.querySelector('main');
    if (main) return main;
    var root = document.getElementById('root');
    if (root && root.children.length > 0) {
      for (var i=0; i<root.children.length; i++) {
        var c = root.children[i];
        if (c.tagName !== 'NAV' && c.tagName !== 'HEADER' && c.tagName !== 'ASIDE') return c;
      }
    }
    return root;
  }

  function removePanel() {
    var p = document.querySelector('[data-sicip-cr-panel]');
    if (p) p.remove();
  }

  function hideReactContent(container) {
    for (var i=0; i<container.children.length; i++) {
      if (!container.children[i].hasAttribute('data-sicip-cr-panel')) container.children[i].style.display = 'none';
    }
  }

  function showContent(html) {
    removePanel();
    var container = getContentContainer();
    if (!container) return;
    hideReactContent(container);
    var panel = document.createElement('div');
    panel.setAttribute('data-sicip-cr-panel', 'layout');
    panel.innerHTML = html;
    container.appendChild(panel);
  }

  function showReactContent() {
    removePanel();
    var container = getContentContainer();
    if (!container) return;
    for (var i=0; i<container.children.length; i++) {
      if (!container.children[i].hasAttribute('data-sicip-cr-panel')) container.children[i].style.display = '';
    }
  }
  window.showReactContent = showReactContent;

  // ════════════════ UTILITARIOS ════════════════
  function getCuadroMap() {
    var data = getData();
    var map = {};
    (data.cuadros || []).forEach(function(c) {
      var key = String(c.jefeMatricula || c._id || '');
      if (!map[key]) map[key] = c;
    });
    return map;
  }

  function getStatusInfo(status) {
    var map = {
      'COMPLETO':  { label:'✅ Completo',    bg:'#d4edda', fg:'#155724', bar:'#10b981', dot:'#10b981' },
      'PARCIAL':   { label:'⚠️ Parcial',    bg:'#fff3cd', fg:'#856404', bar:'#f59e0b', dot:'#f59e0b' },
      'CERRADO':   { label:'🔒 Cerrado',    bg:'#e2e3e5', fg:'#383d41', bar:'#6b7280', dot:'#6b7280' },
      'SIN_ASIGNAR':{ label:'🔴 Sin Asignar', bg:'#f8d7da', fg:'#721c24', bar:'#ef4444', dot:'#ef4444' }
    };
    return map[status] || map['SIN_ASIGNAR'];
  }

  function toast(msg, type) {
    var existing = document.querySelector('.sicip-toast-v2');
    if (existing) existing.remove();
    var colors = { success:'#10b981', error:'#ef4444', info:'#3b82f6', warn:'#f59e0b' };
    var t = document.createElement('div');
    t.className = 'sicip-toast-v2';
    t.innerHTML = msg;
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1f2937;color:white;padding:12px 20px;border-radius:10px;font-size:0.88rem;font-weight:600;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,0.2);animation:sicipToastIn 0.3s ease;font-family:Inter,sans-serif;max-width:360px;border-left:4px solid '+(colors[type]||'#27ae60');
    document.body.appendChild(t);
    setTimeout(function() { t.style.opacity='0'; t.style.transition='opacity 0.3s'; }, 3000);
    setTimeout(function() { if(t.parentNode) t.remove(); }, 3400);
  }

  // ════════════════ ESTILOS GLOBALES ════════════════
  function injectStyles() {
    if (document.querySelector('[data-sicip-cuadros-v2-styles]')) return;
    var s = document.createElement('style');
    s.setAttribute('data-sicip-cuadros-v2-styles', '1');
    s.textContent = ''+
      '@keyframes sicipToastIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }'+
      '@keyframes sicipSpin { to{transform:rotate(360deg)} }'+
      '@keyframes sicipFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }'+
      '@keyframes sicipPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }'+
      '.sicip-card {'+
        'background:white;border-radius:12px;border:1px solid #e5e7eb;'+
        'box-shadow:0 1px 3px rgba(0,0,0,0.04),0 2px 8px rgba(0,0,0,0.04);'+
        'overflow:hidden;transition:box-shadow 0.2s,transform 0.2s;'+
      '}'+
      '.sicip-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.08); }'+
      '.sicip-btn {'+
        'display:inline-flex;align-items:center;gap:6px;padding:0.5rem 1rem;'+
        'border:none;border-radius:8px;font-size:0.82rem;font-weight:600;'+
        'cursor:pointer;transition:all 0.15s;font-family:Inter,sans-serif;'+
        'white-space:nowrap;'+
      '}'+
      '.sicip-btn:active { transform:scale(0.97); }'+
      '.sicip-btn-primary { background:#005235;color:white; }'+
      '.sicip-btn-primary:hover { background:#003824;box-shadow:0 2px 8px rgba(0,82,53,0.25); }'+
      '.sicip-btn-success { background:#10b981;color:white; }'+
      '.sicip-btn-success:hover { background:#059669; }'+
      '.sicip-btn-outline { background:white;color:#005235;border:1.5px solid #005235; }'+
      '.sicip-btn-outline:hover { background:#f0fdf4; }'+
      '.sicip-btn-ghost { background:transparent;color:#6b7280; }'+
      '.sicip-btn-ghost:hover { background:#f3f4f6;color:#374151; }'+
      '.sicip-btn-danger { background:#fef2f2;color:#dc2626;border:1px solid #fecaca; }'+
      '.sicip-btn-danger:hover { background:#fee2e2; }'+
      '.sicip-btn-sm { padding:0.3rem 0.6rem;font-size:0.75rem;border-radius:6px; }'+
      '.sicip-badge {'+
        'display:inline-flex;align-items:center;padding:0.18rem 0.55rem;'+
        'border-radius:999px;font-size:0.68rem;font-weight:700;white-space:nowrap;'+
      '}'+
      '.sicip-input {'+
        'padding:0.55rem 0.75rem;border:1.5px solid #d1d5db;border-radius:8px;'+
        'font-size:0.84rem;font-family:Inter,sans-serif;transition:border-color 0.15s,box-shadow 0.15s;'+
        'box-sizing:border-box;outline:none;width:100%;'+
      '}'+
      '.sicip-input:focus { border-color:#005235;box-shadow:0 0 0 3px rgba(0,82,53,0.1); }'+
      '.sicip-select {'+
        'padding:0.55rem 0.75rem;border:1.5px solid #d1d5db;border-radius:8px;'+
        'font-size:0.84rem;font-family:Inter,sans-serif;background:white;'+
        'cursor:pointer;outline:none;box-sizing:border-box;'+
      '}'+
      '.sicip-select:focus { border-color:#005235;box-shadow:0 0 0 3px rgba(0,82,53,0.1); }'+
      '.sicip-slot {'+
        'border:2px dashed #d1d5db;border-radius:10px;padding:0.9rem;min-height:80px;'+
        'display:flex;align-items:center;justify-content:center;transition:all 0.2s;'+
      '}'+
      '.sicip-slot-filled {'+
        'border-style:solid;border-color:#c8e6c9;background:#f0fdf4;'+
      '}'+
      '.sicip-slot-hover {'+
        'border-color:#005235;background:#f0fdf4;box-shadow:0 0 0 4px rgba(0,82,53,0.08);'+
      '}'+
      '.sicip-modal-overlay {'+
        'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9997;'+
        'display:flex;align-items:center;justify-content:center;padding:1rem;'+
        'animation:sicipFadeIn 0.2s ease;'+
      '}'+
      '.sicip-modal {'+
        'background:white;border-radius:16px;max-width:700px;width:100%;max-height:90vh;'+
        'overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:sicipFadeIn 0.25s ease;'+
      '}'+
      '@media (max-width:640px) {'+
        '.sicip-modal { max-height:95vh;border-radius:12px 12px 0 0;margin-top:auto; }'+
        '.sicip-modal-overlay { align-items:flex-end;padding:0; }'+
        '.sicip-hide-mobile { display:none!important; }'+
      '}'+
    '';
    document.head.appendChild(s);
  }

  // ════════════════ PANEL: RESUMEN CR ════════════════
  function buildResumenCRPanel() {
    var data = getData();
    var jefes = data.jefesServicio || [];
    var cuadroMap = getCuadroMap();
    
    // Stats rápidos
    var completos = 0, parciales = 0, sinAsignar = 0;
    jefes.forEach(function(j) {
      var cr = cuadroMap[String(j.matricula || j.id || '')];
      var st = cr ? (cr.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR';
      if (st === 'COMPLETO') completos++;
      else if (st === 'PARCIAL') parciales++;
      else sinAsignar++;
    });

    var statsHtml = ''+
      '<div class="sicip-card" style="padding:0.85rem 1rem;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-color:#a7f3d0">'+
        '<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.5rem">'+
          '<span style="font-size:1rem">📊</span>'+
          '<span style="font-weight:700;color:#003324;font-size:0.85rem">Resumen General</span>'+
        '</div>'+
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap">'+
          '<span style="font-size:0.78rem;color:#374151"><strong style="color:#003324">'+jefes.length+'</strong> plazas</span>'+
          '<span style="font-size:0.78rem;color:#10b981">✅ <strong>'+completos+'</strong> completas</span>'+
          '<span style="font-size:0.78rem;color:#f59e0b">⚠️ <strong>'+parciales+'</strong> parciales</span>'+
          '<span style="font-size:0.78rem;color:#ef4444">🔴 <strong>'+sinAsignar+'</strong> sin asignar</span>'+
        '</div>'+
      '</div>';

    var rows = '';
    jefes.forEach(function(j) {
      var mat = String(j.matricula || j.id || '');
      var nombre = (j.nombre || '').replace(/\//g, ' ');
      var depto = j.departamentoNombre || j.departamento || '';
      var puesto = j.puesto || j.descripcion || '';
      var cr = cuadroMap[mat];
      var status = cr ? (cr.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR';
      var candidatos = cr ? (cr.candidatos || []) : [];
      var numCand = candidatos.length;
      var si = getStatusInfo(status);
      var candColor = numCand===3 ? '#10b981' : numCand>0 ? '#f59e0b' : '#ef4444';
      
      // Barra de progreso
      var pct = Math.round((numCand/3)*100);
      var barColor = numCand===3 ? '#10b981' : numCand>0 ? '#f59e0b' : '#e5e7eb';
      
      rows += ''+
        '<div class="sicip-card" style="padding:0;margin-bottom:0.5rem;cursor:pointer" '+
          'onclick="event.stopPropagation();window.__SICIP_ABRIR_ASIGNACION__(\''+esc(mat)+'\',\''+esc(nombre.replace(/'/g,"\\'"))+'\')" '+
          'data-sicip-cr-row data-matricula="'+esc(mat)+'" data-status="'+esc(status)+'" data-nombre="'+esc(nombre.toLowerCase())+'">'+
          '<div style="display:flex;align-items:center;padding:0.7rem 1rem;gap:0.75rem;flex-wrap:wrap">'+
            // Columna izquierda: nombre + detalles
            '<div style="flex:1;min-width:160px">'+
              '<div style="font-weight:700;font-size:0.88rem;color:#111827;margin-bottom:2px">'+esc(nombre)+'</div>'+
              '<div style="font-size:0.75rem;color:#6b7280;display:flex;gap:0.5rem;flex-wrap:wrap">'+
                '<span style="font-family:monospace">'+esc(mat)+'</span>'+
                (depto ? '<span>·</span><span>'+esc(depto.substring(0,30))+'</span>' : '')+
                (puesto ? '<span>·</span><span>'+esc(puesto.substring(0,25))+'</span>' : '')+
              '</div>'+
            '</div>'+
            // Barra progreso
            '<div style="width:80px;flex-shrink:0" class="sicip-hide-mobile">'+
              '<div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden">'+
                '<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:3px;transition:width 0.3s"></div>'+
              '</div>'+
            '</div>'+
            // Badge status
            '<span class="sicip-badge" style="background:'+si.bg+';color:'+si.fg+'">'+si.label+'</span>'+
            // Contador
            '<span style="font-weight:800;font-size:0.9rem;color:'+candColor+';min-width:28px;text-align:center">'+numCand+'/3</span>'+
            // Botón
            '<button class="sicip-btn sicip-btn-primary sicip-btn-sm" onclick="event.stopPropagation();window.__SICIP_ABRIR_ASIGNACION__(\''+esc(mat)+'\',\''+esc(nombre.replace(/'/g,"\\'"))+'\')">'+
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'+
              ' Asignar'+
            '</button>'+
          '</div>'+
        '</div>';
    });

    if (!rows) rows = '<div style="text-align:center;padding:3rem;color:#9ca3af;font-size:0.9rem">📭 No hay plazas de confianza registradas</div>';

    return ''+
      '<div style="padding:1rem 1.25rem;animation:sicipFadeIn 0.25s ease">'+
        // Header
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem">'+
          '<div>'+
            '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.showReactContent()" style="margin-bottom:0.35rem">← Volver al inicio</button>'+
            '<h2 style="margin:0;font-size:1.3rem;font-weight:800;color:#003324">📋 Resumen de Cuadros de Reemplazo</h2>'+
            '<p style="margin:0.15rem 0 0;color:#6b7280;font-size:0.8rem">Asignación de ternas para puestos de confianza</p>'+
          '</div>'+
        '</div>'+
        // Stats
        statsHtml +
        '<div style="height:0.75rem"></div>'+
        // Filtros
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem">'+
          '<div style="position:relative;flex:1;min-width:180px;max-width:320px">'+
            '<input type="text" id="sicip-cr-search-v2" class="sicip-input" '+
              'placeholder="🔍 Buscar nombre, matrícula, unidad..." '+
              'oninput="window.__SICIP_FILTRAR_CR__()" '+
              'style="padding-left:2.2rem">'+
            '<span style="position:absolute;left:0.65rem;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:0.85rem;pointer-events:none">🔍</span>'+
          '</div>'+
          '<select id="sicip-cr-filtro-v2" class="sicip-select" onchange="window.__SICIP_FILTRAR_CR__()">'+
            '<option value="TODOS">Todos los estados</option>'+
            '<option value="SIN_ASIGNAR">Sin Asignar</option>'+
            '<option value="PARCIAL">Parcial</option>'+
            '<option value="COMPLETO">Completo</option>'+
            '<option value="CERRADO">Cerrado</option>'+
          '</select>'+
        '</div>'+
        // Lista de tarjetas
        '<div id="sicip-cr-list-v2">'+rows+'</div>'+
      '</div>';
  }

  function showResumenCR() {
    log('📊 Mostrando Resumen CR v2');
    var html = buildResumenCRPanel();
    showContent(html);
    window.__SICIP_FILTRAR_CR__ = function() {
      var search = (document.getElementById('sicip-cr-search-v2')?.value || '').toLowerCase();
      var filtro = document.getElementById('sicip-cr-filtro-v2')?.value || 'TODOS';
      var rows = document.querySelectorAll('[data-sicip-cr-row]');
      rows.forEach(function(row) {
        var nombre = (row.getAttribute('data-nombre') || '').toLowerCase();
        var mat = (row.getAttribute('data-matricula') || '').toLowerCase();
        var status = row.getAttribute('data-status') || '';
        var matchSearch = !search || nombre.indexOf(search)>=0 || mat.indexOf(search)>=0;
        var matchStatus = filtro==='TODOS' || status===filtro;
        row.style.display = (matchSearch && matchStatus) ? '' : 'none';
      });
    };
  }

  // ════════════════ PANEL: ASIGNACIÓN DE CUADROS ════════════════
  // Estado global de la sesión de asignación
  var _asigState = null;

  function buildAsignacionPanel(matricula, nombreJefe) {
    var data = getData();
    var cuadroMap = getCuadroMap();
    var cr = cuadroMap[matricula];
    var candidatos = cr ? (cr.candidatos || []).sort(function(a,b){return a.posicion-b.posicion;}) : [];
    
    // Inicializar estado
    _asigState = {
      matricula: matricula,
      nombreJefe: nombreJefe,
      candidatos: candidatos.map(function(c,i){return {posicion:c.posicion||i+1,matricula:c.matricula,nombre:c.nombre,descripcion:c.descripcion,departamento:c.departamento,tipoContrato:c.tipoContrato};}),
      status: cr ? (cr.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR',
      escolaridad: cr ? (cr.escolaridadRequerida || '') : '',
      experiencia: cr ? (cr.experienciaRequerida || '') : '',
      original: JSON.parse(JSON.stringify(candidatos))
    };

    return renderAsignacionHTML();
  }

  function renderAsignacionHTML() {
    if (!_asigState) return '<div style="padding:2rem;text-align:center;color:#9ca3af">Error: estado no inicializado</div>';
    var s = _asigState;
    var data = getData();
    
    // Slots: 3 posiciones
    var slotsHtml = '';
    for (var i=1; i<=3; i++) {
      var cand = s.candidatos.find(function(c){return c.posicion===i;});
      var prioridadLabel = i===1 ? 'Primera opción (alta)' : i===2 ? 'Segunda opción' : 'Tercera opción (baja)';
      var prioridadClass = i===1 ? '#10b981' : i===2 ? '#f59e0b' : '#f97316';
      
      if (cand) {
        slotsHtml += ''+
          '<div class="sicip-slot sicip-slot-filled" style="animation:sicipFadeIn 0.2s ease;min-height:auto;flex-direction:column;gap:0.5rem">'+
            '<div style="display:flex;align-items:center;gap:0.6rem;width:100%">'+
              '<div style="width:32px;height:32px;border-radius:50%;background:'+prioridadClass+';color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.85rem;flex-shrink:0">'+i+'</div>'+
              '<div style="flex:1;min-width:0">'+
                '<div style="font-weight:700;font-size:0.85rem;color:#111827">'+esc(cand.nombre||'')+'</div>'+
                '<div style="font-size:0.72rem;color:#6b7280;display:flex;flex-wrap:wrap;gap:0.3rem 0.6rem">'+
                  '<span style="font-family:monospace">'+esc(cand.matricula||'')+'</span>'+
                  (cand.descripcion ? '<span>·</span><span>'+esc(cand.descripcion)+'</span>' : '')+
                '</div>'+
              '</div>'+
              // Botones de acción
              '<div style="display:flex;gap:0.25rem;flex-shrink:0">'+
                (i>1 ? '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.__SICIP_MOVER_CANDIDATO__('+i+',-1)" title="Subir prioridad">▲</button>' : '')+
                (i<3 ? '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.__SICIP_MOVER_CANDIDATO__('+i+',1)" title="Bajar prioridad">▼</button>' : '')+
                '<button class="sicip-btn sicip-btn-danger sicip-btn-sm" onclick="window.__SICIP_QUITAR_CANDIDATO__('+i+')" title="Quitar">✕</button>'+
              '</div>'+
            '</div>'+
            '<div style="width:100%;display:flex;gap:0.3rem">'+
              '<span class="sicip-badge" style="background:'+prioridadClass+'20;color:'+prioridadClass+'">'+prioridadLabel+'</span>'+
            '</div>'+
          '</div>';
      } else {
        slotsHtml += ''+
          '<div class="sicip-slot" style="animation:sicipFadeIn 0.2s ease;min-height:auto;flex-direction:column;gap:0.5rem;padding:1rem">'+
            '<div style="display:flex;align-items:center;gap:0.6rem;width:100%">'+
              '<div style="width:32px;height:32px;border-radius:50%;background:#e5e7eb;color:#9ca3af;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.85rem;flex-shrink:0">'+i+'</div>'+
              '<div style="flex:1">'+
                '<div style="font-weight:600;font-size:0.82rem;color:#9ca3af">Slot vacío — Asignar candidato</div>'+
                '<div style="font-size:0.7rem;color:#d1d5db">'+prioridadLabel+'</div>'+
              '</div>'+
              '<button class="sicip-btn sicip-btn-primary sicip-btn-sm" onclick="document.getElementById(\'sicip-buscar-input\').focus();document.getElementById(\'sicip-buscar-input\').scrollIntoView({behavior:\'smooth\'})">+ Asignar</button>'+
            '</div>'+
          '</div>';
      }
    }

    // Buscador de trabajadores (filtra de los datos ya cargados)
    var todosTrabajadores = data.trabajadores || [];

    return ''+
      '<div style="padding:1rem 1.25rem;animation:sicipFadeIn 0.25s ease">'+
        // Header con volver
        '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">'+
          '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.__SICIP_CERRAR_ASIGNACION__()">← Volver a Resumen</button>'+
        '</div>'+
        // Título
        '<div style="margin-bottom:1.25rem">'+
          '<h2 style="margin:0;font-size:1.2rem;font-weight:800;color:#003324">📝 Asignar Cuadros de Reemplazo</h2>'+
          '<p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.82rem">'+
            esc(s.nombreJefe) + ' · Mat. ' + esc(s.matricula) +
          '</p>'+
        '</div>'+

        '<div style="display:grid;grid-template-columns:1fr 1.5fr;gap:1rem;align-items:start">'+
          // Columna izquierda: Slots
          '<div>'+
            '<h3 style="margin:0 0 0.6rem;font-size:0.9rem;font-weight:700;color:#003324">📌 Tus Cuadros de Reemplazo</h3>'+
            '<p style="margin:0 0 0.6rem;font-size:0.72rem;color:#6b7280">Asigna hasta 3 personas por orden de prioridad</p>'+
            '<div style="display:flex;flex-direction:column;gap:0.6rem">'+
              slotsHtml +
            '</div>'+
            // Botón guardar
            '<div style="display:flex;gap:0.5rem;margin-top:1rem">'+
              '<button class="sicip-btn sicip-btn-success" onclick="window.__SICIP_GUARDAR_CUADROS__()" style="flex:1;justify-content:center;padding:0.65rem 1.5rem;font-size:0.9rem">💾 Guardar cambios</button>'+
              '<button class="sicip-btn sicip-btn-ghost" onclick="window.__SICIP_CERRAR_ASIGNACION__()">Cancelar</button>'+
            '</div>'+
          '</div>'+

          // Columna derecha: Buscador
          '<div>'+
            '<div class="sicip-card" style="padding:1rem">'+
              '<h3 style="margin:0 0 0.75rem;font-size:0.9rem;font-weight:700;color:#003324">🔎 Buscar Trabajador</h3>'+
              '<p style="margin:0 0 0.6rem;font-size:0.72rem;color:#6b7280">Busca por nombre, matrícula, categoría o adscripción</p>'+
              '<input type="text" id="sicip-buscar-input" class="sicip-input" '+
                'placeholder="Escribe nombre o matrícula..." '+
                'oninput="window.__SICIP_BUSCAR_TRABAJADOR__(this.value)" '+
                'autocomplete="off" style="margin-bottom:0.4rem">'+
              '<div style="margin-bottom:0.5rem;display:flex;gap:0.3rem;flex-wrap:wrap">'+
                '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm '+((!sessionStorage.getItem('sicip_buscar_filtro')||sessionStorage.getItem('sicip_buscar_filtro')==='TODO')?' sicip-btn-outline':'')+'" onclick="window.__SICIP_CAMBIO_FILTRO__(\'TODO\')">Todo</button>'+
                '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.__SICIP_CAMBIO_FILTRO__(\'nombre\')">Nombre</button>'+
                '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.__SICIP_CAMBIO_FILTRO__(\'matricula\')">Matrícula</button>'+
                '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.__SICIP_CAMBIO_FILTRO__(\'puesto\')">Puesto</button>'+
              '</div>'+
              '<div id="sicip-buscar-resultados" style="max-height:400px;overflow-y:auto">'+
                '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.82rem">🔍 Escribe para buscar trabajadores</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';
  }

  // ════════════════ FUNCIONES DE ASIGNACIÓN ════════════════

  window.__SICIP_ABRIR_ASIGNACION__ = function(matricula, nombreJefe) {
    log('📝 Asignar cuadro: ' + nombreJefe + ' (' + matricula + ')');
    showResumenCR(); // recarga resumen para actualizar
    // Inyectar el panel de asignación ENCIMA del resumen (modal inline)
    var container = document.querySelector('[data-sicip-cr-panel]');
    if (!container) return;
    
    var asignacionDiv = document.createElement('div');
    asignacionDiv.setAttribute('data-sicip-asignacion', '1');
    asignacionDiv.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9998;display:flex;align-items:center;justify-content:center;padding:1rem;animation:sicipFadeIn 0.2s ease';
    asignacionDiv.innerHTML = ''+
      '<div style="background:white;border-radius:16px;max-width:800px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:sicipFadeIn 0.25s ease">'+
        buildAsignacionPanel(matricula, nombreJefe)+
      '</div>';
    container.appendChild(asignacionDiv);
  };

  window.__SICIP_CERRAR_ASIGNACION__ = function() {
    var div = document.querySelector('[data-sicip-asignacion]');
    if (div) div.remove();
    _asigState = null;
    // Recargar el resumen para reflejar cambios
    showResumenCR();
  };

  // Buscar trabajadores
  window.__SICIP_BUSCAR_TRABAJADOR__ = function(query) {
    var resultadosDiv = document.getElementById('sicip-buscar-resultados');
    if (!resultadosDiv) return;
    if (!query || query.length < 2) {
      resultadosDiv.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.82rem">🔍 Escribe al menos 2 caracteres</div>';
      return;
    }
    
    var filtro = sessionStorage.getItem('sicip_buscar_filtro') || 'TODO';
    var q = query.toLowerCase();
    var data = getData();
    var trabajadores = data.trabajadores || [];
    
    // También buscar en plazas para datos adicionales
    var plazas = data.plazas || [];
    var plazaMap = {};
    plazas.forEach(function(p) { plazaMap[String(p.mat||'')] = p; });
    
    var resultados = [];
    trabajadores.forEach(function(t) {
      var nombre = (t.nombre || '').toLowerCase();
      var mat = (t.matricula || '').toLowerCase();
      var puesto = (t.descripcion || t.puesto || '').toLowerCase();
      var depto = (t.departamento || '').toLowerCase();
      var categoria = (t.categoria || '').toLowerCase();
      var adscripcion = (t.adscripcion || '').toLowerCase();
      
      var match = false;
      if (filtro === 'TODO') {
        match = nombre.indexOf(q)>=0 || mat.indexOf(q)>=0 || puesto.indexOf(q)>=0 || depto.indexOf(q)>=0 || categoria.indexOf(q)>=0 || adscripcion.indexOf(q)>=0;
      } else if (filtro === 'nombre') match = nombre.indexOf(q)>=0;
      else if (filtro === 'matricula') match = mat.indexOf(q)>=0;
      else if (filtro === 'puesto') match = puesto.indexOf(q)>=0;
      
      if (match) resultados.push(t);
    });
    
    // Limitar resultados
    resultados = resultados.slice(0, 50);
    
    if (resultados.length === 0) {
      resultadosDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.85rem">😕 No se encontraron trabajadores con "'+esc(query)+'"</div>';
      return;
    }
    
    var html = '<div style="display:flex;flex-direction:column;gap:0.35rem">'+
      '<div style="font-size:0.7rem;color:#6b7280;font-weight:600;margin-bottom:0.3rem">'+resultados.length+' resultado(s)</div>';
    
    resultados.forEach(function(t, idx) {
      // Buscar info adicional de plaza
      var plaza = plazaMap[String(t.matricula||'')];
      var puesto = plaza ? (plaza.puesto||t.descripcion||'') : (t.descripcion||'');
      var depto = plaza ? (plaza.jef||t.departamento||'') : (t.departamento||'');
      
      html += ''+
        '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0.65rem;border-radius:8px;cursor:pointer;transition:background 0.1s" '+
          'onmouseenter="this.style.background=\'#f9fafb\'" onmouseleave="this.style.background=\'transparent\'">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:600;font-size:0.84rem;color:#111827">'+esc(t.nombre||'')+'</div>'+
            '<div style="font-size:0.72rem;color:#6b7280;display:flex;flex-wrap:wrap;gap:0.2rem 0.5rem">'+
              '<span style="font-family:monospace;color:#005235">'+esc(t.matricula||'')+'</span>'+
              (t.categoria ? '· <span>'+esc(t.categoria)+'</span>' : '')+
              (t.adscripcion ? '· <span>'+esc(t.adscripcion)+'</span>' : '')+
              (puesto ? '· <span>'+esc(puesto.substring(0,30))+'</span>' : '')+
            '</div>'+
          '</div>'+
          '<div style="display:flex;gap:0.25rem;flex-shrink:0">'+
            _slotAssignBtn(t, 1, '1')+
            _slotAssignBtn(t, 2, '2')+
            _slotAssignBtn(t, 3, '3')+
          '</div>'+
        '</div>';
    });
    
    html += '</div>';
    resultadosDiv.innerHTML = html;
  };

  function _slotAssignBtn(trab, slot, label) {
    // Verificar si ya está asignado a otro slot
    var yaAsignado = _asigState && _asigState.candidatos.some(function(c) {
      return c.matricula === String(trab.matricula || trab.matricula) && c.posicion !== slot;
    });
    var enEsteSlot = _asigState && _asigState.candidatos.some(function(c) {
      return c.matricula === String(trab.matricula || trab.matricula) && c.posicion === slot;
    });
    
    if (enEsteSlot) return '<button class="sicip-btn sicip-btn-sm" style="background:#d1fae5;color:#065f46;border:none;cursor:default;font-weight:700">✓</button>';
    
    return '<button class="sicip-btn sicip-btn-sm" style="background:#005235;color:white;border:none;cursor:pointer;font-weight:600" onclick="window.__SICIP_ASIGNAR_A_SLOT__(\''+esc(trab.matricula||'')+'\',\''+esc((trab.nombre||'').replace(/'/g,"\\'"))+'\',\''+esc(trab.descripcion||'')+'\',\''+esc(trab.departamento||'')+'\',\''+esc(trab.tipoContrato||'')+'\','+slot+')" title="Asignar a Cuadro '+label+'">+'+label+'</button>';
  }

  window.__SICIP_CAMBIO_FILTRO__ = function(filtro) {
    sessionStorage.setItem('sicip_buscar_filtro', filtro);
    var input = document.getElementById('sicip-buscar-input');
    if (input && input.value) window.__SICIP_BUSCAR_TRABAJADOR__(input.value);
    // Actualizar estilos de botones
    var btns = document.querySelectorAll('[data-sicip-filtro-btn]');
    btns.forEach(function(b) { b.classList.remove('sicip-btn-outline'); b.style.background='transparent'; });
  };

  window.__SICIP_ASIGNAR_A_SLOT__ = function(matricula, nombre, descripcion, departamento, tipoContrato, slot) {
    if (!_asigState) return;
    
    // Si el slot ya tiene alguien, reemplazar
    var idx = _asigState.candidatos.findIndex(function(c){return c.posicion===slot;});
    if (idx >= 0) {
      if (!confirm('El Cuadro '+slot+' ya tiene asignado a ' + esc(_asigState.candidatos[idx].nombre) + '. ¿Reemplazar?')) return;
      _asigState.candidatos.splice(idx, 1);
    }
    
    // Si el trabajador ya está en otro slot, quitarlo de ahí
    var otroSlot = _asigState.candidatos.findIndex(function(c){return c.matricula===matricula;});
    if (otroSlot >= 0) _asigState.candidatos.splice(otroSlot, 1);
    
    _asigState.candidatos.push({
      posicion: slot,
      matricula: matricula,
      nombre: nombre,
      descripcion: descripcion,
      departamento: departamento,
      tipoContrato: tipoContrato
    });
    
    // Ordenar por posición
    _asigState.candidatos.sort(function(a,b){return a.posicion-b.posicion;});
    
    // Re-renderizar
    _rerenderAsignacion();
    toast('✅ ' + nombre + ' asignado al Cuadro ' + slot, 'success');
  };

  window.__SICIP_MOVER_CANDIDATO__ = function(posicion, direccion) {
    if (!_asigState) return;
    var idx = _asigState.candidatos.findIndex(function(c){return c.posicion===posicion;});
    if (idx < 0) return;
    
    var targetSlot = posicion + direccion;
    if (targetSlot < 1 || targetSlot > 3) return;
    
    var targetIdx = _asigState.candidatos.findIndex(function(c){return c.posicion===targetSlot;});
    
    if (targetIdx >= 0) {
      // Intercambiar posiciones
      _asigState.candidatos[idx].posicion = targetSlot;
      _asigState.candidatos[targetIdx].posicion = posicion;
    } else {
      _asigState.candidatos[idx].posicion = targetSlot;
    }
    
    _asigState.candidatos.sort(function(a,b){return a.posicion-b.posicion;});
    _rerenderAsignacion();
  };

  window.__SICIP_QUITAR_CANDIDATO__ = function(posicion) {
    if (!_asigState) return;
    if (!confirm('¿Quitar al candidato del Cuadro ' + posicion + '?')) return;
    var idx = _asigState.candidatos.findIndex(function(c){return c.posicion===posicion;});
    if (idx >= 0) _asigState.candidatos.splice(idx, 1);
    _rerenderAsignacion();
    toast('🗑️ Candidato quitado del Cuadro ' + posicion, 'info');
  };

  function _rerenderAsignacion() {
    // Re-renderizar solo los slots y el botón guardar
    var modal = document.querySelector('[data-sicip-asignacion]');
    if (!modal) return;
    var modalContent = modal.querySelector('div');
    if (!modalContent) return;
    modalContent.innerHTML = buildAsignacionPanel(_asigState.matricula, _asigState.nombreJefe);
    // Re-ejecutar búsqueda si hay texto
    var input = document.getElementById('sicip-buscar-input');
    if (input && input.value) window.__SICIP_BUSCAR_TRABAJADOR__(input.value);
  }

  // ════════════════ GUARDAR EN FIRESTORE ════════════════
  window.__SICIP_GUARDAR_CUADROS__ = function() {
    if (!_asigState) return;
    var s = _asigState;
    
    // Determinar status automático
    var numCand = s.candidatos.length;
    var status = 'SIN_ASIGNAR';
    if (numCand === 3) status = 'COMPLETO';
    else if (numCand > 0) status = 'PARCIAL';
    
    var btn = document.querySelector('[data-sicip-guardar-btn]');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Guardando...'; btn.style.opacity = '0.7'; }
    
    var dataToSave = {
      jefeMatricula: s.matricula,
      jefeNombre: s.nombreJefe,
      status: status,
      candidatos: s.candidatos,
      escolaridadRequerida: s.escolaridad || '',
      experienciaRequerida: s.experiencia || '',
      fechaActualizacion: new Date().toISOString(),
      version: Date.now()
    };
    
    var pathBase = docPath('cuadrosReemplazoBase', s.matricula);
    var pathUser = docPath('cuadrosReemplazoPorUsuario', s.matricula);
    var pathMeta = docPath('cuadrosReemplazoMeta', '_global');
    
    Promise.all([
      fsSet(pathBase, dataToSave),
      fsSet(pathUser, {
        matricula: s.matricula,
        jefeNombre: s.nombreJefe,
        status: status,
        candidatos: s.candidatos,
        escolaridadRequerida: s.escolaridad || '',
        experienciaRequerida: s.experiencia || '',
        version: Date.now(),
        fechaActualizacion: new Date().toISOString(),
        generadoEn: new Date().toISOString()
      }),
      fsSet(pathMeta, {
        ultimaActualizacion: new Date().toISOString(),
        version: Date.now(),
        accion: 'asignacion-'+s.matricula,
        fecha: new Date().toISOString()
      })
    ]).then(function() {
      // Actualizar datos locales en __SICIP_DATA__
      var data = getData();
      if (data.cuadros) {
        var idx = data.cuadros.findIndex(function(c){return String(c.jefeMatricula||c.id)===String(s.matricula);});
        if (idx >= 0) {
          data.cuadros[idx].status = status;
          data.cuadros[idx].candidatos = s.candidatos;
          data.cuadros[idx].fechaActualizacion = new Date().toISOString();
        } else {
          data.cuadros.push({
            jefeMatricula: s.matricula,
            status: status,
            candidatos: s.candidatos,
            escolaridadRequerida: s.escolaridad || '',
            experienciaRequerida: s.experiencia || '',
            fechaActualizacion: new Date().toISOString()
          });
        }
      }
      
      // Limpiar cache
      try { sessionStorage.removeItem('sicip_cuadros_cache'); } catch(e) {}
      
      log('✅ Cuadros guardados para ' + s.matricula);
      toast('✅ Cuadros guardados exitosamente (' + numCand + '/3 candidatos)', 'success');
      _asigState = null;
      
      // Recargar resumen
      showResumenCR();
    }).catch(function(err) {
      log('❌ Error guardando: ' + err.message);
      toast('❌ Error al guardar: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '💾 Guardar cambios'; btn.style.opacity = '1'; }
    });
  };

  // ════════════════ PANEL: MI CUADRO DE REEMPLAZO ════════════════
  function buildMiCuadroPanel() {
    var usuario = getUsuario();
    if (!usuario) return '<div style="padding:2rem;text-align:center;color:#dc2626">⚠️ Sesión no encontrada</div>';
    
    var matricula = usuario.matricula;
    var nombre = (usuario.nombre || '').replace(/\//g, ' ');
    var data = getData();
    var cuadroMap = getCuadroMap();
    var cr = cuadroMap[matricula];
    var candidatos = cr ? (cr.candidatos || []).sort(function(a,b){return a.posicion-b.posicion;}) : [];
    var status = cr ? (cr.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR';
    var si = getStatusInfo(status);
    
    var depto = usuario.departamentoNombre || '';
    var puesto = usuario.puesto || usuario.descripcion || '';
    
    // Inicializar estado para edición
    _asigState = {
      matricula: matricula,
      nombreJefe: nombre,
      candidatos: candidatos.map(function(c,i){return{posicion:c.posicion||i+1,matricula:c.matricula,nombre:c.nombre,descripcion:c.descripcion,departamento:c.departamento,tipoContrato:c.tipoContrato};}),
      status: status,
      escolaridad: cr ? (cr.escolaridadRequerida || '') : '',
      experiencia: cr ? (cr.experienciaRequerida || '') : '',
      original: JSON.parse(JSON.stringify(candidatos))
    };
    
    return renderMiCuadroHTML(matricula, nombre, depto, puesto, status, si);
  }

  function renderMiCuadroHTML(matricula, nombre, depto, puesto, status, si) {
    if (!_asigState) return '';
    var s = _asigState;
    var data = getData();
    
    // Stats info
    var numCand = s.candidatos.length;
    
    var slotsHtml = '';
    for (var i=1; i<=3; i++) {
      var cand = s.candidatos.find(function(c){return c.posicion===i;});
      var prioridadLabel = i===1 ? 'Primera opción (alta)' : i===2 ? 'Segunda opción' : 'Tercera opción (baja)';
      var slotColor = i===1 ? '#10b981' : i===2 ? '#f59e0b' : '#f97316';
      
      if (cand) {
        slotsHtml += ''+
          '<div class="sicip-slot sicip-slot-filled" style="flex-direction:column;gap:0.4rem;min-height:auto">'+
            '<div style="display:flex;align-items:center;gap:0.6rem;width:100%">'+
              '<div style="width:30px;height:30px;border-radius:50%;background:'+slotColor+';color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.85rem;flex-shrink:0">'+i+'</div>'+
              '<div style="flex:1;min-width:0">'+
                '<div style="font-weight:700;font-size:0.85rem;color:#111827">'+esc(cand.nombre||'')+'</div>'+
                '<div style="font-size:0.72rem;color:#6b7280;display:flex;flex-wrap:wrap;gap:0.2rem 0.5rem">'+
                  '<span style="font-family:monospace">'+esc(cand.matricula||'')+'</span>'+
                  (cand.descripcion ? '<span>·</span><span>'+esc(cand.descripcion)+'</span>' : '')+
                  (cand.departamento ? '<span>·</span><span>'+esc(cand.departamento)+'</span>' : '')+
                '</div>'+
              '</div>'+
              '<div style="display:flex;gap:0.2rem;flex-shrink:0">'+
                (i>1 ? '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.__SICIP_MOVER_CANDIDATO__('+i+',-1)" title="Subir prioridad">▲</button>' : '')+
                (i<3 ? '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.__SICIP_MOVER_CANDIDATO__('+i+',1)" title="Bajar prioridad">▼</button>' : '')+
                '<button class="sicip-btn sicip-btn-danger sicip-btn-sm" onclick="window.__SICIP_QUITAR_CANDIDATO__('+i+')" title="Quitar">✕</button>'+
              '</div>'+
            '</div>'+
            '<div style="width:100%"><span class="sicip-badge" style="background:'+slotColor+'18;color:'+slotColor+'">'+prioridadLabel+'</span></div>'+
          '</div>';
      } else {
        slotsHtml += ''+
          '<div class="sicip-slot" style="flex-direction:column;gap:0.4rem;min-height:auto;padding:0.85rem">'+
            '<div style="display:flex;align-items:center;gap:0.6rem;width:100%">'+
              '<div style="width:30px;height:30px;border-radius:50%;background:#e5e7eb;color:#9ca3af;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.85rem;flex-shrink:0">'+i+'</div>'+
              '<div style="flex:1"><div style="font-weight:600;font-size:0.82rem;color:#9ca3af">En espera de asignación</div><div style="font-size:0.7rem;color:#d1d5db">'+prioridadLabel+'</div></div>'+
            '</div>'+
          '</div>';
      }
    }

    return ''+
      '<div style="padding:1rem 1.25rem;animation:sicipFadeIn 0.25s ease">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem">'+
          '<div>'+
            '<button class="sicip-btn sicip-btn-ghost sicip-btn-sm" onclick="window.showReactContent()" style="margin-bottom:0.35rem">← Volver al inicio</button>'+
            '<h2 style="margin:0;font-size:1.2rem;font-weight:800;color:#003324">👤 Mi Cuadro de Reemplazo</h2>'+
            '<p style="margin:0.15rem 0 0;color:#6b7280;font-size:0.8rem">'+esc(nombre)+(puesto?' · '+esc(puesto):'')+
              (depto?' · '+esc(depto.substring(0,30)):'')+'</p>'+
          '</div>'+
          '<div style="display:flex;align-items:center;gap:0.5rem">'+
            '<span class="sicip-badge" style="background:'+si.bg+';color:'+si.fg+';font-size:0.78rem;padding:0.25rem 0.7rem">'+si.label+'</span>'+
            '<span style="font-weight:800;font-size:1.1rem;color:'+si.bar+'">'+numCand+'/3</span>'+
          '</div>'+
        '</div>'+

        // Tarjeta de información del jefe
        '<div class="sicip-card" style="padding:0.9rem 1rem;margin-bottom:1rem">'+
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.4rem;font-size:0.82rem">'+
            '<div><span style="color:#888">Matrícula:</span> <strong>'+esc(matricula)+'</strong></div>'+
            (depto ? '<div><span style="color:#888">Departamento:</span> <strong>'+esc(depto)+'</strong></div>' : '')+
            '<div><span style="color:#888">Estatus:</span> <strong style="color:'+si.fg+'">'+si.label+'</strong></div>'+
          '</div>'+
        '</div>'+

        '<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:1rem;align-items:start">'+
          // Slots
          '<div>'+
            '<h3 style="margin:0 0 0.6rem;font-size:0.9rem;font-weight:700;color:#003324">📌 Cuadros de Reemplazo</h3>'+
            '<p style="margin:0 0 0.6rem;font-size:0.72rem;color:#6b7280">Asigna hasta 3 personas por orden de prioridad. Usa ▲ ▼ para cambiar orden.</p>'+
            '<div style="display:flex;flex-direction:column;gap:0.5rem">'+
              slotsHtml +
            '</div>'+
            '<div style="display:flex;gap:0.5rem;margin-top:1rem">'+
              '<button class="sicip-btn sicip-btn-success" onclick="window.__SICIP_GUARDAR_CUADROS__()" style="flex:1;justify-content:center;padding:0.6rem 1.5rem;font-size:0.9rem">💾 Guardar cambios</button>'+
            '</div>'+
          '</div>'+

          // Buscador
          '<div>'+
            '<div class="sicip-card" style="padding:1rem">'+
              '<h3 style="margin:0 0 0.75rem;font-size:0.9rem;font-weight:700;color:#003324">🔎 Buscar Trabajador</h3>'+
              '<input type="text" id="sicip-buscar-input-mi" class="sicip-input" '+
                'placeholder="Nombre, matrícula..." oninput="window.__SICIP_BUSCAR_MI_CUADRO__(this.value)" autocomplete="off">'+
              '<div id="sicip-buscar-mi-resultados" style="max-height:350px;overflow-y:auto;margin-top:0.5rem">'+
                '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.82rem">🔍 Busca para asignar a tus cuadros</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';
  }

  window.__SICIP_BUSCAR_MI_CUADRO__ = function(query) {
    var resultadosDiv = document.getElementById('sicip-buscar-mi-resultados');
    if (!resultadosDiv) return;
    if (!query || query.length < 2) {
      resultadosDiv.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.82rem">🔍 Escribe al menos 2 caracteres</div>';
      return;
    }
    
    var q = query.toLowerCase();
    var data = getData();
    var trabajadores = (data.trabajadores || []).filter(function(t) {
      var nombre = (t.nombre || '').toLowerCase();
      var mat = (t.matricula || '').toLowerCase();
      return nombre.indexOf(q)>=0 || mat.indexOf(q)>=0;
    }).slice(0, 30);
    
    if (trabajadores.length === 0) {
      resultadosDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.85rem">😕 No se encontraron trabajadores</div>';
      return;
    }
    
    var html = '<div style="display:flex;flex-direction:column;gap:0.25rem">';
    trabajadores.forEach(function(t) {
      html += ''+
        '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.65rem;border-radius:8px;transition:background 0.1s" '+
          'onmouseenter="this.style.background=\'#f9fafb\'" onmouseleave="this.style.background=\'transparent\'">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:600;font-size:0.84rem;color:#111827">'+esc(t.nombre||'')+'</div>'+
            '<div style="font-size:0.72rem;color:#6b7280"><span style="font-family:monospace">'+esc(t.matricula||'')+'</span>'+
              (t.descripcion ? ' · '+esc(t.descripcion) : '')+
            '</div>'+
          '</div>'+
          '<div style="display:flex;gap:0.2rem">'+
            '<button class="sicip-btn sicip-btn-primary sicip-btn-sm" onclick="window.__SICIP_ASIGNAR_A_SLOT__(\''+esc(t.matricula||'')+'\',\''+esc((t.nombre||'').replace(/'/g,"\\'"))+'\',\''+esc(t.descripcion||'')+'\',\''+esc(t.departamento||'')+'\',\''+esc(t.tipoContrato||'')+'\',1)">+1</button>'+
            '<button class="sicip-btn sicip-btn-primary sicip-btn-sm" onclick="window.__SICIP_ASIGNAR_A_SLOT__(\''+esc(t.matricula||'')+'\',\''+esc((t.nombre||'').replace(/'/g,"\\'"))+'\',\''+esc(t.descripcion||'')+'\',\''+esc(t.departamento||'')+'\',\''+esc(t.tipoContrato||'')+'\',2)">+2</button>'+
            '<button class="sicip-btn sicip-btn-primary sicip-btn-sm" onclick="window.__SICIP_ASIGNAR_A_SLOT__(\''+esc(t.matricula||'')+'\',\''+esc((t.nombre||'').replace(/'/g,"\\'"))+'\',\''+esc(t.descripcion||'')+'\',\''+esc(t.departamento||'')+'\',\''+esc(t.tipoContrato||'')+'\',3)">+3</button>'+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    resultadosDiv.innerHTML = html;
  };

  function showMiCuadro() {
    log('👤 Mostrando Mi Cuadro v2');
    var html = buildMiCuadroPanel();
    showContent(html);
  }

  // ════════════════ MENÚ ACORDEÓN SIDEBAR ════════════════
  function createSubItem(label, iconSvg, onClick) {
    var el = document.createElement('button');
    el.setAttribute('data-sicip-sub-v2', '1');
    el.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.65rem;padding:0.6rem 1rem 0.6rem 2rem;border:none;cursor:pointer;font-size:0.82rem;font-weight:500;color:rgba(255,255,255,0.75);background:rgba(0,0,0,0.15);border-left:3px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,sans-serif';
    el.innerHTML = '<span style="color:rgba(255,255,255,0.5);flex-shrink:0;width:16px;display:flex;align-items:center;justify-content:center">'+iconSvg+'</span><span style="flex:1;text-align:left">'+label+'</span>';
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
    container.setAttribute('data-sicip-mod-v2', 'cuadros');
    
    var header = document.createElement('button');
    header.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1rem;border:none;cursor:pointer;font-size:0.88rem;font-weight:600;color:rgba(255,255,255,0.85);background:transparent;border-left:4px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,sans-serif';
    header.innerHTML = ''+
      '<span style="color:#5cff5c;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>'+
      '<span style="flex:1;text-align:left">Cuadros de Reemplazo</span>'+
      '<span data-sicip-arrow-v2 style="color:rgba(255,255,255,0.4);transition:transform 0.2s;font-size:0.65rem">▼</span>';
    
    var submenu = document.createElement('div');
    submenu.style.cssText = 'overflow:hidden;max-height:0;transition:max-height 0.25s ease-out;background:rgba(0,0,0,0.05)';
    
    var subitems = document.createElement('div');
    subitems.style.padding = '2px 0 4px 0';
    
    if (isAP || isAdmin) {
      subitems.appendChild(createSubItem('Resumen CR',
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>',
        function() { showResumenCR(); }
      ));
    }
    
    if (isJS || isAdmin) {
      subitems.appendChild(createSubItem('Mi Cuadro de Reemplazo',
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        function() { showMiCuadro(); }
      ));
    }
    
    subitems.appendChild(createSubItem('Solicitar Puesto de Confianza',
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      function() { showReactContent(); window.history.replaceState({},'','/buscar-jefe'); window.dispatchEvent(new Event('popstate')); }
    ));
    
    submenu.appendChild(subitems);
    container.appendChild(header);
    container.appendChild(submenu);
    
    header.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = submenu.style.maxHeight !== '0px' && submenu.style.maxHeight !== '';
      if (isOpen) {
        submenu.style.maxHeight = '0px';
        header.querySelector('[data-sicip-arrow-v2]').style.transform = 'rotate(0deg)';
        header.style.background = 'transparent';
        header.style.borderLeftColor = 'transparent';
      } else {
        submenu.style.maxHeight = '300px';
        header.querySelector('[data-sicip-arrow-v2]').style.transform = 'rotate(180deg)';
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
    if (sidebar.querySelector('[data-sicip-mod-v2="cuadros"]')) { log('Ya parcheado v2'); return; }
    
    var allButtons = sidebar.querySelectorAll('button');
    for (var i = 0; i < allButtons.length; i++) {
      var btn = allButtons[i];
      if (btn.hasAttribute('data-sicip-sub') || btn.hasAttribute('data-sicip-sub-v2')) continue;
      var text = (btn.textContent || '').trim();
      if (text === 'Cuadros Reemplazo' || text === 'Mi Cuadro de Reemplazo' || 
          text === 'Solicitar Puesto de Confianza' || text === 'Aprobaciones' || 
          text === 'Crear Plaza' || text === 'Explorar Plazas') {
        btn.style.display = 'none';
        btn.setAttribute('data-sicip-hidden', '1');
      }
    }
    
    // Ocultar también el acordeón viejo si existe
    var oldAcc = sidebar.querySelector('[data-sicip-mod="cuadros"]');
    if (oldAcc) oldAcc.style.display = 'none';
    
    var insertBefore = null;
    for (var i = 0; i < allButtons.length; i++) {
      if (allButtons[i].getAttribute('data-sicip-hidden') !== '1' && 
          !allButtons[i].hasAttribute('data-sicip-sub') && 
          !allButtons[i].hasAttribute('data-sicip-sub-v2') &&
          allButtons[i].offsetParent !== null) {
        var txt = (allButtons[i].textContent || '').trim();
        if (txt === 'Solicitudes' || txt === 'Bandeja de Trámites' || txt === 'Bandeja') {
          insertBefore = allButtons[i];
          break;
        }
      }
    }
    
    var accordion = buildAccordion(usuario);
    if (insertBefore) {
      var parent = insertBefore.parentNode || container;
      parent.insertBefore(accordion, insertBefore.nextSibling);
    } else if (container.firstChild) {
      container.insertBefore(accordion, container.firstChild.nextSibling);
    } else {
      container.appendChild(accordion);
    }
    
    log('✅ Acordeón v2 insertado');
  }

  // ════════════════ INIT ════════════════
  function init() {
    injectStyles();
    
    function tryPatch() {
      var sidebar = document.querySelector('nav');
      if (sidebar && sidebar.querySelector('div') && sidebar.querySelector('button') && !sidebar.querySelector('[data-sicip-mod-v2="cuadros"]')) {
        log('Sidebar listo, parcheando v2...');
        patchSidebar();
        return true;
      }
      return false;
    }
    
    var tried = false;
    function safePatch() {
      if (tried) return;
      tried = true;
      if (!tryPatch()) {
        setTimeout(function() { tryPatch() || setTimeout(function() { tryPatch() || setTimeout(tryPatch, 500); }, 500); }, 300);
      }
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(safePatch, 100);
    } else {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(safePatch, 100); });
    }
    
    log('✅ v' + VERSION + ' cargado');
  }

  init();
})();
