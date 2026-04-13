import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Briefcase, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { getPlazasAbiertas, getPostulacionPorTrabajadorYPlaza, crearPostulacion } from '../services/reemplazos';
import type { PlazaReemplazo, PostulacionReemplazo } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';

const MOTIVO_LABEL: Record<string, string> = {
  LICENCIA: 'Licencia', INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones', COMISION: 'Comisión', OTRO: 'Otro',
};
const STATUS_COLOR: Record<string, string> = {
  ABIERTA: '#f59e0b', CUBIERTA: '#10b981', CANCELADA: '#94a3b8',
};

export default function ExplorarPlazasScreen() {
  const navigate = useNavigate();
  const [plazas, setPlazas] = useState<PlazaReemplazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [postulacionMap, setPostulacionMap] = useState<Record<string, PostulacionReemplazo>>({});
  const [postingPlazaId, setPostingPlazaId] = useState<string | null>(null);

  const usuario: Usuario | null = (() => {
    try { return JSON.parse(sessionStorage.getItem('sicip_usuario') || 'null'); } catch { return null; }
  })();

  useEffect(() => {
    if (!usuario) { navigate('/login'); return; }
    cargarPlazas();
  }, []);

  const cargarPlazas = async () => {
    setLoading(true);
    try {
      const ps = await getPlazasAbiertas();
      setPlazas(ps);
      // Cargar postulación del usuario actual para cada plaza
      const map: Record<string, PostulacionReemplazo> = {};
      for (const p of ps) {
        if (usuario) {
          try {
            const post = await getPostulacionPorTrabajadorYPlaza(p.id, usuario.matricula);
            if (post) map[p.id] = post;
          } catch { /* no postulacion */ }
        }
      }
      setPostulacionMap(map);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostularse = async (plazaId: string) => {
    if (!usuario) return;
    if (!window.confirm('¿Postularse a esta plaza?')) return;
    setPostingPlazaId(plazaId);
    try {
      await crearPostulacion({
        cuadroId: plazaId,
        plazaId,
        trabajadorMatricula: usuario.matricula,
        trabajadorNombre: usuario.nombre,
        unidadClave: usuario.unidadClave || '',
        unidadNombre: usuario.unidadNombre || '',
        status: 'PENDIENTE',
        fechaPostulacion: new Date().toISOString(),
      });
      await cargarPlazas();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPostingPlazaId(null);
    }
  };

  const filtered = plazas.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.nombrePlaza.toLowerCase().includes(s) ||
      p.clavePlaza.toLowerCase().includes(s) ||
      p.departamento.toLowerCase().includes(s) ||
      p.unidadNombre.toLowerCase().includes(s) ||
      MOTIVO_LABEL[p.motivo].toLowerCase().includes(s);
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: "3px solid '#c8e6c9'", borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#666' }}>Buscando plazas...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e' }}>
          <Users size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Plazas Disponibles
        </h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
          {plazas.length} plaza{plazas.length !== 1 ? 's' : ''} abierta{plazas.length !== 1 ? 's' : ''} · Actualizado {new Date().toLocaleDateString('es-MX')}
        </p>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Buscar por plaza, clave, departamento o motivo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 42px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: 10, color: '#dc2626', marginBottom: '1rem' }}>
          <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#f8fdfb', borderRadius: 12, border: '1px dashed #c8e6c9' }}>
          <Briefcase size={40} color="#c8e6c9" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#64748b', margin: 0 }}>
            {search ? 'No hay plazas que coincidan con tu búsqueda' : 'No hay plazas abiertas en este momento'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(plaza => {
            const miPostulacion = postulacionMap[plaza.id];
            const yaPostulado = !!miPostulacion;
            return (
              <div key={plaza.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {/* Header tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a1a2e' }}>{plaza.nombrePlaza}</h3>
                    <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.8rem' }}>{plaza.clavePlaza} · {plaza.categoria}</p>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, background: STATUS_COLOR[plaza.status] + '22', color: STATUS_COLOR[plaza.status], fontWeight: 600, fontSize: '0.75rem', flexShrink: 0, marginLeft: 12 }}>
                    {plaza.status}
                  </span>
                </div>

                {/* Detalles */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: '0.8rem' }}>
                    <MapPin size={14} /> {plaza.unidadNombre}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: '0.8rem' }}>
                    <Briefcase size={14} /> {MOTIVO_LABEL[plaza.motivo] || plaza.motivo}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: '0.8rem' }}>
                    <Calendar size={14} /> {plaza.fechaInicioAusencia} → {plaza.fechaFinAusencia}
                  </div>
                </div>

                {/* Habilidades */}
                {plaza.habilidadesRequeridas.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {plaza.habilidadesRequeridas.slice(0, 5).map(h => (
                      <span key={h} style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem' }}>{h}</span>
                    ))}
                  </div>
                )}

                {/* Persona ausente */}
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                  Reemplazo para: {plaza.nombreAusente} ({plaza.matriculaAusente})
                </div>

                {/* Acción */}
                {yaPostulado ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#dcfce7', borderRadius: 8, width: 'fit-content' }}>
                    <CheckCircle size={16} color="#16a34a" />
                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>Postulación {miPostulacion.status}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handlePostularse(plaza.id)}
                    disabled={postingPlazaId === plaza.id}
                    style={{ padding: '8px 18px', background: postingPlazaId === plaza.id ? '#94a3b8' : '#005235', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: postingPlazaId === plaza.id ? 'not-allowed' : 'pointer' }}
                  >
                    {postingPlazaId === plaza.id ? 'Postulando...' : 'Postularme'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
