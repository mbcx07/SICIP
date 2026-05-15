// ============================================================
// SICIP — Módulo: Calendario Laboral
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  getCalendario, guardarDiaCalendario, actualizarDiaCalendario,
  generarCalendario, watchCalendario,
  CalendarioLaboral
} from '../../services/firebase-modules';
import DataGrid from '../../components/shared/DataGrid';
import { Calendar, Plus, Save, AlertTriangle, Sun, Moon, Coffee, X } from 'lucide-react';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const TIPO_DIA_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LABORAL: { label: 'Laboral', color: '#166534', bg: '#f0fdf4' },
  INHABIL: { label: 'Inhábil', color: '#991b1b', bg: '#fef2f2' },
  FESTIVO: { label: 'Festivo', color: '#92400e', bg: '#fffbeb' },
  PUENTE: { label: 'Puente', color: '#6b21a8', bg: '#faf5ff' },
  SUSPENSION: { label: 'Suspensión', color: '#1e40af', bg: '#eff6ff' },
};

export default function CalendarioScreen() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [calendario, setCalendario] = useState<CalendarioLaboral[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarioLaboral | null>(null);
  const [editForm, setEditForm] = useState<Partial<CalendarioLaboral>>({});

  useEffect(() => {
    const unsub = watchCalendario(year, items => {
      setCalendario(items);
      setLoading(false);
    });
    return () => unsub();
  }, [year]);

  const monthDays = useMemo(() => {
    return calendario.filter(d => d.mes === month);
  }, [calendario, month]);

  const stats = useMemo(() => {
    const total = monthDays.length;
    const laborales = monthDays.filter(d => d.tipo === 'LABORAL').length;
    const inhabiles = monthDays.filter(d => d.tipo === 'INHABIL').length;
    const festivos = monthDays.filter(d => d.tipo === 'FESTIVO' || d.tipo === 'PUENTE').length;
    const suspensiones = monthDays.filter(d => d.tipo === 'SUSPENSION').length;
    return { total, laborales, inhabiles, festivos, suspensiones };
  }, [monthDays]);

  const handleGenerate = async () => {
    if (!confirm(`¿Generar calendario completo para ${year}?`)) return;
    setGenerating(true);
    try {
      const count = await generarCalendario(year);
      alert(`Calendario ${year} generado: ${count} días`);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = (day: CalendarioLaboral) => {
    setSelectedDay(day);
    setEditForm({ ...day });
  };

  const saveEdit = async () => {
    if (!selectedDay?.id || !editForm) return;
    await actualizarDiaCalendario(selectedDay.id, editForm);
    setSelectedDay(null);
    setEditForm({});
  };

  const getDayContent = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = monthDays.find(d => d.fecha === dateStr);
    if (!dayData && !editMode) return null;
    const config = dayData ? TIPO_DIA_CONFIG[dayData.tipo] : TIPO_DIA_CONFIG.LABORAL;
    return { data: dayData, config };
  };

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={24} /> Calendario Laboral
          </h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {calendario.length > 0 ? `${calendario.length} días registrados` : 'Sin datos'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={year} onChange={e => { setYear(Number(e.target.value)); setMonth(1); }}
            className="form-input" style={{ width: 100, fontSize: '0.85rem' }}>
            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setEditMode(!editMode)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem',
              background: editMode ? 'var(--brand-600)' : 'white',
              color: editMode ? 'white' : 'var(--text-muted)',
              border: '1px solid var(--border-soft)', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.82rem'
            }}>
            {editMode ? 'Editar ✓' : 'Editar'}
          </button>
          {calendario.length === 0 && (
            <button onClick={handleGenerate} disabled={generating} className="btn-institutional"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
              <Plus size={16} /> {generating ? 'Generando...' : `Generar ${year}`}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--brand-700)' },
          { label: 'Laborales', value: stats.laborales, color: '#166534' },
          { label: 'Inhábiles', value: stats.inhabiles, color: '#dc2626' },
          { label: 'Festivos', value: stats.festivos, color: '#d97706' },
          { label: 'Suspensiones', value: stats.suspensiones, color: '#2563eb' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', border: '1px solid var(--border-soft)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Month selector */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {MESES.map((m, i) => (
          <button key={i} onClick={() => setMonth(i + 1)}
            style={{
              padding: '0.35rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--border-soft)',
              background: month === i + 1 ? 'var(--brand-600)' : 'white',
              color: month === i + 1 ? 'white' : 'var(--text-muted)',
              fontWeight: month === i + 1 ? 700 : 500, fontSize: '0.75rem', cursor: 'pointer'
            }}>
            {m.substring(0, 3)}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        background: 'white', borderRadius: '1rem', border: '1px solid var(--border-soft)',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-soft)', fontWeight: 700, fontSize: '1rem' }}>
          {MESES[month - 1]} {year}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DIAS.map(d => (
            <div key={d} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)', background: '#f8faf8' }}>
              {d}
            </div>
          ))}
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ padding: '0.5rem', minHeight: 70, background: '#f9fbf9' }} />
          ))}
          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const info = getDayContent(day);
            const config = info?.config;
            const data = info?.data;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() + 1 && year === new Date().getFullYear();

            return (
              <div key={day}
                onClick={() => editMode && data && openEdit(data)}
                style={{
                  padding: '0.35rem', minHeight: 70, borderBottom: '1px solid var(--border-soft)',
                  borderRight: '1px solid var(--border-soft)', cursor: editMode && data ? 'pointer' : 'default',
                  background: config?.bg || '#f9fbf9',
                  position: 'relative', transition: 'background 0.15s',
                }}
              >
                <div style={{
                  fontWeight: isToday ? 800 : 600, fontSize: '0.8rem',
                  color: config?.color || (day > 28 ? '#999' : '#333'),
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  marginBottom: '0.2rem'
                }}>
                  {day}
                  {isToday && <span style={{ fontSize: '0.55rem', background: 'var(--brand-600)', color: 'white', borderRadius: '99px', padding: '0.05rem 0.3rem', fontWeight: 700 }}>HOY</span>}
                </div>
                {config && (
                  <div style={{
                    fontSize: '0.6rem', color: config.color, fontWeight: 600,
                    background: config.color + '15', borderRadius: '0.25rem',
                    padding: '0.1rem 0.3rem', display: 'inline-block',
                    marginBottom: '0.15rem'
                  }}>
                    {config.label}
                  </div>
                )}
                {data?.descripcion && data.tipo !== 'LABORAL' && (
                  <div style={{ fontSize: '0.55rem', color: '#666', marginTop: '0.1rem', lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {data.descripcion.substring(0, 25)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {selectedDay && editForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 480, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Editar: {selectedDay.fecha}</h3>
              <button onClick={() => setSelectedDay(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="field-group">
                <label className="field-label">Tipo de Día</label>
                <select value={editForm.tipo || 'LABORAL'} onChange={e => setEditForm(f => ({...f, tipo: e.target.value as any}))} className="form-input">
                  {Object.entries(TIPO_DIA_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Descripción</label>
                <input value={editForm.descripcion || ''} onChange={e => setEditForm(f => ({...f, descripcion: e.target.value}))} className="form-input" placeholder="Motivo del día inhábil" />
              </div>
              <div className="field-group">
                <label className="field-label">Aplica a</label>
                <select value={editForm.aplicaA || 'TODOS'} onChange={e => setEditForm(f => ({...f, aplicaA: e.target.value as any}))} className="form-input">
                  <option value="TODOS">Todos</option>
                  <option value="CONFIANZA">Personal de Confianza</option>
                  <option value="BASE">Personal de Base</option>
                  <option value="HOSPITAL">Hospital</option>
                  <option value="UMF">UMF</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedDay(null)}
                style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-soft)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={saveEdit} className="btn-institutional"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
                <Save size={15} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
        {Object.values(TIPO_DIA_CONFIG).map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '3px', background: c.bg, border: `2px solid ${c.color}` }} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}
