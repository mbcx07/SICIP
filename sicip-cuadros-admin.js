// SICIP Cuadros Admin Engine v1.0
// Arquitectura: datos preprocesados / vista materializada
// -----------------------------------------------------
// El administrador gestiona la base en Administración.
// Al guardar, se genera un documento optimizado por usuario en:
//   cuadrosReemplazoPorUsuario/{matricula}
// El módulo Mi Cuadro solo lee su documento preprocesado.
// Caché local + actualización silenciosa en segundo plano.

(function() {
  'use strict';
  
  var VERSION = '1.0.0';
  var FS_PROJECT = 'sicip-bcs';
  var FS_BASE = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents';
  
  // ==================== UTILITY ====================
  function log(msg) { console.log('[SICIP-CuadrosAdmin v' + VERSION + '] ' + msg); }
  
  function getUsuario() {
    try { var s = sessionStorage.getItem('sicip_usuario'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }
  
  function getSicipData() { return window.__SICIP_DATA__ || {}; }
  
  // ==================== LOCAL CACHE ====================
  var CACHE_KEY = 'sicip_mi_cuadro_cache';
  var CACHE_META_KEY = 'sicip_mi_cuadro_meta';
  
  function getLocalCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }
  
  function setLocalCache(data, matricula) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(CACHE_META_KEY, JSON.stringify({
        matricula: matricula,
        cachedAt: Date.now(),
        version: VERSION
      }));
    } catch(e) { /* quota exceeded - silencio */ }
  }
  
  function clearLocalCache() {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem(CACHE_META_KEY);
    } catch(e) {}
  }
  
  // ==================== ADMIN API: Gestión de la base ====================
  // Colecciones Firestore:
  //   cuadrosReemplazoBase/{matricula} — datos completos por jefe
  //   cuadrosReemplazoPorUsuario/{matricula} — datos preprocesados
  //   cuadrosReemplazoMeta — metadatos (versión, última actualización)
  
  function fsDocPath(collection, docId) {
    return FS_BASE + '/' + encodeURIComponent(collection) + '/' + encodeURIComponent(String(docId));
  }
  
  function fsCollectionPath(collection) {
    return FS_BASE + '/' + encodeURIComponent(collection);
  }
  
  async function fsGet(docPath) {
    var resp = await fetch(docPath);
    if (!resp.ok) return null;
    var data = await resp.json();
    if (data.error) return null;
    // Convert Firestore Document to plain object
    return convertFirestoreDoc(data);
  }
  
  async function fsSet(docPath, obj) {
    // Use Firestore REST API to set a document
    var doc = convertToFirestoreDoc(obj);
    var resp = await fetch(docPath + '?key=AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    if (!resp.ok) {
      var err = await resp.text();
      throw new Error('Error guardando en Firestore: ' + err);
    }
    return await resp.json();
  }
  
  async function fsDelete(docPath) {
    var resp = await fetch(docPath + '?key=AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8', {
      method: 'DELETE'
    });
    if (!resp.ok) throw new Error('Error eliminando');
    return true;
  }
  
  async function fsQuery(collection, filters) {
    var url = fsCollectionPath(collection) + ':runQuery?key=AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8';
    var structuredQuery = {
      from: [{ collectionId: collection }]
    };
    if (filters && filters.length > 0) {
      structuredQuery.where = buildWhere(filters);
    }
    if (filters && filters.limit) {
      structuredQuery.limit = filters.limit;
    }
    
    var resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: structuredQuery })
    });
    if (!resp.ok) return [];
    var results = await resp.json();
    if (!Array.isArray(results)) return [];
    return results
      .filter(function(r) { return r.document; })
      .map(function(r) { return convertFirestoreDoc(r.document); });
  }
  
  function buildWhere(filters) {
    var filterClauses = [];
    for (var i = 0; i < filters.length; i++) {
      var f = filters[i];
      if (!f.field || !f.op) continue;
      filterClauses.push({
        fieldFilter: {
          field: { fieldPath: f.field },
          op: f.op,
          value: { stringValue: String(f.value) }
        }
      });
    }
    if (filterClauses.length === 1) return filterClauses[0];
    return { compositeFilter: { op: 'AND', filters: filterClauses } };
  }
  
  function convertFirestoreDoc(doc) {
    var obj = { id: doc.name ? doc.name.split('/').pop() : null };
    if (doc.fields) {
      for (var key in doc.fields) {
        obj[key] = convertFirestoreValue(doc.fields[key]);
      }
    }
    obj._createTime = doc.createTime;
    obj._updateTime = doc.updateTime;
    return obj;
  }
  
  function convertFirestoreValue(val) {
    if (val === null || val === undefined) return null;
    if (val.stringValue !== undefined) return val.stringValue;
    if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
    if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
    if (val.booleanValue !== undefined) return val.booleanValue;
    if (val.timestampValue) return val.timestampValue;
    if (val.arrayValue) {
      return (val.arrayValue.values || []).map(convertFirestoreValue);
    }
    if (val.mapValue) {
      var obj = {};
      for (var k in (val.mapValue.fields || {})) {
        obj[k] = convertFirestoreValue(val.mapValue.fields[k]);
      }
      return obj;
    }
    return null;
  }
  
  function convertToFirestoreDoc(obj) {
    var fields = {};
    for (var key in obj) {
      if (key === 'id' || key === '_createTime' || key === '_updateTime') continue;
      fields[key] = valueToFirestore(obj[key]);
    }
    return { fields: fields };
  }
  
  function valueToFirestore(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { integerValue: String(val) };
      return { doubleValue: val };
    }
    if (typeof val === 'boolean') return { booleanValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(valueToFirestore) } };
    }
    if (typeof val === 'object') {
      var fields = {};
      for (var k in val) {
        fields[k] = valueToFirestore(val[k]);
      }
      return { mapValue: { fields: fields } };
    }
    return { stringValue: String(val) };
  }
  
  // ==================== ADMIN SECTION ====================
  // Panel de Administración de Cuadros de Reemplazo
  
  window.__SICIP_ADMIN_CUADROS = {
    // Cargar panel admin de cuadros
    showAdminPanel: function() {
      log('Abriendo panel de Administración de Cuadros...');
      showAdminCuadrosPanel();
    },
    
    // Obtener todos los registros de la base
    getAll: async function() {
      return await fsQuery('cuadrosReemplazoBase', { limit: 500 });
    },
    
    // Guardar/actualizar un registro
    saveRegistro: async function(matricula, data) {
      var docPath = fsDocPath('cuadrosReemplazoBase', matricula);
      await fsSet(docPath, data);
      // Regenera datos preprocesados para este usuario
      await regenerarDatosUsuario(matricula);
      // Actualiza metadatos globales
      await actualizarMeta(matricula);
      return true;
    },
    
    // Eliminar un registro
    deleteRegistro: async function(matricula) {
      var docPath = fsDocPath('cuadrosReemplazoBase', matricula);
      await fsDelete(docPath);
      // Eliminar datos preprocesados
      try {
        var userPath = fsDocPath('cuadrosReemplazoPorUsuario', matricula);
        await fsDelete(userPath);
      } catch(e) {}
      return true;
    },
    
    // Importar desde datos locales
    importarDesdeLocal: async function() {
      var data = getSicipData();
      var jefes = data.jefesServicio || [];
      var cuadrosExistentes = data.cuadros || [];
      var importados = 0;
      
      for (var i = 0; i < jefes.length; i++) {
        var jefe = jefes[i];
        var mat = String(jefe.matricula || jefe.id || '');
        if (!mat) continue;
        
        var cuadroExistente = cuadrosExistentes.find(function(c) {
          return String(c.jefeMatricula || c.id) === mat;
        });
        
        var registro = {
          jefeMatricula: mat,
          jefeNombre: jefe.nombre || '',
          jefePuestoDescripcion: jefe.puestoDescripcion || jefe.descripcion || '',
          jefeDepartamento: jefe.departamento || '',
          jefeDepartamentoNombre: jefe.departamentoNombre || '',
          localidad: jefe.localidad || '',
          turno: jefe.turno || '',
          clasificacion: jefe.clasificacion || '',
          candidatos: cuadroExistente ? (cuadroExistente.candidatos || []) : [],
          status: cuadroExistente ? (cuadroExistente.status || 'SIN_ASIGNAR') : 'SIN_ASIGNAR',
          escolaridadRequerida: (cuadroExistente && cuadroExistente.escolaridadRequerida) || '',
          experienciaRequerida: (cuadroExistente && cuadroExistente.experienciaRequerida) || '',
          fechaImportacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        
        try {
          await fsSet(fsDocPath('cuadrosReemplazoBase', mat), registro);
          importados++;
        } catch(e) {
          log('Error importando ' + mat + ': ' + e.message);
        }
      }
      
      // Regenerar datos preprocesados para TODOS
      await regenerarTodosLosDatos();
      await actualizarMeta('bulk-import');
      
      return importados;
    },
    
    // Exportar a CSV
    exportarCSV: function() {
      // Delegado al componente React original o generamos aquí
      log('Exportar CSV');
    }
  };
  
  // ==================== REGENERAR DATOS PREPROCESADOS ====================
  
  async function regenerarDatosUsuario(matricula) {
    try {
      var baseDoc = await fsGet(fsDocPath('cuadrosReemplazoBase', matricula));
      if (!baseDoc) return;
      
      // Construir datos preprocesados para este usuario
      var datosPreprocesados = {
        matricula: matricula,
        jefeNombre: baseDoc.jefeNombre || '',
        jefePuestoDescripcion: baseDoc.jefePuestoDescripcion || '',
        jefeDepartamento: baseDoc.jefeDepartamento || '',
        jefeDepartamentoNombre: baseDoc.jefeDepartamentoNombre || '',
        localidad: baseDoc.localidad || '',
        turno: baseDoc.turno || '',
        status: baseDoc.status || 'SIN_ASIGNAR',
        candidatos: (baseDoc.candidatos || []).map(function(c) {
          return { posicion: c.posicion, matricula: c.matricula, nombre: c.nombre, descripcion: c.descripcion };
        }),
        escolaridadRequerida: baseDoc.escolaridadRequerida || '',
        experienciaRequerida: baseDoc.experienciaRequerida || '',
        version: parseInt(baseDoc.version || 1, 10),
        generadoEn: new Date().toISOString()
      };
      
      await fsSet(fsDocPath('cuadrosReemplazoPorUsuario', matricula), datosPreprocesados);
      log('Datos preprocesados para ' + matricula);
    } catch(e) {
      log('Error regenerando datos para ' + matricula + ': ' + e.message);
    }
  }
  
  async function regenerarTodosLosDatos() {
    var todos = await fsQuery('cuadrosReemplazoBase', { limit: 500 });
    var count = 0;
    for (var i = 0; i < todos.length; i++) {
      var mat = todos[i].jefeMatricula || todos[i].id || todos[i].matricula;
      if (mat) {
        await regenerarDatosUsuario(mat);
        count++;
      }
    }
    log('Regenerados datos preprocesados para ' + count + ' usuarios');
    return count;
  }
  
  async function actualizarMeta(accion) {
    try {
      var metaPath = fsDocPath('cuadrosReemplazoMeta', '_global');
      await fsSet(metaPath, {
        ultimaActualizacion: new Date().toISOString(),
        version: Date.now(),
        accion: accion
      });
    } catch(e) {
      log('Error actualizando meta: ' + e.message);
    }
  }
  
  // ==================== MI CUADRO - LECTURA INSTANTÁNEA ====================
  
  // Exponer función para que el patch existente la use
  window.__SICIP_MICUADRO_ENGINE = {
    // Obtener datos del cuadro: prioriza cache local, luego Firestore
    obtenerMiCuadro: async function(matricula, opts) {
      opts = opts || {};
      var timeout = opts.timeout || 8000;
      var allowCache = opts.allowCache !== false;
      var bgUpdate = opts.bgUpdate !== false;
      
      var result = { data: null, fromCache: false, error: null };
      
      // 1. Cache local primero - INSTANTÁNEO
      if (allowCache) {
        var cache = getLocalCache();
        if (cache && cache.matricula === matricula) {
          result.data = cache.data;
          result.fromCache = true;
          result._cachedAt = cache.cachedAt || 0;
          
          // Actualización silenciosa en segundo plano
          if (bgUpdate) {
            actualizarEnBackground(matricula, result);
          }
          
          return result;
        }
      }
      
      // 2. Sin cache - buscar en Firestore con timeout
      try {
        result.data = await Promise.race([
          leerDatosPreprocesados(matricula),
          new Promise(function(_, reject) {
            setTimeout(function() {
              reject(new Error('Timeout'));
            }, timeout);
          })
        ]);
        
        // Guardar en cache local
        if (result.data) {
          setLocalCache({ matricula: matricula, data: result.data, cachedAt: Date.now() }, matricula);
        }
      } catch(e) {
        result.error = e.message || 'Error al cargar datos';
        
        // Fallback: intentar cache local aunque sea viejo
        if (!result.data) {
          var cache = getLocalCache();
          if (cache && cache.matricula === matricula) {
            result.data = cache.data;
            result.fromCache = true;
            result.stale = true;
          }
        }
      }
      
      return result;
    },
    
    // Forzar actualización de cache
    refreshCache: async function(matricula) {
      try {
        var data = await leerDatosPreprocesados(matricula);
        if (data) {
          setLocalCache({ matricula: matricula, data: data, cachedAt: Date.now() }, matricula);
          return data;
        }
      } catch(e) {
        log('Error refrescando cache: ' + e.message);
      }
      return null;
    },
    
    // Limpiar cache
    clearCache: function() {
      clearLocalCache();
    },
    
    // Obtener metadatos de actualización global
    getMeta: async function() {
      try {
        return await fsGet(fsDocPath('cuadrosReemplazoMeta', '_global'));
      } catch(e) {
        return null;
      }
    },
    
    // Obtener si hay una versión más reciente disponible
    checkVersion: async function(matricula, currentVersion) {
      try {
        var meta = await fsGet(fsDocPath('cuadrosReemplazoMeta', '_global'));
        if (meta && meta.version > (currentVersion || 0)) {
          return { hayActualizacion: true, nuevaVersion: meta.version, ultimaActualizacion: meta.ultimaActualizacion };
        }
        return { hayActualizacion: false };
      } catch(e) {
        return { hayActualizacion: false, error: e.message };
      }
    }
  };
  
  async function leerDatosPreprocesados(matricula) {
    // Primero intentar datos preprocesados
    var doc = await fsGet(fsDocPath('cuadrosReemplazoPorUsuario', matricula));
    if (doc) return doc;
    
    // Fallback: leer de base
    doc = await fsGet(fsDocPath('cuadrosReemplazoBase', matricula));
    if (doc) {
      // Convertir al mismo formato
      return {
        matricula: matricula,
        jefeNombre: doc.jefeNombre || '',
        jefePuestoDescripcion: doc.jefePuestoDescripcion || '',
        jefeDepartamentoNombre: doc.jefeDepartamentoNombre || '',
        localidad: doc.localidad || '',
        turno: doc.turno || '',
        status: doc.status || 'SIN_ASIGNAR',
        candidatos: (doc.candidatos || []).map(function(c) {
          return { posicion: c.posicion, matricula: c.matricula, nombre: c.nombre, descripcion: c.descripcion };
        }),
        escolaridadRequerida: doc.escolaridadRequerida || '',
        experienciaRequerida: doc.experienciaRequerida || '',
        _fallback: true
      };
    }
    
    return null;
  }
  
  var backgroundUpdates = {};
  
  function actualizarEnBackground(matricula, currentResult) {
    if (backgroundUpdates[matricula]) return; // ya hay una actualización en curso
    backgroundUpdates[matricula] = true;
    
    setTimeout(async function() {
      try {
        var meta = await fsGet(fsDocPath('cuadrosReemplazoMeta', '_global'));
        var cacheVersion = currentResult._cachedAt || 0;
        var metaVersion = meta ? new Date(meta.ultimaActualizacion || 0).getTime() : 0;
        
        if (metaVersion > cacheVersion) {
          var freshData = await leerDatosPreprocesados(matricula);
          if (freshData) {
            setLocalCache({ matricula: matricula, data: freshData, cachedAt: Date.now() }, matricula);
            log('Cache actualizado silenciosamente para ' + matricula);
            
            // Disparar evento para que la UI se refresque si está visible
            if (window.__SICIP_MICUADRO_ONUPDATE) {
              window.__SICIP_MICUADRO_ONUPDATE(freshData);
            }
          }
        }
      } catch(e) {
        log('Error en actualización silenciosa: ' + e.message);
      } finally {
        delete backgroundUpdates[matricula];
      }
    }, 1000);
  }
  
  // ==================== UI: PANEL ADMIN ====================
  
  function hideReactRoot() {
    var r = document.getElementById('root'); if (r) r.style.display = 'none';
    var ms = document.querySelectorAll('main'); for (var i=0;i<ms.length;i++) ms[i].style.display = 'none';
  }
  function showReactRoot() {
    var r = document.getElementById('root'); if (r) r.style.display = '';
    var ms = document.querySelectorAll('main'); for (var i=0;i<ms.length;i++) ms[i].style.display = '';
  }
  
  function removePanel() {
    var p = document.querySelector('[data-sicip-admin-cuadros]'); if (p) p.remove();
  }
  
  function showPanel(html) {
    removePanel();
    hideReactRoot();
    var temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp.firstChild);
  }
  
  function showAdminCuadrosPanel() {
    var usuario = getUsuario();
    if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'AREA_PERSONAL')) {
      alert('Solo administradores pueden acceder a esta sección.');
      return;
    }
    
    var html = buildAdminPanelHTML();
    showPanel(html);
    attachAdminHandlers(usuario);
  }
  
  function buildAdminPanelHTML() {
    return '<div data-sicip-admin-cuadros style="position:fixed;top:0;left:72px;right:0;bottom:0;z-index:9998;overflow-y:auto;background:#f9fafb;padding:1.5rem 1.5rem 3rem">' +
      '<div style="max-width:1000px;margin:0 auto">' +
        '<div style="margin-bottom:1.25rem">' +
          '<button onclick="(function(){var p=document.querySelector(\'[data-sicip-admin-cuadros]\');if(p)p.remove();showReactRoot();})()" style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:#005235;font-weight:600;padding:0 0 0.5rem 0;display:flex;align-items:center;gap:6px">← Volver al inicio</button>' +
          '<h2 style="margin:0;font-size:1.25rem;font-weight:800;color:#003324">Administración de Cuadros de Reemplazo</h2>' +
          '<p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.8rem">Gestión de la base de datos preprocesada</p>' +
        '</div>' +
        
        '<div id="sicip-admin-cuadros-status" style="display:none;padding:0.75rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:0.85rem;font-weight:600"></div>' +
        
        '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.25rem">' +
          '<button id="btn-importar-local" style="background:#005235;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">📥 Importar desde datos locales</button>' +
          '<button id="btn-regenerar-todos" style="background:#1d4ed8;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">🔄 Regenerar datos preprocesados</button>' +
          '<button id="btn-ver-base" style="background:#f59e0b;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">📋 Ver base de datos</button>' +
          '<button id="btn-editar-registro" style="background:#6b7280;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">✏️ Editar registro manual</button>' +
        '</div>' +
        
        '<div id="sicip-admin-cuadros-content" style="background:white;border-radius:12px;padding:1.5rem;border:1px solid #e5e7eb;min-height:200px">' +
          '<div style="text-align:center;padding:3rem;color:#9ca3af">' +
            '<p style="font-size:1rem;margin:0 0 0.5rem;font-weight:600">Selecciona una acción</p>' +
            '<p style="font-size:0.82rem;margin:0">Importa los datos locales o visualiza la base actual</p>' +
          '</div>' +
        '</div>' +
        
        '<div id="sicip-admin-editor" style="display:none;background:white;border-radius:12px;padding:1.5rem;border:1px solid #e5e7eb;margin-top:1rem">' +
          '<h3 style="margin:0 0 1rem;font-size:1.05rem;font-weight:700;color:#003324">Editar Registro</h3>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">' +
            '<div><label style="display:block;font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:0.25rem">Matrícula Jefe</label>' +
            '<input id="edit-matricula" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem"></div>' +
            '<div><label style="display:block;font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:0.25rem">Nombre Jefe</label>' +
            '<input id="edit-nombre" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem"></div>' +
            '<div><label style="display:block;font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:0.25rem">Estatus</label>' +
            '<select id="edit-status" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem">' +
              '<option value="SIN_ASIGNAR">Sin Asignar</option><option value="PARCIAL">Parcial</option><option value="COMPLETO">Completo</option><option value="CERRADO">Cerrado</option>' +
            '</select></div>' +
            '<div><label style="display:block;font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:0.25rem">Escolaridad Requerida</label>' +
            '<input id="edit-escolaridad" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem"></div>' +
            '<div style="grid-column:span 2"><label style="display:block;font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:0.25rem">Experiencia Requerida</label>' +
            '<input id="edit-experiencia" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem"></div>' +
          '</div>' +
          '<div style="margin-top:1rem;display:flex;gap:0.5rem">' +
            '<button id="btn-guardar-edicion" style="background:#10b981;color:white;border:none;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">💾 Guardar</button>' +
            '<button id="btn-cancelar-edicion" style="background:#6b7280;color:white;border:none;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">Cancelar</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  
  function attachAdminHandlers(usuario) {
    var statusDiv = document.getElementById('sicip-admin-cuadros-status');
    var contentDiv = document.getElementById('sicip-admin-cuadros-content');
    var editorDiv = document.getElementById('sicip-admin-editor');
    
    function showStatus(msg, type) {
      if (!statusDiv) return;
      statusDiv.style.display = 'block';
      statusDiv.style.background = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#fffbeb';
      statusDiv.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#d97706';
      statusDiv.textContent = msg;
      setTimeout(function() { statusDiv.style.display = 'none'; }, 5000);
    }
    
    // Importar desde datos locales
    document.getElementById('btn-importar-local').addEventListener('click', async function() {
      contentDiv.innerHTML = '<div style="text-align:center;padding:2rem"><div style="width:32px;height:32px;border:3px solid #c8e6c9;border-top-color:#005235;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem"></div><p style="color:#666">Importando datos locales...</p></div>';
      try {
        var count = await window.__SICIP_ADMIN_CUADROS.importarDesdeLocal();
        contentDiv.innerHTML = '<div style="text-align:center;padding:2rem">' +
          '<div style="font-size:2.5rem;margin-bottom:0.5rem">✅</div>' +
          '<p style="font-weight:700;font-size:1.1rem;color:#16a34a">Importación completada</p>' +
          '<p style="color:#6b7280;font-size:0.85rem">' + count + ' registros importados a Firestore</p>' +
          '<p style="color:#6b7280;font-size:0.82rem">Los datos preprocesados están listos para consulta instantánea</p>' +
        '</div>';
        showStatus('✅ Importación exitosa: ' + count + ' registros', 'success');
      } catch(e) {
        contentDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#dc2626"><p style="font-weight:700">Error</p><p style="font-size:0.85rem">' + e.message + '</p></div>';
        showStatus('❌ Error: ' + e.message, 'error');
      }
    });
    
    // Regenerar todos los datos preprocesados
    document.getElementById('btn-regenerar-todos').addEventListener('click', async function() {
      contentDiv.innerHTML = '<div style="text-align:center;padding:2rem"><div style="width:32px;height:32px;border:3px solid #c8e6c9;border-top-color:#005235;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem"></div><p style="color:#666">Regenerando datos preprocesados...</p></div>';
      try {
        var count = await regenerarTodosLosDatos();
        contentDiv.innerHTML = '<div style="text-align:center;padding:2rem">' +
          '<div style="font-size:2.5rem;margin-bottom:0.5rem">🔄</div>' +
          '<p style="font-weight:700;font-size:1.1rem;color:#1d4ed8">Regeneración completada</p>' +
          '<p style="color:#6b7280;font-size:0.85rem">Datos preprocesados actualizados para ' + count + ' usuarios</p>' +
        '</div>';
        showStatus('✅ Datos preprocesados regenerados para ' + count + ' usuarios', 'success');
      } catch(e) {
        contentDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#dc2626"><p style="font-weight:700">Error</p><p style="font-size:0.85rem">' + e.message + '</p></div>';
        showStatus('❌ Error: ' + e.message, 'error');
      }
    });
    
    // Ver base de datos
    document.getElementById('btn-ver-base').addEventListener('click', async function() {
      contentDiv.innerHTML = '<div style="text-align:center;padding:2rem"><div style="width:32px;height:32px;border:3px solid #c8e6c9;border-top-color:#005235;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem"></div><p style="color:#666">Cargando base de datos...</p></div>';
      try {
        var registros = await fsQuery('cuadrosReemplazoBase', { limit: 500 });
        var preprocesados = await fsQuery('cuadrosReemplazoPorUsuario', { limit: 500 });
        
        var html = '<div>' +
          '<div style="display:flex;gap:1rem;margin-bottom:1rem">' +
            '<div style="background:#e8f5e9;padding:0.75rem 1rem;border-radius:8px;flex:1"><strong style="color:#005235">Base:</strong> ' + registros.length + ' registros</div>' +
            '<div style="background:#e3f2fd;padding:0.75rem 1rem;border-radius:8px;flex:1"><strong style="color:#1d4ed8">Preprocesados:</strong> ' + preprocesados.length + ' registros</div>' +
          '</div>' +
          '<div style="overflow-x:auto">' +
          '<table style="width:100%;border-collapse:collapse;font-size:0.78rem">' +
            '<thead><tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb">' +
              '<th style="padding:0.5rem;text-align:left">Matrícula</th>' +
              '<th style="padding:0.5rem;text-align:left">Nombre</th>' +
              '<th style="padding:0.5rem;text-align:left">Status</th>' +
              '<th style="padding:0.5rem;text-align:center">Candidatos</th>' +
              '<th style="padding:0.5rem;text-align:left">Preprocesado</th>' +
              '<th style="padding:0.5rem;text-align:left">Actualización</th>' +
            '</tr></thead><tbody>';
        
        registros.forEach(function(r) {
          var mat = r.jefeMatricula || r.id || '';
          var nombre = (r.jefeNombre || '').replace(/\//g, ' ');
          var status = r.status || 'SIN_ASIGNAR';
          var numCand = (r.candidatos || []).length;
          var preprocesado = preprocesados.find(function(p) { return p.matricula === mat || p.id === mat; });
          var tienePre = preprocesado ? '✅' : '❌';
          var fecUpd = r.fechaActualizacion || r._updateTime || '';
          if (fecUpd && fecUpd.length > 10) fecUpd = fecUpd.substring(0, 10);
          
          html += '<tr style="border-bottom:1px solid #e5e7eb">' +
            '<td style="padding:0.5rem;font-family:monospace">' + mat + '</td>' +
            '<td style="padding:0.5rem;font-weight:600">' + nombre + '</td>' +
            '<td style="padding:0.5rem"><span style="background:'+(status==='COMPLETO'?'#d4edda':status==='PARCIAL'?'#fff3cd':'#f8d7da')+';color:'+(status==='COMPLETO'?'#155724':status==='PARCIAL'?'#856404':'#721c24')+';padding:0.15rem 0.4rem;border-radius:999px;font-size:0.7rem;font-weight:600">'+status+'</span></td>' +
            '<td style="padding:0.5rem;text-align:center;font-weight:700">' + numCand + '</td>' +
            '<td style="padding:0.5rem;text-align:center;font-size:1rem">' + tienePre + '</td>' +
            '<td style="padding:0.5rem;color:#6b7280;font-size:0.72rem">' + (fecUpd || '—') + '</td>' +
          '</tr>';
        });
        
        html += '</tbody></table></div></div>';
        contentDiv.innerHTML = html;
      } catch(e) {
        contentDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#dc2626"><p style="font-weight:700">Error al cargar base</p><p style="font-size:0.85rem">' + e.message + '</p></div>';
      }
    });
    
    // Editar registro
    document.getElementById('btn-editar-registro').addEventListener('click', function() {
      editorDiv.style.display = 'block';
      document.getElementById('edit-matricula').value = '';
      document.getElementById('edit-nombre').value = '';
      document.getElementById('edit-status').value = 'SIN_ASIGNAR';
      document.getElementById('edit-escolaridad').value = '';
      document.getElementById('edit-experiencia').value = '';
    });
    
    document.getElementById('btn-cancelar-edicion').addEventListener('click', function() {
      editorDiv.style.display = 'none';
    });
    
    document.getElementById('btn-guardar-edicion').addEventListener('click', async function() {
      var matricula = document.getElementById('edit-matricula').value.trim();
      if (!matricula) { showStatus('Ingresa una matrícula', 'error'); return; }
      
      var data = {
        jefeMatricula: matricula,
        jefeNombre: document.getElementById('edit-nombre').value.trim(),
        jefePuestoDescripcion: '',
        jefeDepartamento: '',
        jefeDepartamentoNombre: '',
        localidad: '',
        turno: '',
        candidatos: [],
        status: document.getElementById('edit-status').value,
        escolaridadRequerida: document.getElementById('edit-escolaridad').value.trim(),
        experienciaRequerida: document.getElementById('edit-experiencia').value.trim(),
        fechaActualizacion: new Date().toISOString()
      };
      
      contentDiv.innerHTML = '<div style="text-align:center;padding:2rem"><div style="width:32px;height:32px;border:3px solid #c8e6c9;border-top-color:#005235;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem"></div><p style="color:#666">Guardando...</p></div>';
      
      try {
        await window.__SICIP_ADMIN_CUADROS.saveRegistro(matricula, data);
        contentDiv.innerHTML = '<div style="text-align:center;padding:2rem">' +
          '<div style="font-size:2.5rem;margin-bottom:0.5rem">✅</div>' +
          '<p style="font-weight:700;font-size:1.1rem;color:#16a34a">Registro guardado</p>' +
          '<p style="color:#6b7280;font-size:0.85rem">Matrícula: ' + matricula + '</p>' +
          '<p style="color:#6b7280;font-size:0.82rem">Datos preprocesados regenerados automáticamente</p>' +
        '</div>';
        editorDiv.style.display = 'none';
        showStatus('✅ Registro guardado correctamente', 'success');
      } catch(e) {
        contentDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#dc2626"><p style="font-weight:700">Error</p><p style="font-size:0.85rem">' + e.message + '</p></div>';
        showStatus('❌ Error: ' + e.message, 'error');
      }
    });
    
    // Exponer showReactRoot para el botón volver
    if (!window.showReactRoot) {
      window.showReactRoot = showReactRoot;
    }
  }
  
  // ==================== PATCH: Agregar opción en Administración ====================
  function addAdminMenuOption() {
    var usuario = getUsuario();
    if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'AREA_PERSONAL')) return;
    
    // Buscar el botón de Administración en el sidebar
    var sidebar = document.querySelector('nav');
    if (!sidebar) return;
    if (sidebar.querySelector('[data-sicip-admin-cuadros-entry]')) return;
    
    var adminButtons = sidebar.querySelectorAll('button');
    var adminBtn = null;
    for (var i = 0; i < adminButtons.length; i++) {
      if ((adminButtons[i].textContent || '').trim() === 'Admin' || (adminButtons[i].textContent || '').trim() === 'Administración') {
        adminBtn = adminButtons[i];
        break;
      }
    }
    
    if (!adminBtn) return;
    
    var container = adminBtn.parentElement || adminBtn.closest('div') || sidebar.querySelector('div');
    var entry = document.createElement('button');
    entry.setAttribute('data-sicip-admin-cuadros-entry', '1');
    entry.style.cssText = adminBtn.style.cssText || 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1rem;border:none;cursor:pointer;font-size:0.88rem;font-weight:500;color:rgba(255,255,255,0.75);background:transparent;border-left:3px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,sans-serif';
    entry.innerHTML = '<span style="color:#f59e0b;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg></span><span>Gestor Cuadros Reemplazo</span>';
    entry.addEventListener('click', function() {
      window.__SICIP_ADMIN_CUADROS.showAdminPanel();
    });
    
    if (adminBtn.nextSibling) {
      container.insertBefore(entry, adminBtn.nextSibling);
    } else {
      container.appendChild(entry);
    }
    
    log('✅ Opción "Gestor Cuadros Reemplazo" agregada en Administración');
  }
  
  // ==================== INIT ====================
  function init() {
    setTimeout(addAdminMenuOption, 1000);
    setTimeout(addAdminMenuOption, 3000);
    setTimeout(addAdminMenuOption, 5000);
    
    log('v' + VERSION + ' cargado');
  }
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 100);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 100); });
  }
  
  window.__SICIP_CUADROS_ADMIN_ENGINE = { VERSION: VERSION };
})();
