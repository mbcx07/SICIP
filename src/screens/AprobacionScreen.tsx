import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Send, Eye } from 'lucide-react';
import { getPlazasTodas, getCuadroPorPlaza, revisarTernaAP, enviarADelegacion } from '../services/reemplazos';
import { EstatusPlaza, ESTATUS_PLAZA_LABELS, ESTATUS_PLAZA_COLORS, ESTATUS_PLAZA_BG } from '../types/reemplazos';
import type { PlazaReemplazo, CuadroReemplazo } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';
import { Rol } from '../types/sicip';

const STATUS_FILTER: { key: string; label: string }[] = [
  { key: 'TODAS', label: 'Todas' },
  { key: EstatusPlaza.TERNA_PROPUESTA, label: 'Terna Propuesta' },
  { key: EstatusPlaza.DEVUELTA_AP, label: 'Devuelta' },
  { key: EstatusPlaza.VALIDADA_AP, label: 'Validada' },
  { key: EstatusPlaza.ENVIADA_DELEGACION, label: 'En Delegación' },
];

export default function AprobacionScreen() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [plazas, setPlazas] = useState<PlazaReemplazo[]>([]);
  const [cuadros, setCuadros] = useState<Record<string, CuadroReemplazo | null>>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('TODAS');
  const [modalAccion, setModalAccion] = useState<{ plazaId: string; accion: 'VALIDAR' | 'DEVOLVER' | 'ENVIAR' } | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (stored) {
      const u = JSON.parse(stored) as Usuario;
      setUsuario(u);
      if (u.rol !== Rol.ADMIN && u.rol !== 'AREA_PERSONAL') {
        // Access denied
      }
    }
  }, []);

  useEffect(() => {
    if (usuario) loadData();
  }, [usuario]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPlazasTodas();
      setPlazas(data);
      const resultados: Record<string, CuadroReemplazo | null> = {};
      await Promise.all(data.map(async (p) => {
        try { resultados[p.id] = await getCuadroPorPlaza(p.id); } catch { resultados[p.id] = null; }
      }));
      setCuadros(resultados);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAccion = async () => {
    if (!modalAccion || !usuario) return;
    setProcesando(true);
    try {
      if (modalAccion.accion === 'VALIDAR') {
        await revisarTernaAP(modalAccion.plazaId, 'VALIDAR', usuario.uid, usuario.nombre, observaciones);
      } else if (modalAccion.accion === 'DEVOLVER') {
        await revisarTernaAP(modalAccion.plazaId, 'DEVOLVER', usuario.uid, usuario.nombre, observaciones);
      } else if (modalAccion.accion === 'ENVIAR') {
        await enviarADelegacion(modalAccion.plazaId, usuario.uid, usuario.nombre);
      }
      await loadData();
      setModalAccion(null);
      setObservaciones('');
    } catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  };

  const relevantStatuses = [
    EstatusPlaza.TERNA_PROPUESTA,
    EstatusPlaza.DEVUELTA_AP,
    EstatusPlaza.VALIDADA_AP,
    EstatusPlaza.ENVIADA_DELEGACION,
  ];

  const plazasFiltradas = plazas.filter(p => {
    if (filtro === 'TODAS') return relevantStatuses.includes(p.status as EstatusPlaza);
    return p.status === filtro;
  });

  if (!usuario) return null;

  const canAccess = usuario.rol === Rol.ADMIN || usuario.rol === 'AREA_PERSONAL';
  if (!canAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 12 }}>
        <Shield size={48} color="#9ca3af" />
        <h2 style={{ margin: 0, color: '#374151' }}>Acceso restringido</h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Solo Área Personal y Administradores pueden acceder.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.25rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #005235 0%, #1a5c32 50%, #27ae60 100%)',
        borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1rem',
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
            <Shield size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Aprobación de Ternas
          </h2>
          <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
            Revisa y valida las ternas propuestas
          </p>
        </div>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {STATUS_FILTER.map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            style={{
              padding: '0.4rem 0.85rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
              border: filtro === f.key ? '2px solid #005235' : '1.5px solid #d1d5db',
              background: filtro === f.key ? '#005235' : '#fff',
              color: filtro === f.key ? '#fff' : '#374151',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #d1fae5', borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : plazasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Shield size={48} color="#9ca3af" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.4rem', color: '#374151' }}>Sin ternas pendientes</h3>
          <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>No hay ternas que requieran revisión en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {plazasFiltradas.map(plaza => {
            const cuadro = cuadros[plaza.id];
            const status = plaza.status as EstatusPlaza;
            return (
              <div key={plaza.id} style={{ background: '#fff', borderRadius: 12, padding: '1rem 1.1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{plaza.nombrePlaza}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{plaza.clavePlaza} · {plaza.departamento}</div>
                  </div>
                  <span style={{
                    background: ESTATUS_PLAZA_BG[status] || '#f3f4f6',
                    color: ESTATUS_PLAZA_COLORS[status] || '#374151',
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  }}>
                    {ESTATUS_PLAZA_LABELS[status] || plaza.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 8 }}>
                  Ausente: {plaza.nombreAusente} · Jefe: {plaza.jefeServicioNombre}
                  {cuadro && <span> · {cuadro.candidatos?.length || 0} candidato{(cuadro.candidatos?.length || 0) !== 1 ? 's' : ''}</span>}
                </div>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate(`/cuadro/${plaza.id}`)}
                    style={{ padding: '0.4rem 0.75rem', background: '#f0f9f4', color: '#005235', border: '1.5px solid #c8e6c9', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={14} /> Ver detalle
                  </button>
                  {status === EstatusPlaza.TERNA_PROPUESTA && (
                    <>
                      <button onClick={() => setModalAccion({ plazaId: plaza.id, accion: 'VALIDAR' })}
                        style={{ padding: '0.4rem 0.75rem', background: '#d1fae5', color: '#065f46', border: '1.5px solid #6ee7b7', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} /> Validar Terna
                      </button>
                      <button onClick={() => setModalAccion({ plazaId: plaza.id, accion: 'DEVOLVER' })}
                        style={{ padding: '0.4rem 0.75rem', background: '#fff7ed', color: '#9a3412', border: '1.5px solid #fed7aa', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={14} /> Devolver
                      </button>
                    </>
                  )}
                  {status === EstatusPlaza.VALIDADA_AP && (usuario.rol === 'AREA_PERSONAL' || usuario.rol === Rol.ADMIN) && (
                    <button onClick={() => setModalAccion({ plazaId: plaza.id, accion: 'ENVIAR' })}
                      style={{ padding: '0.4rem 0.75rem', background: '#dbeafe', color: '#1e40af', border: '1.5px solid #93c5fd', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Send size={14} /> Enviar a Delegación
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalAccion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '1.5rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 900, color: '#005235' }}>
              {modalAccion.accion === 'VALIDAR' && '✓ Validar Terna'}
              {modalAccion.accion === 'DEVOLVER' && '✕ Devolver Terna'}
              {modalAccion.accion === 'ENVIAR' && '↗ Enviar a Delegación'}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1rem' }}>
              {modalAccion.accion === 'VALIDAR' && 'Se marcará la terna como validada por Área Personal.'}
              {modalAccion.accion === 'DEVOLVER' && 'Se devolverá la terna al Jefe de Servicio con observaciones.'}
              {modalAccion.accion === 'ENVIAR' && 'Se enviará la terna a la Delegación para su resolución final.'}
            </p>
            {modalAccion.accion !== 'ENVIAR' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Escribe las observaciones..."
                  rows={3}
                  style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => { setModalAccion(null); setObservaciones(''); }}
                style={{ flex: 1, padding: '0.7rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleAccion} disabled={procesando}
                style={{ flex: 1, padding: '0.7rem', background: procesando ? '#a5b4b0' : '#005235', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: procesando ? 'not-allowed' : 'pointer' }}>
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}