// ============================================================
// SICIP — Tipos del Sistema
// ============================================================

// ─── Roles ────────────────────────────────────────────────
export enum Rol {
  TRABAJADOR = 'TRABAJADOR',
  JEFE_SERVICIO = 'JEFE_SERVICIO',
  AREA_PERSONAL = 'AREA_PERSONAL',
  ADMIN = 'ADMIN'
}

// ─── Estados del Workflow ─────────────────────────────────
export enum Estatus {
  BORRADOR = 'BORRADOR',
  GENERADO = 'GENERADO',
  PENDIENTE_ENTREGA = 'PENDIENTE_ENTREGA',
  RECIBIDO = 'RECIBIDO',
  EN_REVISION = 'EN_REVISION',
  VALIDADO = 'VALIDADO',
  OBSERVADO = 'OBSERVADO',
  DEVUELTO = 'DEVUELTO',
  RECHAZADO = 'RECHAZADO',
  ENVIADO_DELEGACION = 'ENVIADO_DELEGACION',
  EN_ANALISIS = 'EN_ANALISIS',
  EN_CRITICA = 'EN_CRITICA',
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  PAGADO = 'PAGADO',
  CONCLUIDO = 'CONCLUIDO',
  VENCIDO = 'VENCIDO'
}

// ─── Tipos de Trámite ────────────────────────────────────
export enum TipoTramite {
  // Solicitudes de Pago
  SOLICITUD_CONTRATO = 'SOLICITUD_CONTRATO',
  TIEMPO_EXTRAORDINARIO = 'TIEMPO_EXTRAORDINARIO',
  GUARDIA_FESTIVA = 'GUARDIA_FESTIVA',
  NIVELACION = 'NIVELACION',
  SUSTITUCION = 'SUSTITUCION',

  // Pases
  PASE_ENTRADA = 'PASE_ENTRADA',
  PASE_SALIDA = 'PASE_SALIDA',
  PASE_INTERMEDIO = 'PASE_INTERMEDIO',

  // Licencias
  LICENCIA_SGSS = 'LICENCIA_SGSS',           // Sin goce de sueldo
  LICENCIA_MEDICA = 'LICENCIA_MEDICA',
  LICENCIA_MATERNIDAD = 'LICENCIA_MATERNIDAD',
  INCAPACIDAD_RT = 'INCAPACIDAD_RT',          // Riesgo de trabajo
  INCAPACIDAD_EG = 'INCAPACIDAD_EG',          // Enfermedad general

  // Documentación
  RECEPCION_DOCUMENTO = 'RECEPCION_DOCUMENTO',
  VACACIONES = 'VACACIONES',
}

// ─── Info del Trabajador ──────────────────────────────────
export interface Trabajador {
  matricula: string;           // ID único
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp?: string;
  rfc?: string;
  nss?: string;
  area: string;
  categoria?: string;
  tipoContrato: string;         // 01=Confianza, 02=Base, 08=Sustituto, etc.
  unidadClave: string;
  unidadNombre: string;
  delegacion: string;
  email?: string;
  telefono?: string;
  fechaIngreso?: string;
  jefeInmediato?: string;
  activo: boolean;
  fechaActualizacion: string;
}

// ─── Usuario (Auth) ──────────────────────────────────────
export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  rol: Rol;
  matricula?: string;           // FK a Trabajador (si es TRABAJADOR o JEFE_SERVICIO)
  unidadClave?: string;
  unidadNombre?: string;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

// ─── Datos específicos por tipo de Trámite ────────────────
export interface DatosSolicitudPago {
  tipoSolicitud: TipoTramite.TIEMPO_EXTRAORDINARIO | TipoTramite.GUARDIA_FESTIVA | TipoTramite.NIVELACION | TipoTramite.SUSTITUCION | TipoTramite.SOLICITUD_CONTRATO;
  // Campos comunes a todas las solicitudes de pago
  fechaIncidencia: string;
  horaIncio?: string;
  horaFin?: string;
  totalHoras?: number;
  dias?: number;
  motivo: string;
  // Campos específicos
  clavePresupuestal?: string;
  importSolicitado?: number;
  importAutorizado?: number;
  qnaPago?: string;
  // Sustitución
  trabajadorSustituidoMatricula?: string;
  trabajadorSustituidoNombre?: string;
  motivoSustitucion?: string;
  // Nivelación
  plazaActual?: string;
  plazaSuperior?: string;
  // Guardia
  diaFestivo?: string;
  // Contrato
  tipoContrato?: string;
  fechaInicioContrato?: string;
  fechaFinContrato?: string;
}

export interface DatosPase {
  tipoPase: TipoTramite.PASE_ENTRADA | TipoTramite.PASE_SALIDA | TipoTramite.PASE_INTERMEDIO;
  fecha: string;
  hora: string;
  motivo: string;
  destino?: string;
  regresa?: boolean;
  horasAusente?: number;
}

export interface DatosLicencia {
  tipoLicencia: TipoTramite.LICENCIA_SGSS | TipoTramite.LICENCIA_MEDICA | TipoTramite.LICENCIA_MATERNIDAD;
  fechaInicio: string;
  fechaFin: string;
  totalDias: number;
  motivo: string;
  // Para licencias médicas
  numeroIncacidad?: string;
  diagnostico?: string;
  folioIMSS?: string;
  // Afecta prestaciones
  afectaSalario: boolean;
  afectaAguinaldo: boolean;
  afectaAntiguedad: boolean;
  afectaFondoAhorro: boolean;
}

export interface DatosRecepcionDoc {
  tipoDocumento: string;
  folioDocumento?: string;
  fechaDocumento: string;
  origenDocumento: string;
  observaciones?: string;
  requiereRespuesta: boolean;
  fechaLimiteRespuesta?: string;
}

// ─── Trámite ─────────────────────────────────────────────
export interface Tramite {
  id: string;
  folio: string;                    // SICIP-UNIDAD-AÑO-CONSECUTIVO
  tipo: TipoTramite;
  subtipo?: string;

  // Trabajador
  trabajadorMatricula: string;
  trabajadorNombre: string;
  unidadClave: string;
  unidadNombre: string;

  // quien lo genera
  solicitanteUid: string;
  solicitanteNombre: string;
  solicitanteRol: Rol;

  // fechas
  fechaCreacion: string;
  fechaIncidencia?: string;
  fechaLimiteEntrega?: string;     // calculada según norma (ej: 3 días naturales)
  fechaEntregaFisica?: string;
  fechaRecepcion?: string;

  // datos específicos (tipo-dependent)
  datos: DatosSolicitudPago | DatosPase | DatosLicencia | DatosRecepcionDoc | Record<string, any>;

  // archivos
  archivosUrls: string[];

  // status
  estatus: Estatus;
  estatusAnterior?: Estatus;

  // validación
  validadorUid?: string;
  validadorNombre?: string;
  fechaValidacion?: string;
  observacionesValidacion?: string;

  // rechazo/devolución
  motivoRechazo?: string;
  motivoDevolucion?: string;

  // envío a delegación
  enviadoDelegacionUid?: string;
  enviadoDelegacionFecha?: string;
  receivedDelegacionUid?: string;
  receivedDelegacionFecha?: string;

  // cierre
  fechaConclusion?: string;
  quienConclusionUid?: string;
  quienConclusionNombre?: string;
}

// ─── Historial de Estados ────────────────────────────────
export interface HistorialEstado {
  id: string;
  tramiteId: string;
  estatusAnterior?: Estatus;
  estatusNuevo: Estatus;
  usuarioUid: string;
  usuarioNombre: string;
  fecha: string;
  hora: string;
  observacion?: string;
  motivo?: string;
}

// ─── Tipo de Trámite (Catálogo Normativo) ───────────────
export interface TipoTramiteConfig {
  id: string;
  tipo: TipoTramite;
  nombre: string;
  descripcion: string;
  modulo: 'SOLICITUDES_PAGO' | 'PASES' | 'LICENCIAS' | 'RECEPCION_DOC';

  // Fundamento normativo
  fundamento?: {
    articulo?: string;
    clausula?: string;
    parrafo?: string;
    numeral?: string;
    texto?: string;
  };

  // Quién puede solicitar
  solicitaRol: Rol[];

  // Quién puede validar
  validaRol: Rol[];

  // Reglas
  reglas: {
    plazoEntregaDias?: number;         // días naturales para entrega
    requiereEntregaFisica: boolean;
    requiereEnvioDelegacion: boolean;
    afectaPrestaciones: boolean;
    requiereAutorizacionJefe: boolean;
    generaPago: boolean;
    diasMaximosResolucion?: number;
  };

  // Requisitos documentales
  requisitosDocumentales: string[];

  // Advertencias (mostrar antes de enviar)
  advertencias: string[];

  // Pasos del flujo
  flujoPasos: string[];

  // Causas de rechazo
  causasRechazo: string[];

  // Campos específicos que debe capturar
  camposRequeridos: string[];         // nombres de campos en el formulario

  // ¿Activo?
  activo: boolean;
}

// ─── Unidad Médica ────────────────────────────────────────
export interface Unidad {
  clave: string;                     // 03HD01, 03UA34, etc.
  nombre: string;
  tipo: 'UMF' | 'HOSPITAL' | 'HG' | 'HR' | 'OTRO';
  delegacion: string;
  activo: boolean;
}

// ─── Configuración General ───────────────────────────────
export interface ConfiguracionSistema {
  id: string;
  nombreInstitucion: string;
  ooad: string;
  logoUrl?: string;
  ejercicioActual: number;
  mensajeBienvenida?: string;
  contactoSistemas?: string;
}

// ─── Catálogo de Unidades (cache local) ──────────────────
export const COLOR_ESTATUS: Record<Estatus, string> = {
  [Estatus.BORRADOR]:       '#94a3b8',  // gray
  [Estatus.GENERADO]:        '#3b82f6',  // blue
  [Estatus.PENDIENTE_ENTREGA]: '#f59e0b', // amber
  [Estatus.RECIBIDO]:        '#8b5cf6',  // purple
  [Estatus.EN_REVISION]:     '#6366f1',  // indigo
  [Estatus.VALIDADO]:        '#10b981',  // emerald
  [Estatus.OBSERVADO]:       '#f97316',  // orange
  [Estatus.DEVUELTO]:        '#ef4444',  // red
  [Estatus.RECHAZADO]:       '#dc2626',  // red dark
  [Estatus.ENVIADO_DELEGACION]: '#0ea5e9', // sky
  [Estatus.EN_ANALISIS]:     '#14b8a6',  // teal
  [Estatus.EN_CRITICA]:      '#a855f7',  // violet
  [Estatus.PENDIENTE_PAGO]:  '#eab308',  // yellow
  [Estatus.PAGADO]:          '#22c55e',  // green
  [Estatus.CONCLUIDO]:       '#16a34a',  // green dark
  [Estatus.VENCIDO]:         '#b91c1c',  // red very dark
};

export const LABEL_ESTATUS: Record<Estatus, string> = {
  [Estatus.BORRADOR]: 'Borrador',
  [Estatus.GENERADO]: 'Generado',
  [Estatus.PENDIENTE_ENTREGA]: 'Pendiente de entrega',
  [Estatus.RECIBIDO]: 'Recibido',
  [Estatus.EN_REVISION]: 'En revisión',
  [Estatus.VALIDADO]: 'Validado',
  [Estatus.OBSERVADO]: 'Observado',
  [Estatus.DEVUELTO]: 'Devuelto',
  [Estatus.RECHAZADO]: 'Rechazado',
  [Estatus.ENVIADO_DELEGACION]: 'Enviado a Delegación',
  [Estatus.EN_ANALISIS]: 'En análisis',
  [Estatus.EN_CRITICA]: 'En crítica de nómina',
  [Estatus.PENDIENTE_PAGO]: 'Pendiente de pago',
  [Estatus.PAGADO]: 'Pagado',
  [Estatus.CONCLUIDO]: 'Concluido',
  [Estatus.VENCIDO]: 'Vencido',
};

export const ROLES_CONFIG: Record<Rol, { label: string; color: string }> = {
  [Rol.TRABAJADOR]:     { label: 'Trabajador',     color: '#0ea5e9' },
  [Rol.JEFE_SERVICIO]:  { label: 'Jefe de Servicio', color: '#8b5cf6' },
  [Rol.AREA_PERSONAL]:  { label: 'Área de Personal', color: '#10b981' },
  [Rol.ADMIN]:          { label: 'Administrador',  color: '#ef4444' },
};
