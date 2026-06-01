<script>
// ============================================================
// SICIP FUERZA DE TRABAJO - Calculadora de Nivelación v1.0
// ============================================================
var FB_BASE = 'https://firestore.googleapis.com/v1/projects/sicip-bcs/databases/(default)/documents';
var FB_KEY = 'AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8';
var DATA = {
  tabulador: null, escalafon: null, antparams: [],
  trabajadores: [], antiguedad: {}, clasificacion: null, cargas: []
};
var STATE = { sustituto: null, nivelar: null, calculo: null, quincena: '' };

// ---- HELPERS ----
function FMT(n) { return '$' + (n||0).toLocaleString('es-MX', {minimumFractionDigits:2,maximumFractionDigits:2}); }
function FMT2(n) { return (n||0).toFixed(2); }
function NUM(v) { if(v===null||v===undefined||v==='')return 0; if(typeof v==='number')return v; return parseFloat(String(v).replace(/[^0-9.\-]/g,''))||0; }
function ES(v) { return (v===null||v===undefined)?'':String(v).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function $id(id) { return document.getElementById(id); }
function getUsuario() { try{var s=sessionStorage.getItem('sicip_usuario');return s?JSON.parse(s):null;}catch(e){return null;} }

function showToast(msg, type) {
  var t = $id('toast'); t.textContent = msg; t.className = 'toast '+(type||'info');
  t.style.display = 'block'; setTimeout(function(){t.style.display='none';},3500);
}

// ---- NAVEGACIÓN ----
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  var panel = $id('panel-'+name); if(panel) panel.classList.add('active');
  document.querySelectorAll('.sidebar-nav button').forEach(function(b){b.classList.remove('active');});
  var nav = $id('nav-'+name); if(nav) nav.classList.add('active');
  if(name==='historial') buscarHistorial();
  if(name==='reportes') cargarReportes();
  if(name==='carga') cargarQuincenasPrevias();
}

// ---- CATÁLOGOS ----
async function cargarCatalogos() {
  try{
    var tab=sessionStorage.getItem('ft_tabulador');
    if(tab){DATA.tabulador=JSON.parse(tab);}else{var r=await fetch('tabulador.json');DATA.tabulador=await r.json();sessionStorage.setItem('ft_tabulador',JSON.stringify(DATA.tabulador));}
  }catch(e){console.warn('tabulador:',e);}
  try{
    var esc=sessionStorage.getItem('ft_escalafon');
    if(esc){DATA.escalafon=JSON.parse(esc);}else{var r=await fetch('escalafon.json');DATA.escalafon=await r.json();sessionStorage.setItem('ft_escalafon',JSON.stringify(DATA.escalafon));}
  }catch(e){console.warn('escalafon:',e);}
  try{
    var ap=sessionStorage.getItem('ft_antparams');
    if(ap){DATA.antparams=JSON.parse(ap);}else{var r=await fetch('antparams.json');DATA.antparams=await r.json();sessionStorage.setItem('ft_antparams',JSON.stringify(DATA.antparams));}
  }catch(e){console.warn('antparams:',e);}
  console.log('[FT] Catalogos: tab='+Object.keys(DATA.tabulador||{}).length+' esc='+Object.keys(DATA.escalafon||{}).length+' antparams='+(DATA.antparams||[]).length);
}

// ---- AUTOCOMPLETE ----
async function buscarTrabajadores(queryStr, dropId, inputId, targetKey) {
  var q=(queryStr||'').trim();
  if(q.length<2){$id(dropId).classList.remove('show');return;}
  if(DATA.trabajadores.length>0){mostrarResultadosBusqueda(q,dropId,inputId,targetKey);return;}
  $id(dropId).innerHTML='<div class="item" style="color:var(--gray-500)">Buscando...</div>';
  $id(dropId).classList.add('show');
  try{
    var url=FB_BASE+'/ft_trabajadores?key='+FB_KEY;
    var all=[], pageToken=null;
    for(var i=0;i<30;i++){
      var pageUrl=url+(pageToken?'&pageToken='+pageToken:'')+'&pageSize=500';
      var resp=await fetch(pageUrl); var data=await resp.json();
      if(data.documents){data.documents.forEach(function(doc){var f=doc.fields;all.push({matricula:(f.matricula&&f.matricula.stringValue)||'',nombre:(f.nombre&&f.nombre.stringValue)||'',puesto:(f.puesto&&f.puesto.stringValue)||'',descripcion_puesto:(f.descripcion_puesto&&f.descripcion_puesto.stringValue)||'',tipo_contratacion:(f.tipo_contratacion&&f.tipo_contratacion.stringValue)||'',departamento:(f.departamento&&f.departamento.stringValue)||'',descripcion_departamento:(f.descripcion_departamento&&f.descripcion_departamento.stringValue)||''});});}
      if(!data.nextPageToken) break; pageToken=data.nextPageToken;
    }
    DATA.trabajadores=all; mostrarResultadosBusqueda(q,dropId,inputId,targetKey);
  }catch(e){$id(dropId).innerHTML='<div class="item" style="color:var(--red)">Error al buscar. Intenta de nuevo.</div>';console.error(e);}
}

function mostrarResultadosBusqueda(q,dropId,inputId,targetKey){
  var qLow=q.toLowerCase();
  var results=DATA.trabajadores.filter(function(t){return(t.matricula&&t.matricula.indexOf(q)>=0)||(t.nombre&&t.nombre.toLowerCase().indexOf(qLow)>=0);}).slice(0,15);
  var html='';
  if(results.length===0){html='<div class="item" style="color:var(--gray-500)">Sin resultados</div>';}
  else{results.forEach(function(t,i){html+='<div class="item" onclick="seleccionarTrabajador(\''+targetKey+'\',\''+dropId+'\',\''+inputId+'\',\''+t.matricula+'\',\''+ES(t.nombre).replace(/'/g,"\\'")+'\',\''+ES(t.puesto).replace(/'/g,"\\'")+'\',\''+ES(t.descripcion_puesto).replace(/'/g,"\\'")+'\',\''+ES(t.tipo_contratacion).replace(/'/g,"\\'")+'\')"><div class="name">'+ES(t.nombre)+'</div><div class="sub">Mat. '+ES(t.matricula)+' · '+ES(t.descripcion_puesto||t.puesto)+'</div></div>';});}
  $id(dropId).innerHTML=html; $id(dropId).classList.add('show');
}

function seleccionarTrabajador(key,dropId,inputId,matricula,nombre,puesto,descripcion,tc){
  $id(dropId).classList.remove('show');
  $id(inputId).value=nombre+' ('+matricula+')';
  STATE[key]={matricula:matricula,nombre:nombre,puesto:puesto,descripcion_puesto:descripcion,tipo_contratacion:tc};
  cargarAntiguedad(matricula,key);
}

// ---- ANTIGÜEDAD ----
async function cargarAntiguedad(matricula,key){
  if(!matricula||DATA.antiguedad[matricula]) return;
  try{
    var docUrl=FB_BASE+'/ft_antiguedad/'+matricula+'?key='+FB_KEY;
    var resp=await fetch(docUrl); if(!resp.ok) return;
    var data=await resp.json();
    if(data.fields){var f=data.fields;DATA.antiguedad[matricula]={matricula:matricula,anios:parseInt(f.anios&&f.anios.integerValue||'0'),quincenas:parseInt(f.quincenas&&f.quincenas.integerValue||'0'),dias:parseInt(f.dias&&f.dias.integerValue||'0'),total:parseFloat(f.total&&f.total.doubleValue||'0'),concepto:(f.concepto&&f.concepto.stringValue)||'',puesto:(f.puesto&&f.puesto.stringValue)||''};}
  }catch(e){console.warn('antiguedad '+matricula+':',e);}
}

function getDiasSueldo(anios){
  if(!DATA.antparams||DATA.antparams.length===0) return 0;
  var params=DATA.antparams, best=null;
  for(var i=0;i<params.length;i++){if(params[i].anios<=anios){if(!best||params[i].anios>best.anios)best=params[i];}}
  return best?best.dias_sueldo:0;
}

// ---- CÁLCULO DE NIVELACIÓN ----
async function calcularNivelacion(){
  if(!STATE.sustituto||!STATE.nivelar){showToast('Selecciona ambas matrículas primero','warning');return;}
  if(!DATA.tabulador||Object.keys(DATA.tabulador).length===0){showToast('Catálogos aún no cargados. Espera.','warning');return;}
  var q=$id('quincena-nivelacion').value.trim()||'2025014'; STATE.quincena=q;
  $id('btn-calcular').disabled=true; $id('btn-calcular').textContent='⏳ Calculando...';
  try{
    await cargarAntiguedad(STATE.sustituto.matricula,'sustituto');
    await cargarAntiguedad(STATE.nivelar.matricula,'nivelar');
    STATE.calculo=ejecutarCalculo();
    mostrarResultados(STATE.calculo);
    $id('card-resultados').style.display='block';
    $id('card-resultados').scrollIntoView({behavior:'smooth'});
    showToast('✅ Cálculo completado','success');
  }catch(e){console.error(e);showToast('❌ Error: '+e.message,'error');}
  finally{$id('btn-calcular').disabled=false;$id('btn-calcular').textContent='⚡ Calcular Nivelación';}
}

function ejecutarCalculo(){
  var pSust=STATE.sustituto.puesto, pNiv=STATE.nivelar.puesto;
  var matSust=STATE.sustituto.matricula, matNiv=STATE.nivelar.matricula;
  var tabSust=DATA.tabulador[pSust]||{}, tabNiv=DATA.tabulador[pNiv]||{};
  var escSust=DATA.escalafon[pSust]||{}, escNiv=DATA.escalafon[pNiv]||{};
  var antSust=DATA.antiguedad[matSust]||{anios:0,quincenas:0,dias:0}, antNiv=DATA.antiguedad[matNiv]||{anios:0,quincenas:0,dias:0};
  var c={};
  // Sustituto
  c.sust_01=NUM(tabSust.sueldo_nuevo); c.sust_011=NUM(tabSust.c011); c.sust_013=NUM(tabSust.c013);
  c.sust_014=NUM(tabSust.c014); c.sust_015=NUM(tabSust.c015); c.sust_054=NUM(tabSust.c054);
  c.sust_057=NUM(tabSust.c057); c.sust_058=NUM(tabSust.c058); c.sust_061=NUM(tabSust.c061); c.sust_064=NUM(tabSust.c064);
  var base022S=c.sust_01+c.sust_011+c.sust_013+c.sust_057+c.sust_058+c.sust_061;
  c.sust_022=(base022S/360)*getDiasSueldo(antSust.anios);
  c.total_sustituto=c.sust_01+c.sust_011+c.sust_013+c.sust_014+c.sust_015+c.sust_022+c.sust_054+c.sust_057+c.sust_058+c.sust_061+c.sust_064;
  // Nivelar
  c.niv_01=NUM(tabNiv.sueldo_nuevo); c.niv_011=NUM(tabNiv.c011); c.niv_013=NUM(tabNiv.c013);
  c.niv_014=NUM(tabNiv.c014); c.niv_015=NUM(tabNiv.c015); c.niv_054=NUM(tabNiv.c054);
  c.niv_057=NUM(tabNiv.c057); c.niv_058=NUM(tabNiv.c058); c.niv_061=NUM(tabNiv.c061); c.niv_064=NUM(tabNiv.c064);
  var base022N=c.niv_01+c.niv_011+c.niv_013+c.niv_057+c.niv_058+c.niv_061;
  c.niv_022=(base022N/360)*getDiasSueldo(antNiv.anios);
  c.total_nivelar=c.niv_01+c.niv_011+c.niv_013+c.niv_014+c.niv_015+c.niv_022+c.niv_054+c.niv_057+c.niv_058+c.niv_061+c.niv_064;
  c.diferencia=c.total_nivelar-c.total_sustituto;
  // Validaciones
  var ramaS=(escSust.rama_esc||'').trim(), ramaN=(escNiv.rama_esc||'').trim();
  var escValS=parseInt(escSust.esc)||0, escValN=parseInt(escNiv.esc)||0;
  if(ramaS===ramaN){c.val_rama='MISMA RAMA ESCALAFONARIA';c.val_rama_class='badge-ok';if(escValN===escValS+1){c.val_inmediata='CATEGORIA INMEDIATA SUPERIOR CORRECTA';c.val_inmediata_class='badge-ok';}else{c.val_inmediata='NO ES CATEGORIA INMEDIATA SUPERIOR / CATEGORIAS NO AFINES';c.val_inmediata_class='badge-err';}}
  else if(ramaN==='CUT'){c.val_rama='CATEGORIA UNICA';c.val_rama_class='badge-warn';c.val_inmediata='CATEGORIA UNICA - NO APLICA INMEDIATA';c.val_inmediata_class='badge-warn';}
  else{c.val_rama='DIFERENTE RAMA ESCALAFONARIA';c.val_rama_class='badge-err';c.val_inmediata='NO ES CATEGORIA INMEDIATA SUPERIOR / CATEGORIAS NO AFINES';c.val_inmediata_class='badge-err';}
  // Datos
  c.sust_nombre=STATE.sustituto.nombre; c.sust_matricula=matSust; c.sust_puesto=pSust; c.sust_desc=STATE.sustituto.descripcion_puesto||(tabSust.descripcion||''); c.sust_tc=STATE.sustituto.tipo_contratacion||''; c.sust_ant_a=antSust.anios; c.sust_ant_q=antSust.quincenas; c.sust_ant_d=antSust.dias; c.sust_esc=escValS; c.sust_rama=ramaS;
  c.niv_nombre=STATE.nivelar.nombre; c.niv_matricula=matNiv; c.niv_puesto=pNiv; c.niv_desc=STATE.nivelar.descripcion_puesto||(tabNiv.descripcion||''); c.niv_tc=STATE.nivelar.tipo_contratacion||''; c.niv_ant_a=antNiv.anios; c.niv_ant_q=antNiv.quincenas; c.niv_ant_d=antNiv.dias; c.niv_esc=escValN; c.niv_rama=ramaN;
  c.dias=2; c.factor=1.4; c.importe=(c.diferencia/15)*(c.dias*c.factor);
  return c;
}

// ---- MOSTRAR RESULTADOS ----
function mostrarResultados(c){
  function TR(concepto,sust,niv){return'<tr><td>'+ES(concepto)+'</td><td>'+sust+'</td><td>'+niv+'</td><td></td></tr>';}
  var html='';
  html+='<div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap"><div class="badge '+c.val_rama_class+'">'+ES(c.val_rama)+'</div><div class="badge '+c.val_inmediata_class+'">'+ES(c.val_inmediata)+'</div></div>';
  html+='<table class="comparison-table"><thead><tr><th>Concepto</th><th>SUSTITUTO<br><small>'+ES(c.sust_nombre)+' ('+ES(c.sust_matricula)+')</small></th><th>A NIVELAR<br><small>'+ES(c.niv_nombre)+' ('+ES(c.niv_matricula)+')</small></th><th></th></tr></thead><tbody>';
  html+='<tr class="col-label"><td colspan="4">📋 Datos Generales</td></tr>';
  html+=TR('Categoría',ES(c.sust_puesto),ES(c.niv_puesto));
  html+=TR('Descripción',ES(c.sust_desc),ES(c.niv_desc));
  html+=TR('Tipo Contrato',ES(c.sust_tc),ES(c.niv_tc));
  html+=TR('Rama Escal.',ES(c.sust_rama),ES(c.niv_rama));
  html+=TR('Nivel ESC',c.sust_esc,c.niv_esc);
  html+=TR('Antigüedad A/Q/D',c.sust_ant_a+'/'+c.sust_ant_q+'/'+c.sust_ant_d,c.niv_ant_a+'/'+c.niv_ant_q+'/'+c.niv_ant_d);
  html+='<tr class="col-label"><td colspan="4">💰 Conceptos Salariales</td></tr>';
  html+=TR('01/02 Sueldo',FMT(c.sust_01),FMT(c.niv_01));
  html+=TR('011 Ayuda Renta',FMT(c.sust_011),FMT(c.niv_011));
  html+=TR('013',FMT(c.sust_013),FMT(c.niv_013));
  html+=TR('014 Zona Aislada',FMT(c.sust_014),FMT(c.niv_014));
  html+=TR('015',FMT(c.sust_015),FMT(c.niv_015));
  html+=TR('022 Antigüedad',FMT(c.sust_022),FMT(c.niv_022));
  html+=TR('054 Asistencia',FMT(c.sust_054),FMT(c.niv_054));
  html+=TR('057 Puntualidad',FMT(c.sust_057),FMT(c.niv_057));
  html+=TR('058',FMT(c.sust_058),FMT(c.niv_058));
  html+=TR('061',FMT(c.sust_061),FMT(c.niv_061));
  html+=TR('064',FMT(c.sust_064),FMT(c.niv_064));
  html+='<tr class="sub"><td><strong>TOTAL</strong></td><td style="color:var(--green-dark)"><strong>'+FMT(c.total_sustituto)+'</strong></td><td style="color:var(--green-dark)"><strong>'+FMT(c.total_nivelar)+'</strong></td><td></td></tr>';
  html+='<tr class="diff-row"><td><strong>DIFERENCIA</strong></td><td></td><td><strong>'+FMT(c.diferencia)+'</strong></td><td></td></tr>';
  html+='</tbody></table>';
  // Importe
  html+='<div style="margin-top:1.5rem;padding:1rem;background:var(--green-bg);border-radius:var(--radius);border:2px solid var(--green)"><h3 style="margin-bottom:0.75rem">💵 Cálculo del Importe</h3><div class="form-row" style="align-items:flex-end"><div class="form-group" style="max-width:120px"><label>Días</label><input type="number" id="importe-dias" value="'+c.dias+'" min="1" onchange="actualizarImporte()"></div><div class="form-group" style="max-width:150px"><label>Factor</label><select id="importe-factor" onchange="actualizarImporte()"><option value="1.4"'+(c.factor===1.4?' selected':'')+'>1.4</option><option value="2.33"'+(c.factor===2.33?' selected':'')+'>2.33</option><option value="3.5"'+(c.factor===3.5?' selected':'')+'>3.5</option></select></div><div class="form-group" style="max-width:200px"><label>IMPORTE</label><div style="font-size:1.5rem;font-weight:800;color:var(--green-dark)" id="importe-valor">'+FMT(c.importe)+'</div></div></div><div style="font-size:0.78rem;color:var(--gray-500);margin-top:0.5rem">Fórmula: (Diferencia ÷ 15) × (Días × Factor)</div></div>';
  // Botones
  html+='<div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap"><button class="btn btn-success" onclick="guardarCalculo()">💾 Guardar Cálculo</button><button class="btn btn-secondary" onclick="exportarPDF()">🖨️ Exportar PDF</button><button class="btn btn-secondary" onclick="exportarCalculoExcel()">📥 Exportar Excel</button><button class="btn btn-secondary" onclick="window.print()">🖨️ Imprimir</button></div>';
  $id('resultado-content').innerHTML=html;
}

function actualizarImporte(){
  if(!STATE.calculo)return; var d=parseInt($id('importe-dias').value)||2; var f=parseFloat($id('importe-factor').value)||1.4;
  STATE.calculo.dias=d; STATE.calculo.factor=f; STATE.calculo.importe=(STATE.calculo.diferencia/15)*(d*f);
  $id('importe-valor').textContent=FMT(STATE.calculo.importe);
}
</script>
