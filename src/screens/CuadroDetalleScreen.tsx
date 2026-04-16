import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronUp, ChevronDown, X, Users, FileText, CheckCircle, AlertTriangle, Shield, Send, Clock, CheckCheck, RotateCcw } from 'lucide-react';
import {
  getPlazaReemplazo, getCuadroPorPlaza, getPostulacionesPorPlaza,
  agregarCandidatoACuadro, quitarCandidatoDeCuadro, reordenarCandidatos,
  cerrarCuadro, cerrarPlaza, buscarTrabajadores, evaluarPostulacion,
  proponerTerna, revisarTernaAP, enviarADelegacion, resolverDelegacion,
  getHistorialPorPlaza, validarCandidato
} from '../services/reemplazos';
import { EstatusPlaza, ESTATUS_PLAZA_LABELS, ESTATUS_PLAZA_COLORS, ESTATUS_PLAZA_BG } from '../types/reemplazos';
import type { PlazaReemplazo, CuadroReemplazo, CandidatoReemplazo, PostulacionReemplazo, HistorialReemplazo, ResultadoValidacion, JustificacionTecnica } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';
import { Rol } from '../types/sicip';

const STATUS_POST_COLOR: Record<string, string> = {
  PENDIENTE: '#f59e0b', ACEPTADO: '#10b981', RECHAZADO: '#ef4444', RETIRADO: '#94a3b8',
};

const STATUS_CUADRO_COLOR: Record<string, string> = {
  BORRADOR: '#f59e0b', COMPLETO: '#10b981', CERRADO: '#005235',
};

const ACCION_LABELS: Record<string, string> = {
  TERNA_PROPUESTA: 'Terna propuesta',
  VALIDADA_AP: 'Validada por Área Personal',
  DEVUELTA_AP: 'Devuelta por Área Personal',
  ENVIADA_DELEGACION: 'Enviada a Delegación',
  DESIGNACION_APROBADA: 'Designación aprobada',
  DESIGNACION_RECHAZADA: 'Designación rechazada',
};

export default function CuadroDetalleScreen() {
  const { plazaId } = useParams<{ plazaId: string }>();
  const navigate = useNavigate();

  const [plaza, setPlaza] = useState<PlazaReemplazo | null>(null);
  const [cuadro, setCuadro] = useState<CuadroReemplazo | null>(null);
  const [postulaciones, setPostulaciones] = useState<PostulacionReemplazo[]>([]);
  const [historial, setHistorial] = useState<HistorialReemplazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'terna' | 'postulaciones' | 'historial'>('terna');
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

  // Approval flow modals
  const [showProponerModal, setShowProponerModal] = useState(false);
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [showResolverModal, setShowResolverModal] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [aprobarDelegacion, setAprobarDelegacion] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // Validación de candidato
  const [validaciones, setValidaciones] = useState<ResultadoValidacion[] | null>(null);
  const [validando, setValidando] = useState(false);
  const [candidatoValidando, setCandidatoValidando] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (stored) setUsuario(JSON.parse(stored) as Usuario);
  }, []);

  useEffect(() => {
    if (!plazaId) return;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [p, c, ps] = await Promise.all([getPlazaReemplazo(plazaId), getCuadroPorPlaza(plazaId), getPostulacionesPorPlaza(plazaId)]);
        if (!p) { setError('Plaza no encontrada'); return; }
        setPlaza(p); setCuadro(c); setPostulaciones(ps);
        try { const h = await getHistorialPorPlaza(plazaId); setHistorial(h); } catch {}
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
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

  const refresh = async () => {
    if (!plazaId) return;
    const [p, c] = await Promise.all([getPlazaReemplazo(plazaId), getCuadroPorPlaza(plazaId)]);
    setPlaza(p); setCuadro(c);
    try { const h = await getHistorialPorPlaza(plazaId); setHistorial(h); } catch {}
  };

  const handleAgregarCandidato = async (t: { matricula: string; nombre: string; area: string; tipoContrato: string }) => {
    if (!cuadro || !usuario) return;
    if (cuadro.candidatos.length >= 3) { setAddError('La terna ya tiene 3 candidatos'); return; }
    const siguientePos: 1 | 2 | 3 = (cuadro.candidatos.length + 1) as 1 | 2 | 3;
    const candidato: CandidatoReemplazo = {
      posicion: siguientePos, matricula: t.matricula, nombre: t.nombre, area: t.area, tipoContrato: t.tipoContrato,
      fechaAgregado: new Date().toISOString(), agregadoPorUid: usuario.uid, agregadoPorNombre: usuario.nombre,
    };
    setAddLoading(true); setAddError(null);
    try {
      await agregarCandidatoACuadro(cuadro.id, candidato);
      const actualizado = await getCuadroPorPlaza(plazaId!);
      setCuadro(actualizado); setShowAdd(false); setBusqueda(''); setSugerencias([]);
    } catch (e: any) { setAddError(e.message); }
    finally { setAddLoading(false); }
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
    const nuevaOrden = [...orden]; [nuevaOrden[idx - 1], nuevaOrden[idx]] = [nuevaOrden[idx], nuevaOrden[idx - 1]];
    await reordenarCandidatos(cuadro.id, nuevaOrden.map(c => c.matricula));
    setCuadro(await getCuadroPorPlaza(plazaId!));
  };

  const handleBajar = async (pos: 1 | 2 | 3) => {
    if (!cuadro || pos === 3) return;
    const orden = [...cuadro.candidatos].sort((a, b) => a.posicion - b.posicion);
    const idx = orden.findIndex(c => c.posicion === pos);
    if (idx < 0 || idx >= orden.length - 1) return;
    const nuevaOrden = [...orden]; [nuevaOrden[idx], nuevaOrden[idx + 1]] = [nuevaOrden[idx + 1], nuevaOrden[idx]];
    await reordenarCandidatos(cuadro.id, nuevaOrden.map(c => c.matricula));
    setCuadro(await getCuadroPorPlaza(plazaId!));
  };

  const handleCerrarCuadro = async () => {
    if (!cuadro || !plaza || !usuario) return;
    setCerrando(true);
    try {
      await cerrarCuadro(cuadro.id, candidatoCierre, usuario.uid, usuario.nombre);
      await cerrarPlaza(plaza.id, usuario.uid, usuario.nombre);
      await refresh(); setShowCerrarModal(false);
    } catch (e: any) { alert(e.message); }
    finally { setCerrando(false); }
  };

  const handleEvaluarPostulacion = async (pid: string, status: 'ACEPTADO' | 'RECHAZADO') => {
    if (!usuario) return;
    await evaluarPostulacion(pid, status, usuario.uid, usuario.nombre);
    setPostulaciones(await getPostulacionesPorPlaza(plazaId!));
  };

  const handleValidarCandidato = async (matricula: string) => {
    if (!plazaId) return;
    setCandidatoValidando(matricula); setValidando(true); setValidaciones(null);
    try {
      const res = await validarCandidato(matricula, plazaId);
      setValidaciones(res);
    } catch { setValidaciones([{ tipo: 'BLOQUEANTE', campo: 'error', mensaje: 'Error al validar' }]); }
    finally { setValidando(false); }
  };

  // Approval actions
  const handleProponerTerna = async () => {
    if (!plazaId || !usuario) return;
    setProcesando(true);
    try { await proponerTerna(plazaId, usuario.uid, usuario.nombre); await refresh(); setShowProponerModal(false); }
    catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  };

  const handleValidarTerna = async () => {
    if (!plazaId || !usuario) return;
    setProcesando(true);
    try { await revisarTernaAP(plazaId, 'VALIDAR', usuario.uid, usuario.nombre, observaciones); await refresh(); setShowDevolverModal(false); setObservaciones(''); }
    catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  };

  const handleDevolverTerna = async () => {
    if (!plazaId || !usuario) return;
    setProcesando(true);
    try { await revisarTernaAP(plazaId, 'DEVOLVER', usuario.uid, usuario.nombre, observaciones); await refresh(); setShowDevolverModal(false); setObservaciones(''); }
    catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  };

  const handleEnviarDelegacion = async () => {
    if (!plazaId || !usuario) return;
    setProcesando(true);
    try { await enviarADelegacion(plazaId, usuario.uid, usuario.nombre); await refresh(); }
    catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  };

  const handleResolverDelegacion = async () => {
    if (!plazaId || !usuario) return;
    setProcesando(true);
    try { await resolverDelegacion(plazaId, aprobarDelegacion, usuario.uid, usuario.nombre, observaciones); await refresh(); setShowResolverModal(false); setObservaciones(''); }
    catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: "3px solid #c8e6c9", borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
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
  const puedeCerrar = cuadro && cuadro.status !== 'CERRADO' && (plaza.status === EstatusPlaza.ABIERTA) && !plaza.ternaCerrada;
  const statusKey = plaza.status as EstatusPlaza;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/cuadros')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#005235', display: 'flex', alignItems: 'center', padding: '0.25rem', marginTop: '0.2rem' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#005235' }}>{plaza.nombrePlaza}</h1>
          <p style={{ margin: '0.2rem 0 0', color: '#666', fontSize: '0.8rem' }}>{plaza.departamento} · {plaza.unidadNombre}</p>
        </div>
      </div>

      {/* Approval Flow Status Bar */}
      <div style={{ background: ESTATUS_PLAZA_BG[statusKey] || '#f3f4f6', border: `2px solid ${ESTATUS_PLAZA_COLORS[statusKey] || '#d1d5db'}`, borderRadius: 12, padding: '0.9rem 1.1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: ESTATUS_PLAZA_COLORS[statusKey] || '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Estatus</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: ESTATUS_PLAZA_COLORS[statusKey] || '#111827' }}>
            {ESTATUS_PLAZA_LABELS[statusKey] || plaza.status}
          </div>
        </div>
        {/* Action buttons based on role and status */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* JEFE_SERVICIO: can propose terna when ABIERTA */}
          {usuario && (usuario.rol === Rol.JEFE_SERVICIO || usuario.rol === Rol.ADMIN) && (plaza.status === EstatusPlaza.ABIERTA || plaza.status === EstatusPlaza.DEVUELTA_AP) && cuadro && cuadro.candidatos.length > 0 && (
            <button onClick={() => setShowProponerModal(true)} style={{ padding: '0.45rem 0.85rem', background: '#005235', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Send size={14} /> Proponer Terna
            </button>
          )}
          {/* AREA_PERSONAL: can validate/return when TERNA_PROPUESTA */}
          {usuario && (usuario.rol === 'AREA_PERSONAL' || usuario.rol === Rol.ADMIN) && plaza.status === EstatusPlaza.TERNA_PROPUESTA && (
            <>
              <button onClick={handleValidarTerna} disabled={procesando} style={{ padding: '0.45rem 0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCheck size={14} /> Validar
              </button>
              <button onClick={() => setShowDevolverModal(true)} style={{ padding: '0.45rem 0.85rem', background: '#f97316', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RotateCcw size={14} /> Devolver
              </button>
            </>
          )}
          {/* AREA_PERSONAL/ADMIN: can send to delegación when VALIDADA_AP */}
          {usuario && (usuario.rol === 'AREA_PERSONAL' || usuario.rol === Rol.ADMIN) && plaza.status === EstatusPlaza.VALIDADA_AP && (
            <button onClick={handleEnviarDelegacion} disabled={procesando} style={{ padding: '0.45rem 0.85rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Send size={14} /> Enviar a Delegación
            </button>
          )}
          {/* ADMIN: can resolve delegación when ENVIADA_DELEGACION */}
          {usuario && usuario.rol === Rol.ADMIN && plaza.status === EstatusPlaza.ENVIADA_DELEGACION && (
            <button onClick={() => setShowResolverModal(true)} style={{ padding: '0.45rem 0.85rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={14} /> Resolver
            </button>
          )}
        </div>
      </div>

      {/* Observations from AP if DEVUELTA_AP */}
      {(plaza.status === EstatusPlaza.DEVUELTA_AP || plaza.observacionesAP) && plaza.observacionesAP && (
        <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9a3412', marginBottom: 4 }}>Observaciones de Área Personal</div>
          <div style={{ fontSize: '0.85rem', color: '#374151' }}>{plaza.observacionesAP}</div>
        </div>
      )}
      {plaza.motivoRechazo && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Motivo de rechazo de Delegación</div>
          <div style={{ fontSize: '0.85rem', color: '#374151' }}>{plaza.motivoRechazo}</div>
        </div>
      )}

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
          { key: 'terna' as const, label: 'Terna', icon: <Users size={14} /> },
          { key: 'postulaciones' as const, label: `Postulaciones (${postulaciones.length})`, icon: <FileText size={14} /> },
          { key: 'historial' as const, label: 'Historial', icon: <Clock size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.6rem 1rem', background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#005235' : '#64748b', border: 'none', borderRadius: '0.65rem',
              fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s',
            }}>
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
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>Mat. {c.matricula} · {c.area} · {c.tipoContrato}</div>
                      {c.observacionesJefe && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.2rem', fontStyle: 'italic' }}>"{c.observacionesJefe}"</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      <button onClick={() => handleValidarCandidato(c.matricula)} disabled={validando} title="Validar candidato"
                        style={{ background: '#ede9fe', border: '1.5px solid #c4b5fd', borderRadius: '0.5rem', padding: '0.35rem', cursor: validando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Shield size={15} color="#7c3aed" />
                      </button>
                      {cuadro?.status !== 'CERRADO' && (
                        <>
                          {c.posicion > 1 && <button onClick={() => handleSubir(c.posicion)} title="Subir prioridad" style={{ background: '#f0f9f4', border: '1.5px solid #c8e6c9', borderRadius: '0.5rem', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronUp size={15} color="#005235" /></button>}
                          {c.posicion < 3 && <button onClick={() => handleBajar(c.posicion)} title="Bajar prioridad" style={{ background: '#f0f9f4', border: '1.5px solid #c8e6c9', borderRadius: '0.5rem', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronDown size={15} color="#005235" /></button>}
                          <button onClick={() => handleQuitar(c.posicion)} title="Quitar" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '0.5rem', padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={15} color="#dc2626" /></button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Validation results for this candidate */}
                  {validaciones && candidatoValidando === c.matricula && (
                    <div style={{ padding: '0.5rem 1rem 0.65rem', borderTop: '1px solid #f3f4f6' }}>
                      {validaciones.map((v, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={{ color: v.tipo === 'BLOQUEANTE' ? '#dc2626' : v.tipo === 'ADVERTENCIA' ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                            {v.tipo === 'BLOQUEANTE' ? '⛔' : v.tipo === 'ADVERTENCIA' ? '⚠️' : '✅'}
                          </span>
                          <span style={{ color: v.tipo === 'BLOQUEANTE' ? '#dc2626' : '#374151' }}>{v.mensaje}</span>
                          {v.detalle && <span style={{ color: '#6b7280', fontSize: '0.72rem' }}> — {v.detalle}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ padding: '0.4rem 1rem 0.65rem', fontSize: '0.7rem', color: '#aaa' }}>
                    Agregado por {c.agregadoPorNombre} · {new Date(c.fechaAgregado).toLocaleDateString('es-MX')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add candidate */}
          {showAdd ? (
            <div style={{ background: 'white', borderRadius: '1rem', border: '2px solid #27ae60', padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#005235' }}>Buscar trabajador</span>
                <button onClick={() => { setShowAdd(false); setBusqueda(''); setSugerencias([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={18} /></button>
              </div>
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Matrícula o nombre del trabajador..." autoFocus
                style={{ width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #e5e7eb', borderRadius: '0.65rem', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '0.6rem' }}
                onFocus={e => { e.target.style.borderColor = '#27ae60'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
              {addError && <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>{addError}</p>}
              {sugerencias.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.65rem', overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                  {sugerencias.map((s) => (
                    <button key={s.matricula} onMouseDown={() => handleAgregarCandidato(s)} disabled={addLoading}
                      style={{ width: '100%', textAlign: 'left', padding: '0.6rem 0.85rem', background: 'white', border: 'none', borderBottom: '1px solid #f3f4f6', fontSize: '0.83rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      <span><strong>{s.nombre}</strong> <span style={{ color: '#888' }}>· Mat. {s.matricula}</span></span>
                      <span style={{ fontSize: '0.72rem', color: '#888' }}>{s.area}</span>
                    </button>
                  ))}
                </div>
              )}
              {busqueda.length >= 2 && sugerencias.length === 0 && !addLoading && <p style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>Sin resultados</p>}
            </div>
          ) : (
            (candidatosOrdenados.length < 3 && cuadro?.status !== 'CERRADO') && (
              <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '0.75rem', background: '#f0fdf4', color: '#005235', border: '2px dashed #27ae60', borderRadius: '0.85rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
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
                      <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Mat. {p.trabajadorMatricula} · {p.unidadNombre}</div>
                      {p.comentarioJefe && <div style={{ fontSize: '0.78rem', color: '#555', background: '#f9f9f9', borderRadius: '0.5rem', padding: '0.4rem 0.6rem', marginBottom: '0.3rem' }}><strong>Comentario:</strong> {p.comentarioJefe}</div>}
                      <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Postuló: {new Date(p.fechaPostulacion).toLocaleDateString('es-MX')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '1rem', background: STATUS_POST_COLOR[p.status] + '22', color: STATUS_POST_COLOR[p.status] }}>{p.status}</span>
                      {cuadro?.status !== 'CERRADO' && p.status === 'PENDIENTE' && (
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button onClick={() => handleEvaluarPostulacion(p.id, 'ACEPTADO')} style={{ padding: '0.3rem 0.65rem', background: '#d1fae5', color: '#065f46', border: '1.5px solid #6ee7b7', borderRadius: '0.5rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>✓ Aceptar</button>
                          <button onClick={() => handleEvaluarPostulacion(p.id, 'RECHAZADO')} style={{ padding: '0.3rem 0.65rem', background: '#fef2f2', color: '#991b1b', border: '1.5px solid #fca5a5', borderRadius: '0.5rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>✕ Rechazar</button>
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

      {/* ── TAB HISTORIAL ── */}
      {tab === 'historial' && (
        <div>
          {historial.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'white', borderRadius: '1.1rem', border: '2px solid #e8f5e9' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
              <h3 style={{ margin: '0 0 0.4rem', color: '#005235', fontSize: '1rem' }}>Sin historial</h3>
              <p style={{ color: '#888', fontSize: '0.82rem' }}>Aún no hay acciones registradas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {historial.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#005235', flexShrink: 0 }} />
                    {i < historial.length - 1 && <div style={{ width: 2, flex: 1, background: '#d1d5db', minHeight: 20 }} />}
                  </div>
                  <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '0.7rem 0.9rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#005235' }}>{ACCION_LABELS[h.accion] || h.accion}</span>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{new Date(h.fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      Por {h.usuarioNombre} ({h.usuarioRol})
                    </div>
                    {h.observaciones && <div style={{ fontSize: '0.78rem', color: '#374151', marginTop: 3, background: '#f9fafb', padding: '0.3rem 0.5rem', borderRadius: 6 }}>{h.observaciones}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Proponer Terna */}
      {showProponerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 900, color: '#005235' }}>Proponer Terna</h2>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1rem' }}>
              Se notificará al Área Personal para que revise la terna propuesta. ¿Confirmar?
            </p>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => setShowProponerModal(false)} style={{ flex: 1, padding: '0.7rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleProponerTerna} disabled={procesando} style={{ flex: 1, padding: '0.7rem', background: procesando ? '#a5b4b0' : '#005235', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: procesando ? 'not-allowed' : 'pointer' }}>
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Devolver Terna */}
      {showDevolverModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 900, color: '#f97316' }}>Devolver Terna con Observaciones</h2>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1rem' }}>
              Se devolverá la terna al Jefe de Servicio con las observaciones indicadas.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Observaciones</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Escribe las observaciones..." rows={3}
                style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => { setShowDevolverModal(false); setObservaciones(''); }} style={{ flex: 1, padding: '0.7rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleDevolverTerna} disabled={procesando} style={{ flex: 1, padding: '0.7rem', background: procesando ? '#a5b4b0' : '#f97316', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: procesando ? 'not-allowed' : 'pointer' }}>
                {procesando ? 'Procesando...' : 'Devolver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resolver Delegación */}
      {showResolverModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 900, color: '#7c3aed' }}>Resolver Designación</h2>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1rem' }}>
              ¿Aprueba o rechaza la designación de esta plaza?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={() => setAprobarDelegacion(true)}
                style={{ flex: 1, padding: '0.6rem', background: aprobarDelegacion ? '#d1fae5' : '#f3f4f6', border: aprobarDelegacion ? '2px solid #10b981' : '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: aprobarDelegacion ? '#065f46' : '#6b7280' }}>
                ✓ Aprobar
              </button>
              <button onClick={() => setAprobarDelegacion(false)}
                style={{ flex: 1, padding: '0.6rem', background: !aprobarDelegacion ? '#fee2e2' : '#f3f4f6', border: !aprobarDelegacion ? '2px solid #ef4444' : '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: !aprobarDelegacion ? '#991b1b' : '#6b7280' }}>
                ✕ Rechazar
              </button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Observaciones</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder={aprobarDelegacion ? "Observaciones (opcional)..." : "Motivo del rechazo..."} rows={3}
                style={{ width: '100%', padding: '0.6rem', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => { setShowResolverModal(false); setObservaciones(''); }} style={{ flex: 1, padding: '0.7rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleResolverDelegacion} disabled={procesando} style={{ flex: 1, padding: '0.7rem', background: procesando ? '#a5b4b0' : (aprobarDelegacion ? '#10b981' : '#ef4444'), color: 'white', border: 'none', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: procesando ? 'not-allowed' : 'pointer' }}>
                {procesando ? 'Procesando...' : aprobarDelegacion ? 'Aprobar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Cuadro */}
      {showCerrarModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.75rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 900, color: '#005235' }}>Cerrar Cuadro de Reemplazo</h2>
            <p style={{ color: '#666', fontSize: '0.83rem', margin: '0 0 1rem' }}>Selecciona el candidato que será asignado. Una vez cerrado, la terna no podrá modificarse.</p>
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
              <button onClick={() => setShowCerrarModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '0.75rem', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCerrarCuadro} disabled={cerrando} style={{ flex: 1, padding: '0.75rem', background: cerrando ? '#fca5a5' : 'linear-gradient(135deg, #b91c1c, #ef4444)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.88rem', fontWeight: 700, cursor: cerrando ? 'not-allowed' : 'pointer', boxShadow: cerrando ? 'none' : '0 4px 12px rgba(239,68,68,0.3)' }}>
                {cerrando ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}