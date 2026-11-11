export const MODULOS=[
 ['inicio','Inicio',[['inicio','Inicio','inicio']]],
 ['cuadros','Cuadros de Reemplazo',[['cuadros.mi','Mi Cuadro de Reemplazo','cuadros'],['cuadros.postular','Solicitar Puesto de Confianza','cuadros'],['cuadros.recibidas','Solicitudes de currículum recibidas','cuadros']]],
 ['tramites','Mis Trámites',[['tramites.seguimiento','Seguimiento de mis trámites','solicitudes']]],
 ['solicitudes','Solicitudes personales',[['solicitudes.pases','Solicitar y consultar pases','pases'],['solicitudes.pecv','Mi solicitud de PECV','solicitudes']]],
 ['jefe','Jefe de Servicio',[['jefe.historial','Historial de Trabajador','bandeja'],['jefe.cobertura.nueva','Nueva solicitud de cobertura','contrato'],['jefe.cobertura.historial','Mis solicitudes de cobertura','contrato']]],
 ['personal','Departamento de Personal',[['personal.pases','Trámite de Pases','pases'],['personal.cuadros','Resumen CR','cuadros'],['personal.bandeja','Bandeja de Trámites','bandeja'],['personal.recepcion','Recepciones por QR y folio','recepciones'],['personal.faltas','Control de Faltas','licencias'],['personal.vacaciones','Vacaciones: programación e historial','solicitudes'],['personal.herramientas.nivelacion','Herramientas · Calculadora de Nivelación','herramientas'],['personal.herramientas.conceptos','Herramientas · Conceptos por primera vez','herramientas'],['personal.herramientas.reintegro','Herramientas · Reintegro de Faltas','herramientas'],['personal.normativas','Normativas y búsqueda','plantilla'],['personal.reclamaciones','Reclamaciones: inclusión y exclusión (PD44)','solicitudes']]],
 ['herramientas','Herramientas',[['herramientas.nivelacion','Cálculo de nivelación','herramientas'],['herramientas.fuerza','Fuerza de Trabajo','herramientas'],['herramientas.transporte','Pago de transporte','herramientas']]],
 ['examenes','Exámenes',[['examenes','Exámenes y resultados','solicitudes']]],
 ['administracion','Administración',[['administracion.personal','Personal y Plazas: cuentas y permisos','admin'],['administracion.jornadas','Jornadas, descansos y tabuladores','admin'],['administracion.cortes','Historial de cortes','admin'],['administracion.unidades','Nombres de las unidades de servicio','admin']]]
].map(([id,nombre,hijos])=>({id,nombre,hijos:hijos.map(([id,nombre,heredado])=>({id,nombre,heredado}))}));
export const ACCESOS=MODULOS.flatMap(m=>m.hijos.map(h=>h.id));
export const esAdmin=u=>['ADMIN','ADMINISTRADOR'].includes(u?.rol);
export function puede(u,...ids){return esAdmin(u)||!u?.accesosDefinidos||ids.some(id=>u.accesos?.includes(id)||id==='personal.herramientas.nivelacion'&&u.accesos?.includes('herramientas.nivelacion'));}
export function permisosHeredados(ids){return [...new Set(MODULOS.flatMap(m=>m.hijos).filter(x=>ids.includes(x.id)).map(x=>x.heredado))];}
export function validarRuta(u,path){if(esAdmin(u)||!u?.accesosDefinidos)return true;
 if(path.startsWith('/api/herramientas/'))return puede(u,'personal.herramientas.nivelacion','personal.herramientas.conceptos','personal.herramientas.reintegro','herramientas.nivelacion');
 if(path==='/api/inicio')return puede(u,'inicio');
 if(path==='/api/personal/incidencias')return puede(u,'inicio','personal.faltas','tramites.seguimiento','jefe.historial');
 if(path.startsWith('/api/admin/'))return false;
 if(path.startsWith('/api/personal/jornadas'))return puede(u,'personal.vacaciones','jefe.cobertura.nueva','jefe.cobertura.historial');
 if(path.startsWith('/api/vacaciones/mi-pecv'))return puede(u,'solicitudes.pecv');
 if(path.startsWith('/api/vacaciones/'))return puede(u,'personal.vacaciones','solicitudes.pecv','tramites.seguimiento','personal.recepcion');
 if(path.startsWith('/api/pd44'))return puede(u,'personal.reclamaciones','tramites.seguimiento','personal.recepcion');
 if(path.startsWith('/api/normativas'))return puede(u,'personal.normativas');
 if(path.startsWith('/api/contratacion'))return puede(u,'jefe.cobertura.nueva','jefe.cobertura.historial','personal.bandeja','tramites.seguimiento','personal.recepcion');
 if(path.startsWith('/api/pases'))return puede(u,'solicitudes.pases','personal.pases','personal.recepcion','tramites.seguimiento');
 if(path.startsWith('/api/seguimiento/documento')||path==='/api/seguimiento/recepcion')return puede(u,'personal.recepcion');
 if(path==='/api/mis-tramites')return puede(u,'tramites.seguimiento');
 if(path.startsWith('/api/postulaciones'))return puede(u,'cuadros.postular','cuadros.recibidas');return true;}
export function puedeOtorgar(rol,id){if(rol==='ADMIN')return true;if(id.startsWith('administracion.'))return false;if(id.startsWith('personal.'))return id==='personal.normativas'||id==='personal.vacaciones'&&rol==='JEFE_SERVICIO'||['AREA_PERSONAL','FUERZA_TRABAJO'].includes(rol);if(id.startsWith('jefe.')||['cuadros.mi','cuadros.recibidas'].includes(id))return rol!=='TRABAJADOR';return true;}
