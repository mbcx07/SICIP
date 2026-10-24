// Reglas compartidas por captura y servidor: circulares 273/274 y anexo 1 del 1A74-003-025.
const DAY=86400000;
const time=s=>Date.parse(s+'T12:00:00Z');
export const sumarDias=(s,n)=>new Date(time(s)+n*DAY).toISOString().slice(0,10);
export function numeroPeriodo(p){return /^\d{1,4}$/.test(String(p.numero||''))?Number(p.numero):null;}
export function primerPeriodo(p){const n=numeroPeriodo(p);return p.primer_periodo===true||p.modalidad==='NORMAL'&&n===1||p.modalidad==='CUATRIMESTRAL'&&n===101||p.modalidad==='EXTRA20'&&n===220;}
export function limitesProgramacion(p){
 const primer=primerPeriodo(p),max=p.regimen==='ESTATUTO'||primer||p.modalidad==='EXTRA20'&&String(p.marca)==='8'?0:p.modalidad==='CUATRIMESTRAL'?105:120;
 const base=p.regimen==='ESTATUTO'?'Circular 273, página 4: Estatuto no permite anticipación.':primer?'Circular 274, página 3 / anexo 1: el primer periodo debe estar vencido.':p.modalidad==='CUATRIMESTRAL'?'Circular 274, página 3: hasta 105 días naturales antes del vencimiento.':p.modalidad==='EXTRA20'&&String(p.marca)==='8'?'Anexo 1 y numeral 5.2.54: acumulación requiere el periodo vencido.':'Circular 274, página 3: hasta 120 días naturales antes del vencimiento.';
 const desde=p.vencimiento?sumarDias(p.vencimiento,-max):null,year=Number(p.anio||2027);
 return {dias:max,desde:desde&&desde<year+'-01-01'?year+'-01-01':desde,hasta:year+'-12-31',motivo:base};
}
export function motivoRol(rol,p,marca,dias){
 if(rol.tipo!=='B')return '';
 if(Number(dias)>10)return 'Rol par B corto: sólo admite fracciones de hasta 10 días.';
 if(p.regimen==='ESTATUTO')return ['2','3'].includes(String(marca))?'':'Estatuto: los roles pares B requieren marca 2 o 3 fraccionada.';
 return p.modalidad==='NORMAL'&&['1','4','9'].includes(String(marca))||p.modalidad==='EXTRA20'&&String(marca)==='0'?'':'Esta marca corresponde a periodo largo; selecciona un rol non A.';
}
export function validarNumero(p){
 const n=numeroPeriodo(p);if(n===null||n<1)throw Error('Captura el número numérico de periodo que aparece en el tarjetón.');
 if(p.regimen==='ESTATUTO'&&n%2===0)throw Error('El ciclo de Estatuto debe certificarse desde su primer periodo non; la segunda fracción par se enlaza a ese mismo derecho anual.');
 if(p.regimen==='CCT'&&p.modalidad==='NORMAL'){
  if(String(p.marca)==='3'&&n%2!==0)throw Error('Marca 3 cierra el segundo periodo: el número del tarjetón debe ser par y estar precedido por marca 2.');
  if(['0','1','2','4','9'].includes(String(p.marca))&&n%2!==1)throw Error('El ciclo semestral comienza en un periodo non del tarjetón. Para la segunda fracción selecciona el ciclo ya programado; las marcas 4 y 9 van encadenadas.');
 }
 if(p.modalidad==='CUATRIMESTRAL'){
  if(n<101)throw Error('Los periodos cuatrimestrales se identifican desde 101 en el tarjetón.');
  const fase=(n-101)%3+1;if(Number(p.fase)!==fase)throw Error('La fase cuatrimestral corresponde al número del tarjetón: fase '+fase+'.');
  if(String(p.marca)==='2'&&fase!==1||String(p.marca)==='5'&&fase===1)throw Error('La secuencia cuatrimestral sin renuncia es 2 → 5 → 5.');
 }
 if(p.modalidad==='EXTRA20'&&n<220)throw Error('El extraordinario se identifica desde el periodo 220 del tarjetón.');
 return n;
}
