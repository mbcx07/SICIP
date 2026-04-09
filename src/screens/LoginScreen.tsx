import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthChange, getUsuario } from '../services/firebase';
import type { Usuario } from '../types/sicip';
import { INSTITUCION_NOMBRE, OOAD_NOMBRE } from '../constants/sicip';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const u = await getUsuario(firebaseUser.uid);
        if (u && u.activo) navigate('/', { replace: true });
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { loginWithEmail } = await import('../services/firebase');
      const firebaseUser = await loginWithEmail(email, password);
      const u = await getUsuario(firebaseUser.uid);
      if (u && u.activo) {
        navigate('/', { replace: true });
      } else {
        setError('Usuario no encontrado o inactivo');
      }
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'Correo o contraseña incorrectos' : err.message);
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
      {/* Header badge */}
      <div style={{
        position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '2rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
        backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: 600,
        letterSpacing: '0.03em',
      }}>
        <span style={{ fontSize: '1rem' }}>🏥</span>
        <span>{INSTITUCION_NOMBRE}</span>
        <span style={{ opacity: 0.5 }}>•</span>
        <span style={{ opacity: 0.85 }}>OOAD Baja California Sur</span>
      </div>

      <div style={{
        background: 'white', borderRadius: '1.5rem',
        padding: '2.5rem', width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #005235, #27ae60)' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '0.5rem' }}>
          {/* SICIP Logo — S con dos óvalos entrelazados en verde */}
          <div style={{
            width: 72, height: 72,
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg viewBox="0 0 72 72" width="72" height="72">
              {/* Óvalo exterior — verde oscuro */}
              <ellipse cx="36" cy="36" rx="30" ry="20" fill="none" stroke="#005235" strokeWidth="7" />
              {/* Óvalo interior — verde medio */}
              <ellipse cx="36" cy="36" rx="20" ry="30" fill="none" stroke="#27ae60" strokeWidth="7" />
              {/* Centro oscuro para dar efecto entrelazado */}
              <ellipse cx="36" cy="36" rx="8" ry="8" fill="#0d3b1e" />
            </svg>
          </div>

          <h1 style={{
            fontSize: '2.25rem', fontWeight: 900, letterSpacing: '0.08em',
            margin: '0 0 0.25rem 0',
            background: 'linear-gradient(135deg, #1a5c32, #27ae60)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            SICIP
          </h1>
          <p style={{ color: '#5a6a7a', fontSize: '0.78rem', margin: '0 0 0.15rem 0', fontWeight: 500, letterSpacing: '0.02em' }}>
            Sistema Integral de Captura de Información de Personal
          </p>
          <p style={{ color: '#8a9aaa', fontSize: '0.72rem', margin: 0, letterSpacing: '0.03em' }}>
            {INSTITUCION_NOMBRE} — OOAD Baja California Sur
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '0.75rem', padding: '0.75rem',
            marginBottom: '1rem', color: '#dc2626', fontSize: '0.85rem', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: '#374151', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Correo electrónico
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@imss.gob.mx" required
              style={{
                width: '100%', padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb', borderRadius: '0.75rem',
                fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
                background: '#fafafa',
              }}
              onFocus={e => { e.target.style.borderColor = '#27ae60'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: '#374151', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: '100%', padding: '0.75rem 1rem', paddingRight: '3.5rem',
                  border: '2px solid #e5e7eb', borderRadius: '0.75rem',
                  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s', background: '#fafafa',
                }}
                onFocus={e => { e.target.style.borderColor = '#27ae60'; e.target.style.background = 'white'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600,
                }}>
                {showPw ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '0.85rem',
              background: loading ? '#a8d5be' : 'linear-gradient(135deg, #1a5c32, #27ae60)',
              color: 'white', border: 'none', borderRadius: '0.75rem',
              fontSize: '0.95rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', marginTop: '0.5rem', letterSpacing: '0.04em',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(39,174,96,0.3)',
            }}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Bottom IMS S badge */}
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f0f0f0' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            color: '#adb5bd', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em',
          }}>
            <svg viewBox="0 0 72 72" width="18" height="18">
              <ellipse cx="36" cy="36" rx="28" ry="18" fill="none" stroke="#005235" strokeWidth="6" />
              <ellipse cx="36" cy="36" rx="18" ry="28" fill="none" stroke="#27ae60" strokeWidth="6" />
              <ellipse cx="36" cy="36" rx="7" ry="7" fill="#0d3b1e" />
            </svg>
            INSTITUTO MEXICANO DEL SEGURO SOCIAL
          </div>
          <div style={{ color: '#c8d0db', fontSize: '0.65rem', marginTop: '0.2rem', letterSpacing: '0.04em' }}>
            OOAD Baja California Sur
          </div>
        </div>
      </div>
    </div>
  );
}
