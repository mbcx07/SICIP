import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { onAuthChange, getUsuario } from '../services/firebase';
import type { Usuario } from '../types/sicip';

export default function ProtectedRoute() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const u = await getUsuario(firebaseUser.uid);
        if (u && u.activo) {
          setUser(u);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--brand-50)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--brand-200)', borderTopColor: 'var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando SICIP...</p>
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
