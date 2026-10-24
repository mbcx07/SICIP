"""Targeted repairs on the documented legacy baseline; fail if anchors drift."""
from pathlib import Path
import sys,re
out=Path(sys.argv[1])
def change(file,old,new,count=1):
 p=out/file;s=p.read_text();assert old in s,(file,old[:100]);p.write_text(s.replace(old,new,count))
change('sicip-cuadros-v2.js',"modalContent.innerHTML = buildAsignacionPanel(_asigState.matricula, _asigState.nombreJefe);","var query=document.getElementById('sicip-buscar-input')?.value||'';\n    modalContent.innerHTML = renderAsignacionHTML();\n    var restored=document.getElementById('sicip-buscar-input');if(restored)restored.value=query;")
# The old design observer guessed multiple active entries and overwrote the host's choice.
p=out/'sicip-pro-design.js';s=p.read_text();start=s.index('  function fixSidebar()');end=s.index('\n  function run()',start);s=s[:start]+'  function fixSidebar() { /* Selection is owned by the host and layout controller. */ }\n'+s[end:];s=s.replace('main *,[role="main"] *{max-width:100vw!important;overflow-x:hidden!important}','main,[role="main"]{max-width:100vw!important}');p.write_text(s)
# The camera was explicitly disabled by both document response headers.
p=out/'_headers';p.write_text(p.read_text().replace('camera=()','camera=(self)'))
change('sicip-recepciones-module.js',"https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js","/sicip-central/vendor/jsQR.js")
change('sicip-recepciones-module.js',"      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function(stream) {","      if(!navigator.mediaDevices?.getUserMedia){toast('La cámara requiere HTTPS y un navegador compatible. Puedes capturar el folio manualmente.','error');overlay.remove();return;}\n      _qrScanning=true;\n      navigator.mediaDevices.getUserMedia({ video: { facingMode: {ideal:'environment'} }, audio:false }).then(async function(stream) {\n        if(!overlay.isConnected||!_qrScanning){stream.getTracks().forEach(function(t){t.stop();});return;}")
change('sicip-recepciones-module.js','        video.play();','        await video.play();')
change('sicip-recepciones-module.js',"        toast('No se pudo acceder a la camara: ' + err.message, 'error');","        window.__SICIP_RECEP_QR_CANCEL__();\n        toast(err.name==='NotAllowedError'?'Permite el acceso a la cámara en la configuración del navegador. También puedes capturar el folio manualmente.':'No se pudo abrir la cámara. Revisa que esté conectada y que otra aplicación no la esté usando.','error');")
change('sicip-recepciones-module.js',"{ inversionAttempts: 'dontInvert' }","{ inversionAttempts: 'attemptBoth' }")
# Same-origin iframe grows with its document instead of imposing a second, clipped scroll area.
change('sicip-pases-module.js',"if(host())host().mount(v,btn);else main().appendChild(v)","if(host())host().mount(v,btn);else main().appendChild(v);var frame=v.querySelector('iframe');frame.onload=function(){try{var doc=frame.contentDocument;doc.documentElement.style.overflowY='hidden';var resize=function(){frame.style.height=Math.max(600,doc.body.scrollHeight,doc.documentElement.scrollHeight)+'px';};new ResizeObserver(resize).observe(doc.body);resize();}catch(e){frame.style.height='1200px';}}")
change('sicip-panels-v5.js',"{ id: 'JEFE_SERVICIO', nombre: 'Jefe de Servicio', modulos: ['solicitudes','cuadros','recepciones','reportes'] }","{ id: 'JEFE_SERVICIO', nombre: 'Jefe de Servicio', modulos: ['solicitudes','contrato','cuadros','recepciones','reportes'] }")
# Add style after legacy style injectors, whose !important input padding overlapped search icons.
p=out/'index.html';s=p.read_text().replace('</body>','<script src="/sicip-central/pases-sync.js?v=20261024-madrereal1"></script><script src="/sicip-central/names-display.js?v=20261024-madrereal1"></script><link rel="stylesheet" href="/sicip-central/contratacion.css?v=20261024-madrereal1"><link rel="stylesheet" href="/sicip-central/layout.css?v=20261024-madrereal1"><script src="/sicip-central/layout.js?v=20261024-madrereal1"></script></body>');p.write_text(s)

change('sicip-cuadros-v2.js',"return /^https?:\\/\\//i.test(value) ? value : '';", "return /^https?:\\/\\//i.test(value)||/^\\/api\\/curriculums\\/[a-f0-9-]{36}$/.test(value) ? value : '';")
change('sicip-cuadros-v2.js','buildPostulacionesHTML(matricula)+','buildPostulacionesHTML(s.matricula)+')
# Keep operational caches revalidated when deploying changes to the same URLs.
p=out/'_headers';p.write_text(p.read_text()+'\n/sicip-central/*\n  Cache-Control: no-cache\n')
change('sicip-recepciones-module.js',"    return /\\/recepciones/.test(location.pathname) || /\\/recepciones/.test(location.hash);", "    if(document.querySelector('#sicip-pases-view,#sicip-herramientas-view,[data-sicip-cr-panel],[data-sicip-module-panel]:not([data-sicip-recepciones-panel])'))return false;\n    return /\\/recepciones/.test(location.pathname) || /\\/recepciones/.test(location.hash);")
change('sicip-recepciones-module.js',"    _mounted = false;\n    removePanel();\n    showReactContent();", "    _mounted = false;\n    if(document.querySelector('[data-sicip-recepciones-panel]')){removePanel();showReactContent();}")
p=out/'sicip-cuadros-v2.js';s=p.read_text();start=s.index('  function _rerenderAsignacion()');end=s.index('  // ════════════════ GUARDAR',start)
s=s[:start]+'''  function _rerenderAsignacion() {
    if(!_asigState)return;
    var modal=document.querySelector('[data-sicip-asignacion]'),query;
    if(modal){query=document.getElementById('sicip-buscar-input')?.value||'';modal.firstElementChild.innerHTML=renderAsignacionHTML();var field=document.getElementById('sicip-buscar-input');if(field)field.value=query;if(query)window.__SICIP_BUSCAR_TRABAJADOR__(query);}
    else {var panel=document.querySelector('[data-sicip-cr-panel]');if(!panel)return;query=document.getElementById('sicip-buscar-input-mi')?.value||'';var u=getUsuario()||{},count=_asigState.candidatos.length,status=count===3?'COMPLETO':count?'PARCIAL':'SIN_ASIGNAR';panel.innerHTML=renderMiCuadroHTML(_asigState.matricula,_asigState.nombreJefe,u.departamentoNombre||'',u.puesto||u.descripcion||'',status,getStatusInfo(status));var field=document.getElementById('sicip-buscar-input-mi');if(field)field.value=query;if(query)window.__SICIP_BUSCAR_MI_CUADRO__(query);}
  }

'''+s[end:]
s=s.replace('buildPostulacionesHTML(s.matricula)+',"'<div data-current-postulaciones>'+buildPostulacionesHTML(s.matricula)+'</div>'+",1)
# Remaining call belongs to Mi Cuadro, with its parameter in scope.
s=s.replace('buildPostulacionesHTML(matricula)+',"'<div data-current-postulaciones>'+buildPostulacionesHTML(matricula)+'</div>'+",1)
helper='''  function refreshPostulaciones(matricula,scope){
    window.SICIPCentral.api('/api/postulaciones/recibidas?jefe='+encodeURIComponent(matricula)).then(function(rows){var data=getData();data.postulaciones=(data.postulaciones||[]).filter(function(p){return String(p.cuadroId)!==String(matricula);}).concat(rows);if(scope?.isConnected){var target=scope.querySelector('[data-current-postulaciones]');if(target)target.innerHTML=buildPostulacionesHTML(matricula);}}).catch(function(){if(scope?.isConnected){var target=scope.querySelector('[data-current-postulaciones]');if(target)target.insertAdjacentHTML('beforeend','<p role="status">No se pudieron actualizar las solicitudes recibidas. Vuelve a abrir el cuadro para reintentar.</p>');}});
  }
'''
s=s.replace('  function showMiCuadro(button) {',helper+'  function showMiCuadro(button) {')
s=s.replace('    container.appendChild(asignacionDiv);','    container.appendChild(asignacionDiv);\n    refreshPostulaciones(matricula,asignacionDiv);')
s=s.replace("    if (window.SICIPModuleHost && button) window.SICIPModuleHost.activate(button);\n  }\n\n  function showResumenPublic", "    if (window.SICIPModuleHost && button) window.SICIPModuleHost.activate(button);\n    refreshPostulaciones(getUsuario().matricula,document.querySelector('[data-sicip-cr-panel]'));\n  }\n\n  function showResumenPublic")
p.write_text(s)
# Embedded Administration content belongs to React and survives temporary custom modules.
change('sicip-module-host.js',"    document.querySelectorAll(CUSTOM_SELECTOR).forEach(function (node) {\n      node.remove();\n    });", "    document.querySelectorAll(CUSTOM_SELECTOR).forEach(function (node) {\n      if(!node.hasAttribute('data-central-embedded'))node.remove();\n    });")

# Reports navigation was retired; keep the legacy route without adding a second statistics menu.
p=out/'sicip-workflows-v524.js';s=p.read_text();a=s.index('  function injectReportesNav(){');b=s.index('  function hideStandaloneNotifications()',a);s=s[:a]+'  function injectReportesNav(){}\n'+s[b:];s=s.replace("esc(u.nombre||'Usuario SICIP')","esc(window.SICIPNombre(u.nombre||'Usuario SICIP'))");p.write_text(s)
