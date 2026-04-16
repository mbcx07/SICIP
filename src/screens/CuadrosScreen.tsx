import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlazaReemplazo, CuadroReemplazo } from '../types/reemplazos';
import { EstatusPlaza, ESTATUS_PLAZA_LABELS, ESTATUS_PLAZA_COLORS, ESTATUS_PLAZA_BG } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';
import { Rol } from '../types/sicip';
import { getPlazasPorJefe, getCuadroPorPlaza, getPlazasTodas } from '../services/reemplazos';

const MOTIVO_LABEL: Record<string, string> = {
  LICENCIA: 'Licencia',
  INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones',
  COMISION: 'Comisión',
  OTRO: 'Otro',
};

const STATUS_FILTER_KEYS = ['TODAS', ...Object.values(EstatusPlaza)];

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 120, background: '#fff', borderRadius: 12, padding: '1rem 0.75rem',
      textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #d1fae5', borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function formatFecha(fecha: string): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CuadrosScreen() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [plazas, setPlazas] = useState<PlazaReemplazo[]>([]);
  const [cuadros, setCuadros] = useState<Record<string, CuadroReemplazo | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODAS');

  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (!stored) { setUsuario(null); setLoading(false); return; }
    try { setUsuario(JSON.parse(stored) as Usuario); } catch { setUsuario(null); }
    setLoading(false);
  }, []);

  useEffect(() => { if (usuario) loadData(); }, [usuario]);

  const loadData = useCallback(async () => {
    if (!usuario) return;
    setLoading(true); setError(null);
    try {
      const plazasData = usuario.rol === Rol.ADMIN ? await getPlazasTodas() : await getPlazasPorJefe(usuario.uid);
      setPlazas(plazasData);
      const resultados: Record<string, CuadroReemplazo | null> = {};
      await Promise.all(plazasData.map(async (p) => {
        try { resultados[p.id] = await getCuadroPorPlaza(p.id); } catch { resultados[p.id] = null; }
      }));
      setCuadros(resultados);
    } catch (e) { console.error(e); setError('No se pudieron cargar los cuadros de reemplazo.'); }
    finally { setLoading(false); }
  }, [usuario]);

  const canAccess = usuario && (usuario.rol === Rol.JEFE_SERVICIO || usuario.rol === Rol.ADMIN || usuario.rol === 'AREA_PERSONAL');
  if (!loading && !canAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 12 }}>
        <div style={{ fontSize: '3rem' }}>🔒</div>
        <h2 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>Acceso restringido</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', maxWidth: 320 }}>
          Esta sección está disponible para Jefes de Servicio y Administradores.
        </p>
      </div>
    );
  }

  const plazasFiltradas = filtroStatus === 'TODAS'
    ? plazas
    : plazas.filter(p => p.status === filtroStatus);

  const plazasAbiertas = plazas.filter(p => p.status === EstatusPlaza.ABIERTA).length;
  const enProceso = plazas.filter(p => p.status !== EstatusPlaza.CUBIERTA && p.status !== EstatusPlaza.CANCELADA).length;
  const cubiertas = plazas.filter(p => p.status === EstatusPlaza.CUBIERTA).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)',
        borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
            {usuario?.rol === Rol.ADMIN ? 'Todos los Cuadros de Reemplazo' : 'Mis Cuadros de Reemplazo'}
          </h2>
          <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
            {plazas.length} plaza{plazas.length !== 1 ? 's' : ''} en el sistema
          </p>
        </div>
        <button onClick={() => navigate('/crear-plaza')}
          style={{ background: '#fff', color: '#005235', border: 'none', borderRadius: 8, padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Crear Plaza
        </button>
      </div>

      {/* Stats */}
      {!loading && plazas.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <StatCard label="Abiertas" value={plazasAbiertas} color="#005235" />
          <StatCard label="En Proceso" value={enProceso} color="#3b82f6" />
          <StatCard label="Cubiertas" value={cubiertas} color="#6b7280" />
        </div>
      )}

      {/* Status filter */}
      {!loading && plazas.length > 0 && (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {STATUS_FILTER_KEYS.map(key => (
            <button key={key} onClick={() => setFiltroStatus(key)}
              style={{
                padding: '0.35rem 0.7rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                border: filtroStatus === key ? '2px solid #005235' : '1.5px solid #d1d5db',
                background: filtroStatus === key ? '#005235' : '#fff',
                color: filtroStatus === key ? '#fff' : '#374151',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {key === 'TODAS' ? 'Todas' : ESTATUS_PLAZA_LABELS[key as EstatusPlaza] || key}
            </button>
          ))}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {!loading && error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>
      )}

      {!loading && !error && plazas.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: 12 }}>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>
          <h3 style={{ margin: 0, color: '#374151', fontSize: '1rem', fontWeight: 700 }}>No tienes cuadros de reemplazo</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.82rem', textAlign: 'center', maxWidth: 280 }}>
            Presiona <strong>"Crear Plaza"</strong> para registrar una nueva plaza de reemplazo.
          </p>
        </div>
      )}

      {/* Plaza cards */}
      {!loading && !error && plazasFiltradas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {plazasFiltradas.map((plaza) => {
            const cuadro = cuadros[plaza.id];
            const notifPendiente = cuadro?.notificacionPendiente === true;
            const cuadroStatus = cuadro?.status ?? 'SIN_CUADRO';
            const statusKey = plaza.status as EstatusPlaza;

            return (
              <div key={plaza.id} style={{ background: '#fff', borderRadius: 12, padding: '1rem 1.1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', lineHeight: 1.3 }}>{plaza.nombrePlaza}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{plaza.clavePlaza} · {plaza.departamento}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ background: ESTATUS_PLAZA_BG[statusKey] ?? '#f3f4f6', color: ESTATUS_PLAZA_COLORS[statusKey] ?? '#374151', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                      {ESTATUS_PLAZA_LABELS[statusKey] ?? plaza.status}
                    </span>
                    {notifPendiente && (
                      <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                        Notificación pendiente
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ height: 1, background: '#f3f4f6', margin: '2px 0' }} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem' }}>
                  <div><span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Ausente: </span><span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{plaza.nombreAusente}</span></div>
                  {usuario?.rol === Rol.ADMIN && (
                    <div><span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Jefe: </span><span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{plaza.jefeServicioNombre ?? '—'}</span></div>
                  )}
                  <div><span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Tipo: </span><span style={{ fontSize: '0.8rem', color: plaza.tipoPlaza === 'CONFIANZA' ? '#005235' : '#7c3aed', fontWeight: 700 }}>{plaza.tipoPlaza}</span></div>
                  <div><span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Motivo: </span><span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{MOTIVO_LABEL[plaza.motivo] ?? plaza.motivo}</span></div>
                  <div><span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Fin ausencia: </span><span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{formatFecha(plaza.fechaFinAusencia)}</span></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {cuadroStatus === 'BORRADOR' && <span style={{ fontSize: '0.72rem', color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Terna en borrador</span>}
                    {cuadroStatus === 'COMPLETO' && <span style={{ fontSize: '0.72rem', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Terna completa</span>}
                    {cuadroStatus === 'CERRADO' && <span style={{ fontSize: '0.72rem', color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Cerrada</span>}
                    {cuadroStatus === 'SIN_CUADRO' && plaza.status === 'ABIERTA' && <span style={{ fontSize: '0.72rem', color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Sin cuadro aún</span>}
                    {cuadro && <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{cuadro.candidatos?.length ?? 0}/3 candidatos</span>}
                  </div>
                  <button onClick={() => navigate(`/cuadro/${plaza.id}`)}
                    style={{ background: '#005235', color: '#fff', border: 'none', borderRadius: 7, padding: '0.4rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Ver cuadro
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && plazasFiltradas.length === 0 && plazas.length > 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>
          No hay plazas con este estatus.
        </div>
      )}
    </div>
  );
}