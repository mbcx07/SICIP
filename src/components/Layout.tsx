import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { onAuthChange, logout, getUsuario } from '../services/firebase';
import type { Usuario } from '../types/sicip';
import { Rol } from '../types/sicip';
import {
  LayoutDashboard, FileText, PlusCircle, ClipboardList, Building2,
  Filter, Upload, Users, ShieldCheck, LogOut, ChevronRight, Briefcase,
  Home, Menu, X, UserPlus
} from 'lucide-react';
import { ROL_LABELS, OOAD_NOMBRE, INSTITUCION_NOMBRE } from '../constants/sicip';

const TABS_BY_ROLES: Record<Rol, Array<{ key: string; label: string; icon: React.ReactNode }>> = {
  [Rol.TRABAJADOR]: [
    { key: '/', label: 'Inicio', icon: <Home size={20} /> },
    { key: '/nuevo-tramite', label: 'Nueva Solicitud', icon: <PlusCircle size={20} /> },
    { key: '/mis-tramites', label: 'Mis Trámites', icon: <FileText size={20} /> },
  ],
  [Rol.JEFE_SERVICIO]: [
    { key: '/', label: 'Inicio', icon: <Home size={20} /> },
    { key: '/nuevo-tramite', label: 'Nueva Solicitud', icon: <PlusCircle size={20} /> },
    { key: '/mis-tramites', label: 'Mis Solicitudes', icon: <FileText size={20} /> },
    { key: '/bandeja', label: 'Bandeja', icon: <ClipboardList size={20} /> },
  ],
  [Rol.AREA_PERSONAL]: [
    { key: '/', label: 'Inicio', icon: <Home size={20} /> },
    { key: '/bandeja', label: 'Bandeja', icon: <ClipboardList size={20} /> },
    { key: '/recepciones', label: 'Recepciones', icon: <Building2 size={20} /> },
    { key: '/reportes', label: 'Reportes', icon: <Filter size={20} /> },
  ],
  [Rol.ADMIN]: [
    { key: '/', label: 'Inicio', icon: <Home size={20} /> },
    { key: '/bandeja', label: 'Bandeja', icon: <ClipboardList size={20} /> },
    { key: '/tramites', label: 'Trámites', icon: <FileText size={20} /> },
    { key: '/recepciones', label: 'Recepciones', icon: <Building2 size={20} /> },
    { key: '/reportes', label: 'Reportes', icon: <Filter size={20} /> },
    { key: '/plantilla', label: 'Plantilla', icon: <Upload size={20} /> },
    { key: '/importar-plantilla', label: 'Importar', icon: <Upload size={20} /> },
    { key: '/alta-trabajador', label: 'Alta Trabajador', icon: <UserPlus size={20} /> },
    { key: '/admin', label: 'Administración', icon: <Users size={20} /> },
  ],
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = React.useState<Usuario | null>(null);
  const [lastActive, setLastActive] = React.useState(Date.now());
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const update = () => setLastActive(Date.now());
    events.forEach(e => window.addEventListener(e, update, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, update));
  }, []);

  React.useEffect(() => {
    const interval = setInterval(async () => {
      if (Date.now() - lastActive > 30 * 60 * 1000) {
        await logout();
        navigate('/login', { replace: true });
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [lastActive, navigate]);

  React.useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) { navigate('/login', { replace: true }); return; }
      const u = await getUsuario(firebaseUser.uid);
      if (!u || !u.activo) { navigate('/login', { replace: true }); return; }
      setUser(u);
    });
    return unsubscribe;
  }, [navigate]);

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const tabs = TABS_BY_ROLES[user.rol] || [];
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#f0f4f0' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg, #005235 0%, #006647 60%, #007A52 100%)',
        color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        height: 56,
        padding: '0 1rem',
        flexShrink: 0,
      }}>
        {/* Left: hamburger + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '0.5rem', padding: '0.5rem',
              cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center',
            }}
            aria-label="Menú"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <ShieldCheck size={28} style={{ color: '#5cff5c', flexShrink: 0 }} />

          <div>
            <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.06em', lineHeight: 1 }}>SICIP</div>
            <div style={{ fontSize: '0.5rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
              {OOAD_NOMBRE}
            </div>
          </div>
        </div>

        {/* Right: user info + logout */}
        <div className="header-user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>{user.nombre}</div>
            <div style={{ fontSize: '0.6rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {ROL_LABELS[user.rol]}
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.9rem', flexShrink: 0,
          }}>
            {user.nombre?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '0.5rem', padding: '0.5rem',
              cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center',
            }}
            title="Cerrar sesión" aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ───────────────────────────────────────── */}
        <nav
          className={`sidebar${sidebarOpen ? ' open' : ''}`}
          style={{
            width: 240,
            background: 'linear-gradient(180deg, #0A3D1F 0%, #0D4A25 50%, #0A3D1F 100%)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 200,
            flexShrink: 0,
          }}
          aria-label="Navegación principal"
        >
          {/* Nav section */}
          <div style={{ padding: '1.25rem 0.75rem 0.5rem', flex: 1 }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { navigate(tab.key); setSidebarOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.8rem 1rem',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: isActive(tab.key) ? 700 : 500,
                  color: isActive(tab.key) ? 'white' : 'rgba(255,255,255,0.72)',
                  background: isActive(tab.key) ? 'rgba(39,174,96,0.3)' : 'transparent',
                  borderLeft: isActive(tab.key) ? '4px solid #5cff5c' : '4px solid transparent',
                  borderRadius: '0 0.5rem 0.5rem 0',
                  marginBottom: 3,
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: isActive(tab.key) ? '#5cff5c' : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sidebar footer */}
          <div style={{
            padding: '1rem 1rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginTop: 'auto',
          }}>
            <div style={{
              fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)',
              textAlign: 'center', letterSpacing: '0.05em',
            }}>
              {INSTITUCION_NOMBRE}
            </div>
          </div>
        </nav>

        {/* ── Main Content ──────────────────────────────────── */}
        <main style={{
          flex: 1,
          overflowX: 'hidden',
          minHeight: 'calc(100dvh - 56px)',
        }}>
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
