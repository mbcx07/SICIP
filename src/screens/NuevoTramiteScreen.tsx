import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Check, X, AlertTriangle } from 'lucide-react';
import type { Usuario } from '../types/sicip';
import { TipoTramite } from '../types/sicip';
import { TIPO_TRAMITE_LABELS, ESTATUS_LABELS } from '../constants/sicip';
import { generateFolio, calcularFechaLimite, hoy } from '../utils/sicip';
import { crearTramite, getTipoTramiteConfig } from '../services/firebase';
import type { TipoTramiteConfig } from '../types/sicip';
import { Estatus } from '../types/sicip';

const TIPOS_DISPONIBLES = [
  { value: TipoTramite.TIEMPO_EXTRAORDINARIO, label: 'Tiempo Extraordinario' },
  { value: TipoTramite.GUARDIA_FESTIVA, label: 'Guardia Festiva' },
  { value: TipoTramite.NIVELACION, label: 'Nivelación' },
  { value: TipoTramite.SUSTITUCION, label: 'Sustitución' },
  { value: TipoTramite.SOLICITUD_CONTRATO, label: 'Solicitud de Contrato' },
  { value: TipoTramite.PASE_ENTRADA, label: 'Pase de Entrada' },
  { value: TipoTramite.PASE_SALIDA, label: 'Pase de Salida' },
  { value: TipoTramite.LICENCIA_MEDICA, label: 'Licencia Médica' },
  { value: TipoTramite.LICENCIA_SGSS, label: 'Licencia sin Goce de Sueldo' },
  { value: TipoTramite.VACACIONES, label: 'Vacaciones' },
];

export default function NuevoTramiteScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState<TipoTramite>(TipoTramite.TIEMPO_EXTRAORDINARIO);
  const [formData, setFormData] = useState({
    fechaIncidencia: hoy(),
    horaInicio: '',
    horaFin: '',
    totalHoras: 0,
    motivo: '',
    // Sustitución
    sustituidoMatricula: '',
    sustituidoNombre: '',
    // Licencia
    fechaFinLicencia: '',
    tipoLicencia: '',
    // Pase
    tipoPase: 'entrada',
    // Vacaciones
    periodoVacacional: '',
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [normativa, setNormativa] = useState<TipoTramiteConfig | null>(null);
  const [acceptedWarnings, setAcceptedWarnings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'tipo') setWarnings([]);
  };

  const handleTipo = async (t: TipoTramite) => {
    setTipo(t);
    setAcceptedWarnings(false);
    try {
      const cfg = await getTipoTramiteConfig(t);
      setNormativa(cfg);
      if (cfg?.advertencias) {
        setWarnings(cfg.advertencias);
      } else {
        const warns: string[] = [];
        if (t === TipoTramite.LICENCIA_SGSS) {
          warns.push('Esta licencia puede afectar tu salario y aguinaldo');
          warns.push('Afecta antigüedad y otras prestaciones');
        }
        if (t === TipoTramite.TIEMPO_EXTRAORDINARIO) {
          warns.push('El tiempo extraordinario requiere autorización del jefe inmediato');
        }
        setWarnings(warns);
      }
    } catch {
      setNormativa(null);
    }
  };

  const isValid = () => {
    if (!formData.fechaIncidencia || !formData.motivo.trim()) return false;
    if ((tipo === TipoTramite.TIEMPO_EXTRAORDINARIO || tipo === TipoTramite.GUARDIA_FESTIVA) && (!formData.horaInicio || !formData.horaFin)) return false;
    if (tipo === TipoTramite.SUSTITUCION && (!formData.sustituidoMatricula || !formData.sustituidoNombre)) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (warnings.length > 0 && !acceptedWarnings) return;
    setSaving(true);
    setError('');
    try {
      const folio = generateFolio(tipo, user.unidadClave || '00');
      const fechaLimite = calcularFechaLimite(formData.fechaIncidencia);
      const datos: any = { ...formData };
      await crearTramite({
        folio,
        tipo,
        estatus: Estatus.GENERADO,
        trabajadorMatricula: user.matricula || '',
        trabajadorNombre: user.nombre,
        unidadClave: user.unidadClave || '',
        unidadNombre: user.unidadNombre || '',
        fechaIncidencia: formData.fechaIncidencia,
        fechaLimiteEntrega: fechaLimite,
        datos,
        solicitanteUid: user.uid,
        solicitanteNombre: user.nombre,
        solicitanteRol: user.rol,
        fechaCreacion: new Date().toISOString(),
      archivosUrls: [],
      delegacion: '',
      });
      navigate('/tramites');
    } catch (err: any) {
      setError(err.message || 'Error al crear el trámite');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{ background: 'var(--surface-soft)', border: 'none', borderRadius: '0.6rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Nueva Solicitud</h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Paso {step} de 3</p>
            </div>
          </div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {/* Step 1: Tipo */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem', fontWeight: 600 }}>Selecciona el tipo de solicitud</p>
            {TIPOS_DISPONIBLES.map(t => (
              <button key={t.value} onClick={() => handleTipo(t.value)}
                style={{
                  padding: '0.9rem 1rem', cursor: 'pointer', border: tipo === t.value ? '2px solid var(--brand-600)' : '1px solid var(--border-soft)',
                  borderRadius: '0.75rem', textAlign: 'left', background: tipo === t.value ? 'var(--brand-50)' : 'white',
                  fontSize: '0.9rem', fontWeight: tipo === t.value ? 700 : 500, color: tipo === t.value ? 'var(--brand-700)' : 'var(--text-primary)',
                  transition: 'all 0.15s'
                }}>
                {t.label}
              </button>
            ))}
            <button onClick={() => setStep(2)} className="btn-institutional" style={{ marginTop: '0.5rem' }}>
              Continuar <ChevronRight size={16} style={{ display: 'inline' }} />
            </button>
          </div>
        )}

        {/* Step 2: Datos */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>Fecha de incidencia *</label>
                <input type="date" value={formData.fechaIncidencia} onChange={e => handleChange('fechaIncidencia', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.6rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>Unidad</label>
                <input type="text" value={`${user.unidadClave} - ${user.unidadNombre}`} disabled style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.6rem', fontSize: '0.875rem', background: 'var(--surface-soft)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {(tipo === TipoTramite.TIEMPO_EXTRAORDINARIO || tipo === TipoTramite.GUARDIA_FESTIVA) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>Hora inicio *</label>
                  <input type="time" value={formData.horaInicio} onChange={e => handleChange('horaInicio', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.6rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>Hora fin *</label>
                  <input type="time" value={formData.horaFin} onChange={e => handleChange('horaFin', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.6rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>Total hrs</label>
                  <input type="number" value={formData.totalHoras} onChange={e => handleChange('totalHoras', Number(e.target.value))} min={0} step={0.5} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.6rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {tipo === TipoTramite.SUSTITUCION && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>Matrícula sustituido *</label>
                  <input type="text" value={formData.sustituidoMatricula} onChange={e => handleChange('sustituidoMatricula', e.target.value)} placeholder="000000" style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.6rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre sustituido *</label>
                  <input type="text" value={formData.sustituidoNombre} onChange={e => handleChange('sustituidoNombre', e.target.value)} placeholder="Nombre completo" style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.6rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>Motivo / Justificación *</label>
              <textarea value={formData.motivo} onChange={e => handleChange('motivo', e.target.value)} rows={3} placeholder="Describe el motivo de la solicitud..."
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-soft)', borderRadius: '0.6rem', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button onClick={() => setStep(3)} className="btn-institutional" disabled={!isValid()}>
              Continuar <ChevronRight size={16} style={{ display: 'inline' }} />
            </button>
          </div>
        )}

        {/* Step 3: Confirmación */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--surface-soft)', borderRadius: '0.75rem', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Resumen</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.875rem' }}>
                <div><strong>Tipo:</strong> {TIPO_TRAMITE_LABELS[tipo]}</div>
                <div><strong>Fecha:</strong> {formData.fechaIncidencia}</div>
                <div><strong>Unidad:</strong> {user.unidadClave}</div>
                <div><strong>Solicitante:</strong> {user.nombre}</div>
              </div>
              {formData.motivo && <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}><strong>Motivo:</strong> {formData.motivo}</div>}
            </div>

            {normativa?.fundamento && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '0.85rem 1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#1d4ed8' }}>Fundamento Legal</h4>
                <div style={{ fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5 }}>
                  {normativa.fundamento.articulo && <div><strong>Art.</strong> {normativa.fundamento.articulo}</div>}
                  {normativa.fundamento.clausula && <div><strong>Cláusula:</strong> {normativa.fundamento.clausula}</div>}
                  {normativa.fundamento.numeral && <div><strong>Numeral:</strong> {normativa.fundamento.numeral}</div>}
                  {normativa.fundamento.texto && <div style={{ marginTop: '0.3rem' }}>{normativa.fundamento.texto}</div>}
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {warnings.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.6rem', padding: '0.6rem 0.85rem', color: '#92400e', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} />{w}
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={acceptedWarnings} onChange={e => setAcceptedWarnings(e.target.checked)} />
                  He leído y acepto las advertencias
                </label>
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.6rem', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(2)} className="btn-institutional" style={{ flex: 1, background: 'var(--surface-soft)', color: 'var(--text-muted)' }}>Atrás</button>
              <button onClick={handleSubmit} disabled={saving || (warnings.length > 0 && !acceptedWarnings)}
                style={{ flex: 2, padding: '0.75rem', background: saving ? 'var(--brand-300)' : 'var(--brand-600)', color: 'white', border: 'none', borderRadius: '0.65rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                {saving ? 'Guardando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
