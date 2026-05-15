// ============================================================
// SICIP — Módulo: Indicadores RH
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { getIndicadores, guardarIndicador, watchIndicadores, getResumenIndicadores, IndicadorRH } from '../../services/firebase-modules';
import DataGrid from '../../components/shared/DataGrid';
import { BarChart2, Plus, Filter, Save, X, Activity, AlertTriangle } from 'lucide-react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  INCAPACIDAD: { label: 'Incapacidad', color: '#ef4444' },
  LICENCIA_SGSS: { label: 'Lic. s/Goce', color: '#f59e0b' },
  LICENCIA_MEDICA: { label: 'Lic. Médica', color: '#8b5cf6' },
  FALTA: { label: 'Falta', color: '#dc2626' },
  VACACIONES: { label: 'Vacaciones', color: '#10b981' },
  COMISION: { label: 'Comisión', color: '#3b82f6' },
  PERMISO: { label: 'Permiso', color: '#06b6d4' },
};

const defaultForm: Partial<IndicadorRH> = {
  tipo: 'INCAPACIDAD',
};

export default function IndicadoresScreen() {
  const now = new Date();
  const [periodo, setPeriodo] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [items, setItems] = useState<IndicadorRH[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<IndicadorRH>>({...defaultForm});
  const [saving, setSaving] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchIndicadores(periodo, items => {
      setItems(items);
      setLoading(false);
    });
    return () => unsub();
  }, [periodo]);

  const resumen = useMemo(() => {
    const r: Record<string, number> = {};
    items.forEach(i => { r[i.tipo] = (r[i.tipo] || 0) + 1; });
    return r;
  }, [items]);

  const totalDias = useMemo(() => {
    return items.reduce((acc, i) => acc + (i.dias || 0), 0);
  }, [items]);

  const filtered = filterTipo === 'TODOS' ? items : items.filter(i => i.tipo === filterTipo);

  const handleSave = async () => {
    if (!form.trabajadorMatricula || !form.fechaInicio || !form.fechaFin) {
      setError('Matrícula, fecha inicio y fecha fin son obligatorios');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dias = Math.ceil((new Date(form.fechaFin).getTime() - new Date(form.fechaInicio).getTime()) / 86400000) + 1;
      await guardarIndicador({
        ...form as IndicadorRH,
        periodo,
        dias: Math.max(1, dias),
        unidadClave: form.unidadClave || 'SIN_UNIDAD',
        unidadNombre: form.unidadNombre || 'SIN UNIDAD',
      });
      setForm({...defaultForm});
      setShowForm(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'tipo', label: 'Tipo', render: (v: string) => v ? (
      <span style={{ color: TIPO_CONFIG[v]?.color, fontWeight: 600, fontSize: '0.78rem' }}>{TIPO_CONFIG[v]?.label || v}</span>
    ) : '-' },
    { key: 'trabajadorMatricula', label: 'Matrícula' },
    { key: 'trabajadorNombre', label: 'Nombre' },
    { key: 'unidadClave', label: 'Unidad' },
    { key: 'fechaInicio', label: 'Inicio' },
    { key: 'fechaFin', label: 'Fin' },
    { key: 'dias', label: 'Días' },
    { key: 'diagnostico', label: 'Diagnóstico' },
    { key: 'folioDocumento', label: 'Folio Doc.' },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={24} /> Indicadores RH
          </h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{items.length} registros · {totalDias} días totales</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="form-input" style={{ width: 160, fontSize: '0.85rem' }} />
          <button onClick={() => { setForm({...defaultForm}); setShowForm(true); setError(null); }} className="btn-institutional"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {Object.entries(TIPO_CONFIG).map(([k, v]) => (
          <div key={k} style={{
            background: 'white', borderRadius: '0.75rem', padding: '0.85rem',
            border: `1px solid ${v.color}20`, textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: v.color }}>{resumen[k] || 0}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{v.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['TODOS', ...Object.keys(TIPO_CONFIG)].map(t => (
          <button key={t} onClick={() => setFilterTipo(t)}
            style={{
              padding: '0.3rem 0.7rem', borderRadius: '99px', border: '1px solid var(--border-soft)',
              background: filterTipo === t ? (t === 'TODOS' ? 'var(--brand-600)' : TIPO_CONFIG[t]?.color) : 'white',
              color: filterTipo === t ? 'white' : 'var(--text-muted)',
              fontWeight: filterTipo === t ? 700 : 500, fontSize: '0.75rem', cursor: 'pointer'
            }}>
            {t === 'TODOS' ? 'Todos' : TIPO_CONFIG[t]?.label}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Nuevo Registro RH</h3>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="field-group" style={{ gridColumn: '1/-1' }}>
                <label className="field-label">Tipo *</label>
                <select value={form.tipo || 'INCAPACIDAD'} onChange={e => setForm(f => ({...f, tipo: e.target.value as any}))} className="form-input">
                  {Object.entries(TIPO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Matrícula Trabajador *</label>
                <input value={form.trabajadorMatricula || ''} onChange={e => setForm(f => ({...f, trabajadorMatricula: e.target.value}))} className="form-input" placeholder="Ej. 99032244" />
              </div>
              <div className="field-group">
                <label className="field-label">Nombre</label>
                <input value={form.trabajadorNombre || ''} onChange={e => setForm(f => ({...f, trabajadorNombre: e.target.value}))} className="form-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Fecha Inicio *</label>
                <input type="date" value={form.fechaInicio || ''} onChange={e => setForm(f => ({...f, fechaInicio: e.target.value}))} className="form-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Fecha Fin *</label>
                <input type="date" value={form.fechaFin || ''} onChange={e => setForm(f => ({...f, fechaFin: e.target.value}))} className="form-input" />
              </div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}>
                <label className="field-label">Diagnóstico</label>
                <input value={form.diagnostico || ''} onChange={e => setForm(f => ({...f, diagnostico: e.target.value}))} className="form-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Folio Documento</label>
                <input value={form.folioDocumento || ''} onChange={e => setForm(f => ({...f, folioDocumento: e.target.value}))} className="form-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Unidad</label>
                <input value={form.unidadClave || ''} onChange={e => setForm(f => ({...f, unidadClave: e.target.value}))} className="form-input" />
              </div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}>
                <label className="field-label">Observaciones</label>
                <textarea value={form.observaciones || ''} onChange={e => setForm(f => ({...f, observaciones: e.target.value}))} className="form-input" rows={2} />
              </div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-soft)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
                <Save size={15} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DataGrid columns={columns} data={filtered} loading={loading}
        searchFields={['trabajadorNombre', 'trabajadorMatricula', 'diagnostico', 'folioDocumento']}
        searchPlaceholder="Buscar trabajador..."
        emptyMessage="Sin registros para este período"
        exportFilename={`indicadores-rh-${periodo}`} />
    </div>
  );
}
