/**
 * import-plantilla.js
 * Importa trabajadores desde Excel a Firestore via Firebase REST API.
 * No necesita firebase-admin ni service account.
 * Requiere: npm install xlsx
 *
 * Uso: node import-plantilla.js <ruta_excel>
 */
const XLSX = require('xlsx');
const https = require('https');
const readline = require('readline');

// ── Configuración ───────────────────────────────────────
const PROJECT_ID = 'sicip-bcs';
const API_KEY = 'AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Auth via Firebase custom token (usando la API key) ──
// Para escrituras necesitamos un token de acceso.
// Como no tenemos service account, usamos la estrategia de "importación via cliente"
//
// OPCIÓN: Script genera JSON de trabajadores + plazas listo para importar
// via la功能 de Seed del sistema (PlantillaScreen)
// ────────────────────────────────────────────────────────

function serialToDate(serial) {
  if (!serial) return null;
  try {
    const date = new Date((parseInt(serial) - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  } catch { return null; }
}

function parseNombre(nombreCompleto) {
  if (!nombreCompleto) return { nombre: '', apellidoPaterno: '', apellidoMaterno: '' };
  const partes = String(nombreCompleto).split('/').map(p => p.trim());
  if (partes.length >= 3) {
    return { apellidoPaterno: partes[0], apellidoMaterno: partes[1], nombre: partes.slice(2).join(' ') };
  } else if (partes.length === 2) {
    return { apellidoPaterno: partes[0], apellidoMaterno: partes[1], nombre: '' };
  }
  return { nombre: String(nombreCompleto), apellidoPaterno: '', apellidoMaterno: '' };
}

function parseTipoContrato(tipo) {
  const map = { 10: 'BASE', 11: 'CONFIANZA', 20: 'EVENTUAL', 30: 'SUPERNUMERARIO', 40: 'HONORARIOS', 50: 'INTERINO', 60: 'SUSTITUTO', 70: 'RESIDENTE', 80: 'BECARIO' };
  return map[String(tipo)] || String(tipo);
}

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const url = new URL(path.startsWith('http') ? path : BASE_URL + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
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

// ── Importar Matriculero ─────────────────────────────────
async function importarMatriculero(datos) {
  console.log(`\n📋 MATRICULERO: ${datos.length} registros`);
  let ok = 0, err = 0;

  for (const row of datos) {
    const matricula = String(row['Matricula'] || '').trim();
    if (!matricula || matricula === '0') continue;

    const nombreParsed = parseNombre(String(row['Nombre'] || ''));
    const claveDepto = String(row['Departamento'] || '').substring(0, 6).toUpperCase();
    const tipoRaw = parseInt(row['Tipo de Contratacion'] || 11);
    const status = parseInt(row['Status'] || 1);

    const doc = {
      fields: {
        matricula: { stringValue: matricula },
        nombre: { stringValue: nombreParsed.nombre.toUpperCase() },
        apellidoPaterno: { stringValue: nombreParsed.apellidoPaterno.toUpperCase() },
        apellidoMaterno: { stringValue: nombreParsed.apellidoMaterno.toUpperCase() },
        curp: { stringValue: String(row['CURP'] || '').toUpperCase() || null },
        rfc: { nullValue: null },
        nss: { nullValue: null },
        categoria: { stringValue: String(row['Descripcion'] || '').trim().toUpperCase() || null },
        tipoContrato: { stringValue: parseTipoContrato(tipoRaw) },
        unidadClave: { stringValue: claveDepto },
        unidadNombre: { stringValue: String(row['Descripcion1'] || '').trim().toUpperCase() },
        area: { stringValue: String(row['Descripcion1'] || '').trim().toUpperCase() },
        delegacion: { stringValue: 'OOAD BCS' },
        email: { nullValue: null },
        telefono: { nullValue: null },
        fechaIngreso: { stringValue: serialToDate(row['Fecha Ingreso']) || null },
        activo: { booleanValue: status !== 2 },
        fechaActualizacion: { stringValue: new Date().toISOString() },
        plazas: { arrayValue: { values: [] } },
        plazasCount: { integerValue: '0' },
        altaIndividual: { booleanValue: false },
      }
    };

    // Limpiar nulls
    for (const [k, v] of Object.entries(doc.fields)) {
      if (v.nullValue !== undefined && v.nullValue === null) {
        doc.fields[k] = { nullValue: null };
      }
    }

    try {
      await makeRequest(
        `/trabajadores/${matricula}?documentId=${matricula}`,
        'PATCH',
        doc
      );
      ok++;
      if (ok % 500 === 0) console.log(`  → ${ok} importados...`);
    } catch (e) {
      err++;
      if (err <= 5) console.error(`  Error ${matricula}:`, e.message || e);
    }
  }

  console.log(`✅ Matriculero: ${ok} importados, ${err} errores`);
  return { ok, err };
}

// ── Importar Vacantes ─────────────────────────────────────
async function importarVacantes(datos) {
  console.log(`\n📌 VACANTES: ${datos.length} registros`);
  let ok = 0, err = 0;

  for (const row of datos) {
    const clavePlaza = String(row['Clave de la Plaza'] || '').trim();
    if (!clavePlaza) continue;

    const claveAdscripcion = String(row['Clave de Adscripcion IP'] || '');
    const clave6 = claveAdscripcion.substring(0, 6).toUpperCase();

    const doc = {
      fields: {
        clavePlaza: { stringValue: clavePlaza },
        tipoPlaza: { stringValue: String(row['TP'] || '') },
        tc: { integerValue: String(parseInt(row['TC'] || 0)) },
        puesto: { stringValue: String(row['Puesto'] || '').trim() },
        descripcion: { stringValue: String(row['Descripcion'] || '').trim() },
        clasificacion: { stringValue: String(row['Clasificación'] || '').trim() },
        ar: { stringValue: String(row['AR'] || '').trim() },
        descripcionAr: { stringValue: String(row['Descripcion AR'] || '').trim() },
        departamento: { stringValue: String(row['Departamento'] || '').trim() },
        descripcion1: { stringValue: String(row['Descripcion1'] || '').trim() },
        localidad: { stringValue: String(row['LOCALIDAD'] || '').trim() },
        unidadClave: { stringValue: clave6 },
        nombreServicio: { stringValue: String(row['Nombre del Servicio'] || '').trim() },
        mo: { integerValue: String(parseInt(row['MO'] || 0)) },
        turno: { stringValue: String(row['Turno'] || '') },
        horario: { stringValue: String(row['Descripcion2'] || '').trim() },
        restriccion: { stringValue: String(row['Restringidas'] || '').trim() || null },
        activa: { booleanValue: true },
        fechaActualizacion: { stringValue: new Date().toISOString() },
      }
    };

    try {
      await makeRequest(
        `/vacantes/${clavePlaza}?documentId=${clavePlaza}`,
        'PATCH',
        doc
      );
      ok++;
      if (ok % 100 === 0) console.log(`  → ${ok} vacantes...`);
    } catch (e) {
      err++;
      if (err <= 3) console.error(`  Error vacante ${clavePlaza}:`, e.message || e);
    }
  }

  console.log(`✅ Vacantes: ${ok} guardadas, ${err} errores`);
}

// ── Exportar plazas por matrícula (para referencia) ─────────
function generarReportePlazas(datos) {
  const plazasPorMat = {};
  for (const row of datos) {
    const emp = String(row['Empleado ocupante'] || '0').trim();
    if (!emp || emp === '0') continue;
    plazasPorMat[emp] = plazasPorMat[emp] || [];
    plazasPorMat[emp].push({
      clavePlaza: String(row['Clave de la Plaza'] || ''),
      puesto: String(row['Descripcion'] || '').trim(),
      tipoPlaza: String(row['TP'] || ''),
      tc: parseInt(row['TC'] || 0),
      unidadClave: String(row['Clave de Adscripcion IP'] || '').substring(0, 6).toUpperCase(),
      nombreServicio: String(row['Nombre del Servicio'] || '').trim(),
    });
  }

  // Guardar como JSON para referencia
  const fs = require('fs');
  fs.writeFileSync('/tmp/plazas_por_matricula.json', JSON.stringify(plazasPorMat, null, 2));
  console.log(`\n📊 Reporte plazas: ${Object.keys(plazasPorMat).length} trabajadores con plaza`);
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  const excelPath = process.argv[2] || 'plantilla_quincenal.xlsx';
  console.log('🚀 Importando plantilla SICIP...');
  console.log('📁:', excelPath);

  const workbook = XLSX.readFile(excelPath);

  // Matriculero
  const wsMat = workbook.Sheets['MATRICULERO'];
  const datosMat = XLSX.utils.sheet_to_json(wsMat, { defval: '' });
  await importarMatriculero(datosMat);

  // Vacantes
  const wsVac = workbook.Sheets['VACANTES'];
  const datosVac = XLSX.utils.sheet_to_json(wsVac, { defval: '' });
  await importarVacantes(datosVac);

  // Plazas (reporte nomas)
  const wsPlz = workbook.Sheets['07 TODAS PLAZAS QNA 2026007'];
  const datosPlz = XLSX.utils.sheet_to_json(wsPlz, { defval: '' });
  generarReportePlazas(datosPlz);

  console.log('\n🎉 Importación completada!');
}

main().catch(console.error);
