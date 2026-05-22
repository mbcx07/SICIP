// SICIP Service Worker v4.0.0
// Intercepts ALL Firestore reads — serves from preloaded JSON data
// All modules should be INSTANT because data is in memory

const VERSION = '4.1.0';
const PROJECT_ID = 'sicip-bcs';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const CACHE_NAME = 'sicip-data-v6';
const STATIC_CACHE = 'sicip-static-v3';

// Collection map: Firestore collection -> data key
const COLLECTION_MAP = {
  'trabajadores': 'trabajadores',
  'plazas': 'plazas',
  'plazas_vacantes': 'vacantes',
  'vacantes': 'vacantes',
  'usuarios': 'usuarios',
  'jefesServicio': 'jefesServicio',
  'cuadros_reemplazo': 'cuadros',
  'cuadrosReemplazoBase': 'cuadros',
  'cuadrosReemplazoPorUsuario': 'cuadros',
  'cuadrosReemplazoMeta': 'cuadros',
  'postulaciones': 'postulaciones',
  'postulaciones_reemplazo': 'postulaciones',
  'notificaciones': 'notificaciones',
  'notificaciones_sicip': 'notificaciones',
  'tramites': 'tramites',
  'historial_estados': 'historial',
  'tipos_tramite': 'tipos_tramite',
  'roles': 'roles'
};

// In-memory data store
let DATA = {};
let dataLoaded = false;
let loadingPromise = null;

// ==================== DATA LOADING ====================
async function loadAllData() {
  if (dataLoaded) return;
  if (loadingPromise) { await loadingPromise; return; }
  
  loadingPromise = (async () => {
    const cache = await caches.open(CACHE_NAME);
    
    // Priority: small/critical datasets first
    const prioritySets = ['jefesServicio', 'cuadros', 'stats', 'vacantes', 'tramites'];
    const bulkSets = ['trabajadores', 'plazas', 'plazas-full', 'usuarios', 'usuarios-full'];
    const allSets = [...prioritySets, ...bulkSets];
    
    // Step 1: Try cache for everything
    for (const name of allSets) {
      const cached = await cache.match(`/data-${name}.json`);
      if (cached) {
        try { DATA[name] = await cached.json(); } catch(e) {}
      }
    }
    
    // Step 2: Fetch priority (small) sets from network if missing
    const priorityMissing = prioritySets.filter(n => !DATA[n]);
    if (priorityMissing.length > 0) {
      await Promise.all(priorityMissing.map(async (name) => {
        try {
          const resp = await fetch(`/data-${name}.json`);
          if (resp.ok) {
            DATA[name] = await resp.json();
            await cache.put(`/data-${name}.json`, resp.clone());
          }
        } catch(e) { console.error(`[SW] Error loading ${name}:`, e); }
      }));
    }
    
    // Step 3: Fetch bulk sets in background
    const bulkMissing = bulkSets.filter(n => !DATA[n]);
    if (bulkMissing.length > 0) {
      await Promise.all(bulkMissing.map(async (name) => {
        try {
          const resp = await fetch(`/data-${name}.json`);
          if (resp.ok) {
            DATA[name] = await resp.json();
            await cache.put(`/data-${name}.json`, resp.clone());
          }
        } catch(e) { console.error(`[SW] Error loading ${name}:`, e); }
      }));
    }
    
    // Derived data
    DATA.roles = [
      { id: 'ADMIN', nombre: 'Administrador', descripcion: 'Acceso total', modulos: ['solicitudes','contrato','cuadros','pases','licencias','recepciones','reportes','plantilla','admin','plazas','vacantes','usuarios','roles'] },
      { id: 'JEFE_SERVICIO', nombre: 'Jefe de Servicio', descripcion: 'Gestión de su unidad', modulos: ['solicitudes','cuadros','recepciones','reportes'] },
      { id: 'AREA_PERSONAL', nombre: 'Área de Personal', descripcion: 'Recursos humanos', modulos: ['solicitudes','contrato','cuadros','pases','licencias','recepciones','reportes','plantilla'] },
      { id: 'TRABAJADOR', nombre: 'Trabajador', descripcion: 'Consultas básicas', modulos: ['solicitudes'] }
    ];
    DATA.tipos_tramite = [
      { tipo: 'TIEMPO_EXTRAORDINARIO', nombre: 'Tiempo Extraordinario', requisitos: ['Autorización del jefe inmediato'] },
      { tipo: 'GUARDIA_FESTIVA', nombre: 'Guardia Festiva', requisitos: ['Calendario de guardias'] },
      { tipo: 'NIVELACION', nombre: 'Nivelación', requisitos: [] },
      { tipo: 'SUSTITUCION', nombre: 'Sustitución', requisitos: ['Trabajador a sustituir'] },
      { tipo: 'SOLICITUD_CONTRATO', nombre: 'Solicitud de Contrato', requisitos: [] },
      { tipo: 'PASE_ENTRADA', nombre: 'Pase de Entrada', requisitos: [] },
      { tipo: 'PASE_SALIDA', nombre: 'Pase de Salida', requisitos: [] },
      { tipo: 'LICENCIA_MEDICA', nombre: 'Licencia Médica', requisitos: ['Incapacidad del IMSS'] },
      { tipo: 'LICENCIA_SGSS', nombre: 'Licencia sin Goce de Sueldo', requisitos: [] },
      { tipo: 'VACACIONES', nombre: 'Vacaciones', requisitos: [] }
    ];
    DATA.historial = [];
    
    if (!DATA.cuadros) DATA.cuadros = [];
    if (!DATA.postulaciones) DATA.postulaciones = [];
    if (!DATA.notificaciones) DATA.notificaciones = [];
    if (!DATA.tramites) DATA.tramites = [];
    
    if (!DATA.jefesServicio && DATA['plazas-full']) {
      DATA.jefesServicio = DATA['plazas-full'].filter(p => 
        ['1','61','62','63'].includes(String(p.tp || '')) && p.nom && p.nom !== '#N/A'
      ).map(p => ({
        id: p.mat, matricula: p.mat, nombre: p.nom, unidad: p.jef, tp: p.tp, puesto: p.puesto
      }));
    }
    
    dataLoaded = true;
    console.log(`[SW] All data loaded — ${Object.keys(DATA).length} collections — v${VERSION}`);
  })();
  
  await loadingPromise;
}

// ==================== FIRESTORE RESPONSE BUILDERS ====================
function toFirestoreFields(obj) {
  const fields = {};
  if (!obj) return fields;
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'boolean') { fields[k] = { booleanValue: v }; continue; }
    if (typeof v === 'number') {
      fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: String(v) };
      continue;
    }
    if (Array.isArray(v)) {
      fields[k] = { arrayValue: { values: v.map(item => {
        if (typeof item === 'object' && item !== null) return { mapValue: { fields: toFirestoreFields(item) } };
        return { stringValue: String(item) };
      }) } };
      continue;
    }
    if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
      continue;
    }
    fields[k] = { stringValue: String(v) };
  }
  return fields;
}

function toFirestoreDoc(obj, collection, id) {
  return {
    name: `projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${id}`,
    fields: toFirestoreFields(obj),
    createTime: '2026-04-30T00:00:00.000000Z',
    updateTime: '2026-04-30T00:00:00.000000Z'
  };
}

function getCollectionData(collectionId) {
  const dataKey = COLLECTION_MAP[collectionId] || collectionId;
  return DATA[dataKey] !== undefined ? DATA[dataKey] : null;
}

// ==================== FETCH — Serve statics from cache, network-first ====================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Intercept Firestore requests
  if (url.hostname.includes('firestore.googleapis.com')) {
    if (url.pathname.includes(':commit')) return; // let writes through
    event.respondWith(handleFirestoreRequest(event.request, url));
    return;
  }
  
  // Network-first for static assets — ensures fresh content while offline fallback
  if (event.request.method === 'GET' && 
      !url.pathname.startsWith('/data-') &&
      (url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('.css') || url.pathname.endsWith('.svg'))) {
    event.respondWith(networkFirst(event.request));
    return;
  }
});

// ==================== FIRESTORE REQUEST HANDLER ====================
async function handleFirestoreRequest(request, url) {
  const path = url.pathname;
  const method = request.method;
  
  // Let writes (PATCH, POST, DELETE) through to Firestore
  if (method !== 'GET') {
    try { return await fetch(request); } catch(e) { return new Response(null, { status: 503 }); }
  }
  
  await loadAllData();
  
  // Determine collection and document from path
  const parts = path.split('/documents/');
  if (parts.length < 2) return fetchPassthrough(request);
  
  const rest = parts[1];
  const segments = rest.split('/');
  const collectionId = segments[0] || '';
  const docId = segments[1] || '';
  
  // For our admin collections (cuadrosReemplazoBase, etc.) — always passthrough to real Firestore
  if (collectionId.startsWith('cuadrosReemplazo')) {
    return fetchPassthrough(request);
  }
  
  // Check if we have local data for this collection
  const localData = getCollectionData(collectionId);
  if (!localData) {
    return fetchPassthrough(request);
  }
  
  // Single document query
  if (docId && !url.pathname.includes(':runQuery')) {
    const doc = Array.isArray(localData) 
      ? localData.find(d => String(d.id || d.matricula || '') === docId)
      : localData[docId];
    
    if (doc) {
      const resp = toFirestoreDoc(doc, collectionId, docId);
      return new Response(JSON.stringify(resp), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return fetchPassthrough(request);
  }
  
  // Collection query or runQuery
  if (Array.isArray(localData)) {
    const docs = localData.map(d => {
      const id = d.id || d.matricula || '';
      return toFirestoreDoc(d, collectionId, String(id));
    });
    
    const response = { documents: docs };
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return fetchPassthrough(request);
}

async function fetchPassthrough(request) {
  // Add API key if missing
  const url = request.url.includes('?') ? request.url + '&key=AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8' : request.url + '?key=AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8';
  try {
    return await fetch(url);
  } catch(e) {
    return new Response(JSON.stringify({ error: { message: e.message } }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Update cache with fresh copy
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch(e) {
    // Offline fallback
    const cached = await caches.match(request);
    if (cached) return cached;
    // If HTML, serve index.html
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    throw e;
  }
}