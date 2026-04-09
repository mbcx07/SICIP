import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import type { Usuario } from '../types/sicip';
import { saveTrabajadoresBatch } from '../services/firebase';

export default function PlantillaScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ actualizados: number; insertados: number } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const text = await f.text();
    try {
      if (f.name.endsWith('.json')) {
        const json = JSON.parse(text);
        setPreview(Array.isArray(json) ? json.slice(0, 10) : []);
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return;
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
          return obj;
        });
        setPreview(rows.slice(0, 10));
      }
    } catch (err) {
      console.error('Parse error:', err);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const text = await file.text();
      let dataArray: any[] = [];
      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        dataArray = Array.isArray(json) ? json : json.data || json.trabajadores || [];
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length >= 2) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          dataArray = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
            return obj;
          });
        }
      }
      const res = await saveTrabajadoresBatch(dataArray);
      setResult(res);
      setPreview(null);
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Plantilla de Personal</h2>
        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Importa trabajadores desde CSV o JSON. La matrícula es el identificador único.
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)', textAlign: 'center' }}>
        <Upload size={48} color="var(--brand-400)" style={{ margin: '0 auto 1rem', display: 'block' }} />
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Importar Plantilla</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
          Formato CSV o JSON. Columnas: matricula, nombre, apellidoPaterno, apellidoMaterno, area, unidadClave, tipoContrato, delegacion
        </p>
        <label className="btn-institutional" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem' }}>
          <Upload size={16} />Seleccionar archivo
          <input type="file" accept=".csv,.json" onChange={handleFile} style={{ display: 'none' }} />
        </label>
        {file && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--brand-600)', fontWeight: 600 }}>{file.name}</p>}
      </div>

      {preview && preview.length > 0 && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700 }}>Vista previa ({preview.length} registros)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  {Object.keys(preview[0]).map(k => (
                    <th key={k} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700 }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    {Object.values(r).map((v, j) => (
                      <td key={j} style={{ padding: '0.5rem 0.75rem' }}>{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleImport} disabled={saving} className="btn-institutional" style={{ marginTop: '1rem', width: '100%' }}>
            {saving ? 'Importando...' : 'Importar todos los registros'}
          </button>
        </div>
      )}

      {result && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#166534' }}>
          <CheckCircle2 size={24} />
          <div>
            <div style={{ fontWeight: 700 }}>Importación completada</div>
            <div style={{ fontSize: '0.875rem' }}>{result.insertados} nuevos · {result.actualizados} actualizados</div>
          </div>
        </div>
      )}
    </div>
  );
}
