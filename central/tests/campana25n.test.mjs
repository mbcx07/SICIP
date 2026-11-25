import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {database} from './d1-adapter.mjs';import {publicarCampana25N} from '../src/campana25n.mjs';import {vigente25N,CAMPANA_25N} from '../src/campana25n-domain.mjs';import {dispatch} from '../src/notificaciones-dispatch.mjs';
const setup=()=>{const DB=database();DB.db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));return {DB};};
const clock=()=>Date.parse('2026-11-25T09:00:00-07:00');
const doc=(id,active=true)=>({document:{name:'projects/sicip-bcs/databases/(default)/documents/usuarios/'+id,fields:{activo:{booleanValue:active}}}});
test('vigencia sólo 25 noviembre BCS, incluso con otro día UTC; vence exactamente a medianoche',()=>{assert.equal(vigente25N(Date.parse('2026-11-25T06:59:59Z')),false);assert.equal(vigente25N(Date.parse('2026-11-25T07:00:00Z')),true);assert.equal(vigente25N(Date.parse('2026-11-26T06:59:59Z')),true);assert.equal(vigente25N(Date.parse('2026-11-26T07:00:00Z')),false);});
test('paginación de activos sin duplicar; no modifica cuentas; vinculado recibe correo y aviso de plataforma',async()=>{
 const e=setup();await e.DB.prepare("INSERT INTO contactos(matricula,personal,personal_verificado,updated_at) VALUES('A','a@example.test','verified','today')").run();await e.DB.prepare("INSERT INTO contactos(matricula,personal,updated_at) VALUES('B','b@example.test','today')").run();let queries=0;
 const send=async(u,o)=>{queries++;assert.match(u,/documents:runQuery$/);const q=JSON.parse(o.body).structuredQuery;assert.equal(q.from[0].collectionId,'usuarios');return Response.json(q.startAt?[doc('C',false)]:[doc('A'),doc('B')]);};
 assert.equal((await publicarCampana25N(e,{clock,send,limit:2})).generados,2);assert.equal((await publicarCampana25N(e,{clock,send,limit:2})).generados,0);await publicarCampana25N(e,{clock,send,limit:2});assert.equal(queries,2);assert.equal((await e.DB.prepare('SELECT count(*) n FROM notificaciones').first()).n,2);
 const n=await e.DB.prepare("SELECT * FROM notificaciones WHERE matricula='A'").first();assert.equal(n.leida,null);assert.match(n.mensaje,/distintivo naranja/);assert.match(n.mensaje,/dignidad/);
 let emails=0;await dispatch({...e,RESEND_API_KEY:'synthetic',MAIL_FROM:'test@example.test'},{clock,send:async(u,o)=>{emails++;const d=JSON.parse(o.body);assert.deepEqual(d.to,['a@example.test']);assert.ok(d.html.includes('href="'+CAMPANA_25N.protocolo+'"'));return Response.json({id:'synthetic'});}});assert.equal(emails,1);
 // A replay of the cursor cannot duplicate the campaign event.
 await e.DB.prepare("DELETE FROM settings WHERE key='campana25n2026_cursor'").run();assert.equal((await publicarCampana25N(e,{clock,send,limit:2})).generados,0);
});
test('no envía campañas fuera de vigencia ni reintentos de correo del día anterior',async()=>{
 const e=setup(),send=async()=>Response.json([doc('A')]);await e.DB.prepare("INSERT INTO contactos(matricula,personal,personal_verificado,updated_at) VALUES('A','a@example.test','verified','today')").run();await publicarCampana25N(e,{clock,send});
 await dispatch({...e,RESEND_API_KEY:'synthetic',MAIL_FROM:'test@example.test'},{clock,send:async()=>new Response('',{status:503})});
 const expired=()=>Date.parse(CAMPANA_25N.fin);assert.equal((await publicarCampana25N(e,{clock:expired,send:async()=>{throw Error('No debe consultar');}})).generados,0);
 await dispatch({...e,RESEND_API_KEY:'synthetic',MAIL_FROM:'test@example.test'},{clock:expired,send:async()=>{throw Error('No debe enviar');}});assert.equal((await e.DB.prepare('SELECT estado FROM notificacion_envios').first()).estado,'OMITIDO');
});
test('fallo de fuente conserva cursor para reintentar, sin campañas parciales ni cero supuestos',async()=>{const e=setup();await assert.rejects(()=>publicarCampana25N(e,{clock,send:async()=>new Response('',{status:503})}));assert.equal((await e.DB.prepare('SELECT count(*) n FROM notificaciones').first()).n,0);assert.equal(await e.DB.prepare("SELECT value FROM settings WHERE key='campana25n2026_cursor'").first(),null);});
