// ============================================================
// SICIP — Módulo: Correspondencia
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  getCorrespondencia, guardarCorrespondencia, actualizarCorrespondencia,
  eliminarCorrespondencia, generateFolio, watchCorrespondencia,
  Correspondencia
} from '../../services/firebase-modules';
import DataGrid from '../../components/shared/DataGrid';
import {
  Mail, Plus, Search, X, Save, FileText, Eye, Archive,
  Clock, CheckCircle, Send, AlertTriangle, Trash2, Download
} from 'lucide-react';

const ESTATUS_CONFIG: Record<string, { label: string; color: string }> = {
  RECIBIDO: { label: 'Recibido', color: '#3b82f6' },
  TURNADO: { label: 'Turnado', color: '#f59e0b' },
  EN_ATENCION: { label: 'En Atención', color: '#8b5cf6' },
  ATENDIDO: { label: 'Atendido', color: '#10b981' },
  ARCHIVADO: { label: 'Archivado', color: '#6b7280' },
};

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  BAJA: { label: 'Baja', color: '#10b981' },
  MEDIA: { label: 'Media', color: '#f59e0b' },
  ALTA: { label: 'Alta', color: '#ef4444' },
  URGENTE: { label: 'Urgente', color: '#dc2626' },
};

const TIPOS_DOC = ['OFICIO', 'CIRCULAR', 'MEMORANDUM', 'CONVENIO', 'ACUERDO', 'INFORME', 'OTRO'];

const defaultForm: Partial<Correspondencia> = {
  tipoDocumento: 'OFICIO',
  prioridad: 'MEDIA',
  estatus: 'RECIBIDO',
  archivosUrls: [],
};

export default function CorrespondenciaScreen() {
  const [items, setItems] = useState<Correspondencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Correspondencia | null>(null);
  const [form, setForm] = useState<Partial<Correspondencia>>({...defaultForm});
  const [saving, setSaving] = useState(false);
  const [filterEstatus, setFilterEstatus] = useState<string>('TODOS');
  const [detail, setDetail] = useState<Correspondencia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchCorrespondencia(items => {
      setItems(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm({...defaultForm});
    setEditing(null);
    setError(null);
  };

  const openNew = () => {
    resetForm();
    setForm({...defaultForm, folio: generateFolio('SICIP-CORR')});
    setShowForm(true);
    setDetail(null);
  };

  const openEdit = (item: Correspondencia) => {
    setEditing(item);
    setForm({...item});
    setShowForm(true);
    setDetail(null);
  };

  const handleChange = (field: string, value: any) => {
    setForm(f => ({...f, [field]: value}));
  };

  const handleSave = async () => {
    if (!form.folio || !form.remitente || !form.asunto) {
      setError('Folio, remitente y asunto son obligatorios');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing?.id) {
        await actualizarCorrespondencia(editing.id, form as Correspondencia);
      } else {
        await guardarCorrespondencia(form as Correspondencia);
      }
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Correspondencia) => {
    if (!confirm(`¿Archivar oficio ${item.folio}?`)) return;
    if (item.id) await eliminarCorrespondencia(item.id);
  };

  const filtered = filterEstatus === 'TODOS' ? items : items.filter(i => i.estatus === filterEstatus);

  const columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'fechaOficio', label: 'Fecha Of.' },
    { key: 'tipoDocumento', label: 'Tipo' },
    { key: 'remitente', label: 'Remitente' },
    { key: 'asunto', label: 'Asunto', width: '300px' },
    { key: 'prioridad', label: 'Prioridad', render: (v: string) => v ? (
      <span style={{ color: PRIORIDAD_CONFIG[v]?.color, fontWeight: 600, fontSize: '0.75rem' }}>{PRIORIDAD_CONFIG[v]?.label}</span>
    ) : '-' },
    { key: 'estatus', label: 'Estatus', render: (v: string) => v ? (
      <span style={{
        display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '99px',
        background: (ESTATUS_CONFIG[v]?.color || '#999') + '20',
        color: ESTATUS_CONFIG[v]?.color || '#666',
        fontWeight: 600, fontSize: '0.75rem'
      }}>{ESTATUS_CONFIG[v]?.label}</span>
    ) : '-' },
    { key: 'acciones', label: 'Acciones', sortable: false, width: '100px',
      render: (_: any, row: Correspondencia) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button onClick={(e) => { e.stopPropagation(); setDetail(row); }}
            title="Ver detalle"
            style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-soft)', borderRadius: '0.35rem', background: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>
            <Eye size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            title="Editar estatus"
            style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-soft)', borderRadius: '0.35rem', background: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>
            <FileText size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            title="Archivar"
            style={{ padding: '0.25rem 0.5rem', border: '1px solid #fee2e2', borderRadius: '0.35rem', background: 'white', cursor: 'pointer', fontSize: '0.75rem', color: '#dc2626' }}>
            <Archive size={14} />
          </button>
        </div>
      )
    },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={24} /> Captura de Correspondencia
          </h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {filtered.length} oficios registrados
          </p>
        </div>
        <button onClick={openNew} className="btn-institutional"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem' }}>
          <Plus size={18} /> Nuevo Oficio
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['TODOS', ...Object.keys(ESTATUS_CONFIG)].map(est => (
          <button key={est} onClick={() => setFilterEstatus(est)}
            style={{
              padding: '0.4rem 0.85rem', borderRadius: '99px', border: '1px solid var(--border-soft)',
              background: filterEstatus === est ? 'var(--brand-600)' : 'white',
              color: filterEstatus === est ? 'white' : 'var(--text-muted)',
              fontWeight: filterEstatus === est ? 700 : 500, fontSize: '0.78rem',
              cursor: 'pointer'
            }}>
            {est === 'TODOS' ? 'Todos' : ESTATUS_CONFIG[est]?.label}
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      {detail && (
        <div style={{
          background: 'white', borderRadius: '1rem', border: '1px solid var(--border-soft)',
          padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Detalle: {detail.folio}</h3>
            <button onClick={() => setDetail(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
            {[
              ['Tipo', detail.tipoDocumento],
              ['Prioridad', PRIORIDAD_CONFIG[detail.prioridad]?.label],
              ['Estatus', ESTATUS_CONFIG[detail.estatus]?.label],
              ['Fecha Oficio', detail.fechaOficio],
              ['Fecha Recepción', detail.fechaRecepcion],
              ['Remitente', detail.remitente],
              ['Destinatario', detail.destinatario],
              ['Área Origen', detail.areaOrigen],
              ['Asunto', detail.asunto],
              [detail.turnadoA ? 'Turnado A' : '', detail.turnadoA || ''],
              [detail.observaciones ? 'Observaciones' : '', detail.observaciones || ''],
            ].filter(([l]) => l).map(([label, value]) => (
              <div key={String(label)}>
                <div style={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{label}</div>
                <div>{value || '-'}</div>
              </div>
            ))}
          </div>
          {/* Quick status actions */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            {detail.estatus === 'RECIBIDO' && (
              <button onClick={() => { handleFieldChange(detail.id, 'estatus', 'TURNADO'); setDetail({...detail, estatus: 'TURNADO'}); }}
                className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                <Send size={14} /> Turnar
              </button>
            )}
            {detail.estatus === 'TURNADO' && (
              <button onClick={() => { handleFieldChange(detail.id, 'estatus', 'EN_ATENCION'); setDetail({...detail, estatus: 'EN_ATENCION'}); }}
                className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                <Clock size={14} /> Iniciar Atención
              </button>
            )}
            {detail.estatus === 'EN_ATENCION' && (
              <button onClick={() => { handleFieldChange(detail.id, 'estatus', 'ATENDIDO', { fechaAtencion: new Date().toISOString().split('T')[0] }); setDetail({...detail, estatus: 'ATENDIDO'}); }}
                className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                <CheckCircle size={14} /> Marcar Atendido
              </button>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {editing ? `Editar: ${editing.folio}` : 'Nuevo Oficio'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.65rem 1rem', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="field-group">
                <label className="field-label">Folio *</label>
                <input value={form.folio || ''} onChange={e => handleChange('folio', e.target.value)} className="form-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Tipo Documento</label>
                <select value={form.tipoDocumento || 'OFICIO'} onChange={e => handleChange('tipoDocumento', e.target.value)} className="form-input">
                  {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Fecha del Oficio *</label>
                <input type="date" value={form.fechaOficio || ''} onChange={e => handleChange('fechaOficio', e.target.value)} className="form-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Fecha de Recepción</label>
                <input type="date" value={form.fechaRecepcion || new Date().toISOString().split('T')[0]} onChange={e => handleChange('fechaRecepcion', e.target.value)} className="form-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Remitente *</label>
                <input value={form.remitente || ''} onChange={e => handleChange('remitente', e.target.value)} className="form-input" placeholder="¿Quién envía?" />
              </div>
              <div className="field-group">
                <label className="field-label">Destinatario</label>
                <input value={form.destinatario || ''} onChange={e => handleChange('destinatario', e.target.value)} className="form-input" placeholder="¿Para quién?" />
              </div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}>
                <label className="field-label">Asunto *</label>
                <input value={form.asunto || ''} onChange={e => handleChange('asunto', e.target.value)} className="form-input" placeholder="Asunto del oficio" />
              </div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}>
                <label className="field-label">Descripción</label>
                <textarea value={form.descripcion || ''} onChange={e => handleChange('descripcion', e.target.value)} className="form-input" rows={3} placeholder="Detalles adicionales..." />
              </div>
              <div className="field-group">
                <label className="field-label">Área de Origen</label>
                <input value={form.areaOrigen || ''} onChange={e => handleChange('areaOrigen', e.target.value)} className="form-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Prioridad</label>
                <select value={form.prioridad || 'MEDIA'} onChange={e => handleChange('prioridad', e.target.value)} className="form-input">
                  {Object.entries(PRIORIDAD_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Estatus</label>
                <select value={form.estatus || 'RECIBIDO'} onChange={e => handleChange('estatus', e.target.value)} className="form-input">
                  {Object.entries(ESTATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Turnado A</label>
                <input value={form.turnadoA || ''} onChange={e => handleChange('turnadoA', e.target.value)} className="form-input" />
              </div>
              <div className="field-group" style={{ gridColumn: '1/-1' }}>
                <label className="field-label">Observaciones</label>
                <textarea value={form.observaciones || ''} onChange={e => handleChange('observaciones', e.target.value)} className="form-input" rows={2} />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); resetForm(); }}
                style={{ padding: '0.6rem 1.25rem', border: '1px solid var(--border-soft)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-institutional"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem' }}>
                <Save size={16} /> {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        data={filtered}
        loading={loading}
        searchFields={['folio', 'remitente', 'asunto', 'destinatario']}
        searchPlaceholder="Buscar oficio..."
        onRowClick={row => setDetail(row)}
        emptyMessage="No hay oficios registrados"
        exportFilename="correspondencia-sicip"
      />
    </div>
  );
}

// Helper for inline status updates
async function handleFieldChange(id: string | undefined, field: string, value: any, extra?: Record<string, any>) {
  if (!id) return;
  await actualizarCorrespondencia(id, { [field]: value, ...extra } as any);
}
