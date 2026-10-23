// Reference-only decoding. No personnel status, salary or eligibility is inferred.
import base from './personal-normativa.json' with {type:'json'};
import bolsaCCT from './bolsa-cct-normativa.json' with {type:'json'};
import aclaracionesTP from './personal-tp-aclaraciones.json' with {type:'json'};
const tiposPlazaDocumentales=[...(base.tipos_plaza||[]),...bolsaCCT.tipos_plaza];
const clavesAclaradas=new Set(aclaracionesTP.tipos_plaza.map(r=>r.clave));
const tiposPlaza=[...tiposPlazaDocumentales.filter(r=>!clavesAclaradas.has(r.clave)),...aclaracionesTP.tipos_plaza.map(r=>({...r,fuente:aclaracionesTP.fuente,fecha:aclaracionesTP.fecha,confirmacion:aclaracionesTP.estado,antecedentes:tiposPlazaDocumentales.filter(d=>d.clave===r.clave)}))];
const catalogo={...base,fuentes:[...base.fuentes,...bolsaCCT.fuentes],tipos_plaza:tiposPlaza,conceptos:[...base.conceptos,...bolsaCCT.conceptos],status_contextuales:[...(base.status_contextuales||[]),...bolsaCCT.status_contextuales],motivos_sustitucion:bolsaCCT.motivos_sustitucion,cct:bolsaCCT.cct};
export {catalogo};
const str=v=>v==null?'':String(v).trim();
export function identificarClave(campo,valor){
 const original=str(valor);
 let clave=original;
 if(['tipo_contratacion_codigo','baja_codigo','marca_ocupacion_codigo','tipo_plaza_codigo'].includes(campo)&&/^\d{1,2}$/.test(clave))clave=clave.padStart(2,'0');
 const listas={tipo_contratacion_codigo:catalogo.tipos_contratacion,incidencia_aps:catalogo.incidencias_aps,concepto:catalogo.conceptos,horario_estatuto:catalogo.horarios_estatuto,baja_codigo:catalogo.marcas_baja||[],marca_ocupacion_codigo:catalogo.marcas_ocupacion||[],tipo_plaza_codigo:catalogo.tipos_plaza||[],motivo_sustitucion:catalogo.motivos_sustitucion};
 if(!Object.hasOwn(listas,campo))return {campo,original,clave,estado:'PENDIENTE',referencias:[]};
 const referencias=listas[campo].filter(row=>row.clave===clave);
 return {campo,original,clave,estado:referencias.some(r=>r.estado==='CONFLICTO_DOCUMENTAL')?'CONFLICTO_DOCUMENTAL':referencias.length?'IDENTIFICADA':'PENDIENTE',referencias};
}
export function referenciaHorario(valor){
 const clave=str(valor),exacto=identificarClave('horario_estatuto',clave);
 if(exacto.estado==='IDENTIFICADA')return {...exacto,tipo:'CATALOGO_ESTATUTO',registros_semanales:null,requiere_calendario:true};
 if(!/^[0BCDEF][0-9]{3}$/.test(clave))return {clave,estado:'PENDIENTE',requiere_calendario:true};
 const referencia=catalogo.prefijos_horarios.find(r=>r.prefijo===clave[0]);
 return {clave,estado:'SOLO_FRECUENCIA',tipo:'PREFIJO',registros_semanales:referencia.registros_semanales,referencia,requiere_calendario:true};
}
