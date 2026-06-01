<script>
// ---- CARGAR DATOS QUINCENALES ----
async function procesarExcel(){
  var fileInput=$id('excel-file'), quincena=$id('quincena-carga').value.trim();
  if(!quincena){showToast('Ingresa el identificador de quincena','warning');return;}
  if(!fileInput.files||!fileInput.files[0]){showToast('Selecciona un archivo Excel','warning');return;}
  $id('btn-upload').disabled=true;$id('btn-upload').textContent='⏳ Procesando...';$id('upload-status').innerHTML='';
  var pw=$id('progress-wrap');pw.style.display='block';$id('progress-fill').style.width='10%';
  try{
    var data=await fileInput.files[0].arrayBuffer(), wb=XLSX.read(data,{type:'array'});
    $id('progress-fill').style.width='20%';
    var resultados=[], sheetNames=wb.SheetNames;
    for(var i=0;i<sheetNames.length;i++){
      var name=sheetNames[i].toLowerCase(), ws=wb.Sheets[sheetNames[i]];
      var jsonData=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(name.indexOf('matricul')>=0||name.indexOf('trabajador')>=0) resultados.push(await cargarTrabajadores(jsonData,quincena));
      else if(name.indexOf('antiguedad')>=0||name.indexOf('antig')>=0) resultados.push(await cargarAntiguedadHoja(jsonData,quincena));
      else if(name.indexOf('tabulador')>=0) resultados.push(await cargarTabuladorHoja(jsonData,quincena));
      else if(name.indexOf('escalafon')>=0||name.indexOf('escalaf')>=0) resultados.push(await cargarEscalafonHoja(jsonData));
      else if(name.indexOf('clasificacion')>=0||name.indexOf('clasif')>=0) resultados.push(await cargarClasificacionHoja(jsonData));
    }
    $id('progress-fill').style.width='90%';
    await registrarCarga(quincena,resultados);
    $id('progress-fill').style.width='100%';
    var totalOk=0,totalErr=0; resultados.forEach(function(r){totalOk+=r.ok||0;totalErr+=r.err||0;});
    var statusHtml='<div style="color:#16a34a;font-weight:600;margin-top:0.5rem">✅ Carga completada: '+totalOk.toLocaleString()+' registros</div>';
    if(totalErr>0) statusHtml+='<div style="color:var(--red);font-weight:600">⚠️ '+totalErr+' errores</div>';
    resultados.forEach(function(r){statusHtml+='<div style="font-size:0.8rem;margin-top:3px">• '+r.nombre+': '+(r.ok||0)+' ok'+(r.err?', '+r.err+' errores':'')+'</div>';});
    $id('upload-status').innerHTML=statusHtml; showToast('✅ Datos cargados correctamente','success');
  }catch(e){console.error(e);$id('upload-status').innerHTML='<div style="color:var(--red);font-weight:600">❌ Error: '+ES(e.message)+'</div>';showToast('❌ Error: '+e.message,'error');}
  finally{$id('btn-upload').disabled=false;$id('btn-upload').textContent='🚀 Procesar y Cargar';setTimeout(function(){pw.style.display='none';},2000);cargarQuincenasPrevias();}
}

async function uploadBatch(coleccion,docs){
  var total=docs.length,ok=0,batchSize=200;
  for(var i=0;i<total;i+=batchSize){
    var batch=docs.slice(i,i+batchSize);
    var writes=batch.map(function(doc){var id=doc.__id||(coleccion+'_'+Date.now()+'_'+Math.random().toString(36).slice(2));delete doc.__id;return{update:{name:'projects/sicip-bcs/databases/(default)/documents/'+coleccion+'/'+id,fields:doc,updateMask:{fieldPaths:Object.keys(doc)}}};});
    try{
      var url=FB_BASE+':commit?key='+FB_KEY;
      var resp=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({writes:writes})});
      if(resp.ok) ok+=batch.length; else console.error('Batch error:',await resp.text());
    }catch(e){console.error('Batch error:',e);}
  }
  return ok;
}

function findCols(header,map){
  var idx={};
  for(var i=0;i<header.length;i++){var h=String(header[i]).toLowerCase().replace(/[^a-z]/g,'');for(var k in map){if(!(k in idx)&&h.indexOf(map[k])>=0)idx[k]=i;}}
  return idx;
}

async function cargarTrabajadores(data,q){
  var r={nombre:'Trabajadores',ok:0,err:0};
  if(data.length<2){r.err=1;return r;}
  var idx=findCols(data[0],{matricula:'matricula',nombre:'nombre',puesto:'puesto',descripcion:'descripcion',departamento:'departamento',tipo_contratacion:'tipodecontratacion',fecha_ingreso:'fechaingreso',fecha_baja:'fechabaja'});
  if(!('matricula' in idx)||!('nombre' in idx)){r.err=1;r.msg='Faltan columnas: matricula, nombre';return r;}
  var docs=[];
  for(var i=1;i<data.length;i++){var row=data[i];if(!row[idx.matricula])continue;var d={matricula:{stringValue:String(row[idx.matricula]||'')},nombre:{stringValue:String(row[idx.nombre]||'')},puesto:{stringValue:String(row[idx.puesto]||'')},descripcion_puesto:{stringValue:String(row[idx.descripcion]||'')},departamento:{stringValue:String(row[idx.departamento]||'')},descripcion_departamento:{stringValue:''},tipo_contratacion:{stringValue:String(row[idx.tipo_contratacion]||'')},fecha_ingreso:{stringValue:String(row[idx.fecha_ingreso]||'')},fecha_baja:{stringValue:String(row[idx.fecha_baja]||'')},quincena:{stringValue:q}};d.__id='t_'+d.matricula.stringValue;docs.push(d);}
  r.ok=await uploadBatch('ft_trabajadores',docs);$id('progress-fill').style.width='50%';
  DATA.trabajadores=docs.map(function(d){return{matricula:d.matricula.stringValue,nombre:d.nombre.stringValue,puesto:d.puesto.stringValue,descripcion_puesto:d.descripcion_puesto.stringValue,tipo_contratacion:d.tipo_contratacion.stringValue,departamento:d.departamento.stringValue,descripcion_departamento:d.descripcion_departamento.stringValue};});
  return r;
}

async function cargarAntiguedadHoja(data,q){
  var r={nombre:'Antigüedad',ok:0,err:0};
  if(data.length<2){r.err=1;return r;}
  var idx=findCols(data[0],{matricula:'matricula',nombre:'nombre',total:'total',anios:'anos',quincenas:'quincenas',dias:'dias',concepto:'concepto',puesto:'puesto'});
  if(!('matricula' in idx)){r.err=1;return r;}
  var docs=[];
  for(var i=1;i<data.length;i++){var row=data[i];if(!row[idx.matricula])continue;var d={matricula:{stringValue:String(row[idx.matricula]||'')},nombre:{stringValue:String(row[idx.nombre]||'')},total:{doubleValue:NUM(row[idx.total])},anios:{integerValue:parseInt(row[idx.anios])||0},quincenas:{integerValue:parseInt(row[idx.quincenas])||0},dias:{integerValue:parseInt(row[idx.dias])||0},concepto:{stringValue:String(row[idx.concepto]||'')},puesto:{stringValue:String(row[idx.puesto]||'')},quincena:{stringValue:q}};d.__id='a_'+d.matricula.stringValue;docs.push(d);}
  r.ok=await uploadBatch('ft_antiguedad',docs);
  docs.forEach(function(d){DATA.antiguedad[d.matricula.stringValue]={matricula:d.matricula.stringValue,anios:d.anios.integerValue,quincenas:d.quincenas.integerValue,dias:d.dias.integerValue,total:d.total.doubleValue};});
  $id('progress-fill').style.width='70%'; return r;
}

async function cargarTabuladorHoja(data,q){
  var r={nombre:'Tabulador',ok:0,err:0};
  if(data.length<2){r.err=1;return r;}
  var idx=findCols(data[0],{puesto:'puesto',descripcion:'descripcion',sueldo_nuevo:'sueldonuevo',sueldo_anterior:'sueldoanterior'});
  if(!('puesto' in idx)){r.err=1;return r;}
  var docs=[],lookup={};
  for(var i=1;i<data.length;i++){var row=data[i];if(!row[idx.puesto])continue;var p=String(row[idx.puesto]||'');var d={puesto:{stringValue:p},descripcion:{stringValue:String(row[idx.descripcion]||'')},sueldo_nuevo:{doubleValue:NUM(row[idx.sueldo_nuevo])},c011:{doubleValue:NUM(row[7])},c013:{doubleValue:NUM(row[8])},c014:{doubleValue:NUM(row[9])},c015:{doubleValue:NUM(row[10])},c054:{doubleValue:NUM(row[15])},c057:{doubleValue:NUM(row[16])},c058:{doubleValue:NUM(row[17])},c061:{doubleValue:NUM(row[18])},c064:{doubleValue:NUM(row[20])},quincena:{stringValue:q}};d.__id='tab_'+p;docs.push(d);lookup[p]={sueldo_nuevo:NUM(row[idx.sueldo_nuevo]),c011:NUM(row[7]),c013:NUM(row[8]),c014:NUM(row[9]),c015:NUM(row[10]),c054:NUM(row[15]),c057:NUM(row[16]),c058:NUM(row[17]),c061:NUM(row[18]),c064:NUM(row[20])};}
  r.ok=await uploadBatch('ft_tabulador',docs);
  DATA.tabulador=Object.assign(DATA.tabulador||{},lookup);sessionStorage.setItem('ft_tabulador',JSON.stringify(DATA.tabulador));
  $id('progress-fill').style.width='80%';return r;
}

async function cargarEscalafonHoja(data){
  var r={nombre:'Escalafón',ok:0,err:0};
  if(data.length<2){r.err=1;return r;}
  var idx=findCols(data[0],{puesto:'puesto',descripcion:'descripcion',rama:'rama',esc:'esc'});
  if(!('puesto' in idx)){r.err=1;return r;}
  var docs=[],lookup={};
  for(var i=1;i<data.length;i++){var row=data[i];if(!row[idx.puesto])continue;var p=String(row[idx.puesto]||'');var d={puesto:{stringValue:p},descripcion:{stringValue:String(row[idx.descripcion]||'')},rama_esc:{stringValue:String(row[idx.rama]||'')},esc:{stringValue:String(row[idx.esc]||'')}};d.__id='esc_'+p;docs.push(d);lookup[p]={descripcion:String(row[idx.descripcion]||''),rama_esc:String(row[idx.rama]||''),esc:String(row[idx.esc]||'')};}
  r.ok=await uploadBatch('ft_escalafon',docs);
  DATA.escalafon=Object.assign(DATA.escalafon||{},lookup);sessionStorage.setItem('ft_escalafon',JSON.stringify(DATA.escalafon));
  return r;
}

async function cargarClasificacionHoja(data){
  var r={nombre:'Clasificación',ok:0,err:0};
  if(data.length<2){r.err=1;return r;}
  var idx=findCols(data[0],{clave:'categoria',descripcion:'descripcion',clasificacion:'clasificacion'});
  if(!('clave' in idx)){r.err=1;return r;}
  var docs=[];
  for(var i=1;i<Math.min(data.length,5000);i++){var row=data[i];if(!row[idx.clave])continue;var d={clave_categoria:{stringValue:String(row[idx.clave]||'')},descripcion_categoria:{stringValue:String(row[idx.descripcion]||'')},clave_clasificacion_categoria:{stringValue:String(row[idx.clasificacion]||'')},regimen:{stringValue:String(row[1]||'')}};d.__id='clas_'+String(row[idx.clave]||'');docs.push(d);}
  r.ok=await uploadBatch('ft_clasificacion',docs);return r;
}

async function registrarCarga(quincena,resultados){
  var doc={fields:{quincena:{stringValue:quincena},fecha:{timestampValue:new Date().toISOString()},resultados:{stringValue:JSON.stringify(resultados)},usuario:{stringValue:(getUsuario()&&getUsuario().nombre)||'anon'}}};
  try{var url=FB_BASE+'/ft_cargas_quincena?documentId='+quincena+'&key='+FB_KEY;await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(doc)});}catch(e){console.warn('registro carga:',e);}
}
</script>
