#!/usr/bin/env node
// SICIP - Firebase Setup Script
// Usage: node setup-firebase.js <email> <password>

const admin = require('firebase-admin');
const https = require('https');

const SA_FILE = '/home/moises-beltran-castro/.openclaw/media/inbound/sicip-1369d-firebase-adminsdk-jcczy-f115364f6d---fff9c8ad-56ff-4ca4-bf70-dc7f8042010b.json';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node setup-firebase.js <email> <password>');
    console.error('Example: node setup-firebase.js mi correo@imss.gob.mx miPassword123');
    process.exit(1);
  }

  // Load service account
  const serviceAccount = require(SA_FILE);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://sicip-1369d.firebaseio.com',
    storageBucket: 'sicip-1369d.firebasestorage.app'
  });

  const projectId = 'sicip-1369d';
  const auth = admin.auth();
  const db = admin.firestore();

  console.log('=== SICIP Firebase Setup ===\n');

  // 1. Create admin user
  console.log('1. Creando usuario admin...');
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true,
      disabled: false
    });
    console.log(`   ✅ Usuario creado: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);

    // 2. Create usuario document in Firestore with rol ADMIN
    console.log('\n2. Creando documento de usuario en Firestore...');
    await db.collection('usuarios').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      nombre: 'Administrador',
      rol: 'ADMIN',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: null,
      matricula: null,
      unidadClave: null,
      unidadNombre: null
    });
    console.log('   ✅ Documento usuario/ADMIN creado en Firestore');

    // 3. Create sample unidad
    console.log('\n3. Creando catálogo de unidades...');
    const unidades = [
      { clave: '03HD01', nombre: 'Hospital General La Paz', tipo: 'HOSPITAL', delegacion: 'Baja California Sur', activo: true },
      { clave: '03UM34', nombre: 'UMF 34 La Paz', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
      { clave: '03HG02', nombre: 'Hospital General Cabo San Lucas', tipo: 'HG', delegacion: 'Baja California Sur', activo: true },
      { clave: '03UM19', nombre: 'UMF 19 San José del Cabo', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
    ];
    for (const u of unidades) {
      await db.collection('unidades').doc(u.clave).set(u);
      console.log(`   ✅ Unidad: ${u.clave} - ${u.nombre}`);
    }

    // 4. Create sample tipos_tramite
    console.log('\n4. Creando catálogo de tipos de trámite (motor normativo)...');
    const tiposTramite = [
      {
        id: 'sustitucion', tipo: 'SUSTITUCION', nombre: 'Sustitución',
        descripcion: 'Solicitud de pago para personal sustituto que cubre ausencias temporales.',
        modulo: 'SOLICITUDES_PAGO',
        solicitaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL'],
        validaRol: ['AREA_PERSONAL', 'ADMIN'],
        reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 15 },
        requisitosDocumentales: ['Formato de sustitución firmado', 'Contrato del sustituido'],
        advertencias: ['El tiempo no cubierto puede afectar el servicio', 'Verificar presupuesto disponible'],
        flujoPasos: ['Jefe genera solicitud', 'Área de personal recibe', 'Validación', 'Envío a delegación', 'Pago en nómina'],
        causasRechazo: ['Documentación incompleta', 'Fuera de plazo', 'Sin autorización del jefe'],
        camposRequeridos: ['trabajadorSustituidoMatricula', 'motivo', 'fechaIncidencia', 'dias'],
        activo: true
      },
      {
        id: 'tiempo_extraordinario', tipo: 'TIEMPO_EXTRAORDINARIO', nombre: 'Tiempo Extraordinario',
        descripcion: 'Solicitud de pago de horas extra trabajadas fuera de horario regular.',
        modulo: 'SOLICITUDES_PAGO',
        solicitaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL'],
        validaRol: ['AREA_PERSONAL', 'ADMIN'],
        reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 15 },
        requisitosDocumentales: ['Formato firmado por jefe inmediato', 'Bitácora de asistencia'],
        advertencias: ['El tiempo extra requiere autorización previa del jefe', 'No procede sin presupuesto disponible'],
        flujoPasos: ['Jefe genera solicitud', 'Validación área personal', 'Envío a delegación', 'Pago en nómina'],
        causasRechazo: ['Sin autorización del jefe', 'Presupuesto agotado', 'Exceso de horas no justificado'],
        camposRequeridos: ['horaInicio', 'horaFin', 'totalHoras', 'motivo', 'fechaIncidencia'],
        activo: true
      },
      {
        id: 'guardia_festiva', tipo: 'GUARDIA_FESTIVA', nombre: 'Guardia Festiva',
        descripcion: 'Pago de guardia en día festivo institucional o nacional.',
        modulo: 'SOLICITUDES_PAGO',
        solicitaRol: ['JEFE_SERVICIO'],
        validaRol: ['AREA_PERSONAL', 'ADMIN'],
        reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 15 },
        requisitosDocumentales: ['Formato de guardia festiva', 'Lista de asistentes'],
        advertencias: ['Solo procede para pessoal autorizado para guardias'],
        flujoPasos: ['Jefe genera solicitud', 'Validación', 'Envío a delegación', 'Pago en nómina'],
        causasRechazo: ['Personal no autorizado para guardias', 'Día no considerado festivo'],
        camposRequeridos: ['diaFestivo', 'motivo', 'fechaIncidencia', 'totalHoras'],
        activo: true
      },
      {
        id: 'nivelacion', tipo: 'NIVELACION', nombre: 'Nivelación a Plaza Superior',
        descripcion: 'Solicitud de nivelación de categoria o plaza superior.',
        modulo: 'SOLICITUDES_PAGO',
        solicitaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL'],
        validaRol: ['AREA_PERSONAL', 'ADMIN'],
        reglas: { plazoEntregaDias: 5, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 30 },
        requisitosDocumentales: ['Formato de nivelación', 'Dictamen de la comisión mixta', 'Carta de aceptación del trabajador'],
        advertencias: ['Afecta el tabulador de percepciones', 'Requiere revisión de la comisión mixta'],
        flujoPasos: ['Jefe/Nómica genera', 'Revisión comisión mixta', 'Validación área personal', 'Envío a nómina'],
        causasRechazo: ['Sin dictamen de comisión mixta', 'Plaza no disponible', 'Trabajador no reúne requisitos'],
        camposRequeridos: ['plazaActual', 'plazaSuperior', 'motivo', 'fechaIncidencia'],
        activo: true
      },
      {
        id: 'solicitud_contrato', tipo: 'SOLICITUD_CONTRATO', nombre: 'Solicitud de Contrato',
        descripcion: 'Solicitud para generación o renovación de contrato de personal.',
        modulo: 'SOLICITUDES_PAGO',
        solicitaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL'],
        validaRol: ['AREA_PERSONAL', 'ADMIN'],
        reglas: { plazoEntregaDias: 10, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 30 },
        requisitosDocumentales: ['Solicitud del jefe', 'CURP', 'Acta de nacimiento', 'Comprobante de domicile'],
        advertencias: ['Verificar que el candidato no tenga pendientes en el IMSS'],
        flujoPasos: ['Jefe solicita', 'Validación RH', 'Envío a delegación', 'Firma de contrato'],
        causasRechazo: ['Documentación incompleta', 'Presupuesto no disponible', 'Canditado no reúnen requisitos'],
        camposRequeridos: ['tipoContrato', 'fechaInicioContrato', 'fechaFinContrato', 'motivo'],
        activo: true
      },
      {
        id: 'pase_salida', tipo: 'PASE_SALIDA', nombre: 'Pase de Salida',
        descripcion: 'Permiso de salida anticipada o por asuntos personales.',
        modulo: 'PASES',
        solicitaRol: ['TRABAJADOR'],
        validaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL', 'ADMIN'],
        reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 1 },
        requisitosDocumentales: ['Formato de pase firmado'],
        advertencias: ['El pase debe entregarse dentro de los 3 días naturales'],
        flujoPasos: ['Trabajador genera pase', 'Jefe autorizza', 'Entrega área personal'],
        causasRechazo: ['Solicitud fuera de plazo', 'Sin motivo justificado'],
        camposRequeridos: ['fecha', 'hora', 'motivo', 'destino'],
        activo: true
      },
    ];

    for (const t of tiposTramite) {
      await db.collection('tipos_tramite').doc(t.id).set(t);
      console.log(`   ✅ Tipo: ${t.nombre}`);
    }

    // 5. Create configuracion
    console.log('\n5. Creando configuración general...');
    await db.collection('configuracion').doc('sistema').set({
      id: 'sistema',
      nombreInstitucion: 'Instituto Mexicano del Seguro Social',
      ooad: 'Delegación Baja California Sur',
      logoUrl: null,
      ejercicioActual: new Date().getFullYear(),
      mensajeBienvenida: 'Bienvenido al Sistema Integral de Captura de Información de Personal',
      contactoSistemas: null
    });
    console.log('   ✅ Configuración general creada');

    console.log('\n=== ✅ Setup completo ===');
    console.log(`\n📧 Usuario admin: ${email}`);
    console.log(`🔑 Contraseña: ${password}`);
    console.log(`\n🚀 Próximo paso: Subir reglas de Firestore y Storage en Firebase Console`);
    console.log(`   - Firestore: Configuración > Reglas`);
    console.log(`   - Storage: Configuración > Reglas`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'auth/email-already-exists') {
      console.log('   El usuario ya existe. Obteniendo uid...');
      try {
        const existing = await auth.getUserByEmail(email);
        console.log(`   UID: ${existing.uid}`);
        console.log('\n   Para resablecer contraseña: Firebase Console > Authentication > Usuario > Restablecer contraseña');
      } catch (e) {
        console.error('   No se pudo obtener el usuario:', e.message);
      }
    }
    process.exit(1);
  }

  process.exit(0);
}

main();
