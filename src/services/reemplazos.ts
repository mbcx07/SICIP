// ─── Módulo de Cuadro de Reemplazo — Firestore Service ───

import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  PlazaReemplazo, CuadroReemplazo, PostulacionReemplazo,
  CandidatoReemplazo, ConvocatoriaReemplazo
} from '../types/reemplazos';

// ─── Plazas de Reemplazo ──────────────────────────────────

export async function crearPlazaReemplazo(data: Omit<PlazaReemplazo, 'id' | 'fechaCreacion'>): Promise<string> {
  const ref = await addDoc(collection(db, 'plazas_reemplazo'), {
    ...data,
    fechaCreacion: new Date().toISOString(),
  });
  return ref.id;
}

export async function getPlazaReemplazo(id: string): Promise<PlazaReemplazo | null> {
  const snap = await getDoc(doc(db, 'plazas_reemplazo', id));
  return snap.exists() ? (snap.data() as PlazaReemplazo) : null;
}

export async function getPlazasPorJefe(jefeUid: string): Promise<PlazaReemplazo[]> {
  const q = query(
    collection(db, 'plazas_reemplazo'),
    where('jefeServicioUid', '==', jefeUid),
    orderBy('fechaCreacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlazaReemplazo));
}

export async function getPlazasAbiertas(): Promise<PlazaReemplazo[]> {
  const q = query(
    collection(db, 'plazas_reemplazo'),
    where('status', '==', 'ABIERTA'),
    orderBy('fechaCreacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlazaReemplazo));
}

export async function getPlazasPorUnidad(unidadClave: string): Promise<PlazaReemplazo[]> {
  const q = query(
    collection(db, 'plazas_reemplazo'),
    where('unidadClave', '==', unidadClave),
    where('status', '==', 'ABIERTA'),
    orderBy('fechaCreacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlazaReemplazo));
}

export async function actualizarPlazaReemplazo(id: string, data: Partial<PlazaReemplazo>): Promise<void> {
  await updateDoc(doc(db, 'plazas_reemplazo', id), data);
}

export async function cerrarPlaza(id: string, uid: string, nombre: string): Promise<void> {
  await updateDoc(doc(db, 'plazas_reemplazo', id), {
    status: 'CUBIERTA',
    ternaCerrada: true,
    fechaCierre: new Date().toISOString(),
    cerradoPorUid: uid,
    cerradoPorNombre: nombre,
  });
}

// ─── Cuadros de Reemplazo ─────────────────────────────────

export async function crearCuadroReemplazo(data: Omit<CuadroReemplazo, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<string> {
  const ref = await addDoc(collection(db, 'cuadros_reemplazo'), {
    ...data,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
  });
  return ref.id;
}

export async function getCuadroPorPlaza(plazaId: string): Promise<CuadroReemplazo | null> {
  const q = query(
    collection(db, 'cuadros_reemplazo'),
    where('plazaId', '==', plazaId),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as CuadroReemplazo);
}

export async function getCuadro(id: string): Promise<CuadroReemplazo | null> {
  const snap = await getDoc(doc(db, 'cuadros_reemplazo', id));
  return snap.exists() ? (snap.data() as CuadroReemplazo) : null;
}

export async function getCuadrosPorJefe(jefeUid: string): Promise<CuadroReemplazo[]> {
  // Busca cuadros cuyas plazas pertenezcan al jefe
  const q = query(
    collection(db, 'cuadros_reemplazo'),
    orderBy('fechaCreacion', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  // Filtrar lado cliente por ahora (requiere join con plazas)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CuadroReemplazo));
}

export async function actualizarCuadroReemplazo(id: string, data: Partial<CuadroReemplazo>): Promise<void> {
  await updateDoc(doc(db, 'cuadros_reemplazo', id), {
    ...data,
    fechaActualizacion: new Date().toISOString(),
  });
}

export async function agregarCandidatoACuadro(
  cuadroId: string,
  candidato: CandidatoReemplazo
): Promise<void> {
  const cuadro = await getCuadro(cuadroId);
  if (!cuadro) return;
  const candidatos = [...(cuadro.candidatos || []), candidato].sort((a, b) => a.posicion - b.posicion);
  const completo = candidatos.length >= 1;
  await actualizarCuadroReemplazo(cuadroId, {
    candidatos,
    status: completo ? 'COMPLETO' : 'BORRADOR',
    notificacionPendiente: !completo,
  });
}

export async function quitarCandidatoDeCuadro(cuadroId: string, posicion: 1 | 2 | 3): Promise<void> {
  const cuadro = await getCuadro(cuadroId);
  if (!cuadro) return;
  const candidatos = cuadro.candidatos.filter(c => c.posicion !== posicion);
  await actualizarCuadroReemplazo(cuadroId, {
    candidatos,
    status: candidatos.length >= 1 ? 'COMPLETO' : 'BORRADOR',
    notificacionPendiente: candidatos.length < 1,
  });
}

export async function reordenarCandidatos(cuadroId: string, orden: string[]): Promise<void> {
  const cuadro = await getCuadro(cuadroId);
  if (!cuadro) return;
  // orden = [nuevaPos1Matricula, nuevaPos2Matricula, nuevaPos3Matricula]
  const reorder = (c: CandidatoReemplazo, i: number) => ({
    ...c,
    posicion: (i + 1) as 1 | 2 | 3,
    fechaAgregado: c.fechaAgregado,
    agregadoPorUid: c.agregadoPorUid,
    agregadoPorNombre: c.agregadoPorNombre,
  });
  const reordered = orden.map((_, i) => {
    const m = orden[i];
    const c = cuadro.candidatos.find(x => x.matricula === m);
    return c ? reorder(c, i) : null;
  }).filter(Boolean) as CandidatoReemplazo[];
  await actualizarCuadroReemplazo(cuadroId, { candidatos: reordered });
}

export async function cerrarCuadro(
  cuadroId: string,
  candidatoSeleccionado: 1 | 2 | 3,
  uid: string,
  nombre: string
): Promise<void> {
  await actualizarCuadroReemplazo(cuadroId, {
    status: 'CERRADO',
    candidatoSeleccionado,
    fechaCierre: new Date().toISOString(),
    cerradoPorUid: uid,
    cerradoPorNombre: nombre,
    notificacionPendiente: false,
  });
}

export async function marcarNotificacionEnviada(cuadroId: string): Promise<void> {
  await actualizarCuadroReemplazo(cuadroId, {
    notificacionPendiente: false,
    ultimaNotificacionEnviada: new Date().toISOString(),
  });
}

// ─── Postulaciones ────────────────────────────────────────

export async function crearPostulacion(data: Omit<PostulacionReemplazo, 'id' | 'fechaActualizacion'>): Promise<string> {
  const ref = await addDoc(collection(db, 'postulaciones_reemplazo'), {
    ...data,
    fechaActualizacion: new Date().toISOString(),
  });
  return ref.id;
}

export async function getPostulacionesPorPlaza(plazaId: string): Promise<PostulacionReemplazo[]> {
  const q = query(
    collection(db, 'postulaciones_reemplazo'),
    where('plazaId', '==', plazaId),
    orderBy('fechaPostulacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PostulacionReemplazo));
}

export async function getPostulacionesPorTrabajador(matricula: string): Promise<PostulacionReemplazo[]> {
  const q = query(
    collection(db, 'postulaciones_reemplazo'),
    where('trabajadorMatricula', '==', matricula),
    orderBy('fechaPostulacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PostulacionReemplazo));
}

export async function evaluarPostulacion(
  postulacionId: string,
  status: 'ACEPTADO' | 'RECHAZADO',
  evaluadoPorUid: string,
  evaluadoPorNombre: string,
  comentario?: string
): Promise<void> {
  await updateDoc(doc(db, 'postulaciones_reemplazo', postulacionId), {
    status,
    evaluadoPorUid,
    evaluadoPorNombre,
    fechaEvaluacion: new Date().toISOString(),
    comentarioJefe: comentario,
    fechaActualizacion: new Date().toISOString(),
  });
}

export async function getPostulacion(id: string): Promise<PostulacionReemplazo | null> {
  const snap = await getDoc(doc(db, 'postulaciones_reemplazo', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as PostulacionReemplazo) : null;
}

export async function getPostulacionPorTrabajadorYPlaza(plazaId: string, matricula: string): Promise<PostulacionReemplazo | null> {
  const q = query(
    collection(db, 'postulaciones_reemplazo'),
    where('plazaId', '==', plazaId),
    where('matricula', '==', matricula),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as PostulacionReemplazo);
}

// ─── Convocatorias ───────────────────────────────────────

export async function getConvocatorias(): Promise<ConvocatoriaReemplazo[]> {
  const snap = await getDocs(collection(db, 'convocatorias_reemplazo'));
  return snap.docs.map(d => d.data() as ConvocatoriaReemplazo);
}

export async function saveConvocatoria(data: Omit<ConvocatoriaReemplazo, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'convocatorias_reemplazo'), data);
  return ref.id;
}

// ─── Búsqueda de trabajadores (para autocompletar) ─────────

export async function buscarTrabajadores(termino: string): Promise<{matricula: string; nombre: string; area: string; tipoContrato: string}[]> {
  // Búsqueda simple por matrícula o nombre
  const snap = await getDocs(
    query(collection(db, 'trabajadores'), limit(20))
  );
  return snap.docs
    .map(d => d.data())
    .filter(t =>
      t.matricula?.includes(termino) ||
      (`${t.nombre} ${t.apellidoPaterno} ${t.apellidoMaterno}`).toLowerCase().includes(termino.toLowerCase())
    )
    .map(t => ({
      matricula: t.matricula,
      nombre: `${t.nombre} ${t.apellidoPaterno} ${t.apellidoMaterno}`,
      area: t.area || '',
      tipoContrato: t.tipoContrato || '',
    }));
}