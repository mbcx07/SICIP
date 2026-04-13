/**
 * permisos.ts
 * Sistema de permisos granulares por trabajador
 */
export type Permiso =
  | 'pases'
  | 'licencias'
  | 'solicitudes'
  | 'vacaciones'
  | 'bandeja'
  | 'recepciones'
  | 'reportes'
  | 'plantilla'
  | 'admin';

export const PERMISOS_LABELS: Record<Permiso, string> = {
  pases:         'Pases de Entrada / Salida',
  licencias:     'Licencias (médicas y SGSS)',
  solicitudes:   'Solicitudes de Pago (TE, Guardia, Sustitución, Nivelación)',
  vacaciones:    'Vacaciones',
  bandeja:       'Bandeja de Validación',
  recepciones:   'Recepciones Documentales',
  reportes:      'Reportes',
  plantilla:     'Plantilla / Importar',
  admin:         'Panel de Administración',
};

export const PERMISOS_DEFAULT: Permiso[] = ['pases', 'licencias'];

// Permisos que solo ADMIN puede asignar
export const PERMISOS_ADMIN_ONLY: Permiso[] = ['admin', 'plantilla'];

// Permisos asociados a cada rol por defecto
export const PERMISOS_POR_ROL: Record<string, Permiso[]> = {
  TRABAJADOR:      ['pases', 'licencias'],
  JEFE_SERVICIO:   ['pases', 'licencias', 'solicitudes', 'vacaciones'],
  AREA_PERSONAL:   ['pases', 'licencias', 'bandeja', 'recepciones', 'reportes'],
  ADMIN:            Object.keys(PERMISOS_LABELS) as Permiso[],
};