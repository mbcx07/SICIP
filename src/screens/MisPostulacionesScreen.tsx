import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, ExternalLink, Clock, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { getPostulacionesPorTrabajador, getPlazaReemplazo } from '../services/reemplazos';
import type { PostulacionReemplazo, PlazaReemplazo } from '../types/reemplazos';

const STATUS_CONFIG: Record<PostulacionReemplazo['status'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDIENTE: {
    label: 'Pendiente',
    color: '#d97706',
    bg: '#fef3c7',
    icon: <Clock size={13} />,
  },
  ACEPTADO: {
    label: 'Aceptado',
    color: '#15803d',
    bg: '#dcfce7',
    icon: <CheckCircle size={13} />,
  },
  RECHAZADO: {
    label: 'Rechazado',
    color: '#b91c1c',
    bg: '#fee2e2',
    icon: <XCircle size={13} />,
  },
  RETIRADO: {
    label: 'Retirado',
    color: '#64748b',
    bg: '#f1f5f9',
    icon: <MinusCircle size={13} />,
  },
};

interface PostulacionConPlaza {
  postulacion: PostulacionReemplazo;
  plaza: PlazaReemplazo | null;
}

export default function MisPostulacionesScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PostulacionConPlaza[]>([]);
  const [loading, setLoading] = useState(true);

  const stored = sessionStorage.getItem('sicip_usuario');
  const usuario = stored ? JSON.parse(stored) : null;

  useEffect(() => {
    if (!usuario?.matricula) {
      setLoading(false);
      return;
    }
    getPostulacionesPorTrabajador(usuario.matricula)
      .then(async (postulaciones) => {
        const enriched = await Promise.all(
          postulaciones.map(async (p) => {
            try {
              const plaza = await getPlazaReemplazo(p.plazaId);
              return { postulacion: p, plaza };
            } catch {
              return { postulacion: p, plaza: null };
            }
          })
        );
        setItems(enriched);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [usuario?.matricula]);

  const pendientes = items.filter(i => i.postulacion.status === 'PENDIENTE').length;
  const aceptados = items.filter(i => i.postulacion.status === 'ACEPTADO').length;
  const rechazados = items.filter(i => i.postulacion.status === 'RECHAZADO' || i.postulacion.status === 'RETIRADO').length;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #c8e6c9', borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!usuario) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
      No se encontró información del usuario. <button onClick={() => navigate('/login')} style={{ color: '#005235', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Iniciar sesión</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#003324' }}>Mis Postulaciones</h2>
        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {items.length === 0 ? 'Sin postulaciones aún' : `${items.length} cuadro${items.length !== 1 ? 's' : ''} de reemplazo`}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Pendientes', count: pendientes, color: '#d97706', bg: '#fef3c7' },
          { label: 'Aceptados', count: aceptados, color: '#15803d', bg: '#dcfce7' },
          { label: 'Rechazados', count: rechazados, color: '#b91c1c', bg: '#fee2e2' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: 100,
            background: s.bg,
            borderRadius: '0.85rem',
            padding: '0.85rem 1rem',
            textAlign: 'center',
            border: `1px solid ${s.color}30`,
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: s.color, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '1rem', padding: '3rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)',
          textAlign: 'center',
        }}>
          <FileText size={48} color="#c8e6c9" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Aún no te has postulado a ningún cuadro de reemplazo
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>
            Explora las plazas abiertas y postúlate cuando haya una oportunidad disponible.
          </p>
          <button
            onClick={() => navigate('/explorar-plazas')}
            className="btn-institutional"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem' }}
          >
            <ExternalLink size={15} /> Explorar Plazas
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {items.map(({ postulacion, plaza }) => {
            const cfg = STATUS_CONFIG[postulacion.status];
            return (
              <div key={postulacion.id} style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1rem 1.1rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                border: '1px solid var(--border-soft)',
              }}>
                {/* Plaza info */}
                <div style={{ marginBottom: '0.7rem' }}>
                  {plaza ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#003324', flex: 1 }}>{plaza.nombrePlaza}</div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.72rem', fontWeight: 700,
                          color: cfg.color, background: cfg.bg,
                          padding: '0.2rem 0.55rem', borderRadius: '999px', whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {plaza.departamento || 'Información no disponible'}
                        {plaza.unidadNombre ? ` · ${plaza.unidadNombre}` : ''}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Información no disponible</div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.72rem', fontWeight: 700,
                        color: cfg.color, background: cfg.bg,
                        padding: '0.2rem 0.55rem', borderRadius: '999px', whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ausente */}
                {plaza && plaza.nombreAusente && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>Ausente:</span> {plaza.nombreAusente}
                  </div>
                )}

                {/* Fecha de postulación */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: postulacion.evaluadoPorNombre ? '0.4rem' : 0 }}>
                  <span style={{ fontWeight: 600 }}>Postulado el:</span>{' '}
                  {new Date(postulacion.fechaPostulacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>

                {/* Evaluación */}
                {postulacion.evaluadoPorNombre && postulacion.fechaEvaluacion && (
                  <div style={{
                    marginTop: '0.6rem',
                    padding: '0.6rem 0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.55rem',
                    border: '1px solid var(--border-soft)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      Evaluado por {postulacion.evaluadoPorNombre} el{' '}
                      {new Date(postulacion.fechaEvaluacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {postulacion.comentarioJefe && (
                      <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>"{postulacion.comentarioJefe}"</div>
                    )}
                  </div>
                )}

                {/* Curriculum link */}
                {postulacion.curriculumUrl && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <a
                      href={postulacion.curriculumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        fontSize: '0.78rem', fontWeight: 600,
                        color: '#005235', textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={13} />
                      {postulacion.curriculumNombre || 'Ver Curriculum'}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
