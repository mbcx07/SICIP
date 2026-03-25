// ============================================================
// SICIP — Constantes
// ============================================================

import { TipoTramite, Estatus, Rol } from '../types/sicip';

// ─── Roles ────────────────────────────────────────────────
export const ROL_LABELS: Record<Rol, string> = {
  [Rol.TRABAJADOR]: 'Trabajador',
  [Rol.JEFE_SERVICIO]: 'Jefe de Servicio',
  [Rol.AREA_PERSONAL]: 'Área de Personal',
  [Rol.ADMIN]: 'Administrador',
};

// ─── Estatus ───────────────────────────────────────────────
export const ESTATUS_LABELS: Record<Estatus, string> = {
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

export const COLOR_ESTATUS: Record<Estatus, string> = {
  [Estatus.BORRADOR]: '#94a3b8',
  [Estatus.GENERADO]: '#3b82f6',
  [Estatus.PENDIENTE_ENTREGA]: '#f59e0b',
  [Estatus.RECIBIDO]: '#8b5cf6',
  [Estatus.EN_REVISION]: '#6366f1',
  [Estatus.VALIDADO]: '#10b981',
  [Estatus.OBSERVADO]: '#f97316',
  [Estatus.DEVUELTO]: '#ef4444',
  [Estatus.RECHAZADO]: '#dc2626',
  [Estatus.ENVIADO_DELEGACION]: '#0ea5e9',
  [Estatus.EN_ANALISIS]: '#14b8a6',
  [Estatus.EN_CRITICA]: '#a855f7',
  [Estatus.PENDIENTE_PAGO]: '#eab308',
  [Estatus.PAGADO]: '#22c55e',
  [Estatus.CONCLUIDO]: '#16a34a',
  [Estatus.VENCIDO]: '#b91c1c',
};

// ─── Tipos de Trámite ────────────────────────────────────
export const TIPO_TRAMITE_LABELS: Record<TipoTramite, string> = {
  // Solicitudes de pago
  [TipoTramite.SOLICITUD_CONTRATO]: 'Solicitud de Contrato',
  [TipoTramite.TIEMPO_EXTRAORDINARIO]: 'Tiempo Extraordinario',
  [TipoTramite.GUARDIA_FESTIVA]: 'Guardia Festiva',
  [TipoTramite.NIVELACION]: 'Nivelación',
  [TipoTramite.SUSTITUCION]: 'Sustitución',
  // Pases
  [TipoTramite.PASE_ENTRADA]: 'Pase de Entrada',
  [TipoTramite.PASE_SALIDA]: 'Pase de Salida',
  [TipoTramite.PASE_INTERMEDIO]: 'Pase Intermedio',
  // Licencias
  [TipoTramite.LICENCIA_SGSS]: 'Licencia sin Goce de Sueldo',
  [TipoTramite.LICENCIA_MEDICA]: 'Licencia Médica',
  [TipoTramite.LICENCIA_MATERNIDAD]: 'Licencia por Maternidad',
  [TipoTramite.INCAPACIDAD_RT]: 'Incapacidad por Riesgo de Trabajo',
  [TipoTramite.INCAPACIDAD_EG]: 'Incapacidad por Enfermedad General',
  // Documentación
  [TipoTramite.RECEPCION_DOCUMENTO]: 'Recepción de Documento',
  [TipoTramite.VACACIONES]: 'Vacaciones',
};

export const MODULO_BY_TIPO: Record<TipoTramite, string> = {
  [TipoTramite.SOLICITUD_CONTRATO]: 'SOLICITUDES_PAGO',
  [TipoTramite.TIEMPO_EXTRAORDINARIO]: 'SOLICITUDES_PAGO',
  [TipoTramite.GUARDIA_FESTIVA]: 'SOLICITUDES_PAGO',
  [TipoTramite.NIVELACION]: 'SOLICITUDES_PAGO',
  [TipoTramite.SUSTITUCION]: 'SOLICITUDES_PAGO',
  [TipoTramite.PASE_ENTRADA]: 'PASES',
  [TipoTramite.PASE_SALIDA]: 'PASES',
  [TipoTramite.PASE_INTERMEDIO]: 'PASES',
  [TipoTramite.LICENCIA_SGSS]: 'LICENCIAS',
  [TipoTramite.LICENCIA_MEDICA]: 'LICENCIAS',
  [TipoTramite.LICENCIA_MATERNIDAD]: 'LICENCIAS',
  [TipoTramite.INCAPACIDAD_RT]: 'LICENCIAS',
  [TipoTramite.INCAPACIDAD_EG]: 'LICENCIAS',
  [TipoTramite.RECEPCION_DOCUMENTO]: 'RECEPCION_DOC',
  [TipoTramite.VACACIONES]: 'LICENCIAS',
};

// ─── Tipos de Solicitud de Pago ─────────────────────────
export const SOLICITUDES_PAGO_TYPES = [
  TipoTramite.SOLICITUD_CONTRATO,
  TipoTramite.TIEMPO_EXTRAORDINARIO,
  TipoTramite.GUARDIA_FESTIVA,
  TipoTramite.NIVELACION,
  TipoTramite.SUSTITUCION,
];

// ─── Tabs por Rol ─────────────────────────────────────────
export const TABS_BY_ROLES: Record<Rol, string[]> = {
  [Rol.TRABAJADOR]: ['dashboard', 'mis_tramites', 'nuevo_tramite'],
  [Rol.JEFE_SERVICIO]: ['dashboard', 'solicitudes', 'nuevo_tramite', 'bandeja'],
  [Rol.AREA_PERSONAL]: ['dashboard', 'bandeja', 'recepciones', 'reportes'],
  [Rol.ADMIN]: ['dashboard', 'bandeja', 'tramites', 'usuarios', 'normativa', 'plantilla', 'config'],
};

// ─── Plazos default ────────────────────────────────────────
export const PLAZO_ENTREGA_DEFAULT_DIAS = 3; // días naturales

// ─── Institución ───────────────────────────────────────────
export const INSTITUCION_NOMBRE = 'Instituto Mexicano del Seguro Social';
export const OOAD_NOMBRE = 'Delegación Baja California Sur';
export const LOGO_URL = '/imss-logo.svg';
