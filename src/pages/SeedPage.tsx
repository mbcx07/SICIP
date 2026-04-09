import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const UNIDADES = [
  { clave: 'UMF01', nombre: 'UMF No. 01 "La Paz"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'UMF02', nombre: 'UMF No. 02 "Los Cabos"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'UMF03', nombre: 'UMF No. 03 "Comondú"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'UMF04', nombre: 'UMF No. 04 "Loreto"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'UMF05', nombre: 'UMF No. 05 "Guerrero Negro"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'HG01', nombre: 'Hospital General La Paz', tipo: 'HOSPITAL', delegacion: 'Baja California Sur', activo: true },
  { clave: 'HG02', nombre: 'Hospital General San José del Cabo', tipo: 'HG', delegacion: 'Baja California Sur', activo: true },
  { clave: 'HG03', nombre: 'Hospital General Ciudad Constitución', tipo: 'HG', delegacion: 'Baja California Sur', activo: true },
  { clave: 'HR01', nombre: 'Hospital Regional La Paz', tipo: 'HR', delegacion: 'Baja California Sur', activo: true },
  { clave: 'OF01', nombre: 'Oficina de Representación BCS', tipo: 'OTRO', delegacion: 'Baja California Sur', activo: true },
];

const TIPOS_TRAMITE = [
  {
    id: 'tt-te', tipo: 'TIEMPO_EXTRAORDINARIO', nombre: 'Tiempo Extraordinario',
    descripcion: 'Solicitud de horas extra', modulo: 'SOLICITUDES_PAGO',
    fundamento: { clausula: 'Cláusula 55', numeral: '7.1.2.1.4', texto: 'Requiere autorización del jefe inmediato' },
    solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 5 },
    requisitosDocumentales: ['Formato de solicitud firmado', 'Autorización del jefe inmediato'],
    advertencias: ['No puede exceder 3 horas diarias', 'Requiere autorización previa'],
    flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a nómina'],
    causasRechazo: ['Falta de autorización', 'Exceso de horas'],
  },
  {
    id: 'tt-gf', tipo: 'GUARDIA_FESTIVA', nombre: 'Guardia Festiva',
    descripcion: 'Guardias en días inhábiles', modulo: 'SOLICITUDES_PAGO',
    fundamento: { clausula: 'Cláusula 48', texto: 'Se pagan al 200% del salario ordinario' },
    solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 5 },
    requisitosDocumentales: ['Control de asistencia', 'Autorización del jefe'],
    advertencias: ['Verificar que no se duplique'],
    flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a nómina'],
    causasRechazo: ['Duplicidad de guardia'],
  },
  {
    id: 'tt-nv', tipo: 'NIVELACION', nombre: 'Nivelación',
    descripcion: 'Nivelación a plaza superior', modulo: 'SOLICITUDES_PAGO',
    fundamento: { articulo: 'Art. 46 LFT', numeral: '7.1.2.1.4.2', texto: 'Procede tras 30 días en funciones superiores' },
    solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 5, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 15 },
    requisitosDocumentales: ['Cédula de nivelación', 'Firma del jefe de servicio'],
    advertencias: ['Afecta quinquenios y prestaciones', 'Máximo 6 meses consecutivos'],
    flujoPasos: ['Solicitar', 'Recibir', 'Revisar docs', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'],
    causasRechazo: ['Documentación incompleta', 'Más de 6 meses'],
  },
  {
    id: 'tt-ss', tipo: 'SUSTITUCION', nombre: 'Sustitución',
    descripcion: 'Sustitución de trabajador ausente', modulo: 'SOLICITUDES_PAGO',
    fundamento: { clausula: 'Cláusula 50 CCT', numeral: '7.1.2.1.4.1', texto: 'El sustituto percibe el salario del sustituido' },
    solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 10 },
    requisitosDocumentales: ['CFV del sustituido', 'Autorización del jefe'],
    advertencias: ['Tiene fecha de término definida', 'No adquiere derechos de base'],
    flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'],
    causasRechazo: ['Sin CFV del sustituido'],
  },
  {
    id: 'tt-sc', tipo: 'SOLICITUD_CONTRATO', nombre: 'Solicitud de Contrato',
    descripcion: 'Alta, modificación o baja de contrato', modulo: 'SOLICITUDES_PAGO',
    fundamento: { articulo: 'Art. 35 LFT', texto: 'El contrato por tiempo determinado debe especificar la causa de temporalidad' },
    solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 10, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 30 },
    requisitosDocumentales: ['Contrato firmado', 'Cédula de datos'],
    advertencias: ['Verificar tipo de contrato conforme al CCT'],
    flujoPasos: ['Solicitar', 'Recibir', 'Revisar', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'],
    causasRechazo: ['Contrato mal requisitado'],
  },
  {
    id: 'tt-vac', tipo: 'VACACIONES', nombre: 'Vacaciones',
    descripcion: 'Solicitud de vacaciones anuales', modulo: 'LICENCIAS',
    fundamento: { clausula: 'Cláusula 65 CCT' },
    solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 15, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 30 },
    requisitosDocumentales: ['Formato de vacaciones', 'Autorización del jefe'],
    advertencias: ['Verificar días disponibles'],
    flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'],
    causasRechazo: ['Sin días disponibles'],
  },
  {
    id: 'tt-lm', tipo: 'LICENCIA_MEDICA', nombre: 'Licencia Médica',
    descripcion: 'Licencia por incapacidad médica', modulo: 'LICENCIAS',
    fundamento: { numeral: '7.1.2.2', texto: 'Sujeto al SSMM' },
    solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: false, generaPago: true, diasMaximosResolucion: 60 },
    requisitosDocumentales: ['ST-3 o licencia ISSSTE'],
    advertencias: ['Afecta seguridad social'],
    flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis'],
    causasRechazo: ['Sin documentación médica'],
  },
  {
    id: 'tt-lsg', tipo: 'LICENCIA_SGSS', nombre: 'Licencia sin Goce de Sueldo',
    descripcion: 'Licencia sin goce de sueldo', modulo: 'LICENCIAS',
    fundamento: { clausula: 'Cláusula 72 CCT', texto: 'Requiere autorización de la dirección' },
    solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 10, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: false, diasMaximosResolucion: 30 },
    requisitosDocumentales: ['Solicitud firmada y justificada', 'Autorización del director'],
    advertencias: ['Afecta antigüedad y aguinaldo', 'No genera tiempo extra'],
    flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis', 'Concluir'],
    causasRechazo: ['Falta de justificación'],
  },
  {
    id: 'tt-pe', tipo: 'PASE_ENTRADA', nombre: 'Pase de Entrada',
    descripcion: 'Registro de entrada fuera de horario', modulo: 'PASES',
    fundamento: { numeral: '7.1.3.1', texto: 'Registrar el mismo día' },
    solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 1, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 1 },
    requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'], causasRechazo: [],
  },
  {
    id: 'tt-ps', tipo: 'PASE_SALIDA', nombre: 'Pase de Salida',
    descripcion: 'Salida anticipada o por permiso', modulo: 'PASES',
    fundamento: { numeral: '7.1.3.2' },
    solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 1, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 1 },
    requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'], causasRechazo: [],
  },
  {
    id: 'tt-rd', tipo: 'RECEPCION_DOC', nombre: 'Recepción de Documentación',
    descripcion: 'Recepción de documentos diversos', modulo: 'RECEPCION_DOC',
    fundamento: {},
    solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'],
    reglas: { plazoEntregaDias: 5, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 5 },
    requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Concluir'], causasRechazo: [],
  },
];

interface Props {
  onDone: () => void;
}

export default function SeedPage({ onDone }: Props) {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const run = async () => {
    setRunning(true);
    addLog('Iniciando seed...');

    addLog(`Insertando ${UNIDADES.length} unidades...`);
    for (const u of UNIDADES) {
      await setDoc(doc(db, 'unidades', u.clave), u);
      addLog(`  ✅ ${u.clave}`);
    }

    addLog(`Insertando ${TIPOS_TRAMITE.length} tipos de trámite...`);
    for (const t of TIPOS_TRAMITE) {
      await setDoc(doc(db, 'tipos_tramite', t.id), t);
      addLog(`  ✅ ${t.tipo}`);
    }

    addLog('🎉 Seed completado!');
    setRunning(false);
    onDone();
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a5f', marginBottom: '0.5rem' }}>🌱 SICIP — Seed de Datos</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Crea unidades y tipos de trámite en Firestore. Requiere estar autenticado como admin.</p>
      <button onClick={run} disabled={running} style={{ padding: '0.75rem 1.5rem', background: running ? '#ccc' : '#1e3a5f', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
        {running ? 'Ejecutando...' : 'Ejecutar Seed'}
      </button>
      <div style={{ marginTop: '1rem', background: '#f5f5f5', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: 300, overflow: 'auto' }}>
        {log.map((l, i) => <div key={i} style={{ marginBottom: '0.25rem' }}>{l}</div>)}
      </div>
    </div>
  );
}
