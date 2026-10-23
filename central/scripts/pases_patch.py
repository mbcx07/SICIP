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
