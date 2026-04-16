// ─── Módulo de Cuadro de Reemplazo — Firestore Service ───

import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  PlazaReemplazo, CuadroReemplazo, PostulacionReemplazo,
  CandidatoReemplazo, ConvocatoriaReemplazo,
  HistorialReemplazo, NotificacionSICIP, ResultadoValidacion
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

export async function getPlazasTodas(): Promise<PlazaReemplazo[]> {
  const q = query(
    collection(db, 'plazas_reemplazo'),
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

// ─── Historial ────────────────────────────────────────────
export async function agregarHistorial(data: Omit<HistorialReemplazo, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'historial_reemplazo'), data);
  return ref.id;
}

export async function getHistorialPorPlaza(plazaId: string): Promise<HistorialReemplazo[]> {
  const q = query(collection(db, 'historial_reemplazo'), where('plazaId', '==', plazaId), orderBy('fecha', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HistorialReemplazo));
}

// ─── Notificaciones ──────────────────────────────────────
export async function crearNotificacion(data: Omit<NotificacionSICIP, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'notificaciones_sicip'), data);
  return ref.id;
}

export async function getNotificacionesPorUsuario(uid: string): Promise<NotificacionSICIP[]> {
  const q = query(collection(db, 'notificaciones_sicip'), where('destinatarioUid', '==', uid), orderBy('fecha', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificacionSICIP));
}

export async function getNotificacionesNoLeidas(uid: string): Promise<NotificacionSICIP[]> {
  const q = query(collection(db, 'notificaciones_sicip'), where('destinatarioUid', '==', uid), where('leida', '==', false), orderBy('fecha', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificacionSICIP));
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  await updateDoc(doc(db, 'notificaciones_sicip', id), { leida: true });
}

export async function marcarTodasLeidas(uid: string): Promise<void> {
  const q = query(collection(db, 'notificaciones_sicip'), where('destinatarioUid', '==', uid), where('leida', '==', false));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await updateDoc(doc(db, 'notificaciones_sicip', d.id), { leida: true });
  }
}

// ─── Approval Flow ───────────────────────────────────────
export async function proponerTerna(plazaId: string, uid: string, nombre: string): Promise<void> {
  await updateDoc(doc(db, 'plazas_reemplazo', plazaId), {
    status: 'TERNA_PROPUESTA',
    fechaActualizacion: new Date().toISOString(),
  });
  await agregarHistorial({ plazaId, accion: 'TERNA_PROPUESTA', usuarioUid: uid, usuarioNombre: nombre, usuarioRol: 'JEFE_SERVICIO', fecha: new Date().toISOString() });
  // Notify AREA_PERSONAL users
  const apUsers = await getDocs(query(collection(db, 'usuarios'), where('rol', '==', 'AREA_PERSONAL'), where('activo', '==', true)));
  for (const u of apUsers.docs) {
    await crearNotificacion({
      destinatarioUid: u.id, destinatarioRol: 'AREA_PERSONAL', tipo: 'TERNA_LISTA', plazaId,
      mensaje: `Terna lista para revisión en plaza ${plazaId}`, leida: false, fecha: new Date().toISOString(), accionUrl: `/cuadro/${plazaId}`,
    });
  }
}

export async function revisarTernaAP(plazaId: string, accion: 'VALIDAR' | 'DEVOLVER', uid: string, nombre: string, observaciones?: string): Promise<void> {
  if (accion === 'VALIDAR') {
    await updateDoc(doc(db, 'plazas_reemplazo', plazaId), {
      status: 'VALIDADA_AP', validadaPorUid: uid, validadaPorNombre: nombre, validadaFecha: new Date().toISOString(), observacionesAP: observaciones || '',
    });
    await agregarHistorial({ plazaId, accion: 'VALIDADA_AP', usuarioUid: uid, usuarioNombre: nombre, usuarioRol: 'AREA_PERSONAL', fecha: new Date().toISOString(), observaciones });
    // Notify ADMIN/DELEGACION
    const adminUsers = await getDocs(query(collection(db, 'usuarios'), where('rol', '==', 'ADMIN'), where('activo', '==', true)));
    for (const u of adminUsers.docs) {
      await crearNotificacion({ destinatarioUid: u.id, destinatarioRol: 'ADMIN', tipo: 'TERNA_VALIDADA', plazaId, mensaje: `Terna validada, lista para enviar a Delegación`, leida: false, fecha: new Date().toISOString(), accionUrl: `/cuadro/${plazaId}` });
    }
  } else {
    await updateDoc(doc(db, 'plazas_reemplazo', plazaId), {
      status: 'DEVUELTA_AP', observacionesAP: observaciones || '',
    });
    await agregarHistorial({ plazaId, accion: 'DEVUELTA_AP', usuarioUid: uid, usuarioNombre: nombre, usuarioRol: 'AREA_PERSONAL', fecha: new Date().toISOString(), observaciones });
    // Get plaza to find jefe
    const plazaSnap = await getDoc(doc(db, 'plazas_reemplazo', plazaId));
    if (plazaSnap.exists()) {
      const plaza = plazaSnap.data() as PlazaReemplazo;
      await crearNotificacion({ destinatarioUid: plaza.jefeServicioUid, destinatarioRol: 'JEFE_SERVICIO', tipo: 'TERNA_DEVUELTA', plazaId, mensaje: observaciones || 'Su terna fue devuelta con observaciones', leida: false, fecha: new Date().toISOString(), accionUrl: `/cuadro/${plazaId}` });
    }
  }
}

export async function enviarADelegacion(plazaId: string, uid: string, nombre: string): Promise<void> {
  await updateDoc(doc(db, 'plazas_reemplazo', plazaId), {
    status: 'ENVIADA_DELEGACION', enviadaDelegacionPorUid: uid, enviadaDelegacionPorNombre: nombre, enviadaDelegacionFecha: new Date().toISOString(),
  });
  await agregarHistorial({ plazaId, accion: 'ENVIADA_DELEGACION', usuarioUid: uid, usuarioNombre: nombre, usuarioRol: 'AREA_PERSONAL', fecha: new Date().toISOString() });
}

export async function resolverDelegacion(plazaId: string, aprobado: boolean, uid: string, nombre: string, observaciones?: string): Promise<void> {
  if (aprobado) {
    await updateDoc(doc(db, 'plazas_reemplazo', plazaId), {
      status: 'CUBIERTA', resueltaPorUid: uid, resueltaPorNombre: nombre, resueltaFecha: new Date().toISOString(), ternaCerrada: true, fechaCierre: new Date().toISOString(), cerradoPorUid: uid, cerradoPorNombre: nombre,
    });
    await agregarHistorial({ plazaId, accion: 'DESIGNACION_APROBADA', usuarioUid: uid, usuarioNombre: nombre, usuarioRol: 'ADMIN', fecha: new Date().toISOString(), observaciones });
  } else {
    await updateDoc(doc(db, 'plazas_reemplazo', plazaId), {
      status: 'DEVUELTA_AP', motivoRechazo: observaciones || '',
    });
    await agregarHistorial({ plazaId, accion: 'DESIGNACION_RECHAZADA', usuarioUid: uid, usuarioNombre: nombre, usuarioRol: 'ADMIN', fecha: new Date().toISOString(), observaciones });
  }
}

// ─── Validaciones ──────────────────────────────────────────
export async function validarCandidato(matricula: string, plazaId: string): Promise<ResultadoValidacion[]> {
  const resultados: ResultadoValidacion[] = [];
  // Check if already in another active terna
  const ternasActivas = await getDocs(query(collection(db, 'cuadros_reemplazo'), where('status', 'in', ['BORRADOR', 'COMPLETO'])));
  const enOtraTerna = ternasActivas.docs.some(d => {
    const c = d.data() as CuadroReemplazo;
    return c.candidatos?.some(ca => ca.matricula === matricula) && c.plazaId !== plazaId;
  });
  if (enOtraTerna) {
    resultados.push({ tipo: 'BLOQUEANTE', campo: 'terna_activa', mensaje: 'Este trabajador ya está en otra terna activa', detalle: 'No puede estar en dos ternas simultáneamente' });
  }
  // Get plaza for requirements
  const plazaSnap = await getDoc(doc(db, 'plazas_reemplazo', plazaId));
  if (plazaSnap.exists()) {
    const plaza = plazaSnap.data() as PlazaReemplazo;
    // Check if contract ends before absence
    const trabajadorSnap = await getDocs(query(collection(db, 'trabajadores'), where('matricula', '==', matricula), limit(1)));
    if (!trabajadorSnap.empty) {
      const trab = trabajadorSnap.docs[0].data();
      if (trab.fechaVencimientoContrato && plaza.fechaFinAusencia && trab.fechaVencimientoContrato < plaza.fechaFinAusencia) {
        resultados.push({ tipo: 'ADVERTENCIA', campo: 'contrato', mensaje: 'El contrato del trabajador vence antes del periodo de reemplazo', detalle: `Contrato vence: ${trab.fechaVencimientoContrato}` });
      }
      // Check escolaridad
      if (plaza.escolaridadMinima && trab.escolaridad && !trab.escolaridad.includes(plaza.escolaridadMinima)) {
        resultados.push({ tipo: 'ADVERTENCIA', campo: 'escolaridad', mensaje: 'No cumple con la escolaridad mínima requerida', detalle: `Requerida: ${plaza.escolaridadMinima}, Tiene: ${trab.escolaridad}` });
      }
    }
  }
  if (resultados.length === 0) {
    resultados.push({ tipo: 'OK', campo: 'general', mensaje: 'Sin observaciones' });
  }
  return resultados;
}