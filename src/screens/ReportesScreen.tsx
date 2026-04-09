import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, FileText, Filter } from 'lucide-react';
import type { Usuario, Tramite } from '../types/sicip';
import { Estatus, Rol } from '../types/sicip';
import { ESTATUS_LABELS, COLOR_ESTATUS, TIPO_TRAMITE_LABELS } from '../constants/sicip';
import { getAllTramites } from '../services/firebase';

export default function ReportesScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTramites(500).then(setTramites).catch(console.error).finally(() => setLoading(false));
  }, []);

  const porEstatus: Record<string, number> = {};
  const porTipo: Record<string, number> = {};
  let vencidos = 0;
  let total = tramites.length;

  tramites.forEach(t => {
    porEstatus[t.estatus] = (porEstatus[t.estatus] || 0) + 1;
    porTipo[t.tipo] = (porTipo[t.tipo] || 0) + 1;
    if (t.fechaLimiteEntrega) {
      const d = new Date(t.fechaLimiteEntrega);
      d.setHours(0,0,0,0);
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      if (d < hoy && t.estatus !== Estatus.CONCLUIDO) vencidos++;
    }
  });

  const exportarCSV = () => {
    const headers = ['Folio', 'Tipo', 'Trabajador', 'Matrícula', 'Unidad', 'Estatus', 'Fecha Creación', 'Fecha Límite', 'Solicitante'];
    const rows = tramites.map(t => [
      t.folio, t.tipo, t.trabajadorNombre, t.trabajadorMatricula, t.unidadClave,
      t.estatus, t.fechaCreacion, t.fechaLimiteEntrega || '', t.solicitanteNombre
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `sicip-reportes-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--brand-200)', borderTopColor: 'var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Reportes y Estadísticas</h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{total} trámites registrados</p>
        </div>
        <button onClick={exportarCSV} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem' }}>
          <Download size={17} /> Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
        {[{ label: 'Total', value: total, color: 'var(--brand-600)' }, { label: 'Vencidos', value: vencidos, color: '#ef4444' }, { label: 'Concluidos', value: porEstatus[Estatus.CONCLUIDO] || 0, color: '#22c55e' }, { label: 'En proceso', value: total - (porEstatus[Estatus.CONCLUIDO] || 0) - vencidos, color: '#f59e0b' }].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Por estatus */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Por Estatus</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(porEstatus).sort(([,a],[,b]) => Number(b)-Number(a)).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_ESTATUS[k as Estatus] }} />
                  <span>{ESTATUS_LABELS[k as Estatus] || k}</span>
                </div>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por tipo */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Por Tipo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(porTipo).sort(([,a],[,b]) => Number(b)-Number(a)).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span>{TIPO_TRAMITE_LABELS[k as any] || k}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
