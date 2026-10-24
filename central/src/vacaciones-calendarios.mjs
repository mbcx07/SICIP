import mixta from './vacaciones-mixta.json' with {type:'json'};
import tabla from './vacaciones-roles-2027.json' with {type:'json'};
const DAY=86400000;
const time=s=>Date.parse(s+'T12:00:00Z'),add=(s,n)=>new Date(time(s)+n*DAY).toISOString().slice(0,10);
export const CALENDARIO_VERSION='MADRE-REAL-2027-v1';
export function rolMadre(rol,dias,regimen){
 const row=tabla.roles.find(r=>r.numero===Number(rol));if(!row||!Number.isInteger(dias)||!row.terminos[dias])throw Error('La tabla oficial no tiene término para ese rol y cantidad de días.');
 if(regimen==='ESTATUTO'&&dias<8)throw Error('La tabla de Estatuto comienza en 8 días.');
 return {tipo:'MADRE',rol:row.numero,clase:row.tipo,inicio:row.inicio,fin:row.terminos[dias],dias_derecho:dias,disfrute:row.dias_base.slice(0,dias),fuente:tabla.fuente[regimen],version:CALENDARIO_VERSION,base:'Lunes a viernes; descansos sábado/domingo'};
}
export function turnoReal(row,d){
 const inicio=row.hora_inicio||d.hora_inicio,fin=row.hora_fin||d.hora_fin,cruza=fin<=inicio;
 return {fecha_entrada:row.fecha,hora_entrada:inicio,fecha_salida:add(row.fecha,cruza?1:0),hora_salida:fin,tipo:row.tipo||'JORNADA'};
}
export function completarReal(plan,d){
 const rows=new Map(plan.detalle.map(r=>[r.fecha,r]));
 const turnos=plan.disfrute.map(fecha=>turnoReal(rows.get(fecha)||{fecha},d));
 const siguiente=turnoReal({fecha:plan.regreso,...(d.turnos_ciclo?.length?turnoEnCiclo(plan.regreso,d):{})},d);
 return {tipo:'REAL',inicio:plan.inicio,fin:plan.fin,regreso:plan.regreso,disfrute:[...plan.disfrute],jornadas:plan.jornadas,turnos,entrada:turnos[0],salida:turnos.at(-1),reincorporacion:{fecha:siguiente.fecha_entrada,hora:siguiente.hora_entrada},version:CALENDARIO_VERSION};
}
export function turnoEnCiclo(fecha,d){
 const length=Number(d.ciclo_dias||7),idx=((Math.round((time(fecha)-time(d.ancla))/DAY)%length)+length)%length;
 return (d.turnos_ciclo||[]).find(t=>Number(t.dia)===idx)||{};
}
export function equivalenciaMixta(dias){const rule=mixta.equivalencias[String(dias)];if(!rule)throw Error('La equivalencia mixta confirmada es de 10 días: dos fines de semana y dos guardias. Falta confirmar la tabla para otra cantidad de días.');return {tipo:'MIXTO',jornadas:rule.FIN_SEMANA+rule.GUARDIA_EXTRA,por_tipo:{...rule},version:mixta.version,fuente:mixta.fuente};}
export function calendarioMixto(inicio,dias,calendar){
 const rule=equivalenciaMixta(dias),restantes={...rule.por_tipo},disfrute=[],intermedias=[];let fin=null;
 for(const row of calendar){if(row.fecha<inicio||!row.laborable||row.descanso_obligatorio)continue;if(restantes[row.tipo]>0){restantes[row.tipo]--;disfrute.push(row.fecha);}else intermedias.push(row.fecha);if(Object.values(restantes).every(n=>n===0)){fin=row.fecha;break;}}
 if(!fin)throw Error('El calendario no cubre las jornadas y guardias equivalentes.');const regreso=calendar.find(r=>r.fecha>fin&&r.laborable&&!r.descanso_obligatorio);if(!regreso)throw Error('Falta jornada de reincorporación.');const used=new Set(disfrute);
 return {inicio:disfrute[0],fin,regreso:regreso.fecha,jornadas:disfrute.length,disfrute,detalle:calendar.filter(r=>r.fecha>=disfrute[0]&&r.fecha<=fin).map(r=>({...r,consume:used.has(r.fecha)?1:0})),equivalencia:rule,jornadas_intermedias_sin_disfrute:intermedias.filter(x=>x<=fin)};
}
export function ajustarPECV(plan,cantidad,expediente,fechas,folio=null){
 if(!Number.isInteger(cantidad)||cantidad<1||plan.disfrute.length<=cantidad)throw Error('El PECV no conserva jornadas pendientes de disfrute.');
 const removed=new Set();if(plan.equivalencia?.tipo==='MIXTO'){
  for(const day of fechas){const type=[0,6].includes(new Date(time(day)).getUTCDay())?'FIN_SEMANA':'GUARDIA_EXTRA';const turn=[...(plan.real?.turnos||[])].reverse().find(t=>t.tipo===type&&!removed.has(t.fecha_entrada));if(!turn)throw Error('El periodo no conserva disfrute del mismo tipo de jornada del PECV.');removed.add(turn.fecha_entrada);}
 }else for(const day of plan.disfrute.slice(-cantidad))removed.add(day);
 const disfrute=plan.disfrute.filter(x=>!removed.has(x)),fin=disfrute.at(-1),calendar=plan.calendario_real||[],ret=calendar.find(t=>t.fecha_entrada>fin),regreso=ret?.fecha_entrada||(fin===plan.fin?plan.regreso:plan.disfrute.find(x=>x>fin));
 const next={...plan,inicio:disfrute[0],disfrute,jornadas:disfrute.length,fin,regreso,jornadas_intermedias_sin_disfrute:[...new Set([...(plan.jornadas_intermedias_sin_disfrute||[]),...removed])].filter(x=>x>=disfrute[0]&&x<=fin).sort(),detalle:plan.detalle?.filter(r=>r.fecha>=disfrute[0]&&r.fecha<=fin).map(r=>({...r,consume:disfrute.includes(r.fecha)?1:0})),pecv_jornadas:(plan.pecv_jornadas||0)+cantidad};
 if(plan.real){const turnos=plan.real.turnos.filter(t=>!removed.has(t.fecha_entrada));next.real_original=plan.real_original||structuredClone(plan.real);next.real={...plan.real,inicio:disfrute[0],entrada:turnos[0],disfrute:[...disfrute],jornadas:disfrute.length,fin,regreso,turnos,salida:turnos.at(-1),reincorporacion:ret?{fecha:ret.fecha_entrada,hora:ret.hora_entrada}:{...plan.real.reincorporacion}};}
 next.movimientos_pecv=[...(plan.movimientos_pecv||[]),{expediente,folio,fechas:[...fechas],jornadas:cantidad,jornadas_descontadas:[...removed],fin_anterior:plan.fin,fin_actual:fin,regreso_actual:regreso}];
 return next;
}
