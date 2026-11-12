from pathlib import Path
import sys
out=Path(sys.argv[1]);p=out/'pases/index.html';s=p.read_text()
def change(old,new):
 global s
 assert old in s,old[:100]
 s=s.replace(old,new,1)
change('</head>','<link rel="stylesheet" href="/sicip-central/pases-print.css?v=20261023-pases3"><script src="/sicip-central/vendor/qrcode.js"></script></head>')
for field in ['tipoAsunto','tipoHorario','manualTipoAsunto','manualTipoHorario']:
 import re
 pattern=r'(<select id="'+field+r'"[^>]*)(>)(<option[^>]*>)'
 s,n=re.subn(pattern,lambda m:m[1]+' required'+m[2]+'<option value="" selected disabled>Selecciona una opción</option>'+m[3],s,count=1);assert n==1,field
change('<input id="fecha" aria-label="Fecha del pase" type="date" required>','<input id="fecha" aria-label="Fecha del pase" type="date" required aria-describedby="pase-fecha-aviso"><small id="pase-fecha-aviso" class="hint">Los pases no pueden solicitarse con fecha retroactiva.</small>')
change('Objeto automático: No regresar.','Selecciona el tipo de horario para determinar el objeto del pase.')
change("return h==='ENTRADA'?'No regresar'", "return !h?'':h==='ENTRADA'?'No regresar'")
change("function folio(){return window.SICIPPasesStorage.newFolio('PASE')}","async function folio(){var form=$('passForm');if(!form.dataset.folioRequest)form.dataset.folioRequest=crypto.randomUUID();return(await window.SICIPCentral.api('/api/pases/folio',{method:'POST',body:JSON.stringify({request_id:form.dataset.folioRequest})})).folio}")
# Keep old stored folios unchanged; manual registrations get the same globally unique sequence.
change("function manualFolio(){return window.SICIPPasesStorage.newFolio('PMAN')}","async function manualFolio(){var form=$('manualForm');if(!form.dataset.folioRequest)form.dataset.folioRequest=crypto.randomUUID();return(await window.SICIPCentral.api('/api/pases/folio',{method:'POST',body:JSON.stringify({request_id:form.dataset.folioRequest})})).folio}")
change('function createManual(received){','async function createManual(received){if(!$(\'manualForm\').reportValidity())return null;')
change('folio:manualFolio(),','folio:await manualFolio(),')
change("$('manualForm').addEventListener('submit',function(e){e.preventDefault();var p=createManual(false);", "$('manualForm').addEventListener('submit',async function(e){e.preventDefault();if(this.dataset.sending)return;this.dataset.sending='1';try{var p=await createManual(false);")
change("this.reset();$('manualFecha').value=today();lastManualWorker=null;$('manualWorkerBox').textContent='Capture matrícula o busque al trabajador.';}});", "this.reset();delete this.dataset.folioRequest;$('manualFecha').value=today();lastManualWorker=null;$('manualWorkerBox').textContent='Capture matrícula o busque al trabajador.';}}catch(error){alert('No se pudo registrar el pase: '+error.message);}finally{delete this.dataset.sending;}});")
change("$('receiveManualBtn').onclick=function(){var p=createManual(true);", "$('receiveManualBtn').onclick=async function(){if(this.disabled||$('manualForm').dataset.sending)return;$('manualForm').dataset.sending='1';this.disabled=true;try{var p=await createManual(true);")
change("$('manualForm').reset();$('manualFecha').value=today();lastManualWorker=null;$('manualWorkerBox').textContent='Capture matrícula o busque al trabajador.';}};", "$('manualForm').reset();delete $('manualForm').dataset.folioRequest;$('manualFecha').value=today();lastManualWorker=null;$('manualWorkerBox').textContent='Capture matrícula o busque al trabajador.';}}catch(error){alert('No se pudo registrar el pase: '+error.message);}finally{delete $('manualForm').dataset.sending;this.disabled=false;}};")
change("$('passForm').addEventListener('submit',function(e){e.preventDefault();", "$('passForm').addEventListener('submit',async function(e){e.preventDefault();if(!this.reportValidity()||this.dataset.sending)return;if(!$('tipoAsunto').value||!$('tipoHorario').value){alert('Selecciona el tipo de asunto y de horario.');return;}var submit=this.querySelector('[type=submit]');this.dataset.sending='1';submit.disabled=true;try{")
change('folio:folio(),','folio:await folio(),')
change("this.reset();setMinDate();applySavedPrefs()});", "delete this.dataset.folioRequest;this.reset();setMinDate();applySavedPrefs();$('objectHint').textContent='Selecciona el tipo de horario para determinar el objeto del pase.';}catch(error){alert('No se pudo generar el pase: '+error.message+'. Puedes reintentar sin perder la captura.');}finally{delete this.dataset.sending;submit.disabled=false;}});")
a=s.index('function qrUrl(');b=s.index('  function waitPrintAssets',a);s=s[:a]+"function qrUrl(p){var code=window.qrcode(0,'M');code.addData(JSON.stringify({folio:p.folio,token:p.qrToken,matricula:p.matricula,fecha:p.fecha}));code.make();return code.createDataURL(4,8)}"+s[b:]
change("waitPrintAssets().then(function(){setTimeout(function(){window.print()},120)})", "$('printArea').querySelectorAll('[class]').forEach(function(node){Array.from(node.classList).forEach(function(c){if(c==='passSheetV515')node.classList.replace(c,'pass-document');else if(c.startsWith('p515'))node.classList.replace(c,c.replace('p515','pass-'));});});waitPrintAssets().then(function(){setTimeout(function(){window.print()},120)})")
# Correct stack normalization, which previously overflowed when all three types had passes.
change('function stackBar(c,max){max=Math.max(max,1);','function stackBar(c,max){max=Math.max(c.total,1);')
p.write_text(s)
# Use vector icons rather than font glyphs that some print drivers omit.
s=p.read_text()
old="waitPrintAssets().then(function(){setTimeout(function(){window.print()},120)})"
new="""$('printArea').querySelectorAll('.pass-IndIcon').forEach(function(node,index){var paths=['M4 17L17 4M6 4h11v11','M3 17V3M3 17h15M6 13l4-5 3 2 5-7','M4 4l13 13M6 17h11V6','M4 17V9M10 17V4M16 17v-7'];node.innerHTML='<svg viewBox="0 0 22 22" aria-hidden="true"><path d="'+paths[index%4]+'"/></svg>';});waitPrintAssets().then(function(){setTimeout(function(){window.print()},120)})"""
assert old in s;s=s.replace(old,new,1);p.write_text(s)
# Manual lookup also accepts just the numeric part of the short folio.
p=out/'sicip-recepciones-module.js';s=p.read_text();old='    searchByFolio(input.value.trim());';assert old in s;s=s.replace(old,"    var folio=input.value.trim();if(/^(?:P[- ]?)?\\d{1,12}$/i.test(folio))folio='P-'+folio.replace(/^P[- ]?/i,'').padStart(6,'0');\n    searchByFolio(folio);",1);p.write_text(s)

# Central registration and compact aliases also apply when reprinting legacy passes.
p=out/'pases/index.html';s=p.read_text().replace('</head>','<script src="/sicip-central/pases-sync.js?v=20261023-tracking1"></script></head>')
s=s.replace('if(p)printDoc(p)', 'if(p)return printDoc(p)')
s=s.replace('esc(p.folio)', 'esc(p.folioCorto||p.folio)')
s=s.replace('function printDoc(p){',"async function printDoc(p){try{var saved=await window.SICIPPasesSync.sync(p);window.SICIPPasesStorage.write(window.SICIPPasesStorage.read().map(function(row){return row.folio===p.folio?Object.assign({},row,{folioCorto:saved.folioCorto}):row}));p=Object.assign({},p,saved,{folio:saved.folioCorto});[['nombre','matricula'],['jefeNombre','jefeMatricula'],['personalNombre','personalMatricula']].forEach(function(pair){p[pair[0]]=window.SICIPNombrePersona(p[pair[1]],p[pair[0]]);});}catch(error){alert('No se pudo obtener el folio corto: '+error.message);return;}")
s=s.replace('var a=loadPasses();a.push(p);savePasses(a);', 'p=await window.SICIPPasesSync.sync(p,{update:true});var a=loadPasses();a.push(p);savePasses(a);')
s=s.replace("return code.createDataURL(4,8)","return code.createDataURL(4,16)").replace("JSON.stringify({folio:p.folio,token:p.qrToken,matricula:p.matricula,fecha:p.fecha})","JSON.stringify({folio:p.folio})")
s=s.replace(".then(function(d){NOMINA=d||[];", ".then(async function(d){NOMINA=d||[];passBootReady=NOMINA.length>0;try{await window.SICIPPasesSync.refresh();}catch(error){var note=document.createElement('p');note.className='alert red';note.textContent='No se pudo actualizar el historial central; se conserva la copia de este navegador.';document.querySelector('.wrap').prepend(note);}")

s=s.replace("receive:function(f){", "receive:async function(f){").replace("if(found){savePasses(a);rewardManualDelivery(found);", "if(found){try{await window.SICIPPasesSync.sync(found,{update:true});}catch(error){alert(error.message);return;}savePasses(a);rewardManualDelivery(found);")
s=s.replace("cancel:function(f){", "cancel:async function(f){").replace("savePasses(a);renderTable()}};", "var changed=a.find(function(p){return p.folio===f});try{await window.SICIPPasesSync.sync(changed,{update:true});}catch(error){alert(error.message);return;}savePasses(a);renderTable()}};")
s=s.replace("  window.SICIPCentralBoot.then(function(){return window.SICIPCentral.collection('trabajadores')})", "  var passBootReady=false,bootControls=Array.from(document.querySelectorAll('#passForm input,#passForm select,#passForm button,#manualForm input,#manualForm select,#manualForm button'));bootControls.forEach(function(e){e.disabled=true});setMinDate();window.SICIPCentralBoot.then(function(){return window.SICIPCentral.collection('trabajadores')})")
s=s.replace(".finally(function(){applyMode();", ".finally(function(){if(NOMINA.length)passBootReady=true;if(passBootReady)bootControls.forEach(function(e){e.disabled=false});applyMode();")
p.write_text(s)
# Resolve short aliases on a different device before trying the legacy sources.
p=out/'sicip-recepciones-module.js';s=p.read_text();key='    var pendingTramites = [];';s=s.replace(key,key+"\n    try{var pass=await window.SICIPCentral.api('/api/pases/registros?folio='+encodeURIComponent(folio));Object.assign(foundData,pass,{folio:folio,origen:'pases-central'});}catch(error){if(error.status!==404){if(resultDiv)resultDiv.innerHTML='<p>No se pudo consultar el servidor. Reintenta antes de recibir.</p>';return;}}",1)
# The existing Firestore receipt remains the record of the document; update centralized tracking after success.
s=s.replace("fsCreate('recepcionesDocumentos', dataToSave).then(function() {", "fsCreate('recepcionesDocumentos', dataToSave).then(async function() {try{if(dataToSave.folioReferencia)await window.SICIPCentral.api('/api/seguimiento/recepcion',{method:'POST',body:JSON.stringify({folio:dataToSave.folioReferencia,matricula:dataToSave.trabajadorMatricula})});}catch(e){toast('El documento se guardó; no se pudo actualizar el seguimiento del folio. Reintenta.','error');}")
s=s.replace("await fsCreate('recepcionesDocumentos', recepcionData);", "await fsCreate('recepcionesDocumentos', recepcionData);await window.SICIPCentral.api('/api/seguimiento/recepcion',{method:'POST',body:JSON.stringify({folio:recepcionData.folioReferencia,matricula:recepcionData.trabajadorMatricula})});")
p.write_text(s)

p=out/'sicip-pases-storage.js';s=p.read_text().replace('El historial se guarda en este navegador. Descarga un respaldo para conservarlo o llevarlo a otro equipo.', 'Los pases nuevos se sincronizan con el servidor. El respaldo conserva también los registros anteriores de este navegador.');p.write_text(s)

# Central folios use the same authenticated receipt path for manual capture and camera QR.
p=out/'sicip-recepciones-module.js';s=p.read_text();needle='    var foundData = qrData || { folio: folio };';assert needle in s;s=s.replace(needle,"    if(window.SICIPRecepcion&&await window.SICIPRecepcion.buscar(folio,resultDiv))return;\n"+needle,1);p.write_text(s)

# Acknowledgments for documents entered without a central QR also notify the employee.
p=out/'sicip-recepciones-module.js';s=p.read_text();s=s.replace("fsCreate('recepcionesDocumentos', dataToSave).then(async function() {", "fsCreate('recepcionesDocumentos', dataToSave).then(async function(savedDocument) {try{await window.SICIPCentral.api('/api/seguimiento/documentos',{method:'POST',body:JSON.stringify({id:savedDocument.id||savedDocument.name?.split('/').pop(),matricula:dataToSave.trabajadorMatricula,tipo:dataToSave.tipo,folio:dataToSave.folioReferencia})});}catch(e){toast('La recepción se guardó, pero su aviso está pendiente. '+e.message,'error');}",1);p.write_text(s)

# Keep each worker's official unit independent from their service/department.
p=out/'pases/index.html';s=p.read_text()
s=s.replace('HOSPITAL GENERAL DE ZONA + MEDICINA FAMILIAR No. 1</div>', "'+esc(p.unidad_nombre||'')+'</div>")
s=s.replace('<div class="p515Folio"><b>Folio</b><img', '<div class="p515Folio"><img')
s=s.replace("<span>'+esc(p.folioCorto||p.folio)+'</span></div></div><div class=\"p515Body\">", "<span>Folio: '+esc(p.folioCorto||p.folio)+'</span></div></div><div class=\"p515Body\">")
s=s.replace("var st=statsFull(p),s=statsFor(p.matricula),f=fechaLarga(p.fecha)", "var st;try{st=await window.SICIPCentral.api('/api/pases/estadisticas?folio='+encodeURIComponent(p.folio));}catch(error){alert('No se pudo actualizar la estadística del pase: '+error.message);return;}var s=st.month,f=fechaLarga(p.fecha)")
s=s.replace("var totals=st.months.map(function(x){return x.total})", "var totals=st.months.slice(0,st.mes).map(function(x){return x.total})")
s=s.replace("Math.round(a.total/12)", "st.promedio.toFixed(1)")
s=s.replace('Math.min.apply(null,totals.concat([0]))','Math.min.apply(null,totals.length?totals:[0])')
s=s.replace("<b>+0.0%</b>ACTUAL", "<b>'+(st.tendencia===null?'SIN BASE':(st.tendencia>0?'+':'')+st.tendencia.toFixed(1)+'%')+'</b>MES SOLICITADO")
s=s.replace('Estadística calculada con base en los pases registrados en SICIP correspondientes al trabajador durante el periodo consultado.', 'Estadística del trabajador: acumulado hasta el mes solicitado. Promedio = particulares / meses transcurridos. Tendencia = variación del total contra el mes anterior; sin base cuando el anterior es cero.')
p.write_text(s)

p=out/'sicip-recepciones-module.js';s=p.read_text();old="      if (!docs || docs.length === 0) {\n        listaDiv.innerHTML";assert old in s;s=s.replace(old,"      docs=await window.SICIPCentral.filtrarDocumentos(docs||[]);\n"+old,1);p.write_text(s)

p=out/'pases/index.html';s=p.read_text();s=s.replace('function loadPasses(){return window.SICIPPasesStorage.read()}',"function loadPasses(){var user=window.SICIPCentral?.user;if(!user||!window.SICIPPasesVisibles)return [];var personal=IS_PERSONAL&&['ADMIN','ADMINISTRADOR','AREA_PERSONAL','FUERZA_TRABAJO'].includes(user.rol);return window.SICIPPasesStorage.read().filter(p=>window.SICIPPasesVisibles.has(p.folio)&&(personal||String(p.matricula)===String(user.matricula)))}");s=s.replace('function savePasses(a){window.SICIPPasesStorage.write(a)}','function savePasses(a){var all=new Map(window.SICIPPasesStorage.read().map(p=>[p.folio,p]));a.forEach(p=>all.set(p.folio,p));window.SICIPPasesStorage.write(Array.from(all.values()))}');p.write_text(s)

p=out/'sicip-recepciones-module.js';s=p.read_text().replace("  // ════════════════ LISTA DE RECEPCIONES RECIENTES", "  window.addEventListener('sicip:unidades-cambiadas',()=>{if(document.querySelector('[data-sicip-recepciones-panel]'))cargarRecepcionesRecientes();});\n  // ════════════════ LISTA DE RECEPCIONES RECIENTES",1);p.write_text(s)
