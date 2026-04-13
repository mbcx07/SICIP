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
  status: 'ABIERTA' | 'CUBIERTA' | 'CANCELADA';
  ternaCerrada: boolean;             // true = jefe confirmó terna final

  // Fechas
  fechaCreacion: string;
  fechaCierre?: string;
  cerradoPorUid?: string;
  cerradoPorNombre?: string;
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