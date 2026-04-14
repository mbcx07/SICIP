import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { Usuario } from '../types/sicip';
import { Rol } from '../types/sicip';
import {
  LayoutDashboard, FileText, PlusCircle, ClipboardList, Building2,
  Filter, Upload, Users, ShieldCheck, LogOut, ChevronRight, Briefcase,
  Home, Menu, X, UserPlus
} from 'lucide-react';
import { ROL_LABELS, OOAD_NOMBRE, INSTITUCION_NOMBRE } from '../constants/sicip';

function getUserFromSession(): Usuario | null {
  try {
    const s = sessionStorage.getItem('sicip_usuario');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

// Menú basado en permisos (no solo rol)
function getMenuItems(usuario: Usuario | null) {
  if (!usuario) return [];
  const p = usuario.permisos || [];
  const isAdmin = usuario.rol === Rol.ADMIN;

  const items = [];

  if (p.includes('solicitudes') || isAdmin) {
    items.push({ key: '/nuevo-tramite', label: 'Nueva Solicitud', icon: <PlusCircle size={20} /> });
    items.push({ key: '/mis-tramites', label: 'Mis Trámites', icon: <FileText size={20} /> });
  }
  if (p.includes('bandeja') || isAdmin) {
    items.push({ key: '/bandeja', label: 'Bandeja', icon: <ClipboardList size={20} /> });
  }
  if (p.includes('cuadros') || isAdmin || usuario.rol === 'JEFE_SERVICIO') {
    items.push({ key: '/cuadros', label: 'Cuadros Reemplazo', icon: <Users size={20} /> });
    items.push({ key: '/crear-plaza', label: 'Crear Plaza', icon: <PlusCircle size={20} /> });
    items.push({ key: '/explorar-plazas', label: 'Explorar Plazas', icon: <Briefcase size={20} /> });
  }
  if (p.includes('recepciones') || isAdmin) {
    items.push({ key: '/recepciones', label: 'Recepciones', icon: <Building2 size={20} /> });
  }
  if (p.includes('reportes') || isAdmin) {
    items.push({ key: '/reportes', label: 'Reportes', icon: <Filter size={20} /> });
  }
  if (p.includes('plantilla') || isAdmin) {
    items.push({ key: '/plantilla', label: 'Plantilla', icon: <Upload size={20} /> });
    items.push({ key: '/importar-plantilla', label: 'Importar Plantilla', icon: <Upload size={20} /> });
    items.push({ key: '/alta-trabajador', label: 'Alta Trabajador', icon: <UserPlus size={20} /> });
  }
  if (p.includes('admin') || isAdmin) {
    items.push({ key: '/admin', label: 'Administración', icon: <Users size={20} /> });
  }

  // Inicio siempre
  return [{ key: '/', label: 'Inicio', icon: <Home size={20} /> }, ...items];
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<Usuario | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync session → component state
  const syncUser = useCallback(() => {
    const u = getUserFromSession();
    setUser(u);
  }, []);

  useEffect(() => {
    syncUser();
    // Listen for storage changes (other tabs)
    window.addEventListener('storage', syncUser);
    // Listen for custom event
    window.addEventListener('sicip:session-update', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('sicip:session-update', syncUser);
    };
  }, [syncUser]);

  // Timeout 30 min sin actividad
  useEffect(() => {
    let last = Date.now();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const update = () => { last = Date.now(); };
    events.forEach(e => window.addEventListener(e, update, { passive: true }));
    const interval = setInterval(() => {
      if (Date.now() - last > 30 * 60 * 1000) {
        sessionStorage.removeItem('sicip_usuario');
        navigate('/login', { replace: true });
      }
    }, 60 * 1000);
    return () => {
      events.forEach(e => window.removeEventListener(e, update));
      clearInterval(interval);
    };
  }, [navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem('sicip_usuario');
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const tabs = getMenuItems(user);
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#f0f4f0' }}>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #005235 0%, #006647 60%, #007A52 100%)',
        color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        height: 56, padding: '0 1rem', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <ShieldCheck size={28} style={{ color: '#5cff5c', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.06em', lineHeight: 1 }}>SICIP</div>
            <div style={{ fontSize: '0.5rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{OOAD_NOMBRE}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>{user.nombre}</div>
            <div style={{ fontSize: '0.6rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ROL_LABELS[user.rol]}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0 }}>
            {user.nombre?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
            title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} aria-hidden="true"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />
        )}

        {/* Sidebar */}
        <nav className={`sidebar${sidebarOpen ? ' open' : ''}`}
          style={{
            width: 240, background: 'linear-gradient(180deg, #0A3D1F 0%, #0D4A25 50%, #0A3D1F 100%)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
            overflowY: 'auto', zIndex: 200, flexShrink: 0,
            position: sidebarOpen ? 'fixed' : 'relative', top: sidebarOpen ? 0 : undefined,
            left: sidebarOpen ? 0 : undefined, height: sidebarOpen ? '100dvh' : undefined,
            transition: 'left 0.2s',
          }}>
          <div style={{ padding: '1.25rem 0.75rem 0.5rem', flex: 1 }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => { navigate(tab.key); setSidebarOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.8rem 1rem', border: 'none', cursor: 'pointer', fontSize: '0.9rem',
                  fontWeight: isActive(tab.key) ? 700 : 500,
                  color: isActive(tab.key) ? 'white' : 'rgba(255,255,255,0.72)',
                  background: isActive(tab.key) ? 'rgba(39,174,96,0.3)' : 'transparent',
                  borderLeft: isActive(tab.key) ? '4px solid #5cff5c' : '4px solid transparent',
                  borderRadius: '0 0.5rem 0.5rem 0', marginBottom: 3, transition: 'all 0.15s', textAlign: 'left',
                }}>
                <span style={{ color: isActive(tab.key) ? '#5cff5c' : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', letterSpacing: '0.05em' }}>{INSTITUCION_NOMBRE}</div>
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, overflowX: 'hidden', minHeight: 'calc(100dvh - 56px)' }}>
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
