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
p.write_text(s)
p=out/'pases/index.html';s=p.read_text()
for name,next_name,body in [('checkQuincenaReward','renderRewards','return;'),('renderRewards','renderTable',"var box=$('rewardsBox');if(box)box.innerHTML='<p>Aura Laboral ahora se calcula en el servidor con tus registros de SICIP.</p><a href=\"/\" target=\"_top\">Consultar mi avance en Inicio →</a>';")]:
 a=s.index('function '+name+'(');b=s.index('function '+next_name+'(',a);s=s[:a]+'function '+name+'(){'+body+'}  '+s[b:]
s=s.replace('function today(){return new Date().toISOString().slice(0,10)}',"function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mazatlan',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}")
p.write_text(s)
