// ============================================================
// SICIP — App Principal
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// Firebase
import {
  loginWithEmail,
  logout,
  onAuthChange,
  getUsuario,
} from './services/firebase';
import type { Usuario } from './types/sicip';
import { Rol, Estatus, TipoTramite } from './types/sicip';

// Icons
import {
  LayoutDashboard, FileText, Search, PlusCircle, CheckCircle2,
  XCircle, Clock, ChevronRight, ArrowLeft, ShieldCheck, Printer,
  LogOut, Users, Settings, Upload, Bell, AlertTriangle,
  ClipboardList, Briefcase, Calendar, Building2, ChevronDown,
  Eye, EyeOff, Download, Filter, RefreshCw, User, ArrowRight,
  X, Check, Info
} from 'lucide-react';

// Constants
import {
  ROL_LABELS,
  ESTATUS_LABELS,
  COLOR_ESTATUS,
  TIPO_TRAMITE_LABELS,
  TABS_BY_ROLES,
  MODULO_BY_TIPO,
  PLAZO_ENTREGA_DEFAULT_DIAS,
  INSTITUCION_NOMBRE,
  OOAD_NOMBRE,
} from './constants/sicip';

// Utils
import {
  generateFolio,
  calcularFechaLimite,
  diasRestantes,
  estaVencido,
  formatFecha,
  formatFechaTime,
  hoy,
  colorPorDiasRestantes,
  diasRestantes as getDiasRestantes,
} from './utils/sicip';

// ─── Sub-components ─────────────────────────────────────

// Status Badge
const StatusBadge: React.FC<{ estatus: Estatus }> = ({ estatus }) => (
  <span
    className="status-chip"
    style={{ backgroundColor: COLOR_ESTATUS[estatus] + '22', color: COLOR_ESTATUS[estatus], border: `1px solid ${COLOR_ESTATUS[estatus]}44` }}
  >
    {ESTATUS_LABELS[estatus]}
  </span>
);

// Alert Banner
const AlertBanner: React.FC<{ message: string; type: 'warn' | 'error' | 'info' }> = ({ message, type }) => {
  const colors = { warn: '#f59e0b', error: '#ef4444', info: '#3b82f6' };
  return (
    <div style={{ background: colors[type] + '18', border: `1px solid ${colors[type]}44`, borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors[type], fontSize: '0.875rem', fontWeight: 500 }}>
      <AlertTriangle size={16} />
      {message}
    </div>
  );
};

// ─── Login Screen ────────────────────────────────────────
const LoginScreen: React.FC<{ onLogin: (u: Usuario) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			console.log("[LOGIN]Intentando login con:", email);
			console.log("[LOGIN]Llamando loginWithEmail...");
			const firebaseUser = await loginWithEmail(email, password);
			const u = await getUsuario(firebaseUser.uid);
			if (u && u.activo) {
				onLogin(u);
			} else {
				setError('Usuario no encontrado o inactivo');
			}
		} catch (err: any) {
			console.error('Login error:', err.code, err.message);
			setError(err.code === 'auth/invalid-credential' ? 'Correo o contraseña incorrectos' : (err.message || 'Error al iniciar sesión'));
		} finally {
			setLoading(false);
		}
	};

  return (
    <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="institutional-card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, background: 'var(--brand-600)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-700)', margin: 0 }}>SICIP</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {INSTITUCION_NOMBRE}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{OOAD_NOMBRE}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="field-label">Correo electrónico</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@imss.gob.mx"
              required
            />
          </div>
          <div>
            <label className="field-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-institutional" disabled={loading} style={{ height: '2.75rem', marginTop: '0.5rem' }}>
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ¿Olvidaste tu contraseña? Contacta al área de personal.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────
const Dashboard: React.FC<{
  user: Usuario;
  tramites: any[];
  stats: { total: number; porEstatus: Record<string, number>; vencidos: number; pendientes: number };
}> = ({ user, tramites, stats }) => {
  const esAdmin = user.rol === Rol.ADMIN || user.rol === Rol.AREA_PERSONAL;

  const quickStats = [
    { label: 'Total trámites', value: stats.total, color: 'var(--brand-600)', icon: FileText },
    { label: 'Pendientes', value: stats.pendientes, color: '#f59e0b', icon: Clock },
    { label: 'Vencidos', value: stats.vencidos, color: '#ef4444', icon: AlertTriangle },
    { label: 'Concluidos', value: stats.porEstatus['CONCLUIDO'] || 0, color: '#22c55e', icon: CheckCircle2 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Bienvenido, {user.nombre}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {ROL_LABELS[user.rol]} · {user.unidadNombre || 'Sin unidad asignada'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{hoy()}</span>
        </div>
      </div>

      {/* Alerts */}
      {stats.vencidos > 0 && (
        <AlertBanner type="error" message={`Tienes ${stats.vencidos} trámite(s) vencido(s). Revisa y entrega urgentemente.`} />
      )}

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {quickStats.map((s) => (
          <div key={s.label} className="institutional-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="institutional-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Trámites por estado
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(stats.porEstatus).filter(([,v]) => v > 0).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-soft)', borderRadius: '999px', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_ESTATUS[k as Estatus] || '#94a3b8' }} />
              <span style={{ fontWeight: 600 }}>{v}</span>
              <span style={{ color: 'var(--text-muted)' }}>{ESTATUS_LABELS[k as Estatus] || k}</span>
            </div>
          ))}
          {Object.entries(stats.porEstatus).filter(([,v]) => Number(v) > 0).length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin trámites registrados</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="institutional-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Actividad reciente
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tramites.slice(0, 5).map((t: any) => {
            const dLeft = t.fechaLimiteEntrega ? diasRestantes(t.fechaLimiteEntrega) : null;
            return (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-soft)', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{TIPO_TRAMITE_LABELS[t.tipo]}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.folio} · {t.trabajadorNombre}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <StatusBadge estatus={t.estatus} />
                  {dLeft !== null && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: colorPorDiasRestantes(dLeft) }}>
                      {dLeft < 0 ? `Vencido ${Math.abs(dLeft)}d` : `${dLeft}d restantes`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {tramites.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>Sin actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Solicitud Form ────────────────────────────────────────
const SolicitudForm: React.FC<{
  user: Usuario;
  tipoInicial?: TipoTramite;
  onClose: () => void;
  onSubmit: (data: any) => void;
}> = ({ user, tipoInicial, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState<TipoTramite>(tipoInicial || (user.rol === Rol.JEFE_SERVICIO ? 2 as any : 0 as any));
  const [formData, setFormData] = useState<Record<string, any>>({
    fechaIncidencia: hoy(),
    motivo: '',
    horaInicio: '',
    horaFin: '',
    dias: 1,
    totalHoras: 0,
    // Defaults
    solicitaRol: user.rol,
    unidadClave: user.unidadClave || '',
    unidadNombre: user.unidadNombre || '',
    trabajadorMatricula: user.matricula || '',
    trabajadorNombre: user.nombre,
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [acceptedWarnings, setAcceptedWarnings] = useState(false);

  const tiposDisponibles = [
    { value: TipoTramite.TIEMPO_EXTRAORDINARIO, label: 'Tiempo Extraordinario' },
    { value: TipoTramite.GUARDIA_FESTIVA, label: 'Guardia Festiva' },
    { value: TipoTramite.NIVELACION, label: 'Nivelación' },
    { value: TipoTramite.SUSTITUCION, label: 'Sustitución' },
    { value: TipoTramite.SOLICITUD_CONTRATO, label: 'Solicitud de Contrato' },
  ];

  const handleTipoChange = (t: TipoTramite) => {
    setTipo(t);
    setWarnings([]);
    setAcceptedWarnings(false);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const computeWarnings = () => {
    const warns: string[] = [];
    if (tipo === TipoTramite.LICENCIA_SGSS) {
      warns.push('Esta solicitud puede afectar tu salario');
      warns.push('Puede afectar tu aguinaldo');
      warns.push('Afecta antigüedad y otras prestaciones');
    }
    if (tipo === TipoTramite.TIEMPO_EXTRAORDINARIO) {
      warns.push('El tiempo extraordinario requiere autorización del jefe inmediato');
      warns.push('No procede si ya se cubrió el presupuesto autorizado');
    }
    setWarnings(warns);
  };

  useEffect(() => {
    computeWarnings();
  }, [tipo]);

  const handleSubmit = () => {
    if (warnings.length > 0 && !acceptedWarnings) return;
    onSubmit({ tipo, datos: formData });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {Number(step) > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-institutional" style={{ padding: '0.5rem', borderRadius: '0.75rem', background: 'var(--surface-soft)', color: 'var(--text-muted)' }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Nueva Solicitud</h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paso {step} de 3</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
      </div>

      {/* Step 1: Tipo */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label className="field-label">Tipo de solicitud</label>
          {tiposDisponibles.map(t => (
            <button
              key={t.value}
              onClick={() => handleTipoChange(t.value)}
              className="institutional-card"
              style={{
                padding: '1rem 1.25rem',
                cursor: 'pointer',
                border: tipo === t.value ? '2px solid var(--brand-600)' : '1px solid var(--border-soft)',
                textAlign: 'left',
                background: tipo === t.value ? 'var(--brand-050)' : 'white',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: tipo === t.value ? 'var(--brand-700)' : 'var(--text-primary)' }}>
                {t.label}
              </div>
            </button>
          ))}
          <button onClick={() => setStep(2)} className="btn-institutional" style={{ marginTop: '0.5rem' }}>
            Continuar <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
      )}

      {/* Step 2: Datos */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="field-label">Fecha de incidencia *</label>
              <input type="date" className="form-input" value={formData.fechaIncidencia} onChange={e => handleChange('fechaIncidencia', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Unidad *</label>
              <input type="text" className="form-input" value={formData.unidadClave} onChange={e => handleChange('unidadClave', e.target.value)} placeholder="Ej: 03HD01" />
            </div>
          </div>

          {(tipo === TipoTramite.TIEMPO_EXTRAORDINARIO || tipo === TipoTramite.GUARDIA_FESTIVA) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="field-label">Hora inicio *</label>
                <input type="time" className="form-input" value={formData.horaInicio} onChange={e => handleChange('horaInicio', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Hora fin *</label>
                <input type="time" className="form-input" value={formData.horaFin} onChange={e => handleChange('horaFin', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Total horas</label>
                <input type="number" className="form-input" value={formData.totalHoras} onChange={e => handleChange('totalHoras', Number(e.target.value))} min={0} step={0.5} />
              </div>
            </div>
          )}

          {tipo === TipoTramite.SUSTITUCION && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="field-label">Matrícula del sustituido *</label>
                <input type="text" className="form-input" value={formData.trabajadorSustituidoMatricula || ''} onChange={e => handleChange('trabajadorSustituidoMatricula', e.target.value)} placeholder="000000" />
              </div>
              <div>
                <label className="field-label">Nombre del sustituido *</label>
                <input type="text" className="form-input" value={formData.trabajadorSustituidoNombre || ''} onChange={e => handleChange('trabajadorSustituidoNombre', e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className="field-label">Motivo / Justificación *</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.motivo}
              onChange={e => handleChange('motivo', e.target.value)}
              placeholder="Describe el motivo de la solicitud..."
            />
          </div>

          <button onClick={() => setStep(3)} className="btn-institutional" disabled={!formData.fechaIncidencia || !formData.motivo}>
            Continuar <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
      )}

      {/* Step 3: Confirmación */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Resumen */}
          <div className="institutional-card-soft" style={{ padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Resumen de la solicitud</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><strong>Tipo:</strong> {TIPO_TRAMITE_LABELS[tipo]}</div>
              <div><strong>Fecha:</strong> {formatFecha(formData.fechaIncidencia)}</div>
              <div><strong>Unidad:</strong> {formData.unidadClave}</div>
              <div><strong>Solicitante:</strong> {formData.trabajadorNombre}</div>
            </div>
            {formData.motivo && <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}><strong>Motivo:</strong> {formData.motivo}</div>}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {warnings.map((w, i) => (
                <AlertBanner key={i} type="warn" message={w} />
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                <input type="checkbox" checked={acceptedWarnings} onChange={e => setAcceptedWarnings(e.target.checked)} />
                He leído y acepto las advertencias indicated above
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} className="btn-institutional" style={{ flex: 1, background: 'var(--surface-soft)', color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} className="btn-institutional" style={{ flex: 2 }} disabled={warnings.length > 0 && !acceptedWarnings}>
              <Check size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Enviar Solicitud
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Bandeja de Trámites ──────────────────────────────────
const BandejaTramites: React.FC<{
  user: Usuario;
  tramites: any[];
  onSelect: (t: any) => void;
  soloMisTramites?: boolean;
}> = ({ user, tramites, onSelect, soloMisTramites }) => {
  const [filtro, setFiltro] = useState<Estatus | 'TODOS'>('TODOS');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return tramites.filter((t: any) => {
      const matchFiltro = filtro === 'TODOS' || t.estatus === filtro;
      const matchSearch = !search ||
        t.folio?.toLowerCase().includes(search.toLowerCase()) ||
        t.trabajadorNombre?.toLowerCase().includes(search.toLowerCase()) ||
        TIPO_TRAMITE_LABELS[t.tipo]?.toLowerCase().includes(search.toLowerCase());
      return matchFiltro && matchSearch;
    });
  }, [tramites, filtro, search]);

  const statusOptions: (Estatus | 'TODOS')[] = ['TODOS', Estatus.GENERADO, Estatus.PENDIENTE_ENTREGA, Estatus.RECIBIDO, Estatus.EN_REVISION, Estatus.VALIDADO, Estatus.DEVUELTO, Estatus.RECHAZADO, Estatus.ENVIADO_DELEGACION, Estatus.PENDIENTE_PAGO, Estatus.CONCLUIDO, Estatus.VENCIDO];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por folio, nombre o tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input" value={filtro} onChange={e => setFiltro(e.target.value as any)} style={{ minWidth: 180 }}>
          {statusOptions.map(s => (
            <option key={s} value={s}>{s === 'TODOS' ? 'Todos los estados' : ESTATUS_LABELS[s as Estatus]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="institutional-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Folio</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trabajador</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vence</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t: any) => {
              const dLeft = t.fechaLimiteEntrega ? getDiasRestantes(t.fechaLimiteEntrega) : null;
              const vencido = dLeft !== null && estaVencido(t.fechaLimiteEntrega);
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }} onClick={() => onSelect(t)}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{t.folio}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{TIPO_TRAMITE_LABELS[t.tipo] || t.tipo}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{t.trabajadorNombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{formatFecha(t.fechaCreacion)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><StatusBadge estatus={t.estatus} /></td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {dLeft !== null ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colorPorDiasRestantes(dLeft) }}>
                        {vencido ? `Vencido ${Math.abs(dLeft)}d` : `${dLeft}d`}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--brand-600)' }}><ChevronRight size={16} /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Sin trámites que mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Detalle de Trámite ────────────────────────────────────
const TramiteDetail: React.FC<{
  tramite: any;
  user: Usuario;
  onClose: () => void;
  onAction: (action: string, obs?: string) => void;
  historial: any[];
}> = ({ tramite, user, onClose, onAction, historial }) => {
  const [obs, setObs] = useState('');
  const puedeRecibir = user.rol === Rol.AREA_PERSONAL || user.rol === Rol.ADMIN;
  const puedeValidar = user.rol === Rol.AREA_PERSONAL || user.rol === Rol.ADMIN;
  const puedeEnviar = user.rol === Rol.AREA_PERSONAL || user.rol === Rol.ADMIN;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{TIPO_TRAMITE_LABELS[tramite.tipo]}</h2>
          <p style={{ margin: '0.2rem 0 0', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tramite.folio}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <StatusBadge estatus={tramite.estatus} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
      </div>

      {/* Info Card */}
      <div className="institutional-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Trabajador</strong><br />{tramite.trabajadorNombre}</div>
          <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Matrícula</strong><br />{tramite.trabajadorMatricula}</div>
          <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Unidad</strong><br />{tramite.unidadClave} — {tramite.unidadNombre}</div>
          <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Fecha creación</strong><br />{formatFechaTime(tramite.fechaCreacion)}</div>
          {tramite.fechaIncidencia && <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Fecha incidencia</strong><br />{formatFecha(tramite.fechaIncidencia)}</div>}
          {tramite.fechaLimiteEntrega && <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Fecha límite</strong><br />{formatFecha(tramite.fechaLimiteEntrega)}</div>}
        </div>
        {tramite.datos?.motivo && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--surface-soft)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
            <strong style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Motivo</strong><br />{tramite.datos.motivo}
          </div>
        )}
        {(tramite.motivoRechazo || tramite.motivoDevolucion) && (
          <AlertBanner type="error" message={tramite.motivoRechazo || tramite.motivoDevolucion} />
        )}
      </div>

      {/* Actions */}
      {(puedeRecibir || puedeValidar || puedeEnviar) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label className="field-label">Observaciones</label>
          <textarea className="form-input" rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Agrega una observación (opcional)..." />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {tramite.estatus === Estatus.GENERADO || tramite.estatus === Estatus.PENDIENTE_ENTREGA ? (
              <button onClick={() => onAction('RECIBIR', obs)} className="btn-institutional" style={{ background: '#8b5cf6' }}>
                <Check size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />Marcar Recibido
              </button>
            ) : null}

            {tramite.estatus === Estatus.RECIBIDO || tramite.estatus === Estatus.EN_REVISION ? (
              <>
                <button onClick={() => onAction('VALIDAR', obs)} className="btn-institutional" style={{ background: '#10b981' }}>
                  <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />Validar
                </button>
                <button onClick={() => onAction('OBSERVAR', obs)} className="btn-institutional" style={{ background: '#f97316' }}>
                  <Info size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />Observar
                </button>
                <button onClick={() => onAction('DEVUELTO', obs)} className="btn-institutional" style={{ background: '#ef4444' }}>
                  <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />Devolver
                </button>
              </>
            ) : null}

            {tramite.estatus === Estatus.VALIDADO ? (
              <button onClick={() => onAction('ENVIAR_DELEGACION', obs)} className="btn-institutional" style={{ background: '#0ea5e9' }}>
                <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />Enviar a Delegación
              </button>
            ) : null}

            {tramite.estatus === Estatus.ENVIADO_DELEGACION || tramite.estatus === Estatus.EN_ANALISIS ? (
              <>
                <button onClick={() => onAction('PENDIENTE_PAGO', obs)} className="btn-institutional" style={{ background: '#eab308' }}>
                  <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />Marcar Pendiente Pago
                </button>
                <button onClick={() => onAction('CONCLUIDO', obs)} className="btn-institutional" style={{ background: '#22c55e' }}>
                  <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />Concluir
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="institutional-card" style={{ padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Historial</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {historial.map((h: any) => (
            <div key={h.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_ESTATUS[h.estatusNuevo] || '#94a3b8', marginTop: '0.35rem', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>{ESTATUS_LABELS[h.estatusNuevo] || h.estatusNuevo}</strong>
                  {h.estatusAnterior && <> ← {ESTATUS_LABELS[h.estatusAnterior] || h.estatusAnterior}</>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {h.usuarioNombre} · {h.fecha} {h.hora}
                  {h.observacion && <> — {h.observacion}</>}
                </div>
              </div>
            </div>
          ))}
          {historial.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin historial</p>}
        </div>
      </div>

      {/* Print Button */}
      <button className="btn-institutional" style={{ background: 'var(--surface-soft)', color: 'var(--brand-700)' }}>
        <Printer size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />Imprimir Formato
      </button>
    </div>
  );
};

// ─── Importar Plantilla ────────────────────────────────────
const ImportarPlantilla: React.FC<{ onImport: (data: any[]) => void }> = ({ onImport }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const text = await f.text();
    // Try CSV or JSON
    try {
      if (f.name.endsWith('.json')) {
        const json = JSON.parse(text);
        const data = Array.isArray(json) ? json : json.data || json.trabajadores || [];
        onImport(data);
      } else {
        // Parse CSV
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return;
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
          return obj;
        });
        onImport(rows);
      }
    } catch (err) {
      console.error('Parse error:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '2rem' }}>
      <Upload size={48} color="var(--brand-500)" />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>Importar Plantilla de Personal</h3>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Archivo CSV o JSON con columnas: matricula, nombre, apellidoPaterno, apellidoMaterno, area, unidadClave, etc.</p>
      </div>
      <label className="btn-institutional" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
        <Upload size={16} />Seleccionar archivo
        <input type="file" accept=".csv,.json" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      {file && <p style={{ color: 'var(--brand-600)', fontSize: '0.875rem', fontWeight: 600 }}>{file.name}</p>}
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tramites, setTramites] = useState<any[]>([]);
  const [selectedTramite, setSelectedTramite] = useState<any | null>(null);
  const [tramiteHistorial, setTramiteHistorial] = useState<any[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importedData, setImportedData] = useState<any[] | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const u = await getUsuario(firebaseUser.uid);
        if (u && u.activo) {
          setUser(u);
        } else {
          await logout();
          setUser(null);
          console.error('Usuario no encontrado o inactivo');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fallback: si loading dura >10s, force-cerrar
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(t);
  }, []);

  // Load tramites when user changes
  useEffect(() => {
    if (!user) return;
    // Mock data for demo — replace with Firebase calls
    const mockTramites: any[] = [
      {
        id: '1', folio: 'SICIP-03HD01-2026-TIEM-ABC12', tipo: TipoTramite.TIEMPO_EXTRAORDINARIO,
        trabajadorMatricula: '123456', trabajadorNombre: 'María López Hernández',
        unidadClave: '03HD01', unidadNombre: 'Hospital General La Paz',
        fechaCreacion: new Date().toISOString(), fechaIncidencia: hoy(),
        fechaLimiteEntrega: calcularFechaLimite(hoy()),
        estatus: Estatus.GENERADO,
        datos: { motivo: 'Cobertura de guardia por ausencia de compañero', horaInicio: '08:00', horaFin: '20:00', totalHoras: 12 },
        solicitanteUid: user.uid, solicitanteNombre: user.nombre,
      },
      {
        id: '2', folio: 'SICIP-03UM34-2026-GUAR-DEF34', tipo: TipoTramite.GUARDIA_FESTIVA,
        trabajadorMatricula: '234567', trabajadorNombre: 'Juan Pérez Ruiz',
        unidadClave: '03UM34', unidadNombre: 'UMF 34',
        fechaCreacion: new Date(Date.now() - 86400000).toISOString(),
        fechaIncidencia: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        fechaLimiteEntrega: calcularFechaLimite(new Date(Date.now() - 86400000).toISOString().split('T')[0]),
        estatus: Estatus.PENDIENTE_ENTREGA,
        datos: { motivo: 'Guardia festiva 21 de marzo', diaFestivo: '21 de Marzo' },
        solicitanteUid: 'otro', solicitanteNombre: 'Juan Pérez',
      },
      {
        id: '3', folio: 'SICIP-03HD01-2026-NIVE-GHI56', tipo: TipoTramite.NIVELACION,
        trabajadorMatricula: '345678', trabajadorNombre: 'Ana García Martínez',
        unidadClave: '03HD01', unidadNombre: 'Hospital General La Paz',
        fechaCreacion: new Date(Date.now() - 172800000).toISOString(),
        fechaIncidencia: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        estatus: Estatus.RECIBIDO,
        datos: { motivo: 'Nivelación a plaza superior categoria B a A' },
        solicitanteUid: 'otro2', solicitanteNombre: 'Ana García',
      },
    ];

    // Filter by role
    if (user.rol === Rol.TRABAJADOR) {
      setTramites(mockTramites.filter(t => t.solicitanteUid === user.uid));
    } else if (user.rol === Rol.JEFE_SERVICIO) {
      setTramites(mockTramites.filter(t => t.solicitanteUid === user.uid || t.unidadClave === user.unidadClave));
    } else {
      setTramites(mockTramites);
    }
  }, [user]);

  const stats = useMemo(() => {
    const porEstatus: Record<string, number> = {};
    let vencidos = 0, pendientes = 0;
    tramites.forEach(t => {
      porEstatus[t.estatus] = (porEstatus[t.estatus] || 0) + 1;
      if (t.estatus === Estatus.PENDIENTE_ENTREGA || t.estatus === Estatus.GENERADO) pendientes++;
      if (t.fechaLimiteEntrega && estaVencido(t.fechaLimiteEntrega) && t.estatus !== Estatus.CONCLUIDO) vencidos++;
    });
    return { total: tramites.length, porEstatus, vencidos, pendientes };
  }, [tramites]);

  const tabs = user ? TABS_BY_ROLES[user.rol] : [];

  const handleTramiteAction = async (action: string, obs?: string) => {
    if (!selectedTramite || !user) return;
    const statusMap: Record<string, Estatus> = {
      RECIBIR: Estatus.RECIBIDO,
      VALIDAR: Estatus.VALIDADO,
      OBSERVAR: Estatus.OBSERVADO,
      DEVUELTO: Estatus.DEVUELTO,
      RECHAZADO: Estatus.RECHAZADO,
      ENVIAR_DELEGACION: Estatus.ENVIADO_DELEGACION,
      PENDIENTE_PAGO: Estatus.PENDIENTE_PAGO,
      CONCLUIDO: Estatus.CONCLUIDO,
    };
    const newStatus = statusMap[action];
    if (!newStatus) return;

    setTramites(prev => prev.map(t => t.id === selectedTramite.id ? { ...t, estatus: newStatus, estatusAnterior: t.estatus } : t));
    setSelectedTramite(prev => prev ? { ...prev, estatus: newStatus, estatusAnterior: prev.estatus } : null);
    setTramiteHistorial(prev => [{
      id: Date.now().toString(),
      tramiteId: selectedTramite.id,
      estatusAnterior: selectedTramite.estatus,
      estatusNuevo: newStatus,
      usuarioUid: user.uid,
      usuarioNombre: user.nombre,
      fecha: new Date().toLocaleDateString('es-MX'),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      observacion: obs,
    }, ...prev]);
  };

  const handleNewTramite = (data: { tipo: TipoTramite; datos: any }) => {
    if (!user) return;
    const folio = generateFolio(data.tipo, user.unidadClave || '00');
    const fechaLimite = calcularFechaLimite(data.datos.fechaIncidencia || hoy());
    const newTramite = {
      id: Date.now().toString(),
      folio,
      tipo: data.tipo,
      trabajadorMatricula: user.matricula || '',
      trabajadorNombre: user.nombre,
      unidadClave: user.unidadClave || '',
      unidadNombre: user.unidadNombre || '',
      fechaCreacion: new Date().toISOString(),
      fechaIncidencia: data.datos.fechaIncidencia,
      fechaLimiteEntrega: fechaLimite,
      estatus: Estatus.GENERADO,
      datos: data.datos,
      solicitanteUid: user.uid,
      solicitanteNombre: user.nombre,
      solicitanteRol: user.rol,
    };
    setTramites(prev => [newTramite, ...prev]);
    setShowNewForm(false);
  };

  const handleImport = (data: any[]) => {
    setImportedData(data);
    setImportModal(false);
  };

  const tabsConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    dashboard: { label: 'Inicio', icon: <LayoutDashboard size={18} /> },
    mis_tramites: { label: 'Mis Trámites', icon: <FileText size={18} /> },
    nuevo_tramite: { label: 'Nueva Solicitud', icon: <PlusCircle size={18} /> },
    solicitudes: { label: 'Solicitudes', icon: <Briefcase size={18} /> },
    bandeja: { label: 'Bandeja', icon: <ClipboardList size={18} /> },
    recepciones: { label: 'Recepciones', icon: <Building2 size={18} /> },
    reportes: { label: 'Reportes', icon: <Filter size={18} /> },
    tramites: { label: 'Trámites', icon: <FileText size={18} /> },
    usuarios: { label: 'Usuarios', icon: <Users size={18} /> },
    normativa: { label: 'Normativa', icon: <ShieldCheck size={18} /> },
    plantilla: { label: 'Plantilla', icon: <Upload size={18} /> },
    config: { label: 'Configuración', icon: <Settings size={18} /> },
  };

  if (loading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--brand-200)', borderTopColor: 'var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando SICIP...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header style={{ background: 'var(--brand-700)', color: 'white', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={24} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.02em' }}>SICIP</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{OOAD_NOMBRE}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user.nombre}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{ROL_LABELS[user.rol]}</div>
          </div>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav style={{ background: 'white', borderBottom: '1px solid var(--border-soft)', display: 'flex', overflowX: 'auto', padding: '0 1rem', gap: '0.25rem' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedTramite(null); setShowNewForm(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem',
              border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              color: activeTab === tab ? 'var(--brand-700)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--brand-600)' : '2px solid transparent',
              whiteSpace: 'nowrap', background: 'none', transition: 'all 0.15s'
            }}
          >
            {tabsConfig[tab]?.icon}
            {tabsConfig[tab]?.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard user={user} tramites={tramites} stats={stats} />
        )}

        {/* Nueva Solicitud */}
        {(activeTab === 'nuevo_tramite' || showNewForm) && (
          <div className="institutional-card" style={{ padding: '1.5rem' }}>
            <SolicitudForm
              user={user}
              onClose={() => setShowNewForm(false)}
              onSubmit={handleNewTramite}
            />
          </div>
        )}

        {/* Mis Trámites / Bandeja */}
        {(activeTab === 'mis_tramites' || activeTab === 'solicitudes' || activeTab === 'bandeja' || activeTab === 'tramites') && (
          <BandejaTramites
            user={user}
            tramites={tramites}
            onSelect={t => {
              setSelectedTramite(t);
              // Mock historial
              setTramiteHistorial([{
                id: '1',
                tramiteId: t.id,
                estatusNuevo: Estatus.GENERADO,
                usuarioNombre: t.solicitanteNombre,
                fecha: formatFecha(t.fechaCreacion),
                hora: '00:00',
              }]);
            }}
            soloMisTramites={activeTab === 'mis_tramites'}
          />
        )}

        {/* Recepciones */}
        {activeTab === 'recepciones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AlertBanner type="info" message="Modulo de Recepciones — Selecciona los trámites pendientes de recibir del área de personal." />
            <BandejaTramites
              user={user}
              tramites={tramites.filter(t => t.estatus === Estatus.GENERADO || t.estatus === Estatus.PENDIENTE_ENTREGA)}
              onSelect={t => {
                setSelectedTramite(t);
                setTramiteHistorial([]);
              }}
            />
          </div>
        )}

        {/* Reportes */}
        {activeTab === 'reportes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AlertBanner type="info" message="Reportes y estadísticas del módulo de solicitudes de pago." />
            <div className="institutional-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Filter size={40} color="var(--brand-300)" />
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Próximamente: exportación de reportes en Excel y PDF</p>
            </div>
          </div>
        )}

        {/* Usuarios */}
        {activeTab === 'usuarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AlertBanner type="info" message="Administración de usuarios y asignación de roles." />
            <div className="institutional-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Users size={40} color="var(--brand-300)" />
              <p style={{ color: 'var(--text-muted', marginTop: '0.5rem' }}>Gestión de usuarios — próximos en versión 1.1</p>
            </div>
          </div>
        )}

        {/* Normativa */}
        {activeTab === 'normativa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AlertBanner type="info" message="Motor normativo configurable. Define fundamento legal, advertencias y reglas por tipo de trámite." />
            <div className="institutional-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <ShieldCheck size={40} color="var(--brand-300)" />
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configuración normativa — próximo en versión 1.2</p>
            </div>
          </div>
        )}

        {/* Plantilla */}
        {activeTab === 'plantilla' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AlertBanner type="info" message="Importa la plantilla de personal desde Excel/CSV. La matrícula es el identificador único." />
            {importedData ? (
              <div className="institutional-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem' }}>Datos importados: {importedData.length} registros</h3>
                <p style={{ color: 'var(--text-muted)' }}>En la versión completa, estos datos se subirán a Firestore.</p>
                <pre style={{ fontSize: '0.75rem', background: 'var(--surface-soft)', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', maxHeight: 200 }}>
                  {JSON.stringify(importedData.slice(0, 3), null, 2)}
                </pre>
              </div>
            ) : (
              <div className="institutional-card" style={{ padding: '1.5rem' }}>
                <ImportarPlantilla onImport={handleImport} />
              </div>
            )}
          </div>
        )}

        {/* Config */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AlertBanner type="info" message="Configuración general del sistema." />
            <div className="institutional-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Settings size={40} color="var(--brand-300)" />
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configuración — próximo en versión 1.3</p>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedTramite && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="institutional-card" style={{ width: '100%', maxWidth: 640, maxHeight: '90dvh', overflowY: 'auto', padding: '1.5rem' }}>
            <TramiteDetail
              tramite={selectedTramite}
              user={user}
              historial={tramiteHistorial}
              onClose={() => setSelectedTramite(null)}
              onAction={handleTramiteAction}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .institutional-card { border-radius: 1rem !important; }
        }
      `}</style>
    </div>
  );
}
