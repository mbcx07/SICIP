from pathlib import Path
import sys
out=Path(sys.argv[1]);p=out/'sicip-cuadros-v2.js';s=p.read_text()
needle='  function refreshPostulaciones(matricula,scope){'
assert needle in s
helper='''  function montarPerfilActual(matricula,scope){
    if(!scope)return;var anchor=scope.querySelector('[data-cuadro-perfil-host]');if(!anchor){anchor=document.createElement('section');anchor.dataset.cuadroPerfilHost='';var inner=scope.matches('[data-sicip-asignacion]')?scope.firstElementChild:scope.firstElementChild||scope;inner.appendChild(anchor);}
    import('/sicip-central/cuadro-perfil-client.mjs').then(function(mod){mod.montarPerfilCuadro(anchor,matricula,{onChange:function(c){if(!c)return;if(_asigState&&String(_asigState.matricula)===String(matricula)){_asigState.escolaridad=c.escolaridadRequerida||'';_asigState.experiencia=c.experienciaRequerida||'';}var cr=(getData().cuadros||[]).find(function(x){return String(x.jefeMatricula||x.id)===String(matricula);});if(cr){cr.escolaridadRequerida=c.escolaridadRequerida||'';cr.experienciaRequerida=c.experienciaRequerida||'';}}});}).catch(function(e){anchor.textContent='No se pudo consultar el perfil: '+e.message;});
  }
'''
s=s.replace(needle,helper+needle+'\n    montarPerfilActual(matricula,scope);',1)
# Candidate reordering rebuilds the content: remount profile without touching candidates.
needle='  // ════════════════ GUARDAR EN FIRESTORE'
i=s.index(needle);prior=s[:i];pos=prior.rfind('  }\n');assert pos>=0
prior=prior[:pos]+"    if(_asigState)montarPerfilActual(_asigState.matricula,document.querySelector('[data-sicip-asignacion]')||document.querySelector('[data-sicip-cr-panel]'));\n"+prior[pos:];s=prior+s[i:]
p.write_text(s)
