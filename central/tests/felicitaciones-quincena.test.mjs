import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {database,seed,fixture} from './d1-adapter.mjs';
import {cierreFelicitacion,sinPasesPersonales,felicitarQuincenaSinPases,mensajeFelicitacion} from '../src/felicitaciones-quincena.mjs';
import {dispatch} from '../src/notificaciones-dispatch.mjs';

test('felicitación el 1 y 16 desde las 09:00 locales; calcula la quincena anterior incluso en enero y bisiesto',()=>{
 for(const [day,q,fin] of [['2027-01-01','2026024','2026-12-31'],['2028-03-01','2028004','2028-02-29'],['2026-11-16','2026021','2026-11-15']]){
  assert.equal(cierreFelicitacion(Date.parse(day+'T15:59:59Z')),null);
  const result=cierreFelicitacion(Date.parse(day+'T16:00:00Z'));assert.equal(result.quincena,q);assert.equal(result.fin,fin);
  assert.equal(cierreFelicitacion(Date.parse(day+'T23:00:00-07:00')).quincena,q);
 }
 assert.equal(cierreFelicitacion(Date.parse('2026-11-17T16:00:00Z')),null);
});
const range={inicio:'2026-11-01',fin:'2026-11-15'};
test('sólo pases personales en el periodo bloquean; médicos, oficiales, cancelados y otros periodos no cuentan',()=>{
 const clean={completo:true,pases:[{tipoAsunto:'MÉDICO',fecha:'2026-11-10'},{tipoAsunto:'OFICIAL',fecha:'2026-11-12'},{tipoAsunto:'PARTICULAR',fecha:'2026-11-01',estado:'CANCELADO'},{tipoAsunto:'PARTICULAR',fecha:'2026-10-31'},{tipoAsunto:'PARTICULAR',fecha:'2026-11-16'}],licencias:[{tipo:'LICENCIA_SIN_SUELDO'}],faltas:[{tipo:'FALTA_INJUSTIFICADA'}]};
 assert.equal(sinPasesPersonales(clean,range),true);
 for(const fecha of [range.inicio,range.fin])assert.equal(sinPasesPersonales({...clean,pases:[...clean.pases,{tipoAsunto:'PARTICULAR',fecha}]},range),false);
 assert.equal(sinPasesPersonales({...clean,completo:false},range),false);
 assert.equal(sinPasesPersonales({completo:true,pases:[{tipoAsunto:'PARTICULAR'}]},range),false);
 assert.equal(sinPasesPersonales({completo:true,pases:[{fecha:'2026-11-10'}]},range),false);
});
const setup=async()=>{const DB=database();DB.db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));await seed(DB,fixture(),'11111111-1111-4111-8111-111111111111',true);for(const m of ['TESTADMIN','TESTUSER'])await DB.prepare('INSERT INTO aura_participantes VALUES(?,?,0)').bind(m,'2026-10-01').run();return {DB};};
const clock=()=>Date.parse('2026-11-16T16:00:00Z'),empty=async()=>Response.json([]);
test('cron sin sesión genera una sola felicitación por persona/quincena; llega a ambos correos verificados y permanece en plataforma',async()=>{
 const env=await setup();await env.DB.prepare("UPDATE contactos SET institucional='synthetic@imss.gob.mx',institucional_verificado='2026-11-01' WHERE matricula='TESTUSER'").run();
 assert.equal((await felicitarQuincenaSinPases(env,{clock,send:empty})).generados,2);
 for(let i=0;i<3;i++)assert.equal((await felicitarQuincenaSinPases(env,{clock,send:empty})).generados,0);
 const notes=(await env.DB.prepare('SELECT * FROM notificaciones').all()).results;assert.equal(notes.length,2);assert.ok(notes.every(n=>n.leida===null&&n.expandida===0));
 const note=notes.find(n=>n.matricula==='TESTUSER');assert.match(note.mensaje,/01\/11\/2026 al 15\/11\/2026/);assert.match(note.mensaje,/equipo/);assert.ok(!note.mensaje.includes('sin incidencias'));
 let mails=0;await dispatch({...env,RESEND_API_KEY:'synthetic',MAIL_FROM:'SICIP <test@example.test>'},{clock,send:async(url,opt)=>{assert.equal(url,'https://api.resend.com/emails');const body=JSON.parse(opt.body);assert.match(body.html,/Gracias por tu compromiso/);mails++;return Response.json({id:'synthetic'});}});
 assert.equal(mails,3);assert.equal((await env.DB.prepare('SELECT count(*) n FROM notificaciones').first()).n,2);
});
test('fallos de fuentes se reintentan sin bloquear al siguiente; no consulta incidencias ajenas a esta felicitación',async()=>{
 const env=await setup();let calls=0;
 const send=async(url,opt)=>{assert.match(url,/documents:runQuery$/);calls++;const q=JSON.parse(opt.body).structuredQuery;if(q.where.fieldFilter.value.stringValue==='TESTADMIN')return new Response('',{status:503});return Response.json([]);};
 assert.equal((await felicitarQuincenaSinPases(env,{clock,send,limit:1})).generados,0);
 assert.equal((await felicitarQuincenaSinPases(env,{clock,send,limit:1})).generados,1);
 await felicitarQuincenaSinPases(env,{clock,send,limit:1});
 assert.equal((await felicitarQuincenaSinPases(env,{clock,send:empty,limit:1})).generados,1);assert.equal(calls,6);
});
test('pases personales centrales/heredados impiden aviso; no felicita por periodos anteriores al registro',async()=>{
 const env=await setup();await env.DB.prepare("INSERT INTO pases_registros VALUES('D1','P-000001','TESTUSER','TESTUSER',?,'PENDIENTE_ENTREGA','2026-11-10','2026-11-10')").bind(JSON.stringify({folio:'D1',fecha:'2026-11-10',tipoAsunto:'PARTICULAR'})).run();
 const legacy=async(url,opt)=>{const q=JSON.parse(opt.body).structuredQuery;if(q.from[0].collectionId!=='pases')return Response.json([]);return Response.json([{document:{name:'projects/x/documents/pases/legacy',fields:{matricula:{stringValue:'TESTADMIN'},tipoAsunto:{stringValue:'PARTICULAR'},fecha:{stringValue:'2026-11-15'}}}}]);};
 assert.equal((await felicitarQuincenaSinPases(env,{clock,send:legacy})).generados,0);
 await env.DB.prepare("UPDATE aura_participantes SET desde='2026-11-16'").run();assert.equal((await felicitarQuincenaSinPases(env,{clock,send:empty})).revisados,0);
 assert.match(mensajeFelicitacion(range).titulo,/compromiso/);
});
