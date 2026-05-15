// ============================================================
// SICIP — Módulo: Catálogo de Puestos (CATEHOR)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { watchPuestos, guardarPuesto, actualizarPuesto, Puesto } from '../../services/firebase-modules';
import DataGrid from '../../components/shared/DataGrid';
import { Briefcase, Plus, Save, X, Edit2, AlertTriangle, Clock } from 'lucide-react';

const defaultForm: Partial<Puesto> = { activo: true, horario: { entrada: '08:00', salida: '16:00' }, tipo: 'OTRO' };

export default function PuestosScreen() {
  const [items, setItems] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Puesto | null>(null);
  const [form, setForm] = useState<Partial<Puesto>>({...defaultForm});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchPuestos(items => { setItems(items); setLoading(false); });
    return () => unsub();
  }, []);

  const tipos = useMemo(() => [...new Set(items.map(i => i.tipo).filter(Boolean))].sort(), [items]);

  const resetForm = () => { setForm({...defaultForm}); setEditing(null); setError(null); };
  const openNew = () => { resetForm(); setForm({...defaultForm}); setShowForm(true); };
  const openEdit = (item: Puesto) => { setEditing(item); setForm({...item}); setShowForm(true); };

  const handleSave = async () => {
    if (!form.clave || !form.nombre) { setError('Clave y nombre son obligatorios'); return; }
    setSaving(true); setError(null);
    try {
      if (editing?.id) await actualizarPuesto(editing.id, form as Puesto);
      else await guardarPuesto(form as Puesto);
      resetForm(); setShowForm(false);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'clave', label: 'Clave' },
    { key: 'nombre', label: 'Puesto', width: '280px' },
    { key: 'descripcion', label: 'Descripción', width: '200px' },
    { key: 'tipo', label: 'Tipo', render: (v: string) => v ? <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>{v}</span> : '-' },
    { key: 'nivel', label: 'Nivel' },
    { key: 'horario', label: 'Horario', render: (v: { entrada?: string; salida?: string; descanso?: string }) => v ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
        <Clock size={13} /> {v.entrada || '?'} - {v.salida || '?'}{v.descanso ? ` (${v.descanso})` : ''}
      </span>
    ) : '-' },
    { key: '', label: '', sortable: false, width: '60px',
      render: (_: any, row: Puesto) => (
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
            <Briefcase size={24} /> Catálogo de Puestos (CATEHOR)
          </h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{items.length} puestos</p>
        </div>
        <button onClick={openNew} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <Plus size={16} /> Nuevo Puesto
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 560, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editing ? 'Editar' : 'Nuevo'} Puesto</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {error && <div style={{ background: '#fef2f2', borderRadius: '0.5rem', padding: '0.5rem', color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem' }}><AlertTriangle size={14} />{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="field-group"><label className="field-label">Clave *</label><input value={form.clave || ''} onChange={e => setForm(f => ({...f, clave: e.target.value}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">Tipo</label>
                <select value={form.tipo || 'OTRO'} onChange={e => setForm(f => ({...f, tipo: e.target.value}))} className="form-input">
                  {['ENFERMERA','MEDICO','ADMINISTRATIVO','QUIMICO','TRABAJO_SOCIAL','MANTENIMIENTO','INTENDENCIA','SEGURIDAD','OTRO'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}><label className="field-label">Nombre *</label><input value={form.nombre || ''} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className="form-input" /></div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}><label className="field-label">Descripción</label><textarea value={form.descripcion || ''} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} className="form-input" rows={2} /></div>
              <div className="field-group"><label className="field-label">Nivel</label><input value={form.nivel || ''} onChange={e => setForm(f => ({...f, nivel: e.target.value}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">Categoría (SMI ref)</label><input value={form.categoriaClave || ''} onChange={e => setForm(f => ({...f, categoriaClave: e.target.value}))} className="form-input" placeholder="CAT-0001" /></div>
              <div className="field-group" style={{ gridColumn: '1/2' }}><label className="field-label">Horario Entrada</label><input type="time" value={form.horario?.entrada || '08:00'} onChange={e => setForm(f => ({...f, horario: {...f.horario!, entrada: e.target.value}}))} className="form-input" /></div>
              <div className="field-group" style={{ gridColumn: '2/2' }}><label className="field-label">Horario Salida</label><input type="time" value={form.horario?.salida || '16:00'} onChange={e => setForm(f => ({...f, horario: {...f.horario!, salida: e.target.value}}))} className="form-input" /></div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}><label className="field-label">Descanso</label><input value={form.horario?.descanso || ''} onChange={e => setForm(f => ({...f, horario: {...f.horario!, descanso: e.target.value}}))} className="form-input" placeholder="Ej. 1.5 HRS ACT INV Y CAP" /></div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-soft)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}><Save size={15} /> Guardar</button>
            </div>
          </div>
        </div>
      )}

      <DataGrid columns={columns} data={items} loading={loading}
        searchFields={['clave', 'nombre', 'descripcion', 'tipo']}
        searchPlaceholder="Buscar puesto..."
        emptyMessage="No hay puestos registrados"
        exportFilename="catalogo-puestos-sicip" />
    </div>
  );
}
