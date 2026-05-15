// ============================================================
// SICIP — Módulo: Catálogo Salarial (Sueldos)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { watchCategoriasSalariales, guardarCategoriaSalarial, actualizarCategoriaSalarial, CategoriaSalarial } from '../../services/firebase-modules';
import DataGrid from '../../components/shared/DataGrid';
import { DollarSign, Plus, Save, X, Edit2, AlertTriangle, TrendingUp } from 'lucide-react';

const defaultForm: Partial<CategoriaSalarial> = { activo: true, factorIntegracion: 1.0, tipoContrato: 'BASE' };

export default function SueldosScreen() {
  const [items, setItems] = useState<CategoriaSalarial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoriaSalarial | null>(null);
  const [form, setForm] = useState<Partial<CategoriaSalarial>>({...defaultForm});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchCategoriasSalariales(items => { setItems(items); setLoading(false); });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const activos = items.filter(i => i.activo).length;
    const totalSMI = items.reduce((s, i) => s + (i.smi || 0), 0);
    const maxSMI = Math.max(...items.map(i => i.smi || 0));
    const minSMI = Math.min(...items.filter(i => i.smi > 0).map(i => i.smi || 0));
    return { total: items.length, activos, maxSMI, minSMI };
  }, [items]);

  const resetForm = () => { setForm({...defaultForm}); setEditing(null); setError(null); };
  const openNew = () => { resetForm(); setForm({...defaultForm, clave: `CAT-${String(items.length + 1).padStart(4, '0')}`}); setShowForm(true); };
  const openEdit = (item: CategoriaSalarial) => { setEditing(item); setForm({...item}); setShowForm(true); };

  const handleSave = async () => {
    if (!form.clave || !form.nombre) { setError('Clave y nombre son obligatorios'); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form as CategoriaSalarial,
        salarioDiario: form.smi ? Math.round((form.smi / 30) * 100) / 100 : 0,
        salarioMensual: form.smi || 0,
      };
      if (editing?.id) await actualizarCategoriaSalarial(editing.id, payload);
      else await guardarCategoriaSalarial(payload);
      resetForm(); setShowForm(false);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'clave', label: 'Clave' },
    { key: 'nombre', label: 'Categoría', width: '300px' },
    { key: 'smi', label: 'S.M.I.', render: (v: number) => v ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-' },
    { key: 'salarioDiario', label: 'Sueldo Diario', render: (v: number) => v ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-' },
    { key: 'salarioMensual', label: 'Sueldo Mensual', render: (v: number) => v ? `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-' },
    { key: 'factorIntegracion', label: 'F. Integ.', render: (v: number) => v ? v.toFixed(4) : '-' },
    { key: 'tipoContrato', label: 'Tipo Contrato', render: (v: string) => v ? (
      <span style={{ display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '99px', background: v === 'BASE' ? '#f0fdf4' : '#eff6ff', color: v === 'BASE' ? '#166534' : '#1e40af', fontWeight: 600, fontSize: '0.72rem' }}>{v}</span>
    ) : '-' },
    { key: '', label: '', sortable: false, width: '60px',
      render: (_: any, row: CategoriaSalarial) => (
        <button onClick={(e) => { e.stopPropagation(); openEdit(row); }}
          style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-soft)', borderRadius: '0.35rem', background: 'white', cursor: 'pointer' }}>
          <Edit2 size={13} />
        </button>
      )
    },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={24} /> Catálogo Salarial (Sueldos)
          </h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{items.length} categorías</p>
        </div>
        <button onClick={openNew} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <Plus size={16} /> Nueva Categoría
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--brand-600)' },
          { label: 'Activas', value: stats.activos, color: '#166534' },
          { label: 'SMI Máx', value: `$${(stats.maxSMI || 0).toLocaleString()}`, color: '#8b5cf6' },
          { label: 'SMI Mín', value: `$${(stats.minSMI || 0).toLocaleString()}`, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.85rem', border: '1px solid var(--border-soft)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 560, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editing ? 'Editar' : 'Nueva'} Categoría Salarial</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {error && <div style={{ background: '#fef2f2', borderRadius: '0.5rem', padding: '0.5rem', color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem' }}><AlertTriangle size={14} />{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="field-group"><label className="field-label">Clave *</label><input value={form.clave || ''} onChange={e => setForm(f => ({...f, clave: e.target.value}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">Tipo Contrato</label>
                <select value={form.tipoContrato || 'BASE'} onChange={e => setForm(f => ({...f, tipoContrato: e.target.value}))} className="form-input">
                  <option value="BASE">BASE</option><option value="CONFIANZA">CONFIANZA</option><option value="SUSTITUTO">SUSTITUTO</option><option value="EVENTUAL">EVENTUAL</option>
                </select>
              </div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}><label className="field-label">Nombre *</label><input value={form.nombre || ''} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">S.M.I. (Salario Mínimo Integral)</label><input type="number" step="0.01" value={form.smi || ''} onChange={e => setForm(f => ({...f, smi: Number(e.target.value)}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">Factor Integración</label><input type="number" step="0.0001" value={form.factorIntegracion || 1.0} onChange={e => setForm(f => ({...f, factorIntegracion: Number(e.target.value)}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">Vigencia Inicio</label><input type="date" value={form.vigenciaInicio || ''} onChange={e => setForm(f => ({...f, vigenciaInicio: e.target.value}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">Vigencia Fin</label><input type="date" value={form.vigenciaFin || ''} onChange={e => setForm(f => ({...f, vigenciaFin: e.target.value}))} className="form-input" /></div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-soft)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}><Save size={15} /> Guardar</button>
            </div>
          </div>
        </div>
      )}

      <DataGrid columns={columns} data={items} loading={loading}
        searchFields={['clave', 'nombre', 'tipoContrato']}
        searchPlaceholder="Buscar categoría..."
        emptyMessage="No hay categorías salariales"
        exportFilename="catalogo-salarial-sicip" />
    </div>
  );
}
