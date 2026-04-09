import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { onAuthChange, logout, getUsuario } from '../services/firebase';
import type { Usuario } from '../types/sicip';
import { Rol } from '../types/sicip';
import {
  LayoutDashboard, FileText, PlusCircle, ClipboardList, Building2,
  Filter, Upload, Users, ShieldCheck, LogOut, ChevronRight, Briefcase,
  Home, Menu, X
} from 'lucide-react';
import { ROL_LABELS, OOAD_NOMBRE, INSTITUCION_NOMBRE } from '../constants/sicip';

const TABS_BY_ROLES: Record<Rol, Array<{ key: string; label: string; icon: React.ReactNode }>> = {
  [Rol.TRABAJADOR]: [
    { key: '/', label: 'Inicio', icon: <Home size={18} /> },
    { key: '/nuevo-tramite', label: 'Nueva Solicitud', icon: <PlusCircle size={18} /> },
    { key: '/mis-tramites', label: 'Mis Trámites', icon: <FileText size={18} /> },
  ],
  [Rol.JEFE_SERVICIO]: [
    { key: '/', label: 'Inicio', icon: <Home size={18} /> },
    { key: '/nuevo-tramite', label: 'Nueva Solicitud', icon: <PlusCircle size={18} /> },
    { key: '/mis-tramites', label: 'Mis Solicitudes', icon: <FileText size={18} /> },
    { key: '/bandeja', label: 'Bandeja', icon: <ClipboardList size={18} /> },
  ],
  [Rol.AREA_PERSONAL]: [
    { key: '/', label: 'Inicio', icon: <Home size={18} /> },
    { key: '/bandeja', label: 'Bandeja', icon: <ClipboardList size={18} /> },
    { key: '/recepciones', label: 'Recepciones', icon: <Building2 size={18} /> },
    { key: '/reportes', label: 'Reportes', icon: <Filter size={18} /> },
  ],
  [Rol.ADMIN]: [
    { key: '/', label: 'Inicio', icon: <Home size={18} /> },
    { key: '/bandeja', label: 'Bandeja', icon: <ClipboardList size={18} /> },
    { key: '/tramites', label: 'Trámites', icon: <FileText size={18} /> },
    { key: '/recepciones', label: 'Recepciones', icon: <Building2 size={18} /> },
    { key: '/reportes', label: 'Reportes', icon: <Filter size={18} /> },
    { key: '/plantilla', label: 'Plantilla', icon: <Upload size={18} /> },
    { key: '/admin', label: 'Administración', icon: <Users size={18} /> },
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
      if (!firebaseUser) {
        navigate('/login', { replace: true });
        return;
      }
      const u = await getUsuario(firebaseUser.uid);
      if (!u || !u.activo) {
        navigate('/login', { replace: true });
        return;
      }
      setUser(u);
    });
    return unsubscribe;
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const tabs = TABS_BY_ROLES[user.rol] || [];
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#f0f4f0' }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg, #005235 0%, #006647 60%, #007A52 100%)',
        color: 'white', padding: '0 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        height: 56,
      }}>
        {/* Left: hamburger + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '0.5rem', padding: '0.45rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <ShieldCheck size={26} style={{ color: '#5cff5c' }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.06em', lineHeight: 1 }}>SICIP</div>
            <div style={{ fontSize: '0.55rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{OOAD_NOMBRE}</div>
          </div>
        </div>

        {/* Right: user info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>{user.nombre}</div>
            <div style={{ fontSize: '0.6rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ROL_LABELS[user.rol]}</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}>
            {user.nombre?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
            title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
               onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ───────────────────────────────────────── */}
        <nav style={{
          width: 220,
          background: 'linear-gradient(180deg, #0A3D1F 0%, #0D4A25 50%, #0A3D1F 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 56, height: 'calc(100dvh - 56px)',
          overflowY: 'auto', flexShrink: 0,
          zIndex: 45,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(0)',
          transition: 'transform 0.2s',
        }}>
          <div style={{ padding: '1rem 0.75rem 0.5rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
              Navegación
            </div>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { navigate(tab.key); setSidebarOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.65rem 0.75rem', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: isActive(tab.key) ? 700 : 500,
                  color: isActive(tab.key) ? 'white' : 'rgba(255,255,255,0.72)',
                  background: isActive(tab.key) ? 'rgba(39,174,96,0.3)' : 'transparent',
                  borderLeft: isActive(tab.key) ? '3px solid #5cff5c' : '3px solid transparent',
                  borderRadius: '0 0.5rem 0.5rem 0',
                  marginBottom: 2, transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive(tab.key)) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; } }}
                onMouseLeave={e => { if (!isActive(tab.key)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; } }}
              >
                <span style={{ color: isActive(tab.key) ? '#5cff5c' : 'rgba(255,255,255,0.6)' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sidebar footer */}
          <div style={{ marginTop: 'auto', padding: '1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '0.05em' }}>
              {INSTITUCION_NOMBRE}
            </div>
          </div>
        </nav>

        {/* ── Main Content ──────────────────────────────────── */}
        <main style={{
          flex: 1, padding: '1.5rem',
          maxWidth: '100%', overflowX: 'hidden',
          minHeight: 'calc(100dvh - 56px)',
        }}>
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
