const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() { return request.auth != null; }

    match /usuarios/{uid} {
      allow read: if isAuthenticated();
      allow write: if false;
    }

    match /unidades/{clave} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /tipos_tramite/{id} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /trabajadores/{matricula} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /tramites/{tramiteId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /historial_estados/{histId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /plazas_reemplazo/{id} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /cuadros_reemplazo/{id} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /postulaciones_reemplazo/{id} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}`;

async function applyRules() {
  try {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();

    const projectId = 'sicip-bcs';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/rules`;

    const response = await client.request({
      url: url,
      method: 'PATCH',
      data: {
        rules: { rules: { raw: rules } }
      }
    });

    console.log('Rules applied successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error applying rules:', error.message);
    if (error.response) console.error('Details:', JSON.stringify(error.response.data, null, 2));
    process.exit(1);
  }
}

applyRules();
