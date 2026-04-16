// ─── Módulo de Cuadro de Reemplazo ─────────────────────

/**
 * Plaza que necesita reemplazo (vacante temporal de confianza).
 * Creada por ADMIN o Area Personal para un Jefe de Servicio.
 */
export interface PlazaReemplazo {
  id: string;
  // Identificación de la plaza
  clavePlaza: string;
  nombrePlaza: string;
  tipoPlaza: 'CONFIANZA' | 'BASE';
  categoria: string;

  // Requisitos codificados desde convocatorias
  escolaridadMinima: string;        // ej: "Licenciatura en enfermería"
  experienciaAnos: number;          // años mínimos requeridos
  experienciaRequerida: string;     // descripción textual
  habilidadesRequeridas: string[];   // lista de habilidades

  // Ubicación
  unidadClave: string;
  unidadNombre: string;
  departamento: string;

  // Quién necesita el reemplazo
  jefeServicioUid: string;          // dueño del cuadro
  jefeServicioNombre: string;
  jefeServicioMatricula: string;

  // Motivo de la ausencia
  motivo: 'LICENCIA' | 'INCAPACIDAD' | 'VACACIONES' | 'COMISION' | 'OTRO';
  nombreAusente: string;
  matriculaAusente: string;
  fechaInicioAusencia: string;
  fechaFinAusencia: string;

  // Estado
  status: EstatusPlaza;
  ternaCerrada: boolean;             // true = jefe confirmó terna final

  // Approval flow fields
  observacionesAP?: string;
  observacionesDelegacion?: string;
  validadaPorUid?: string;
  validadaPorNombre?: string;
  validadaFecha?: string;
  enviadaDelegacionPorUid?: string;
  enviadaDelegacionPorNombre?: string;
  enviadaDelegacionFecha?: string;
  resueltaPorUid?: string;
  resueltaPorNombre?: string;
  resueltaFecha?: string;
  motivoRechazo?: string;

  // Fechas
  fechaCreacion: string;
  fechaCierre?: string;
  cerradoPorUid?: string;
  cerradoPorNombre?: string;
  fechaActualizacion?: string;
}

/**
 * Un candidato en la terna (hasta 3).
 */
export interface CandidatoReemplazo {
  posicion: 1 | 2 | 3;             // prioridad
  matricula: string;
  nombre: string;
  area: string;
  tipoContrato: string;
  observacionesJefe?: string;       // notas del jefe sobre el candidato
  justificacion?: JustificacionTecnica;
  fechaAgregado: string;
  agregadoPorUid: string;
  agregadoPorNombre: string;
}

/**
 * Cuadro de reemplazo: terna de candidatos para una plaza.
 * Creado por el jefe de servicio para cada plaza.
 */
export interface CuadroReemplazo {
  id: string;
  plazaId: string;                  // FK → PlazaReemplazo.id

  // Estado del cuadro
  status: 'BORRADOR' | 'COMPLETO' | 'CERRADO';

  // Candidatos (1-3, siempre ordenados por prioridad)
  candidatos: CandidatoReemplazo[];

  // Notifications
  notificacionPendiente: boolean;   // true = alertar al jefe que falta candidato
  ultimaNotificacionEnviada?: string;

  // Cierre
  candidatoSeleccionado?: number;  // cuál (1, 2 o 3) fue seleccionado como definitivo
  fechaCierre?: string;
  cerradoPorUid?: string;
  cerradoPorNombre?: string;

  // timestamps
  fechaCreacion: string;
  fechaActualizacion: string;
}

/**
 * Postulación de un trabajador a un cuadro de reemplazo.
 */
export type EstatusPostulacion = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'RETIRADO';

export interface PostulacionReemplazo {
  id: string;
  cuadroId: string;                 // FK → CuadroReemplazo.id
  plazaId: string;                   // FK → PlazaReemplazo.id

  // Datos del trabajador
  trabajadorMatricula: string;
  trabajadorNombre: string;
  unidadClave: string;
  unidadNombre: string;
  email?: string;
  telefono?: string;

  // Currículum
  curriculumUrl?: string;            // Storage URL
  curriculumNombre?: string;         // nombre original del archivo

  // Estatus
  status: EstatusPostulacion;

  // Respuesta del jefe
  evaluadoPorUid?: string;
  evaluadoPorNombre?: string;
  fechaEvaluacion?: string;
  comentarioJefe?: string;

  // Timestamps
  fechaPostulacion: string;
  fechaActualizacion: string;
}

// ─── New approval flow statuses for PlazaReemplazo ─────────

export enum EstatusPlaza {
  ABIERTA = 'ABIERTA',
  TERNA_PROPUESTA = 'TERNA_PROPUESTA',
  EN_REVISION_AP = 'EN_REVISION_AP',
  DEVUELTA_AP = 'DEVUELTA_AP',
  VALIDADA_AP = 'VALIDADA_AP',
  ENVIADA_DELEGACION = 'ENVIADA_DELEGACION',
  RESUELTA_DELEGACION = 'RESUELTA_DELEGACION',
  CUBIERTA = 'CUBIERTA',
  CANCELADA = 'CANCELADA',
}

export const ESTATUS_PLAZA_LABELS: Record<EstatusPlaza, string> = {
  [EstatusPlaza.ABIERTA]: 'Abierta',
  [EstatusPlaza.TERNA_PROPUESTA]: 'Terna Propuesta',
  [EstatusPlaza.EN_REVISION_AP]: 'En Revisión (Área Personal)',
  [EstatusPlaza.DEVUELTA_AP]: 'Devuelta por Área Personal',
  [EstatusPlaza.VALIDADA_AP]: 'Validada por Área Personal',
  [EstatusPlaza.ENVIADA_DELEGACION]: 'Enviada a Delegación',
  [EstatusPlaza.RESUELTA_DELEGACION]: 'Resuelta por Delegación',
  [EstatusPlaza.CUBIERTA]: 'Cubierta',
  [EstatusPlaza.CANCELADA]: 'Cancelada',
};

export const ESTATUS_PLAZA_COLORS: Record<EstatusPlaza, string> = {
  [EstatusPlaza.ABIERTA]: '#f59e0b',
  [EstatusPlaza.TERNA_PROPUESTA]: '#3b82f6',
  [EstatusPlaza.EN_REVISION_AP]: '#8b5cf6',
  [EstatusPlaza.DEVUELTA_AP]: '#f97316',
  [EstatusPlaza.VALIDADA_AP]: '#10b981',
  [EstatusPlaza.ENVIADA_DELEGACION]: '#0ea5e9',
  [EstatusPlaza.RESUELTA_DELEGACION]: '#059669',
  [EstatusPlaza.CUBIERTA]: '#6b7280',
  [EstatusPlaza.CANCELADA]: '#dc2626',
};

export const ESTATUS_PLAZA_BG: Record<EstatusPlaza, string> = {
  [EstatusPlaza.ABIERTA]: '#fef3c7',
  [EstatusPlaza.TERNA_PROPUESTA]: '#dbeafe',
  [EstatusPlaza.EN_REVISION_AP]: '#ede9fe',
  [EstatusPlaza.DEVUELTA_AP]: '#fff7ed',
  [EstatusPlaza.VALIDADA_AP]: '#d1fae5',
  [EstatusPlaza.ENVIADA_DELEGACION]: '#e0f2fe',
  [EstatusPlaza.RESUELTA_DELEGACION]: '#d1fae5',
  [EstatusPlaza.CUBIERTA]: '#f3f4f6',
  [EstatusPlaza.CANCELADA]: '#fee2e2',
};

// Justification per candidate
export interface JustificacionTecnica {
  escolaridadRequerida: string;
  escolaridadCandidato: string;
  escolaridadCumple: boolean;
  experienciaRequeridaAnios: number;
  experienciaCandidatoAnios: number;
  experienciaCumple: boolean;
  evaluacionDesempenio: 'SOBRESALIENTE' | 'DESTACADO' | 'SATISFACTORIO' | 'NO_APROBADO' | 'SIN_EVALUACION';
  evaluacionFecha?: string;
  evaluacionPuntaje?: number;
  capacitacionVigente: boolean;
  capacitacionDetalles?: string;
  tieneImpedimentos: boolean;
  impedimentosDetalle?: string;
  procedimientosPendientes: number;
  sancionesVigentes: number;
  justificacionLibre: string;
}

// Validation result
export interface ResultadoValidacion {
  tipo: 'BLOQUEANTE' | 'ADVERTENCIA' | 'OK';
  campo: string;
  mensaje: string;
  detalle?: string;
}

// History entry
export interface HistorialReemplazo {
  id: string;
  plazaId: string;
  cuadroId?: string;
  accion: string;
  usuarioUid: string;
  usuarioNombre: string;
  usuarioRol: string;
  fecha: string;
  observaciones?: string;
  metadata?: Record<string, any>;
}

// Notification
export interface NotificacionSICIP {
  id: string;
  destinatarioUid: string;
  destinatarioRol: string;
  tipo: 'TERNA_LISTA' | 'TERNA_DEVUELTA' | 'TERNA_VALIDADA' | 'DELEGACION_RESUELTA' | 'DESIGNACION_CONFIRMADA' | 'PLAZA_CANCELADA' | 'SIN_CUADRO_ASIGNADO';
  plazaId: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  accionUrl: string;
}

// Official document
export interface DocumentoOficial {
  id: string;
  plazaId: string;
  tipo: 'PROPUESTA_TERNA' | 'DESIGNACION' | 'AGRADECIMIENTO' | 'NO_IMPEDIMENTO';
  numeroOficio: string;
  fechaGeneracion: string;
  generadoPorUid: string;
  generadoPorNombre: string;
  pdfUrl?: string;
}

/**
 * Convocatoria codificada: requisitos de un puesto.
 * Alimentado desde los PDFs que envíe el Jefe.
 */
export interface ConvocatoriaReemplazo {
  id: string;
  nombrePuesto: string;
  escolaridadMinima: string;
  escolaridadAceptable?: string;    // alternativas
  experienciaAnosMinimos: number;
  experienciaDescripcion: string;
  habilidadesRequeridas: string[];
  conocimientosAdicionales?: string[];
  observaciones?: string;
  activo: boolean;
}