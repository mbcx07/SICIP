// APS incidence catalogue, 1A74-003-034, annex 1A74-008-144 (pp. 145–147).
export const CODIGOS_PASE={PARTICULAR:['PIP','EIP','PEP','PSP','EP2','EP3','IP2','LP2','SP','SP2','EPP'],OFICIAL:['PIO','EIO','PEO','PSO','EO2','EP4','IO2','SO2','EPO'],MEDICO:['PIM','EIM','PEM','PSM','EM2','EP5','IM2','LM2','SM2','EPM']};
export const tipoPaseNomina=code=>Object.entries(CODIGOS_PASE).find(([,codes])=>codes.includes(String(code).toUpperCase()))?.[0]||null;
export function horaPase(v){
 const s=String(v??'').trim().replace(/\s+/g,' ');
 const time=s.match(/^(?:(?:\d{1,2}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})[ T])?(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
 if(time&&+time[1]<24&&+time[2]<60)return time[1].padStart(2,'0')+':'+time[2];
 if(/^\d{3,4}$/.test(s)){const n=s.padStart(4,'0');if(+n.slice(0,2)<24&&+n.slice(2)<60)return n.slice(0,2)+':'+n.slice(2);}
 if(/^\d*[.,]\d+$/.test(s)){const value=Number(s.replace(',','.')),fraction=value%1;if(value>=0&&value<73050&&fraction>0){const n=Math.round(fraction*1440)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}}
 return '';
}
const hora=horaPase;
export function integrarPasesNomina(online,p,historial=[]){
 const historical=[],seen=new Set(),timed=new Set();let pendientes_mes=0,pendientes_anio=0;
 for(const r of historial){const tipo=tipoPaseNomina(r.concepto);if(r.clase!=='INCIDENCIA'||!tipo)continue;const fecha=String(r.inicio||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))continue;
  const id=r.id||[r.concepto,fecha,r.referencia,r.plaza,r.puesto,r.hora_inicial,r.hora_final].join('|');if(seen.has(id))continue;seen.add(id);
  const begin=hora(r.hora_inicial),end=hora(r.hora_final),fingerprint=[fecha,tipo,begin,end].join('|');if(begin&&end){if(timed.has(fingerprint))continue;timed.add(fingerprint);}
  historical.push({matricula:p.matricula,fecha,tipoAsunto:tipo==='MEDICO'?'MÉDICO':tipo,estado:'NOMINA_VALIDADA',inicio_hora:hora(r.hora_inicial),fin_hora:hora(r.hora_final),referencia:r.referencia,id});
 }
 const matched=new Set(),digital=[],folios=new Set();let coincidencias=0;
 for(const r of online){if(String(r.matricula)!==String(p.matricula)||['CANCELADO','CANCELADA','ANULADO','ANULADA','RECHAZADO'].includes(r.estado))continue;
  if(r.folio&&folios.has(r.folio))continue;if(r.folio)folios.add(r.folio);
  const time=hora(r.hora),type=r.tipoAsunto==='MEDICO'?'MÉDICO':r.tipoAsunto;
  const i=historical.findIndex((h,i)=>!matched.has(i)&&h.fecha===r.fecha&&h.tipoAsunto===type&&time&&(r.tipoHorario==='ENTRADA'?h.fin_hora===time:h.inicio_hora===time));
  if(i>=0){matched.add(i);coincidencias++;}else digital.push(r);
 }
 return {rows:[...historical,...digital],calidad:{pases_nomina:historical.length,coincidencias,pendientes_mes,pendientes_anio}};
}
