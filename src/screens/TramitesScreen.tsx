import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, PlusCircle } from 'lucide-react';
import type { Usuario, Tramite } from '../types/sicip';
import { Estatus, Rol } from '../types/sicip';
import { ESTATUS_LABELS, COLOR_ESTATUS, TIPO_TRAMITE_LABELS } from '../constants/sicip';
import { formatFecha, diasRestantes as getDiasRestantes, colorPorDiasRestantes, estaVencido } from '../utils/sicip';
import { getAllTramites, getTramitesBySolicitante } from '../services/firebase';

export default function TramitesScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const navigate = useNavigate();
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<Estatus | 'TODOS'>('TODOS');

  const esAdmin = user.rol === Rol.ADMIN || user.rol === Rol.AREA_PERSONAL;

  useEffect(() => {
    const fetchTramites = async () => {
      setLoading(true);
      try {
        const data = esAdmin ? await getAllTramites(200) : await getTramitesBySolicitante(user.uid);
        setTramites(data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTramites();
  }, [user.uid, esAdmin]);

  const filtered = tramites.filter(t => {
    const matchSearch = !search ||
      t.folio?.toLowerCase().includes(search.toLowerCase()) ||
      t.trabajadorNombre?.toLowerCase().includes(search.toLowerCase()) ||
      TIPO_TRAMITE_LABELS[t.tipo]?.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtroEstatus === 'TODOS' || t.estatus === filtroEstatus;
    return matchSearch && matchFiltro;
  });

  const allStatuses: (Estatus | 'TODOS')[] = ['TODOS', Estatus.GENERADO, Estatus.PENDIENTE_ENTREGA, Estatus.RECIBIDO, Estatus.EN_REVISION, Estatus.VALIDADO, Estatus.OBSERVADO, Estatus.DEVUELTO, Estatus.RECHAZADO, Estatus.ENVIADO_DELEGACION, Estatus.PENDIENTE_PAGO, Estatus.CONCLUIDO, Estatus.VENCIDO];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--brand-200)', borderTopColor: 'var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
            {esAdmin ? 'Todos los Trámites' : 'Mis Trámites'}
          </h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {filtered.length} de {tramites.length} trámites
          </p>
        </div>
        {user.rol !== Rol.AREA_PERSONAL && (
          <button onClick={() => navigate('/nuevo-tramite')} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem' }}>
            <PlusCircle size={17} /> Nueva Solicitud
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar folio, nombre o tipo..."
            style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1px solid var(--border-soft)', borderRadius: '0.65rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>
        <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value as any)} style={{ padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.65rem', fontSize: '0.875rem' }}>
          {allStatuses.map(s => (
            <option key={s} value={s}>{s === 'TODOS' ? 'Todos los estados' : ESTATUS_LABELS[s as Estatus]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--surface-soft)' }}>
              {['Folio', 'Tipo', 'Trabajador', 'Fecha', 'Estado', 'Vence', ''].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const dLeft = t.fechaLimiteEntrega ? getDiasRestantes(t.fechaLimiteEntrega) : null;
              const vencido = dLeft !== null && estaVencido(t.fechaLimiteEntrega);
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }} onClick={() => navigate(`/tramites/${t.id}`)}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700 }}>{t.folio}</td>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{TIPO_TRAMITE_LABELS[t.tipo] || t.tipo}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{t.trabajadorNombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatFecha(t.fechaCreacion)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: COLOR_ESTATUS[t.estatus] + '22', color: COLOR_ESTATUS[t.estatus], padding: '0.2rem 0.55rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                      {ESTATUS_LABELS[t.estatus]}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {dLeft !== null ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colorPorDiasRestantes(dLeft) }}>
                        {vencido ? `${Math.abs(dLeft)}d venc` : `${dLeft}d`}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--brand-500)' }}><ChevronRight size={16} /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sin trámites que mostrar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
