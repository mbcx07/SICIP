export const CAMPOS_PERFIL=[['telefono','Teléfono','tel',30],['fecha_nacimiento','Fecha de nacimiento','date',10],['domicilio','Domicilio','text',500],['contacto_emergencia','Contacto de emergencia','text',150],['telefono_emergencia','Teléfono de emergencia','tel',30]];
export function camposPendientes(p={}){return CAMPOS_PERFIL.filter(([k])=>!String(p[k]||'').trim()).map(([,label])=>label);}
export function perfilCompleto(p={},c={}){return !camposPendientes(p).length&&!!(c.institucional||c.personal)&&['institucional','personal'].every(k=>!c[k]||!!c[k+'_verificado']);}
