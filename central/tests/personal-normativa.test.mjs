import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogo,identificarClave as id,referenciaHorario as horario} from '../src/personal-normativa.mjs';
test('TC 0 es Estatuto, conservando cero y código original sin confundir vacío',()=>{
 for(const x of [0,'0','00'])assert.equal(id('tipo_contratacion_codigo',x).referencias[0].descripcion,'Estatuto de Confianza A');
 assert.equal(id('tipo_contratacion_codigo','1').referencias[0].descripcion,'Confianza');
 for(const x of ['',null,undefined,'11'])assert.equal(id('tipo_contratacion_codigo',x).estado,'PENDIENTE');
 assert.equal(id('tipo_contratacion_codigo','8').original,'8');
 assert.equal(id('tipo_contratacion_codigo','8').referencias[0].descripcion,'Sustituto');
});
test('el campo separa TC, incidencia, concepto y claves de baja',()=>{
 assert.equal(id('incidencia_aps','08').referencias[0].descripcion,'SUSTITUCIÓN');
 assert.equal(id('tipo_contratacion_codigo','08').referencias[0].descripcion,'Sustituto');
 assert.equal(id('concepto','737').referencias[0].regimen,'TC_00');
 assert.equal(id('incidencia_aps','E37').referencias[0].descripcion,'TIEMPO EXTRAORDINARIO');
 for(const field of ['status_codigo','tipo_plaza_codigo','marca_ocupacion_codigo'])assert.equal(id(field,'35').estado,'PENDIENTE');
 assert.equal(id('baja_codigo','B33').estado,'PENDIENTE');
 assert.equal(id('incidencia_aps','33').estado,'PENDIENTE');
 assert.equal(id('incidencia_aps','B33').referencias[0].descripcion,'TRABAJADOR PASÓ A JUBILADO');
});
test('horario Estatuto exacto antes que prefijo, sin inventar días de descanso',()=>{
 const e=horario('062E');assert.equal(e.tipo,'CATALOGO_ESTATUTO');assert.match(e.referencias[0].descripcion,/10 Días Descansa 4/);assert.equal(e.registros_semanales,null);
 assert.equal(horario('C37E').tipo,'CATALOGO_ESTATUTO');
 assert.equal(horario('D735').registros_semanales,3);
 assert.equal(horario('C701').registros_semanales,3.5);
 assert.equal(horario('0301').registros_semanales,5);
 for(const x of ['301','X999','UNKNOWN',''])assert.equal(horario(x).estado,'PENDIENTE');
 assert.equal(horario('F714').requiere_calendario,true);
});
test('catálogos mantienen fuentes y anomalías de la copia, sin completar por secuencia',()=>{
 assert.equal(catalogo.fuentes.length,8);
 assert.equal(catalogo.horarios_estatuto.length,67);
 assert.equal(new Set(catalogo.incidencias_aps.map(r=>r.clave)).size,138);
 assert.equal(catalogo.incidencias_aps.filter(r=>r.clave==='PSP').length,2);
 assert.equal(id('incidencia_aps','SS3').referencias[0].descripcion.includes('Clave:'),false);
 assert.equal(id('horario_estatuto','F66E').referencias[0].turno,'1');
 assert.equal(id('horario_estatuto','037E').estado,'PENDIENTE');
 assert.ok(catalogo.fuentes.every(r=>/^[a-f0-9]{64}$/.test(r.sha256)));
 assert.equal(catalogo.estado,'REFERENCIA_DOCUMENTAL_NO_PUBLICADA');
});
test('horarios médicos conservan contexto de servicio, sin catálogo universal por categoría',()=>{
 const grupos=catalogo.horarios_exclusivos_por_categoria.filter(r=>r.categorias.includes('20360480'));
 assert.equal(grupos.length,2);assert.ok(!grupos[0].horarios.includes('F702'));assert.ok(grupos[1].horarios.includes('F702'));
 assert.equal(catalogo.horarios_exclusivos_por_categoria.filter(r=>r.categorias.includes('20360280')).length,2);
});

test('033 identifica baja numérica directamente, sin quitar prefijos APS ni perder ámbitos',()=>{
 const r=id('baja_codigo','33');assert.equal(r.estado,'IDENTIFICADA');assert.equal(r.referencias[0].fuente,'1A74-003-033');assert.equal(r.referencias[0].pagina,261);assert.equal(r.referencias[0].ambito,'JUBILADOS_PENSIONADOS');
 assert.match(r.referencias[0].descripcion,/Jubilado/);
 assert.equal(id('baja_codigo','B33').estado,'PENDIENTE');
 assert.equal(id('baja_codigo','35').referencias.length,2);
 assert.equal(id('baja_codigo','27').referencias.length,2);
 assert.equal(id('baja_codigo','1').referencias[0].ambito,'JUBILADOS_PENSIONADOS');
 assert.equal(id('baja_codigo',0).referencias[0].descripcion,'Vigente');
 for(const x of ['',null,undefined,'81','82'])assert.equal(id('baja_codigo',x).estado,'PENDIENTE');
});
test('nuevas contrataciones no mezclan becario, becado y residente',()=>{
 assert.equal(id('tipo_contratacion_codigo','5').referencias[0].descripcion,'Becarios');
 assert.equal(id('tipo_contratacion_codigo','7').referencias[0].descripcion,'Becados');
 assert.equal(id('tipo_contratacion_codigo','9').referencias[0].descripcion,'Médicos Residentes');
 for(const x of ['10','11','50','51'])assert.equal(id('tipo_contratacion_codigo',x).estado,'PENDIENTE');
});
test('MO definitiva no significa plaza sin ocupante, y TC, TP y MO mantienen espacios distintos',()=>{
 assert.equal(id('marca_ocupacion_codigo',0).referencias[0].descripcion,'Definitiva');
 assert.equal(id('marca_ocupacion_codigo','20').referencias[0].descripcion,'Definitiva Estatuto A');
 assert.match(id('marca_ocupacion_codigo','99').referencias[0].descripcion,/sin Titular/);
 assert.equal(id('tipo_contratacion_codigo','5').referencias[0].descripcion,'Becarios');
 assert.equal(id('tipo_plaza_codigo','5').referencias[0].descripcion,'Programas Especiales de Confianza');
 assert.equal(id('marca_ocupacion_codigo','5').referencias[0].descripcion,'Pasó a Becario');
 for(const x of ['62','63','64','65','82'])assert.equal(id('marca_ocupacion_codigo',x).estado,'PENDIENTE');
});
test('TP parcial y Status contextual no se rellenan con inferencias',()=>{
 assert.equal(id('tipo_plaza_codigo','53').referencias[0].pagina,14);
 assert.equal(id('tipo_plaza_codigo','15').referencias[0].descripcion,'Programas Especiales de Base');
 assert.equal(id('tipo_plaza_codigo','11').referencias[0].descripcion,'Plazas Operativas');
 for(const x of ['1','2','100','4'])assert.equal(id('status_codigo',x).estado,'PENDIENTE');
 assert.equal(catalogo.status_contextuales.length,4);
 assert.equal(catalogo.status_contextuales.filter(r=>r.pagina===244).length,3);
});

test('aclaración del usuario resuelve TP 13/14 sin borrar contradicción documental',()=>{
 for(const [clave,nombre] of [['13','Cubre Descansos'],['14','Cubre Vacaciones']]){
  const r=id('tipo_plaza_codigo',clave);assert.equal(r.estado,'IDENTIFICADA');assert.equal(r.referencias.length,1);
  const ref=r.referencias[0];assert.equal(ref.descripcion,nombre);assert.equal(ref.fuente,'ACLARACION_USUARIO');assert.equal(ref.confirmacion,'CONFIRMADO_POR_USUARIO');
  assert.deepEqual(new Set(ref.antecedentes.map(x=>x.pagina)),new Set([144,199]));
  assert.deepEqual(new Set(ref.antecedentes.map(x=>x.descripcion)),new Set(['Cubre Descansos','Cubre Vacaciones']));
 }
 assert.equal(id('tipo_plaza_codigo','11').estado,'IDENTIFICADA');
});
test('motivo de sustitución, concepto de sueldo y tipo de plaza no se intercambian',()=>{
 assert.match(id('motivo_sustitucion','12').referencias[0].descripcion,/Nivelación/);
 assert.equal(id('tipo_plaza_codigo','12').estado,'PENDIENTE');
 assert.equal(id('concepto','12').estado,'PENDIENTE');
 assert.equal(id('motivo_sustitucion','14').estado,'IDENTIFICADA');
 assert.equal(id('tipo_plaza_codigo','14').estado,'IDENTIFICADA');
 assert.equal(id('concepto','008').referencias[0].descripcion,'Sueldo de Sustituto');
 assert.equal(id('incidencia_aps','008').estado,'PENDIENTE');
 assert.equal(catalogo.motivos_sustitucion.length,20);
});
test('CCT aporta tablas sin sustituir régimen Estatuto, vigencias ni opciones de pago',()=>{
 assert.equal(catalogo.cct.vacaciones.minimo_anual_texto,16);
 assert.equal(catalogo.cct.vacaciones.tope_texto,20);
 assert.deepEqual(catalogo.cct.vacaciones.radiaciones_periodos[0].periodos,[7,8,7]);
 assert.deepEqual(catalogo.cct.vacaciones.radiaciones_periodos[5].periodos,[10,10,10]);
 assert.deepEqual(catalogo.cct.vacaciones.ayuda_normal.map(x=>x.dias_salario),[23,25,27,29,31]);
 assert.equal(catalogo.cct.vacaciones.opciones_extra_20.filter(r=>r.dias_disfrute===0).length,2);
 assert.equal(catalogo.cct.vacaciones.temporales.forma_textual,'en forma interrumpida');
 const cct=catalogo.fuentes.find(r=>r.clave==='CCT-2025-2027');
 assert.equal(cct.vigencia_desde,'2025-10-16');assert.equal(cct.vigencia_hasta,null);
 assert.equal(catalogo.estado,'REFERENCIA_DOCUMENTAL_NO_PUBLICADA');
});
