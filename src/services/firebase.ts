// ============================================================
// SICIP — Firebase Service
// ============================================================

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  increment
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  browserSessionPersistence,
  setPersistence
} from "firebase/auth";
import {
  Usuario,
  Trabajador,
  Tramite,
  TipoTramiteConfig,
  Unidad,
  HistorialEstado,
  Rol,
  Estatus,
  TipoTramite
} from '../types/sicip';

// ─── Firebase Config (SICIP) ───────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBgLpcYJi8A00zMh3nb3fUNxLmDp7ZfCbQ",
  authDomain: "sicip-1369d.firebaseapp.com",
  databaseURL: "https://sicip-1369d.firebaseio.com",
  projectId: "sicip-1369d",
  storageBucket: "sicip-1369d.firebasestorage.app",
  messagingSenderId: "809227567474",
  appId: "1:809227567474:web:ddd7a02415843a08c91deb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Set session persistence
setPersistence(auth, browserSessionPersistence).catch(console.error);

// ─── Auth helpers ─────────────────────────────────────────

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// ─── Usuarios ─────────────────────────────────────────────

export async function getUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, 'usuarios', uid));
  return snap.exists() ? (snap.data() as Usuario) : null;
}

export async function getUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(db, 'usuarios'));
  return snap.docs.map(d => d.data() as Usuario);
}

export async function getUsuariosByRol(rol: Rol): Promise<Usuario[]> {
  const q = query(collection(db, 'usuarios'), where('rol', '==', rol), where('activo', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Usuario);
}

export async function crearUsuario(data: Omit<Usuario, 'fechaCreacion'>): Promise<void> {
  await setDoc(doc(db, 'usuarios', data.uid), {
    ...data,
    fechaCreacion: new Date().toISOString()
  });
}

export async function actualizarUsuario(uid: string, data: Partial<Usuario>): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), data);
}

export async function getUsuarioByMatricula(matricula: string): Promise<Usuario | null> {
  const q = query(collection(db, 'usuarios'), where('matricula', '==', matricula), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as Usuario);
}

// ─── Trabajadores ──────────────────────────────────────────

export async function getTrabajador(matricula: string): Promise<Trabajador | null> {
  const snap = await getDoc(doc(db, 'trabajadores', matricula));
  return snap.exists() ? (snap.data() as Trabajador) : null;
}

export async function getTrabajadores(): Promise<Trabajador[]> {
  const snap = await getDocs(collection(db, 'trabajadores'));
  return snap.docs.map(d => d.data() as Trabajador);
}

export async function getTrabajadoresByUnidad(unidadClave: string): Promise<Trabajador[]> {
  const q = query(collection(db, 'trabajadores'), where('unidadClave', '==', unidadClave));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Trabajador);
}

export async function saveTrabajador(data: Trabajador): Promise<void> {
  await setDoc(doc(db, 'trabajadores', data.matricula), {
    ...data,
    fechaActualizacion: new Date().toISOString()
  });
}

export async function saveTrabajadoresBatch(dataArray: Partial<Trabajador>[]): Promise<{actualizados: number; insertados: number}> {
  let actualizados = 0;
  let insertados = 0;
  for (const data of dataArray) {
    if (!data.matricula) continue;
    const existing = await getTrabajador(data.matricula);
    await saveTrabajador({
      matricula: data.matricula,
      nombre: data.nombre || '',
      apellidoPaterno: data.apellidoPaterno || '',
      apellidoMaterno: data.apellidoMaterno || '',
      area: data.area || '',
      tipoContrato: data.tipoContrato || '',
      unidadClave: data.unidadClave || '',
      unidadNombre: data.unidadNombre || '',
      delegacion: data.delegacion || '',
      activo: true,
      fechaActualizacion: new Date().toISOString(),
      ...data
    });
    if (existing) actualizados++;
    else insertados++;
  }
  return { actualizados, insertados };
}

// ─── Unidades ──────────────────────────────────────────────

export async function getUnidades(): Promise<Unidad[]> {
  const snap = await getDocs(collection(db, 'unidades'));
  return snap.docs.map(d => d.data() as Unidad);
}

export async function getUnidad(clave: string): Promise<Unidad | null> {
  const snap = await getDoc(doc(db, 'unidades', clave));
  return snap.exists() ? (snap.data() as Unidad) : null;
}

export async function saveUnidad(data: Unidad): Promise<void> {
  await setDoc(doc(db, 'unidades', data.clave), data);
}

// ─── Trámites ─────────────────────────────────────────────

export async function crearTramite(data: Omit<Tramite, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'tramites'), {
    ...data,
    fechaCreacion: new Date().toISOString()
  });
  await registrarHistorial({
    tramiteId: ref.id,
    estatusNuevo: data.estatus,
    usuarioUid: data.solicitanteUid,
    usuarioNombre: data.solicitanteNombre,
    observacion: 'Trámite creado'
  });
  return ref.id;
}

export async function getTramite(id: string): Promise<Tramite | null> {
  const snap = await getDoc(doc(db, 'tramites', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Tramite : null;
}

export async function getTramitesBySolicitante(uid: string): Promise<Tramite[]> {
  const q = query(
    collection(db, 'tramites'),
    where('solicitanteUid', '==', uid),
    orderBy('fechaCreacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Tramite));
}

export async function getTramitesByTrabajador(matricula: string): Promise<Tramite[]> {
  const q = query(
    collection(db, 'tramites'),
    where('trabajadorMatricula', '==', matricula),
    orderBy('fechaCreacion', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Tramite));
}

export async function getTramitesByUnidad(unidadClave: string, limitCount = 100): Promise<Tramite[]> {
  const q = query(
    collection(db, 'tramites'),
    where('unidadClave', '==', unidadClave),
    orderBy('fechaCreacion', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Tramite));
}

export async function getAllTramites(limitCount = 200): Promise<Tramite[]> {
  const q = query(collection(db, 'tramites'), orderBy('fechaCreacion', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Tramite));
}

export async function getTramitesByEstatus(estatus: Estatus, limitCount = 100): Promise<Tramite[]> {
  const q = query(
    collection(db, 'tramites'),
    where('estatus', '==', estatus),
    orderBy('fechaCreacion', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Tramite));
}

export async function actualizarTramite(id: string, data: Partial<Tramite>): Promise<void> {
  await updateDoc(doc(db, 'tramites', id), data);
}

export async function cambiarEstatus(
  tramiteId: string,
  nuevoEstatus: Estatus,
  usuarioUid: string,
  usuarioNombre: string,
  observacion?: string,
  motivo?: string
): Promise<void> {
  const tramite = await getTramite(tramiteId);
  if (!tramite) return;

  await updateDoc(doc(db, 'tramites', tramiteId), {
    estatus: nuevoEstatus,
    estatusAnterior: tramite.estatus
  });

  await registrarHistorial({
    tramiteId,
    estatusAnterior: tramite.estatus,
    estatusNuevo: nuevoEstatus,
    usuarioUid,
    usuarioNombre,
    observacion,
    motivo
  });
}

// ─── Historial de Estados ──────────────────────────────────

export async function registrarHistorial(data: Omit<HistorialEstado, 'id' | 'fecha' | 'hora'>): Promise<void> {
  const now = new Date();
  await addDoc(collection(db, 'historial_estados'), {
    ...data,
    fecha: now.toLocaleDateString('es-MX'),
    hora: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  });
}

export async function getHistorial(tramiteId: string): Promise<HistorialEstado[]> {
  const q = query(
    collection(db, 'historial_estados'),
    where('tramiteId', '==', tramiteId),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HistorialEstado));
}

// ─── Tipos de Trámite (Catálogo Normativo) ────────────────

export async function getTiposTramite(): Promise<TipoTramiteConfig[]> {
  const snap = await getDocs(collection(db, 'tipos_tramite'));
  return snap.docs.map(d => d.data() as TipoTramiteConfig);
}

export async function getTipoTramiteConfig(tipo: TipoTramite): Promise<TipoTramiteConfig | null> {
  const q = query(collection(db, 'tipos_tramite'), where('tipo', '==', tipo), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as TipoTramiteConfig);
}

export async function saveTipoTramiteConfig(data: TipoTramiteConfig): Promise<void> {
  await setDoc(doc(db, 'tipos_tramite', data.id), data);
}

// ─── Contadores / Stats ───────────────────────────────────

export async function getTramiteCountByEstatus(): Promise<Record<Estatus, number>> {
  const tramites = await getAllTramites(500);
  const counts: Record<string, number> = {};
  for (const t of tramites) {
    counts[t.estatus] = (counts[t.estatus] || 0) + 1;
  }
  return counts as Record<Estatus, number>;
}

export async function getTramitesVencidos(): Promise<Tramite[]> {
  const hoy = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, 'tramites'),
    where('fechaLimiteEntrega', '!=', ''),
    where('estatus', 'in', [Estatus.PENDIENTE_ENTREGA, Estatus.GENERADO])
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Tramite))
    .filter(t => t.fechaLimiteEntrega && t.fechaLimiteEntrega < hoy);
}

// ─── Generador de Folio ───────────────────────────────────
export function generateFolio(tipo: TipoTramite, unidadClave: string): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const tipoPrefix = tipo.substring(0, 4).toUpperCase();
  return `SICIP-${unidadClave}-${year}-${tipoPrefix}-${random}`;
}

// ─── Utils ────────────────────────────────────────────────
export function esTrabajador(rol: Rol): boolean {
  return rol === Rol.TRABAJADOR || rol === Rol.JEFE_SERVICIO;
}

export function puedeValidar(rol: Rol): boolean {
  return rol === Rol.AREA_PERSONAL || rol === Rol.ADMIN;
}

export function puedeRecibir(rol: Rol): boolean {
  return rol === Rol.AREA_PERSONAL || rol === Rol.ADMIN;
}

export function puedeEnviarDelegacion(rol: Rol): boolean {
  return rol === Rol.AREA_PERSONAL || rol === Rol.ADMIN;
}
