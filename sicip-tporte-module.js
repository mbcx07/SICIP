// SICIP - Módulo Tporte v1.0.0
// Buscador automático de trabajadores + formulario de trámite Tporte
(function(){
  'use strict';
  var VERSION = '1.0.0';
  var FS_PROJECT = 'sicip-bcs';
  var FS_BASE = 'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT + '/databases/(default)/documents';

  function log(msg){ console.log('[SICIP-Tporte v'+VERSION+'] ' + msg); }

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function getUsuario(){
    try { var s = sessionStorage.getItem('sicip_usuario'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }

  function getData(){ return window.__SICIP_DATA__ || {}; }

  // ════════════════ FIRESTORE REST API ════════════════
  function toFSVal(v){
    if(v===null||v===undefined) return { nullValue:null };
    if(typeof v==='string') return { stringValue:v };
    if(typeof v==='number') return Number.isInteger(v) ? { integerValue:String(v) } : { doubleValue:v };
    if(typeof v==='boolean') return { booleanValue:v };
    if(Array.isArray(v)) return { arrayValue:{ values:v.map(toFSVal) } };
    if(typeof v==='object'){ var f={}; for(var k in v) f[k]=toFSVal(v[k]); return { mapValue:{ fields:f } }; }
    return { stringValue:String(v) };
  }

  function toFSDoc(obj){ var f={}; for(var k in obj){ if(k==='_id') continue; f[k]=toFSVal(obj[k]); } return { fields:f }; }

  async function fsSet(path, obj){
    var r = await fetch(path, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(toFSDoc(obj)) });
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  }

  function docPath(coll, id){ return FS_BASE + '/' + encodeURIComponent(coll) + '/' + encodeURIComponent(String(id)); }

  // ════════════════ TOAST ════════════════
  function toast(msg, type){
    var existing = document.querySelector('.sicip-tporte-toast');
    if(existing) existing.remove();
    var colors = { success:'#10b981', error:'#ef4444', info:'#3b82f6' };
    var t = document.createElement('div');
    t.className = 'sicip-tporte-toast';
    t.innerHTML = msg;
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1f2937;color:white;padding:12px 20px;border-radius:10px;font-size:0.88rem;font-weight:600;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:Inter,sans-serif;max-width:360px;border-left:4px solid ' + (colors[type]||'#27ae60');
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity 0.3s'; }, 3000);
    setTimeout(function(){ if(t.parentNode) t.remove(); }, 3400);
  }

  // ════════════════ ESTILOS ════════════════
  function injectStyles(){
    if(document.querySelector('[data-sicip-tporte-styles]')) return;
    var s = document.createElement('style');
    s.setAttribute('data-sicip-tporte-styles', '1');
    s.textContent = ''+
      '@keyframes sicipTporteFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }'+
      '.sicip-tporte-card{background:white;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 2px 8px rgba(0,0,0,0.04);overflow:hidden}'+
      '.sicip-tporte-input{padding:0.55rem 0.75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:0.84rem;font-family:Inter,sans-serif;box-sizing:border-box;outline:none;width:100%;transition:border-color 0.15s,box-shadow 0.15s}'+
      '.sicip-tporte-input:focus{border-color:#005235;box-shadow:0 0 0 3px rgba(0,82,53,0.1)}'+
      '.sicip-tporte-select{padding:0.55rem 0.75rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:0.84rem;font-family:Inter,sans-serif;background:white;cursor:pointer;outline:none;box-sizing:border-box;width:100%}'+
      '.sicip-tporte-select:focus{border-color:#005235;box-shadow:0 0 0 3px rgba(0,82,53,0.1)}'+
      '.sicip-tporte-btn{display:inline-flex;align-items:center;gap:6px;padding:0.6rem 1.2rem;border:none;border-radius:8px;font-size:0.88rem;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:Inter,sans-serif;white-space:nowrap}'+
      '.sicip-tporte-btn:active{transform:scale(0.97)}'+
      '.sicip-tporte-btn-primary{background:#005235;color:white}'+
      '.sicip-tporte-btn-primary:hover{background:#003824;box-shadow:0 2px 8px rgba(0,82,53,0.25)}'+
      '.sicip-tporte-btn-ghost{background:transparent;color:#6b7280}'+
      '.sicip-tporte-btn-ghost:hover{background:#f3f4f6;color:#374151}'+
      '@media(max-width:640px){.sicip-tporte-grid{grid-template-columns:1fr!important}}';
    document.head.appendChild(s);
  }

  // ════════════════ ESTADO ════════════════
  var _trabajadorSel = null;

  // ════════════════ PANEL TPORTE ════════════════
  function buildTportePanel(){
    var usuario = getUsuario();
    var userName = usuario ? (usuario.nombre || 'Usuario') : 'Usuario';

    return ''+
      '<div style="padding:1rem 1.25rem;animation:sicipTporteFadeIn 0.25s ease;font-family:Inter,sans-serif">'+
        // Header
        '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">'+
          '<button class="sicip-tporte-btn sicip-tporte-btn-ghost" style="font-size:0.78rem;padding:0.3rem 0.6rem" onclick="window.__SICIP_TPORTE_CLOSE__()">← Volver</button>'+
        '</div>'+
        '<div style="margin-bottom:1.25rem">'+
          '<h2 style="margin:0;font-size:1.2rem;font-weight:800;color:#003324">🚚 Trámite Tporte</h2>'+
          '<p style="margin:0.2rem 0 0;color:#6b7280;font-size:0.82rem">Movimientos de personal — Traslados, promociones y cambios de adscripción</p>'+
        '</div>'+

        // Buscador
        '<div class="sicip-tporte-card" style="padding:1rem;margin-bottom:1rem">'+
          '<h3 style="margin:0 0 0.6rem;font-size:0.9rem;font-weight:700;color:#003324">🔎 Buscar Trabajador</h3>'+
          '<p style="margin:0 0 0.6rem;font-size:0.72rem;color:#6b7280">Busca por nombre, matrícula, categoría o adscripción</p>'+
          '<input type="text" id="sicip-tporte-buscar" class="sicip-tporte-input" '+
            'placeholder="Escribe nombre o matrícula..." ' +
            'oninput="window.__SICIP_TPORTE_BUSCAR__(this.value)" ' +
            'autocomplete="off" style="margin-bottom:0.5rem">'+
          '<div id="sicip-tporte-resultados" style="max-height:280px;overflow-y:auto">'+
            '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.82rem">🔍 Escribe para buscar trabajadores</div>'+
          '</div>'+
        '</div>'+

        // Datos del trabajador seleccionado
        '<div id="sicip-tporte-seleccionado" style="display:none;margin-bottom:1rem"></div>'+

        // Formulario
        '<div id="sicip-tporte-form-wrap" style="display:none">'+
          '<div class="sicip-tporte-card" style="padding:1rem">'+
            '<h3 style="margin:0 0 0.75rem;font-size:0.9rem;font-weight:700;color:#003324">📝 Datos del Movimiento</h3>'+
            '<div style="display:grid;gap:0.75rem">'+
              '<div>'+
                '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Tipo de movimiento</label>'+
                '<select id="sicip-tporte-tipo" class="sicip-tporte-select">'+
                  '<option value="Traslado">Traslado</option>'+
                  '<option value="Promoción">Promoción</option>'+
                  '<option value="Cambio de adscripción">Cambio de adscripción</option>'+
                '</select>'+
              '</div>'+
              '<div>'+
                '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Motivo</label>'+
                '<textarea id="sicip-tporte-motivo" class="sicip-tporte-input" rows="3" placeholder="Describe el motivo del movimiento..." style="resize:vertical;min-height:70px"></textarea>'+
              '</div>'+
              '<div>'+
                '<label style="display:block;font-size:0.78rem;font-weight:600;color:#374151;margin-bottom:0.3rem">Fecha efectiva</label>'+
                '<input type="date" id="sicip-tporte-fecha" class="sicip-tporte-input">'+
              '</div>'+
            '</div>'+
            '<div style="margin-top:1rem;display:flex;gap:0.5rem">'+
              '<button class="sicip-tporte-btn sicip-tporte-btn-primary" onclick="window.__SICIP_TPORTE_GENERAR__()" style="flex:1;justify-content:center">📋 Generar Trámite Tporte</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';
  }

  // ════════════════ BUSCADOR ════════════════
  window.__SICIP_TPORTE_BUSCAR__ = function(query){
    var resultadosDiv = document.getElementById('sicip-tporte-resultados');
    if(!resultadosDiv) return;
    if(!query || query.length < 2){
      resultadosDiv.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.82rem">🔍 Escribe al menos 2 caracteres</div>';
      return;
    }

    var q = query.toLowerCase();
    var data = getData();
    var trabajadores = (data.trabajadores || []).filter(function(t){
      var nombre = (t.nombre||'').toLowerCase();
      var mat = (t.matricula||'').toLowerCase();
      var puesto = String(t.descripcion||t.puesto||'').toLowerCase();
      var depto = String(t.departamento||t.departamentoNombre||t.adscripcion||'').toLowerCase();
      var categoria = String(t.categoria||'').toLowerCase();
      return nombre.indexOf(q)>=0 || mat.indexOf(q)>=0 || puesto.indexOf(q)>=0 || depto.indexOf(q)>=0 || categoria.indexOf(q)>=0;
    }).slice(0, 30);

    if(trabajadores.length === 0){
      resultadosDiv.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.85rem">😕 No se encontraron trabajadores con "'+esc(query)+'"</div>';
      return;
    }

    var html = '<div style="font-size:0.7rem;color:#6b7280;font-weight:600;margin-bottom:0.3rem">'+trabajadores.length+' resultado(s)</div>';
    html += '<div style="display:flex;flex-direction:column;gap:0.25rem">';

    trabajadores.forEach(function(t){
      var matricula = esc(t.matricula||'');
      var nombre = esc(t.nombre||'');
      var nombreJs = (t.nombre||'').replace(/'/g,"\\'");
      var descripcion = esc(t.descripcion||t.puesto||'');
      var departamento = esc(t.departamento||t.departamentoNombre||t.adscripcion||'');
      var categoria = esc(t.categoria||'');
      var deptoJs = (t.departamento||t.departamentoNombre||t.adscripcion||'').replace(/'/g,"\\'");
      var descJs = (t.descripcion||t.puesto||'').replace(/'/g,"\\'");
      var catJs = (t.categoria||'').replace(/'/g,"\\'");

      html += ''+
        '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0.65rem;border-radius:8px;cursor:pointer;transition:background 0.1s" '+
          'onmouseenter="this.style.background=\'#f9fafb\'" onmouseleave="this.style.background=\'transparent\'" '+
          'onclick="window.__SICIP_TPORTE_SELECCIONAR__(\''+matricula+'\',\''+nombreJs+'\',\''+deptoJs+'\',\''+descJs+'\',\''+catJs+'\')">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:600;font-size:0.84rem;color:#111827">'+nombre+'</div>'+
            '<div style="font-size:0.72rem;color:#6b7280;display:flex;flex-wrap:wrap;gap:0.2rem 0.5rem">'+
              '<span style="font-family:monospace;color:#005235">'+matricula+'</span>'+
              (categoria ? '· <span>'+categoria+'</span>' : '')+
              (descripcion ? '· <span>'+descripcion.substring(0,30)+'</span>' : '')+
              (departamento ? '· <span>'+departamento.substring(0,25)+'</span>' : '')+
            '</div>'+
          '</div>'+
          '<span style="font-size:0.7rem;color:#005235;font-weight:700">Seleccionar →</span>'+
        '</div>';
    });

    html += '</div>';
    resultadosDiv.innerHTML = html;
  };

  // ════════════════ SELECCIONAR TRABAJADOR ════════════════
  window.__SICIP_TPORTE_SELECCIONAR__ = function(matricula, nombre, departamento, descripcion, categoria){
    _trabajadorSel = { matricula:matricula, nombre:nombre, departamento:departamento, descripcion:descripcion, categoria:categoria };

    var selDiv = document.getElementById('sicip-tporte-seleccionado');
    if(!selDiv) return;
    selDiv.style.display = 'block';
    selDiv.innerHTML = ''+
      '<div class="sicip-tporte-card" style="padding:1rem;background:#f0fdf4;border-color:#a7f3d0">'+
        '<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem">'+
          '<div style="width:36px;height:36px;border-radius:50%;background:#005235;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9rem;flex-shrink:0">👤</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:700;font-size:0.9rem;color:#111827">'+esc(nombre)+'</div>'+
            '<div style="font-size:0.75rem;color:#6b7280">Matrícula: <span style="font-family:monospace;color:#005235">'+esc(matricula)+'</span></div>'+
          '</div>'+
          '<button class="sicip-tporte-btn sicip-tporte-btn-ghost" style="font-size:0.72rem;padding:0.2rem 0.5rem" onclick="window.__SICIP_TPORTE_DESELECCIONAR__()">✕ Cambiar</button>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:0.4rem;font-size:0.8rem">'+
          (departamento ? '<div><span style="color:#888">Departamento:</span> <strong>'+esc(departamento)+'</strong></div>' : '')+
          (descripcion ? '<div><span style="color:#888">Puesto:</span> <strong>'+esc(descripcion)+'</strong></div>' : '')+
          (categoria ? '<div><span style="color:#888">Categoría:</span> <strong>'+esc(categoria)+'</strong></div>' : '')+
        '</div>'+
      '</div>';

    var formWrap = document.getElementById('sicip-tporte-form-wrap');
    if(formWrap) formWrap.style.display = 'block';

    // Limpiar buscador
    var input = document.getElementById('sicip-tporte-buscar');
    if(input) input.value = '';
    var resultadosDiv = document.getElementById('sicip-tporte-resultados');
    if(resultadosDiv) resultadosDiv.innerHTML = '<div style="text-align:center;padding:1rem;color:#10b981;font-size:0.82rem;font-weight:600">✅ Trabajador seleccionado: '+esc(nombre)+'</div>';
  };

  window.__SICIP_TPORTE_DESELECCIONAR__ = function(){
    _trabajadorSel = null;
    var selDiv = document.getElementById('sicip-tporte-seleccionado');
    if(selDiv){ selDiv.style.display='none'; selDiv.innerHTML=''; }
    var formWrap = document.getElementById('sicip-tporte-form-wrap');
    if(formWrap) formWrap.style.display = 'none';
    var input = document.getElementById('sicip-tporte-buscar');
    if(input) input.focus();
  };

  // ════════════════ GENERAR TRÁMITE ════════════════
  window.__SICIP_TPORTE_GENERAR__ = function(){
    if(!_trabajadorSel){
      toast('⚠️ Selecciona un trabajador primero', 'error');
      return;
    }

    var tipoMov = document.getElementById('sicip-tporte-tipo');
    var motivo = document.getElementById('sicip-tporte-motivo');
    var fecha = document.getElementById('sicip-tporte-fecha');

    if(!tipoMov || !motivo || !fecha){
      toast('⚠️ Error: formulario no disponible', 'error');
      return;
    }

    var tipoVal = tipoMov.value || '';
    var motivoVal = motivo.value.trim() || '';
    var fechaVal = fecha.value || '';

    if(!motivoVal){
      toast('⚠️ El motivo es obligatorio', 'error');
      motivo.focus();
      return;
    }
    if(!fechaVal){
      toast('⚠️ La fecha efectiva es obligatoria', 'error');
      fecha.focus();
      return;
    }

    var usuario = getUsuario();
    var tramiteId = 'tporte_' + _trabajadorSel.matricula + '_' + Date.now();

    var dataToSave = {
      tramiteId: tramiteId,
      trabajadorMatricula: _trabajadorSel.matricula,
      trabajadorNombre: _trabajadorSel.nombre,
      trabajadorDepartamento: _trabajadorSel.departamento || '',
      trabajadorPuesto: _trabajadorSel.descripcion || '',
      trabajadorCategoria: _trabajadorSel.categoria || '',
      tipoMovimiento: tipoVal,
      motivo: motivoVal,
      fechaEfectiva: fechaVal,
      solicitadoPor: usuario ? (usuario.nombre || '') : '',
      solicitadoPorMatricula: usuario ? (usuario.matricula || '') : '',
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString(),
      version: Date.now()
    };

    var btn = document.querySelector('[onclick="window.__SICIP_TPORTE_GENERAR__()"]');
    if(btn){ btn.disabled = true; btn.innerHTML = '⏳ Guardando...'; btn.style.opacity = '0.7'; }

    var path = docPath('tramitesTporte', tramiteId);

    fsSet(path, dataToSave).then(function(){
      log('✅ Trámite Tporte guardado: ' + tramiteId);
      toast('✅ Trámite Tporte generado exitosamente', 'success');

      // Limpiar formulario
      _trabajadorSel = null;
      if(motivo) motivo.value = '';
      if(fecha) fecha.value = '';
      if(tipoMov) tipoMov.value = 'Traslado';

      var selDiv = document.getElementById('sicip-tporte-seleccionado');
      if(selDiv){ selDiv.style.display='none'; selDiv.innerHTML=''; }
      var formWrap = document.getElementById('sicip-tporte-form-wrap');
      if(formWrap) formWrap.style.display = 'none';

      if(btn){ btn.disabled = false; btn.innerHTML = '📋 Generar Trámite Tporte'; btn.style.opacity = '1'; }
    }).catch(function(err){
      log('❌ Error guardando trámite: ' + err.message);
      toast('❌ Error al generar trámite: ' + err.message, 'error');
      if(btn){ btn.disabled = false; btn.innerHTML = '📋 Generar Trámite Tporte'; btn.style.opacity = '1'; }
    });
  };

  // ════════════════ CLOSE ════════════════
  window.__SICIP_TPORTE_CLOSE__ = function(){
    if(window.SICIPModuleHost) window.SICIPModuleHost.showReact();
  };

  // ════════════════ SHOW ════════════════
  function show(button){
    injectStyles();
    var panel = document.createElement('div');
    panel.setAttribute('data-sicip-tporte', '1');
    panel.innerHTML = buildTportePanel();
    if(window.SICIPModuleHost) window.SICIPModuleHost.mount(panel, button);
    log('Panel Tporte mostrado');
  }

  window.SICIPTporte = { version: VERSION, show: show };

  log('v' + VERSION + ' cargado');
})();