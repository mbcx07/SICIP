import catalog from './contratacion-catalogo.json' with {type:'json'};
export {catalog};
export const TYPES={CONTRATO:'Contrato / sustitución',TIEMPO_EXTRA:'Tiempo extra',NIVELACION:'Nivelación',GUARDIA_FESTIVA:'Guardia festiva'};
export const DAYS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
export const DESK=new Set(['ADMIN','ADMINISTRADOR','AREA_PERSONAL','FUERZA_TRABAJO']);
export const STAFF=new Set([...DESK,'JEFE_SERVICIO']);
export function dateValue(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const n=Date.parse(value+'T12:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value?n:null;}
const weekdays=v=>Array.isArray(v)?[...new Set(v.filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort():[];
export function sanitize(input={}){
 const out={};for(const key of ['tipo','motivo','titular','suplente','plaza','inicio','fin','horario_codigo','horario','unidad','servicio','jefe','jefe_dependencia','firmante_jefe','firmante_dependencia','jornada_id','metodo_jornadas','observaciones','observaciones_extra'])out[key]=String(input[key]??'').trim().slice(0,['observaciones','observaciones_extra'].includes(key)?2000:250);
 out.horas_dia=input.horas_dia===''||input.horas_dia==null?null:Number(input.horas_dia);out.descansos_titular=weekdays(input.descansos_titular);out.descansos_suplente=weekdays(input.descansos_suplente);out.descansos_confirmados=input.descansos_confirmados===true;out.infectocontagiosidad=input.infectocontagiosidad===true;out.emanaciones=input.emanaciones===true;out.dias_seleccionados=Array.isArray(input.dias_seleccionados)?[...new Set(input.dias_seleccionados.filter(v=>dateValue(v)!=null))].sort():null;return out;
}
export function buildPlan(input){
 const d=sanitize(input),start=dateValue(d.inicio),end=dateValue(d.fin);if(start==null||end==null||end<start||end-start>3660*86400000)return {dias:[],jornadas:0,total_horas:0};const selected=d.dias_seleccionados===null?null:new Set(d.dias_seleccionados);const dias=[];
 for(let t=start;t<=end;t+=86400000){const fecha=new Date(t).toISOString().slice(0,10),weekday=new Date(t).getUTCDay(),restTitular=d.descansos_titular.includes(weekday),restSuplente=d.descansos_suplente.includes(weekday);const cubrir=selected?selected.has(fecha):(d.motivo==='6TO_Y_7MO'?restTitular:!restSuplente);dias.push({fecha,weekday,descanso_titular:restTitular,descanso_suplente:restSuplente,cubrir,horas:cubrir&&Number.isFinite(d.horas_dia)?d.horas_dia:0});}
 const excel=d.metodo_jornadas==='EXCEL';const jornadas=excel?dias.length/(catalog.horarios.find(h=>h.codigo===d.horario_codigo)?.ciclo_dias||1):dias.filter(x=>x.cubrir).length;return {dias,jornadas,total_horas:Math.round((excel?jornadas*(d.horas_dia||0):dias.reduce((n,r)=>n+r.horas,0))*100)/100};
}
export function check(input,context={},draft=false){
 const d=sanitize(input),errors=[],warnings=[],plaza=context.plaza;const need=(ok,msg)=>{if(!ok)errors.push(msg);};
 if(d.tipo)need(!!TYPES[d.tipo],'Tipo de cobertura inválido.');if(d.motivo)need(catalog.motivos.some(m=>m.id===d.motivo),'Motivo no reconocido.');if(d.inicio)need(dateValue(d.inicio)!=null,'Fecha inicial inválida.');if(d.fin)need(dateValue(d.fin)!=null,'Fecha final inválida.');if(d.inicio&&d.fin)need(dateValue(d.inicio)<=dateValue(d.fin),'La fecha final no puede ser anterior al inicio.');
 if(dateValue(d.inicio)!=null&&dateValue(d.fin)!=null)need(dateValue(d.fin)-dateValue(d.inicio)<=3660*86400000,'El periodo supera el límite de calendario de esta captura.');
 if(d.horas_dia!==null)need(Number.isFinite(d.horas_dia)&&d.horas_dia>0&&d.horas_dia<=24,'Las horas diarias deben ser mayores de cero y no superar 24.');
 if(d.titular&&d.suplente)need(d.titular!==d.suplente,'El titular y el suplente deben ser personas distintas.');
 if(plaza&&d.titular)need([plaza.ocupante_matricula,plaza.titular_matricula].includes(d.titular),'El titular seleccionado no corresponde a esta plaza en el corte.');
 if(plaza&&String(plaza.tipo_plaza_codigo)==='14')need(false,'Esta plaza es Cubre vacaciones base y el programa de origen la marca sin presupuesto para cobertura. Selecciona otra plaza.');
 const horario=catalog.horarios.find(h=>String(h.codigo)===d.horario_codigo);
 if(horario?.minutos&&d.horas_dia!==null&&d.horas_dia>Math.round(horario.minutos/60*100)/100+.000001)need(false,'Las horas solicitadas superan la jornada del horario seleccionado.');
 const plan=buildPlan(d);
 if(d.dias_seleccionados)need(d.dias_seleccionados.every(day=>day>=d.inicio&&day<=d.fin),'Hay jornadas seleccionadas fuera del periodo.');
 if(!draft){need(!!d.tipo,'Selecciona el tipo de contratación.');need(!!d.motivo,'Selecciona el motivo de sustitución.');need(!!d.plaza,'Selecciona la plaza que se cubrirá.');need(!!d.suplente,'Selecciona al suplente.');need(!!d.titular||d.motivo==='PLAZA_VACANTE','Selecciona al titular; sólo Plaza vacante permite dejarlo vacío.');if(!d.titular&&plaza)need(!plaza.ocupante_matricula,'La plaza tiene ocupante y requiere identificar a la persona cubierta.');need(!!d.inicio&&!!d.fin,'Captura inicio y término del periodo.');need(!!d.horario,'Captura o selecciona el horario.');need(!!d.unidad&&!!d.servicio,'Indica unidad y servicio solicitante.');need(d.horas_dia!==null,'Captura las horas por jornada.');need(plan.jornadas>0,'Selecciona al menos una jornada de cobertura.');}
 if(horario?.ciclo_dias>1)warnings.push('Horario acumulado o nocturno: el programa original divide los días del periodo entre el ciclo del horario; revisa las jornadas resultantes.');
 if(plan.dias.some(day=>day.cubrir&&day.descanso_suplente))warnings.push('Se solicita cobertura en un descanso del suplente. Debe revisarse al autorizar.');
 if(plaza?.restriccion_origen)warnings.push('La plaza tiene una marca de restricción en el corte. Personal debe revisar su procedencia.');
 if(d.tipo==='NIVELACION'&&plaza&&context.suplente?.puesto_padron===plaza.puesto)warnings.push('El puesto del suplente coincide con el de la plaza a cubrir; revisa la procedencia de la nivelación.');
 return {data:d,plan,errors:[...new Set(errors)],warnings};
}
