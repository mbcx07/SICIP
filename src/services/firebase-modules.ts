// ============================================================
// SICIP — Firebase Services: Nuevos Módulos
// ============================================================

import { 
  getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, Timestamp, increment, DocumentData,
  Query, Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

// ─── TIPOS COMPARTIDOS ───────────────────────────────────

export interface Correspondencia {
  id?: string;
  folio: string;                    // SICIP-CORR-AÑO-####
  fechaOficio: string;
  fechaRecepcion: string;
  tipoDocumento: string;            // OFICIO, CIRCULAR, MEMORANDUM, CONVENIO, OTRO
  remitente: string;                // quién envía
  destinatario: string;             // para quién va
  asunto: string;
  descripcion?: string;
  archivosUrls: string[];
  areaOrigen: string;               // unidad médica / área
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  estatus: 'RECIBIDO' | 'TURNADO' | 'EN_ATENCION' | 'ATENDIDO' | 'ARCHIVADO';
  turnadoA?: string;                // área a la que se turnó
  fechaTurnado?: string;
  fechaAtencion?: string;
  respuestaFolio?: string;          // folio del oficio de respuesta
  observaciones?: string;
  usuarioRegistro: string;
  fechaRegistro: string;
  eliminado?: boolean;
}

export interface CalendarioLaboral {
  id?: string;
  fecha: string;                    // YYYY-MM-DD
  tipo: 'LABORAL' | 'INHABIL' | 'FESTIVO' | 'PUENTE' | 'SUSPENSION';
  descripcion: string;
  aplicaA: 'TODOS' | 'CONFIANZA' | 'BASE' | 'HOSPITAL' | 'UMF';
  horarioEspecial?: {
    entrada: string;
    salida: string;
  };
  año: number;
  mes: number;
  diaSemana: number;               // 0=domingo, 1=lunes...
  esFinde: boolean;
}

export interface IndicadorRH {
  id?: string;
  periodo: string;                  // YYYY-MM
  tipo: 'INCAPACIDAD' | 'LICENCIA_SGSS' | 'LICENCIA_MEDICA' | 'FALTA' | 'VACACIONES' | 'COMISION' | 'PERMISO';
  trabajadorMatricula: string;
  trabajadorNombre: string;
  unidadClave: string;
  unidadNombre: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  diagnostico?: string;
  folioDocumento?: string;
  observaciones?: string;
  area?: string;
  categoria?: string;
}

export interface TipoDocumental {
  id?: string;
  clave: string;                    // DOC-01, DOC-02...
  nombre: string;
  descripcion: string;
  categoria: string;                // INCAPACIDAD, LICENCIA, CONTRATO, NOMINA, OTRO
  requiereFirma: boolean;
  requiereSello: boolean;
  diasVigencia?: number;
  formato?: string;
  activo: boolean;
}

export interface CategoriaSalarial {
  id?: string;
  clave: string;                    // CAT-001
  nombre: string;
  smi: number;                      // Salario Mínimo Integral
  salarioDiario: number;
  salarioMensual: number;
  factorIntegracion: number;
  tipoContrato: string;             // BASE, CONFIANZA, SUSTITUTO
  vigenciaInicio: string;
  vigenciaFin?: string;
  activo: boolean;
}

export interface Puesto {
  id?: string;
  clave: string;
  nombre: string;
  descripcion: string;
  tipo: string;                     // ENFERMERA, MEDICO, ADMINISTRATIVO...
  nivel: string;
  horario: {
    entrada: string;
    salida: string;
    descanso?: string;
  };
  categoriaClave?: string;
  smi?: number;
  requisitos?: string[];
  activo: boolean;
}

export interface Suplencia {
  id?: string;
  folio: string;
  trabajadorTitularMatricula: string;
  trabajadorTitularNombre: string;
  trabajadorSuplenteMatricula: string;
  trabajadorSuplenteNombre: string;
  plazaClave: string;
  unidadClave: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  tipo: 'PROGRAMADA' | 'URGENTE' | 'SEGUN_NORMA';
  motivo: string;
  estatus: 'ACTIVA' | 'FINALIZADA' | 'CANCELADA';
  aprobadoPor?: string;
  fechaAprobacion?: string;
  observaciones?: string;
  acumulado?: number;              // días acumulados en el periodo
}

export interface FormatoSolicitud {
  id?: string;
  folio: string;
  tipo: 'CEDULA_TXT' | 'SOLICITUD_SUSTITUCION' | 'CONSTANCIA' | 'REPORTE';
  trabajadorMatricula: string;
  trabajadorNombre: string;
  datos: Record<string, any>;
  generadoPor: string;
  fechaGeneracion: string;
  contenidoTxt?: string;           // para cédulas TXT
  estatus: 'GENERADO' | 'ENTREGADO' | 'RECHAZADO';
}

// ─── GENERADOR DE FOLIOS ──────────────────────────────────

export function generateFolio(prefijo: string): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefijo}-${year}-${random}`;
}

// ─── CORRESPONDENCIA ─────────────────────────────────────

export async function getCorrespondencia(limitCount = 100): Promise<Correspondencia[]> {
  const q = query(collection(db, 'correspondencia'), where('eliminado', '!=', true), orderBy('fechaRegistro', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Correspondencia));
}

export async function getCorrespondenciaByEstatus(estatus: string): Promise<Correspondencia[]> {
  const q = query(collection(db, 'correspondencia'), where('estatus', '==', estatus), orderBy('fechaRegistro', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Correspondencia));
}

export async function guardarCorrespondencia(data: Correspondencia): Promise<string> {
  const ref = await addDoc(collection(db, 'correspondencia'), { ...data, fechaRegistro: new Date().toISOString() });
  return ref.id;
}

export async function actualizarCorrespondencia(id: string, data: Partial<Correspondencia>): Promise<void> {
  await updateDoc(doc(db, 'correspondencia', id), data);
}

export async function eliminarCorrespondencia(id: string): Promise<void> {
  await updateDoc(doc(db, 'correspondencia', id), { eliminado: true });
}

export function watchCorrespondencia(callback: (items: Correspondencia[]) => void): Unsubscribe {
  const q = query(collection(db, 'correspondencia'), where('eliminado', '!=', true), orderBy('fechaRegistro', 'desc'), limit(100));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Correspondencia))));
}

// ─── CALENDARIO LABORAL ──────────────────────────────────

export async function getCalendario(año: number): Promise<CalendarioLaboral[]> {
  const q = query(collection(db, 'calendario_laboral'), where('año', '==', año), orderBy('fecha', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarioLaboral));
}

export async function getDiasInhabiles(año: number, mes?: number): Promise<CalendarioLaboral[]> {
  let q: Query;
  if (mes) {
    q = query(collection(db, 'calendario_laboral'), where('año', '==', año), where('mes', '==', mes), where('tipo', 'in', ['INHABIL', 'FESTIVO', 'SUSPENSION']));
  } else {
    q = query(collection(db, 'calendario_laboral'), where('año', '==', año), where('tipo', 'in', ['INHABIL', 'FESTIVO', 'SUSPENSION']));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarioLaboral));
}

export async function guardarDiaCalendario(data: CalendarioLaboral): Promise<string> {
  const ref = await addDoc(collection(db, 'calendario_laboral'), data);
  return ref.id;
}

export async function actualizarDiaCalendario(id: string, data: Partial<CalendarioLaboral>): Promise<void> {
  await updateDoc(doc(db, 'calendario_laboral', id), data);
}

export async function generarCalendario(año: number): Promise<number> {
  const existing = await getCalendario(año);
  if (existing.length > 0) return existing.length;
  
  const batch: CalendarioLaboral[] = [];
  const start = new Date(año, 0, 1);
  const end = new Date(año, 11, 31);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const diaSem = d.getDay();
    batch.push({
      fecha: d.toISOString().split('T')[0],
      tipo: (diaSem === 0 || diaSem === 6) ? 'INHABIL' : 'LABORAL',
      descripcion: diaSem === 0 ? 'Domingo' : diaSem === 6 ? 'Sábado' : 'Día laboral',
      aplicaA: 'TODOS',
      año,
      mes: d.getMonth() + 1,
      diaSemana: diaSem,
      esFinde: diaSem === 0 || diaSem === 6,
    });
  }

  let count = 0;
  for (const dia of batch) {
    await guardarDiaCalendario(dia);
    count++;
  }
  return count;
}

export function watchCalendario(año: number, callback: (items: CalendarioLaboral[]) => void): Unsubscribe {
  const q = query(collection(db, 'calendario_laboral'), where('año', '==', año), orderBy('fecha', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarioLaboral))));
}

// ─── INDICADORES RH ──────────────────────────────────────

export async function getIndicadores(periodo?: string, limitCount = 200): Promise<IndicadorRH[]> {
  let q: Query;
  if (periodo) {
    q = query(collection(db, 'indicadores_rh'), where('periodo', '==', periodo), orderBy('fechaInicio', 'desc'), limit(limitCount));
  } else {
    q = query(collection(db, 'indicadores_rh'), orderBy('periodo', 'desc'), orderBy('fechaInicio', 'desc'), limit(limitCount));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as IndicadorRH));
}

export async function getIndicadoresPorUnidad(unidadClave: string, periodo?: string): Promise<IndicadorRH[]> {
  let q: Query;
  if (periodo) {
    q = query(collection(db, 'indicadores_rh'), where('unidadClave', '==', unidadClave), where('periodo', '==', periodo));
  } else {
    q = query(collection(db, 'indicadores_rh'), where('unidadClave', '==', unidadClave), orderBy('periodo', 'desc'), limit(100));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as IndicadorRH));
}

export async function guardarIndicador(data: IndicadorRH): Promise<string> {
  const ref = await addDoc(collection(db, 'indicadores_rh'), data);
  return ref.id;
}

export async function getResumenIndicadores(periodo: string): Promise<Record<string, number>> {
  const items = await getIndicadores(periodo, 500);
  const resumen: Record<string, number> = {};
  for (const item of items) {
    resumen[item.tipo] = (resumen[item.tipo] || 0) + 1;
  }
  return resumen;
}

export function watchIndicadores(periodo: string, callback: (items: IndicadorRH[]) => void): Unsubscribe {
  const q = query(collection(db, 'indicadores_rh'), where('periodo', '==', periodo), orderBy('fechaInicio', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as IndicadorRH))));
}

// ─── CATÁLOGO DOCUMENTAL ─────────────────────────────────

export async function getTiposDocumentales(): Promise<TipoDocumental[]> {
  const q = query(collection(db, 'tipos_documentales'), where('activo', '==', true), orderBy('clave', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TipoDocumental));
}

export async function getTipoDocumental(clave: string): Promise<TipoDocumental | null> {
  const q = query(collection(db, 'tipos_documentales'), where('clave', '==', clave), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as TipoDocumental);
}

export async function guardarTipoDocumental(data: TipoDocumental): Promise<string> {
  const ref = await addDoc(collection(db, 'tipos_documentales'), data);
  return ref.id;
}

export async function actualizarTipoDocumental(id: string, data: Partial<TipoDocumental>): Promise<void> {
  await updateDoc(doc(db, 'tipos_documentales', id), data);
}

// ─── CATÁLOGO SALARIAL ───────────────────────────────────

export async function getCategoriasSalariales(): Promise<CategoriaSalarial[]> {
  const q = query(collection(db, 'categorias_salariales'), where('activo', '==', true), orderBy('clave', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoriaSalarial));
}

export async function guardarCategoriaSalarial(data: CategoriaSalarial): Promise<string> {
  const ref = await addDoc(collection(db, 'categorias_salariales'), data);
  return ref.id;
}

export async function actualizarCategoriaSalarial(id: string, data: Partial<CategoriaSalarial>): Promise<void> {
  await updateDoc(doc(db, 'categorias_salariales', id), data);
}

export function watchCategoriasSalariales(callback: (items: CategoriaSalarial[]) => void): Unsubscribe {
  const q = query(collection(db, 'categorias_salariales'), where('activo', '==', true), orderBy('clave', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoriaSalarial))));
}

// ─── PUESTOS (CATEHOR) ───────────────────────────────────

export async function getPuestos(): Promise<Puesto[]> {
  const q = query(collection(db, 'puestos'), where('activo', '==', true), orderBy('clave', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Puesto));
}

export async function guardarPuesto(data: Puesto): Promise<string> {
  const ref = await addDoc(collection(db, 'puestos'), data);
  return ref.id;
}

export async function actualizarPuesto(id: string, data: Partial<Puesto>): Promise<void> {
  await updateDoc(doc(db, 'puestos', id), data);
}

export function watchPuestos(callback: (items: Puesto[]) => void): Unsubscribe {
  const q = query(collection(db, 'puestos'), where('activo', '==', true), orderBy('clave', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Puesto))));
}

// ─── SUPLENCIAS ──────────────────────────────────────────

export async function getSuplencias(limitCount = 100): Promise<Suplencia[]> {
  const q = query(collection(db, 'suplencias'), orderBy('fechaInicio', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Suplencia));
}

export async function getSuplenciasActivas(): Promise<Suplencia[]> {
  const q = query(collection(db, 'suplencias'), where('estatus', '==', 'ACTIVA'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Suplencia));
}

export async function guardarSuplencia(data: Suplencia): Promise<string> {
  const ref = await addDoc(collection(db, 'suplencias'), data);
  return ref.id;
}

export async function actualizarSuplencia(id: string, data: Partial<Suplencia>): Promise<void> {
  await updateDoc(doc(db, 'suplencias', id), data);
}

export function watchSuplencias(callback: (items: Suplencia[]) => void): Unsubscribe {
  const q = query(collection(db, 'suplencias'), orderBy('fechaInicio', 'desc'), limit(100));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Suplencia))));
}

// ─── FORMATOS / SOLICITUDES ──────────────────────────────

export async function getFormatos(limitCount = 50): Promise<FormatoSolicitud[]> {
  const q = query(collection(db, 'formatos_solicitud'), orderBy('fechaGeneracion', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FormatoSolicitud));
}

export async function generarFormato(data: FormatoSolicitud): Promise<string> {
  const ref = await addDoc(collection(db, 'formatos_solicitud'), { ...data, fechaGeneracion: new Date().toISOString() });
  return ref.id;
}

// ─── DIRECTORIO ──────────────────────────────────────────

export async function getTrabajadoresAll(): Promise<any[]> {
  const snap = await getDocs(collection(db, 'trabajadores'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function buscarTrabajadores(termino: string): Promise<any[]> {
  const q = query(collection(db, 'trabajadores'), limit(200));
  const snap = await getDocs(q);
  const lower = termino.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter((t: any) => 
      t.matricula?.toLowerCase().includes(lower) ||
      t.nombre?.toLowerCase().includes(lower)
    );
}

export function watchTrabajadores(callback: (items: any[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'trabajadores'), snap => 
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)))
  );
}

// ─── TRABAJADORES DESDE FIRESTORE ────────────────────────

export async function getTrabajadoresByArea(area: string, limitCount = 100): Promise<any[]> {
  const q = query(collection(db, 'trabajadores'), where('area', '==', area), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUnidadesAll(): Promise<any[]> {
  const snap = await getDocs(collection(db, 'unidades'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAreasFromTrabajadores(): Promise<string[]> {
  const snap = await getDocs(collection(db, 'trabajadores'));
  const areas = new Set<string>();
  snap.docs.forEach(d => {
    const data = d.data();
    if (data.area) areas.add(data.area);
    if (data.unidadNombre) areas.add(data.unidadNombre);
  });
  return Array.from(areas).sort();
}
