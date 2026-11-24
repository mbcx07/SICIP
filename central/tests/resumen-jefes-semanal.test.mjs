import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {database} from './d1-adapter.mjs';
import {semanaResumenJefes,contarPasesJefe,enviarResumenJefes,mensajeResumenJefe} from '../src/resumen-jefes-semanal.mjs';
import {dispatch} from '../src/notificaciones-dispatch.mjs';
const clock=()=>Date.parse('2026-11-30T16:00:00Z'),range={inicio:'2026-11-23',fin:'2026-11-29'};
const env=()=>{const DB=database();DB.db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));return {DB};};
const doc=(coll,id,p)=>({document:{name:'projects/sicip-bcs/databases/(default)/documents/'+coll+'/'+id,fields:Object.fromEntries(Object.entries(p).map(([k,v])=>[k,typeof v==='boolean'?{booleanValue:v}:{stringValue:v}]))}});
const pass=async(e,id,p,state='PENDIENTE_ENTREGA')=>e.DB.prepare('INSERT INTO pases_registros VALUES(?,?,?,?,?,?,?,?)').bind(id,id,p.matricula||'WORKER','WORKER',JSON.stringify(p),state,'2026-11-23','2026-11-23').run();
test('lunes desde 09:00 locales, semana lunes a domingo anterior y cruce de año',()=>{
 assert.deepEqual(semanaResumenJefes(clock()),range);
 assert.equal(semanaResumenJefes(Date.parse('2026-11-30T15:59:59Z')),null);
 assert.equal(semanaResumenJefes(Date.parse('2026-12-01T16:00:00Z')),null);
 assert.deepEqual(semanaResumenJefes(Date.parse('2027-01-04T16:00:00Z')),{inicio:'2026-12-28',fin:'2027-01-03'});
});
test('cuenta sólo del jefe, fecha y tipo correctos; separa recepción y pendientes y deduplica legado',async()=>{
 const e=env();for(const [id,tipo,fecha,jefe,state] of [['P1','PARTICULAR','2026-11-23','CHIEF','RECIBIDO_PERSONAL'],['P2','PARTICULAR','2026-11-29','CHIEF','PENDIENTE_ENTREGA'],['P3','MÉDICO','2026-11-25','CHIEF','RECIBIDO_PERSONAL'],['P4','OFICIAL','2026-11-25','CHIEF','RECIBIDO_PERSONAL'],['P5','PARTICULAR','2026-11-25','OTHER','RECIBIDO_PERSONAL'],['P6','PARTICULAR','2026-11-22','CHIEF','RECIBIDO_PERSONAL'],['P7','PARTICULAR','2026-11-30','CHIEF','RECIBIDO_PERSONAL'],['P8','PARTICULAR','2026-11-25','CHIEF','CANCELADO']])await pass(e,id,{folio:id,jefeMatricula:jefe,tipoAsunto:tipo,fecha},state);
 const send=async()=>Response.json([doc('pases','P1',{folio:'P1',jefeMatricula:'CHIEF',tipoAsunto:'PARTICULAR',fecha:'2026-11-23'}),doc('pases','OLD',{folio:'OLD',jefeMatricula:'CHIEF',tipoAsunto:'PARTICULAR',fecha:'2026-11-25',estado:'RECIBIDO_PERSONAL'})]);
 assert.deepEqual(await contarPasesJefe(e,'CHIEF',range,send),{recibidos:2,pendientes:1,total:3});
 await e.DB.prepare("INSERT INTO documentos_recibidos VALUES('P2','PASE','P2','WORKER','STAFF','2026-11-29')").run();assert.equal((await contarPasesJefe(e,'CHIEF',range,send)).pendientes,0);
 await assert.rejects(()=>contarPasesJefe(e,'CHIEF',range,async()=>new Response('',{status:503})));
});
test('resumen único por semana para jefes activos; cero explícito y correo verificado, sin datos de trabajadores',async()=>{
 const e=env();await e.DB.prepare("INSERT INTO contactos(matricula,personal,personal_verificado,updated_at) VALUES('CHIEF','chief@example.test','verified','today')").run();
 const send=async(u,o)=>{const q=JSON.parse(o.body).structuredQuery;if(q.from[0].collectionId==='pases')return Response.json([]);assert.equal(q.where.fieldFilter.value.stringValue,'JEFE_SERVICIO');return Response.json(q.startAt?[]:[doc('usuarios','CHIEF',{rol:'JEFE_SERVICIO',activo:true}),doc('usuarios','DISABLED',{rol:'JEFE_SERVICIO',activo:false})]);};
 assert.equal((await enviarResumenJefes(e,{clock,send})).generados,1);for(let i=0;i<4;i++)assert.equal((await enviarResumenJefes(e,{clock,send})).generados,0);
 const n=await e.DB.prepare('SELECT * FROM notificaciones').first();assert.equal(n.matricula,'CHIEF');assert.match(n.mensaje,/0 pases personales/);assert.match(n.mensaje,/continuidad/);assert.match(n.mensaje,/derechohabiente/);assert.equal(n.leida,null);
 let emails=0;await dispatch({...e,RESEND_API_KEY:'synthetic',MAIL_FROM:'test@example.test'},{clock,send:async(u,o)=>{const d=JSON.parse(o.body);assert.deepEqual(d.to,['chief@example.test']);assert.match(d.html,/Resumen semanal/);emails++;return Response.json({id:'synthetic'});}});assert.equal(emails,1);
 assert.match(mensajeResumenJefe(range,{total:3,recibidos:2,pendientes:1}).mensaje,/firma aún no se confirma/);
});
test('fallo de pases no se convierte en cero; cursor continúa y vuelve a intentar al jefe fallido',async()=>{
 const e=env();let failed=true;
 const send=async(u,o)=>{const q=JSON.parse(o.body).structuredQuery;if(q.from[0].collectionId==='pases'){if(failed){failed=false;return new Response('',{status:503});}return Response.json([]);}return Response.json(q.startAt?[]:[doc('usuarios','CHIEF',{activo:true})]);};
 assert.equal((await enviarResumenJefes(e,{clock,send})).generados,0);assert.equal((await enviarResumenJefes(e,{clock,send})).generados,0);assert.equal((await enviarResumenJefes(e,{clock,send})).generados,1);
});
