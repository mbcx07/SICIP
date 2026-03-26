#!/usr/bin/env node
// SICIP - Firebase Setup via REST API (no browser needed)
// Uses the service account JSON to authenticate

const https = require('https');
const fs = require('fs');
const path = require('path');

const SA_FILE = '/home/moises-beltran-castro/.openclaw/media/inbound/sicip-1369d-firebase-adminsdk-jcczy-f115364f6d---fff9c8ad-56ff-4ca4-bf70-dc7f8042010b.json';

async function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getAccessToken() {
  const sa = JSON.parse(fs.readFileSync(SA_FILE, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
    iat: now,
    exp: expiry
  })).toString('base64url');

  const crypto = require('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + payload);
  const signature = sign.sign(sa.private_key, 'base64url');

  const jwt = header + '.' + payload + '.' + signature;

  const tokenRes = await httpRequest({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, `grant_type=urn%3Aietf%3Aparams%3Aoauth2%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`);

  return tokenRes.access_token;
}

async function firestoreRequest(token, method, path, body = null) {
  return httpRequest({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/sicip-1369d/databases/(default)/documents${path}?access_token=${token}`,
    method: method,
    headers: { 'Content-Type': 'application/json' }
  }, body);
}

async function createDocument(token, coll, docId, data) {
  return firestoreRequest(token, 'PATCH',
    `/${coll}/${docId}`,
    { fields: objectToFields(data) }
  );
}

function objectToFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (Array.isArray(v)) fields[k] = { arrayValue: { values: v.map(item => {
      if (typeof item === 'string') return { stringValue: item };
      if (typeof item === 'number') return { integerValue: item };
      if (typeof item === 'object') return { mapValue: { fields: objectToFields(item) } };
      return { stringValue: String(item) };
    })}};
    else if (typeof v === 'object') fields[k] = { mapValue: { fields: objectToFields(v) } };
    else fields[k] = { stringValue: String(v) };
  }
  return fields;
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node setup-firebase-rest.cjs <email> <password>');
    process.exit(1);
  }

  console.log('=== SICIP Firebase Setup (REST API) ===\n');
  console.log('1. Obteniendo token de acceso...');
  const token = await getAccessToken();
  console.log('   ✅ Token obtenido\n');

  // 1. Enable Firestore API
  console.log('2. Verificando/activando Firestore API...');
  try {
    await httpsRequest('POST', 'firestore.googleapis.com', '/v1/projects/sicip-1369d/databases:create', token, {
      type: 'DATASTORE_MODE',
      location: 'us-central'
    });
    console.log('   ✅ Firestore API activada');
  } catch (e) {
    if (e.error?.message?.includes('already exists')) {
      console.log('   ℹ️  Firestore ya estaba configurado');
    } else {
      console.log('   ⚠️  ' + (e.error?.message || e.message || 'continuando...'));
    }
  }

  // 2. Create user via Identity Toolkit REST API
  console.log('\n3. Creando usuario admin...');
  const userRes = await httpsRequest('POST', 'identitytoolkit.googleapis.com',
    '/v3/projects/sicip-1369d/accounts:signUp', token, {
      email, password, emailVerified: true
    });
  console.log('   ✅ Usuario creado:', userRes.localId || userRes.id);

  const uid = userRes.localId;

  // 3. Create usuario document
  console.log('\n4. Creando documento de usuario en Firestore...');
  try {
    await createDocument(token, 'usuarios', uid, {
      uid,
      email,
      nombre: 'Administrador',
      rol: 'ADMIN',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      matricula: null,
      unidadClave: null,
      unidadNombre: null
    });
    console.log('   ✅ Documento usuarios/' + uid + ' creado');
  } catch (e) {
    console.log('   ⚠️  ' + (e.error?.message || e.message));
  }

  // 4. Create unidades
  console.log('\n5. Creando catálogo de unidades...');
  const unidades = [
    { clave: '03HD01', nombre: 'Hospital General La Paz', tipo: 'HOSPITAL', delegacion: 'Baja California Sur', activo: true },
    { clave: '03UM34', nombre: 'UMF 34 La Paz', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
    { clave: '03HG02', nombre: 'Hospital General Cabo San Lucas', tipo: 'HG', delegacion: 'Baja California Sur', activo: true },
    { clave: '03UM19', nombre: 'UMF 19 San José del Cabo', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  ];
  for (const u of unidades) {
    try {
      await createDocument(token, 'unidades', u.clave, u);
      console.log('   ✅ ' + u.clave + ' - ' + u.nombre);
    } catch (e) { console.log('   ⚠️  ' + u.clave + ': ' + (e.error?.message || e.message)); }
  }

  // 5. Create tipos_tramite
  console.log('\n6. Creando catálogo de tipos de trámite...');
  const tipos = [
    { id: 'sustitucion', tipo: 'SUSTITUCION', nombre: 'Sustitución', modulo: 'SOLICITUDES_PAGO', solicitaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL'], validaRol: ['AREA_PERSONAL', 'ADMIN'], activo: true },
    { id: 'tiempo_extraordinario', tipo: 'TIEMPO_EXTRAORDINARIO', nombre: 'Tiempo Extraordinario', modulo: 'SOLICITUDES_PAGO', solicitaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL'], validaRol: ['AREA_PERSONAL', 'ADMIN'], activo: true },
    { id: 'guardia_festiva', tipo: 'GUARDIA_FESTIVA', nombre: 'Guardia Festiva', modulo: 'SOLICITUDES_PAGO', solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], activo: true },
    { id: 'nivelacion', tipo: 'NIVELACION', nombre: 'Nivelación a Plaza Superior', modulo: 'SOLICITUDES_PAGO', solicitaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL'], validaRol: ['AREA_PERSONAL', 'ADMIN'], activo: true },
    { id: 'solicitud_contrato', tipo: 'SOLICITUD_CONTRATO', nombre: 'Solicitud de Contrato', modulo: 'SOLICITUDES_PAGO', solicitaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL'], validaRol: ['AREA_PERSONAL', 'ADMIN'], activo: true },
    { id: 'pase_salida', tipo: 'PASE_SALIDA', nombre: 'Pase de Salida', modulo: 'PASES', solicitaRol: ['TRABAJADOR'], validaRol: ['JEFE_SERVICIO', 'AREA_PERSONAL', 'ADMIN'], activo: true },
  ];
  for (const t of tipos) {
    try {
      await createDocument(token, 'tipos_tramite', t.id, t);
      console.log('   ✅ ' + t.nombre);
    } catch (e) { console.log('   ⚠️  ' + t.id + ': ' + (e.error?.message || e.message)); }
  }

  // 6. Create configuracion
  console.log('\n7. Creando configuración general...');
  try {
    await createDocument(token, 'configuracion', 'sistema', {
      nombreInstitucion: 'Instituto Mexicano del Seguro Social',
      ooad: 'Delegación Baja California Sur',
      ejercicioActual: new Date().getFullYear(),
      mensajeBienvenida: 'Bienvenido al Sistema Integral de Captura de Información de Personal'
    });
    console.log('   ✅ Configuración creada');
  } catch (e) { console.log('   ⚠️  ' + (e.error?.message || e.message)); }

  console.log('\n=== ✅ Setup completo ===');
  console.log('\n📧 Usuario:', email);
  console.log('🔑 Contraseña:', password);
}

function httpsRequest(method, hostname, fullPath, token, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path: fullPath, method, headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { const j = JSON.parse(data); if (j.error) reject(j); else resolve(j); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

main().catch(e => { console.error('\n❌ Error:', e.message || e.error?.message || e); process.exit(1); });
