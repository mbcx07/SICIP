const { GoogleAuth } = require('google-auth-library');
const https = require('https');

const SA_KEY = require('/home/moises-beltran-castro/.config/sicip-firebase-sa.json');
const PROJECT_ID = 'sicip-bcs';

async function getToken() {
  const auth = new GoogleAuth({ credentials: SA_KEY, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  return (await client.getAccessToken()).token;
}

function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (typeof v === 'number') fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else if (Array.isArray(v)) {
      fields[k] = { arrayValue: { values: v.map(item => {
        if (typeof item === 'string') return { stringValue: item };
        if (typeof item === 'number') return Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item };
        return { stringValue: String(item) };
      }) } };
    } else if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: toFields(v) } };
    }
  }
  return fields;
}

function httpRequest(method, path, body) {
  return new Promise(async (resolve) => {
    const token = await getToken();
    const dataStr = body ? JSON.stringify(body) : undefined;
    const url = `https://firestore.googleapis.com${path}`;
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    if (dataStr) opts.headers['Content-Length'] = Buffer.byteLength(dataStr);
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve({ _raw: d }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function commit(docPath, data) {
  const token = await getToken();
  const name = `projects/${PROJECT_ID}/databases/(default)/documents${docPath}`;
  const body = {
    writes: [{
      update: { name, fields: toFields(data) },
    }],
  };
  const dataStr = JSON.stringify(body);
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`;
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, path: u.pathname,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dataStr) },
  };
  return new Promise((resolve) => {
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve({ _raw: d }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(dataStr); req.end();
  });
}

async function seed() {
  console.log('Token...');
  await getToken();
  console.log('OK\n');

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

  console.log(`Insertando ${UNIDADES.length} unidades via commit API...`);
  for (const u of UNIDADES) {
    const res = await commit(`/unidades/${u.clave}`, u);
    if (res.error) {
      console.log(`  ERROR ${u.clave}: ${res.error.message || JSON.stringify(res.error).slice(0,100)}`);
    } else {
      console.log(`  OK ${u.clave}`);
    }
  }

  console.log('\nHecho!');
}

seed().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
