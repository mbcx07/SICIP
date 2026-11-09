// Casillas disponibles en el formato oficial VAC-06.
export function casillaVac06(r,p){
 const d=r.payload||{},m=p.modalidad,explicit=Number(d.v06_ordinal),number=Number(d.numero_periodo_siap||p.numero);
 const ordinal=explicit|| (m==='NORMAL'?(number>0?(number%2===0?2:1):String(d.marca??p.payload?.marca)==='3'?2:1):m==='CUATRIMESTRAL'?Number(p.payload?.fase)||(number>=101?(number-101)%3+1:1):1);
 return m+':'+ordinal;
}
export function validarConjuntoVac06(entries){
 if(!entries.length||entries.length>6)throw Error('La VAC-06 admite dos periodos semestrales, tres cuatrimestrales y uno extra.');
 const first=entries[0],slots=new Set();for(const {registro:r,periodo:p} of entries){
  if(r.matricula!==first.registro.matricula||p.anio!==first.periodo.anio||p.regimen!=='CCT'||!['PROGRAMACION','DIFERIMIENTO'].includes(r.tipo))throw Error('Los roles deben corresponder al mismo trabajador, año y régimen CCT.');
  if(['CANCELADA','SUSTITUIDA'].includes(r.estado))throw Error('No se puede incluir un rol cancelado o sustituido.');
  if(['jefe','dependencia'].some(k=>r.payload[k]!==first.registro.payload[k]))throw Error('Los roles de una VAC-06 deben tener los mismos firmantes.');
  const key=casillaVac06(r,p);if(!/^(NORMAL:[12]|CUATRIMESTRAL:[123]|EXTRA20:1)$/.test(key)||slots.has(key))throw Error('La casilla de este periodo ya está ocupada en la VAC-06. Utiliza otra solicitud.');slots.add(key);
 }
 return true;
}
