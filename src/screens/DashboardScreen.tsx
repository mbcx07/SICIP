import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, PlusCircle, FileText, TrendingUp } from 'lucide-react';
import type { Usuario, Tramite } from '../types/sicip';
import { Estatus, Rol } from '../types/sicip';
import { ESTATUS_LABELS, COLOR_ESTATUS, TIPO_TRAMITE_LABELS } from '../constants/sicip';
import { formatFecha, diasRestantes as getDiasRestantes, colorPorDiasRestantes, estaVencido } from '../utils/sicip';
import { getAllTramites, getTramitesBySolicitante } from '../services/firebase';
import BarChart from '../components/BarChart';

export default function DashboardScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const navigate = useNavigate();
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAllTramites(200);
        setTramites(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const porEstatus: Record<string, number> = {};
  const porTipo: Record<string, number> = {};
  let vencidos = 0;
  let proximosVencer = 0;
  let concluidos = 0;

  tramites.forEach(t => {
    porEstatus[t.estatus] = (porEstatus[t.estatus] || 0) + 1;
    porTipo[t.tipo] = (porTipo[t.tipo] || 0) + 1;
    if (t.fechaLimiteEntrega && t.estatus !== Estatus.CONCLUIDO) {
      if (estaVencido(t.fechaLimiteEntrega)) vencidos++;
      else if (getDiasRestantes(t.fechaLimiteEntrega) <= 3) proximosVencer++;
    }
    if (t.estatus === Estatus.CONCLUIDO) concluidos++;
  });

  const recientes = tramites
    .filter(t => t.solicitanteUid === user.uid)
    .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
    .slice(0, 5);

  const vencidosList = tramites
    .filter(t => t.fechaLimiteEntrega && estaVencido(t.fechaLimiteEntrega) && t.estatus !== Estatus.CONCLUIDO)
    .sort((a, b) => new Date(a.fechaLimiteEntrega!).getTime() - new Date(b.fechaLimiteEntrega!).getTime())
    .slice(0, 5);

  const esAdmin = user.rol === Rol.ADMIN || user.rol === Rol.AREA_PERSONAL;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--brand-200)', borderTopColor: 'var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Bienvenido, {user.nombre?.split(' ')[0]}</h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {esAdmin ? `${tramites.length} trámites registrados` : `${recientes.length} solicitudes realizadas`}
          </p>
        </div>
        {user.rol !== Rol.AREA_PERSONAL && (
          <button onClick={() => navigate('/nuevo-tramite')} className="btn-institutional" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem' }}>
            <PlusCircle size={17} /> Nueva Solicitud
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total', value: tramites.length, icon: <FileText size={20} />, color: 'var(--brand-600)', bg: 'var(--brand-50)' },
          { label: 'Concluidos', value: concluidos, icon: <CheckCircle2 size={20} />, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Vencidos', value: vencidos, icon: <AlertTriangle size={20} />, color: '#dc2626', bg: '#fef2f2' },
          { label: 'x Vencer', value: proximosVencer, icon: <Clock size={20} />, color: '#d97706', bg: '#fffbeb' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Por estatus */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={14} /> Por Estatus
          </h3>
          <BarChart data={Object.entries(porEstatus).map(([k, v]) => ({
            label: ESTATUS_LABELS[k as Estatus] || k,
            value: v,
            color: COLOR_ESTATUS[k as Estatus] || '#94a3b8',
          }))} />
        </div>

        {/* Por tipo */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={14} /> Por Tipo
          </h3>
          <BarChart data={Object.entries(porTipo).sort(([,a],[,b]) => Number(b)-Number(a)).slice(0, 8).map(([k, v]) => ({
            label: TIPO_TRAMITE_LABELS[k as any] || k,
            value: v,
          }))} />
        </div>
      </div>

      {/* Vencidos (admin) */}
      {esAdmin && vencidosList.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '1rem', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={14} /> Trámites Vencidos ({vencidos})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {vencidosList.map(t => (
              <div key={t.id} onClick={() => navigate(`/tramites/${t.id}`)} style={{ background: 'white', borderRadius: '0.6rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid #fecaca' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>{t.folio}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.trabajadorNombre} · {TIPO_TRAMITE_LABELS[t.tipo]}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626' }}>{Math.abs(getDiasRestantes(t.fechaLimiteEntrega!))}d venc</div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mis recientes */}
      {!esAdmin && recientes.length > 0 && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mis Solicitudes Recientes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recientes.map(t => (
              <div key={t.id} onClick={() => navigate(`/tramites/${t.id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700 }}>{t.folio}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{TIPO_TRAMITE_LABELS[t.tipo]} · {formatFecha(t.fechaCreacion)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: COLOR_ESTATUS[t.estatus] + '22', color: COLOR_ESTATUS[t.estatus], padding: '0.2rem 0.55rem', borderRadius: '999px' }}>{ESTATUS_LABELS[t.estatus]}</span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
