import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, XCircle, AlertTriangle, GripVertical } from 'lucide-react';
import {
  getPlazaReemplazo, getCuadroPorPlaza, getPostulacionesPorPlaza,
  cerrarPlaza
} from '../services/reemplazos';
import type { PlazaReemplazo, CuadroReemplazo, PostulacionReemplazo, CandidatoReemplazo } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';

const MOTIVO_LABEL: Record<string, string> = {
  LICENCIA: 'Licencia', INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones', COMISION: 'Comisión', OTRO: 'Otro',
};
const STATUS_COLOR: Record<string, string> = {
  ABIERTA: '#f59e0b', CUBIERTA: '#10b981', CANCELADA: '#94a3b8',
};

export default function CuadroDetalleScreen() {
  const { plazaId } = useParams<{ plazaId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plaza, setPlaza] = useState<PlazaReemplazo | null>(null);
  const [cuadro, setCuadro] = useState<CuadroReemplazo | null>(null);
  const [postulaciones, setPostulaciones] = useState<PostulacionReemplazo[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const usuario: Usuario | null = (() => {
    try { return JSON.parse(sessionStorage.getItem('sicip_usuario') || 'null'); } catch { return null; }
  })();

  useEffect(() => {
    if (!plazaId) { navigate('/cuadros'); return; }
    cargar();
  }, [plazaId]);

  const cargar = async () => {
    setLoading(true);
    try {
      const [p, c, posts] = await Promise.all([
        getPlazaReemplazo(plazaId!),
        getCuadroPorPlaza(plazaId!),
        getPostulacionesPorPlaza(plazaId!),
      ]);
      setPlaza(p);
      setCuadro(c);
      setPostulaciones(posts);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarPlaza = async () => {
    if (!plaza || !usuario) return;
    if (!window.confirm('¿Cerrar esta plaza? Ya no recibirá postulaciones.')) return;
    setActionLoading(true);
    try {
      await cerrarPlaza(plaza.id, usuario.uid, usuario.nombre);
      await cargar();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: "3px solid '#c8e6c9'", borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#666' }}>Cargando cuadro...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !plaza) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <p>{error || 'Plaza no encontrada'}</p>
      <button onClick={() => navigate('/cuadros')} style={{ marginTop: 16, padding: '8px 16px', background: '#005235', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Volver</button>
    </div>
  );

  const puedeCerrar = plaza.status === 'ABIERTA' && (usuario?.rol === 'ADMIN' || usuario?.rol === 'JEFE_SERVICIO');

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/cuadros')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#005235', padding: 4 }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a1a2e', fontWeight: 700 }}>Cuadro de Reemplazo</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>{plaza.nombrePlaza}</p>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 20, background: STATUS_COLOR[plaza.status] + '22', color: STATUS_COLOR[plaza.status], fontWeight: 600, fontSize: '0.8rem' }}>
          {plaza.status}
        </span>
      </div>

      {/* Info Plaza */}
      <div style={{ background: '#f8fdfb', border: '1px solid #c8e6c9', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#005235', fontWeight: 700 }}>Datos de la Plaza</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Clave:</span> <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{plaza.clavePlaza}</span></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Categoría:</span> <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{plaza.categoria}</span></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Motivo:</span> <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{MOTIVO_LABEL[plaza.motivo] || plaza.motivo}</span></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Ausente:</span> <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{plaza.nombreAusente} ({plaza.matriculaAusente})</span></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Inicio:</span> <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{plaza.fechaInicioAusencia}</span></div>
          <div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Fin:</span> <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{plaza.fechaFinAusencia}</span></div>
        </div>
        {plaza.habilidadesRequeridas.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Habilidades:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {plaza.habilidadesRequeridas.map(h => (
                <span key={h} style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem' }}>{h}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Candidatos */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1a2e' }}>
            <Users size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Candidatos ({cuadro?.candidatos.length || 0}/3)
          </h3>
          {plaza.status === 'ABIERTA' && (
            <button
              onClick={() => navigate(`/agregar-candidato/${plaza.id}`)}
              style={{ padding: '6px 14px', background: '#005235', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              + Agregar
            </button>
          )}
        </div>

        {!cuadro || cuadro.candidatos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f8faf8', borderRadius: 10, border: '1px dashed #c8e6c9' }}>
            <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ color: '#64748b', margin: 0 }}>No hay candidatos agregados</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cuadro.candidatos.map((c, i) => (
              <div key={c.matricula} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: i === 0 ? '#005235' : i === 1 ? '#0369a1' : '#64748b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{c.nombre}</p>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>{c.area} · {c.tipoContrato}</p>
                  {c.observacionesJefe && <p style={{ margin: '4px 0 0', color: '#005235', fontSize: '0.8rem', fontStyle: 'italic' }}>"{c.observacionesJefe}"</p>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pos. {c.posicion}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Postulaciones */}
      {postulaciones.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700, color: '#1a1a2e' }}>Postulaciones ({postulaciones.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {postulaciones.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{p.trabajadorNombre} ({p.trabajadorMatricula})</p>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.75rem' }}>{p.unidadNombre}</p>
                </div>
                <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: p.status === 'ACEPTADO' ? '#dcfce7' : p.status === 'RECHAZADO' ? '#fee2e2' : '#fef9c3', color: p.status === 'ACEPTADO' ? '#16a34a' : p.status === 'RECHAZADO' ? '#dc2626' : '#ca8a04' }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      {puedeCerrar && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCerrarPlaza}
            disabled={actionLoading}
            style={{ padding: '10px 20px', background: actionLoading ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
          >
            {actionLoading ? 'Cerrando...' : 'Cerrar Plaza'}
          </button>
        </div>
      )}
    </div>
  );
}
