import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Usuario } from '../types/sicip';
import { INSTITUCION_NOMBRE } from '../constants/sicip';

export default function PrimerAccesoScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stored = sessionStorage.getItem('sicip_usuario');
  const usuario: Usuario | null = stored ? JSON.parse(stored) : null;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@imss.gob.mx') && !email.includes('@gob.mx')) {
      setError('Usa tu correo institucional (@imss.gob.mx o @gob.mx)');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const { setUsuarioPassword, actualizarUsuario } = await import('../services/firebase');
      await setUsuarioPassword(usuario!.uid, password);
      await actualizarUsuario(usuario!.uid, { email, primerAcceso: false });
      // Actualizar session
      sessionStorage.setItem('sicip_usuario', JSON.stringify({ ...usuario!, email, primerAcceso: false }));
      navigate('/', { replace: true });
    } catch (err: any) {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', padding: '1rem',
      background: 'linear-gradient(135deg, #0d3b1e 0%, #1a5c32 50%, #0d3b1e 100%)',
    }}>
      <div style={{
        background: 'white', borderRadius: '1.5rem',
        padding: '2.5rem', width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #005235, #27ae60)' }} />

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👋</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#005235', margin: '0 0 0.4rem 0' }}>
            Bienvenido, {usuario?.nombre?.split('/')[1] || usuario?.nombre || 'trabajador'}
          </h1>
          <p style={{ color: '#666', fontSize: '0.88rem', margin: 0 }}>
            Personaliza tu cuenta — ingresa tu correo institucional y crea una contraseña segura.
          </p>
          {usuario && (
            <p style={{ color: '#888', fontSize: '0.78rem', marginTop: '0.5rem' }}>
              Matrícula: <strong>{usuario.matricula}</strong> — {usuario.unidadNombre}
            </p>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Correo institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu.correo@imss.gob.mx"
              required
              style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '0.95rem', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#27ae60'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Nueva contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '0.95rem', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#27ae60'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
              style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '0.95rem', outline: 'none', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#27ae60'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
            />
          </div>

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '0.85rem', marginTop: '0.5rem',
              background: loading ? '#a8d5be' : 'linear-gradient(135deg, #1a5c32, #27ae60)',
              color: 'white', border: 'none', borderRadius: '0.75rem',
              fontSize: '0.95rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(39,174,96,0.3)',
              fontFamily: 'inherit',
            }}>
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#999', fontSize: '0.75rem', marginTop: '1.25rem' }}>
          Si necesitas ayuda, contacta al área de Personal.
        </p>
      </div>
    </div>
  );
}
