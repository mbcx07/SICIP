import {avisoSQL} from './notificaciones-core.mjs';
import {esCancelado} from './inicio-domain.mjs';
const ROOT='https://firestore.googleapis.com/v1/projects/sicip-bcs/databases/(default)/documents';
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
export function semanaResumenJefes(clock=Date.now()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mazatlan',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(clock)).map(p=>[p.type,p.value]));
 const day=parts.year+'-'+parts.month+'-'+parts.day,date=new Date(day+'T12:00:00Z');
 if(date.getUTCDay()!==1||Number(parts.hour)<9)return null;
 return {inicio:new Date(+date-7*86400000).toISOString().slice(0,10),fin:new Date(+date-86400000).toISOString().slice(0,10)};
}
const decode=v=>v?.mapValue?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,decode(x)])):v?.stringValue??v?.booleanValue??v?.timestampValue??v?.integerValue??'';
async function consultar(send,structuredQuery){
 const r=await send(ROOT+':runQuery',{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json'},body:JSON.stringify({structuredQuery})});
 if(!r.ok)throw Error('No se pudo consultar la fuente del resumen semanal.');
 const data=await r.json();if(!Array.isArray(data)||data.some(v=>v.error))throw Error('Fuente incompleta.');return data.filter(v=>v.document).map(v=>v.document);
}
export async function contarPasesJefe(env,matricula,semana,send=fetch){
 const central=(await env.DB.prepare(`SELECT p.*,EXISTS(SELECT 1 FROM documentos_recibidos d WHERE d.folio=p.alias) recibido
 FROM pases_registros p WHERE json_extract(p.payload,'$.jefeMatricula')=?`).bind(matricula).all()).results;
 const docs=await consultar(send,{from:[{collectionId:'pases'}],where:{fieldFilter:{field:{fieldPath:'jefeMatricula'},op:'EQUAL',value:{stringValue:matricula}}},limit:1000});
 if(docs.length>=1000)throw Error('No se confirma un resumen con pases incompletos.');
 const seen=new Set(central.flatMap(r=>[r.folio,r.alias])),rows=central.map(r=>({...JSON.parse(r.payload),estado:r.estado,recibido:!!r.recibido}));
 for(const doc of docs){const p=Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,decode(v)])),id=doc.name.split('/').pop();
  if(String(p.jefeMatricula)!==matricula||[id,p.folio,p.folioCorto].some(k=>k&&seen.has(k)))continue;
  rows.push(p);for(const k of [id,p.folio,p.folioCorto])if(k)seen.add(k);
 }
 let recibidos=0,pendientes=0;
 for(const p of rows){
  if(esCancelado(p)||['ANULADO','ANULADA','BORRADOR'].includes(normal(p.estado)))continue;
  const tipo=normal(p.tipoAsunto);if(['MEDICO','OFICIAL'].includes(tipo))continue;
  const fecha=String(p.fecha||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))throw Error('Hay pases sin fecha verificable.');
  if(fecha<semana.inicio||fecha>semana.fin)continue;
  if(!['PARTICULAR','PERSONAL'].includes(tipo))throw Error('Hay pases sin clasificación verificable.');
  if(p.recibido||['RECIBIDO_PERSONAL','RECIBIDA_PERSONAL'].includes(normal(p.estado)))recibidos++;else pendientes++;
 }
 return {recibidos,pendientes,total:recibidos+pendientes};
}
export function mensajeResumenJefe(semana,c){
 const date=d=>d.split('-').reverse().join('/');
 return {titulo:'Resumen semanal de pases personales',url:'/',mensaje:'Semana del '+date(semana.inicio)+' al '+date(semana.fin)+'.\n\nEn SICIP apareces como jefe firmante de '+c.total+' pase'+(c.total===1?' personal':'s personales')+' con fecha en esa semana:\n• '+c.recibidos+' recibido'+(c.recibidos===1?'':'s')+' por el Departamento de Personal para su validación.\n• '+c.pendientes+' pendiente'+(c.pendientes===1?'':'s')+' de entrega; su firma aún no se confirma en recepción.\n\nAntes de autorizar un pase personal, valora el motivo, la duración de la ausencia, la cobertura disponible y las necesidades del servicio. Coordina las salidas para evitar ausencias simultáneas que afecten la continuidad del trabajo o la atención al derechohabiente. Promueve un uso razonable, con criterios consistentes, trato respetuoso y apego a la normativa aplicable.\n\nEste resumen excluye pases médicos, oficiales y cancelados. La selección de un jefe en una solicitud no acredita por sí sola su autorización; la firma se recaba en el documento.'};
}
export async function enviarResumenJefes(env,{clock=()=>Date.now(),send=fetch,limit=10}={}){
 const semana=semanaResumenJefes(clock());if(!semana)return {generados:0};
 const cursorKey='resumen_jefes_cursor:'+semana.inicio,saved=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(cursorKey).first();
 const q={from:[{collectionId:'usuarios'}],where:{fieldFilter:{field:{fieldPath:'rol'},op:'EQUAL',value:{stringValue:'JEFE_SERVICIO'}}},orderBy:[{field:{fieldPath:'__name__'},direction:'ASCENDING'}],limit};
 if(saved?.value)q.startAt={values:[{referenceValue:saved.value}],before:false};
 let docs;try{docs=await consultar(send,q);}catch{return {generados:0,incompleto:true};}
 let generados=0;
 for(const doc of docs){
  const mat=doc.name.split('/').pop(),fields=doc.fields||{};
  if(fields.activo?.booleanValue!==true||!mat.match(/^[A-Za-z0-9._-]{1,80}$/))continue;
  const key='RESUMEN_JEFE_PASES:'+semana.inicio+':'+mat;
  if(await env.DB.prepare('SELECT id FROM notificaciones WHERE event_key=?').bind(key).first())continue;
  try{const counts=await contarPasesJefe(env,mat,semana,send),r=await avisoSQL(env,{key,matricula:mat,...mensajeResumenJefe(semana,counts)}).run();generados+=r.meta.changes;}catch{/* Retry on the next cursor cycle; never send a false zero. */}
 }
 await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(cursorKey,docs.length?docs.at(-1).name:'').run();
 return {generados};
}
