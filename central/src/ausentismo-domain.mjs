// Absence days come from duration-in-days transactions; actual overtime hours
// and unjustified absence dates come from daily incidence records. Never /8.
export const INDICADORES_AUSENTISMO=[
 ['faltas','Faltas injustificadas','días',['72','E71','E72','E73'],'INCIDENCIA'],
 ['licencias_sin_sueldo','Licencias sin sueldo','días',['39','71','E41'],'TRANSACCION'],
 ['licencias_con_sueldo','Licencias con sueldo','días',['62','64','65','66','E42'],'TRANSACCION'],
 ['enfermedad_general','Incapacidad por enfermedad general','días',['67','67A','E61'],'TRANSACCION'],
 ['riesgo_trabajo','Incapacidad por riesgo de trabajo','días',['69','69A','69B','E63'],'TRANSACCION'],
 ['maternidad','Incapacidad por maternidad','días',['68','68A','E62'],'TRANSACCION'],
 ['vacaciones','Vacaciones','días',['63','E31'],'TRANSACCION'],
 ['tiempo_extra','Tiempo extra','horas',['37','37A','E37'],'INCIDENCIA'],
 ['guardias','Guardias festivas','días',['35','E35'],'TRANSACCION'],
 ['nivelaciones','Nivelaciones','días',['10'],'TRANSACCION']
].map(([id,nombre,unidad,codigos,fuente])=>({id,nombre,unidad,codigos,fuente}));
export const CODIGOS_FALTA=['72','E71','E72','E73'];
const fechaValida=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const empty=()=>Object.fromEntries(INDICADORES_AUSENTISMO.map(x=>[x.id,0]));
export function estadisticasAusentismo(rows,{anio,hasta}={}){
 const monthly=new Map(),annual=new Map(),seen=new Set(),faltas=new Set(),diasAusencia=new Set(),lifetime=empty();let sinCantidad=0,pendientes=0,futuros=0,inicio=null,fin=null,mesInicio=0;const current=Number(hasta?.slice(0,4)||new Date().getUTCFullYear());anio=Number(anio||current);
 function add(day,metric,value){const y=Number(day.slice(0,4)),m=day.slice(0,7);if(!monthly.has(m))monthly.set(m,empty());if(!annual.has(y))annual.set(y,empty());monthly.get(m)[metric]+=value;annual.get(y)[metric]+=value;lifetime[metric]+=value;}
 for(const r of rows){if(!fechaValida(r.inicio))continue;if(r.estado_origen&&r.estado_origen!=='V'){pendientes++;continue;}if(hasta&&r.inicio>hasta){futuros++;continue;}
  const metric=INDICADORES_AUSENTISMO.find(x=>x.fuente===r.clase&&x.codigos.includes(String(r.concepto)));if(!metric)continue;
  if(r.id){const k=r.clase+'|'+r.id;if(seen.has(k))continue;seen.add(k);}inicio=!inicio||r.inicio<inicio?r.inicio:inicio;fin=!fin||r.inicio>fin?r.inicio:fin;
  if(metric.id==='faltas'){const key=r.inicio;if(faltas.has(key))continue;faltas.add(key);add(r.inicio,metric.id,1);continue;}
  if(r.duracion==null||!Number.isFinite(Number(r.duracion))||Number(r.duracion)<0){sinCantidad++;continue;}const amount=Number(r.duracion);if(!amount)continue;
  const end=fechaValida(r.fin)?r.fin:r.inicio;const bound=hasta&&end>hasta?hasta:end;if(bound>=r.inicio&&(!fin||bound>fin))fin=bound;const days=Math.round((Date.parse(end+'T12:00:00Z')-Date.parse(r.inicio+'T12:00:00Z'))/86400000)+1;
  // Split explicit calendar-day intervals only when source quantity agrees.
  // Otherwise retain the recorded quantity in its start month, never infer a shift.
  if(metric.unidad==='días'&&days>=1&&days<=3660&&Number.isInteger(amount)&&amount===days){for(let i=0;i<days;i++){const day=new Date(Date.parse(r.inicio+'T12:00:00Z')+i*86400000).toISOString().slice(0,10);if(!hasta||day<=hasta){const key=metric.id+'|'+day;if(['guardias','nivelaciones'].includes(metric.id)||!diasAusencia.has(key)){add(day,metric.id,1);diasAusencia.add(key);}}}}
  else{if(r.inicio.slice(0,7)!==end.slice(0,7))mesInicio++;add(r.inicio,metric.id,amount);}
 }
 const anual=annual.get(anio)||empty(),mensual=Array.from({length:12},(_,i)=>{const mes=String(i+1).padStart(2,'0'),key=anio+'-'+mes;return {mes:i+1,periodo:key,valores:monthly.get(key)||empty()};});
 return {indicadores:INDICADORES_AUSENTISMO.map(({id,nombre,unidad})=>({id,nombre,unidad})),anio,mensual,anual,vida_laboral:lifetime,por_anio:[...annual].sort((a,b)=>a[0]-b[0]).map(([anio,valores])=>({anio,valores})),cobertura:{desde:inicio,hasta:fin,fecha_consulta:hasta||null},calidad:{sin_cantidad:sinCantidad,estados_pendientes:pendientes,futuros_no_incluidos:futuros,asignados_mes_inicio:mesInicio}};
}
