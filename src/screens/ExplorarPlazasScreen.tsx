import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, Clock, GraduationCap, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { getPlazasAbiertas, crearPostulacion, getPostulacionesPorTrabajador } from '../services/reemplazos';
import type { PlazaReemplazo, PostulacionReemplazo } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';

const MOTIVO_LABEL: Record<string, string> = {
  LICENCIA: 'Licencia',
  INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones',
  COMISION: 'Comisión',
  OTRO: 'Otro',
};

export default function ExplorarPlazasScreen() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [plazas, setPlazas] = useState<PlazaReemplazo[]>([]);
  const [postulaciones, setPostulaciones] = useState<PostulacionReemplazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [postulando, setPostulando] = useState<string | null>(null);
  const [postuladoMsg, setPostuladoMsg] = useState<string | null>(null);
  const [showMisPostulaciones, setShowMisPostulaciones] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (!stored) { navigate('/login'); return; }
    const u: Usuario = JSON.parse(stored);
    setUsuario(u);
    cargar(u);
  }, []);

  const cargar = async (u?: Usuario) => {
    setLoading(true);
    setError(null);
    try {
      const [ps, misP] = await Promise.all([
        getPlazasAbiertas(),
        u ? getPostulacionesPorTrabajador(u.matricula) : Promise.resolve([]),
      ]);
      setPlazas(ps);
      setPostulaciones(misP);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const unidades = [...new Set(plazas.map(p => p.unidadNombre))].sort();

  const plazasFiltradas = plazas.filter(p => {
    const matchBusqueda = !busqueda
      || p.nombrePlaza.toLowerCase().includes(busqueda.toLowerCase())
      || p.departamento.toLowerCase().includes(busqueda.toLowerCase())
      || p.clavePlaza.toLowerCase().includes(busqueda.toLowerCase())
      || p.categoria.toLowerCase().includes(busqueda.toLowerCase())
      || p.nombreAusente.toLowerCase().includes(busqueda.toLowerCase());
    const matchUnidad = !filtroUnidad || p.unidadNombre === filtroUnidad;
    return matchBusqueda && matchUnidad;
  });

  const yaPostulado = (plazaId: string) =>
    postulaciones.some(p => p.plazaId === plazaId && p.status !== 'RETIRADO');

  const handlePostularse = async (plaza: PlazaReemplazo) => {
    if (!usuario) return;
    setPostulando(plaza.id);
    setPostuladoMsg(null);
    try {
      await crearPostulacion({
        cuadroId: '', // se llena después
        plazaId: plaza.id,
        trabajadorMatricula: usuario.matricula,
        trabajadorNombre: usuario.nombre,
        unidadClave: usuario.unidadClave || '',
        unidadNombre: usuario.unidadNombre || '',
        email: usuario.email || '',
        telefono: (usuario as any).telefono || '',
        status: 'PENDIENTE',
        fechaPostulacion: new Date().toISOString(),
      });
      setPostuladoMsg(`Postulación enviada para "${plaza.nombrePlaza}"`);
      await cargar(usuario);
      setTimeout(() => setPostuladoMsg(null), 4000);
    } catch (e: any) {
      setPostuladoMsg(`Error: ${e.message}`);
    } finally {
      setPostulando(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: "3px solid '#c8e6c9'", borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Buscando plazas abiertas...</p>
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

  const postulacionesActivas = postulaciones.filter(p => p.status !== 'RETIRADO');
  const aceptadas = postulacionesActivas.filter(p => p.status === 'ACEPTADO').length;
  const pendientes = postulacionesActivas.filter(p => p.status === 'PENDIENTE').length;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#005235' }}>
          Explorar Plazas Abiertas
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.8rem' }}>
          Consulta las plazas de reemplazo disponibles y postúlate
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '0.9rem', border: '2px solid #e8f5e9', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#005235' }}>{plazasFiltradas.length}</div>
          <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Abiertas</div>
        </div>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '0.9rem', border: '2px solid #e8f5e9', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b' }}>{pendientes}</div>
          <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pendientes</div>
        </div>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '0.9rem', border: '2px solid #e8f5e9', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>{aceptadas}</div>
          <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aceptadas</div>
        </div>
      </div>

      {/* Mis postulaciones toggle */}
      {postulacionesActivas.length > 0 && (
        <button
          onClick={() => setShowMisPostulaciones(!showMisPostulaciones)}
          style={{
            width: '100%', padding: '0.7rem 1rem', marginBottom: '1rem',
            background: showMisPostulaciones ? '#f0fdf4' : 'white',
            border: `2px solid ${showMisPostulaciones ? '#27ae60' : '#e8f5e9'}`,
            borderRadius: '0.85rem', cursor: 'pointer', textAlign: 'left',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#005235' }}>
            Mis postulaciones ({postulacionesActivas.length})
          </span>
          <ChevronRight size={16} color="#005235" style={{ transform: showMisPostulaciones ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      )}

      {/* Lista mis postulaciones */}
      {showMisPostulaciones && (
        <div style={{ background: 'white', borderRadius: '1rem', border: '2px solid #27ae60', padding: '0.9rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {postulacionesActivas.map(p => {
            const plaza = plazas.find(x => x.id === p.plazaId);
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a2932' }}>{plaza?.nombrePlaza || 'Plaza'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#888' }}>{p.unidadNombre} · {new Date(p.fechaPostulacion).toLocaleDateString('es-MX')}</div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '1rem',
                  background: p.status === 'ACEPTADO' ? '#d1fae5' : p.status === 'RECHAZADO' ? '#fef2f2' : '#fef3c7',
                  color: p.status === 'ACEPTADO' ? '#065f46' : p.status === 'RECHAZADO' ? '#991b1b' : '#92400e',
                }}>
                  {p.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Mensaje de postulación */}
      {postuladoMsg && (
        <div style={{
          background: postuladoMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
          border: `1.5px solid ${postuladoMsg.startsWith('Error') ? '#fca5a5' : '#6ee7b7'}`,
          borderRadius: '0.85rem', padding: '0.75rem 1rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: postuladoMsg.startsWith('Error') ? '#991b1b' : '#065f46',
          fontSize: '0.83rem', fontWeight: 600,
        }}>
          {postuladoMsg.startsWith('Error') ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {postuladoMsg}
        </div>
      )}

      {/* Buscador + filtro */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por puesto, departamento, categoría..."
            style={{ width: '100%', padding: '0.7rem 0.85rem 0.7rem 2.35rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: 'white' }}
            onFocus={e => { e.target.style.borderColor = '#27ae60'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
          />
        </div>
        <select
          value={filtroUnidad}
          onChange={e => setFiltroUnidad(e.target.value)}
          style={{ padding: '0.7rem 0.85rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '0.83rem', outline: 'none', background: 'white', fontFamily: 'inherit', cursor: 'pointer', color: '#374151' }}
          onFocus={e => { e.target.style.borderColor = '#27ae60'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
        >
          <option value="">Todas las unidades</option>
          {unidades.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {/* Lista de plazas */}
      {plazasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '1.25rem', border: '2px solid #e8f5e9' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ margin: '0 0 0.4rem', color: '#005235', fontSize: '1rem' }}>Sin plazas encontradas</h3>
          <p style={{ color: '#888', fontSize: '0.82rem' }}>Intenta con otro término de búsqueda o unidad</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {plazasFiltradas.map(plaza => {
            const yaPost = yaPostulado(plaza.id);
            return (
              <div
                key={plaza.id}
                style={{
                  background: 'white', borderRadius: '1.1rem',
                  border: '2px solid #e8f5e9', overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ padding: '1rem 1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a2932' }}>{plaza.nombrePlaza}</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '1rem', background: '#fef3c7', color: '#d97706' }}>{MOTIVO_LABEL[plaza.motivo]}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={11} />{plaza.unidadNombre}</span>
                        {' · '}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Briefcase size={11} />{plaza.departamento}</span>
                      </div>
                    </div>
                    {yaPost && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '1rem', background: '#d1fae5', color: '#065f46', whiteSpace: 'nowrap' }}>
                        ✓ Postulado
                      </span>
                    )}
                  </div>

                  {/* Detalle inline */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.7rem' }}>
                    {plaza.categoria && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '1rem', background: '#f1f5f9', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <GraduationCap size={10} />{plaza.categoria}
                      </span>
                    )}
                    {plaza.escolaridadMinima && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '1rem', background: '#ede9fe', color: '#5b21b6' }}>
                        {plaza.escolaridadMinima}
                      </span>
                    )}
                    {plaza.experienciaAnos > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '1rem', background: '#fef3c7', color: '#92400e' }}>
                        {plaza.experienciaAnos} años exp.
                      </span>
                    )}
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '1rem', background: '#fff7ed', color: '#9a3412', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={10} />{plaza.fechaInicioAusencia} → {plaza.fechaFinAusencia}
                    </span>
                  </div>

                  {/* Info ausente */}
                  <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '0.75rem' }}>
                    Cobertura temporal de <strong style={{ color: '#555' }}>{plaza.nombreAusente}</strong> (Mat. {plaza.matriculaAusente})
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => navigate(`/mis-postulaciones?plaza=${plaza.id}`)}
                      style={{
                        padding: '0.5rem 0.9rem',
                        background: '#f0f9f4', color: '#005235',
                        border: '1.5px solid #c8e6c9', borderRadius: '0.65rem',
                        fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Ver detalle
                    </button>
                    {!yaPost ? (
                      <button
                        onClick={() => handlePostularse(plaza)}
                        disabled={postulando === plaza.id}
                        style={{
                          padding: '0.5rem 1rem',
                          background: postulando === plaza.id ? '#a8d5be' : 'linear-gradient(135deg, #1a5c32, #27ae60)',
                          color: 'white', border: 'none', borderRadius: '0.65rem',
                          fontSize: '0.78rem', fontWeight: 700, cursor: postulando === plaza.id ? 'not-allowed' : 'pointer',
                          boxShadow: postulando === plaza.id ? 'none' : '0 3px 10px rgba(39,174,96,0.3)',
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                        }}
                      >
                        {postulando === plaza.id ? 'Enviando...' : 'Postularme'}
                      </button>
                    ) : (
                      <span style={{ padding: '0.5rem 1rem', background: '#d1fae5', color: '#065f46', borderRadius: '0.65rem', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle size={14} />Postulado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
