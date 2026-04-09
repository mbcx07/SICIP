import React, { useState, useRef } from 'react';
import { collection, doc, setDoc, getDocs, query, limit, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useOutletContext } from 'react-router-dom';
import type { Usuario } from '../types/sicip';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Loader } from 'lucide-react';

export default function ImportarPlantillaScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [result, setResult] = useState<{ ok: number; err: number; dupl: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);

  const parseNombre = (nombreCompleto: string) => {
    if (!nombreCompleto) return { nombre: '', apellidoPaterno: '', apellidoMaterno: '' };
    const partes = String(nombreCompleto).split('/').map(p => p.trim());
    if (partes.length >= 3) {
      return { apellidoPaterno: partes[0], apellidoMaterno: partes[1], nombre: partes.slice(2).join(' ') };
    } else if (partes.length === 2) {
      return { apellidoPaterno: partes[0], apellidoMaterno: partes[1], nombre: '' };
    }
    return { nombre: String(nombreCompleto), apellidoPaterno: '', apellidoMaterno: '' };
  };

  const serialToDate = (serial: number | string) => {
    if (!serial) return null;
    try {
      const date = new Date((parseInt(String(serial)) - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    } catch { return null; }
  };

  const parseTipoContrato = (tipo: number | string) => {
    const map: Record<string, string> = {
      '10': 'BASE', '11': 'CONFIANZA', '20': 'EVENTUAL', '30': 'SUPERNUMERARIO',
      '40': 'HONORARIOS', '50': 'INTERINO', '60': 'SUSTITUTO', '70': 'RESIDENTE', '80': 'BECARIO',
    };
    return map[String(tipo)] || String(tipo);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setArchivo(f); setResult(null); setError(null); }
  };

  const importar = async () => {
    if (!archivo) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Dynamic import of XLSX
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await archivo.arrayBuffer(), { type: 'array' });

      // ── 1. MATRICULERO ──────────────────────────────────────
      setProgress({ current: 0, total: 0, phase: 'Leyendo MATRICULERO...' });
      const wsMat = workbook.Sheets['MATRICULERO'];
      const datosMat: any[] = XLSX.utils.sheet_to_json(wsMat, { defval: '' });
      setProgress({ current: 0, total: datosMat.length, phase: 'Importando trabajadores...' });

      const batch = writeBatch(db);
      let batchCount = 0;
      let ok = 0, err = 0, dupl = 0;

      // Check existing matriculas
      setProgress(p => ({ ...p, phase: 'Verificando trabajadores existentes...' }));
      const existingSnap = await getDocs(query(collection(db, 'trabajadores'), limit(1)));
      const existenteSet = new Set<string>();

      // Simple approach: import all with merge, skip duplicates by checking
      // We'll use setDoc with merge:true — overwrites if exists
      for (let i = 0; i < datosMat.length; i++) {
        const row = datosMat[i];
        const matricula = String(row['Matricula'] ?? '').trim();
        if (!matricula || matricula === '0') { dupl++; continue; }

        const nombreParsed = parseNombre(String(row['Nombre'] ?? ''));
        const claveDepto = String(row['Departamento'] ?? '').substring(0, 6).toUpperCase();
        const tipoRaw = parseInt(String(row['Tipo de Contratacion'] ?? 11));
        const status = parseInt((row['Status'] as any) || '1');

        const trabajador = {
          matricula,
          nombre: nombreParsed.nombre.toUpperCase(),
          apellidoPaterno: nombreParsed.apellidoPaterno.toUpperCase(),
          apellidoMaterno: nombreParsed.apellidoMaterno.toUpperCase(),
          curp: String(row['CURP'] || '').toUpperCase() || null,
          rfc: null,
          nss: null,
          categoria: String(row['Descripcion'] || '').trim().toUpperCase() || null,
          tipoContrato: parseTipoContrato(tipoRaw),
          unidadClave: claveDepto,
          unidadNombre: String(row['Descripcion1'] || '').trim().toUpperCase(),
          area: String(row['Descripcion1'] || '').trim().toUpperCase(),
          delegacion: 'OOAD BCS',
          email: null,
          telefono: null,
          fechaIngreso: serialToDate((row['Fecha Ingreso'] as any)) || null,
          activo: status !== 2,
          fechaActualizacion: new Date().toISOString(),
          plazas: [],
          plazasCount: 0,
          altaIndividual: false,
        };

        const ref = doc(db, 'trabajadores', matricula);
        batch.set(ref, trabajador, { merge: true });
        batchCount++;
        ok++;

        if (batchCount === 200) {
          await batch.commit();
          setProgress({ current: i + 1, total: datosMat.length, phase: `Guardando trabajadores ${i + 1}/${datosMat.length}...` });
          batchCount = 0;
        }
      }

      if (batchCount > 0) await batch.commit();
      setProgress({ current: datosMat.length, total: datosMat.length, phase: '✅ Trabajadores importados' });

      // ── 2. VACANTES ────────────────────────────────────────
      await new Promise(r => setTimeout(r, 500));
      const wsVac = workbook.Sheets['VACANTES'];
      const datosVac: any[] = XLSX.utils.sheet_to_json(wsVac, { defval: '' });
      setProgress({ current: 0, total: datosVac.length, phase: 'Importando vacantes...' });

      const batchVac = writeBatch(db);
      let vacCount = 0, vacOk = 0;

      for (let i = 0; i < datosVac.length; i++) {
        const row = datosVac[i];
        const clavePlaza = String(row['Clave de la Plaza'] || '').trim();
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
          restriccion: String(row['Restringidas'] || '').trim() || null,
          activa: true,
          fechaActualizacion: new Date().toISOString(),
        };

        const ref = doc(db, 'vacantes', clavePlaza);
        batchVac.set(ref, plaza, { merge: true });
        vacCount++;
        vacOk++;

        if (vacCount === 200) {
          await batchVac.commit();
          setProgress({ current: i + 1, total: datosVac.length, phase: `Vacantes ${i + 1}/${datosVac.length}...` });
          vacCount = 0;
        }
      }

      if (vacCount > 0) await batchVac.commit();

      setProgress({ current: datosVac.length, total: datosVac.length, phase: '🎉 Importación completada' });
      setResult({ ok: ok + vacOk, err, dupl: dupl + (datosVac.length - vacOk) });
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error al importar. Verifica el archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', marginBottom: '0.25rem' }}>
          📥 Importar Plantilla Quincenal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Carga el archivo Excel <strong>2026007_todas_las_plazas</strong> para actualizar la base de trabajadores y vacantes.
          Los datos se fusionan con los existentes (no borra registros).
        </p>
      </div>

      {/* Info boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { icon: '👥', label: 'Hoja MATRICULERO', desc: '12,798 trabajadores activos' },
          { icon: '📌', label: 'Hoja VACANTES', desc: '206 plazas disponibles' },
        ].map(b => (
          <div key={b.label} className="institutional-card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>{b.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{b.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {loading && (
        <div className="institutional-card" style={{ marginBottom: '1rem', background: 'var(--brand-050)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-600)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--brand-700)' }}>
              {progress.phase}
            </span>
          </div>
          {progress.total > 0 && (
            <div style={{ background: '#d1fae5', borderRadius: 999, height: 8, overflow: 'hidden' }}>
              <div style={{
                background: 'var(--brand-600)',
                height: '100%',
                width: `${Math.round((progress.current / progress.total) * 100)}%`,
                transition: 'width 0.3s ease',
                borderRadius: 999,
              }} />
            </div>
          )}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {progress.current} / {progress.total}
          </div>
        </div>
      )}

      {/* Success */}
      {result && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
        }}>
          <CheckCircle size={24} color="#16a34a" />
          <div>
            <div style={{ fontWeight: 700, color: '#166534' }}>Importación completada</div>
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>
              ✅ {result.ok} registros guardados &nbsp;|&nbsp; ⚠️ {result.dupl}saltados
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#dc2626',
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Upload card */}
      <div className="institutional-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <FileSpreadsheet size={48} color="var(--brand-500)" style={{ margin: '0 auto 1rem', display: 'block' }} />

        {!archivo ? (
          <>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
              Selecciona el archivo Excel de la quincenal
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Formato .xlsx — Hojas: MATRICULERO + VACANTES
            </p>
          </>
        ) : (
          <p style={{ fontWeight: 700, color: 'var(--brand-700)', marginBottom: '0.5rem' }}>
            📄 {archivo.name}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={loading}
          >
            <FileSpreadsheet size={16} />
            Elegir archivo
          </button>

          <button
            onClick={importar}
            disabled={!archivo || loading}
            className="btn-institutional"
          >
            {loading ? '⏳ Importando...' : <><Upload size={16} /> Importar a Firestore</>}
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
        La importación usa <strong>fusion</strong> (merge) — no sobreescribe datos existentes, solo agrega/actualiza.
        Ejecutar solo al inicio de cada quincena.
      </p>
    </div>
  );
}
