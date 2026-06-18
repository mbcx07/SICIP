// SICIP Service Worker v5.19.6 automatic update
// Intercepts ALL Firestore reads — serves from preloaded JSON data
// All modules should be INSTANT because data is in memory

const VERSION = '5.19.6-auto-update';
const PROJECT_ID = 'sicip-bcs';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const CACHE_NAME = 'sicip-data-v11-auto';
const STATIC_CACHE = 'sicip-static-v10-auto';

// Collection map: Firestore collection -> data key
const COLLECTION_MAP = {
  'trabajadores': 'trabajadores',
  'plazas': 'plazas',
  'plazas_vacantes': 'vacantes',
  'vacantes': 'vacantes',
  'usuarios': 'usuarios',
  'jefesServicio': 'jefesServicio',
  'cuadros_reemplazo': 'cuadros',
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


self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([CACHE_NAME, STATIC_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.map(name => keep.has(name) ? null : caches.delete(name)));
    await self.clients.claim();
    // Notify all clients that a new SW version is now active
    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
    allClients.forEach(client => {
      client.postMessage({ type: 'SICIP_SW_UPDATED', version: VERSION });
    });
  })());
});

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
  
  // Intercept Firestore requests.
  // LOGIN FIX v5.13.2: do NOT intercept usuarios reads; login must validate against Firestore live data.
  if (url.hostname.includes('firestore.googleapis.com')) {
    if (url.pathname.includes(':commit')) return; // let writes through
    if (url.pathname.includes('/documents/usuarios')) return; // live network for authentication
    event.respondWith(handleFirestoreRequest(event.request, url));
    return;
  }
  
  // Network-first for static assets — ensures fresh content while offline fallback
  if (event.request.method === 'GET' && 
      !url.pathname.startsWith('/data-') &&
      (url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('.css') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.png') || url.pathname.endsWith('.webmanifest'))) {
    event.respondWith(networkFirst(event.request));
    return;
  }
});

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

// ==================== PWA NOTIFICATIONS ====================
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SICIP_SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'SICIP_SHOW_NOTIFICATION') {
    const title = data.title || 'SICIP';
    const options = {
      body: data.body || '',
      icon: '/icons/sicip-192.png?v=20260614050500',
      badge: '/icons/sicip-192.png?v=20260614050500',
      tag: data.tag || 'sicip-alerta',
      renotify: true,
      data: { url: data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch(e) { payload = { body: event.data ? event.data.text() : '' }; }
  const title = payload.title || 'Nueva notificación SICIP';
  const options = {
    body: payload.body || payload.mensaje || 'Tienes una nueva notificación pendiente.',
    icon: '/icons/sicip-192.png?v=20260614050500',
    badge: '/icons/sicip-192.png?v=20260614050500',
    tag: payload.tag || 'sicip-push',
    renotify: true,
    data: { url: payload.url || '/#/notificaciones' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) {
        try { await client.navigate(url); } catch(e) {}
        return client.focus();
      }
    }
    return clients.openWindow(url);
  })());
});
