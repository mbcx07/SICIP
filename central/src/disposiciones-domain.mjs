export const OFICINAS={FUERZA:'Oficina de Fuerza de Trabajo',RETIRO:'Oficina de Retiro Laboral'};
export const DISPOSICIONES={FAMILIAR:'Familiar · pensión alimenticia',MERCANTIL:'Mercantil · embargo',OTRA:'Otra disposición'};
export const MOVIMIENTOS={INCLUSION:'Inclusión',MODIFICACION:'Modificación',RETENCION:'Retención',CANCELACION:'Cancelación',INFORMACION:'Solicitud de información',REEXPEDICION:'Reexpedición de cheques',INFORME_CANTIDADES:'Informe de cantidades aplicadas'};
export const ESTADOS={RECIBIDA:'Recibida',BUSQUEDA:'En búsqueda / validación',ANALISIS:'En análisis',DATOS_PENDIENTES:'Pendiente de datos',PROGRAMADA:'Programada',APLICADA:'Aplicada / en seguimiento',NO_TRABAJADOR:'Respondida: no trabajador IMSS',CONCLUIDA:'Concluida',ANULADA:'Registro anulado por corrección'};
export const FIRMANTES=[{nombre:'Moisés Beltrán Castro',cargo:'Jefe del Departamento de Personal'},{nombre:'Natalia Quirós Vargas',cargo:'Jefa de la Oficina de Retiro Laboral'},{nombre:'Geraska Penelope Aguilar Salazar',cargo:'Jefa de la Oficina de Fuerza de Trabajo'}];
export const BUSQUEDAS={PENDIENTE:'Pendiente',COINCIDE:'Coincidencia localizada',SIN_COINCIDENCIA:'Sin coincidencia',NO_APLICA:'No aplica'};
export const MOVIMIENTOS_RETIRO=['INCLUSION','RETENCION','CANCELACION'];
export const fechaValida=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function periodoQuincena(q){if(!/^20\d{2}0(?:0[1-9]|1\d|2[0-4])$/.test(q||''))throw Error('Selecciona una quincena válida.');const year=Number(q.slice(0,4)),n=Number(q.slice(-2)),month=Math.ceil(n/2);return {quincena:q,desde:`${year}-${String(month).padStart(2,'0')}-${n%2?'01':'16'}`,hasta:new Date(Date.UTC(year,month-(n%2?1:0),n%2?15:0)).toISOString().slice(0,10)};}
export function quincenaActual(day){return day.slice(0,4)+'0'+String((Number(day.slice(5,7))-1)*2+(Number(day.slice(8,10))<=15?1:2)).padStart(2,'0');}
export function validarDisposicion(raw,hoy){const d={},require=(v,msg)=>{if(!v)throw Error(msg);};
 for(const [key,max]of Object.entries({oficina:15,estado:25,matricula:30,nombre:220,situacion:25,tipo:20,movimiento:30,numero_oficio:120,juzgado:220,expediente:120,tipo_beneficio:50,beneficiario:220,mes_inclusion:7,medio:15,observaciones:2500,respuesta_referencia:300,tesoreria_referencia:300,bancarios:20,medio_pago:30,busqueda_nominal:25,busqueda_siap:25,busqueda_ptdam:25,calculo_referencia:1500,relacionada:36,otra_disposicion:250,analisis:4000,conclusion:4000})){require(raw[key]==null||typeof raw[key]==='string','Campo inválido: '+key);d[key]=String(raw[key]||'').trim();require(d[key].length<=max,'Campo demasiado largo: '+key);}
 for(const key of ['fecha_oficio','fecha_recepcion','fecha_gestion','fecha_inicio','fecha_inclusion','sello_juridico','respuesta_fecha','tesoreria_fecha','retro_desde','retro_hasta','fecha_compromiso','fecha_conclusion']){d[key]=raw[key]||'';require(!d[key]||fechaValida(d[key]),'Fecha inválida: '+key);}
 d.sin_matricula=raw.sin_matricula===true;
 const recepcion=['RECIBIDA','BUSQUEDA','ANALISIS','DATOS_PENDIENTES'].includes(d.estado);
 require(OFICINAS[d.oficina]&&ESTADOS[d.estado],'Selecciona oficina y estado.');
 require((!d.tipo&&recepcion)||DISPOSICIONES[d.tipo],'Indica el tipo de disposición.');
 require(d.tipo!=='OTRA'||d.otra_disposicion,'Especifica qué tipo de disposición se recibió.');if(d.tipo!=='OTRA')d.otra_disposicion='';
 require((!d.movimiento&&recepcion)||MOVIMIENTOS[d.movimiento],'Indica el movimiento analizado.');
 require(d.oficina!=='RETIRO'||!d.movimiento||MOVIMIENTOS_RETIRO.includes(d.movimiento),'Retiro Laboral admite inclusión, retención o cancelación.');
 require((!d.situacion&&recepcion)||['ACTIVO','JUBILADO','PENSIONADO','NO_LOCALIZADO'].includes(d.situacion),'Indica la situación de la persona.');
 require(!d.situacion||d.oficina!=='FUERZA'||['ACTIVO','NO_LOCALIZADO'].includes(d.situacion),'Las disposiciones de jubilados y pensionados corresponden a Retiro Laboral.');
 require(!d.situacion||d.oficina!=='RETIRO'||['JUBILADO','PENSIONADO'].includes(d.situacion),'Retiro Laboral corresponde a jubilados o pensionados.');
 require(d.numero_oficio&&d.fecha_recepcion&&d.fecha_gestion&&(recepcion||d.fecha_oficio),'Captura oficio, recepción y fecha de gestión; completa la fecha del oficio al analizar.');
 require((!d.fecha_oficio||d.fecha_oficio<=d.fecha_recepcion)&&d.fecha_recepcion<=d.fecha_gestion&&d.fecha_gestion<=hoy,'Las fechas deben seguir el orden oficio, recepción y gestión; la gestión no puede ser futura.');
 require(['FISICO','DIGITAL'].includes(d.medio),'Indica si la recepción fue física o digital.');
 require((!d.matricula||/^[A-Za-z0-9._-]{1,30}$/.test(d.matricula))&&(recepcion||d.sin_matricula||d.matricula),'Selecciona una matrícula o indica que no está localizada.');
 if(!recepcion&&d.sin_matricula)require(d.nombre,'Captura el nombre de la persona afectada.');
 require(!d.fecha_compromiso||d.fecha_compromiso>=d.fecha_recepcion,'El compromiso de seguimiento no puede ser anterior a la recepción.');
 require(!d.fecha_conclusion||d.fecha_conclusion>=d.fecha_recepcion&&d.fecha_conclusion<=d.fecha_gestion,'La conclusión debe ubicarse entre la recepción y la gestión registrada.');
 if(d.estado==='CONCLUIDA')require(d.analisis.length>=5&&d.conclusion.length>=5&&d.fecha_conclusion,'Para concluir registra el análisis, la conclusión y su fecha.');
 require(!d.mes_inclusion||/^20\d{2}-(?:0[1-9]|1[0-2])$/.test(d.mes_inclusion),'Mes de inclusión inválido.');require(!d.relacionada||/^[a-f0-9-]{36}$/.test(d.relacionada),'Referencia relacionada inválida.');
 for(const key of ['busqueda_nominal','busqueda_siap','busqueda_ptdam']){d[key]||='PENDIENTE';require(BUSQUEDAS[d[key]],'Resultado de búsqueda inválido.');}
 d.bancarios||='PENDIENTES';require(['PENDIENTES','SOLICITADOS','COMPLETOS','NO_APLICA'].includes(d.bancarios),'Situación bancaria inválida.');d.medio_pago||='PENDIENTE';require(['PENDIENTE','TRANSFERENCIA','CHEQUE_BENEFICIARIO','CHEQUE_CONSEJO','RETENCION_TRABAJADOR','NO_APLICA'].includes(d.medio_pago),'Medio de pago inválido.');
 if(['PROGRAMADA','APLICADA'].includes(d.estado)){require(d.fecha_inicio,'Indica la fecha de inicio del movimiento.');if(d.movimiento==='INCLUSION')require(d.beneficiario&&d.mes_inclusion,'La inclusión programada o aplicada requiere beneficiario y mes de inclusión.');}
 if(d.estado==='APLICADA')require(d.fecha_inclusion&&d.fecha_inclusion<=hoy,'Registra la fecha real de inclusión/aplicación, sin fecha futura.');
 if(d.estado==='NO_TRABAJADOR'){require(d.oficina==='FUERZA'&&d.sin_matricula,'No trabajador IMSS requiere búsqueda sin matrícula localizada en Fuerza de Trabajo.');require(d.busqueda_nominal==='SIN_COINCIDENCIA'&&d.busqueda_siap==='SIN_COINCIDENCIA'&&['SIN_COINCIDENCIA','NO_APLICA'].includes(d.busqueda_ptdam),'Documenta la búsqueda nominal, SIAP y la revisión adicional PTDAM.');require(d.respuesta_fecha&&d.respuesta_referencia,'Registra la fecha y referencia de respuesta a Jurídicos.');}
 if(d.estado==='ANULADA')require(d.observaciones.length>=5,'Explica la anulación del registro. La cancelación judicial se captura como movimiento.');
 for(const key of ['respuesta_fecha','tesoreria_fecha'])require(!d[key]||d[key]<=hoy,'Una comunicación realizada no puede tener fecha futura.');require(!d.retro_desde&&!d.retro_hasta||d.retro_desde&&d.retro_hasta&&d.retro_desde<=d.retro_hasta,'Completa un periodo retroactivo válido.');
 for(const key of ['monto_ordenado','importe_retroactivo','descuento_quincenal','acumulado_aplicado','porcentaje']){const value=raw[key];d[key]=value==null||value===''?null:Number(value);require(d[key]===null||Number.isFinite(d[key])&&d[key]>=0&&d[key]<1e12,'Cantidad inválida: '+key);}require(d.porcentaje===null||d.porcentaje<=100,'El porcentaje no puede exceder 100.');require(d.importe_retroactivo===null||d.sello_juridico&&d.retro_desde&&d.calculo_referencia,'Documenta sello de Jurídicos, periodo y referencia del cálculo retroactivo.');
 return d;
}
export function resumenDisposiciones(rows){const byOffice=Object.fromEntries(Object.keys(OFICINAS).map(k=>[k,0])),byState=Object.fromEntries(Object.keys(ESTADOS).map(k=>[k,0]));for(const r of rows){byOffice[r.oficina]++;byState[r.estado]++;}return {total:rows.length,oficinas:byOffice,estados:byState,pendientes:rows.filter(r=>!['CONCLUIDA','NO_TRABAJADOR','ANULADA'].includes(r.estado)).length};}
export function pendientesDisposicion(d){if(['CONCLUIDA','ANULADA','NO_TRABAJADOR'].includes(d.estado))return [];const items=[];if(d.estado==='RECIBIDA'||d.estado==='BUSQUEDA')items.push('Verificar la persona y la instrucción recibida.');if(d.movimiento==='INCLUSION'&&!d.beneficiario)items.push('Identificar al beneficiario.');if(d.bancarios==='SOLICITADOS')items.push('Dar seguimiento a los datos bancarios solicitados a Jurídicos.');if(d.oficina==='FUERZA'&&!d.respuesta_fecha)items.push('Registrar la respuesta a Jurídicos.');if(d.oficina==='FUERZA'&&d.movimiento==='RETENCION'&&!d.tesoreria_fecha)items.push('Informar a Tesorería sobre la retención de cheques.');if(d.estado==='PROGRAMADA')items.push('Confirmar la inclusión/aplicación en la fecha programada.');return items;}

export const SEMAFOROS={ROJO:'Compromiso vencido',AMARILLO:'Pendiente / en seguimiento',VERDE:'Concluida / respondida',GRIS:'Registro anulado'};
export function semaforoDisposicion(d,hoy){
 const color=d.estado==='ANULADA'?'GRIS':['CONCLUIDA','NO_TRABAJADOR'].includes(d.estado)?'VERDE':d.fecha_compromiso&&d.fecha_compromiso<hoy?'ROJO':'AMARILLO';
 const desde=d.fecha_gestion||d.fecha_recepcion,dias=fechaValida(desde)&&fechaValida(hoy)?Math.max(0,Math.round((Date.parse(hoy)-Date.parse(desde))/86400000)):null;
 return {color,etiqueta:SEMAFOROS[color],fecha_compromiso:d.fecha_compromiso||null,dias_sin_gestion:dias,criterio:color==='ROJO'?'La fecha de compromiso interno venció y el trámite sigue abierto.':color==='VERDE'?'El seguimiento está concluido o se respondió que no es trabajador IMSS.':color==='GRIS'?'La anulación se conserva en el historial.':d.fecha_compromiso?'El trámite sigue abierto y su compromiso no está vencido.':'El trámite sigue abierto; no hay fecha de compromiso registrada.'};
}

export const tipoDisposicion=d=>d.tipo==='OTRA'?'Otra · '+(d.otra_disposicion||'Sin especificar'):DISPOSICIONES[d.tipo]||'Por determinar';
