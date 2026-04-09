const { GoogleAuth } = require('google-auth-library');
const https = require('https');

const SA_KEY = require('/home/moises-beltran-castro/.config/sicip-firebase-sa.json');
const PROJECT_ID = 'sicip-bcs';

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: SA_KEY,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenResp = await client.getAccessToken();
  return tokenResp.token;
}

async function firestoreRequest(method, path, body) {
  const token = await getAccessToken();
  const data = body ? JSON.stringify(body) : undefined;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents${path}`;
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const opts = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(d); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function seed() {
  console.log('🌱 Obteniendo token...');
  const token = await getAccessToken();
  console.log('✅ Token obtenido');

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

  const TIPOS = [
    { id: 'tt-te', tipo: 'TIEMPO_EXTRAORDINARIO', nombre: 'Tiempo Extraordinario', descripcion: 'Solicitud de horas extra', modulo: 'SOLICITUDES_PAGO', fundamento: { clausula: 'Cláusula 55', numeral: '7.1.2.1.4', texto: 'Requiere autorización del jefe inmediato' }, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 5 }, requisitosDocumentales: ['Formato de solicitud firmado', 'Autorización del jefe inmediato'], advertencias: ['No puede exceder 3 horas diarias', 'Requiere autorización previa'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a nómina'], causasRechazo: ['Falta de autorización', 'Exceso de horas'] },
    { id: 'tt-gf', tipo: 'GUARDIA_FESTIVA', nombre: 'Guardia Festiva', descripcion: 'Guardias en días inhábiles', modulo: 'SOLICITUDES_PAGO', fundamento: { clausula: 'Cláusula 48', texto: 'Se pagan al 200% del salario ordinario' }, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 5 }, requisitosDocumentales: ['Control de asistencia', 'Autorización del jefe'], advertencias: ['Verificar que no se duplique'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a nómina'], causasRechazo: ['Duplicidad de guardia'] },
    { id: 'tt-nv', tipo: 'NIVELACION', nombre: 'Nivelación', descripcion: 'Nivelación a plaza superior', modulo: 'SOLICITUDES_PAGO', fundamento: { articulo: 'Art. 46 LFT', numeral: '7.1.2.1.4.2', texto: 'Procede tras 30 días en funciones superiores' }, solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 5, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 15 }, requisitosDocumentales: ['Cédula de nivelación', 'Firma del jefe de servicio'], advertencias: ['Afecta quinquenios y prestaciones', 'Máximo 6 meses consecutivos'], flujoPasos: ['Solicitar', 'Recibir', 'Revisar docs', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'], causasRechazo: ['Documentación incompleta', 'Más de 6 meses'] },
    { id: 'tt-ss', tipo: 'SUSTITUCION', nombre: 'Sustitución', descripcion: 'Sustitución de trabajador ausente', modulo: 'SOLICITUDES_PAGO', fundamento: { clausula: 'Cláusula 50 CCT', numeral: '7.1.2.1.4.1', texto: 'El sustituto percibe el salario del sustituido' }, solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 10 }, requisitosDocumentales: ['CFV del sustituido', 'Autorización del jefe'], advertencias: ['Tiene fecha de término definida', 'No adquiere derechos de base'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'], causasRechazo: ['Sin CFV del sustituido'] },
    { id: 'tt-sc', tipo: 'SOLICITUD_CONTRATO', nombre: 'Solicitud de Contrato', descripcion: 'Alta, modificación o baja de contrato', modulo: 'SOLICITUDES_PAGO', fundamento: { articulo: 'Art. 35 LFT', texto: 'El contrato por tiempo determinado debe especificar la causa de temporalidad' }, solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 10, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 30 }, requisitosDocumentales: ['Contrato firmado', 'Cédula de datos'], advertencias: ['Verificar tipo de contrato conforme al CCT'], flujoPasos: ['Solicitar', 'Recibir', 'Revisar', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'], causasRechazo: ['Contrato mal requisitado'] },
    { id: 'tt-vac', tipo: 'VACACIONES', nombre: 'Vacaciones', descripcion: 'Solicitud de vacaciones anuales', modulo: 'LICENCIAS', fundamento: { clausula: 'Cláusula 65 CCT' }, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 15, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 30 }, requisitosDocumentales: ['Formato de vacaciones', 'Autorización del jefe'], advertencias: ['Verificar días disponibles'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'], causasRechazo: ['Sin días disponibles'] },
    { id: 'tt-lm', tipo: 'LICENCIA_MEDICA', nombre: 'Licencia Médica', descripcion: 'Licencia por incapacidad médica', modulo: 'LICENCIAS', fundamento: { numeral: '7.1.2.2', texto: 'Sujeto al SSMM' }, solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: false, generaPago: true, diasMaximosResolucion: 60 }, requisitosDocumentales: ['ST-3 o licencia ISSSTE'], advertencias: ['Afecta seguridad social'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis'], causasRechazo: ['Sin documentación médica'] },
    { id: 'tt-lsg', tipo: 'LICENCIA_SGSS', nombre: 'Licencia sin Goce de Sueldo', descripcion: 'Licencia sin goce de sueldo', modulo: 'LICENCIAS', fundamento: { clausula: 'Cláusula 72 CCT', texto: 'Requiere autorización de la dirección' }, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 10, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: false, diasMaximosResolucion: 30 }, requisitosDocumentales: ['Solicitud firmada y justificada', 'Autorización del director'], advertencias: ['Afecta antigüedad y aguinaldo', 'No genera tiempo extra'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis', 'Concluir'], causasRechazo: ['Falta de justificación'] },
    { id: 'tt-pe', tipo: 'PASE_ENTRADA', nombre: 'Pase de Entrada', descripcion: 'Registro de entrada fuera de horario', modulo: 'PASES', fundamento: { numeral: '7.1.3.1', texto: 'Registrar el mismo día' }, solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 1, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 1 }, requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'], causasRechazo: [] },
    { id: 'tt-ps', tipo: 'PASE_SALIDA', nombre: 'Pase de Salida', descripcion: 'Salida anticipada o por permiso', modulo: 'PASES', fundamento: { numeral: '7.1.3.2' }, solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 1, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 1 }, requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'], causasRechazo: [] },
    { id: 'tt-rd', tipo: 'RECEPCION_DOC', nombre: 'Recepción de Documentación', descripcion: 'Recepción de documentos diversos', modulo: 'RECEPCION_DOC', fundamento: {}, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 5, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 5 }, requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Concluir'], causasRechazo: [] },
  ];

  // Seed unidades
  console.log(`\n📦 Insertando ${UNIDADES.length} unidades...`);
  for (const u of UNIDADES) {
    try {
      const res = await firestoreRequest('PATCH',
        `/unidades/${u.clave}?currentDocument.exists=false`,
        u
      );
      if (res.error) {
        // If document already exists, try to update
        const updateRes = await firestoreRequest('PATCH',
          `/unidades/${u.clave}?updateMask.fieldPaths=clave&updateMask.fieldPaths=nombre&updateMask.fieldPaths=tipo&updateMask.fieldPaths=delegacion&updateMask.fieldPaths=activo`,
          u
        );
        if (updateRes.error) throw new Error(JSON.stringify(updateRes.error));
      }
      console.log(`  ✅ ${u.clave}`);
    } catch (e) {
      console.log(`  ❌ ${u.clave}: ${JSON.stringify(e.message || e).slice(0,100)}`);
    }
  }

  // Seed tipos_tramite
  console.log(`\n📋 Insertando ${TIPOS.length} tipos de trámite...`);
  for (const t of TIPOS) {
    try {
      const res = await firestoreRequest('PATCH',
        `/tipos_tramite/${t.id}?currentDocument.exists=false`,
        t
      );
      if (res.error) {
        // Document exists, skip
        console.log(`  ⚠️  ${t.tipo} (ya existía)`);
      } else {
        console.log(`  ✅ ${t.tipo}`);
      }
    } catch (e) {
      console.log(`  ❌ ${t.tipo}: ${JSON.stringify(e.message || e).slice(0,100)}`);
    }
  }

  console.log('\n🎉 Seed completado!');
}

seed().catch(e => {
  console.error('Error:', e.message || e);
  process.exit(1);
});
