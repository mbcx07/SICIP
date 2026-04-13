/**
 * seed-admin2.cjs — Crea documento admin en Firestore usando sign-in
 */
const https = require('https');
const API_KEY = 'AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8';
const PROJECT_ID = 'sicip-bcs';

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function serialize(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) fields[k] = { nullValue: null };
    else if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (Array.isArray(v)) {
      fields[k] = { arrayValue: { values: v.map(item => {
        if (typeof item === 'string') return { stringValue: item };
        if (typeof item === 'number') return { integerValue: String(item) };
        return { stringValue: String(item) };
      })}};
    } else if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: serialize(v) } };
    }
  }
  return fields;
}

async function main() {
  const email = 'moises.beltran@imss.gob.mx';
  const password = 'LuMo221407';

  // 1. Sign in para obtener ID token
  const signIn = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    JSON.stringify({ email, password, returnSecureToken: true })
  );

  if (signIn.error) {
    console.error('Error Auth:', signIn.error.message);
    process.exit(1);
  }

  const idToken = signIn.idToken;
  const uid = signIn.localId;
  console.log('✅ Sesión ok. UID:', uid);

  // 2. Escribir en Firestore con Bearer token
  const data = {
    uid, email,
    nombre: 'Moisés Beltrán Castro',
    rol: 'ADMIN',
    unidadClave: '03HD01',
    unidadNombre: 'HOSPITAL GENERAL DE ZONA MF 1',
    activo: true,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
  };

  const body = JSON.stringify({ fields: serialize(data) });
  const fsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/usuarios/${uid}?documentId=${uid}`;

  const u = new URL(fsUrl);
  const req = https.request({
    hostname: u.hostname, path: u.pathname + u.search,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Authorization': `Bearer ${idToken}`,
    },
  }, res => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const r = JSON.parse(d);
        if (r.error) {
          console.error('Error Firestore:', r.error.message);
          process.exit(1);
        }
        console.log('✅ Documento Firestore creado:', r.name);
        console.log('\n🎉 ¡Cuenta admin lista!');
        console.log('   Email: moises.beltran@imss.gob.mx');
        console.log('   Contraseña: LuMo221407');
        console.log('   UID: ' + uid);
      } catch(e) {
        console.error('Response parse error:', d.substring(0, 300));
      }
    });
  });
  req.on('error', e => { console.error(e); process.exit(1); });
  req.write(body); req.end();
}

main();
