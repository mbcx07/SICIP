import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlazaReemplazo, CuadroReemplazo } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';
import { Rol } from '../types/sicip';
import { getPlazasPorJefe, getCuadroPorPlaza } from '../services/reemplazos';

const MOTIVO_LABEL: Record<string, string> = {
  LICENCIA: 'Licencia',
  INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones',
  COMISION: 'Comisión',
  OTRO: 'Otro',
};

const STATUS_LABEL: Record<string, string> = {
  ABIERTA: 'Abierta',
  CUBIERTA: 'Cubierta',
  CANCELADA: 'Cancelada',
};

const STATUS_BG: Record<string, string> = {
  ABIERTA: '#dcfce7',
  CUBIERTA: '#dbeafe',
  CANCELADA: '#fee2e2',
};

const STATUS_COLOR: Record<string, string> = {
  ABIERTA: '#15803d',
  CUBIERTA: '#1d4ed8',
  CANCELADA: '#dc2626',
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 120,
      background: '#fff',
      borderRadius: 12,
      padding: '1rem 0.75rem',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #d1fae5',
        borderTopColor: '#005235',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
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

  // ── Auth check ──────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (!stored) {
      setUsuario(null);
      setLoading(false);
      return;
    }
    try {
      const u: Usuario = JSON.parse(stored);
      setUsuario(u);
    } catch {
      setUsuario(null);
    }
    setLoading(false);
  }, []);

  // ── Load data ───────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!usuario || usuario.rol !== Rol.JEFE_SERVICIO) return;
    setLoading(true);
    setError(null);
    try {
      const plazasData = await getPlazasPorJefe(usuario.uid);
      setPlazas(plazasData);

      // Load associated cuadros in parallel
      const resultados: Record<string, CuadroReemplazo | null> = {};
      await Promise.all(
        plazasData.map(async (plaza) => {
          try {
            resultados[plaza.id] = await getCuadroPorPlaza(plaza.id);
          } catch {
            resultados[plaza.id] = null;
          }
        })
      );
      setCuadros(resultados);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los cuadros de reemplazo.');
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario) loadData();
  }, [usuario, loadData]);

  // ── Access gate ─────────────────────────────────────────
  if (!loading && (!usuario || usuario.rol !== Rol.JEFE_SERVICIO)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 12 }}>
        <div style={{ fontSize: '3rem' }}>🔒</div>
        <h2 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>Acceso restringido</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', maxWidth: 320 }}>
          Esta sección está disponible únicamente para Jefes de Servicio.
        </p>
      </div>
    );
  }

  // ── Stats ───────────────────────────────────────────────
  const plazasAbiertas = plazas.filter(p => p.status === 'ABIERTA').length;
  const cuadrosCompletos = Object.values(cuadros).filter(c => c?.status === 'COMPLETO' || c?.status === 'CERRADO').length;
  const pendientesTerna = Object.values(cuadros).filter(c => c?.notificacionPendiente === true).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)',
        borderRadius: 14,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
            Mis Cuadros de Reemplazo
          </h2>
          <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
            {plazas.length} plaza{plazas.length !== 1 ? 's' : ''} asignada{plazas.length !== 1 ? 's' : ''} a tu cargo
          </p>
        </div>
        <button
          onClick={() => navigate('/crear-plaza')}
          style={{
            background: '#fff',
            color: '#005235',
            border: 'none',
            borderRadius: 8,
            padding: '0.55rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Crear Plaza
        </button>
      </div>

      {/* ── Stats row ── */}
      {!loading && plazas.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <StatCard label="Plazas Abiertas" value={plazasAbiertas} color="#005235" />
          <StatCard label="Cuadros Completos" value={cuadrosCompletos} color="#15803d" />
          <StatCard label="Pendientes de Ternar" value={pendientesTerna} color="#d97706" />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && <LoadingSpinner />}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '1rem',
          color: '#dc2626',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && plazas.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1rem',
          gap: 12,
        }}>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <h3 style={{ margin: 0, color: '#374151', fontSize: '1rem', fontWeight: 700 }}>
            No tienes cuadros de reemplazo
          </h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.82rem', textAlign: 'center', maxWidth: 280 }}>
            Presiona <strong>"Crear Plaza"</strong> para registrar una nueva plaza de reemplazo.
          </p>
        </div>
      )}

      {/* ── Plaza cards ── */}
      {!loading && !error && plazas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {plazas.map((plaza) => {
            const cuadro = cuadros[plaza.id];
            const notifPendiente = cuadro?.notificacionPendiente === true;
            const cuadroStatus = cuadro?.status ?? 'SIN_CUADRO';

            return (
              <div
                key={plaza.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '1rem 1.1rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {/* Top row: plaza name + status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', lineHeight: 1.3 }}>
                      {plaza.nombrePlaza}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                      {plaza.clavePlaza} · {plaza.departamento}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      background: STATUS_BG[plaza.status] ?? '#f3f4f6',
                      color: STATUS_COLOR[plaza.status] ?? '#374151',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 99,
                    }}>
                      {STATUS_LABEL[plaza.status] ?? plaza.status}
                    </span>
                    {notifPendiente && (
                      <span style={{
                        background: '#fff7ed',
                        color: '#c2410c',
                        border: '1px solid #fed7aa',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 99,
                        whiteSpace: 'nowrap',
                      }}>
                        Notificación pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#f3f4f6', margin: '2px 0' }} />

                {/* Info row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Ausente: </span>
                    <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{plaza.nombreAusente}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Motivo: </span>
                    <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{MOTIVO_LABEL[plaza.motivo] ?? plaza.motivo}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Fin ausencia: </span>
                    <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{formatFecha(plaza.fechaFinAusencia)}</span>
                  </div>
                </div>

                {/* Cuadro status + action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {cuadroStatus === 'BORRADOR' && (
                      <span style={{ fontSize: '0.72rem', color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        Terna en borrador
                      </span>
                    )}
                    {cuadroStatus === 'COMPLETO' && (
                      <span style={{ fontSize: '0.72rem', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        Ternar completa
                      </span>
                    )}
                    {cuadroStatus === 'CERRADO' && (
                      <span style={{ fontSize: '0.72rem', color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        Cerrada
                      </span>
                    )}
                    {cuadroStatus === 'SIN_CUADRO' && plaza.status === 'ABIERTA' && (
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        Sin cuadro aún
                      </span>
                    )}
                    {cuadro && (
                      <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                        {cuadro.candidatos?.length ?? 0}/3 candidatos
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/cuadro/${plaza.id}`)}
                    style={{
                      background: '#005235',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 7,
                      padding: '0.4rem 0.9rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Ver cuadro
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
