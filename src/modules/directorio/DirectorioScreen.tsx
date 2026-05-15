// ============================================================
// SICIP — Módulo: Directorio de Personal (desde trabajadores)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { watchTrabajadores, getAreasFromTrabajadores } from '../../services/firebase-modules';
import DataGrid from '../../components/shared/DataGrid';
import { Users, Search, Filter, MapPin, Building2, Briefcase, Hash, ChevronDown } from 'lucide-react';

export default function DirectorioScreen() {
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<string[]>([]);
  const [filterArea, setFilterArea] = useState<string>('TODAS');
  const [filterTipoContrato, setFilterTipoContrato] = useState<string>('TODOS');
  const [stats, setStats] = useState({ total: 0, areas: 0, tiposContrato: 0, localidades: 0 });

  useEffect(() => {
    const unsub = watchTrabajadores(items => {
      setTrabajadores(items);
      setStats({
        total: items.length,
        areas: new Set(items.map(t => t.area).filter(Boolean)).size,
        tiposContrato: new Set(items.map(t => t.tipoContrato).filter(Boolean)).size,
        localidades: new Set(items.map(t => t.localidad).filter(Boolean)).size,
      });
      setLoading(false);
    });

    getAreasFromTrabajadores().then(setAreas);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let result = trabajadores;
    if (filterArea !== 'TODAS') result = result.filter(t => t.area === filterArea || t.unidadNombre === filterArea);
    if (filterTipoContrato !== 'TODOS') result = result.filter(t => t.tipoContrato === filterTipoContrato);
    return result;
  }, [trabajadores, filterArea, filterTipoContrato]);

  const tiposContrato = useMemo(() => 
    [...new Set(trabajadores.map(t => t.tipoContrato).filter(Boolean))].sort() as string[],
  [trabajadores]);

  const columns = [
    { key: 'matricula', label: 'Matrícula' },
    { key: 'nombre', label: 'Nombre', width: '280px' },
    { key: 'area', label: 'Área', width: '200px' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'tipoContrato', label: 'Contrato', render: (v: string) => v ? (
      <span style={{
        display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '99px',
        background: v === 'BASE' ? '#f0fdf4' : v === 'CONFIANZA' ? '#eff6ff' : '#faf5ff',
        color: v === 'BASE' ? '#166534' : v === 'CONFIANZA' ? '#1e40af' : '#6b21a8',
        fontWeight: 600, fontSize: '0.72rem'
      }}>{v}</span>
    ) : '-' },
    { key: 'unidadNombre', label: 'Unidad', width: '200px' },
    { key: 'localidad', label: 'Localidad' },
    { key: 'tp', label: 'TP' },
    { key: 'descripcion', label: 'Descripción', width: '200px' },
    { key: 'departamentoNombre', label: 'Depto.' },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} /> Directorio de Personal
          </h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {stats.total} trabajadores · {stats.areas} áreas · {stats.localidades} localidades
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { icon: <Users size={18} />, label: 'Total', value: stats.total, color: 'var(--brand-600)' },
          { icon: <Building2 size={18} />, label: 'Áreas', value: stats.areas, color: '#8b5cf6' },
          { icon: <Briefcase size={18} />, label: 'Contratos', value: stats.tiposContrato, color: '#f59e0b' },
          { icon: <MapPin size={18} />, label: 'Localidades', value: stats.localidades, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.85rem', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Filter size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
            style={{ padding: '0.45rem 0.5rem 0.45rem 2rem', border: '1px solid var(--border-soft)', borderRadius: '0.5rem', fontSize: '0.82rem', background: 'white', width: 220, outline: 'none', appearance: 'none' }}>
            <option value="TODAS">Todas las áreas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <select value={filterTipoContrato} onChange={e => setFilterTipoContrato(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.5rem', fontSize: '0.82rem', background: 'white', outline: 'none' }}>
          <option value="TODOS">Todos los contratos</option>
          {tiposContrato.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Mostrando {filtered.length} de {trabajadores.length}
        </div>
      </div>

      <DataGrid columns={columns} data={filtered} loading={loading}
        searchFields={['matricula', 'nombre', 'area', 'categoria', 'descripcion']}
        searchPlaceholder="Buscar por nombre, matrícula, área..."
        emptyMessage="No se encontraron trabajadores"
        exportFilename="directorio-personal-sicip" />
    </div>
  );
}
