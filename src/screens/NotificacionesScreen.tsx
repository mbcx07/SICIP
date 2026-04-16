import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink, Mail, MailOpen, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { getNotificacionesPorUsuario, marcarNotificacionLeida, marcarTodasLeidas } from '../services/reemplazos';
import type { NotificacionSICIP } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';

const TIPO_ICON: Record<string, React.ReactNode> = {
  TERNA_LISTA: <CheckCircle2 size={18} color="#10b981" />,
  TERNA_DEVUELTA: <XCircle size={18} color="#f97316" />,
  TERNA_VALIDADA: <CheckCircle2 size={18} color="#10b981" />,
  DELEGACION_RESUELTA: <Info size={18} color="#3b82f6" />,
  DESIGNACION_CONFIRMADA: <CheckCircle2 size={18} color="#059669" />,
  PLAZA_CANCELADA: <AlertCircle size={18} color="#dc2626" />,
  SIN_CUADRO_ASIGNADO: <AlertCircle size={18} color="#f59e0b" />,
};

const TIPO_BG: Record<string, string> = {
  TERNA_LISTA: '#d1fae5',
  TERNA_DEVUELTA: '#fff7ed',
  TERNA_VALIDADA: '#d1fae5',
  DELEGACION_RESUELTA: '#dbeafe',
  DESIGNACION_CONFIRMADA: '#d1fae5',
  PLAZA_CANCELADA: '#fee2e2',
  SIN_CUADRO_ASIGNADO: '#fef3c7',
};

export default function NotificacionesScreen() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [notificaciones, setNotificaciones] = useState<NotificacionSICIP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (stored) setUsuario(JSON.parse(stored) as Usuario);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    loadData();
  }, [usuario]);

  const loadData = async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      const data = await getNotificacionesPorUsuario(usuario.uid);
      setNotificaciones(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLeida = async (id: string) => {
    await marcarNotificacionLeida(id);
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const handleMarcarTodas = async () => {
    if (!usuario) return;
    await marcarTodasLeidas(usuario.uid);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const handleNavigate = (n: NotificacionSICIP) => {
    if (!n.leida) handleMarcarLeida(n.id);
    navigate(n.accionUrl);
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  if (!usuario) return null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#005235', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={24} /> Notificaciones
            {noLeidas > 0 && (
              <span style={{
                background: '#dc2626', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                padding: '2px 8px', borderRadius: 99, marginLeft: 4,
              }}>
                {noLeidas}
              </span>
            )}
          </h2>
          <p style={{ margin: '3px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
            {notificaciones.length} notificación{notificaciones.length !== 1 ? 'es' : ''} en total
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={handleMarcarTodas}
            style={{
              background: '#fff', color: '#005235', border: '1.5px solid #005235',
              borderRadius: 8, padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <CheckCheck size={15} /> Marcar todas leídas
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #d1fae5', borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : notificaciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Bell size={48} color="#9ca3af" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.4rem', color: '#374151', fontSize: '1rem' }}>Sin notificaciones</h3>
          <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>No tienes notificaciones aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {notificaciones.map(n => (
            <div
              key={n.id}
              style={{
                background: n.leida ? '#fff' : '#f0fdf4',
                borderLeft: n.leida ? '3px solid #d1d5db' : '3px solid #005235',
                borderRadius: 10,
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                boxShadow: n.leida ? 'none' : '0 1px 4px rgba(0,82,53,0.1)',
                transition: 'background 0.2s',
              }}
              onClick={() => handleNavigate(n)}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: TIPO_BG[n.tipo] || '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {TIPO_ICON[n.tipo] || <Mail size={18} color="#6b7280" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: n.leida ? 500 : 800, fontSize: '0.88rem', color: n.leida ? '#6b7280' : '#111827', lineHeight: 1.3 }}>
                  {n.mensaje}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 3 }}>
                  {new Date(n.fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {!n.leida && (
                <button
                  onClick={e => { e.stopPropagation(); handleMarcarLeida(n.id); }}
                  style={{
                    background: '#005235', color: '#fff', border: 'none', borderRadius: 6,
                    padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  <MailOpen size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  Leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}