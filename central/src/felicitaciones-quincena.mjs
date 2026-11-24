import {avisoSQL} from './notificaciones-core.mjs';
import {fuentesAura} from './aura.mjs';
import {anteriorQuincena,rangoQuincena,esCancelado} from './inicio-domain.mjs';

// The cron runs independently of login. Use the local calendar, including weekends/holidays.
export function cierreFelicitacion(clock=Date.now()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mazatlan',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(clock)).map(p=>[p.type,p.value]));
 if(!['01','16'].includes(parts.day)||Number(parts.hour)<9)return null;
 const day=parts.year+'-'+parts.month+'-'+parts.day,quincena=anteriorQuincena(day);
 return {quincena,...rangoQuincena(quincena)};
}
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
export function sinPasesPersonales(datos,range){
 if(!datos.completo)return false;
 for(const p of datos.pases){
  if(esCancelado(p)||['ANULADA','ANULADO','BORRADOR'].includes(normal(p.estado)))continue;
  const tipo=normal(p.tipoAsunto);
  if(['MEDICO','OFICIAL'].includes(tipo))continue;
  const fecha=String(p.fecha||p.inicio||'').slice(0,10);
  // Missing dates/types cannot be interpreted as zero personal passes.
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))return false;
  if(fecha<range.inicio||fecha>range.fin)continue;
  return false;
 }
 return true;
}
export function mensajeFelicitacion({inicio,fin}){
 const fecha=d=>d.split('-').reverse().join('/');
 return {titulo:'¡Gracias por tu compromiso esta quincena!',mensaje:'¡Felicidades! Te reconocemos porque durante la quincena del '+fecha(inicio)+' al '+fecha(fin)+' no tuviste ausencias por pases personales, de acuerdo con los registros de SICIP.\n\nTu constancia y la organización de tu tiempo contribuyen al trabajo de tu equipo y a la atención de quienes nos necesitan. ¡Gracias por tu esfuerzo!\n\nSigue construyendo este buen hábito, una quincena a la vez. Cada día cuenta y tu aportación hace la diferencia.',url:'/'};
}
export async function felicitarQuincenaSinPases(env,{clock=()=>Date.now(),send=fetch,limit=2}={}){
 const cierre=cierreFelicitacion(clock());if(!cierre)return {generados:0,revisados:0};
 const prefix='FELICITACION_PASES:'+cierre.quincena+':',cursorKey='felicitacion_pases_cursor:'+cierre.quincena;
 const saved=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(cursorKey).first(),cursor=saved?.value||'';
 // Workers enrolled before the previous fortnight closed; reads cover its entire date range.
 const rows=(await env.DB.prepare(`SELECT a.matricula FROM aura_participantes a
 JOIN personas p ON p.matricula=a.matricula AND p.corte=(SELECT value FROM settings WHERE key='active')
 WHERE a.desde<=? AND a.matricula>? AND NOT EXISTS(SELECT 1 FROM notificaciones n WHERE n.event_key=?||a.matricula)
 ORDER BY a.matricula LIMIT ?`).bind(cierre.fin,cursor,prefix,limit).all()).results;
 let generados=0;
 for(const row of rows){
  try{
   const datos=await fuentesAura(env,row.matricula,send,{soloPases:true});
   if(sinPasesPersonales(datos,cierre)){
    const result=await avisoSQL(env,{key:prefix+row.matricula,matricula:row.matricula,...mensajeFelicitacion(cierre)}).run();generados+=result.meta.changes;
   }
  }catch{/* Revisit failed reads on the next cursor cycle, without blocking other workers. */}
 }
 await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(cursorKey,rows.length?rows.at(-1).matricula:'').run();
 return {generados,revisados:rows.length};
}
