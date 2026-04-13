import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { crearPlazaReemplazo, crearCuadroReemplazo } from '../services/reemplazos';
import type { PlazaReemplazo } from '../types/reemplazos';
import type { Usuario } from '../types/sicip';

export default function CrearPlazaScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clavePlaza: '',
    nombrePlaza: '',
    categoria: '',
    escolaridadMinima: '',
    experienciaAnos: '',
    experienciaRequerida: '',
    habilidadesRequeridas: '',
    departamento: '',
    motivo: 'LICENCIA',
    nombreAusente: '',
    matriculaAusente: '',
    fechaInicioAusencia: '',
    fechaFinAusencia: '',
  });

  const usuario: Usuario | null = (() => {
    try { return JSON.parse(sessionStorage.getItem('sicip_usuario') || 'null'); } catch { return null; }
  })();

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    setError(null);
    setLoading(true);
    try {
      const plazaData: Omit<PlazaReemplazo, 'id' | 'fechaCreacion'> = {
        clavePlaza: form.clavePlaza,
        nombrePlaza: form.nombrePlaza,
        tipoPlaza: 'CONFIANZA',
        categoria: form.categoria,
        escolaridadMinima: form.escolaridadMinima,
        experienciaAnos: parseInt(form.experienciaAnos) || 0,
        experienciaRequerida: form.experienciaRequerida,
        habilidadesRequeridas: form.habilidadesRequeridas.split(',').map(s => s.trim()).filter(Boolean),
        unidadClave: usuario.unidadClave || '',
        unidadNombre: usuario.unidadNombre || '',
        departamento: form.departamento,
        jefeServicioUid: usuario.uid,
        jefeServicioNombre: usuario.nombre,
        jefeServicioMatricula: usuario.matricula,
        motivo: form.motivo as PlazaReemplazo['motivo'],
        nombreAusente: form.nombreAusente,
        matriculaAusente: form.matriculaAusente,
        fechaInicioAusencia: form.fechaInicioAusencia,
        fechaFinAusencia: form.fechaFinAusencia,
        status: 'ABIERTA',
        ternaCerrada: false,
      };
      const plazaId = await crearPlazaReemplazo(plazaData);
      await crearCuadroReemplazo({
        plazaId,
        status: 'BORRADOR',
        candidatos: [],
        notificacionPendiente: true,
      });
      navigate(`/cuadro/${plazaId}`);
    } catch (e: any) {
      setError(e.message || 'Error al crear la plaza');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (label: string, key: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        required
        style={{ width: '100%', padding: '0.7rem 0.9rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit' }}
        onFocus={e => { e.target.style.borderColor = '#27ae60'; e.target.style.background = 'white'; }}
        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
      />
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#005235', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#005235' }}>Crear Plaza de Reemplazo</h1>
          <p style={{ margin: '0.15rem 0 0', color: '#666', fontSize: '0.8rem' }}>Registra una ausencia temporal y genera el cuadro de reemplazo</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.85rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#005235', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos de la Plaza</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {inputStyle('Clave de Plaza', 'clavePlaza', 'text', 'Ej. 03HD01-001')}
          {inputStyle('Nombre del Puesto', 'nombrePlaza', 'text', 'Ej. Jefatura de Enfermería')}
        </div>
        {inputStyle('Categoría', 'categoria', 'text', 'Ej. Kategoría相同的某个值')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {inputStyle('Escolaridad Mínima', 'escolaridadMinima', 'text', 'Ej. Licenciatura')}
          {inputStyle('Años de Experiencia', 'experienciaAnos', 'number', '0')}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Experiencia Requerida</label>
          <textarea
            value={form.experienciaRequerida}
            onChange={e => set('experienciaRequerida', e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '0.7rem 0.9rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit', resize: 'vertical' }}
            onFocus={e => { e.target.style.borderColor = '#27ae60'; e.target.style.background = 'white'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
          />
        </div>
        {inputStyle('Habilidades (separadas por coma)', 'habilidadesRequeridas', 'text', 'Ej. Liderazgo, trabajo en equipo')}

        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '1.25rem 0' }} />
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#005235', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del Ausente</p>

        {inputStyle('Departamento', 'departamento', 'text', 'Ej. Área de Consulta Externa')}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Motivo de Ausencia</label>
          <select
            value={form.motivo}
            onChange={e => set('motivo', e.target.value)}
            style={{ width: '100%', padding: '0.7rem 0.9rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fafafa', fontFamily: 'inherit' }}
            onFocus={e => { e.target.style.borderColor = '#27ae60'; e.target.style.background = 'white'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
          >
            <option value="LICENCIA">Licencia</option>
            <option value="INCAPACIDAD">Incapacidad</option>
            <option value="VACACIONES">Vacaciones</option>
            <option value="COMISION">Comisión</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {inputStyle('Nombre del Ausente', 'nombreAusente', 'text', 'Nombre completo')}
          {inputStyle('Matrícula del Ausente', 'matriculaAusente', 'text', '6 dígitos')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {inputStyle('Fecha Inicio', 'fechaInicioAusencia', 'date')}
          {inputStyle('Fecha Fin', 'fechaFinAusencia', 'date')}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', marginTop: '1rem', padding: '0.9rem',
            background: loading ? '#a8d5be' : 'linear-gradient(135deg, #1a5c32, #27ae60)',
            color: 'white', border: 'none', borderRadius: '0.75rem',
            fontSize: '0.95rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(39,174,96,0.3)',
          }}
        >
          {loading ? 'Creando...' : 'Crear Plaza y Generar Cuadro'}
        </button>
      </form>
    </div>
  );
}
