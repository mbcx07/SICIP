import test from 'node:test';
import assert from 'node:assert/strict';
import {equivalenciaVacaciones as equiv,calendarioVacaciones as plan,normativa} from '../src/vacaciones-domain.mjs';
const night='acumulada_nocturna_8h_tres_veladas_alternas_descanso_fijo',weekend='acumulada_diurna_8h_sab_dom';
function calendar(start,count,isWork,holidays=[]){return Array.from({length:count},(_,i)=>{const d=new Date(Date.parse(start+'T12:00:00Z')+i*86400000),fecha=d.toISOString().slice(0,10);return {fecha,laborable:isWork(d,i),descanso_obligatorio:holidays.includes(fecha)};});}
test('tablas exactas por ámbito, incluida corrección 7 días a 4 veladas',()=>{
 const nights=[4,5,5,6,7,7,8,8,9,10,10,11,11,12],acc=[3,3,4,4,4,5,5,6,6,6,7,7,8,8];
 for(let d=7;d<=20;d++){assert.equal(equiv(d,night).cantidad,nights[d-7]);assert.equal(equiv(d,weekend).cantidad,acc[d-7]);}
 assert.equal(equiv(7,night).numeral,'5.2.10');
 for(const d of [6,21,7.5,'10',NaN])assert.throws(()=>equiv(d,night));
 assert.throws(()=>equiv(10,'NOCTURNO_GENERICO'));
});
test('jornada acumulada consume sábado y domingo y regresa en jornada siguiente',()=>{
 const c=calendar('2026-10-24',16,d=>[0,6].includes(d.getUTCDay()));
 const p=plan({inicio:'2026-10-24',jornadas:4,calendario:c});
 assert.deepEqual(p.disfrute,['2026-10-24','2026-10-25','2026-10-31','2026-11-01']);
 assert.equal(p.regreso,'2026-11-07');
});
test('respeta descanso entre semana y descanso obligatorio explícito',()=>{
 const c=calendar('2026-10-24',15,d=>![1,2].includes(d.getUTCDay()),['2026-10-25']);
 const p=plan({inicio:'2026-10-24',jornadas:3,calendario:c});
 assert.deepEqual(p.disfrute,['2026-10-24','2026-10-28','2026-10-29']);
 assert.equal(p.regreso,'2026-10-30');
});
test('veladas alternas explícitas y regreso al cruzar año',()=>{
 const c=calendar('2026-12-28',20,(_,i)=>[0,2,4].includes(i%7));
 const p=plan({inicio:'2026-12-28',jornadas:4,calendario:c});
 assert.deepEqual(p.disfrute,['2026-12-28','2026-12-30','2027-01-01','2027-01-04']);
 assert.equal(p.regreso,'2027-01-06');
});
test('año bisiesto sin desplazamiento de fecha ni asunción de fin de semana',()=>{
 const c=calendar('2028-02-28',6,()=>true);
 assert.deepEqual(plan({inicio:'2028-02-28',jornadas:3,calendario:c}).disfrute,['2028-02-28','2028-02-29','2028-03-01']);
});
test('no inventa inicio, clasificaciones, días faltantes ni regreso',()=>{
 const c=calendar('2026-10-24',5,(_,i)=>i%2===0);
 assert.throws(()=>plan({inicio:'2026-10-25',jornadas:1,calendario:c}));
 assert.throws(()=>plan({inicio:'2026-10-24',jornadas:3,calendario:c}));
 assert.throws(()=>plan({inicio:'2026-10-24',jornadas:1,calendario:c.filter((_,i)=>i!==1)}));
 assert.throws(()=>plan({inicio:'2026-10-24',jornadas:1,calendario:[...c,c[0]]}));
 assert.throws(()=>plan({inicio:'2026-10-24',jornadas:0,calendario:c}));
 assert.throws(()=>plan({inicio:'2026-02-30',jornadas:1,calendario:c}));
 assert.throws(()=>plan({inicio:'2026-10-24',jornadas:1,calendario:c.map(r=>({fecha:r.fecha,laborable:r.laborable}))}));
});
test('reglas no publicadas, PECV con ámbito y marcas extraordinarias sin ausencia',()=>{
 assert.equal(normativa.fuente.publicado_en_sicip,false);
 assert.equal(normativa.pecv.semestral.maximo_nocturno_veladas,3);
 assert.equal(normativa.pecv.cuatrimestral_radiaciones.maximo_nocturno_veladas,2);
 assert.equal(normativa.extra_20_anios.marcas['7'].dias_disfrute,0);
 assert.equal(normativa.extra_20_anios.marcas['8'].dias_disfrute,0);
});
