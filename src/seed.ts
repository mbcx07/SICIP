import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('Seeding Firestore...');

  const unidades = [
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

  for (const u of unidades) {
    await setDoc(doc(db, 'unidades', u.clave), u);
    console.log('Unidad: ' + u.clave);
  }

  const tiposTramite = [
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

  for (const t of tiposTramite) {
    await setDoc(doc(db, 'tipos_tramite', t.id), t);
    console.log('Tipo: ' + t.tipo);
  }

  console.log('Seed completo!');
}

seed().catch(console.error);
