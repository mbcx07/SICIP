export function finInclusivo(inicio,dias){if(!/^\d{4}-\d{2}-\d{2}$/.test(inicio||'')||!Number.isInteger(dias)||dias<1||dias>3660)throw Error('Indica fecha y días naturales válidos.');const d=new Date(inicio+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==inicio)throw Error('Fecha inválida.');d.setUTCDate(d.getUTCDate()+dias-1);return d.toISOString().slice(0,10);}
export const folioEnvio=id=>'E-'+String(id).padStart(6,'0');
export const estadosDocumento=['RECIBIDO','EN_TRANSITO','PENDIENTE_INCLUSION','TRABAJADO'];
