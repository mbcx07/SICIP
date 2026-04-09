const { GoogleAuth } = require('google-auth-library');
const https = require('https');

const SA_KEY = require('/home/moises-beltran-castro/.config/sicip-firebase-sa.json');
const PROJECT_ID = 'sicip-bcs';

const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() { return request.auth != null; }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'ADMIN';
    }
    
    function isAreaPersonal() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'AREA_PERSONAL';
    }
    
    function isOwner(uid) { return request.auth.uid == uid; }
    
    match /usuarios/{uid} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || isOwner(uid);
    }
    
    match /unidades/{clave} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /tipos_tramite/{id} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /trabajadores/{matricula} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || isAreaPersonal();
    }
    
    match /tramites/{tramiteId} {
      allow read: if isAuthenticated() && 
        (isAdmin() || isAreaPersonal() || resource.data.solicitanteUid == request.auth.uid);
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin() || isAreaPersonal();
    }
    
    match /historial_estados/{histId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}`;

async function getToken() {
  const auth = new GoogleAuth({ credentials: SA_KEY, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  return (await client.getAccessToken()).token;
}

function getIamToken() {
  return new Promise(async (resolve) => {
    const auth = new GoogleAuth({ credentials: SA_KEY, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;
    const url = `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}?fields=name,etag`;
    https.get(url, { headers: { Authorization: `Bearer ${token}` } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function applyRules() {
  const token = await getToken();
  const projectData = await getIamToken();
  const etag = projectData?.etag || '';
  console.log('Project etag:', etag ? 'OK' : 'no etag');

  // Create a ruleset first
  const rulesetBody = {
    source: { files: [{ name: 'firestore.rules', content: RULES }] },
  };
  const rulesetStr = JSON.stringify(rulesetBody);
  const rulesetUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`;
  const ru = new URL(rulesetUrl);
  const rulesetRes = await new Promise(r => {
    const req = https.request({ hostname: ru.hostname, path: ru.pathname, method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(rulesetStr) } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r({ status: res.statusCode, body: d }));
    });
    req.on('error', e => r({ error: e.message }));
    req.write(rulesetStr); req.end();
  });

  let rulesetName;
  if (rulesetRes.error) {
    console.log('Ruleset error:', rulesetRes.error);
    return;
  }
  try {
    const parsed = JSON.parse(rulesetRes.body);
    if (parsed.error) {
      console.log('Ruleset API error:', parsed.error.message);
      return;
    }
    rulesetName = parsed.name;
    console.log('Ruleset created:', rulesetName);
  } catch(e) {
    console.log('Ruleset parse error, raw:', rulesetRes.body.slice(0, 200));
    return;
  }

  // Create release pointing to ruleset
  const releaseBody = { name: `projects/${PROJECT_ID}/releases/v1`, rulesetName };
  const releaseStr = JSON.stringify(releaseBody);
  const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`;
  const rlu = new URL(releaseUrl);
  const releaseRes = await new Promise(r => {
    const req = https.request({ hostname: rlu.hostname, path: rlu.pathname, method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(releaseStr) } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r({ status: res.statusCode, body: d }));
    });
    req.on('error', e => r({ error: e.message }));
    req.write(releaseStr); req.end();
  });

  if (releaseRes.error) console.log('Release error:', releaseRes.error);
  else console.log('Release response:', releaseRes.status, releaseRes.body.slice(0, 200));
}

async function main() {
  console.log('Aplicando reglas de Firestore...\n');
  await applyRules();
}
main().catch(e => console.error('Fatal:', e.message));

