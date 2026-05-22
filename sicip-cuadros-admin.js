// SICIP Cuadros Admin Engine v2.0
// ================================
// Arquitectura final: datos preprocesados por usuario
// - Admin gestiona cuadrosReemplazoBase (CRUD completo)
// - Al guardar, se regenera cuadrosReemplazoPorUsuario/{matricula}
// - Usuario SOLO lee su documento preprocesado (1 sola lectura Firestore)
// - Caché local (sessionStorage) = carga INSTANTÁNEA
// - Intercepta el componente gY del bundle React original

(function() {
  'use strict';
  
  const VERSION = '2.0.0';
  const FS_PROJECT = 'sicip-bcs';
  const API_KEY = 'AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8';
  const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents`;
  const CACHE_KEY = 'sicip_micuadro_preprocesado';
  const CACHE_META_KEY = 'sicip_micuadro_cache_meta';
  
  function log(msg) { console.log(`[SICIP-CuadrosAdmin v${VERSION}] ${msg}`); }
  
  // ==================== UTILERÍAS ====================
  function getUsuario() {
    try { return JSON.parse(sessionStorage.getItem('sicip_usuario') || 'null'); } catch(e) { return null; }
  }
  
  function isAdmin() {
    const u = getUsuario();
    return u && (u.rol === 'ADMIN' || u.rol === 'AREA_PERSONAL');
  }
  
  // ==================== CACHE LOCAL ====================
  function getCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }
  
  function setCache(matricula, data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ matricula, data, cachedAt: Date.now() }));
      sessionStorage.setItem(CACHE_META_KEY, JSON.stringify({ matricula, cachedAt: Date.now() }));
    } catch(e) { /* quota */ }
  }
  
  function clearCache() {
    try { sessionStorage.removeItem(CACHE_KEY); sessionStorage.removeItem(CACHE_META_KEY); } catch(e) {}
  }
  
  // ==================== FIRESTORE REST API ====================
  function docPath(coll, id) {
    return `${FS_BASE}/${encodeURIComponent(coll)}/${encodeURIComponent(String(id))}`;
  }
  
  function collPath(coll) {
    return `${FS_BASE}/${encodeURIComponent(coll)}`;
  }
  
  async function fsGet(path) {
    const r = await fetch(path);
    if (!r.ok) return null;
    const d = await r.json();
    return d.error ? null : fromFSDoc(d);
  }
  
  async function fsSet(path, obj) {
    const r = await fetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toFSDoc(obj))
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  
  async function fsDelete(path) {
    const r = await fetch(path, { method: 'DELETE' });
    if (!r.ok) throw new Error('Error al eliminar');
    return true;
  }
  
  async function fsList(coll, limit = 500) {
    const r = await fetch(`${collPath(coll)}?pageSize=${limit}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d.documents || []).map(fromFSDoc);
  }
  
  function fromFSDoc(doc) {
    const obj = { _id: doc.name ? doc.name.split('/').pop() : null };
    if (doc.fields) {
      for (const k in doc.fields) obj[k] = fromFSVal(doc.fields[k]);
    }
    return obj;
  }
  
  function fromFSVal(v) {
    if (!v || v.nullValue !== undefined) return null;
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
    if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.arrayValue) return (v.arrayValue.values || []).map(fromFSVal);
    if (v.mapValue) {
      const o = {};
      if (v.mapValue.fields) for (const k in v.mapValue.fields) o[k] = fromFSVal(v.mapValue.fields[k]);
      return o;
    }
    return null;
  }
  
  function toFSDoc(obj) {
    const fields = {};
    for (const k in obj) {
      if (k === '_id') continue;
      fields[k] = toFSVal(obj[k]);
    }
    return { fields };
  }
  
  function toFSVal(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toFSVal) } };
    if (typeof v === 'object') {
      const f = {};
      for (const k in v) f[k] = toFSVal(v[k]);
      return { mapValue: { fields: f } };
    }
    return { stringValue: String(v) };
  }
  
  // ==================== MÓDULO: LECTURA PREPROCESADA ====================
  // ESTA es la función que reemplazará a E5(t) y todo el useEffect de gY
  
  const engine = {
    async obtenerMiCuadro(matricula) {
      // 1. Cache local → instantáneo
      const cached = getCache();
      if (cached && cached.matricula === matricula) {
        // Actualización silenciosa en bg
        this._bgRefresh(matricula);
        return { data: cached.data, fromCache: true, ok: true };
      }
      
      // 2. Leer documento preprocesado de Firestore (1 solo documento)
      try {
        const data = await this._leerPreprocesado(matricula);
        if (data) {
          setCache(matricula, data);
          return { data, fromCache: false, ok: true };
        }
        // 3. Fallback: crear documento vacío para Jefe de Servicio
        return { data: null, ok: true, empty: true };
      } catch(e) {
        // 4. Fallback extremo: cache aunque sea viejo
        const stale = getCache();
        if (stale && stale.matricula === matricula) {
          return { data: stale.data, fromCache: true, stale: true, ok: true };
        }
        return { data: null, ok: false, error: e.message };
      }
    },
    
    async _leerPreprocesado(mat) {
      // Intenta documento preprocesado primero
      let doc = await fsGet(docPath('cuadrosReemplazoPorUsuario', mat));
      if (doc) return this._normalizar(doc);
      
      // Fallback: leer de la base general
      doc = await fsGet(docPath('cuadrosReemplazoBase', mat));
      if (doc) {
        const norm = this._normalizar(doc);
        // Guardar automáticamente como preprocesado
        try { await fsSet(docPath('cuadrosReemplazoPorUsuario', mat), norm); } catch(e) {}
        return norm;
      }
      
      return null;
    },
    
    _normalizar(doc) {
      return {
        matricula: doc.matricula || doc._id || doc.jefeMatricula || '',
        jefeNombre: doc.jefeNombre || '',
        jefePuestoDescripcion: doc.jefePuestoDescripcion || '',
        jefeDepartamento: doc.jefeDepartamento || '',
        jefeDepartamentoNombre: doc.jefeDepartamentoNombre || '',
        localidad: doc.localidad || '',
        turno: doc.turno || '',
        status: doc.status || 'SIN_ASIGNAR',
        candidatos: (doc.candidatos || []).map(c => ({
          posicion: c.posicion || 0,
          matricula: c.matricula || '',
          nombre: c.nombre || '',
          descripcion: c.descripcion || '',
          departamento: c.departamento || '',
          tipoContrato: c.tipoContrato || ''
        })),
        escolaridadRequerida: doc.escolaridadRequerida || '',
        experienciaRequerida: doc.experienciaRequerida || '',
        fechaActualizacion: doc.fechaActualizacion || doc.generadoEn || new Date().toISOString(),
        _version: doc.version || 1
      };
    },
    
    _bgRefresh(mat) {
      setTimeout(async () => {
        try {
          const meta = await fsGet(docPath('cuadrosReemplazoMeta', '_global'));
          if (meta && meta.version) {
            const cached = getCache();
            const cacheVersion = (cached && cached.data && cached.data._version) || 0;
            if (meta.version > cacheVersion) {
              const fresh = await this._leerPreprocesado(mat);
              if (fresh) {
                setCache(mat, fresh);
                log('Cache actualizado en bg');
                window.dispatchEvent(new CustomEvent('sicip-cuadro-actualizado', { detail: fresh }));
              }
            }
          }
        } catch(e) {}
      }, 1500);
    },
    
    clearCache
  };
  
  window.__SICIP_CUADROS_ENGINE = engine;
  
  // ==================== INTERCEPCIÓN DEL COMPONENTE gY ====================
  // Reemplazamos el comportamiento del bundle React original
  // El componente gY monta un useEffect que llama eY(), E5(), ZA(), t3()
  // Cada vez que se navega a /cuadros/:plazaId
  // Vamos a interceptar esas funciones y reemplazarlas
  
  function interceptBundleFunctions() {
    // E5(t) — busca cuadro en __SICIP_DATA__ con loop de 6s, luego Firestore
    // La reemplazamos para que use datos preprocesados INSTANTÁNEOS
    if (window.__REACT_SICIP_E5 && !window.__SICIP_ORIGINAL_E5) {
      window.__SICIP_ORIGINAL_E5 = window.__REACT_SICIP_E5;
    }
    
    // Monitorear si el bundle ya cargó
    const checkBundle = setInterval(() => {
      // Buscar en React devtools o en el DOM la referencia a la función
      // El bundle asigna las funciones a variables globales internas
      // Detectamos por el texto "Cargando cuadro..." en el DOM
      const hasSpinner = document.body && document.body.innerHTML && 
        (document.body.innerHTML.includes('Cargando cuadro...') || 
         document.body.innerHTML.includes('cargando cuadro'));
      
      // También buscamos la función gY asignada globalmente
      // Como está minificada no tenemos nombre, pero podemos interceptar
      // por el patrón de datos que usa
      
      if (document.readyState === 'complete') {
        clearInterval(checkBundle);
        injectPatchCode();
      }
    }, 200);
    
    // También intentar inmediatamente
    setTimeout(injectPatchCode, 500);
    setTimeout(injectPatchCode, 1500);
    setTimeout(injectPatchCode, 3000);
    setTimeout(injectPatchCode, 5000);
  }
  
  function injectPatchCode() {
    // Verificar si ya se inyectó
    if (document.querySelector('[data-sicip-cuadro-patch]')) return;
    
    // Crear un observer de mutations para detectar cuando se renderiza
    // "Cargando cuadro..." y reemplazar el contenido
    const patchDiv = document.createElement('script');
    patchDiv.setAttribute('data-sicip-cuadro-patch', '1');
    patchDiv.type = 'text/javascript';
    patchDiv.textContent = `
      (function() {
        'use strict';
        
        // ===== OBSERVADOR: detecta "Cargando cuadro..." y lo reemplaza =====
        const observer = new MutationObserver(function(mutations) {
          for (const m of mutations) {
            if (m.type === 'childList' || m.type === 'characterData') {
              const texto = document.body ? document.body.innerText : '';
              if (texto.includes('Cargando cuadro...') || texto.includes('cargando cuadro')) {
                // Encontrar el contenedor del spinner
                const spinners = document.querySelectorAll('div[style*="animation: spin"]');
                for (const sp of spinners) {
                  // Buscar el contenedor padre que sea el div con minHeight
                  let parent = sp.closest('div[style*="minHeight"]');
                  if (!parent) {
                    // Buscar en padres hasta 5 niveles
                    parent = sp;
                    for (let i = 0; i < 5; i++) {
                      if (parent.parentElement && parent.parentElement.style && 
                          parent.parentElement.style.minHeight) {
                        parent = parent.parentElement;
                        break;
                      }
                      if (parent.parentElement) parent = parent.parentElement;
                      else break;
                    }
                  }
                  
                  if (parent) {
                    const matricula = window.__SICIP_MATRICULA_ACTUAL || 
                      (window.__SICIP_USUARIO && window.__SICIP_USUARIO.matricula) ||
                      (function() { 
                        try { 
                          const u = JSON.parse(sessionStorage.getItem('sicip_usuario') || '{}');
                          return u.matricula || u.uid || '';
                        } catch(e) { return ''; }
                      })();
                    
                    if (matricula) {
                      // Cargar datos preprocesados inmediatamente
                      const engine = window.__SICIP_CUADROS_ENGINE;
                      if (engine) {
                        engine.obtenerMiCuadro(matricula).then(function(result) {
                          if (result.ok && result.data) {
                            // Mostrar el cuadro directamente
                            parent.innerHTML = renderCuadroPreprocesado(result.data);
                          } else if (result.empty) {
                            parent.innerHTML = renderSinCuadro(matricula);
                          } else {
                            // Mostrar error pero con reintentar
                            parent.innerHTML = renderError(result.error || 'Error al cargar');
                          }
                        });
                      }
                    }
                    break;
                  }
                }
              }
            }
          }
        });
        
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        } else {
          document.addEventListener('DOMContentLoaded', function() {
            observer.observe(document.body, { childList: true, subtree: true, characterData: true });
          });
        }
        
        // ===== RENDERIZADORES DIRECTOS (evitan React totalmente) =====
        function renderCuadroPreprocesado(data) {
          const cands = (data.candidatos || []).sort(function(a,b) { return (a.posicion||0) - (b.posicion||0); });
          const statusColor = { 
            'SIN_ASIGNAR': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
            'PARCIAL': { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
            'COMPLETO': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
            'CERRADO': { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' }
          };
          const sc = statusColor[data.status] || statusColor['SIN_ASIGNAR'];
          const statusLabel = { 'SIN_ASIGNAR': 'Sin Asignar', 'PARCIAL': 'Parcial', 'COMPLETO': 'Completo', 'CERRADO': 'Cerrado' };
          
          var html = '<div style="padding:1.5rem;max-width:860px;margin:0 auto;font-family:Inter,sans-serif">' +
            '<div style="display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:1rem">' +
              '<div style="flex:1">' +
                '<h1 style="margin:0;font-size:1.3rem;font-weight:900;color:#005235">Asignación de Cuadro de Reemplazo</h1>' +
                '<p style="margin:0.2rem 0 0;color:#666;font-size:0.8rem">' + escapeHtml(data.jefeNombre || '') + ' · ' + escapeHtml(data.jefePuestoDescripcion || '') + '</p>' +
              '</div>' +
            '</div>' +
            '<div style="background:' + sc.bg + ';border:2px solid ' + sc.border + ';border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
              '<div>' +
                '<div style="font-size:0.72rem;font-weight:700;color:' + sc.text + ';text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">Estatus</div>' +
                '<div style="font-size:1rem;font-weight:800;color:' + sc.text + '">' + statusLabel[data.status] + ' — ' + cands.length + '/3 candidatos</div>' +
              '</div>' +
            '</div>' +
            '<div style="background:#f8fffe;border:1.5px solid #c8e6c9;border-radius:1rem;padding:0.9rem 1.1rem;margin-bottom:1.25rem">' +
              '<div style="font-size:0.72rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem">Jefe de Servicio</div>' +
              '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:0.5rem">' +
                '<div><span style="font-size:0.72rem;color:#888">Nombre:</span> <strong style="font-size:0.82rem">' + escapeHtml(data.jefeNombre || '') + '</strong></div>' +
                '<div><span style="font-size:0.72rem;color:#888">Matrícula:</span> <strong style="font-size:0.82rem">' + escapeHtml(data.matricula || '') + '</strong></div>' +
                '<div><span style="font-size:0.72rem;color:#888">Puesto:</span> <strong style="font-size:0.82rem">' + escapeHtml(data.jefePuestoDescripcion || '') + '</strong></div>' +
                '<div><span style="font-size:0.72rem;color:#888">Departamento:</span> <strong style="font-size:0.82rem">' + escapeHtml(data.jefeDepartamentoNombre || '') + '</strong></div>' +
              '</div>' +
            '</div>';
          
          if (cands.length === 0) {
            html += '<div style="text-align:center;padding:2.5rem 1rem;background:white;border-radius:1.1rem;border:2px solid #e8f5e9">' +
              '<div style="font-size:2.5rem;margin-bottom:0.75rem">👥</div>' +
              '<h3 style="margin:0 0 0.4rem;color:#005235;font-size:1rem">Sin candidatos asignados</h3>' +
              '<p style="color:#888;font-size:0.82rem;margin:0">Este cuadro aún no tiene candidatos. El administrador debe asignarlos.</p>' +
            '</div>';
          } else {
            html += '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1rem">';
            for (var i = 0; i < cands.length; i++) {
              var c = cands[i];
              var pos = c.posicion || (i + 1);
              html += '<div style="background:white;border-radius:1rem;border:2px solid #e8f5e9;overflow:hidden">' +
                '<div style="padding:0.85rem 1rem;display:flex;align-items:center;gap:0.75rem">' +
                  '<div style="width:36px;height:36px;border-radius:50%;background:' + (pos === 1 ? '#005235' : pos === 2 ? '#1a7a45' : '#27ae60') + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1rem;flex-shrink:0">' + pos + '</div>' +
                  '<div style="flex:1;min-width:0">' +
                    '<div style="font-weight:800;font-size:0.95rem;color:#1a2932;margin-bottom:0.15rem">' + escapeHtml(c.nombre || '') + '</div>' +
                    '<div style="font-size:0.75rem;color:#888">Mat. ' + escapeHtml(c.matricula || '') + ' · ' + escapeHtml(c.descripcion || '') + ' · ' + escapeHtml(c.departamento || '') + '</div>' +
                  '</div>' +
                '</div>' +
              '</div>';
            }
            html += '</div>';
          }
          
          if (data.escolaridadRequerida || data.experienciaRequerida) {
            html += '<div style="background:#f8fffe;border:1.5px solid #c8e6c9;border-radius:1rem;padding:0.9rem 1.1rem;margin-bottom:1rem">' +
              '<div style="font-size:0.72rem;font-weight:700;color:#005235;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem">Requisitos</div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">' +
                (data.escolaridadRequerida ? '<div><span style="font-size:0.72rem;color:#888">Escolaridad:</span> <strong style="font-size:0.82rem">' + escapeHtml(data.escolaridadRequerida) + '</strong></div>' : '') +
                (data.experienciaRequerida ? '<div><span style="font-size:0.72rem;color:#888">Experiencia:</span> <strong style="font-size:0.82rem">' + escapeHtml(data.experienciaRequerida) + '</strong></div>' : '') +
              '</div>' +
            '</div>';
          }
          
          html += '<div style="text-align:center;padding:0.5rem;font-size:0.72rem;color:#9ca3af">' +
            'Última actualización: ' + (data.fechaActualizacion ? new Date(data.fechaActualizacion).toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'No disponible') +
            ' · Datos preprocesados' +
          '</div></div>';
          
          return html;
        }
        
        function renderSinCuadro(matricula) {
          return '<div style="padding:1.5rem;max-width:860px;margin:0 auto;font-family:Inter,sans-serif">' +
            '<div style="text-align:center;padding:3rem 1.5rem;background:white;border-radius:1.1rem;border:2px solid #e8f5e9">' +
              '<div style="font-size:3rem;margin-bottom:1rem">📋</div>' +
              '<h3 style="margin:0 0 0.5rem;color:#005235;font-size:1.1rem">Aún no tienes cuadro de reemplazo asignado</h3>' +
              '<p style="color:#6b7280;font-size:0.88rem;margin:0 auto;max-width:400px">El cuadro de reemplazo para tu puesto aún no ha sido creado por el administrador.</p>' +
            '</div></div>';
        }
        
        function renderError(msg) {
          return '<div style="padding:1.5rem;max-width:860px;margin:0 auto;font-family:Inter,sans-serif">' +
            '<div style="text-align:center;padding:2rem;color:#dc2626">' +
              '<p style="font-weight:700;font-size:1.1rem;margin:0 0 0.5rem">Error al cargar datos</p>' +
              '<p style="margin:0;font-size:0.85rem;color:#6b7280">' + escapeHtml(msg) + '</p>' +
              '<button onclick="setTimeout(function(){location.reload()},200)" style="margin-top:1.5rem;padding:0.6rem 1.5rem;background:#005235;color:white;border:none;border-radius:0.7rem;font-size:0.88rem;font-weight:700;cursor:pointer">Reintentar</button>' +
            '</div></div>';
        }
        
        function escapeHtml(str) {
          if (!str) return '';
          return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }
      })();
    `;
    document.body.appendChild(patchDiv);
    
    // También interceptar React Router navigation para /cuadros/
    interceptRouterNavigation();
    
    log('✅ Patch de intercepción inyectado');
  }
  
  function interceptRouterNavigation() {
    // Monitorear cambios en la URL para detectar navegación a /cuadros/
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        if (location.pathname.includes('/cuadros/') || location.pathname === '/cuadros') {
          // Esperar a que React renderice y luego interceptar el spinner
          setTimeout(() => {
            const mat = extractMatricula();
            if (mat) {
              engine.obtenerMiCuadro(mat).then(result => {
                if (result.data) {
                  // Disparar evento personalizado para que el observer lo capte
                  window.__SICIP_MICUADRO_DATA = result.data;
                  // Si el spinner ya está visible, reemplazarlo
                  replaceSpinnerWithData(result.data);
                }
              });
            }
          }, 300);
        }
      }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
    log('✅ Router navigation interceptado');
  }
  
  function extractMatricula() {
    try {
      // Obtener de la URL: /cuadros/PLAZAID
      const match = location.pathname.match(/\/cuadros\/([^/]+)/);
      if (match) return match[1];
      
      // O del usuario en sesión
      const u = JSON.parse(sessionStorage.getItem('sicip_usuario') || '{}');
      return u.matricula || u.uid || u.email ? u.email.split('@')[0] : '';
    } catch(e) { return ''; }
  }
  
  function replaceSpinnerWithData(data) {
    // Buscar y reemplazar el spinner renderizado por React
    const spinners = document.querySelectorAll('div[style*="minHeight"], div[style*="min-height"]');
    for (const sp of spinners) {
      if (sp.textContent && sp.textContent.includes('Cargando')) {
        const html = renderCuadroPreprocesadoJS(data);
        sp.innerHTML = html;
        break;
      }
    }
  }
  
  function renderCuadroPreprocesadoJS(data) {
    const cands = (data.candidatos || []).sort((a,b) => (a.posicion||0) - (b.posicion||0));
    const statusLabel = { 'SIN_ASIGNAR': 'Sin Asignar', 'PARCIAL': 'Parcial', 'COMPLETO': 'Completo', 'CERRADO': 'Cerrado' };
    
    let html = `<div style="padding:1.5rem;max-width:860px;margin:0 auto;font-family:Inter,sans-serif">
      <div style="display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:1rem">
        <div style="flex:1">
          <h1 style="margin:0;font-size:1.3rem;font-weight:900;color:#005235">Cuadro de Reemplazo</h1>
          <p style="margin:0.2rem 0 0;color:#666;font-size:0.8rem">${esc(data.jefeNombre)} · ${esc(data.jefePuestoDescripcion)}</p>
        </div>
      </div>
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">Estatus</div>
          <div style="font-size:1rem;font-weight:800;color:#166534">${statusLabel[data.status] || 'Sin Asignar'} — ${cands.length}/3 candidatos</div>
        </div>
      </div>`;
    
    if (cands.length === 0) {
      html += `<div style="text-align:center;padding:2.5rem 1rem;background:white;border-radius:1.1rem;border:2px solid #e8f5e9">
        <div style="font-size:2.5rem;margin-bottom:0.75rem">👥</div>
        <h3 style="margin:0 0 0.4rem;color:#005235;font-size:1rem">Sin candidatos asignados</h3>
        <p style="color:#888;font-size:0.82rem;margin:0">Este cuadro aún no tiene candidatos. El administrador debe asignarlos.</p>
      </div>`;
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1rem">';
      for (const c of cands) {
        const pos = c.posicion || 1;
        html += `<div style="background:white;border-radius:1rem;border:2px solid #e8f5e9;overflow:hidden">
          <div style="padding:0.85rem 1rem;display:flex;align-items:center;gap:0.75rem">
            <div style="width:36px;height:36px;border-radius:50%;background:${pos===1?'#005235':pos===2?'#1a7a45':'#27ae60'};color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1rem;flex-shrink:0">${pos}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:800;font-size:0.95rem;color:#1a2932;margin-bottom:0.15rem">${esc(c.nombre)}</div>
              <div style="font-size:0.75rem;color:#888">Mat. ${esc(c.matricula)} · ${esc(c.descripcion)} · ${esc(c.departamento)}</div>
            </div>
          </div>
        </div>`;
      }
      html += '</div>';
    }
    
    html += `<div style="text-align:center;padding:0.5rem;font-size:0.72rem;color:#9ca3af">
      Última actualización: ${data.fechaActualizacion ? new Date(data.fechaActualizacion).toLocaleDateString('es-MX', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'No disponible'}
      · Carga instantánea
    </div></div>`;
    
    return html;
  }
  
  function esc(s) { return s ? String(s).replace(/[&<>"]/g,'') : ''; }
  
  // ==================== MÓDULO ADMIN: PANEL COMPLETO ====================
  
  function removePanel() {
    const p = document.querySelector('[data-sicip-admin-panel]');
    if (p) p.remove();
  }
  
  function renderAdminPanel() {
    const u = getUsuario();
    if (!u || (u.rol !== 'ADMIN' && u.rol !== 'AREA_PERSONAL')) {
      alert('Solo administradores');
      return;
    }
    
    removePanel();
    
    const container = document.createElement('div');
    container.setAttribute('data-sicip-admin-panel', '');
    container.style.cssText = 'position:fixed;top:0;left:72px;right:0;bottom:0;z-index:9999;overflow-y:auto;background:#f9fafb;padding:0;font-family:Inter,sans-serif';
    
    container.innerHTML = `
    <div style="max-width:1000px;margin:0 auto;padding:1.5rem">
      <div style="margin-bottom:1.25rem">
        <button onclick="document.querySelector('[data-sicip-admin-panel]').remove();document.getElementById('root').style.display='';" 
          style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:#005235;font-weight:600;padding:0 0 0.5rem 0;display:inline-flex;align-items:center;gap:6px">← Volver al inicio</button>
        <h2 style="margin:0;font-size:1.25rem;font-weight:800;color:#003324;font-family:Inter,sans-serif">Administración de Cuadros de Reemplazo</h2>
        <p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.8rem">Gestión centralizada · Datos preprocesados por usuario</p>
      </div>
      
      <div id="sicip-admin-status" style="display:none;padding:0.75rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:0.85rem;font-weight:600"></div>
      
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.25rem">
        <button id="btn-importar" style="background:#005235;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">📥 Importar base completa</button>
        <button id="btn-editar" style="background:#1d4ed8;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">✏️ Editar / Crear registro</button>
        <button id="btn-regenerar" style="background:#f59e0b;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">🔄 Regenerar cuadros por usuario</button>
        <button id="btn-ver-base" style="background:#6b7280;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">📋 Ver base de datos</button>
      </div>
      
      <div id="sicip-admin-content" style="background:white;border-radius:12px;padding:1.5rem;border:1px solid #e5e7eb;min-height:200px">
        <div style="text-align:center;padding:3rem;color:#9ca3af">
          <p style="font-size:1rem;margin:0 0 0.5rem;font-weight:600">Selecciona una acción</p>
          <p style="font-size:0.82rem;margin:0">Importa los datos locales, edita registros, regenera datos preprocesados</p>
        </div>
      </div>
    </div>`;
    
    document.body.appendChild(container);
    document.getElementById('root').style.display = 'none';
    
    attachAdminHandlers();
  }
  
  function showStatus(msg, type, duration) {
    const el = document.getElementById('sicip-admin-status');
    if (!el) return;
    el.style.display = 'block';
    el.style.background = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#fffbeb';
    el.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#d97706';
    el.innerHTML = msg;
    if (duration !== 0) setTimeout(() => { el.style.display = 'none'; }, duration || 5000);
  }
  
  function attachAdminHandlers() {
    const content = document.getElementById('sicip-admin-content');
    
    // === IMPORTAR BASE COMPLETA ===
    document.getElementById('btn-importar').addEventListener('click', async () => {
      content.innerHTML = '<div style="text-align:center;padding:2rem"><div class="sicip-spinner"></div><p style="color:#666;font-size:0.9rem;margin-top:1rem">Importando base completa desde datos locales...</p></div>';
      
      try {
        const data = window.__SICIP_DATA__ || {};
        const jefes = data.jefesServicio || [];
        const cuadrosExistentes = data.cuadros || [];
        const trabajadores = data.trabajadores || [];
        let importados = 0, errores = [], incompletos = [];
        
        for (let i = 0; i < jefes.length; i++) {
          const jefe = jefes[i];
          const mat = String(jefe.matricula || jefe.id || '');
          if (!mat) { incompletos.push(`Jefe #${i+1} sin matrícula`); continue; }
          
          const nombre = jefe.nombre || jefe.nombres || jefe.nom || '';
          if (!nombre) { incompletos.push(`Mat. ${mat}: sin nombre`); }
          
          const cuadroExistente = cuadrosExistentes.find(c => String(c.jefeMatricula || c.id) === mat);
          
          const registro = {
            jefeMatricula: mat,
            jefeNombre: nombre,
            jefePuestoDescripcion: jefe.puestoDescripcion || jefe.descripcion || jefe.puesto || '',
            jefeDepartamento: jefe.departamento || jefe.unidad || '',
            jefeDepartamentoNombre: jefe.departamentoNombre || jefe.departamento || '',
            localidad: jefe.localidad || '',
            turno: jefe.turno || '',
            status: (cuadroExistente && cuadroExistente.status) || 'SIN_ASIGNAR',
            candidatos: (cuadroExistente && cuadroExistente.candidatos) || [],
            escolaridadRequerida: (cuadroExistente && cuadroExistente.escolaridadRequerida) || '',
            experienciaRequerida: (cuadroExistente && cuadroExistente.experienciaRequerida) || '',
            fechaActualizacion: new Date().toISOString(),
            version: 1
          };
          
          try {
            await fsSet(docPath('cuadrosReemplazoBase', mat), registro);
            importados++;
          } catch(e) {
            errores.push(`Mat. ${mat}: ${e.message}`);
          }
        }
        
        // Generar metadatos globales
        await fsSet(docPath('cuadrosReemplazoMeta', '_global'), {
          ultimaActualizacion: new Date().toISOString(),
          version: Date.now(),
          totalRegistros: importados,
          accion: 'importacion-base'
        });
        
        let statsHtml = `<div style="text-align:center;padding:2rem">
          <div style="font-size:2.5rem;margin-bottom:0.5rem">✅</div>
          <p style="font-weight:700;font-size:1.1rem;color:#16a34a">Importación completada</p>
          <p style="color:#6b7280;font-size:0.85rem">${importados} registros importados a cuadrosReemplazoBase</p>`;
        
        if (errores.length > 0) {
          statsHtml += `<div style="margin-top:1rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:0.75rem;text-align:left">
            <p style="font-weight:700;color:#dc2626;font-size:0.85rem;margin:0 0 0.4rem">⚠️ Errores (${errores.length}):</p>
            <ul style="margin:0;padding-left:1.2rem;font-size:0.78rem;color:#dc2626;max-height:120px;overflow-y:auto">
              ${errores.map(e => `<li>${e}</li>`).join('')}
            </ul>
          </div>`;
        }
        
        if (incompletos.length > 0) {
          statsHtml += `<div style="margin-top:1rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:0.75rem;text-align:left">
            <p style="font-weight:700;color:#92400e;font-size:0.85rem;margin:0 0 0.4rem">⚠️ Registros incompletos (${incompletos.length}):</p>
            <ul style="margin:0;padding-left:1.2rem;font-size:0.78rem;color:#92400e;max-height:120px;overflow-y:auto">
              ${incompletos.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>`;
        }
        
        statsHtml += `<div style="margin-top:1.5rem;display:flex;gap:0.75rem;justify-content:center">
          <button onclick="document.getElementById('btn-regenerar').click()" style="background:#f59e0b;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">🔄 Regenerar cuadros por usuario ahora</button>
        </div></div>`;
        
        content.innerHTML = statsHtml;
        showStatus(`✅ ${importados} registros importados. ${errores.length} errores, ${incompletos.length} incompletos.`, importados > 0 ? 'success' : 'warning', 8000);
        
      } catch(e) {
        content.innerHTML = `<div style="text-align:center;padding:2rem;color:#dc2626">
          <p style="font-weight:700;font-size:1.1rem;margin:0 0 0.5rem">❌ Error al importar</p>
          <p style="font-size:0.85rem;margin:0">${e.message}</p>
        </div>`;
        showStatus(`❌ Error: ${e.message}`, 'error');
      }
    });
    
    // === EDITAR / CREAR REGISTRO ===
    document.getElementById('btn-editar').addEventListener('click', () => {
      content.innerHTML = `
      <div>
        <h3 style="margin:0 0 1rem;font-size:1.05rem;font-weight:700;color:#003324;font-family:Inter,sans-serif">${'✏️ Editar / Crear Registro'}</h3>
        
        <div id="sicip-admin-cargar-registro" style="margin-bottom:1rem">
          <label style="display:block;font-size:0.78rem;font-weight:700;color:#6b7280;margin-bottom:0.3rem">Buscar por matrícula para cargar datos existentes:</label>
          <div style="display:flex;gap:0.5rem">
            <input id="edit-cargar-mat" placeholder="Matrícula del jefe..." 
              style="flex:1;padding:0.5rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem;font-family:Inter,sans-serif">
            <button id="btn-cargar-registro" style="background:#6b7280;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.82rem;font-weight:700;cursor:pointer">Cargar</button>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          ${campo('edit-matricula', 'Matrícula Jefe *', 'text', 'Matrícula...')}
          ${campo('edit-nombre', 'Nombre Jefe *', 'text', 'Nombre completo...')}
          ${campo('edit-puesto', 'Puesto / Descripción', 'text', 'Puesto...')}
          ${campo('edit-depto', 'Departamento', 'text', 'Departamento...')}
          ${campo('edit-localidad', 'Localidad', 'text', 'Localidad...')}
          ${select('edit-status', 'Estatus', ['SIN_ASIGNAR','PARCIAL','COMPLETO','CERRADO'], ['Sin Asignar','Parcial','Completo','Cerrado'])}
          ${campo('edit-escolaridad', 'Escolaridad Requerida', 'text', 'Ej: Licenciatura...')}
          ${campo('edit-experiencia', 'Experiencia Requerida', 'text', 'Ej: 2 años...')}
        </div>
        
        <div id="sicip-admin-editor-msg" style="display:none;padding:0.5rem;font-size:0.82rem;margin-top:0.75rem"></div>
        
        <div style="margin-top:1.25rem;display:flex;gap:0.5rem;flex-wrap:wrap">
          <button id="btn-guardar-editar" style="background:#10b981;color:white;border:none;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">💾 Guardar y procesar</button>
          <button id="btn-limpiar-editar" style="background:#6b7280;color:white;border:none;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">🗑️ Limpiar campos</button>
          ${isAdmin() ? '<button id="btn-eliminar-editar" style="background:#dc2626;color:white;border:none;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer">❌ Eliminar registro</button>' : ''}
        </div>
        
        <div id="sicip-admin-editor-resumen" style="margin-top:1rem;display:none;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:0.75rem 1rem;font-size:0.82rem"></div>
      </div>`;
      
      attachEditorHandlers();
    });
    
    // === REGENERAR CUADROS POR USUARIO ===
    document.getElementById('btn-regenerar').addEventListener('click', async () => {
      content.innerHTML = `<div style="text-align:center;padding:2rem"><div class="sicip-spinner"></div>
        <p style="color:#666;font-size:0.9rem;margin-top:1rem">Generando documentos preprocesados por usuario...</p>
        <p style="color:#9ca3af;font-size:0.8rem">Esto puede tomar unos segundos dependiendo del número de registros</p>
      </div>`;
      
      try {
        const todos = await fsList('cuadrosReemplazoBase', 500);
        let procesados = 0, errores = [];
        
        for (const reg of todos) {
          const mat = reg.jefeMatricula || reg._id || '';
          if (!mat) { errores.push('Registro sin matrícula'); continue; }
          
          const datosPreprocesados = {
            matricula: mat,
            jefeNombre: reg.jefeNombre || '',
            jefePuestoDescripcion: reg.jefePuestoDescripcion || '',
            jefeDepartamento: reg.jefeDepartamento || '',
            jefeDepartamentoNombre: reg.jefeDepartamentoNombre || '',
            localidad: reg.localidad || '',
            turno: reg.turno || '',
            status: reg.status || 'SIN_ASIGNAR',
            candidatos: (reg.candidatos || []).map(c => ({
              posicion: c.posicion || 0,
              matricula: c.matricula || '',
              nombre: c.nombre || '',
              descripcion: c.descripcion || '',
              departamento: c.departamento || '',
              tipoContrato: c.tipoContrato || ''
            })),
            escolaridadRequerida: reg.escolaridadRequerida || '',
            experienciaRequerida: reg.experienciaRequerida || '',
            version: (reg.version || 0) + 1,
            fechaActualizacion: new Date().toISOString(),
            generadoEn: new Date().toISOString()
          };
          
          try {
            await fsSet(docPath('cuadrosReemplazoPorUsuario', mat), datosPreprocesados);
            procesados++;
          } catch(e) {
            errores.push(`Mat. ${mat}: ${e.message}`);
          }
        }
        
        // Actualizar meta con nueva versión
        const newVersion = Date.now();
        await fsSet(docPath('cuadrosReemplazoMeta', '_global'), {
          ultimaActualizacion: new Date().toISOString(),
          version: newVersion,
          totalProcesados: procesados,
          accion: 'regeneracion-masiva',
          fecha: new Date().toISOString()
        });
        
        content.innerHTML = `
        <div style="text-align:center;padding:2rem">
          <div style="font-size:2.5rem;margin-bottom:0.5rem">🔄</div>
          <p style="font-weight:700;font-size:1.1rem;color:#f59e0b">Regeneración completada</p>
          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:1rem;margin:1rem auto;max-width:300px">
            <p style="margin:0 0 0.3rem;font-weight:700;font-size:1.3rem;color:#92400e">${procesados}</p>
            <p style="margin:0;font-size:0.82rem;color:#92400e">documentos preprocesados generados/actualizados</p>
            <p style="margin:0.5rem 0 0;font-size:0.72rem;color:#6b7280">Versión: ${new Date(newVersion).toLocaleString('es-MX')}</p>
          </div>
          ${errores.length > 0 ? `
          <div style="margin-top:1rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:0.75rem;text-align:left">
            <p style="font-weight:700;color:#dc2626;font-size:0.85rem;margin:0 0 0.4rem">⚠️ Errores (${errores.length}):</p>
            <ul style="margin:0;padding-left:1.2rem;font-size:0.78rem;color:#dc2626">
              ${errores.map(e => `<li>${e}</li>`).join('')}
            </ul>
          </div>` : ''}
          <p style="margin-top:1rem;font-size:0.82rem;color:#6b7280">Los usuarios verán los datos actualizados en su próximo ingreso a Mi Cuadro de Reemplazo</p>
        </div>`;
        
        // Limpiar cache local de todos (no podemos acceder, pero el engine detecta nueva versión)
        clearCache();
        showStatus(`✅ ${procesados} documentos preprocesados generados. ${errores.length} errores.`, procesados > 0 ? 'success' : 'warning', 10000);
        
      } catch(e) {
        content.innerHTML = `<div style="text-align:center;padding:2rem;color:#dc2626">
          <p style="font-weight:700;font-size:1.1rem;margin:0 0 0.5rem">❌ Error al regenerar</p>
          <p style="font-size:0.85rem;margin:0">${e.message}</p>
        </div>`;
        showStatus(`❌ Error: ${e.message}`, 'error');
      }
    });
    
    // === VER BASE DE DATOS ===
    document.getElementById('btn-ver-base').addEventListener('click', async () => {
      content.innerHTML = `<div style="text-align:center;padding:2rem"><div class="sicip-spinner"></div><p style="color:#666;font-size:0.9rem;margin-top:1rem">Cargando base de datos...</p></div>`;
      
      try {
        const [base, preproc, meta] = await Promise.all([
          fsList('cuadrosReemplazoBase', 500),
          fsList('cuadrosReemplazoPorUsuario', 500),
          fsGet(docPath('cuadrosReemplazoMeta', '_global'))
        ]);
        
        const preMap = {};
        preproc.forEach(p => { preMap[p.matricula || p._id || ''] = true; });
        
        const stats = { completos: 0, parcial: 0, sinAsignar: 0, cerrado: 0 };
        base.forEach(r => {
          const s = r.status || 'SIN_ASIGNAR';
          if (s === 'COMPLETO') stats.completos++;
          else if (s === 'PARCIAL') stats.parcial++;
          else if (s === 'CERRADO') stats.cerrado++;
          else stats.sinAsignar++;
        });
        
        let html = `<div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem">
            <div style="background:#f0fdf4;padding:0.6rem 1rem;border-radius:8px;flex:1;min-width:100px;text-align:center">
              <div style="font-size:1.3rem;font-weight:800;color:#16a34a">${base.length}</div>
              <div style="font-size:0.7rem;color:#6b7280">Registros base</div>
            </div>
            <div style="background:#e3f2fd;padding:0.6rem 1rem;border-radius:8px;flex:1;min-width:100px;text-align:center">
              <div style="font-size:1.3rem;font-weight:800;color:#1d4ed8">${preproc.length}</div>
              <div style="font-size:0.7rem;color:#6b7280">Preprocesados</div>
            </div>
            <div style="background:#fffbeb;padding:0.6rem 1rem;border-radius:8px;flex:1;min-width:100px;text-align:center">
              <div style="font-size:1.3rem;font-weight:800;color:#d97706">${stats.completos}</div>
              <div style="font-size:0.7rem;color:#6b7280">Completos</div>
            </div>
            <div style="background:#fef2f2;padding:0.6rem 1rem;border-radius:8px;flex:1;min-width:100px;text-align:center">
              <div style="font-size:1.3rem;font-weight:800;color:#dc2626">${stats.sinAsignar}</div>
              <div style="font-size:0.7rem;color:#6b7280">Sin asignar</div>
            </div>
          </div>`;
        
        if (meta) {
          html += `<div style="background:#f3f4f6;border-radius:8px;padding:0.5rem 0.75rem;margin-bottom:1rem">
            <span style="font-size:0.78rem;color:#6b7280">Última actualización global: </span>
            <strong style="font-size:0.8rem;color:#374151">${meta.ultimaActualizacion ? new Date(meta.ultimaActualizacion).toLocaleString('es-MX') : 'No disponible'}</strong>
            <span style="font-size:0.72rem;color:#9ca3af;margin-left:0.5rem">(versión ${meta.version || '?'})</span>
          </div>`;
        }
        
        html += `<div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:0.75rem">
            <thead><tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb">
              <th style="padding:0.45rem;text-align:left">Matrícula</th>
              <th style="padding:0.45rem;text-align:left">Nombre</th>
              <th style="padding:0.45rem;text-align:center">Status</th>
              <th style="padding:0.45rem;text-align:center">Candidatos</th>
              <th style="padding:0.45rem;text-align:center">Preproc.</th>
              <th style="padding:0.45rem;text-align:left">Actualización</th>
            </tr></thead><tbody>`;
        
        base.forEach(r => {
          const mat = r.jefeMatricula || r._id || '';
          const status = r.status || 'SIN_ASIGNAR';
          const numCand = (r.candidatos || []).length;
          const tienePre = preMap[mat] ? '✅' : '❌';
          const sColors = { SIN_ASIGNAR:'#f8d7da|#721c24', PARCIAL:'#fff3cd|#856404', COMPLETO:'#d4edda|#155724', CERRADO:'#e2e3e5|#383d41' };
          const sc = (sColors[status] || sColors.SIN_ASIGNAR).split('|');
          const fec = r.fechaActualizacion || r._updateTime || '';
          const fecShort = fec.length > 16 ? fec.substring(0, 10) : fec;
          
          html += `<tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:0.45rem;font-family:monospace;font-weight:600">${esc(mat)}</td>
            <td style="padding:0.45rem">${esc((r.jefeNombre||'').substring(0,35))}</td>
            <td style="padding:0.45rem;text-align:center"><span style="background:${sc[0]};color:${sc[1]};padding:0.15rem 0.4rem;border-radius:999px;font-size:0.65rem;font-weight:600;white-space:nowrap">${status}</span></td>
            <td style="padding:0.45rem;text-align:center;font-weight:700">${numCand}</td>
            <td style="padding:0.45rem;text-align:center;font-size:1rem">${tienePre}</td>
            <td style="padding:0.45rem;color:#6b7280;font-size:0.7rem">${fecShort || '—'}</td>
          </tr>`;
        });
        
        html += '</tbody></table></div></div>';
        content.innerHTML = html;
        
      } catch(e) {
        content.innerHTML = `<div style="text-align:center;padding:2rem;color:#dc2626">
          <p style="font-weight:700;font-size:1.1rem;margin:0 0 0.5rem">❌ Error al cargar base</p>
          <p style="font-size:0.85rem;margin:0">${e.message}</p>
        </div>`;
      }
    });
  }
  
  function campo(id, label, type, ph) {
    return `<div>
      <label style="display:block;font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:0.25rem">${label}</label>
      <input id="${id}" type="${type}" placeholder="${ph}" 
        style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem;font-family:Inter,sans-serif;box-sizing:border-box">
    </div>`;
  }
  
  function select(id, label, values, labels) {
    const opts = values.map((v, i) => `<option value="${v}">${labels[i] || v}</option>`).join('');
    return `<div>
      <label style="display:block;font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:0.25rem">${label}</label>
      <select id="${id}" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem;font-family:Inter,sans-serif;box-sizing:border-box">${opts}</select>
    </div>`;
  }
  
  function attachEditorHandlers() {
    const getVal = id => document.getElementById(id).value.trim();
    const setVal = (id, v) => { document.getElementById(id).value = v || ''; };
    const msg = document.getElementById('sicip-admin-editor-msg');
    const resumen = document.getElementById('sicip-admin-editor-resumen');
    
    function showMsg(text, type) {
      msg.style.display = 'block';
      msg.style.background = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#fffbeb';
      msg.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#d97706';
      msg.textContent = text;
      setTimeout(() => { msg.style.display = 'none'; }, 4000);
    }
    
    // Cargar registro existente
    document.getElementById('btn-cargar-registro').addEventListener('click', async () => {
      const mat = getVal('edit-cargar-mat');
      if (!mat) { showMsg('Ingresa una matrícula', 'error'); return; }
      
      try {
        let doc = await fsGet(docPath('cuadrosReemplazoBase', mat));
        if (!doc) doc = await fsGet(docPath('cuadrosReemplazoPorUsuario', mat));
        
        if (doc) {
          setVal('edit-matricula', doc.jefeMatricula || mat);
          setVal('edit-nombre', doc.jefeNombre || '');
          setVal('edit-puesto', doc.jefePuestoDescripcion || '');
          setVal('edit-depto', doc.jefeDepartamentoNombre || doc.jefeDepartamento || '');
          setVal('edit-localidad', doc.localidad || '');
          setVal('edit-status', doc.status || 'SIN_ASIGNAR');
          setVal('edit-escolaridad', doc.escolaridadRequerida || '');
          setVal('edit-experiencia', doc.experienciaRequerida || '');
          
          resumen.style.display = 'block';
          resumen.innerHTML = `📄 Registro cargado: <strong>${doc.jefeNombre || 'Sin nombre'}</strong> · ${(doc.candidatos || []).length} candidatos · Status: ${doc.status || 'N/A'}`;
          showMsg('✅ Registro cargado correctamente', 'success');
        } else {
          // Crear nuevo
          setVal('edit-matricula', mat);
          showMsg('📝 No se encontró registro existente. Se creará uno nuevo.', 'info');
          resumen.style.display = 'none';
        }
      } catch(e) {
        showMsg(`Error: ${e.message}`, 'error');
      }
    });
    
    // Guardar
    document.getElementById('btn-guardar-editar').addEventListener('click', async () => {
      const matricula = getVal('edit-matricula');
      if (!matricula) { showMsg('⚠️ La matrícula es obligatoria', 'error'); return; }
      const nombre = getVal('edit-nombre');
      if (!nombre) { showMsg('⚠️ El nombre del jefe es obligatorio', 'error'); return; }
      
      msg.style.display = 'block';
      msg.style.background = '#fffbeb';
      msg.style.color = '#92400e';
      msg.textContent = '💾 Guardando y procesando...';
      
      try {
        const data = {
          jefeMatricula: matricula,
          jefeNombre: nombre,
          jefePuestoDescripcion: getVal('edit-puesto'),
          jefeDepartamento: getVal('edit-depto'),
          jefeDepartamentoNombre: getVal('edit-depto'),
          localidad: getVal('edit-localidad'),
          turno: '',
          status: getVal('edit-status'),
          candidatos: [],
          escolaridadRequerida: getVal('edit-escolaridad'),
          experienciaRequerida: getVal('edit-experiencia'),
          fechaActualizacion: new Date().toISOString(),
          version: 1
        };
        
        await fsSet(docPath('cuadrosReemplazoBase', matricula), data);
        
        // Generar datos preprocesados inmediatamente
        const preprocesados = {
          matricula,
          jefeNombre: data.jefeNombre,
          jefePuestoDescripcion: data.jefePuestoDescripcion,
          jefeDepartamento: data.jefeDepartamento,
          jefeDepartamentoNombre: data.jefeDepartamentoNombre,
          localidad: data.localidad,
          turno: data.turno,
          status: data.status,
          candidatos: data.candidatos,
          escolaridadRequerida: data.escolaridadRequerida,
          experienciaRequerida: data.experienciaRequerida,
          version: 2,
          fechaActualizacion: new Date().toISOString(),
          generadoEn: new Date().toISOString()
        };
        
        await fsSet(docPath('cuadrosReemplazoPorUsuario', matricula), preprocesados);
        
        // Actualizar meta global
        await fsSet(docPath('cuadrosReemplazoMeta', '_global'), {
          ultimaActualizacion: new Date().toISOString(),
          version: Date.now(),
          totalProcesados: 0,
          accion: `edicion-${matricula}`,
          fecha: new Date().toISOString()
        });
        
        clearCache();
        
        resumen.style.display = 'block';
        resumen.style.background = '#f0fdf4';
        resumen.style.border = '1px solid #86efac';
        resumen.innerHTML = `
          ✅ <strong>Registro guardado y procesado</strong><br>
          Matrícula: ${matricula}<br>
          Nombre: ${nombre}<br>
          Documento preprocesado generado automáticamente<br>
          <span style="font-size:0.75rem;color:#6b7280">${new Date().toLocaleString('es-MX')}</span>
        `;
        
        showMsg('✅ Registro guardado. Datos preprocesados generados.', 'success');
      } catch(e) {
        showMsg(`❌ Error: ${e.message}`, 'error');
      }
    });
    
    // Limpiar
    document.getElementById('btn-limpiar-editar').addEventListener('click', () => {
      ['edit-matricula','edit-nombre','edit-puesto','edit-depto','edit-localidad','edit-escolaridad','edit-experiencia'].forEach(id => setVal(id, ''));
      setVal('edit-status', 'SIN_ASIGNAR');
      resumen.style.display = 'none';
    });
    
    // Eliminar
    const btnEliminar = document.getElementById('btn-eliminar-editar');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', async () => {
        const mat = getVal('edit-matricula');
        if (!mat) { showMsg('Ingresa la matrícula a eliminar', 'error'); return; }
        if (!confirm(`¿Eliminar TODOS los datos del registro ${mat}? Esta acción no se puede deshacer.`)) return;
        
        try {
          await fsDelete(docPath('cuadrosReemplazoBase', mat));
          try { await fsDelete(docPath('cuadrosReemplazoPorUsuario', mat)); } catch(e) {}
          clearCache();
          showMsg(`🗑️ Registro ${mat} eliminado`, 'success');
          ['edit-matricula','edit-nombre','edit-puesto','edit-depto','edit-localidad','edit-escolaridad','edit-experiencia'].forEach(id => setVal(id, ''));
          setVal('edit-status', 'SIN_ASIGNAR');
          resumen.style.display = 'none';
        } catch(e) {
          showMsg(`Error al eliminar: ${e.message}`, 'error');
        }
      });
    }
  }
  
  // ==================== AGREGAR ENTRADA EN MENÚ LATERAL ====================
  function addAdminMenuEntry() {
    const u = getUsuario();
    if (!u || (u.rol !== 'ADMIN' && u.rol !== 'AREA_PERSONAL')) return;
    
    // Buscar el sidebar
    const sidebar = document.querySelector('nav') || document.querySelector('[class*="sidebar"]') || document.querySelector('aside');
    if (!sidebar) return;
    if (sidebar.querySelector('[data-sicip-admin-cuadros-entry-btn]')) return;
    
    const adminBtn = Array.from(sidebar.querySelectorAll('button, a')).find(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      return t === 'admin' || t === 'administración' || t.includes('admin') || t.includes('adminstración');
    });
    if (!adminBtn) return;
    
    const container = adminBtn.closest('div') || sidebar;
    
    const entry = document.createElement('button');
    entry.setAttribute('data-sicip-admin-cuadros-entry-btn', '');
    entry.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1rem;border:none;cursor:pointer;font-size:0.88rem;font-weight:500;color:rgba(255,255,255,0.75);background:transparent;border-left:3px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;text-align:left;font-family:Inter,sans-serif;transition:all 0.12s';
    entry.innerHTML = '<span style="color:#f59e0b;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg></span><span>Gestor Cuadros</span>';
    entry.addEventListener('click', renderAdminPanel);
    entry.addEventListener('mouseenter', () => { entry.style.background = 'rgba(255,255,255,0.08)'; });
    entry.addEventListener('mouseleave', () => { entry.style.background = 'transparent'; });
    
    if (adminBtn.nextSibling) {
      container.insertBefore(entry, adminBtn.nextSibling);
    } else {
      container.appendChild(entry);
    }
    
    log('✅ Entrada agregada al menú admin');
  }
  
  // ==================== ESTILOS GLOBALES ====================
  function injectStyles() {
    if (document.querySelector('[data-sicip-cuadros-styles]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-sicip-cuadros-styles', '');
    style.textContent = `
      .sicip-spinner {
        width: 36px; height: 36px;
        border: 3px solid #c8e6c9;
        border-top-color: #005235;
        border-radius: 50%;
        animation: sicip-spin 0.8s linear infinite;
        margin: 0 auto;
      }
      @keyframes sicip-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }
  
  // ==================== INIT ====================
  function init() {
    injectStyles();
    
    // Interceptar el bundle y el componente lento
    interceptBundleFunctions();
    
    // Agregar entrada en menú admin (varios intentos por si carga tarde)
    addAdminMenuEntry();
    setTimeout(addAdminMenuEntry, 1000);
    setTimeout(addAdminMenuEntry, 3000);
    setTimeout(addAdminMenuEntry, 5000);
    setTimeout(addAdminMenuEntry, 8000);
    
    // Exponer funciones globales
    window.__SICIP_CUADROS_ADMIN = { renderAdminPanel, clearCache, engine };
    
    log(`✅ v${VERSION} cargado`);
  }
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 50);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  }
})();
