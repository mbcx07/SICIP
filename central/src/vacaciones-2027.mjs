import {rolMadre,completarReal,turnoEnCiclo,calendarioMixto,equivalenciaMixta} from './vacaciones-calendarios.mjs';
import {limitesProgramacion,motivoRol,validarNumero,primerPeriodo} from './vacaciones-reglas.mjs';
import {calendarioVacaciones} from './vacaciones-domain.mjs';
export const VERSION='VAC-2027-C273-C274-20260901-v3';
export const FUENTES=[{clave:'CIRCULAR-274-2027',paginas:[3,5,6,7,8]},{clave:'CIRCULAR-273-2027',paginas:[2,3,4,6,7]},{clave:'LINEAMIENTOS-CV-2027',paginas:[1,2]},{clave:'INSTRUCTIVO-CV-2027',paginas:[6,9,10,11,12,13]}];
export const ROLES=['01-18','02-02','02-16','03-02','03-17','04-02','04-19','05-03','05-24','06-07','06-21','07-05','07-19','08-02','08-16','08-30','09-13','09-29','10-18','11-01','11-16','11-30','12-14','12-28'].map((v,i)=>({numero:i+1,inicio:'2027-'+v,tipo:i%2?'B':'A'}));
export const FESTIVOS=['2027-01-01','2027-02-01','2027-03-15','2027-03-25','2027-03-26','2027-03-27','2027-05-01','2027-05-10','2027-06-06','2027-09-15','2027-09-16','2027-11-15','2027-12-25','2028-01-01'];
export const MARCAS_CCT={NORMAL:['0','1','2','3','4','9'],CUATRIMESTRAL:['0','2','5'],EXTRA20:['0','6','7','8'],ACADEMICO:['0']};
export function fecha(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Fecha inválida.');const n=Date.parse(v+'T12:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==v)throw Error('Fecha inválida.');return n;}
export function derechoEstatuto(anios){if(!Number.isInteger(anios)||anios<0||anios>50)throw Error('Antigüedad fuera de la tabla aportada (0 a 50 años).');return anios===0?0:anios<=5?15+anios:22+2*Math.floor((anios-6)/5);}
export function cuotaDias(d){
 const years=Number(d.antiguedad),n=Number(d.fase||d.numero),marca=String(d.marca),reg=d.regimen,modal=d.modalidad;
 if(!Number.isInteger(years)||years<0||years>50)throw Error('Captura años efectivos de servicio de 0 a 50, certificados por Personal.');
 if(reg==='ESTATUTO'){
  if(modal!=='NORMAL'||!['0','2','3'].includes(marca))throw Error('Estatuto utiliza modalidad normal y marcas 0, 2 o 3.');
  if(marca==='0'&&years>=6)throw Error('Circular 273, página 7: desde el sexto año no se permite marca 0; utiliza marcas 2 y 3.');
  return derechoEstatuto(years);
 }
 if(reg!=='CCT'||!MARCAS_CCT[modal]?.includes(marca))throw Error('Régimen, modalidad o marca no compatibles.');
 if(modal==='ACADEMICO'){if(!d.plan_estudios||!d.referencia)throw Error('El periodo académico requiere referencia del plan de estudios y certificación.');return 10;}
 if(modal==='EXTRA20'){if(years<20)throw Error('El extraordinario requiere 20 años efectivos.');return {'0':10,'6':15,'7':0,'8':0}[marca];}
 if(modal==='CUATRIMESTRAL'){
  if(!d.radiaciones)throw Error('Confirma exposición constante y permanente a emanaciones radiactivas.');
  if(marca==='0'){if(!Number.isInteger(n)||n<1||n>3)throw Error('Indica fase cuatrimestral 1, 2 o 3.');return [[7,8,7],[8,8,8],[8,9,8],[9,9,9],[9,10,9],[10,10,10]][Math.min(years,5)][n-1];}
  // Alternative branches require the certified days in SIAP, not an invented formula.
  const days=Number(d.dias_certificados);if(!d.referencia||!Number.isInteger(days)||days<10||days>20)throw Error('Esta opción cuatrimestral requiere días certificados (10 a 20) y referencia documental de SIAP.');return days;
 }
 if(years<1)throw Error('El primer periodo requiere un año efectivo; para sustitutos verifica los 365 días laborados.');
 if(marca==='3'){const days=Number(d.dias_certificados);if(!d.referencia||!Number.isInteger(days)||days<10||days>15)throw Error('La marca 3 requiere certificar de 10 a 15 días del segundo periodo, según recibo SIAP.');return days;}return 15+Math.min(years,5);
}
export function validarPeriodo(d){
 validarNumero(d);const total=cuotaDias(d),errors=[];if(Number(d.anio)!==2027)errors.push('Los lineamientos publicados en este módulo corresponden a programación 2027.');
 if(!String(d.numero||'').match(/^[A-Za-z0-9._-]{1,30}$/))errors.push('Indica el número oficial del periodo, sin espacios.');
 if(!d.referencia)errors.push('Captura la referencia de certificación del derecho (recibo o calendario SIAP).');
 if(!d.certificado)errors.push('Personal debe certificar el derecho antes de registrarlo.');
 if(!d.vencimiento)errors.push('Captura el vencimiento del derecho.');else fecha(d.vencimiento);
 if(d.regimen==='ESTATUTO'&&d.marca==='3')errors.push('Certifica el derecho anual con marca 2 y selecciona marca 3 en el trámite de la segunda fracción.');
 if(d.regimen==='ESTATUTO'&&d.marca==='0'&&Number(d.periodos_vencidos)<2)errors.push('Estatuto marca 0 requiere dos periodos vencidos (Circular 273, página 4).');
 if(d.modalidad==='EXTRA20'&&Number(d.antiguedad)<20)errors.push('Revisa la antigüedad efectiva.');return {total,errors};
}
export function jornadasEquivalentes(dias,patron,regimen){
 if(patron==='MIXTO')return equivalenciaMixta(dias).jornadas;
 if(patron==='SEMANAL')return dias;
 const min=regimen==='ESTATUTO'?8:7;if(!Number.isInteger(dias)||dias<min||dias>20)throw Error('La equivalencia para esta jornada sólo está definida de '+min+' a 20 días.');
 const idx=dias-7;if(patron==='NOCTURNO_3')return [4,5,5,6,7,7,8,8,9,10,10,11,11,12][idx];
 if(patron==='ACUMULADA_SD')return [3,3,4,4,4,5,5,6,6,6,7,7,8,8][idx];throw Error('Patrón de jornada no reconocido.');
}
export function calendarioLaboral(d){
 const start=fecha(d.inicio),anchor=fecha(d.ancla||d.inicio),custom=d.turnos_ciclo!=null;let cycle=String(d.ciclo||'').replace(/\s/g,'');
 if(custom){const length=Number(d.ciclo_dias||7);if(!Number.isInteger(length)||length<1||length>28||!Array.isArray(d.turnos_ciclo)||!d.turnos_ciclo.length||d.turnos_ciclo.length>28)throw Error('Confirma el ciclo y las jornadas con horas de entrada/salida.');const seen=new Set();for(const t of d.turnos_ciclo){if(!Number.isInteger(Number(t.dia))||Number(t.dia)<0||Number(t.dia)>=length||seen.has(Number(t.dia)))throw Error('Cada día del ciclo sólo puede tener una jornada; revisa duplicados.');seen.add(Number(t.dia));for(const h of [t.hora_inicio,t.hora_fin])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(h||'')))throw Error('Hora de jornada inválida.');}cycle=Array.from({length},(_,i)=>seen.has(i)?'1':'0').join('');d.ciclo=cycle;d.ciclo_dias=length;}
 if(!/^[01]{1,28}$/.test(cycle)||!cycle.includes('1'))throw Error('Selecciona o captura un ciclo laboral de 1 a 28 días y su fecha de anclaje.');
 if(d.patron==='MIXTO'&&(!custom||cycle.length!==7||cycle[5]!=='1'||cycle[6]!=='1'||cycle.slice(0,5).split('').filter(x=>x==='1').length!==1||new Date(anchor).getUTCDay()!==1))throw Error('La jornada mixta confirmada requiere sábado, domingo y una guardia entre semana con horas por día.');
 if(d.patron==='ACUMULADA_SD'&&(cycle.length!==7||cycle!=='0000011'||new Date(anchor).getUTCDay()!==1))throw Error('La equivalencia acumulada S/D requiere jornadas sábado y domingo; una guardia adicional necesita equivalencia mixta validada.');
 if(!d.calendario_confirmado)throw Error('Confirma horario, ciclo, anclaje y descansos; no se asignan por omisión.');
 if(!String(d.hora_inicio||'').match(/^\d{2}:\d{2}$/)||!String(d.hora_fin||'').match(/^\d{2}:\d{2}$/))throw Error('Captura las horas de inicio y término de jornada.');
 for(const v of [d.hora_inicio,d.hora_fin])if(Number(v.slice(0,2))>23||Number(v.slice(3))>59)throw Error('Horario inválido.');
 const fixed=d.descanso_fijo===''||d.descanso_fijo==null?null:Number(d.descanso_fijo);if(d.patron==='NOCTURNO_3'&&(!Number.isInteger(fixed)||fixed<0||fixed>6))throw Error('Selecciona el descanso semanal fijo del nocturno; el ciclo alterno no permite inferirlo.');
 const days=new Set(FESTIVOS),extras=d.festivos_adicionales||[];if(!Array.isArray(extras)||extras.length>40)throw Error('Lista de descansos obligatorios inválida.');for(const x of extras){fecha(x);days.add(x);}
 return Array.from({length:500},(_,i)=>{const t=start+i*86400000,day=new Date(t).toISOString().slice(0,10),index=((Math.round((t-anchor)/86400000)%cycle.length)+cycle.length)%cycle.length,shift=custom?turnoEnCiclo(day,{...d,ciclo_dias:cycle.length}):{},entry=shift.hora_inicio||d.hora_inicio,exit=shift.hora_fin||d.hora_fin,cross=exit<=entry,next=new Date(t+(cross?86400000:0)).toISOString().slice(0,10),motivos=[];if(cycle[index]!=='1')motivos.push('Descanso según ciclo');if(days.has(day))motivos.push('Entrada en descanso obligatorio');if(cross&&days.has(next))motivos.push('Salida en descanso obligatorio: '+next);if(cross&&fixed!=null&&new Date(t+86400000).getUTCDay()===fixed)motivos.push('Salida en descanso semanal fijo');const tipo=d.patron==='MIXTO'?(index>=5?'FIN_SEMANA':'GUARDIA_EXTRA'):d.patron==='NOCTURNO_3'?'VELADA':d.patron==='ACUMULADA_SD'?'FIN_SEMANA':'JORNADA';return {tipo,fecha:day,laborable:cycle[index]==='1',descanso_obligatorio:days.has(day)||cross&&(days.has(next)||fixed!=null&&new Date(t+86400000).getUTCDay()===fixed),hora_inicio:entry,hora_fin:exit,motivos};});
}
export function planVacaciones(d,p){
 const days=Number(d.dias),marca=String(p.marca),role=ROLES.find(r=>r.numero===Number(d.rol)),isException=!!d.fuera_calendario;
 if(!Number.isInteger(days)||days<0||days>40)throw Error('Días solicitados inválidos.');
 if(p.modalidad==='EXTRA20'&&['7','8'].includes(marca)){if(days!==0)throw Error('Esta marca no genera ausencia.');fecha(d.inicio);if(d.inicio.slice(0,4)!=='2027')throw Error('El trámite corresponde a programación 2027.');const advance=(fecha(p.vencimiento)-fecha(d.inicio))/86400000;const limit=limitesProgramacion(p);if(advance>limit.dias)throw Error(limit.motivo+' Fecha mínima: '+limit.desde+'.');return {jornadas:0,disfrute:[],inicio:d.inicio,fin:d.inicio,regreso:null,dias_derecho:0,fuentes:FUENTES,version:VERSION,sin_disfrute:true};}
 if(days<1)throw Error('Selecciona días de disfrute.');
 if((p.regimen==='ESTATUTO'&&marca==='0'||p.modalidad==='EXTRA20'||p.regimen==='CCT'&&!['1','4','9'].includes(marca))&&days!==p.total)throw Error('Esta opción exige el disfrute continuo de todos los días certificados del periodo.');
 if(p.regimen==='ESTATUTO'&&['2','3'].includes(marca)){
  const halfLow=Math.floor(p.total/2),halfHigh=Math.ceil(p.total/2);if(![halfLow,halfHigh].includes(days))throw Error('Las dos fracciones de Estatuto deben tener un número semejante de días.');
 }
 if(p.regimen==='CCT'&&['1','4','9'].includes(marca)&&p.modalidad==='NORMAL'&&(days<7||days>10))throw Error('La fracción CCT debe ser de 7 a 10 días.');
 if(!isException){if(!role)throw Error('Selecciona un rol 2027 o documenta programación fuera de calendario.');const incompatible=motivoRol(role,p,marca,days);if(incompatible)throw Error(incompatible);const shift=(fecha(d.inicio)-fecha(role.inicio))/86400000;if(!Number.isInteger(shift)||Math.abs(shift)>2)throw Error('El ajuste de inicio por descansos debe ser de 1 o 2 días respecto al rol; otro cambio requiere autorización fuera de calendario.');}
 else if(!d.autorizacion)throw Error('Indica la referencia de autorización para salir de calendario.');
 const advance=(fecha(p.vencimiento)-fecha(d.inicio))/86400000;
 const limit=limitesProgramacion(p);if(advance>limit.dias)throw Error(limit.motivo+' Vencimiento: '+p.vencimiento+'. Fecha mínima: '+limit.desde+'.');
 if(primerPeriodo(p)&&p.regimen==='ESTATUTO'&&fecha(d.inicio)>fecha(p.vencimiento)+184*86400000)throw Error('El primer periodo de Estatuto debe otorgarse dentro de los seis meses siguientes al año de servicio.');
 if(d.inicio.slice(0,4)!=='2027')throw Error('El inicio debe corresponder al calendario 2027.');
 const jornadas=jornadasEquivalentes(days,d.patron,p.regimen),calendar=calendarioLaboral(d),first=calendar.find(r=>r.laborable&&!r.descanso_obligatorio);if(!first)throw Error('No hay jornada laborable disponible en el ciclo confirmado.');
 if(limit.desde&&first.fecha<limit.desde)throw Error('El ajuste real anticipa el vencimiento más de lo permitido. Fecha mínima: '+limit.desde+'.');
 const plan=d.patron==='MIXTO'?calendarioMixto(first.fecha,days,calendar):calendarioVacaciones({inicio:first.fecha,jornadas,calendario:calendar});
 let madre;if(role&&!isException)madre=rolMadre(role.numero,days,p.regimen);else{const base=calendarioLaboral({...d,inicio:d.inicio,patron:'SEMANAL',turnos_ciclo:undefined,ciclo:'1111100',ancla:'2027-01-04',hora_inicio:'08:00',hora_fin:'16:00',descanso_fijo:null,festivos_adicionales:[]}),f=base.find(r=>r.laborable&&!r.descanso_obligatorio),m=calendarioVacaciones({inicio:f.fecha,jornadas:days,calendario:base});madre={tipo:'MADRE',rol:null,inicio:m.inicio,fin:m.fin,disfrute:m.disfrute,dias_derecho:days,fuente:{clave:'REFERENCIA-FUERA-CALENDARIO'},base:'Referencia diurna lunes a viernes fuera del rol oficial'};}
 const real=completarReal(plan,d),ajustes=calendar.filter(r=>r.fecha>=d.inicio&&r.fecha<=plan.fin&&r.motivos?.length).map(r=>({fecha:r.fecha,motivos:r.motivos}));
 const calendario_real=calendar.filter(r=>r.fecha>=plan.inicio&&r.fecha<=plan.regreso&&r.laborable&&!r.descanso_obligatorio).map(row=>({fecha_entrada:row.fecha,hora_entrada:row.hora_inicio,fecha_salida:new Date(fecha(row.fecha)+(row.hora_fin<=row.hora_inicio?86400000:0)).toISOString().slice(0,10),hora_salida:row.hora_fin,tipo:row.tipo}));return {...plan,madre,real,real_original:structuredClone(real),calendario_real,ajustes,dias_derecho:days,version:VERSION,fuentes:FUENTES,rol:role?.numero||null,horario:{inicio:d.hora_inicio,fin:d.hora_fin},ciclo:d.ciclo,ancla:d.ancla};
}
