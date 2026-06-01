<script>
// ---- HISTORIAL ----
async function buscarHistorial(){
  var filtroMat=$id('filtro-matricula').value.trim(), filtroQ=$id('filtro-quincena').value.trim(), filtroU=$id('filtro-usuario').value.trim().toLowerCase();
  var listEl=$id('historial-list'); listEl.innerHTML='<div style="text-align:center;padding:1rem;color:var(--gray-500)">🔍 Buscando...</div>';
  try{
    var url=FB_BASE+':runQuery?key='+FB_KEY, filters=[];
    if(filtroQ) filters.push({fieldFilter:{field:{fieldPath:'quincena'},op:'EQUAL',value:{stringValue:filtroQ}}});
    if(filtroMat) filters.push({fieldFilter:{field:{fieldPath:'matricula_sustituto'},op:'EQUAL',value:{stringValue:filtroMat}}});
    var query;
    if(filters.length===1) query={structuredQuery:{from:[{collectionId:'ft_calculos_nivelacion'}],where:filters[0],orderBy:[{field:{fieldPath:'fecha'},direction:'DESCENDING'}],limit:50}};
    else if(filters.length>1) query={structuredQuery:{from:[{collectionId:'ft_calculos_nivelacion'}],where:{compositeFilter:{op:'AND',filters:filters}},orderBy:[{field:{fieldPath:'fecha'},direction:'DESCENDING'}],limit:50}};
    else query={structuredQuery:{from:[{collectionId:'ft_calculos_nivelacion'}],orderBy:[{field:{fieldPath:'fecha'},direction:'DESCENDING'}],limit:50}};
    var resp=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(query)});
    if(!resp.ok){listEl.innerHTML='<div style="color:var(--red)">Error al buscar</div>';return;}
    var data=await resp.json();
    if(!data||data.length===0){listEl.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray-500)">No se encontraron cálculos</div>';return;}
    var html='<table style="width:100%;border-collapse:collapse;font-size:0.8rem"><thead><tr style="background:var(--green);color:#fff"><th style="padding:0.5rem;text-align:left">Fecha</th><th style="padding:0.5rem;text-align:left">Qna</th><th style="padding:0.5rem;text-align:left">Sustituto</th><th style="padding:0.5rem;text-align:left">A Nivelar</th><th style="padding:0.5rem;text-align:right">Diferencia</th><th style="padding:0.5rem;text-align:right">Importe</th><th style="padding:0.5rem;text-align:center">Validación</th><th style="padding:0.5rem;text-align:center">Acciones</th></tr></thead><tbody>';
    data.forEach(function(result){
      var doc=result.document,f; if(doc&&doc.fields) f=doc.fields; else if(result.fields) f=result.fields; else return;
      var id=(doc&&doc.name?doc.name.split('/').pop():'');
      var fechaVal='';try{fechaVal=f.fecha?new Date((f.fecha.timestampValue||f.fecha.stringValue||'')).toLocaleDateString('es-MX'):'';}catch(e){}
      var usuario=(f.usuario&&f.usuario.stringValue||'').toLowerCase();
      if(filtroU&&usuario.indexOf(filtroU)<0) return;
      html+='<tr style="border-bottom:1px solid var(--gray-200)"><td style="padding:0.4rem 0.5rem">'+ES(fechaVal)+'</td><td style="padding:0.4rem 0.5rem">'+ES((f.quincena&&f.quincena.stringValue)||'')+'</td><td style="padding:0.4rem 0.5rem"><strong>'+ES((f.nombre_sustituto&&f.nombre_sustituto.stringValue)||'')+'</strong><br><small>'+ES((f.matricula_sustituto&&f.matricula_sustituto.stringValue)||'')+'</small></td><td style="padding:0.4rem 0.5rem"><strong>'+ES((f.nombre_nivelar&&f.nombre_nivelar.stringValue)||'')+'</strong><br><small>'+ES((f.matricula_nivelar&&f.matricula_nivelar.stringValue)||'')+'</small></td><td style="padding:0.4rem 0.5rem;text-align:right">'+FMT((f.diferencia&&f.diferencia.doubleValue)||0)+'</td><td style="padding:0.4rem 0.5rem;text-align:right;font-weight:700;color:var(--green-dark)">'+FMT((f.importe&&f.importe.doubleValue)||0)+'</td><td style="padding:0.4rem 0.5rem;text-align:center"><span class="badge '+badgeClass((f.validacion_categoria_inmediata&&f.validacion_categoria_inmediata.stringValue)||'')+'" style="font-size:0.65rem">'+ES(((f.validacion_categoria_inmediata&&f.validacion_categoria_inmediata.stringValue)||'').substring(0,20))+'</span></td><td style="padding:0.4rem 0.5rem;text-align:center"><button class="btn btn-sm btn-secondary" onclick="verCalculoGuardado(\''+id+'\')">👁️</button></td></tr>';
    });
    html+='</tbody></table>'; listEl.innerHTML=html;
  }catch(e){console.error(e);listEl.innerHTML='<div style="color:var(--red)">Error: '+ES(e.message)+'</div>';}
}

function badgeClass(txt){
  if(!txt) return 'badge-info';
  var t=txt.toUpperCase();
  if(t.indexOf('CORRECTA')>=0) return 'badge-ok';
  if(t.indexOf('NO ES')>=0||t.indexOf('DIFERENTE')>=0) return 'badge-err';
  if(t.indexOf('UNICA')>=0) return 'badge-warn';
  return 'badge-info';
}

async function verCalculoGuardado(id){
  try{
    var url=FB_BASE+'/ft_calculos_nivelacion/'+id+'?key='+FB_KEY;
    var resp=await fetch(url); var data=await resp.json();
    if(!data.fields){showToast('No encontrado','error');return;}
    var f=data.fields;
    function gv(field,type){if(!f[field])return type==='number'?0:'';return type==='number'?(parseFloat(f[field].doubleValue||f[field].integerValue||0)):(f[field].stringValue||'');}
    var cRec={};
    cRec.sust_matricula=gv('matricula_sustituto');cRec.sust_nombre=gv('nombre_sustituto');cRec.sust_puesto=gv('puesto_sustituto');cRec.sust_desc=gv('descripcion_puesto_sustituto');cRec.sust_rama=gv('rama_sustituto');cRec.sust_esc=gv('esc_sustituto','number');
    cRec.niv_matricula=gv('matricula_nivelar');cRec.niv_nombre=gv('nombre_nivelar');cRec.niv_puesto=gv('puesto_nivelar');cRec.niv_desc=gv('descripcion_puesto_nivelar');cRec.niv_rama=gv('rama_nivelar');cRec.niv_esc=gv('esc_nivelar','number');
    cRec.val_rama=gv('validacion_rama');cRec.val_inmediata=gv('validacion_categoria_inmediata');cRec.total_sustituto=gv('total_sustituto','number');cRec.total_nivelar=gv('total_nivelar','number');cRec.diferencia=gv('diferencia','number');cRec.dias=gv('dias','number');cRec.factor=gv('factor','number');cRec.importe=gv('importe','number');
    cRec.sust_ant_a=0;cRec.sust_ant_q=0;cRec.sust_ant_d=0;cRec.niv_ant_a=0;cRec.niv_ant_q=0;cRec.niv_ant_d=0;cRec.sust_tc='';cRec.niv_tc='';
    cRec.sust_01=0;cRec.sust_011=0;cRec.sust_013=0;cRec.sust_014=0;cRec.sust_015=0;cRec.sust_022=0;cRec.sust_054=0;cRec.sust_057=0;cRec.sust_058=0;cRec.sust_061=0;cRec.sust_064=0;
    cRec.niv_01=0;cRec.niv_011=0;cRec.niv_013=0;cRec.niv_014=0;cRec.niv_015=0;cRec.niv_022=0;cRec.niv_054=0;cRec.niv_057=0;cRec.niv_058=0;cRec.niv_061=0;cRec.niv_064=0;
    STATE.calculo=cRec;mostrarResultados(cRec);showPanel('calculadora');
    $id('card-resultados').style.display='block';$id('card-resultados').scrollIntoView({behavior:'smooth'});
    showToast('Cálculo cargado del historial','info');
  }catch(e){showToast('Error: '+e.message,'error');}
}

async function exportarHistorialExcel(){
  var listEl=$id('historial-list'), table=listEl.querySelector('table');
  if(!table){showToast('Primero busca en el historial','warning');return;}
  var data=[], headers=[]; table.querySelectorAll('thead th').forEach(function(th){headers.push(th.textContent);}); data.push(headers);
  table.querySelectorAll('tbody tr').forEach(function(tr){var row=[];tr.querySelectorAll('td').forEach(function(td){row.push(td.textContent.trim());});data.push(row);});
  var ws=XLSX.utils.aoa_to_sheet(data), wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Historial'); XLSX.writeFile(wb,'historial_nivelacion.xlsx');
}

// ---- QUINCENAS Y REPORTES ----
async function cargarQuincenasPrevias(){
  var listEl=$id('cargas-list'); if(!listEl) return;
  try{
    var url=FB_BASE+'/ft_cargas_quincena?key='+FB_KEY+'&pageSize=20'; var resp=await fetch(url); var data=await resp.json();
    if(!data.documents||data.documents.length===0){listEl.innerHTML='<div style="color:var(--gray-500);padding:1rem">No hay cargas registradas aún.</div>';return;}
    var html='<table style="width:100%;border-collapse:collapse;font-size:0.82rem"><thead><tr style="background:var(--gray-100)"><th style="padding:0.5rem;text-align:left">Quincena</th><th style="padding:0.5rem;text-align:left">Fecha</th><th style="padding:0.5rem;text-align:left">Usuario</th><th style="padding:0.5rem;text-align:left">Resultados</th></tr></thead><tbody>';
    data.documents.forEach(function(doc){var f=doc.fields;var fecha=f.fecha?new Date((f.fecha.timestampValue||f.fecha.stringValue||'')).toLocaleDateString('es-MX'):'';var res='';try{var r=JSON.parse(f.resultados.stringValue||'[]');r.forEach(function(i){res+=i.nombre+': '+i.ok+' ok, ';});}catch(e){}html+='<tr style="border-bottom:1px solid var(--gray-200)"><td style="padding:0.5rem;font-weight:600">'+ES(f.quincena.stringValue||'')+'</td><td style="padding:0.5rem">'+fecha+'</td><td style="padding:0.5rem">'+ES((f.usuario&&f.usuario.stringValue)||'')+'</td><td style="padding:0.5rem;font-size:0.75rem">'+res+'</td></tr>';});
    html+='</tbody></table>';listEl.innerHTML=html;
  }catch(e){listEl.innerHTML='<div style="color:var(--red)">Error: '+ES(e.message)+'</div>';}
}

async function cargarReportes(){
  var el=$id('reportes-stats'); if(!el) return;
  var tabCount=Object.keys(DATA.tabulador||{}).length, escCount=Object.keys(DATA.escalafon||{}).length;
  try{
    var resp=await fetch(FB_BASE+'/ft_cargas_quincena?key='+FB_KEY+'&pageSize=1');
    var data=await resp.json(); var cargas=(data.documents||[]).length;
    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem"><div class="card" style="text-align:center;padding:1.5rem"><div style="font-size:2.5rem;font-weight:800;color:var(--green)">'+cargas+'</div><div style="font-size:0.85rem;color:var(--gray-500)">Cargas Quincenales</div></div><div class="card" style="text-align:center;padding:1.5rem"><div style="font-size:2.5rem;font-weight:800;color:var(--green)">'+tabCount+'</div><div style="font-size:0.85rem;color:var(--gray-500)">Puestos (Tabulador)</div></div><div class="card" style="text-align:center;padding:1.5rem"><div style="font-size:2.5rem;font-weight:800;color:var(--green)">'+escCount+'</div><div style="font-size:0.85rem;color:var(--gray-500)">Puestos (Escalafón)</div></div><div class="card" style="text-align:center;padding:1.5rem"><div style="font-size:2.5rem;font-weight:800;color:var(--green)">'+Object.keys(DATA.antiguedad||{}).length+'</div><div style="font-size:0.85rem;color:var(--gray-500)">Antigüedades (cache)</div></div></div>';
  }catch(e){el.innerHTML='<div style="color:var(--red)">Error al cargar</div>';}
}

function buscarQuincenaActual(){
  var now=new Date(), year=now.getFullYear(), start=new Date(year,0,1);
  var diff=now-start, weekNum=Math.floor(diff/(1000*60*60*24*7)), qNum=Math.floor(weekNum/2)+1;
  var qStr=String(year)+String(qNum).padStart(3,'0');
  $id('quincena-nivelacion').value=qStr; showToast('Quincena estimada: '+qStr,'info');
}
</script>
