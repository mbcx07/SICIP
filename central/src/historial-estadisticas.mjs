import {estadisticasAusentismo,INDICADORES_AUSENTISMO,CODIGOS_VACACIONES} from './ausentismo-domain.mjs';
import {CODIGOS_FALTA} from './incidencias-catalogo.mjs';
import {clasificarHecho,esTiempoExtra} from './historial-domain.mjs';
import {integrarPasesNomina,tipoPaseNomina} from './pases-nomina.mjs';
const labels={PARTICULAR:'Pases personales',OFICIAL:'Pases oficiales','MÉDICO':'Pases médicos',MEDICO:'Pases médicos'};
const passId=t=>'pases_'+({PARTICULAR:'personales',OFICIAL:'oficiales','MÉDICO':'medicos',MEDICO:'medicos'}[t]);
const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&Number.isFinite(Date.parse(d+'T12:00:00Z'));
export function estadisticasHistorial(rows,pases,{matricula,anio,hasta}={}){
 rows=rows.filter(r=>!['PR','EPR','32','33','AD'].includes(String(r.concepto).trim().toUpperCase()));
 const {vida_laboral,...stats}=estadisticasAusentismo(rows,{anio,hasta});
 const years=new Map(stats.por_anio.map(y=>[y.anio,{anio:y.anio,valores:{...y.valores}}]));
 const passTypes=['PARTICULAR','OFICIAL','MÉDICO'];for(const t of passTypes)stats.indicadores.push({id:passId(t),nombre:labels[t],unidad:'pases'});
 for(const r of rows)if(valid(r.inicio)&&(!hasta||r.inicio<=hasta)){const y=Number(r.inicio.slice(0,4));if(!years.has(y))years.set(y,{anio:y,valores:Object.fromEntries(stats.indicadores.map(i=>[i.id,0]))});}
 for(const y of years.values())for(const t of passTypes)y.valores[passId(t)]=0;
 for(const t of passTypes){stats.anual[passId(t)]=0;for(const m of stats.mensual)m.valores[passId(t)]=0;}
 const integrated=integrarPasesNomina(pases,{matricula,fecha:String(anio)+'-12-31'},rows).rows.filter(p=>valid(p.fecha)&&(!hasta||p.fecha<=hasta));
 for(const p of integrated){const id=passId(p.tipoAsunto);if(!id||id==='pases_undefined')continue;const y=Number(p.fecha.slice(0,4)),m=Number(p.fecha.slice(5,7));if(!years.has(y))years.set(y,{anio:y,valores:Object.fromEntries(stats.indicadores.map(i=>[i.id,0]))});years.get(y).valores[id]++;if(y===Number(anio)){stats.anual[id]++;stats.mensual[m-1].valores[id]++;}}
 stats.por_anio=[...years.values()].sort((a,b)=>a.anio-b.anio);
 const source=new Map(),available=new Set();for(const r of rows)if(valid(r.inicio)&&r.inicio<=String(anio)+'-12-31'&&(valid(r.fin)?r.fin:r.inicio)>=String(anio)+'-01-01'&&(!hasta||r.inicio<=hasta||CODIGOS_VACACIONES.includes(r.concepto))){available.add(r.concepto+'|'+r.clase);if(!source.has(r.concepto)||r.clase==='TRANSACCION')source.set(r.concepto,r.clase);}
 for(const i of INDICADORES_AUSENTISMO)for(const code of i.codigos)if(available.has(code+'|'+i.fuente))source.set(code,i.fuente);
 const groups=new Map(),seen=new Set(),absenceDays=new Set();let records=0,from=null,to=null;
 const noteDay=(day,programada=false)=>{if(day.slice(0,4)!==String(anio)||hasta&&day>hasta&&!programada)return false;from=!from||day<from?day:from;to=!to||day>to?day:to;return true;};
 function group(code,description,category,unit,origin){const key=code+'|'+unit;let g=groups.get(key);if(!g){g={concepto:code,codigos:[code],indicador:INDICADORES_AUSENTISMO.find(i=>i.codigos.includes(code)&&i.unidad===unit)?.id||null,descripcion:description,grupo:category,unidad:unit,fuente:origin,mensual:Array(12).fill(0),total:0,registros:0,sin_cantidad:0};groups.set(key,g);}return g;}
 for(const r of rows){if(!valid(r.inicio)||hasta&&r.inicio>hasta&&!CODIGOS_VACACIONES.includes(r.concepto)||tipoPaseNomina(r.concepto)||esTiempoExtra(r.concepto)&&r.clase!=='INCIDENCIA')continue;if((source.get(r.concepto)||'INCIDENCIA')!==r.clase)continue;
  const identity=r.clase+'|'+(r.id||[r.concepto,r.inicio,r.fin,r.referencia,r.plaza,r.puesto,r.duracion].join('|'));if(seen.has(identity))continue;seen.add(identity);
  const info=clasificarHecho(r),absence=CODIGOS_FALTA.includes(r.concepto),hours=esTiempoExtra(r.concepto),daySource=r.clase==='TRANSACCION'&&info.grupo!=='OTROS',unit=hours?'horas':daySource||absence?'días':'registros',g=group(r.concepto,info.descripcion,info.grupo,unit,r.clase==='TRANSACCION'?'Transacciones programadas':'Incidencias diarias');
  const amount=unit==='registros'||absence?1:Number(r.duracion),end=valid(r.fin)?r.fin:r.inicio,days=Math.round((Date.parse(end+'T12:00:00Z')-Date.parse(r.inicio+'T12:00:00Z'))/86400000)+1;
  if(unit!=='registros'&&(!absence&&r.duracion==null||!Number.isFinite(amount)||amount<0)){if(noteDay(r.inicio)){g.sin_cantidad++;g.registros++;records++;}continue;}
  let included=false;
  const add=(day,n)=>{if(noteDay(day,CODIGOS_VACACIONES.includes(r.concepto))){included=true;if(absence){const k=r.concepto+'|'+day;if(absenceDays.has(k))return;absenceDays.add(k);}g.mensual[Number(day.slice(5,7))-1]+=n;g.total+=n;included=true;}};
  if(unit==='días'&&days>=1&&days<=3660&&Number.isInteger(amount)&&amount===days){for(let i=0;i<days;i++)add(new Date(Date.parse(r.inicio+'T12:00:00Z')+i*86400000).toISOString().slice(0,10),1);}else add(r.inicio,amount);
  if(included){g.registros++;records++;}
 }
 for(const p of integrated)if(p.fecha.slice(0,4)===String(anio)){const t=p.tipoAsunto==='MEDICO'?'MÉDICO':p.tipoAsunto;if(!labels[t])continue;const g=group(passId(t),labels[t],'PASES','pases','Incidencias y SICIP');g.indicador=passId(t);g.codigos=[...new Set(rows.filter(r=>r.clase==='INCIDENCIA'&&r.inicio?.slice(0,4)===String(anio)&&tipoPaseNomina(r.concepto)===(t==='MÉDICO'?'MEDICO':t)).map(r=>r.concepto))].sort();if(pases.some(r=>r.fecha?.slice(0,4)===String(anio)&&r.tipoAsunto===t&&r.estado!=='CANCELADO'))g.codigos.push('SICIP');g.registros++;g.mensual[Number(p.fecha.slice(5,7))-1]++;g.total++;records++;noteDay(p.fecha);}
 const conceptos=[...groups.values()].filter(g=>g.registros).sort((a,b)=>a.grupo.localeCompare(b.grupo)||a.concepto.localeCompare(b.concepto));
 return {...stats,conceptos,cobertura_anual:{desde:from,hasta:to,registros:records,anio:Number(anio)},grupos:[...new Set(conceptos.map(c=>c.grupo))].sort()};
}
