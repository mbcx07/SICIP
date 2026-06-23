// SICIP - Módulo de Recepciones v5.21.1
// Recepción de documentos con cálculo de días naturales, tipos de documento, folio y TXT
(function(){
  'use strict';
  var VERSION = '5.21.1';
  var FS_PROJECT = 'sicip-bcs';
  var FS_BASE = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents';

  function log(msg) { console.log('[SICIP-Recepciones v' + VERSION + '] ' + msg); }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function getUsuario() {
    try { var s = sessionStorage.getItem('sicip_usuario'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }
  function getData() { return window.__SICIP_DATA__ || {}; }

  // ════════════════ FIRESTORE REST API ════════════════
  function toFSVal(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toFSVal) } };
    if (typeof v === 'object') { var f = {}; for (var k in v) f[k] = toFSVal(v[k]); return { mapValue: { fields: f } }; }
    return { stringValue: String(v) };
  }
  function toFSDoc(obj) { var f = {}; for (var k in obj) { if (k === '_id') continue; f[k] = toFSVal(obj[k]); } return { fields: f }; }
  function fromFSVal(v) {
    if (!v || v.nullValue !== undefined) return null;
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
    if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.arrayValue) return (v.arrayValue.values || []).map(fromFSVal);
    if (v.mapValue) { var o = {}; if (v.mapValue.fields) for (var k in v.mapValue.fields) o[k] = fromFSVal(v.mapValue.fields[k]); return o; }
    return null;
  }
  function fromFSDoc(doc) {
    var obj = { _id: doc.name ? doc.name.split('/').pop() : null };
    if (doc.fields) for (var k in doc.fields) obj[k] = fromFSVal(doc.fields[k]);
    return obj;
  }

  async function fsGet(path) {
    try { var r = await fetch(path); if (!r.ok) return null; var d = await r.json(); return d.error ? null : fromFSDoc(d); } catch(e) { return null; }
  }

  async function fsCreate(coll, obj) {
    var r = await fetch(FS_BASE + '/' + encodeURIComponent(coll), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toFSDoc(obj))
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function fsQuery(coll, fieldFilter) {
    var body = JSON.stringify({ structuredQuery: {
      from: [{ collectionId: coll }],
      where: { fieldFilter: fieldFilter },
      orderBy: [{ field: { fieldPath: 'fechaRecepcion' }, direction: 'DESCENDING' }],
      limit: 50
    }});
    var r = await fetch(FS_BASE + ':runQuery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    if (!r.ok) return [];
    var data = await r.json();
    if (!Array.isArray(data)) return [];
    return data.filter(function(d) { return d.document; }).map(function(d) { return fromFSDoc(d.document); });
  }

  // ════════════════ TIPOS DE DOCUMENTO (cascada) ════════════════
  // Categoría principal → subtipos
  var TIPOS_CATEGORIAS = [
    {
      label: 'Pase',
      icon: '📄',
      subtipos: [
        'Pase de entrada a oficial',
        'Pase de salida a oficial',
        'Pase intermedio a oficial',
        'Pase particular de entrada',
        'Pase particular de salida',
        'Pase particular intermedio',
        'Pase de entrada a médico',
        'Pase de salida a médico',
        'Pase intermedio a médico'
      ]
    },
    {
      label: 'Incapacidad',
      icon: '🏥',
      subtipos: [
        'Incapacidad por riesgo de trabajo',
        'Incapacidad por enfermedad general',
        'Incapacidad por maternidad'
      ]
    },
    {
      label: 'Licencia',
      icon: '📋',
      subtipos: [
        'Licencia sin goce de sueldo',
        'Licencia con goce de sueldo',
        'Licencia por cuidados médicos',
        'Licencia por lactancia',
        'Licencia por paternidad',
        'Licencia por gravidez'
      ]
    },
    {
      label: 'Constancia médica',
      icon: '🩺',
      subtipos: null
    },
    {
      label: 'TXT (Trabajador x Trabajador)',
      icon: '👥',
      subtipos: null
    },
    {
      label: 'Otro documento',
      icon: '📎',
      subtipos: null
    }
  ];

  function getCategoriaByLabel(label) {
    for (var i = 0; i < TIPOS_CATEGORIAS.length; i++) {
      if (TIPOS_CATEGORIAS[i].label === label) return TIPOS_CATEGORIAS[i];
    }
    return null;
  }

  // ════════════════ LAYOUT HELPERS ════════════════
  function getContentContainer() {
    var main = document.querySelector('main');
    if (main) return main;
    var root = document.getElementById('root');
    if (root && root.children.length > 0) {
      for (var i = 0; i < root.children.length; i++) {
        var c = root.children[i];
        if (c.tagName !== 'NAV' && c.tagName !== 'HEADER' && c.tagName !== 'ASIDE') return c;
      }
    }
    return root;
  }

  function removePanel() {
    var p = document.querySelector('[data-sicip-recepciones-panel]');
    if (p) p.remove();
  }

  function showContent(html) {
    var panel = document.createElement('div');
    panel.setAttribute('data-sicip-recepciones-panel', 'layout');
    panel.innerHTML = html;
    if (window.SICIPModuleHost) {
      window.SICIPModuleHost.mount(panel);
    } else {
      removePanel();
      var container = getContentContainer();
      if (!container) return;
      // Hide React content
      for (var i = 0; i < container.children.length; i++) {
        if (!container.children[i].hasAttribute('data-sicip-recepciones-panel')) {
          container.children[i].style.display = 'none';
        }
      }
      container.appendChild(panel);
    }
  }

  function showReactContent() {
    if (window.SICIPModuleHost) {
      window.SICIPModuleHost.showReact();
      return;
    }
    removePanel();
    var container = getContentContainer();
    if (!container) return;
    for (var i = 0; i < container.children.length; i++) {
      if (!container.children[i].hasAttribute('data-sicip-recepciones-panel')) {
        container.children[i].style.display = '';
      }
    }
  }

  // ════════════════ TOAST ════════════════
  function toast(msg, type) {
    var existing = document.querySelector('.sicip-recep-toast');
    if (existing) existing.remove();
    var colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warn: '#f59e0b' };
    var t = document.createElement('div');
    t.className = 'sicip-recep-toast';
    t.innerHTML = msg;
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1f2937;color:white;padding:12px 20px;border-radius:10px;font-size:0.88rem;font-weight:600;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,0.2);animation:sicipRecepFadeIn 0.3s ease;font-family:Inter,sans-serif;max-width:360px;border-left:4px solid ' + (colors[type] || '#27ae60');
    document.body.appendChild(t);
    setTimeout(function() { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; }, 3000);
    setTimeout(function() { if (t.parentNode) t.remove(); }, 3400);
  }

  // ════════════════ ESTILOS ════════════════
  function injectStyles() {
    if (document.querySelector('[data-sicip-recepciones-styles]')) return;
    var s = document.createElement('style');
    s.setAttribute('data-sicip-recepciones-styles', '1');
    s.textContent = '' +
      '@keyframes sicipRecepFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }' +
      '@keyframes sicipRecepSpin { to{transform:rotate(360deg)} }' +
      '.sicip-recep-card { background:white;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 2px 8px rgba(0,0,0,0.04);overflow:hidden; }' +
      '.sicip-recep-btn { display:inline-flex;align-items:center;gap:6px;padding:0.5rem 1rem;border:none;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:Inter,sans-serif;white-space:nowrap; }' +
      '.sicip-recep-btn:active { transform:scale(0.97); }' +
      '.sicip-recep-btn-primary { background:#005235;color:white; }' +
      '.sicip-recep-btn-primary:hover { background:#003824;box-shadow:0 2px 8px rgba(0,82,53,0.25); }' +
      '.sicip-recep-btn-success { background:#10b981;color:white; }' +
      '.sicip-recep-btn-success:hover { background:#059669; }' +
      '.sicip-recep-btn-ghost { background:transparent;color:#6b7280; }' +
      '.sicip-recep-btn-ghost:hover { background:#f3f4f6;color:#374151; }' +
      '.sicip-recep-btn-danger { background:#fef2f2;color:#dc2626;border:1px solid #fecaca; }' +
      '.sicip-recep-btn-danger:hover { background:#fee2e2; }' +
      '.sicip-recep-btn-sm { padding:0.3rem 0.6rem;font-size:0.75rem;border-radius:6px; }' +
      '.sicip-recep-input { padding:0.55rem 0.75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:0.84rem;font-family:Inter,sans-serif;transition:border-color 0.15s,box-shadow 0.15s;box-sizing:border-box;outline:none;width:100%; }' +
      '.sicip-recep-input:focus { border-color:#005235;box-shadow:0 0 0 3px rgba(0,82,53,0.1); }' +
      '.sicip-recep-select { padding:0.55rem 0.75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:0.84rem;font-family:Inter,sans-serif;background:white;cursor:pointer;outline:none;box-sizing:border-box; }' +
      '.sicip-recep-select:focus { border-color:#005235;box-shadow:0 0 0 3px rgba(0,82,53,0.1); }' +
      '@media (max-width:640px) { .sicip-recep-grid { grid-template-columns:1fr!important; } }' +
    '';
    document.head.appendChild(s);
  }

  // ════════════════ CÁLCULO DE FECHA TÉRMINO ════════════════
  function addDays(dateStr, days) {
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + parseInt(days, 10));
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function recalcFechaTermino() {
    var inicioInput = document.getElementById('sicip-recep-fecha-inicio');
    var diasInput = document.getElementById('sicip-recep-dias');
    var terminoInput = document.getElementById('sicip-recep-fecha-termino');
    if (!inicioInput || !diasInput || !terminoInput) return;
    var inicio = inicioInput.value;
    var dias = parseInt(diasInput.value, 10) || 0;
    if (inicio && dias > 0) {
      terminoInput.value = addDays(inicio, dias);
    } else {
      terminoInput.value = '';
    }
  }

  // ════════════════ BUSCADOR DE TRABAJADOR ════════════════
  function buscarTrabajador(query) {
    var resultadosDiv = document.getElementById('sicip-recep-trab-resultados');
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
      var plaza = String(t.descripcion || t.puesto || t.categoria || '').toLowerCase();
      var depto = String(t.departamento || t.departamentoNombre || t.adscripcion || '').toLowerCase();
      return nombre.indexOf(q) >= 0 || mat.indexOf(q) >= 0 || plaza.indexOf(q) >= 0 || depto.indexOf(q) >= 0;
    }).slice(0, 30);

    if (trabajadores.length === 0) {
      resultadosDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.85rem">😕 No se encontraron trabajadores</div>';
      return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:0.25rem">';
    trabajadores.forEach(function(t) {
      var mat = esc(t.matricula || '');
      var nombre = esc((t.nombre || '').replace(/'/g, "\\'"));
      var desc = esc(t.descripcion || '');
      html += '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.65rem;border-radius:8px;cursor:pointer;transition:background 0.1s" ' +
        'onmouseenter="this.style.background=\'#f9fafb\'" onmouseleave="this.style.background=\'transparent\'" ' +
        'onclick="window.__SICIP_RECEP_SELEC_TRAB__(&quot;' + mat + '&quot;,&quot;' + nombre + '&quot;)">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:600;font-size:0.84rem;color:#111827">' + esc(t.nombre || '') + '</div>' +
          '<div style="font-size:0.72rem;color:#6b7280"><span style="font-family:monospace;color:#005235">' + mat + '</span>' +
            (desc ? ' · ' + desc : '') +
          '</div>' +
        '</div></div>';
    });
    html += '</div>';
    resultadosDiv.innerHTML = html;
  }

  // ════════════════ ESTADO ════════════════
  var _selectedTrab = null;

  window.__SICIP_RECEP_SELEC_TRAB__ = function(matricula, nombre) {
    _selectedTrab = { matricula: matricula, nombre: nombre };
    var display = document.getElementById('sicip-recep-trab-selected');
    if (display) {
      display.innerHTML = '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:#f0fdf4;border:1px solid #a7f3d0;border-radius:8px">' +
        '<span style="font-size:0.9rem">✅</span>' +
        '<div><div style="font-weight:600;font-size:0.84rem;color:#065f46">' + esc(nombre) + '</div>' +
        '<div style="font-size:0.72rem;color:#6b7280;font-family:monospace">' + esc(matricula) + '</div></div>' +
        '<button class="sicip-recep-btn sicip-recep-btn-ghost sicip-recep-btn-sm" style="margin-left:auto" onclick="window.__SICIP_RECEP_CLEAR_TRAB__()">✕</button>' +
      '</div>';
    }
    // Limpiar búsqueda
    var input = document.getElementById('sicip-recep-trab-buscar');
    var resultados = document.getElementById('sicip-recep-trab-resultados');
    if (input) input.value = '';
    if (resultados) resultados.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.82rem">Trabajador seleccionado</div>';
  };

  window.__SICIP_RECEP_CLEAR_TRAB__ = function() {
    _selectedTrab = null;
    var display = document.getElementById('sicip-recep-trab-selected');
    if (display) display.innerHTML = '<div style="text-align:center;padding:0.75rem;color:#9ca3af;font-size:0.82rem">Ningún trabajador seleccionado</div>';
  };

  // ════════════════ GUARDAR RECEPCIÓN ════════════════
  window.__SICIP_RECEP_GUARDAR__ = function() {
    var tipo = document.getElementById('sicip-recep-tipo');
    var subtipoEl = document.getElementById('sicip-recep-subtipo');
    var subtipoWrap = document.getElementById('sicip-recep-subtipo-wrap');
    var fechaInicio = document.getElementById('sicip-recep-fecha-inicio');
    var diasNaturales = document.getElementById('sicip-recep-dias');
    var fechaTermino = document.getElementById('sicip-recep-fecha-termino');
    var folio = document.getElementById('sicip-recep-folio');
    var descripcion = document.getElementById('sicip-recep-descripcion');
    var btn = document.getElementById('sicip-recep-guardar-btn');

    if (!tipo || !tipo.value) { toast('⚠️ Selecciona un tipo de documento', 'warn'); return; }

    // Determinar el tipo final: si hay subtipo, usar subtipo; si no, usar categoría
    var tipoFinal = tipo.value;
    if (subtipoWrap && subtipoWrap.style.display !== 'none' && subtipoEl && subtipoEl.value) {
      tipoFinal = subtipoEl.value;
    }
    if (!fechaInicio || !fechaInicio.value) { toast('⚠️ Selecciona la fecha de inicio', 'warn'); return; }
    if (!diasNaturales || !diasNaturales.value || parseInt(diasNaturales.value, 10) <= 0) { toast('⚠️ Ingresa los días naturales', 'warn'); return; }
    if (!_selectedTrab) { toast('⚠️ Selecciona un trabajador', 'warn'); return; }

    var usuario = getUsuario();
    var dataToSave = {
      tipo: tipoFinal,
      categoria: tipo.value,
      fechaInicio: fechaInicio.value,
      diasNaturales: parseInt(diasNaturales.value, 10),
      fechaTermino: fechaTermino.value || addDays(fechaInicio.value, parseInt(diasNaturales.value, 10)),
      folioReferencia: folio ? folio.value : '',
      descripcion: descripcion ? descripcion.value : '',
      trabajadorMatricula: _selectedTrab.matricula,
      trabajadorNombre: _selectedTrab.nombre,
      fechaRecepcion: new Date().toISOString(),
      recibidoPor: usuario ? (usuario.matricula || '') : '',
      recibidoPorNombre: usuario ? (usuario.nombre || '') : '',
      version: Date.now()
    };

    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Guardando...'; btn.style.opacity = '0.7'; }

    fsCreate('recepcionesDocumentos', dataToSave).then(function() {
      log('✅ Recepción guardada para ' + _selectedTrab.matricula);
      toast('✅ Documento recibido y guardado exitosamente', 'success');
      // Limpiar formulario
      tipo.value = '';
      fechaInicio.value = '';
      diasNaturales.value = '';
      fechaTermino.value = '';
      if (folio) folio.value = '';
      if (descripcion) descripcion.value = '';
      window.__SICIP_RECEP_CLEAR_TRAB__();
      // Recargar lista
      cargarRecepcionesRecientes();
      if (btn) { btn.disabled = false; btn.innerHTML = '💾 Guardar recepción'; btn.style.opacity = '1'; }
    }).catch(function(err) {
      log('❌ Error guardando: ' + err.message);
      toast('❌ Error al guardar: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '💾 Guardar recepción'; btn.style.opacity = '1'; }
    });
  };

  // ════════════════ LISTA DE RECEPCIONES RECIENTES ════════════════
  async function cargarRecepcionesRecientes() {
    var listaDiv = document.getElementById('sicip-recep-lista');
    if (!listaDiv) return;
    listaDiv.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.82rem"><span style="display:inline-block;width:16px;height:16px;border:2px solid #005235;border-top-color:transparent;border-radius:50%;animation:sicipRecepSpin 0.6s linear infinite;vertical-align:middle"></span> Cargando recepciones...</div>';

    try {
      var usuario = getUsuario();
      var docs = [];
      // Intentar query por recibidoPor, si falla hacer query general
      if (usuario && usuario.matricula) {
        docs = await fsQuery('recepcionesDocumentos', {
          field: { fieldPath: 'recibidoPor' },
          op: '==',
          value: { stringValue: usuario.matricula }
        });
      }
      if (!docs || docs.length === 0) {
        // Cargar todos los recientes
        var r = await fetch(FS_BASE + '/recepcionesDocumentos?orderBy=fechaRecepcion&direction=DESCENDING&limit=20');
        if (r.ok) {
          var data = await r.json();
          if (data.documents) {
            docs = data.documents.map(fromFSDoc);
          }
        }
      }

      if (!docs || docs.length === 0) {
        listaDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.85rem">📭 No hay recepciones registradas</div>';
        return;
      }

      var html = '<div style="display:flex;flex-direction:column;gap:0.5rem">';
      docs.slice(0, 20).forEach(function(doc) {
        var fecha = doc.fechaRecepcion ? new Date(doc.fechaRecepcion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        var tipoLabel = esc(doc.tipo || 'N/A');
        var trabNombre = esc(doc.trabajadorNombre || '');
        var trabMat = esc(doc.trabajadorMatricula || '');
        var folio = esc(doc.folioReferencia || '');
        var desc = esc(doc.descripcion || '');
        var fechaInicio = esc(doc.fechaInicio || '');
        var fechaTermino = esc(doc.fechaTermino || '');
        var dias = doc.diasNaturales || 0;

        var tipoColor = '#005235';
        if (tipoLabel.indexOf('Incapacidad') >= 0) tipoColor = '#dc2626';
        else if (tipoLabel.indexOf('Licencia') >= 0) tipoColor = '#f59e0b';
        else if (tipoLabel.indexOf('Pase') >= 0) tipoColor = '#3b82f6';
        else if (tipoLabel.indexOf('TXT') >= 0) tipoColor = '#8b5cf6';
        else if (tipoLabel.indexOf('Constancia') >= 0) tipoColor = '#10b981';

        html += '<div class="sicip-recep-card" style="padding:0.75rem 1rem">' +
          '<div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.35rem">' +
            '<span style="display:inline-flex;align-items:center;padding:0.18rem 0.55rem;border-radius:999px;font-size:0.68rem;font-weight:700;white-space:nowrap;background:' + tipoColor + '20;color:' + tipoColor + '">' + tipoLabel + '</span>' +
            (fecha ? '<span style="font-size:0.7rem;color:#6b7280">' + fecha + '</span>' : '') +
          '</div>' +
          '<div style="font-size:0.84rem;font-weight:600;color:#111827">' + trabNombre + ' <span style="font-family:monospace;font-weight:400;color:#6b7280;font-size:0.78rem">' + trabMat + '</span></div>' +
          (dias > 0 ? '<div style="font-size:0.72rem;color:#6b7280;margin-top:0.2rem">📅 ' + fechaInicio + ' → ' + fechaTermino + ' (' + dias + ' días naturales)</div>' : '') +
          (folio ? '<div style="font-size:0.72rem;color:#6b7280;margin-top:0.15rem">📄 Folio: ' + folio + '</div>' : '') +
          (desc ? '<div style="font-size:0.72rem;color:#6b7280;margin-top:0.15rem">📝 ' + desc + '</div>' : '') +
        '</div>';
      });
      html += '</div>';
      listaDiv.innerHTML = html;
    } catch(e) {
      listaDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.85rem">📭 No se pudieron cargar las recepciones</div>';
      log('❌ Error cargando recepciones: ' + e.message);
    }
  }

  window.__SICIP_RECEP_CARGAR__ = cargarRecepcionesRecientes;

  // ════════════════ PANEL PRINCIPAL ════════════════
  function buildRecepcionesPanel() {
    var usuario = getUsuario();
    if (!usuario) return '<div style="padding:2rem;text-align:center;color:#dc2626">⚠️ Sesión no encontrada</div>';

    // Opciones de categoría principal
    var catOptions = '<option value="">— Selecciona categoría —</option>';
    TIPOS_CATEGORIAS.forEach(function(c) {
      catOptions += '<option value="' + esc(c.label) + '">' + c.icon + ' ' + esc(c.label) + '</option>';
    });

    return '' +
      '<div style="padding:1rem 1.25rem;animation:sicipRecepFadeIn 0.25s ease">' +
        // Header
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem">' +
          '<div>' +
            '<button class="sicip-recep-btn sicip-recep-btn-ghost sicip-recep-btn-sm" onclick="window.__SICIP_RECEP_VOLVER__()" style="margin-bottom:0.35rem">← Volver al inicio</button>' +
            '<h2 style="margin:0;font-size:1.3rem;font-weight:800;color:#003324">📋 Recepciones de Documentos</h2>' +
            '<p style="margin:0.15rem 0 0;color:#6b7280;font-size:0.8rem">Registro de documentos recibidos con cálculo de días naturales</p>' +
          '</div>' +
        '</div>' +

        // Grid: formulario + lista
        '<div class="sicip-recep-grid" style="display:grid;grid-template-columns:1.3fr 1fr;gap:1rem;align-items:start">' +

          // Columna izquierda: Formulario
          '<div>' +
            '<div class="sicip-recep-card" style="padding:1rem">' +
              '<h3 style="margin:0 0 0.75rem;font-size:0.9rem;font-weight:700;color:#003324">📝 Nuevo Documento Recibido</h3>' +

              // Categoría principal
              '<div style="margin-bottom:0.75rem">' +
                '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Tipo de documento</label>' +
                '<select id="sicip-recep-tipo" class="sicip-recep-select" style="width:100%" onchange="window.__SICIP_RECEP_ON_CAT__(this.value)">' + catOptions + '</select>' +
              '</div>' +
              // Subtipo (oculto inicialmente)
              '<div id="sicip-recep-subtipo-wrap" style="margin-bottom:0.75rem;display:none">' +
                '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Subtipo</label>' +
                '<select id="sicip-recep-subtipo" class="sicip-recep-select" style="width:100%"></select>' +
              '</div>' +

              // Fechas y días
              '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-bottom:0.75rem">' +
                '<div>' +
                  '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Fecha inicio</label>' +
                  '<input type="date" id="sicip-recep-fecha-inicio" class="sicip-recep-input" onchange="window.__SICIP_RECEP_RECALC__()" oninput="window.__SICIP_RECEP_RECALC__()" />' +
                '</div>' +
                '<div>' +
                  '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Días naturales</label>' +
                  '<input type="number" id="sicip-recep-dias" class="sicip-recep-input" min="1" max="365" value="" placeholder="0" onchange="window.__SICIP_RECEP_RECALC__()" oninput="window.__SICIP_RECEP_RECALC__()" />' +
                '</div>' +
                '<div>' +
                  '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Fecha término</label>' +
                  '<input type="date" id="sicip-recep-fecha-termino" class="sicip-recep-input" readonly style="background:#f9fafb" />' +
                '</div>' +
              '</div>' +

              // Folio y descripción
              '<div style="margin-bottom:0.75rem">' +
                '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Número de referencia / Folio</label>' +
                '<input type="text" id="sicip-recep-folio" class="sicip-recep-input" placeholder="Ej. INC-2026-00123" />' +
              '</div>' +
              '<div style="margin-bottom:0.75rem">' +
                '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Descripción breve</label>' +
                '<textarea id="sicip-recep-descripcion" class="sicip-recep-input" rows="2" placeholder="Descripción del documento recibido..." style="resize:vertical"></textarea>' +
              '</div>' +

              // Buscador de trabajador
              '<div style="margin-bottom:0.75rem">' +
                '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Trabajador</label>' +
                '<input type="text" id="sicip-recep-trab-buscar" class="sicip-recep-input" placeholder="Buscar por nombre o matrícula..." oninput="window.__SICIP_RECEP_BUSCAR__(this.value)" autocomplete="off" />' +
                '<div id="sicip-recep-trab-resultados" style="max-height:200px;overflow-y:auto;margin-top:0.4rem">' +
                  '<div style="text-align:center;padding:1rem;color:#9ca3af;font-size:0.82rem">🔍 Escribe para buscar un trabajador</div>' +
                '</div>' +
                '<div id="sicip-recep-trab-selected" style="margin-top:0.4rem">' +
                  '<div style="text-align:center;padding:0.75rem;color:#9ca3af;font-size:0.82rem">Ningún trabajador seleccionado</div>' +
                '</div>' +
              '</div>' +

              // Botón guardar
              '<div style="display:flex;gap:0.5rem;margin-top:1rem">' +
                '<button class="sicip-recep-btn sicip-recep-btn-success" id="sicip-recep-guardar-btn" onclick="window.__SICIP_RECEP_GUARDAR__()" style="flex:1;justify-content:center;padding:0.65rem 1.5rem;font-size:0.9rem">💾 Guardar recepción</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Columna derecha: Lista de recepciones recientes
          '<div>' +
            '<div class="sicip-recep-card" style="padding:1rem">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">' +
                '<h3 style="margin:0;font-size:0.9rem;font-weight:700;color:#003324">📨 Recepciones Recientes</h3>' +
                '<button class="sicip-recep-btn sicip-recep-btn-ghost sicip-recep-btn-sm" onclick="window.__SICIP_RECEP_CARGAR__()" title="Recargar">↻</button>' +
              '</div>' +
              '<div id="sicip-recep-lista">' +
                '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.82rem">Cargando recepciones...</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  window.__SICIP_RECEP_RECALC__ = recalcFechaTermino;
  window.__SICIP_RECEP_BUSCAR__ = buscarTrabajador;

  // ════════════════ CASCADA: al seleccionar categoría, mostrar subtipos ════════════════
  window.__SICIP_RECEP_ON_CAT__ = function(catLabel) {
    var wrap = document.getElementById('sicip-recep-subtipo-wrap');
    var subtipoSelect = document.getElementById('sicip-recep-subtipo');
    if (!wrap || !subtipoSelect) return;

    if (!catLabel) {
      wrap.style.display = 'none';
      subtipoSelect.innerHTML = '';
      return;
    }

    var cat = getCategoriaByLabel(catLabel);
    if (!cat || !cat.subtipos || cat.subtipos.length === 0) {
      // Sin subtipos (Constancia médica, TXT, Otro) — ocultar subselector
      wrap.style.display = 'none';
      subtipoSelect.innerHTML = '';
      return;
    }

    // Mostrar subtipos
    wrap.style.display = 'block';
    var html = '<option value="">— Selecciona subtipo —</option>';
    cat.subtipos.forEach(function(s) {
      html += '<option value="' + esc(s) + '">' + esc(s) + '</option>';
    });
    subtipoSelect.innerHTML = html;
  };
  window.__SICIP_RECEP_VOLVER__ = function() {
    showReactContent();
    if (window.SICIPModuleHost) window.SICIPModuleHost.showReact();
  };

  // ════════════════ DETECCIÓN DE RUTA /recepciones ════════════════
  function isRecepcionesRoute() {
    return /\/recepciones/.test(location.pathname) || /\/recepciones/.test(location.hash);
  }

  var _mounted = false;

  function showRecepciones() {
    if (_mounted) return;
    _mounted = true;
    log('📊 Mostrando panel de Recepciones');
    var html = buildRecepcionesPanel();
    showContent(html);
    // Cargar recepciones recientes
    setTimeout(cargarRecepcionesRecientes, 200);
  }

  function hideRecepciones() {
    if (!_mounted) return;
    _mounted = false;
    removePanel();
  }

  function checkRoute() {
    if (isRecepcionesRoute()) {
      showRecepciones();
    } else {
      hideRecepciones();
    }
  }

  // ════════════════ INIT ════════════════
  function init() {
    injectStyles();

    // Escuchar cambios de ruta
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);

    // Observer para detectar cambios en el DOM (React puede cambiar la ruta sin popstate)
    var lastPath = location.pathname;
    new MutationObserver(function() {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        checkRoute();
      }
    }).observe(document.documentElement, { childList: true, subtree: true });

    // Chequeo inicial
    setTimeout(checkRoute, 300);

    // Interval de respaldo
    setInterval(function() {
      if (isRecepcionesRoute() && !_mounted) {
        showRecepciones();
      }
    }, 2000);

    log('✅ v' + VERSION + ' cargado');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 200); });
  }
})();