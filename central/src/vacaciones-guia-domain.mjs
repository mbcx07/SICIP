export const TURNOS_VACACIONES={'1':'1-Matutino','2':'2-Vespertino','3':'3-Nocturno','4':'4-Móvil','5':'5-Jornada Acumulada'};
export function turnoDescripcion(codigo){const value=String(codigo??'').trim(),key=/^\d+$/.test(value)?String(Number(value)):value;return TURNOS_VACACIONES[key]||value||'Sin turno registrado';}
import {limitesProgramacion,motivoRol} from './vacaciones-reglas.mjs';
import {rolMadre} from './vacaciones-calendarios.mjs';
export const MARCAS_GUIA={
 '0':'Disfrute continuo con pago del concepto 048. Los días dependen de la modalidad y antigüedad.',
 '1':'Disfrute fraccionado con pago del concepto 048; deben completarse las dos fracciones del derecho.',
 '2':'Primer periodo o primera parte sin pago del concepto 048. Debe respetar su secuencia.',
 '3':'Segundo periodo o segunda parte sin pago del concepto 048; requiere la primera parte correspondiente.',
 '4':'Disfrute de hasta 10 días con pago del concepto 048. Se encadena con marca 9.',
 '5':'Segundo o tercer periodo cuatrimestral sin pago del concepto 048; respeta la secuencia 2 → 5 → 5.',
 '6':'Extraordinario de 20 años: 15 días de disfrute sin pago del concepto 048.',
 '7':'Extraordinario de 20 años: pago del concepto 048 sin ausencia. Se enlaza al inicio de un periodo ordinario autorizado.',
 '8':'Extraordinario de 20 años: acumulación de antigüedad para jubilación, sin ausencia vacacional.',
 '9':'Disfrute de hasta 10 días sin pago del concepto 048. Se encadena con marca 4; pueden invertir su orden.'};
export function compatibilidadRol(rol,p,dias,marca=p.payload?.marca||p.marca){
 const spec={...p.payload,...p,marca},limits=limitesProgramacion(spec);let motivo=motivoRol(rol,spec,marca,dias),madre=null;
 if(!motivo&&limits.desde&&rol.inicio<limits.desde)motivo=limits.motivo+' Primera fecha permitida: '+limits.desde+'.';
 if(!motivo)try{madre=rolMadre(rol.numero,Number(dias),p.regimen);}catch(e){motivo=e.message;}
 return {compatible:!motivo,motivo,madre,limites:limits,anticipados:spec.vencimiento?Math.max(0,Math.round((Date.parse(spec.vencimiento)-Date.parse(rol.inicio))/86400000)):0};
}
export function fotoPermitida(value){
 if(typeof value!=='string')return null;
 if(/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value)&&value.length<=700000)return value;
 try{const u=new URL(value);if(u.protocol==='https:'&&!u.username&&!u.password&&['firebasestorage.googleapis.com','storage.googleapis.com'].includes(u.hostname)&&value.length<=3000)return value;}catch{}
 return null;
}
