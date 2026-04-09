/**
 * import-plantilla.js
 * Importa trabajadores desde el Excel "TODAS LAS PLAZAS" a Firestore.
 * Ejecutar: node import-plantilla.js
 *
 * Requiere:
 *   npm install xlsx firebase-admin
 */
const XLSX = require('xlsx');
const admin = require('firebase-admin');

// ── Configuración Firebase Admin ──────────────────────────
const serviceAccount = require('./service-account.json'); // Descargar desde Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ── Mapeo de Status (MATRICULERO) ────────────────────────
function parseActivo(status, fechaBaja) {
  // status 100 = activo (jubilados), 1 = activo, 2 = baja
  // Si tiene fecha de baja y no es jubilado → inactivo
  if (status === 100) return true; // jubilado activo
  if (status === 1) return true;
  if (status === 2 || fechaBaja) return false;
  return true;
}

// ── Parseo de nombre "APELLIDO/APELLIDO/NOMBRE" ───────────
function parseNombre(nombreCompleto) {
  if (!nombreCompleto) return { nombre: '', apellidoPaterno: '', apellidoMaterno: '' };
  const partes = nombreCompleto.split('/').map(p => p.trim());
  if (partes.length === 3) {
    return {
      apellidoPaterno: partes[0],
      apellidoMaterno: partes[1],
      nombre: partes[2],
    };
  } else if (partes.length === 2) {
    return {
      apellidoPaterno: partes[0],
      apellidoMaterno: partes[1],
      nombre: '',
    };
  }
  return { nombre: nombreCompleto, apellidoPaterno: '', apellidoMaterno: '' };
}

// ── Tipo de contratación ──────────────────────────────────
function parseTipoContrato(tipo) {
  const map = {
    10: 'BASE',
    11: 'CONFIANZA',
    20: 'EVENTUAL',
    30: 'SUPERNUMERARIO',
    40: 'HONORARIOS',
    50: 'INTERINO',
    60: 'SUSTITUTO',
    70: 'RESIDENTE',
    80: 'BECARIO',
  };
  return map[String(tipo)] || String(tipo);
}

// ── Determina unidad y departamento desde la clave ────────
function parseUnidadYArea(claveAdscripcion, descripcion1, nombreServicio) {
  // claveAdscripcion puede venir como "03HD010000" o "030108593100"
  const clave6 = String(claveAdscripcion || '').substring(0, 6);
  const unidadClave = clave6.toUpperCase();
  return {
    unidadClave,
    unidadNombre: descripcion1 || nombreServicio || '',
    area: nombreServicio || descripcion1 || '',
  };
}

// ── Determina si es plaza vacante (sin ocupante) ──────────
function esVacante(empleadoOcupante) {
  return !empleadoOcupante || empleadoOcupante === 0 || empleadoOcupante === '0' || empleadoOcupante === null;
}

// ── Lectura del Excel ─────────────────────────────────────
function leerExcel(ruta) {
  const workbook = XLSX.readFile(ruta);
  return workbook;
}

async function importarMatriculero(workbook) {
  /**
   * Hoja MATRICULERO: trabajadores activos dados de alta
   * Columnas: Matricula, Nombre, Puesto, Descripcion, Departamento,
   *           Descripcion1, Tipo de Contratacion, Fecha Ingreso, Fecha de Baja,
   *           Cve Baja, Status, Sexo
   */
  const ws = workbook.Sheets['MATRICULERO'];
  const datos = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`\n📋 MATRICULERO: ${datos.length} registros`);

  let importados = 0;
  let saltados = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const row of datos) {
    const matricula = String(row['Matricula'] || '').trim();
    if (!matricula || matricula === '0') { saltados++; continue; }

    const nombreParsed = parseNombre(String(row['Nombre'] || ''));
    const status = parseInt(row['Status'] || 1);
    const activo = status !== 2;
    const tipoRaw = parseInt(row['Tipo de Contratacion'] || 11);
    const claveDepto = String(row['Departamento'] || '').substring(0, 6).toUpperCase();

    const trabajador = {
      matricula,
      nombre: nombreParsed.nombre,
      apellidoPaterno: nombreParsed.apellidoPaterno,
      apellidoMaterno: nombreParsed.apellidoMaterno,
      curp: String(row['CURP'] || '').toUpperCase() || null,
      rfc: null,
      nss: null,
      categoria: String(row['Descripcion'] || '').trim() || null,
      tipoContrato: parseTipoContrato(tipoRaw),
      unidadClave: claveDepto,
      unidadNombre: String(row['Descripcion1'] || '').trim(),
      area: String(row['Descripcion1'] || '').trim(),
      delegacion: 'OOAD BCS',
      email: null,
      telefono: null,
      fechaIngreso: row['Fecha Ingreso'] ? serialToDate(row['Fecha Ingreso']) : null,
      activo,
      fechaActualizacion: new Date().toISOString(),
      plazas: [], // se llena con datos de PLAZAS
    };

    const ref = db.collection('trabajadores').doc(matricula);
    batch.set(ref, trabajador, { merge: true });
    batchCount++;
    importados++;

    if (batchCount === 400) {
      await batch.commit();
      console.log(`  → Importados ${importados}...`);
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();
  console.log(`✅ Matriculero: ${importados} importados, ${saltados} saltados`);
  return { importados, saltados };
}

async function importarPlazas(workbook) {
  /**
   * Hoja "07 TODAS PLAZAS QNA 2026007": plazas con/sin ocupante
   * Campos clave: Clave de la Plaza, Empleado ocupante, Nombre Empleado Ocupante,
   *              TP, TC, Puesto, Descripcion, Clasificación, AR,
   *              Departamento, Descripcion1, LOCALIDAD, Clave de Adscripcion IP,
   *              Nombre del Servicio, MO, Turno, Clave del Horario,
   *              Titular de plz., Nombre Empleado Titular, CURP, NSS, RFC, SEXO
   */
  const ws = workbook.Sheets['07 TODAS PLAZAS QNA 2026007'];
  const datos = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`\n🏢 TODAS PLAZAS: ${datos.length} plazas`);

  //索引 por matrícula para asociar plazas a trabajadores
  const plazasPorMatricula = {};

  let plazasOcupadas = 0;
  let plazasVacantes = 0;

  for (const row of datos) {
    const clavePlaza = String(row['Clave de la Plaza'] || '');
    if (!clavePlaza) continue;

    const empleadoOcupante = String(row['Empleado ocupante'] || '0').trim();
    const nombreOcupante = String(row['Nombre Empleado Ocupante'] || '').trim();
    const tipoPlaza = String(row['TP'] || ''); // 11=confianza, 61=base, etc.
    const turno = String(row['Turno'] || '');

    // Obtener clave unidad de "Clave de Adscripcion IP" (6 primeros chars)
    const claveAdscripcion = String(row['Clave de Adscripcion IP'] || '');
    const clave6 = claveAdscripcion.substring(0, 6).toUpperCase();

    const plaza = {
      clavePlaza,
      tipoPlaza,
      tc: parseInt(row['TC'] || 0),
      puesto: String(row['Puesto'] || '').trim(),
      descripcion: String(row['Descripcion'] || '').trim(),
      clasificacion: String(row['Clasificación'] || '').trim(),
      ar: String(row['AR'] || '').trim(),
      descripcionAr: String(row['Descripcion AR'] || '').trim(),
      departamento: String(row['Departamento'] || '').trim(),
      descripcion1: String(row['Descripcion1'] || '').trim(),
      localidad: String(row['LOCALIDAD'] || '').trim(),
      unidadClave: clave6,
      nombreServicio: String(row['Nombre del Servicio'] || '').trim(),
      fechaInicio: row['Fecha de Inicio'] ? serialToDate(row['Fecha de Inicio']) : null,
      fechaTermino: row['Fecha de Termino'] ? serialToDate(row['Fecha de Termino']) : null,
      mo: parseInt(row['MO'] || 0), // 0=vacante, 1+=ocupada
      turno,
      horario: String(row['Descripcion2'] || '').trim(),
      curp: String(row['CURP.'] || '').toUpperCase() || null,
      nss: String(row['NSS'] || '').trim() || null,
      rfc: String(row['RFC'] || '').toUpperCase() || null,
      sexo: parseInt(row['SEXO'] || 0),
      anos: parseInt(row['AÑOS'] || 0),
      titularPlaza: String(row['Titular de plz.'] || '').trim(),
      nombreTitular: String(row['Nombre Empleado Titular'] || '').trim(),
      ocupada: empleadoOcupante && empleadoOcupante !== '0',
      restriccion: String(row['Restringidas'] || '').trim() || null,
      fechaActualizacion: new Date().toISOString(),
    };

    plazasPorMatricula[empleadoOcupante] = plazasPorMatricula[empleadoOcupante] || [];
    plazasPorMatricula[empleadoOcupante].push(plaza);

    if (plaza.ocupada) plazasOcupadas++;
    else plazasVacantes++;
  }

  console.log(`  → Plazas ocupadas: ${plazasOcupadas}, vacantes: ${plazasVacantes}`);

  // Guardar plazas como colección/subcollección por trabajador
  let plazasGuardadas = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const [matricula, plazas] of Object.entries(plazasPorMatricula)) {
    if (!matricula || matricula === '0') continue;
    const ref = db.collection('trabajadores').doc(matricula);
    batch.update(ref, {
      plazas,
      plazasCount: plazas.length,
      fechaActualizacion: new Date().toISOString(),
    });
    batchCount++;
    plazasGuardadas += plazas.length;

    if (batchCount === 400) {
      await batch.commit();
      console.log(`  → Plazas actualizadas ${plazasGuardadas}...`);
    }
  }

  if (batchCount > 0) await batch.commit();
  console.log(`✅ Plazas: ${plazasGuardadas} asociadas a trabajadores`);
}

async function importarVacantes(workbook) {
  /**
   * Hoja VACANTES: plazas vacantes disponibles
   */
  const ws = workbook.Sheets['VACANTES'];
  const datos = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`\n📌 VACANTES: ${datos.length} registros`);

  let guardadas = 0;
  const batch = db.batch();

  for (const row of datos) {
    const clavePlaza = String(row['Clave de la Plaza'] || '');
    if (!clavePlaza) continue;

    const claveAdscripcion = String(row['Clave de Adscripcion IP'] || '');
    const clave6 = claveAdscripcion.substring(0, 6).toUpperCase();

    const plaza = {
      clavePlaza,
      tipoPlaza: String(row['TP'] || ''),
      tc: parseInt(row['TC'] || 0),
      puesto: String(row['Puesto'] || '').trim(),
      descripcion: String(row['Descripcion'] || '').trim(),
      clasificacion: String(row['Clasificación'] || '').trim(),
      ar: String(row['AR'] || '').trim(),
      descripcionAr: String(row['Descripcion AR'] || '').trim(),
      departamento: String(row['Departamento'] || '').trim(),
      descripcion1: String(row['Descripcion1'] || '').trim(),
      localidad: String(row['LOCALIDAD'] || '').trim(),
      unidadClave: clave6,
      nombreServicio: String(row['Nombre del Servicio'] || '').trim(),
      mo: parseInt(row['MO'] || 0),
      turno: String(row['Turno'] || ''),
      horario: String(row['Descripcion2'] || '').trim(),
      sexo: parseInt(row['SEXO'] || 0),
      restriccion: String(row['Restringidas'] || '').trim() || null,
      fechaActualizacion: new Date().toISOString(),
      activa: true,
    };

    const ref = db.collection('vacantes').doc(clavePlaza);
    batch.set(ref, plaza);
    guardadas++;

    if (guardadas % 400 === 0) {
      await batch.commit();
      console.log(`  → Vacantes ${guardadas}...`);
    }
  }

  if (guardadas % 400 !== 0) await batch.commit();
  console.log(`✅ Vacantes: ${guardadas} guardadas en Firestore`);
}

// ── Serial date → ISO string ───────────────────────────────
function serialToDate(serial) {
  if (!serial) return null;
  // Excel serial: days since 1899-12-30
  const date = new Date((parseInt(serial) - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  const excelPath = process.argv[2] || '/tmp/2026007_todas_las_plazas.xlsx';

  console.log('🚀 Iniciando importación SICIP...');
  console.log('📁 Excel:', excelPath);

  const workbook = leerExcel(excelPath);

  const t0 = Date.now();

  await importarMatriculero(workbook);
  await importarPlazas(workbook);
  await importarVacantes(workbook);

  console.log(`\n✅ Importación completada en ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
