import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronUp, ChevronDown, X, Users, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  getPlazaReemplazo, getCuadroPorPlaza, getPostulacionesPorPlaza,
  agregarCandidatoACuadro, quitarCandidatoDeCuadro, reordenarCandidatos,
  cerrarCuadro, cerrarPlaza, buscarTrabajadores, evaluarPostulacion
} from '../services/reemplazos';
import type { PlazaReemplazo, CuadroReemplazo, CandidatoReemplazo, PostulacionReemplazo } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';

const STATUS_POST_COLOR: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  ACEPTADO: '#10b981',
  RECHAZADO: '#ef4444',
  RETIRADO: '#94a3b8',
};

const STATUS_CUADRO_COLOR: Record<string, string> = {
  BORRADOR: '#f59e0b',
  COMPLETO: '#10b981',
  CERRADO: '#005235',
};

export default function CuadroDetalleScreen() {
  const { plazaId } = useParams<{ plazaId: string }>();
  const navigate = useNavigate();

  const [plaza, setPlaza] = useState<PlazaReemplazo | null>(null);
  const [cuadro, setCuadro] = useState<CuadroReemplazo | null>(null);
  const [postulaciones, setPostulaciones] = useState<PostulacionReemplazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'terna' | 'postulaciones'>('terna');
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<{ matricula: string; nombre: string; area: string; tipoContrato: string }[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [candidatoCierre, setCandidatoCierre] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (stored) setUsuario(JSON.parse(stored) as Usuario);
  }, []);

  useEffect(() => {
    if (!plazaId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, c, ps] = await Promise.all([
          getPlazaReemplazo(plazaId),
          getCuadroPorPlaza(plazaId),
          getPostulacionesPorPlaza(plazaId),
        ]);
        if (!p) { setError('Plaza no encontrada'); return; }
        setPlaza(p);
        setCuadro(c);
        setPostulaciones(ps);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [plazaId]);

  useEffect(() => {
    if (!showAdd || busqueda.length < 2) { setSugerencias([]); return; }
    const timer = setTimeout(async () => {
      const res = await buscarTrabajadores(busqueda);
      setSugerencias(res.slice(0, 8));
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, showAdd]);

  const handleAgregarCandidato = async (t: { matricula: string; nombre: string; area: string; tipoContrato: string }) => {
    if (!cuadro || !usuario) return;
    if (cuadro.candidatos.length >= 3) { setAddError('La terna ya tiene 3 candidatos'); return; }
    const siguientePos: 1 | 2 | 3 = (cuadro.candidatos.length + 1) as 1 | 2 | 3;
    const candidato: CandidatoReemplazo = {
      posicion: siguientePos,
      matricula: t.matricula,
      nombre: t.nombre,
      area: t.area,
      tipoContrato: t.tipoContrato,
      fechaAgregado: new Date().toISOString(),
      agregadoPorUid: usuario.uid,
      agregadoPorNombre: usuario.nombre,
    };
    setAddLoading(true);
    setAddError(null);
    try {
      await agregarCandidatoACuadro(cuadro.id, candidato);
      const actualizado = await getCuadroPorPlaza(plazaId!);
      setCuadro(actualizado);
      setShowAdd(false);
      setBusqueda('');
      setSugerencias([]);
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleQuitar = async (pos: 1 | 2 | 3) => {
    if (!cuadro) return;
    await quitarCandidatoDeCuadro(cuadro.id, pos);
    const actualizado = await getCuadroPorPlaza(plazaId!);
    setCuadro(actualizado);
  };

  const handleSubir = async (pos: 1 | 2 | 3) => {
    if (!cuadro || pos === 1) return;
    const orden = [...cuadro.candidatos].sort((a, b) => a.posicion - b.posicion);
    const idx = orden.findIndex(c => c.posicion === pos);
    if (idx <= 0) return;
    const nuevaOrden = [...orden];
    [nuevaOrden[idx - 1], nuevaOrden[idx]] = [nuevaOrden[idx], nuevaOrden[idx - 1]];
    await reordenarCandidatos(cuadro.id, nuevaOrden.map(c => c.matricula));
    const actualizado = await getCuadroPorPlaza(plazaId!);
    setCuadro(actualizado);
  };

  const handleBajar = async (pos: 1 | 2 | 3) => {
    if (!cuadro || pos === 3) return;
    const orden = [...cuadro.candidatos].sort((a, b) => a.posicion - b.posicion);
    const idx = orden.findIndex(c => c.posicion === pos);
    if (idx < 0 || idx >= orden.length - 1) return;
    const nuevaOrden = [...orden];
    [nuevaOrden[idx], nuevaOrden[idx + 1]] = [nuevaOrden[idx + 1], nuevaOrden[idx]];
    await reordenarCandidatos(cuadro.id, nuevaOrden.map(c => c.matricula));
    const actualizado = await getCuadroPorPlaza(plazaId!);
    setCuadro(actualizado);
  };

  const handleCerrarCuadro = async () => {
    if (!cuadro || !plaza || !usuario) return;
    setCerrando(true);
    try {
      await cerrarCuadro(cuadro.id, candidatoCierre, usuario.uid, usuario.nombre);
      await cerrarPlaza(plaza.id, usuario.uid, usuario.nombre);
      const [actualizadoPlaza, actualizadoCuadro] = await Promise.all([
        getPlazaReemplazo(plaza.id),
        getCuadroPorPlaza(plaza.id),
      ]);
      setPlaza(actualizadoPlaza);
      setCuadro(actualizadoCuadro);
      setShowCerrarModal(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCerrando(false);
    }
  };

  const handleEvaluarPostulacion = async (pid: string, status: 'ACEPTADO' | 'RECHAZADO') => {
    if (!usuario) return;
    await evaluarPostulacion(pid, status, usuario.uid, usuario.nombre);
    const ps = await getPostulacionesPorPlaza(plazaId!);
    setPostulaciones(ps);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: "3px solid '#c8e6c9'", borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Cargando cuadro...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !plaza) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Error</p>
      <p style={{ margin: 0 }}>{error || 'Plaza no encontrada'}</p>
      <button onClick={() => navigate('/cuadros')} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', background: '#005235', color: 'white', border: 'none', borderRadius: '0.6rem', cursor: 'pointer' }}>Volver a Cuadros</button>
    </div>
  );

  const candidatosOrdenados = [...(cuadro?.candidatos || [])].sort((a, b) => a.posicion - b.posicion);
  const puedeCerrar = cuadro && cuadro.status !== 'CERRADO' && plaza.status !== 'CUBIERTA' && !plaza.ternaCerrada;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/cuadros')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#005235', display: 'flex', alignItems: 'center', padding: '0.25rem', marginTop: '0.2rem' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#005235' }}>{plaza.nombrePlaza}</h1>
          <p style={{ margin: '0.2rem 0 0', color: '#666', fontSize: '0.8rem' }}>
            {plaza.departamento} · {plaza.unidadNombre}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: '1rem', background: plaza.status === 'ABIERTA' ? '#fef3c7' : plaza.status === 'CUBIERTA' ? '#d1fae5' : '#f1f5f9', color: plaza.status === 'ABIERTA' ? '#d97706' : plaza.status === 'CUBIERTA' ? '#065f46' : '#64748b' }}>{plaza.status}</span>
            {cuadro && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: '1rem', background: STATUS_CUADRO_COLOR[cuadro.status] + '22', color: STATUS_CUADRO_COLOR[cuadro.status] }}>
                Terna: {cuadro.status}
              </span>
            )}
          </div>
        </div>
        {puedeCerrar && (
          <button
            onClick={() => setShowCerrarModal(true)}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'linear-gradient(135deg, #b91c1c, #ef4444)',
              color: 'white', border: 'none', borderRadius: '0.75rem',
              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <CheckCircle size={15} /> Cerrar Cuadro
          </button>
        )}
      </div>

      {/* Info de ausencia */}
      <div style={{ background: '#f8fffe', border: '1.5px solid #c8e6c9', borderRadius: '1rem', padding: '0.9rem 1.1rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#005235', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Ausencia Temporal</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
          <div><span style={{ fontSize: '0.72rem', color: '#888' }}>Ausente:</span> <strong style={{ fontSize: '0.82rem' }}>{plaza.nombreAusente}</strong></div>
          <div><span style={{ fontSize: '0.72rem', color: '#888' }}>Matrícula:</span> <strong style={{ fontSize: '0.82rem' }}>{plaza.matriculaAusente}</strong></div>
          <div><span style={{ fontSize: '0.72rem', color: '#888' }}>Motivo:</span> <strong style={{ fontSize: '0.82rem' }}>{plaza.motivo}</strong></div>
          <div><span style={{ fontSize: '0.72rem', color: '#888' }}>Periodo:</span> <strong style={{ fontSize: '0.82rem' }}>{plaza.fechaInicioAusencia} → {plaza.fechaFinAusencia}</strong></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: '#f1f5f9', borderRadius: '0.85rem', padding: '0.25rem' }}>
        {([
          { key: 'terna', label: 'Terna', icon: <Users size={14} /> },
          { key: 'postulaciones', label: `Postulaciones (${postulaciones.length})`, icon: <FileText size={14} /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.6rem 1rem',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#005235' : '#64748b',
              border: 'none', borderRadius: '0.65rem',
              fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB TERNA ── */}
      {tab === 'terna' && (
        <div>
          {cuadro?.notificacionPendiente && (
            <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: '0.85rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={16} color="#d97706" />
              <span style={{ fontSize: '0.83rem', color: '#92400e', fontWeight: 600 }}>La terna está incompleta. Agrega al menos 1 candidato.</span>
            </div>
          )}

          {candidatosOrdenados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'white', borderRadius: '1.1rem', border: '2px solid #e8f5e9' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
              <h3 style={{ margin: '0 0 0.4rem', color: '#005235', fontSize: '1rem' }}>Sin candidatos en la terna</h3>
              <p style={{ color: '#888', fontSize: '0.82rem', margin: '0 0 1rem' }}>Busca trabajadores para agregar a la terna</p>
              {!showAdd && (
                <button onClick={() => setShowAdd(true)} style={{ padding: '0.6rem 1.4rem', background: 'linear-gradient(135deg, #1a5c32, #27ae60)', color: 'white', border: 'none', borderRadius: '0.7rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  + Agregar Candidato
                </button>
              )}
            </div>
          )}

          {candidatosOrdenados.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {candidatosOrdenados.map((c) => (
                <div key={c.posicion} style={{ background: 'white', borderRadius: '1rem', border: '2px solid #e8f5e9', overflow: 'hidden' }}>
                  <div style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: c.posicion === 1 ? '#005235' : c.posicion === 2 ? '#1a7a45' : '#27ae60',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: '1rem', flexShrink: 0,
                    }}>
                      {c.posicion}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a2932', marginBottom: '0.15rem' }}>{c.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        Mat. {c.matricula} · {c.area} · {c.tipoContrato}
                      </div>
                      {c.observacionesJefe && (
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.2rem', fontStyle: 'italic' }}>"{c.observacionesJefe}"</div>
                      )}
                    </div>
                    {cuadro?.status !== 'CERRADO' && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {c.posicion > 1 && (
                          <button onClick={() => handleSubir(c.posicion)} title="Subir prioridad" style={{ background: '#f0f9f4', border: '1.5px solid #c8e6c9', borderRadius: '0.5rem', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronUp size={15} color="#005235" />
                          </button>
                        )}
                        {c.posicion < 3 && (
                          <button onClick={() => handleBajar(c.posicion)} title="Bajar prioridad" style={{ background: '#f0f9f4', border: '1.5px solid #c8e6c9', borderRadius: '0.5rem', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronDown size={15} color="#005235" />
                          </button>
                        )}
                        <button onClick={() => handleQuitar(c.posicion)} title="Quitar" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '0.5rem', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <X size={15} color="#dc2626" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.4rem 1rem 0.65rem', fontSize: '0.7rem', color: '#aaa' }}>
                    Agregado por {c.agregadoPorNombre} · {new Date(c.fechaAgregado).toLocaleDateString('es-MX')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Buscador */}
          {showAdd ? (
            <div style={{ background: 'white', borderRadius: '1rem', border: '2px solid #27ae60', padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#005235' }}>Buscar trabajador</span>
                <button onClick={() => { setShowAdd(false); setBusqueda(''); setSugerencias([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                  <X size={18} />
                </button>
              </div>
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Matrícula o nombre del trabajador..."
                autoFocus
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #e5e7eb', borderRadius: '0.65rem', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '0.6rem' }}
                onFocus={e => { e.target.style.borderColor = '#27ae60'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
              />
              {addError && <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>{addError}</p>}
              {sugerencias.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.65rem', overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                  {sugerencias.map((s) => (
                    <button
                      key={s.matricula}
                      onMouseDown={() => handleAgregarCandidato(s)}
                      disabled={addLoading}
                      style={{
                        width: '100%', textAlign: 'left', padding: '0.6rem 0.85rem',
                        background: 'white', border: 'none', borderBottom: '1px solid #f3f4f6',
                        fontSize: '0.83rem', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      <span><strong>{s.nombre}</strong> <span style={{ color: '#888' }}>· Mat. {s.matricula}</span></span>
                      <span style={{ fontSize: '0.72rem', color: '#888' }}>{s.area}</span>
                    </button>
                  ))}
                </div>
              )}
              {busqueda.length >= 2 && sugerencias.length === 0 && !addLoading && (
                <p style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>Sin resultados</p>
              )}
            </div>
          ) : (
            candidatosOrdenados.length < 3 && (
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  width: '100%', padding: '0.75rem',
                  background: '#f0fdf4', color: '#005235',
                  border: '2px dashed #27ae60', borderRadius: '0.85rem',
                  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                + Agregar candidato a la terna
              </button>
            )
          )}
        </div>
      )}

      {/* ── TAB POSTULACIONES ── */}
      {tab === 'postulaciones' && (
        <div>
          {postulaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'white', borderRadius: '1.1rem', border: '2px solid #e8f5e9' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
              <h3 style={{ margin: '0 0 0.4rem', color: '#005235', fontSize: '1rem' }}>Sin postulaciones</h3>
              <p style={{ color: '#888', fontSize: '0.82rem' }}>Aún no hay trabajadores interesados en esta plaza</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {postulaciones.map(p => (
                <div key={p.id} style={{ background: 'white', borderRadius: '1rem', border: '2px solid #e8f5e9', padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a2932', marginBottom: '0.2rem' }}>{p.trabajadorNombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>
                        Mat. {p.trabajadorMatricula} · {p.unidadNombre}
                      </div>
                      {p.comentarioJefe && (
                        <div style={{ fontSize: '0.78rem', color: '#555', background: '#f9f9f9', borderRadius: '0.5rem', padding: '0.4rem 0.6rem', marginBottom: '0.3rem' }}>
                          <strong>Comentario:</strong> {p.comentarioJefe}
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Postuló: {new Date(p.fechaPostulacion).toLocaleDateString('es-MX')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '1rem', background: STATUS_POST_COLOR[p.status] + '22', color: STATUS_POST_COLOR[p.status] }}>
                        {p.status}
                      </span>
                      {cuadro?.status !== 'CERRADO' && p.status === 'PENDIENTE' && (
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            onClick={() => handleEvaluarPostulacion(p.id, 'ACEPTADO')}
                            style={{ padding: '0.3rem 0.65rem', background: '#d1fae5', color: '#065f46', border: '1.5px solid #6ee7b7', borderRadius: '0.5rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            ✓ Aceptar
                          </button>
                          <button
                            onClick={() => handleEvaluarPostulacion(p.id, 'RECHAZADO')}
                            style={{ padding: '0.3rem 0.65rem', background: '#fef2f2', color: '#991b1b', border: '1.5px solid #fca5a5', borderRadius: '0.5rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            ✕ Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Cerrar Cuadro */}
      {showCerrarModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.75rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 900, color: '#005235' }}>Cerrar Cuadro de Reemplazo</h2>
            <p style={{ color: '#666', fontSize: '0.83rem', margin: '0 0 1rem' }}>
              Selecciona el candidato que será asignado. Una vez cerrado, la terna no podrá modificarse.
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', color: '#374151' }}>Candidato Seleccionado</label>
              {[1, 2, 3].filter(n => candidatosOrdenados.some(c => c.posicion === n)).map(n => {
                const c = candidatosOrdenados.find(x => x.posicion === n)!;
                return (
                  <label key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', border: `2px solid ${candidatoCierre === n ? '#27ae60' : '#e5e7eb'}`, borderRadius: '0.7rem', marginBottom: '0.4rem', cursor: 'pointer', background: candidatoCierre === n ? '#f0fdf4' : 'white' }}>
                    <input type="radio" name="cand" value={String(n)} checked={candidatoCierre === n} onChange={() => setCandidatoCierre(n as 1 | 2 | 3)} style={{ accentColor: '#27ae60' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a2932' }}>{c.nombre}</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>— Posición {c.posicion}</span>
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => setShowCerrarModal(false)}
                style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '0.75rem', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCerrarCuadro}
                disabled={cerrando}
                style={{ flex: 1, padding: '0.75rem', background: cerrando ? '#fca5a5' : 'linear-gradient(135deg, #b91c1c, #ef4444)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.88rem', fontWeight: 700, cursor: cerrando ? 'not-allowed' : 'pointer', boxShadow: cerrando ? 'none' : '0 4px 12px rgba(239,68,68,0.3)' }}
              >
                {cerrando ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
