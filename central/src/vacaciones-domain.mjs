// Only the explicit tables in 1A74-003-025 §§5.2.8 and 5.2.10.
// Not a published ruleset, entitlement allocator, salary or SIAP integration.
import normativa from './vacaciones-normativa.json' with {type:'json'};
export {normativa};
export function equivalenciaVacaciones(dias,patron){
 const index=normativa.equivalencias.dias_habiles.indexOf(dias);
 if(index<0)throw Error('La tabla aportada sólo define de 7 a 20 días hábiles. No se extrapola ni se redondea.');
 const rule=normativa.equivalencias[patron];
 if(!rule)throw Error('Selecciona el patrón exacto al que aplica la tabla normativa.');
 return {cantidad:(rule.jornadas||rule.veladas)[index],unidad:rule.jornadas?'JORNADAS':'VELADAS',fuente:normativa.fuente.clave,numeral:rule.numeral,paginas:rule.paginas};
}
const DAY=86400000;
function date(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Fecha inválida.');
 const n=Date.parse(value+'T12:00:00Z');
 if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==value)throw Error('Fecha inválida.');
 return n;
}
// An explicitly approved calendar is supplied by the caller. No weekends,
// alternating shifts or holidays are guessed from a shift's name.
export function calendarioVacaciones({inicio,jornadas,calendario}={}){
 const start=date(inicio);
 if(!Number.isInteger(jornadas)||jornadas<1||jornadas>366)throw Error('Selecciona un número entero de jornadas de disfrute; las marcas sin disfrute no generan ausencia.');
 if(!Array.isArray(calendario)||!calendario.length||calendario.length>1462)throw Error('Falta el calendario laboral confirmado.');
 const rows=calendario.map(r=>{
  date(r.fecha);
  if(typeof r.laborable!=='boolean'||typeof r.descanso_obligatorio!=='boolean')throw Error('Cada fecha requiere clasificación de jornada y descanso obligatorio.');
  return {...r};
 }).sort((a,b)=>a.fecha.localeCompare(b.fecha));
 for(let i=1;i<rows.length;i++)if(date(rows[i].fecha)-date(rows[i-1].fecha)!==DAY)throw Error('El calendario tiene fechas duplicadas o días sin clasificar.');
 const offset=rows.findIndex(r=>r.fecha===inicio);
 if(offset<0||date(rows[offset].fecha)!==start)throw Error('El calendario no incluye la fecha inicial.');
 const work=r=>r.laborable&&!r.descanso_obligatorio;
 if(!work(rows[offset]))throw Error('El inicio debe corresponder a una jornada laborable; confirma el ajuste de inicio.');
 const disfrute=[];let end=-1;
 for(let i=offset;i<rows.length;i++)if(work(rows[i])){disfrute.push(rows[i].fecha);if(disfrute.length===jornadas){end=i;break;}}
 if(end<0)throw Error('El calendario no cubre todas las jornadas solicitadas.');
 const regreso=rows.slice(end+1).find(work);
 if(!regreso)throw Error('Amplía el calendario para identificar la siguiente jornada de regreso.');
 return {inicio,fin:rows[end].fecha,regreso:regreso.fecha,jornadas,disfrute,detalle:rows.slice(offset,end+1).map(r=>({...r,consume:work(r)?1:0})),advertencia:'Las fechas civiles requieren el horario autorizado para expresar inicio, término y regreso; no implican las 00:00.'};
}
