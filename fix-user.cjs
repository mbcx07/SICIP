#!/usr/bin/env node
// SICIP - Fix user UID and verify Firestore
const https = require('https');
const fs = require('fs');

const SA_FILE = '/home/moises-beltran-castro/.openclaw/media/inbound/sicip-1369d-firebase-adminsdk-jcczy-f115364f6d---fff9c8ad-56ff-4ca4-bf70-dc7f8042010b.json';

async function getAccessToken() {
  const sa = JSON.parse(fs.readFileSync(SA_FILE, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email, sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
    iat: now, exp: now + 3600
  })).toString('base64url');
  const crypto = require('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + payload);
  const sig = sign.sign(sa.private_key, 'base64url');
  const jwt = header + '.' + payload + '.' + sig;
  const res = await rawRequest('POST', 'oauth2.googleapis.com', '/token',
    null, `grant_type=urn%3Aietf%3Aparams%3Aoauth2%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`);
  return JSON.parse(res).access_token;
}

function rawRequest(method, hostname, path, headers, body) {
  return new Promise((res, rej) => {
    const opts = { hostname, path, method, headers: headers || {} };
    const req = https.request(opts, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => res(d));
    });
    req.on('error', rej);
    if (body) req.write(body);
    req.end();
  });
}

function firestoreDoc(token, method, coll, docId, data) {
  const p = `/v1/projects/sicip-1369d/databases/(default)/documents/${coll}${docId ? '/' + docId : ''}?access_token=${token}`;
  const body = data ? JSON.stringify({ fields: toFields(data) }) : null;
  return rawRequest(method, 'firestore.googleapis.com', p,
    { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body);
}

function toFields(obj) {
  const f = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') f[k] = { stringValue: v };
    else if (typeof v === 'number') f[k] = { integerValue: v };
    else if (typeof v === 'boolean') f[k] = { booleanValue: v };
    else if (Array.isArray(v)) f[k] = { arrayValue: { values: v.map(i => typeof i === 'string' ? { stringValue: i } : { stringValue: String(i) }) } };
    else if (typeof v === 'object') f[k] = { mapValue: { fields: toFields(v) } };
    else f[k] = { stringValue: String(v) };
  }
  return f;
}

async function main() {
  const token = await getAccessToken();
  const email = 'moises.beltran@imss.gob.mx';

  // 1. Get user by email
  console.log('1. Obteniendo UID del usuario...');
  const getRes = await rawRequest('POST', 'identitytoolkit.googleapis.com',
    '/v3/projects/sicip-1369d/accounts:lookup',
    { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    JSON.stringify({ email: [email] }));
  const getData = JSON.parse(getRes);
  const users = getData.users || [];
  if (users.length === 0) { console.log('❌ Usuario no encontrado'); process.exit(1); }
  const uid = users[0].localId;
  console.log('   ✅ UID:', uid);

  // 2. Verify/create usuario document
  console.log('\n2. Verificando documento de usuario...');
  const checkRes = await rawRequest('GET', 'firestore.googleapis.com',
    `/v1/projects/sicip-1369d/databases/(default)/documents/usuarios/${uid}?access_token=${token}`,
    { 'Authorization': 'Bearer ' + token });
  const checkData = JSON.parse(checkRes);
  if (checkData.error) {
    console.log('   Creating user doc...');
    const r2 = await firestoreDoc(token, 'PATCH', 'usuarios', uid, {
      uid, email, nombre: 'Administrador', rol: 'ADMIN', activo: true,
      fechaCreacion: new Date().toISOString(), matricula: null, unidadClave: null, unidadNombre: null
    });
    console.log('   ✅ Creado:', JSON.parse(r2).name ? 'OK' : r2);
  } else {
    console.log('   ✅ Ya existe:', checkData.name);
    // Update with current data
    await firestoreDoc(token, 'PATCH', 'usuarios', uid, {
      uid, email, nombre: 'Administrador', rol: 'ADMIN', activo: true,
      fechaCreacion: new Date().toISOString()
    });
    console.log('   ✅ Actualizado');
  }

  // 3. Test Firestore write
  console.log('\n3. Verificando acceso a Firestore...');
  const testRes = await firestoreDoc(token, 'PATCH', '_test', 'ping', { ping: 'pong', ts: new Date().toISOString() });
  const testData = JSON.parse(testRes);
  if (testData.error) {
    console.log('   ❌ Error Firestore:', testData.error.message);
    console.log('   Código:', testData.error.code);
  } else {
    console.log('   ✅ Firestore OK:', testData.name);
    // Delete test doc
    await rawRequest('DELETE', 'firestore.googleapis.com',
      `/v1/projects/sicip-1369d/databases/(default)/documents/_test/ping?access_token=${token}`,
      { 'Authorization': 'Bearer ' + token });
    console.log('   🧹 Test doc deleted');
  }

  console.log('\n=== Listo ===');
  console.log('UID:', uid);
  console.log('Email: moises.beltran@imss.gob.mx');
}

main().catch(e => console.error('❌', e.message));
