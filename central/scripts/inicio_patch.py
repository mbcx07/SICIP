from pathlib import Path
import sys
out=Path(sys.argv[1])
p=out/'sicip-workflows-v524.js';s=p.read_text().replace('  async function renderHomeEnhancements(){','  async function renderHomeEnhancements(){return;').replace('  function photoPrompt(){','  function photoPrompt(){return;')
old="var list=loadFaltas();list.push(rec);saveFaltas(list);fsCreate('faltasInjustificadas',rec).catch(function(){});"
assert old in s;s=s.replace(old,"try{await window.SICIPCentral.api('/api/personal/incidencias',{method:'POST',body:JSON.stringify(rec)});}catch(error){toast('No se guardó la falta: '+error.message);return;}")
s=s.replace('    function renderReview(m,from){','    async function renderReview(m,from){var central;try{central=await window.SICIPCentral.api(\'/api/personal/incidencias?matricula=\'+encodeURIComponent(m));}catch(error){toast(error.message);return;}')
s=s.replace("var t=reviewSelected||selected||{}, list=loadFaltas().filter", "var t=reviewSelected||selected||{}, list=central.incidencias.filter")
s=s.replace("last30Faltas(loadFaltas(),m,from);var st=periodStats(loadFaltas(),'fecha',m)","last30Faltas(central.incidencias,m,from);var st=periodStats(central.incidencias,'fecha',m)")
s=s.replace("var faltas=loadFaltas().filter(function(f){return String(f.matricula)===String(m)});","var faltas=[];try{faltas=(await window.SICIPCentral.api('/api/personal/incidencias?matricula='+encodeURIComponent(m))).incidencias;}catch(error){toast('No se pudieron actualizar las faltas: '+error.message);}",1)
s=s.replace('function today(){return new Date().toISOString().slice(0,10)}',"function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mazatlan',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}")
s=s.replace("<span>Vida laboral</span>","<span>Total disponible</span>")
s=s.replace("esc(f.registradoPorNombre||f.registradoPor||'')", "esc(f.origen||f.registradoPorNombre||f.registradoPor||'')")
# Append the central quincenal summary after rendering the existing review.
anchor="    }\n    $('sf-review').onclick="
s=s.replace(anchor,"      $('sf-result').insertAdjacentHTML('beforeend','<h3>Faltas por quincena</h3><table class=\"sicip-flow-table\"><thead><tr><th>Quincena</th><th>Faltas</th></tr></thead><tbody>'+(central.quincenas||[]).map(function(q){return '<tr><td>'+esc(q.quincena.slice(-2)+'/'+q.quincena.slice(0,4))+'</td><td>'+q.faltas+'</td></tr>'}).join('')+'</tbody></table><p>Las faltas de las incidencias diarias y capturas manuales se cuentan una vez por matrícula y fecha. La consulta sólo refleja las fuentes disponibles.</p>'+(central.pendientes_nomina?'<p>Hay '+central.pendientes_nomina+' movimientos de faltas con estado de origen por confirmar, separados de los totales V.</p>':'')+(central.avisos||[]).map(function(a){return '<p>'+esc(a)+'</p>'}).join(''));\n    }\n    $('sf-review').onclick=")
p.write_text(s)
p=out/'pases/index.html';s=p.read_text()
for name,next_name,body in [('checkQuincenaReward','renderRewards','return;'),('renderRewards','renderTable',"var box=$('rewardsBox');if(box)box.innerHTML='<p>Aura Laboral ahora se calcula en el servidor con tus registros de SICIP.</p><a href=\"/\" target=\"_top\">Consultar mi avance en Inicio →</a>';")]:
 a=s.index('function '+name+'(');b=s.index('function '+next_name+'(',a);s=s[:a]+'function '+name+'(){'+body+'}  '+s[b:]
s=s.replace('function today(){return new Date().toISOString().slice(0,10)}',"function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mazatlan',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}")
p.write_text(s)
