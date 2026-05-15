// ============================================================
// SICIP — Submódulo: Catálogo Documental (tipos documentales)
// ============================================================

import React, { useState, useEffect } from 'react';
import { getTiposDocumentales, guardarTipoDocumental, actualizarTipoDocumental, TipoDocumental } from '../../services/firebase-modules';
import DataGrid from '../../components/shared/DataGrid';
import { Plus, Save, X, Edit2, AlertTriangle } from 'lucide-react';

const CATEGORIAS = ['INCAPACIDAD', 'LICENCIA', 'CONTRATO', 'NOMINA', 'PERSONAL', 'PRESTACIONES', 'JUBILACION', 'OTRO'];

const defaultForm: Partial<TipoDocumental> = { activo: true, requiereFirma: false, requiereSello: false };

export default function CatalogosDocScreen() {
  const [items, setItems] = useState<TipoDocumental[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TipoDocumental | null>(null);
  const [form, setForm] = useState<Partial<TipoDocumental>>({...defaultForm});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTiposDocumentales().then(data => { setItems(data); setLoading(false); });
  }, []);

  const resetForm = () => { setForm({...defaultForm}); setEditing(null); setError(null); };
  const openNew = () => { resetForm(); setForm({...defaultForm, clave: `DOC-${String(items.length + 1).padStart(2, '0')}`}); setShowForm(true); };
  const openEdit = (item: TipoDocumental) => { setEditing(item); setForm({...item}); setShowForm(true); };

  const handleSave = async () => {
    if (!form.clave || !form.nombre) { setError('Clave y nombre son obligatorios'); return; }
    setSaving(true); setError(null);
    try {
      if (editing?.id) await actualizarTipoDocumental(editing.id, form as TipoDocumental);
      else await guardarTipoDocumental(form as TipoDocumental);
      getTiposDocumentales().then(setItems);
      resetForm(); setShowForm(false);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'clave', label: 'Clave' },
    { key: 'nombre', label: 'Nombre', width: '280px' },
    { key: 'categoria', label: 'Categoría', render: (v: string) => v ? <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>{v}</span> : '-' },
    { key: 'descripcion', label: 'Descripción', width: '250px' },
    { key: 'requiereFirma', label: 'Firma', render: (v: boolean) => v ? '✓' : '—' },
    { key: 'requiereSello', label: 'Sello', render: (v: boolean) => v ? '✓' : '—' },
    { key: 'diasVigencia', label: 'Vigencia', render: (v: number) => v ? `${v} días` : '-' },
    { key: '', label: '', sortable: false, width: '60px',
      render: (_: any, row: TipoDocumental) => (
        <button onClick={(e) => { e.stopPropagation(); openEdit(row); }}
          style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-soft)', borderRadius: '0.35rem', background: 'white', cursor: 'pointer' }}>
          <Edit2 size={13} />
        </button>
      )
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Tipos Documentales</h2>
          <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{items.length} tipos registrados</p>
        </div>
        <button onClick={openNew} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
          <Plus size={14} /> Nuevo Tipo
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 560, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{editing ? 'Editar' : 'Nuevo'} Tipo Documental</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {error && <div style={{ background: '#fef2f2', borderRadius: '0.5rem', padding: '0.5rem', color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertTriangle size={14} />{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="field-group"><label className="field-label">Clave *</label><input value={form.clave || ''} onChange={e => setForm(f => ({...f, clave: e.target.value}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">Categoría</label><select value={form.categoria || 'OTRO'} onChange={e => setForm(f => ({...f, categoria: e.target.value}))} className="form-input">{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}><label className="field-label">Nombre *</label><input value={form.nombre || ''} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className="form-input" /></div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}><label className="field-label">Descripción</label><textarea value={form.descripcion || ''} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} className="form-input" rows={2} /></div>
              <div className="field-group"><label className="field-label">Días Vigencia</label><input type="number" value={form.diasVigencia || ''} onChange={e => setForm(f => ({...f, diasVigencia: Number(e.target.value)}))} className="form-input" /></div>
              <div className="field-group"><label className="field-label">Formato</label><input value={form.formato || ''} onChange={e => setForm(f => ({...f, formato: e.target.value}))} className="form-input" /></div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.requiereFirma || false} onChange={e => setForm(f => ({...f, requiereFirma: e.target.checked}))} /> Requiere Firma
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.requiereSello || false} onChange={e => setForm(f => ({...f, requiereSello: e.target.checked}))} /> Requiere Sello
                </label>
              </div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-soft)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}><Save size={15} /> Guardar</button>
            </div>
          </div>
        </div>
      )}

      <DataGrid columns={columns} data={items} loading={loading}
        searchFields={['clave', 'nombre', 'categoria', 'descripcion']}
        searchPlaceholder="Buscar tipo documental..."
        emptyMessage="No hay tipos documentales registrados"
        exportFilename="catalogo-documental-sicip" />
    </>
  );
}
