import {avisoSQL} from './notificaciones-core.mjs';
import {vigente25N,mensaje25N} from './campana25n-domain.mjs';
const ROOT='https://firestore.googleapis.com/v1/projects/sicip-bcs/databases/(default)/documents';
export async function publicarCampana25N(env,{clock=()=>Date.now(),send=fetch,limit=30}={}){
 if(!vigente25N(clock()))return {generados:0};
 const cursorKey='campana25n2026_cursor',cursor=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(cursorKey).first();
 if(cursor?.value==='COMPLETO')return {generados:0};
 const q={from:[{collectionId:'usuarios'}],orderBy:[{field:{fieldPath:'__name__'},direction:'ASCENDING'}],limit};
 if(cursor?.value)q.startAt={values:[{referenceValue:cursor.value}],before:false};
 const r=await send(ROOT+':runQuery',{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json'},body:JSON.stringify({structuredQuery:q})});
 if(!r.ok)throw Error('No se pudo consultar a los destinatarios de la campaña 25N.');
 const data=await r.json();if(!Array.isArray(data)||data.some(v=>v.error))throw Error('Destinatarios incompletos.');
 const docs=data.filter(v=>v.document).map(v=>v.document),statements=[];
 for(const doc of docs){const mat=doc.name.split('/').pop();if(doc.fields?.activo?.booleanValue!==true||!mat.match(/^[A-Za-z0-9._-]{1,80}$/))continue;
  statements.push(avisoSQL(env,{key:'CAMPANA_25N2026:'+mat,matricula:mat,...mensaje25N()}));
 }
 statements.push(env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(cursorKey,docs.length===limit?docs.at(-1).name:'COMPLETO'));
 const results=await env.DB.batch(statements);return {generados:results.slice(0,-1).reduce((n,r)=>n+r.meta.changes,0)};
}
