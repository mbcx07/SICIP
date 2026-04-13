import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search, Building2, CheckCircle2, XCircle } from 'lucide-react';
import type { Usuario, Tramite } from '../types/sicip';
import { Estatus } from '../types/sicip';
import { ESTATUS_LABELS, COLOR_ESTATUS, TIPO_TRAMITE_LABELS } from '../constants/sicip';
import { formatFecha, diasRestantes as getDiasRestantes, colorPorDiasRestantes } from '../utils/sicip';
import { getTramitesByUnidad, cambiarEstatus } from '../services/firebase';

export default function RecepcionesScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchTramites = async () => {
      setLoading(true);
      try {
        const data = await getTramitesByUnidad(user.unidadClave || '', 200);
        setTramites(data.filter(t =>
          t.estatus === Estatus.GENERADO || t.estatus === Estatus.PENDIENTE_ENTREGA
        ));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchTramites();
  }, [user.unidadClave]);

  const handleRecibir = async (t: Tramite) => {
    setSaving(t.id);
    try {
      await cambiarEstatus(t.id, Estatus.RECIBIDO, user.uid, user.nombre, 'Recibido en área de personal');
      setTramites(prev => prev.filter(x => x.id !== t.id));
    } catch (e) { console.error(e); }
    finally { setSaving(null); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #c8e6c9', borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Recepciones</h2>
        <p style={{ margin: '0.2rem 0 0', color: '#888', fontSize: '0.8rem' }}>
          Trámites pendientes de recibir en {user.unidadNombre}
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              {['Folio', 'Tipo', 'Trabajador', 'Fecha', 'Estado', 'Vence', 'Acción'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#888', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tramites.map(t => {
              const dLeft = t.fechaLimiteEntrega ? getDiasRestantes(t.fechaLimiteEntrega) : null;
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700 }}>{t.folio}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{TIPO_TRAMITE_LABELS[t.tipo] || t.tipo}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{t.trabajadorNombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#888' }}>{formatFecha(t.fechaCreacion)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: COLOR_ESTATUS[t.estatus] + '22', color: COLOR_ESTATUS[t.estatus], padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                      {ESTATUS_LABELS[t.estatus]}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {dLeft !== null && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colorPorDiasRestantes(dLeft) }}>{dLeft}d</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button onClick={() => handleRecibir(t)} disabled={saving === t.id}
                      style={{ padding: '0.4rem 0.8rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 700, cursor: saving === t.id ? 'not-allowed' : 'pointer', opacity: saving === t.id ? 0.6 : 1 }}>
                      {saving === t.id ? '...' : 'Recibir'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {tramites.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#888' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4, color: '#22c55e' }} />
                Sin trámites por recibir
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
