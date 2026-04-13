import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { getPlazasPorJefe, getCuadroPorPlaza } from '../services/reemplazos';
import type { PlazaReemplazo, CuadroReemplazo } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';

const MOTIVO_LABEL: Record<string, string> = {
  LICENCIA: 'Licencia',
  INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones',
  COMISION: 'Comisión',
  OTRO: 'Otro',
};

const STATUS_COLOR: Record<string, string> = {
  ABIERTA: '#f59e0b',
  CUBIERTA: '#10b981',
  CANCELADA: '#94a3b8',
};

export default function CuadrosScreen() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [plazas, setPlazas] = useState<PlazaReemplazo[]>([]);
  const [cuadros, setCuadros] = useState<Record<string, CuadroReemplazo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (!stored) { navigate('/login'); return; }
    const u: Usuario = JSON.parse(stored);
    if (u.rol !== 'JEFE_SERVICIO' && u.rol !== 'ADMIN') {
      setError('Acceso restringido a Jefes de Servicio');
      setLoading(false);
      return;
    }
    setUsuario(u);
    cargarPlazas(u.uid);
  }, []);

  const cargarPlazas = async (uid: string) => {
    setLoading(true);
    try {
      const ps = await getPlazasPorJefe(uid);
      setPlazas(ps);
      // Cargar cuadro para cada plaza
      const map: Record<string, CuadroReemplazo> = {};
      for (const p of ps) {
        const c = await getCuadroPorPlaza(p.id);
        if (c) map[p.id] = c;
      }
      setCuadros(map);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: "3px solid '#c8e6c9'", borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Cargando cuadros...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Error</p>
      <p style={{ margin: 0 }}>{error}</p>
    </div>
  );

  const abiertas = plazas.filter(p => p.status === 'ABIERTA');
  const completos = plazas.filter(p => {
    const c = cuadros[p.id];
    return c?.status === 'COMPLETO' || c?.status === 'CERRADO';
  });
  const pendientes = plazas.filter(p => {
    const c = cuadros[p.id];
    return c?.notificacionPendiente;
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#005235' }}>
              Cuadros de Reemplazo
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.83rem' }}>
              Gestiona las ternas para cubrir plazas de confianza
            </p>
          </div>
          <button
            onClick={() => navigate('/crear-plaza')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: 'linear-gradient(135deg, #1a5c32, #27ae60)',
              color: 'white', border: 'none', borderRadius: '0.75rem',
              fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(39,174,96,0.3)',
            }}
          >
            <Plus size={18} /> Crear Plaza
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.1rem', border: '2px solid #e8f5e9', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{abiertas.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>Abiertas</div>
        </div>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.1rem', border: '2px solid #e8f5e9', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{completos.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>Con Terna</div>
        </div>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.1rem', border: '2px solid #e8f5e9', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>{pendientes.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>Sin Terna</div>
        </div>
      </div>

      {/* Lista */}
      {plazas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '1.25rem', border: '2px solid #e8f5e9' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#005235' }}>Sin cuadros de reemplazo</h3>
          <p style={{ color: '#888', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>Crea una plaza cuando necesites cubrir una ausencia temporal</p>
          <button
            onClick={() => navigate('/crear-plaza')}
            style={{
              padding: '0.65rem 1.5rem',
              background: 'linear-gradient(135deg, #1a5c32, #27ae60)',
              color: 'white', border: 'none', borderRadius: '0.75rem',
              fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Crear primera plaza
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {plazas.map(plaza => {
            const cuadro = cuadros[plaza.id];
            const tieneNotif = cuadro?.notificacionPendiente;
            return (
              <div
                key={plaza.id}
                style={{
                  background: 'white', borderRadius: '1.1rem',
                  border: '2px solid #e8f5e9',
                  overflow: 'hidden',
                }}
              >
                {/* Card header */}
                <div style={{ padding: '1rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a2932' }}>{plaza.nombrePlaza}</span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                        borderRadius: '1rem', background: STATUS_COLOR[plaza.status] + '22',
                        color: STATUS_COLOR[plaza.status], letterSpacing: '0.03em',
                      }}>
                        {plaza.status}
                      </span>
                      {tieneNotif && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                          borderRadius: '1rem', background: '#fef3c7',
                          color: '#d97706', letterSpacing: '0.03em',
                        }}>
                          <AlertTriangle size={10} /> Falta candidato
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Ausente: <strong>{plaza.nombreAusente}</strong>
                      {' · '}{MOTIVO_LABEL[plaza.motivo] || plaza.motivo}
                      {' · '}{plaza.departamento}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>
                      {plaza.fechaInicioAusencia} → {plaza.fechaFinAusencia}
                      {' · '}{plaza.categoria}
                    </div>
                    {cuadro && (
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>
                        Terna: {cuadro.candidatos.length}/3 candidatos
                        {' · '}<span style={{ color: cuadro.status === 'COMPLETO' ? '#10b981' : cuadro.status === 'CERRADO' ? '#005235' : '#f59e0b' }}>{cuadro.status}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/cuadro/${plaza.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.5rem 0.9rem',
                      background: '#f0f9f4', color: '#005235',
                      border: '1.5px solid #c8e6c9', borderRadius: '0.65rem',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Gestionar <ChevronRight size={15} />
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
