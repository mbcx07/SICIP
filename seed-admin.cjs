/**
 * seed-admin.js — Crea cuenta admin para Moisés
 * Uso: node seed-admin.js
 */
const https = require('https');

const API_KEY = 'AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8';
const PROJECT_ID = 'sicip-bcs';

// 1. Crear usuario en Firebase Auth
async function crearUsuarioAuth(email, password) {
  const body = JSON.stringify({
    email, password,
    returnSecureToken: true,
  });

  const data = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    body
  );

  if (data.error) {
    // Si ya existe, obtener el uid
    if (data.error.message === 'EMAIL_EXISTS') {
      console.log('⚠️  Usuario ya existe en Auth:', email);
      const signIn = await post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        JSON.stringify({ email, password, returnSecureToken: true })
      );
      if (signIn.error) throw new Error('Usuario existe pero contraseña incorrecta: ' + signIn.error.message);
      console.log('✅ Sesión verificada para usuario existente');
      return signIn.localId;
    }
    throw new Error(data.error.message);
  }

  console.log('✅ Usuario Auth creado:', data.localId);
  return data.localId;
}

// 2. Crear documento en Firestore (usando REST)
async function crearDocumento(collection, docId, data) {
  const body = JSON.stringify({ fields: serialize(data) });

  try {
    const existing = await get(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${API_KEY}`
    );
    if (!existing.error) {
      console.log(`  ℹ️  ${collection}/${docId} ya existe — actualizando...`);
    }
  } catch {}

  const result = await patch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?documentId=${docId}&key=${API_KEY}`,
    body
  );

  if (result.error) {
    // Intentar con POST (id automático)
    const postResult = await post(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?key=${API_KEY}&documentId=${docId}`,
      body
    );
    if (postResult.error) throw new Error(postResult.error.message);
    console.log(`✅ Documento creado en ${collection}/${docId}`);
    return postResult;
  }

  console.log(`✅ Documento guardado en ${collection}/${docId}`);
  return result;
}

// 3. Serializar datos a formato Firestore
function serialize(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) {
      fields[k] = { nullValue: null };
    } else if (typeof v === 'string') {
      fields[k] = { stringValue: v };
    } else if (typeof v === 'number') {
      fields[k] = { integerValue: String(v) };
    } else if (typeof v === 'boolean') {
      fields[k] = { booleanValue: v };
    } else if (Array.isArray(v)) {
      fields[k] = { arrayValue: { values: v.map(item => {
        if (typeof item === 'string') return { stringValue: item };
        if (typeof item === 'number') return { integerValue: String(item) };
        if (typeof item === 'object') return { mapValue: { fields: serialize(item) } };
        return { stringValue: String(item) };
      })}};
    } else if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: serialize(v) } };
    }
  }
  return fields;
}

// Helpers HTTP
function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(d); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function patch(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  const email = 'moises.beltran@imss.gob.mx';
  const password = 'LuMo221407';

  console.log('🚀 Creando cuenta admin para:', email);

  // Step 1: Auth
  let uid;
  try {
    uid = await crearUsuarioAuth(email, password);
  } catch (e) {
    console.error('❌ Error creando usuario Auth:', e.message);
    process.exit(1);
  }

  // Step 2: Usuario en Firestore (rol ADMIN)
  const usuarioData = {
    uid,
    email,
    nombre: 'Moisés Beltrán Castro',
    rol: 'ADMIN',
    unidadClave: '03HD01',
    unidadNombre: 'HOSPITAL GENERAL DE ZONA MF 1',
    activo: true,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
  };

  try {
    await crearDocumento('usuarios', uid, usuarioData);
  } catch (e) {
    console.error('❌ Error creando documento Firestore:', e.message);
    process.exit(1);
  }

  console.log('\n✅ ¡Cuenta admin lista!');
  console.log('   Email:', email);
  console.log('   Contraseña: LuMo221407');
  console.log('   Rol: ADMIN (acceso total)');
  console.log('\n📱 Entra a SICIP y pulsa "Olvidé mi contraseña" si necesitas el link de verificación.');
}

main();
