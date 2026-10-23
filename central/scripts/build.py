from pathlib import Path
import shutil,re,subprocess,argparse
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--base',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
assert a.base.resolve()!=a.out.resolve()
if a.out.exists():raise SystemExit('El destino existe; usa otro directorio para conservar la versión anterior.')
shutil.copytree(a.base,a.out)
public=a.out/'sicip-central';shutil.copytree(ROOT/'public',public)
if (ROOT/'public/examenes').exists():
 shutil.copytree(ROOT/'public/examenes',a.out/'examenes')
 shutil.rmtree(public/'examenes')
 (a.out/'examenes/tailwind.input.css').unlink(missing_ok=True)
for name in ['client.mjs','domain.mjs','bootstrap.js','normalize-worker.js']:shutil.copy2(ROOT/'src'/name,public/name)
subprocess.run(['node',str(ROOT/'scripts/patch-bundle.mjs'),str(a.out/'assets/index-C_U711P-.js')],check=True)
for html in [a.out/'index.html',a.out/'pases/index.html',a.out/'fuerza-trabajo/calculadora-nivelacion.html']:
 s=html.read_text();tag='<script src="/sicip-central/bootstrap.js?v=20261023-login1"></script><link rel="stylesheet" href="/sicip-central/central.css?v=20261023-login1">'
 s=s.replace('<head>','<head>'+tag,1) if '<head>' in s else s.replace('<head\n','<head\n'+tag,1)
 s=re.sub(r'\?v=[A-Za-z0-9_-]+','?v=20261023-login1',s);html.write_text(s)
# The calculator must not prefer a hardcoded 2026003 payroll over the active cut.
p=a.out/'fuerza-trabajo/calculadora-nivelacion.html';s=p.read_text();start=s.index('async function cargarNominas(');end=s.index('\n',start)
replacement="""async function cargarNominas(){const s=await window.SICIPCentral.load();const c=window.SICIPCentral.current;DATA.nominas=[{id:c.id,nombre:'Base central · '+c.quincena,origen:'Corte activo',data:normalizarTrabajadores(s.people),plazas:s.legacyPlazas}];DATA.activeNominaId=c.id;$('nominaSyncStatus').textContent='Base central · quincena '+c.quincena+' · antigüedad del mismo corte';$('quincena').value=c.quincena;renderNominaSelect()}"""
s=s[:start]+replacement+s[end:]
for name in ['publicarNomina','usarPreviewNomina']:
 start=s.index('async function '+name+'(');end=s.index('\n',start)
 s=s[:start]+"async function "+name+"(){toast('Actualiza el Excel completo en Base central → Cargar quincena.','warn')}"+s[end:]
# Ensure the protected submodule waits for session initialization before evaluating its access gate.
s=s.replace('<script>\nconst ', '<script type="module">\nawait window.SICIPCentralBoot;\nconst ',1)
# Its functions are referenced by inline onclick handlers, so keep classic script scope.
s=s.replace('<script type="module">\nawait window.SICIPCentralBoot;\nconst ','<script>\nconst ',1)
# Session bootstrap is already inherited from the authenticated parent; a direct load is handled by the server.
p.write_text(s)
# Legacy entrypoints wait for the session and use the common data service explicitly.
p=a.out/'pases/index.html';s=p.read_text()
s=s.replace("fetch('../data-ft-nomina-2026009.json').then(function(r){return r.json()})","window.SICIPCentralBoot.then(function(){return window.SICIPCentral.collection('trabajadores')})")
s=s.replace("Base activa cargada: nómina quincenal 09 (","Base central · quincena '+window.SICIPCentral.current.quincena+' (")
p.write_text(s)
p=a.out/'sicip-workflows-v524.js';s=p.read_text();start=s.index('  async function nomina(){');end=s.index('\n  }',start)+4
s=s[:start]+"  async function nomina(){return window.SICIPCentral.collection('trabajadores');}"+s[end:];p.write_text(s)
p=a.out/'fuerza-trabajo/calculadora-nivelacion.html';s=p.read_text().replace('(function init(){','window.SICIPCentralBoot.then(function init(){').replace('})})();','})});');p.write_text(s)

# Stamp new documents with their source cut; never rewrite existing history.
p=a.out/'pases/index.html';s=p.read_text().replace("var p={folio:","var p={quincenaOrigen:window.SICIPCentral.current.quincena,corteOrigen:window.SICIPCentral.current.id,folio:");p.write_text(s)
p=a.out/'sicip-recepciones-module.js';s=p.read_text().replace("async function fsCreate(coll, obj) {","async function fsCreate(coll, obj) {\n    if (window.SICIPCentral && window.SICIPCentral.current) obj={...obj,quincenaOrigen:window.SICIPCentral.current.quincena,corteOrigen:window.SICIPCentral.current.id};");p.write_text(s)

# Remove destructive text-node rewriting and button hiding. Only repair exact UI labels.
p=a.out/'sicip-pro-design.js';s=p.read_text();start=s.index('  function fixTexts(');end=s.index('  // ====== SIDEBAR SINGLE ACTIVE',start)
s=s[:start]+'''  function fixTexts(root) {
    var labels={'x Vencer':'Por vencer','NÃ³mina':'Nómina','MatrÃ­cula':'Matrícula','ContraseÃ±a':'Contraseña'};
    var walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT),node;
    while((node=walker.nextNode())) { if(labels[node.nodeValue]) node.nodeValue=labels[node.nodeValue]; }
  }

'''+s[end:]
s=s.replace("      var btn = btns[i];","      var btn = btns[i]; if(btn.closest('.sicip-central')) continue;")
s=s.replace("if (act) { btn.setAttribute('data-sicip-active', '1'); }", "if(btn.dataset)btn.dataset.active=act?'1':''; if (act) { btn.setAttribute('data-sicip-active', '1'); btn.setAttribute('aria-current','page'); }")
s=s.replace("else { btn.removeAttribute('data-sicip-active'); }", "else { btn.removeAttribute('data-sicip-active'); btn.removeAttribute('aria-current'); }")
# Generic gray-button recoloring erased selected/disabled distinctions.
s='\n'.join(line for line in s.split('\n') if not any(pattern in line for pattern in ['button[style*="#f3f4f6"]','button[style*="#f9fafb"]','button[style*="#e5e7eb"]']))
p.write_text(s)
p=a.out/'sicip-panels-v5.js';s=p.read_text().replace("'trabajadores', 'plazas', 'plazas-full', 'usuarios', 'usuarios-full'","'trabajadores', 'plazas', 'plazas-full'")
s=s.replace("function idbSet(key, value) {","function idbSet(key, value) {\n    if (/^data_(trabajadores|plazas|vacantes|jefesServicio|usuarios)/.test(key)) return Promise.resolve();")
s=s.replace("function idbGet(key) {","function idbGet(key) {\n    if (/^data_(trabajadores|plazas|vacantes|jefesServicio)/.test(key)) return Promise.resolve(null);")
p.write_text(s.replace('5.22.5','5.25.0'))
p=a.out/'sicip-audit-fixes.js';p.write_text(p.read_text().replace('5.22.5','5.25.0'))
p=a.out/'sicip-rewards-panel.js';s=p.read_text().replace("if(document.getElementById('sicip-pases-view')||document.getElementById('sicip-herramientas-view'))return false;","if(document.querySelector('#sicip-pases-view,#sicip-herramientas-view,[data-sicip-cr-panel],[data-sicip-recepciones-panel],[data-sicip-faltas-panel],[data-sicip-jefe-panel],[data-sicip-module-panel]'))return false;")
s=s.replace("    panel.innerHTML='<div class=\"sicip-aura-head\"","    var markup='<div class=\"sicip-aura-head\"")
s=s.replace("    if(!panel.parentNode)m.insertBefore(panel,m.firstChild);","    if(panel.innerHTML!==markup)panel.innerHTML=markup;\n    if(!panel.parentNode)m.insertBefore(panel,m.firstChild);")
p.write_text(s)
p=a.out/'sicip-fuerza-trabajo-link.js';s=p.read_text().replace("if (e.target.closest('[data-sicip-herramientas-root]')) return;","if (e.target.closest('[data-sicip-herramientas-root],[data-sicip-custom-nav],.sicip-central')) return;")
s=s.replace("if (insertAfter && insertAfter.nextSibling) {","while(insertAfter && insertAfter.parentNode !== container) insertAfter=insertAfter.parentNode; if (insertAfter && insertAfter.nextSibling) {")
p.write_text(s)
p=a.out/'sicip-module-host.js';s=p.read_text().replace("button.removeAttribute('data-sicip-active');","button.removeAttribute('data-sicip-active');\n      button.removeAttribute('aria-current');")
s=s.replace("button.setAttribute('data-sicip-active', '1');","button.setAttribute('data-sicip-active', '1');\n    button.setAttribute('aria-current','page');")
p.write_text(s)
p=a.out/'sw.js';s=p.read_text();s=re.sub("const VERSION = '[^']+';","const VERSION = '20261023-login1';",s,count=1);p.write_text(s)
# Personal source spreadsheets now live in D1, not in publicly downloadable JSON assets.
private=re.compile(r'^data-(?:usuarios(?:-full)?|trabajadores|jefesServicio|plazas(?:-full)?(?:-\d{7})?|vacantes|ft-(?:trabajadores|nomina-(?:calculo-)?\d{7}|antiguedad|clasificacion))\.json$')
for file in a.out.glob('data-*.json'):
 if private.match(file.name):file.unlink()

subprocess.run(['python3',str(ROOT/'scripts/ui_patch.py'),str(a.out)],check=True)
subprocess.run(['python3',str(ROOT/'scripts/pases_patch.py'),str(a.out)],check=True)

subprocess.run([str(ROOT/'node_modules/.bin/esbuild'),str(ROOT/'src/contratacion-client.mjs'),'--bundle','--format=esm','--platform=browser','--target=es2022','--outfile='+str(public/'contratacion-client.mjs')],check=True)


# Shared, versioned tabulators: prefer the exact selected quincena; never silently use another published period.
p=a.out/'fuerza-trabajo/calculadora-nivelacion.html';s=p.read_text();start=s.index('async function cargarTabuladores(');end=s.index('\n',start)
s=s[:start]+"""async function cargarTabuladores(localTab,tab20252026,tabCalc){window.SICIPNivelReference=window.SICIPNivelReference||tabCalc||tab20252026||localTab;const q=$('quincena').value||window.SICIPCentral.current?.quincena;try{const t=await window.SICIPCentral.api('/api/contratacion/tabulador?quincena='+encodeURIComponent(q));const data=normalizarTabulador(t.datos);DATA.tabuladores=[{id:t.id,nombre:t.nombre+' · '+t.quincena,origen:'Administración · versión '+t.hash.slice(0,12),data}];DATA.activeTabuladorId=t.id;$('syncStatus').textContent='Tabulador publicado para quincena '+q;renderTabuladorSelect();}catch(e){if(e.status!==404)throw e;DATA.tabuladores=[{id:'referencia-no-publicada',nombre:'Referencia de herramienta · pendiente de publicar para '+q,origen:'Archivo de cálculo correcto 2025-2026; sin vigencia quincenal confirmada',data:normalizarTabulador(window.SICIPNivelReference)}];DATA.activeTabuladorId='referencia-no-publicada';$('syncStatus').textContent='No hay tabulador publicado para '+q+'. Mostrando referencia existente de la herramienta. Administración debe confirmar y publicar la versión para esta quincena.';renderTabuladorSelect();}}"""+s[end:]
start=s.index('async function publicarTabulador(');end=s.index('\n',start);s=s[:start]+"""async function publicarTabulador(){toast('Publica el tabulador por quincena en Administración → Jornadas y tabuladores.','warn');window.parent.SICIPModuleHost?.showReact();window.parent.history.pushState({},'', '/admin?seccion=coberturas');window.parent.dispatchEvent(new PopStateEvent('popstate'));}"""+s[end:]
s=s.replace("$('quincena').addEventListener('input',calcular)","$('quincena').addEventListener('input',calcular)")
s=s.replace("function initEvents(){", "function initEvents(){$('quincena').addEventListener('change',()=>cargarTabuladores({}, {}, window.SICIPNivelReference).then(()=>{setActiveTabulador(DATA.activeTabuladorId);calcular();}).catch(e=>toast(e.message,'err')));")
s=s.replace('function configurarAdmin(){',"function configurarAdmin(){$('tabuladorInfo').parentElement.appendChild($('syncStatus'));")
s=s.replace('tabulador anual','tabulador por quincena').replace('Tabulador anual','Tabulador por quincena')
s=s.replace("$('adminTabuladores').style.display=isAdmin?'block':'none'","$('adminTabuladores').style.display='none';$('adminLink').href='../admin?seccion=coberturas';$('adminLink').target='_top';$('adminLink').textContent='Administrar jornadas y tabuladores'")
p.write_text(s)

# Build a single Pages advanced-mode Worker; only API routes execute it.
subprocess.run([str(ROOT/'node_modules/.bin/esbuild'),str(ROOT/'src/worker.mjs'),'--bundle','--format=esm','--platform=browser','--target=es2022','--outfile='+str(a.out/'_worker.js')],check=True)
# All paths pass through the Worker so private legacy JSONs cannot bypass it.
(a.out/'_routes.json').write_text('{"version":1,"include":["/*"],"exclude":["/assets/*","/icons/*","/sicip-central/*"]}')
print('Build preparado en',a.out)
