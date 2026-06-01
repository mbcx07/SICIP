(function() {
  var VERSION = "4.0.1";

  // ==================== GLOBAL DATA STORE ====================
  window.__SICIP_DATA__ = window.__SICIP_DATA__ || {};
  var DATA = window.__SICIP_DATA__;

  // ==================== INDEXEDDB CACHE ====================
  var IDB_NAME = 'sicip_cache';
  var IDB_VERSION = 2;
  var idb = null;

  function openIDB() {
    return new Promise(function(resolve, reject) {
      if (idb) { resolve(idb); return; }
      try {
        var req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains('data')) db.createObjectStore('data');
        };
        req.onsuccess = function(e) { idb = e.target.result; resolve(idb); };
        req.onerror = function() { resolve(null); };
      } catch(e) { resolve(null); }
    });
  }

  function idbGet(key) {
    return openIDB().then(function(db) {
      if (!db) return null;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction('data', 'readonly');
          var req = tx.objectStore('data').get(key);
          req.onsuccess = function() { resolve(req.result || null); };
          req.onerror = function() { resolve(null); };
        } catch(e) { resolve(null); }
      });
    });
  }

  function idbSet(key, value) {
    return openIDB().then(function(db) {
      if (!db) return;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction('data', 'readwrite');
          tx.objectStore('data').put(value, key);
          tx.oncomplete = function() { resolve(); };
          tx.onerror = function() { resolve(); };
        } catch(e) { resolve(); }
      });
    });
  }

  // ==================== DATA LOADING ====================
  // All datasets — load priority first, then bulk
  var priorityDatasets = [
    'jefesServicio', 'cuadros', 'stats', 'vacantes', 'tramites'
  ];
  var bulkDatasets = [
    'trabajadores', 'plazas', 'plazas-full', 'usuarios', 'usuarios-full'
  ];
  var allDatasets = priorityDatasets.concat(bulkDatasets);

  var dataLoaded = false;
  var dataLoading = false;

  function fetchJSON(name) {
    return fetch('/data-' + name + '.json').then(function(r) {
      if (!r.ok) throw new Error('Error cargando ' + name);
      return r.json();
    }).then(function(data) {
      DATA[name] = data;
      idbSet('data_' + name, data);
      return data;
    });
  }

  function preloadAllData() {
    if (dataLoaded || dataLoading) return Promise.resolve();
    dataLoading = true;

    return openIDB().then(function() {
      var idbPromises = allDatasets.map(function(name) {
        return idbGet('data_' + name).then(function(cached) {
          if (cached) { DATA[name] = cached; return true; }
          return false;
        });
      });
      return Promise.all(idbPromises);
    }).then(function() {
      setupDerivedData();

      var allCached = allDatasets.every(function(name) {
        return DATA[name] !== undefined;
      });

      if (allCached) {
        dataLoaded = true;
        dataLoading = false;
        console.log('[SICIP] All data from IndexedDB cache — INSTANT');
        return;
      }

      // Priority first (small files)
      var pFetch = priorityDatasets.filter(function(n) { return DATA[n] === undefined; })
        .map(function(n) { return fetchJSON(n).catch(function(e) { console.error('[SICIP] Error: ' + n, e); }); });

      return Promise.all(pFetch).then(function() {
        setupDerivedData();
        console.log('[SICIP] Priority data ready — modules INSTANT');

        // Bulk in background
        var bFetch = bulkDatasets.filter(function(n) { return DATA[n] === undefined; })
          .map(function(n) { return fetchJSON(n).catch(function(e) { console.error('[SICIP] Error: ' + n, e); }); });

        return Promise.all(bFetch);
      }).then(function() {
        setupDerivedData();
        dataLoaded = true;
        dataLoading = false;
        console.log('[SICIP] All data loaded — ' + Object.keys(DATA).length + ' collections');
      });
    });
  }

  function setupDerivedData() {
    DATA.roles = [
      { id: 'ADMIN', nombre: 'Administrador', modulos: ['solicitudes','contrato','cuadros','pases','licencias','recepciones','reportes','plantilla','admin','plazas','vacantes','usuarios','roles'] },
      { id: 'JEFE_SERVICIO', nombre: 'Jefe de Servicio', modulos: ['solicitudes','cuadros','recepciones','reportes'] },
      { id: 'AREA_PERSONAL', nombre: 'Área de Personal', modulos: ['solicitudes','contrato','cuadros','pases','licencias','recepciones','reportes','plantilla'] },
      { id: 'TRABAJADOR', nombre: 'Trabajador', modulos: ['solicitudes'] },
      { id: 'FUERZA_TRABAJO', nombre: 'Fuerza de Trabajo', modulos: ['fuerza-trabajo'] }
    ];
    DATA.tipos_tramite = [
      { tipo: 'TIEMPO_EXTRAORDINARIO', nombre: 'Tiempo Extraordinario' },
      { tipo: 'GUARDIA_FESTIVA', nombre: 'Guardia Festiva' },
      { tipo: 'NIVELACION', nombre: 'Nivelación' },
      { tipo: 'SUSTITUCION', nombre: 'Sustitución' },
      { tipo: 'SOLICITUD_CONTRATO', nombre: 'Solicitud de Contrato' },
      { tipo: 'PASE_ENTRADA', nombre: 'Pase de Entrada' },
      { tipo: 'PASE_SALIDA', nombre: 'Pase de Salida' },
      { tipo: 'LICENCIA_MEDICA', nombre: 'Licencia Médica' },
      { tipo: 'LICENCIA_SGSS', nombre: 'Licencia sin Goce de Sueldo' },
      { tipo: 'VACACIONES', nombre: 'Vacaciones' }
    ];
    DATA.historial = [];
    if (!DATA.cuadros) DATA.cuadros = [];
    if (!DATA.postulaciones) DATA.postulaciones = [];
    if (!DATA.notificaciones) DATA.notificaciones = [];
    if (!DATA.tramites) DATA.tramites = [];
    if (!DATA.jefesServicio && DATA['plazas-full']) {
      DATA.jefesServicio = DATA['plazas-full'].filter(function(p) {
        return ['1','61','62','63'].indexOf(String(p.tp || '')) >= 0 && p.nom && p.nom !== '#N/A';
      }).map(function(p) {
        return { id: p.mat, matricula: p.mat, nombre: p.nom, unidad: p.jef, tp: p.tp, puesto: p.puesto };
      });
    }
  }

  // ==================== LOGIN DETECTION & PRELOAD ====================
  function checkLoginAndPreload() {
    var usuario = null;
    try { var s = sessionStorage.getItem('sicip_usuario'); if (s) usuario = JSON.parse(s); } catch (e) {}
    if (usuario && !dataLoaded && !dataLoading) {
      preloadAllData();
      return true;
    }
    return false;
  }

  checkLoginAndPreload();

  var lastCheck = 0;
  setInterval(function() {
    var now = Date.now();
    if (now - lastCheck < 3000) return;
    lastCheck = now;
    checkLoginAndPreload();
  }, 1000);

  // ==================== VERSION BADGE ====================
  var badgeInterval = setInterval(function() {
    if (document.getElementById('sicip-version-badge')) { clearInterval(badgeInterval); return; }
    if (document.getElementById('root') && document.getElementById('root').firstChild) {
      var badge = document.createElement('div');
      badge.id = 'sicip-version-badge';
      badge.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#005235;color:white;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;z-index:9999;opacity:0.7;font-family:Inter,sans-serif;cursor:pointer';
      badge.textContent = 'SICIP v' + VERSION;
      badge.title = 'Click para forzar recarga';
      badge.addEventListener('click', function() {
        if (confirm('¿Forzar recarga de datos?')) {
          openIDB().then(function(db) {
            if (!db) return;
            var tx = db.transaction('data', 'readwrite');
            tx.objectStore('data').clear();
            tx.oncomplete = function() {
              dataLoaded = false;
              dataLoading = false;
              preloadAllData();
            };
          });
        }
      });
      document.body.appendChild(badge);
      clearInterval(badgeInterval);
    }
  }, 1000);

  console.log('[SICIP] v' + VERSION + ' — PRIORITY jefesServicio+cuadros first, modules INSTANT');
})();