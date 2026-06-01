<script>
// ---- GUARDAR CÁLCULO ----
async function guardarCalculo(){
  if(!STATE.calculo){showToast('Primero realiza un cálculo','warning');return;}
  var c=STATE.calculo; var u=getUsuario(); var usuario=u?(u.nombre||u.email||u.matricula||'anon'):'anon';
  var doc={fields:{
    fecha:{timestampValue:new Date().toISOString()},quincena:{stringValue:STATE.quincena},
    matricula_sustituto:{stringValue:c.sust_matricula},nombre_sustituto:{stringValue:c.sust_nombre},
    puesto_sustituto:{stringValue:c.sust_puesto},descripcion_puesto_sustituto:{stringValue:c.sust_desc},
    matricula_nivelar:{stringValue:c.niv_matricula},nombre_nivelar:{stringValue:c.niv_nombre},
    puesto_nivelar:{stringValue:c.niv_puesto},descripcion_puesto_nivelar:{stringValue:c.niv_desc},
    rama_sustituto:{stringValue:c.sust_rama},rama_nivelar:{stringValue:c.niv_rama},
    esc_sustituto:{integerValue:c.sust_esc},esc_nivelar:{integerValue:c.niv_esc},
    validacion_rama:{stringValue:c.val_rama},validacion_categoria_inmediata:{stringValue:c.val_inmediata},
    total_sustituto:{doubleValue:c.total_sustituto},total_nivelar:{doubleValue:c.total_nivelar},
    diferencia:{doubleValue:c.diferencia},dias:{integerValue:c.dias},factor:{doubleValue:c.factor},
    importe:{doubleValue:c.importe},usuario:{stringValue:usuario}
  }};
  try{
    var id='calc_'+Date.now()+'_'+c.sust_matricula;
    var url=FB_BASE+'/ft_calculos_nivelacion?documentId='+id+'&key='+FB_KEY;
    var resp=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(doc)});
    if(resp.ok) showToast('✅ Cálculo guardado en historial','success');
    else{var err=await resp.json();showToast('❌ Error al guardar: '+(err.error&&err.error.message||'Desconocido'),'error');}
  }catch(e){showToast('❌ Error: '+e.message,'error');}
}

// ---- EXPORTAR PDF ----
function exportarPDF(){
  if(!STATE.calculo){showToast('Primero realiza un cálculo','warning');return;}
  var c=STATE.calculo; var {jsPDF}=window.jspdf; var doc=new jsPDF({orientation:'landscape'});
  doc.setFontSize(16); doc.text('Calculadora de Nivelación',14,20);
  doc.setFontSize(10); doc.text('Quincena: '+STATE.quincena+' | Fecha: '+new Date().toLocaleDateString('es-MX'),14,28);
  var rows=[
    ['SUSTITUTO','','A NIVELAR',''],['Matrícula',c.sust_matricula,'Matrícula',c.niv_matricula],
    ['Nombre',c.sust_nombre,'Nombre',c.niv_nombre],['Categoría',c.sust_puesto,'Categoría',c.niv_puesto],
    ['Descripción',c.sust_desc,'Descripción',c.niv_desc],['TC',c.sust_tc,'TC',c.niv_tc],
    ['Rama',c.sust_rama,'Rama',c.niv_rama],['ESC',String(c.sust_esc),'ESC',String(c.niv_esc)],
    ['Antigüedad',c.sust_ant_a+'a/'+c.sust_ant_q+'q/'+c.sust_ant_d+'d','Antigüedad',c.niv_ant_a+'a/'+c.niv_ant_q+'q/'+c.niv_ant_d+'d'],[''],
    ['01/02 Sueldo',FMT(c.sust_01),'01/02 Sueldo',FMT(c.niv_01)],['011',FMT(c.sust_011),'011',FMT(c.niv_011)],
    ['013',FMT(c.sust_013),'013',FMT(c.niv_013)],['014',FMT(c.sust_014),'014',FMT(c.niv_014)],
    ['015',FMT(c.sust_015),'015',FMT(c.niv_015)],['022 Antigüedad',FMT(c.sust_022),'022 Antigüedad',FMT(c.niv_022)],
    ['054',FMT(c.sust_054),'054',FMT(c.niv_054)],['057',FMT(c.sust_057),'057',FMT(c.niv_057)],
    ['058',FMT(c.sust_058),'058',FMT(c.niv_058)],['061',FMT(c.sust_061),'061',FMT(c.niv_061)],
    ['064',FMT(c.sust_064),'064',FMT(c.niv_064)],['TOTAL',FMT(c.total_sustituto),'TOTAL',FMT(c.total_nivelar)],
    ['DIFERENCIA','','DIFERENCIA',FMT(c.diferencia)],[''],
    ['Días',String(c.dias),'Factor',String(c.factor)],['IMPORTE','','IMPORTE',FMT(c.importe)],[''],
    ['Validación Rama',c.val_rama,'Validación Inmediata',c.val_inmediata]
  ];
  doc.autoTable({startY:35,head:[],body:rows,theme:'grid',styles:{fontSize:7,cellPadding:2},columnStyles:{0:{fontStyle:'bold'},2:{fontStyle:'bold'}}});
  doc.save('nivelacion_'+c.sust_matricula+'_'+c.niv_matricula+'.pdf');
}

// ---- EXPORTAR CÁLCULO EXCEL ----
function exportarCalculoExcel(){
  if(!STATE.calculo){showToast('Primero realiza un cálculo','warning');return;}
  var c=STATE.calculo;
  var data=[['Concepto','SUSTITUTO','A NIVELAR'],['Matrícula',c.sust_matricula,c.niv_matricula],['Nombre',c.sust_nombre,c.niv_nombre],['Categoría',c.sust_puesto,c.niv_puesto],['Descripción',c.sust_desc,c.niv_desc],['TC',c.sust_tc,c.niv_tc],['Rama',c.sust_rama,c.niv_rama],['ESC',c.sust_esc,c.niv_esc],['Antigüedad A/Q/D',c.sust_ant_a+'/'+c.sust_ant_q+'/'+c.sust_ant_d,c.niv_ant_a+'/'+c.niv_ant_q+'/'+c.niv_ant_d],[''],['01/02 Sueldo',FMT2(c.sust_01),FMT2(c.niv_01)],['011',FMT2(c.sust_011),FMT2(c.niv_011)],['013',FMT2(c.sust_013),FMT2(c.niv_013)],['014',FMT2(c.sust_014),FMT2(c.niv_014)],['015',FMT2(c.sust_015),FMT2(c.niv_015)],['022 Antigüedad',FMT2(c.sust_022),FMT2(c.niv_022)],['054',FMT2(c.sust_054),FMT2(c.niv_054)],['057',FMT2(c.sust_057),FMT2(c.niv_057)],['058',FMT2(c.sust_058),FMT2(c.niv_058)],['061',FMT2(c.sust_061),FMT2(c.niv_061)],['064',FMT2(c.sust_064),FMT2(c.niv_064)],['TOTAL',FMT2(c.total_sustituto),FMT2(c.total_nivelar)],['DIFERENCIA','',FMT2(c.diferencia)],[''],['Días',c.dias,''],['Factor',c.factor,''],['IMPORTE','',FMT2(c.importe)],[''],['Validación Rama',c.val_rama,''],['Validación Inmediata',c.val_inmediata,''],['Quincena',STATE.quincena,''],['Fecha',new Date().toLocaleDateString('es-MX'),'']];
  var ws=XLSX.utils.aoa_to_sheet(data); var wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Nivelacion');
  XLSX.writeFile(wb,'nivelacion_'+c.sust_matricula+'_'+c.niv_matricula+'.xlsx');
}
</script>
