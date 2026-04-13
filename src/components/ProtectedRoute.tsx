import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Usuario } from '../types/sicip';

export default function ProtectedRoute() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (stored) {
      try {
        const u: Usuario = JSON.parse(stored);
        setUser(u.activo ? u : null);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f0f7f4' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #c8e6c9', borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#666', fontSize: '0.875rem' }}>Cargando SICIP...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet context={{ user }} />;
}

// Hook para usar el usuario en cualquier screen
export function useSessionUser(): Usuario | null {
  const [user, setUser] = useState<Usuario | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem('sicip_usuario');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
  }, []);
  return user;
}
