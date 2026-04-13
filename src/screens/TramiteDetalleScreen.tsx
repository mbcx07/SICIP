import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { X, Clock, CheckCircle2, ArrowLeft, Info, Printer, AlertTriangle } from 'lucide-react';
import { getTramite, getHistorial, cambiarEstatus } from '../services/firebase';
import type { Tramite, HistorialEstado, Usuario } from '../types/sicip';
import { Estatus, Rol } from '../types/sicip';
import { ESTATUS_LABELS, COLOR_ESTATUS, TIPO_TRAMITE_LABELS } from '../constants/sicip';
import { formatFecha, formatFechaTime, diasRestantes, colorPorDiasRestantes, estaVencido, hoy } from '../utils/sicip';
import { tramiteToTEDatos, printTEPDF } from '../utils/generateTEPDF';

const ACTION_MAP: Record<string, Estatus> = {
  recibir: Estatus.RECIBIDO,
  validar: Estatus.VALIDADO,
  observar: Estatus.OBSERVADO,
  devolver: Estatus.DEVUELTO,
  rechazar: Estatus.RECHAZADO,
  enviar_delegacion: Estatus.ENVIADO_DELEGACION,
  pendiente_pago: Estatus.PENDIENTE_PAGO,
  concluido: Estatus.CONCLUIDO,
};

export default function TramiteDetalleScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user: Usuario }>();
  const [tramite, setTramite] = useState<Tramite | null>(null);
  const [historial, setHistorial] = useState<HistorialEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [t, h] = await Promise.all([getTramite(id), getHistorial(id)]);
        setTramite(t);
        setHistorial(h);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleAction = async (action: Estatus) => {
    if (!tramite || !user) return;
    setSaving(true);
    try {
      await cambiarEstatus(tramite.id, action, user.uid, user.nombre, obs);
      setTramite(prev => prev ? { ...prev, estatus: action, estatusAnterior: prev.estatus } : null);
      const h = await getHistorial(tramite.id);
      setHistorial(h);
      setObs('');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #c8e6c9', borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!tramite) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
      Trámite no encontrado.{' '}
      <button onClick={() => navigate(-1)} style={{ color: '#005235', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Regresar</button>
    </div>
  );

  const puedeRecibir = user && (user.rol === Rol.AREA_PERSONAL || user.rol === Rol.ADMIN);
  const puedeValidar = user && (user.rol === Rol.AREA_PERSONAL || user.rol === Rol.ADMIN);
  const dLeft = tramite.fechaLimiteEntrega ? diasRestantes(tramite.fechaLimiteEntrega) : null;

  const getNextActions = () => {
    switch (tramite.estatus) {
      case Estatus.GENERADO:
        return puedeRecibir ? [{ key: 'recibir', label: 'Marcar Recibido', color: '#8b5cf6' }] : [];
      case Estatus.PENDIENTE_ENTREGA:
        return puedeRecibir ? [{ key: 'recibir', label: 'Marcar Recibido', color: '#8b5cf6' }] : [];
      case Estatus.RECIBIDO:
      case Estatus.EN_REVISION:
        return puedeValidar ? [
          { key: 'validar', label: 'Validar', color: '#10b981' },
          { key: 'observar', label: 'Observar', color: '#f97316' },
          { key: 'devolver', label: 'Devolver', color: '#ef4444' },
        ] : [];
      case Estatus.VALIDADO:
        return puedeValidar ? [{ key: 'enviar_delegacion', label: 'Enviar a Delegación', color: '#0ea5e9' }] : [];
      case Estatus.ENVIADO_DELEGACION:
      case Estatus.EN_ANALISIS:
        return puedeValidar ? [
          { key: 'pendiente_pago', label: 'Marcar Pendiente Pago', color: '#eab308' },
          { key: 'concluido', label: 'Concluir', color: '#22c55e' },
        ] : [];
      default: return [];
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '0.6rem', padding: '0.5rem', cursor: 'pointer', color: '#666' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{TIPO_TRAMITE_LABELS[tramite.tipo]}</h2>
            <p style={{ margin: '0.15rem 0 0', fontFamily: 'monospace', fontSize: '0.82rem', color: '#888' }}>{tramite.folio}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {(tramite.tipo === 'TIEMPO_EXTRAORDINARIO' || tramite.tipo === 'GUARDIA_FESTIVA') && (
            <button
              onClick={() => printTEPDF(tramiteToTEDatos(tramite), tramite.folio)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', background: '#005235', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              <Printer size={14} /> Imprimir Formato
            </button>
          )}
          <span style={{ fontSize: '0.75rem', fontWeight: 700, background: COLOR_ESTATUS[tramite.estatus] + '22', color: COLOR_ESTATUS[tramite.estatus], padding: '0.25rem 0.7rem', borderRadius: '999px' }}>
            {ESTATUS_LABELS[tramite.estatus]}
          </span>
          {dLeft !== null && (
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: colorPorDiasRestantes(dLeft) }}>
              {estaVencido(tramite.fechaLimiteEntrega!) ? `${Math.abs(dLeft)}d venc` : `${dLeft}d`}
            </span>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', fontWeight: 700, marginBottom: '0.15rem' }}>Trabajador</div>{tramite.trabajadorNombre}</div>
          <div><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', fontWeight: 700, marginBottom: '0.15rem' }}>Matrícula</div>{tramite.trabajadorMatricula}</div>
          <div><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', fontWeight: 700, marginBottom: '0.15rem' }}>Unidad</div>{tramite.unidadClave} — {tramite.unidadNombre}</div>
          <div><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', fontWeight: 700, marginBottom: '0.15rem' }}>Fecha creación</div>{formatFechaTime(tramite.fechaCreacion)}</div>
          {tramite.fechaIncidencia && <div><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', fontWeight: 700, marginBottom: '0.15rem' }}>Fecha incidencia</div>{formatFecha(tramite.fechaIncidencia)}</div>}
          {tramite.fechaLimiteEntrega && <div><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', fontWeight: 700, marginBottom: '0.15rem' }}>Fecha límite</div>{formatFecha(tramite.fechaLimiteEntrega)}</div>}
        </div>
        {((tramite.datos as any)?.motivo) && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#999', fontWeight: 700, marginBottom: '0.15rem' }}>Motivo</div>
            {(tramite.datos as any).motivo}
          </div>
        )}
      </div>

      {/* Vencido alert */}
      {dLeft !== null && estaVencido(tramite.fechaLimiteEntrega!) && tramite.estatus !== Estatus.CONCLUIDO && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem', display: 'flex', gap: '0.5rem', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
          <AlertTriangle size={18} />Este trámite está vencido. Atiende urgentemente.
        </div>
      )}

      {/* Actions */}
      {getNextActions().length > 0 && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', color: '#999' }}>Observaciones</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Agrega una observación (opcional)..."
            style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: '0.6rem', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.75rem', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {getNextActions().map(a => (
              <button key={a.key} onClick={() => handleAction(ACTION_MAP[a.key])} disabled={saving}
                style={{ padding: '0.6rem 1rem', background: a.color, color: 'white', border: 'none', borderRadius: '0.6rem', fontSize: '0.85rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'opacity 0.15s', fontFamily: 'inherit' }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#999' }}>Historial</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {historial.map(h => (
            <div key={h.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR_ESTATUS[h.estatusNuevo] || '#94a3b8', marginTop: '0.3rem', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>{ESTATUS_LABELS[h.estatusNuevo] || h.estatusNuevo}</strong>
                  {h.estatusAnterior && <> ← {ESTATUS_LABELS[h.estatusAnterior] || h.estatusAnterior}</>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  {h.usuarioNombre} · {h.fecha} {h.hora}
                  {h.observacion && <> — {h.observacion}</>}
                </div>
              </div>
            </div>
          ))}
          {historial.length === 0 && <p style={{ color: '#999', fontSize: '0.875rem' }}>Sin cambios registrados</p>}
        </div>
      </div>
    </div>
  );
}
