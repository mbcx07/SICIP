import React, { useState } from 'react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { Usuario } from '../types/sicip';
import { Upload, UserPlus, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { showToast } from '../components/ToastProvider';

export default function AltaTrabajadorScreen() {
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user: Usuario }>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [matriculaExiste, setMatriculaExiste] = useState(false);

  const [form, setForm] = useState({
    matricula: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    curp: '',
    rfc: '',
    nss: '',
    tipoContrato: 'BASE',
    area: '',
    categoria: '',
    unidadClave: '',
    unidadNombre: '',
    email: '',
    telefono: '',
    fechaIngreso: '',
  });

  const tipoContratoOpciones = [
    { value: 'BASE', label: 'BASE' },
    { value: 'CONFIANZA', label: 'CONFIANZA' },
    { value: 'SUSTITUTO', label: 'SUSTITUTO' },
    { value: 'EVENTUAL', label: 'EVENTUAL' },
    { value: 'INTERINO', label: 'INTERINO' },
    { value: 'SUPERNUMERARIO', label: 'SUPERNUMERARIO' },
    { value: 'HONORARIOS', label: 'HONORARIOS' },
    { value: 'RESIDENTE', label: 'RESIDENTE' },
    { value: 'BECARIO', label: 'BECARIO' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'matricula') {
      setMatriculaExiste(false);
      setError(null);
    }
  };

  const verificarMatricula = async () => {
    if (!form.matricula || form.matricula.length < 4) return;
    setBuscando(true);
    try {
      const q = query(collection(db, 'trabajadores'), where('matricula', '==', form.matricula.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setMatriculaExiste(true);
        setError(`La matrícula ${form.matricula} ya existe en el sistema.`);
      } else {
        setMatriculaExiste(false);
      }
    } finally {
      setBuscando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.matricula || !form.nombre || !form.apellidoPaterno) {
      setError('Matrícula, nombre y apellido paterno son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      // Verificar duplicado
      const q = query(collection(db, 'trabajadores'), where('matricula', '==', form.matricula.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setError(`La matrícula ${form.matricula} ya existe.`);
        setLoading(false);
        return;
      }

      const trabajador = {
        matricula: form.matricula.trim(),
        nombre: form.nombre.trim().toUpperCase(),
        apellidoPaterno: form.apellidoPaterno.trim().toUpperCase(),
        apellidoMaterno: form.apellidoMaterno.trim().toUpperCase(),
        curp: form.curp.trim().toUpperCase() || null,
        rfc: form.rfc.trim().toUpperCase() || null,
        nss: form.nss.trim() || null,
        tipoContrato: form.tipoContrato,
        area: form.area.trim().toUpperCase(),
        categoria: form.categoria.trim().toUpperCase() || null,
        unidadClave: form.unidadClave.trim().toUpperCase(),
        unidadNombre: form.unidadNombre.trim().toUpperCase(),
        delegacion: 'OOAD BCS',
        email: form.email.trim().toLowerCase() || null,
        telefono: form.telefono.trim() || null,
        fechaIngreso: form.fechaIngreso || null,
        activo: true,
        fechaActualizacion: new Date().toISOString(),
        plazas: [],
        altaIndividual: true,
        quincenaAlta: new Date().toISOString(),
      };

      await addDoc(collection(db, 'trabajadores'), trabajador);

      setSuccess({
        matricula: form.matricula,
        nombre: `${trabajador.nombre} ${trabajador.apellidoPaterno} ${trabajador.apellidoMaterno}`,
      });

      // Limpiar form
      setForm({
        matricula: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '',
        curp: '', rfc: '', nss: '', tipoContrato: 'BASE',
        area: '', categoria: '', unidadClave: '', unidadNombre: '',
        email: '', telefono: '', fechaIngreso: '',
      });

      showToast('Trabajador dado de alta correctamente', 'success');
    } catch (err) {
      console.error(err);
      setError('Error al guardar. Intenta de nuevo.');
      showToast('Error al dar de alta', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', marginBottom: '0.25rem' }}>
          👤 Alta Individual de Trabajador
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Ingresar un trabajador que no aparece en la plantilla quinceral — entrada a mitad de quincena
        </p>
      </div>

      {/* Éxito */}
      {success && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
        }}>
          <CheckCircle size={24} color="#16a34a" />
          <div>
            <div style={{ fontWeight: 700, color: '#166534' }}>Trabajador dado de alta</div>
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>
              {success.nombre} — Matrícula {success.matricula}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 'var(--radius-lg)', padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#dc2626',
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="institutional-card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Datos de Identificación
          </h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Matrícula */}
            <div>
              <label className="field-label">Matrícula *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  name="matricula"
                  value={form.matricula}
                  onChange={handleChange}
                  onBlur={verificarMatricula}
                  className="form-input"
                  placeholder="Ej. 99032244"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={verificarMatricula}
                  style={{ padding: '0 1rem', background: 'var(--brand-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  {buscando ? '...' : <><Search size={15} /> Verificar</>}
                </button>
              </div>
              {matriculaExiste && (
                <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                  ⚠️ Esta matrícula ya existe en el sistema
                </p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="field-label">Nombre(s) *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange}
                className="form-input" placeholder="Nombre completo" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Apellido Paterno */}
              <div>
                <label className="field-label">Apellido Paterno *</label>
                <input name="apellidoPaterno" value={form.apellidoPaterno} onChange={handleChange}
                  className="form-input" placeholder="Primer apellido" />
              </div>
              {/* Apellido Materno */}
              <div>
                <label className="field-label">Apellido Materno</label>
                <input name="apellidoMaterno" value={form.apellidoMaterno} onChange={handleChange}
                  className="form-input" placeholder="Segundo apellido" />
              </div>
            </div>

            {/* CURP, RFC, NSS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="field-label">CURP</label>
                <input name="curp" value={form.curp} onChange={handleChange}
                  className="form-input" placeholder="20 caracteres" maxLength={18} style={{ textTransform: 'uppercase' }} />
              </div>
              <div>
                <label className="field-label">RFC</label>
                <input name="rfc" value={form.rfc} onChange={handleChange}
                  className="form-input" placeholder="13 caracteres" maxLength={13} style={{ textTransform: 'uppercase' }} />
              </div>
              <div>
                <label className="field-label">NSS</label>
                <input name="nss" value={form.nss} onChange={handleChange}
                  className="form-input" placeholder="11 dígitos" maxLength={11} />
              </div>
            </div>
          </div>
        </div>

        {/* Datos Laborales */}
        <div className="institutional-card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Datos Laborales
          </h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Tipo Contrato + Categoría */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div>
                <label className="field-label">Tipo de Contratación</label>
                <select name="tipoContrato" value={form.tipoContrato} onChange={handleChange}
                  className="form-input">
                  {tipoContratoOpciones.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Categoría / Plaza</label>
                <input name="categoria" value={form.categoria} onChange={handleChange}
                  className="form-input" placeholder="Ej. AUXILIAR DE ALMACEN 80" />
              </div>
            </div>

            {/* Área */}
            <div>
              <label className="field-label">Área / Servicio</label>
              <input name="area" value={form.area} onChange={handleChange}
                className="form-input" placeholder="Ej. ALMACEN" />
            </div>

            {/* Unidad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div>
                <label className="field-label">Clave Unidad</label>
                <input name="unidadClave" value={form.unidadClave} onChange={handleChange}
                  className="form-input" placeholder="Ej. 03HD01" />
              </div>
              <div>
                <label className="field-label">Nombre de Unidad</label>
                <input name="unidadNombre" value={form.unidadNombre} onChange={handleChange}
                  className="form-input" placeholder="Ej. HOSP GRAL ZONA MF 1" />
              </div>
            </div>

            {/* Fecha de Ingreso */}
            <div>
              <label className="field-label">Fecha de Ingreso</label>
              <input type="date" name="fechaIngreso" value={form.fechaIngreso} onChange={handleChange}
                className="form-input" />
            </div>
          </div>
        </div>

        {/* Datos de Contacto */}
        <div className="institutional-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Datos de Contacto (opcional)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="field-label">Correo Electrónico</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="form-input" placeholder="correo@imss.gob.mx" />
            </div>
            <div>
              <label className="field-label">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange}
                className="form-input" placeholder="612 xxx xxxx" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading || matriculaExiste}
          className="btn-institutional"
          style={{ width: '100%', opacity: (loading || matriculaExiste) ? 0.5 : 1 }}>
          {loading ? (
            <>⏳ Guardando...</>
          ) : (
            <><UserPlus size={18} /> Dar de Alta Trabajador</>
          )}
        </button>
      </form>
    </div>
  );
}
