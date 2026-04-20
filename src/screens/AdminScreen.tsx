import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users, Building2, ShieldCheck, Database, Plus, X, Edit2, Trash2,
  PlayCircle, CheckCircle2, Save, Search, FileSpreadsheet, UserCog, Trash,
} from 'lucide-react';
import type { Usuario } from '../types/sicip';
import { getUsuariosPaginated, crearUsuario, actualizarUsuario } from '../services/firebase';
import { getUnidades, saveUnidad, getTrabajadores, saveTrabajador } from '../services/firebase';
import { Rol } from '../types/sicip';
import { db } from '../services/firebase';
import { collection, doc, setDoc, deleteDoc, query, getDocs, where } from 'firebase/firestore';

type Tab = 'usuarios' | 'unidades' | 'trabajadores' | 'normativa' | 'seed';

const ROLES = [Rol.ADMIN, Rol.JEFE_SERVICIO, Rol.AREA_PERSONAL, Rol.TRABAJADOR];
const TIPO_ROL_LABEL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  JEFE_SERVICIO: 'Jefe de Servicio',
  AREA_PERSONAL: 'Área de Personal',
  TRABAJADOR: 'Trabajador',
};

export default function AdminScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const [tab, setTab] = useState<Tab>('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state — usuarios
  const [editUsuario, setEditUsuario] = useState<Usuario | null>(null);
  const [editUsuarioRol, setEditUsuarioRol] = useState<Rol>(Rol.TRABAJADOR);
  const [editUsuarioActivo, setEditUsuarioActivo] = useState(true);
  const [savingUsuario, setSavingUsuario] = useState(false);

  // Edit state — unidades
  const [editUnidad, setEditUnidad] = useState<any | null>(null);
  const [editUnidadNombre, setEditUnidadNombre] = useState('');
  const [savingUnidad, setSavingUnidad] = useState(false);
  const [showNewUnidad, setShowNewUnidad] = useState(false);
  const [newUnidad, setNewUnidad] = useState({ clave: '', nombre: '', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true });
  const [savingNewUnidad, setSavingNewUnidad] = useState(false);

  // New usuario modal
  const [showNewUsuario, setShowNewUsuario] = useState(false);
  const [newUsuario, setNewUsuario] = useState({ nombre: '', email: '', matricula: '', rol: Rol.TRABAJADOR, unidadClave: '', unidadNombre: '' });
  const [savingNewUsuario, setSavingNewUsuario] = useState(false);

  // Edit trabajador
  const [editTrabajador, setEditTrabajador] = useState<any | null>(null);
  const [editTrabRol, setEditTrabRol] = useState<Rol>(Rol.TRABAJADOR);
  const [savingTrabajador, setSavingTrabajador] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [usuariosPage, setUsuariosPage] = useState(1);
  const [hasMoreUsuarios, setHasMoreUsuarios] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 100;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [uResult, un, tr] = await Promise.all([
        getUsuariosPaginated(undefined, PAGE_SIZE),
        getUnidades(),
        getTrabajadores(),
      ]);
      setUsuarios(uResult.usuarios);
      setHasMoreUsuarios(uResult.hasMore);
      setUsuariosPage(1);
      setUnidades(un);
      setTrabajadores(tr);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const loadMoreUsuarios = useCallback(async () => {
    setLoadingMore(true);
    try {
      const result = await getUsuariosPaginated(undefined, PAGE_SIZE);
      setUsuarios(prev => [...prev, ...result.usuarios]);
      setHasMoreUsuarios(result.hasMore);
      setUsuariosPage(prev => prev + 1);
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Save usuario edit ────────────────────────────────────
  const handleSaveUsuario = async () => {
    if (!editUsuario) return;
    setSavingUsuario(true);
    try {
      await actualizarUsuario(editUsuario.uid, {
        rol: editUsuarioRol,
        activo: editUsuarioActivo,
      });
      setEditUsuario(null);
      await loadAll();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingUsuario(false); }
  };

  // ── Save unidad edit ─────────────────────────────────────
  const handleSaveUnidad = async () => {
    if (!editUnidad) return;
    setSavingUnidad(true);
    try {
      await saveUnidad({ ...editUnidad, nombre: editUnidadNombre });
      setEditUnidad(null);
      await loadAll();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingUnidad(false); }
  };

  // ── Save new unidad ──────────────────────────────────────
  const handleSaveNewUnidad = async () => {
    if (!newUnidad.clave || !newUnidad.nombre) { alert('Clave y nombre son requeridos'); return; }
    setSavingNewUnidad(true);
    try {
      await saveUnidad({ ...newUnidad, activo: true } as any);
      setShowNewUnidad(false);
      setNewUnidad({ clave: '', nombre: '', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true });
      await loadAll();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingNewUnidad(false); }
  };

  // ── Save new usuario ────────────────────────────────────
  const handleSaveNewUsuario = async () => {
    if (!newUsuario.nombre || !newUsuario.email) { alert('Nombre y email son requeridos'); return; }
    setSavingNewUsuario(true);
    try {
      await crearUsuario(newUsuario as any);
      setShowNewUsuario(false);
      setNewUsuario({ nombre: '', email: '', matricula: '', rol: Rol.TRABAJADOR, unidadClave: '', unidadNombre: '' });
      await loadAll();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingNewUsuario(false); }
  };

  // ── Save trabajador edit ─────────────────────────────────
  const handleSaveTrabajador = async () => {
    if (!editTrabajador) return;
    setSavingTrabajador(true);
    try {
      await saveTrabajador({
        ...editTrabajador,
        rol: editTrabRol,
      });
      setEditTrabajador(null);
      await loadAll();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingTrabajador(false); }
  };

  const filteredUsuarios = usuarios.filter(u =>
    !searchTerm || u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.matricula?.includes(searchTerm)
  );

  const filteredTrabajadores = trabajadores.filter(t =>
    !searchTerm ||
    t.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.matricula?.includes(searchTerm) ||
    t.curp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.departamento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rolColor = (rol: Rol) => {
    switch (rol) {
      case Rol.ADMIN: return { bg: '#fef2f2', color: '#dc2626' };
      case Rol.JEFE_SERVICIO: return { bg: '#f0fdf4', color: '#16a34a' };
      case Rol.AREA_PERSONAL: return { bg: '#eff6ff', color: '#2563eb' };
      default: return { bg: '#f9fafb', color: '#6b7280' };
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #d1fae5', borderTopColor: '#005235', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Administración</h2>
        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Gestión de usuarios, unidades, trabajadores y configuración</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
        {([
          { key: 'usuarios', label: 'Usuarios', icon: <Users size={16} /> },
          { key: 'unidades', label: 'Unidades', icon: <Building2 size={16} /> },
          { key: 'trabajadores', label: 'Plantilla', icon: <FileSpreadsheet size={16} /> },
          { key: 'normativa', label: 'Normativa', icon: <ShieldCheck size={16} /> },
          { key: 'seed', label: 'Seed BD', icon: <Database size={16} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem',
              border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              color: tab === t.key ? 'var(--brand-700)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2.5px solid var(--brand-600)' : '2.5px solid transparent',
              background: 'none', marginBottom: '-1px'
            }}>
            <span style={{ color: tab === t.key ? 'var(--brand-600)' : 'var(--text-muted)' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── USUARIOS ─────────────────────────────────────── */}
      {tab === 'usuarios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search + Add */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, email o matrícula..."
                style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={() => setShowNewUsuario(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', background: '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              <Plus size={15} /> Nuevo Usuario
            </button>
          </div>

          {/* Table */}
          <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Usuarios ({filteredUsuarios.length})</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Nombre', 'Email', 'Matrícula', 'Rol', 'Unidad', 'Activo', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map(u => {
                  const rc = rolColor(u.rol);
                  return (
                    <tr key={u.uid} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.nombre ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>{u.matricula ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: rc.bg, color: rc.color, padding: '0.2rem 0.55rem', borderRadius: 999 }}>{TIPO_ROL_LABEL[u.rol] ?? u.rol}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.78rem' }}>{u.unidadNombre ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: u.activo ? '#22c55e' : '#ef4444' }}>{u.activo ? '✓ Activo' : '✗ Inactivo'}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button onClick={() => { setEditUsuario(u); setEditUsuarioRol(u.rol); setEditUsuarioActivo(u.activo ?? true); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.7rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                          <UserCog size={13} /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsuarios.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No se encontraron usuarios</p>}
            {hasMoreUsuarios && (
              <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                <button
                  onClick={loadMoreUsuarios}
                  disabled={loadingMore}
                  style={{ padding: '0.5rem 1.5rem', background: '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: loadingMore ? 'wait' : 'pointer', opacity: loadingMore ? 0.7 : 1 }}
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── UNIDADES ──────────────────────────────────────── */}
      {tab === 'unidades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowNewUnidad(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', background: '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              <Plus size={15} /> Nueva Unidad
            </button>
          </div>
          <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Clave', 'Nombre', 'Tipo', 'Delegación', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr key={u.clave} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>{u.clave}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{u.nombre}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.55rem', borderRadius: 999 }}>{u.tipo}</span></td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{u.delegacion ?? '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button onClick={() => { setEditUnidad(u); setEditUnidadNombre(u.nombre); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.7rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                        <Edit2 size={13} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unidades.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No hay unidades registradas. Ejecuta el Seed BD.</p>}
          </div>
        </div>
      )}

      {/* ── TRABAJADORES / PLANTILLA ─────────────────────── */}
      {tab === 'trabajadores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, matrícula, CURP o departamento..."
                style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500 }}>{filteredTrabajadores.length} trabajadores</span>
          </div>
          <div style={{ background: 'white', borderRadius: '1rem', overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Matrícula', 'Nombre', 'CURP', 'Tipo Plaza', 'Perf. Usuario', 'Unidad', 'Depto', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTrabajadores.map(t => {
                  const rc = rolColor(t.rol as Rol);
                  return (
                    <tr key={t.matricula} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem' }}>{t.matricula}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, maxWidth: 180 }}>{t.nombre}</td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>{t.curp ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: t.tipoPlaza === 'CONFIANZA' ? '#f0fdf4' : '#f5f3ff', color: t.tipoPlaza === 'CONFIANZA' ? '#16a34a' : '#7c3aed', padding: '0.2rem 0.55rem', borderRadius: 999 }}>{t.tipoPlaza ?? '—'}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {t.rol ? <span style={{ fontSize: '0.7rem', fontWeight: 700, background: rc.bg, color: rc.color, padding: '0.2rem 0.55rem', borderRadius: 999 }}>{TIPO_ROL_LABEL[t.rol as Rol] ?? t.rol}</span> : <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>Sin perf.</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.78rem' }}>{t.unidadNombre ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.78rem' }}>{t.departamento ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button onClick={() => { setEditTrabajador(t); setEditTrabRol((t.rol as Rol) || Rol.TRABAJADOR); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.7rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}>
                          <UserCog size={13} /> Editar perf.
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {trabajadores.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ margin: '0 0 1rem' }}>No hay trabajadores cargados en la plantilla.</p>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>Importa el archivo Excel con la plantilla de trabajadores.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NORMATIVA ─────────────────────────────────────── */}
      {tab === 'normativa' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--brand-300)" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Motor Normativo</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Configura fundamentación legal, advertencias y plazos por tipo de trámite.<br />
            <span style={{ fontSize: '0.8rem' }}>Disponible en la próxima versión.</span>
          </p>
        </div>
      )}

      {/* ── SEED ───────────────────────────────────────────── */}
      {tab === 'seed' && <SeedPanel />}
    </div>
  );

  // ── MODAL: Edit Usuario ───────────────────────────────
  if (editUsuario) {
    const rc = rolColor(editUsuarioRol);
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Editar Usuario</h3>
            <button onClick={() => setEditUsuario(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}><X size={20} /></button>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>{editUsuario.nombre}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>{editUsuario.email}</p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: '#374151' }}>Perfil / Rol</label>
            <select value={editUsuarioRol} onChange={e => setEditUsuarioRol(e.target.value as Rol)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, background: 'white', cursor: 'pointer' }}>
              {ROLES.map(r => <option key={r} value={r}>{TIPO_ROL_LABEL[r]}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={editUsuarioActivo} onChange={e => setEditUsuarioActivo(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Usuario activo</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditUsuario(null)} style={{ padding: '0.6rem 1.1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
            <button onClick={handleSaveUsuario} disabled={savingUsuario}
              style={{ padding: '0.6rem 1.1rem', background: '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: savingUsuario ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: savingUsuario ? 0.7 : 1 }}>
              {savingUsuario ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MODAL: Edit Unidad ────────────────────────────────
  if (editUnidad) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Editar Unidad</h3>
            <button onClick={() => setEditUnidad(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}><X size={20} /></button>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: '#374151' }}>Clave</label>
            <input value={editUnidad.clave} readOnly style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', background: '#f9fafb', fontFamily: 'monospace' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: '#374151' }}>Nombre</label>
            <input value={editUnidadNombre} onChange={e => setEditUnidadNombre(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditUnidad(null)} style={{ padding: '0.6rem 1.1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
            <button onClick={handleSaveUnidad} disabled={savingUnidad}
              style={{ padding: '0.6rem 1.1rem', background: '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: savingUnidad ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
              {savingUnidad ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MODAL: New Unidad ────────────────────────────────
  if (showNewUnidad) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Nueva Unidad</h3>
            <button onClick={() => setShowNewUnidad(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}><X size={20} /></button>
          </div>
          {[['clave','Clave (ej: UMF06)'],['nombre','Nombre completo']].map(([k,label]) => (
            <div key={k} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem' }}>{label}</label>
              <input value={(newUnidad as any)[k]} onChange={e => setNewUnidad({...newUnidad, [k]: e.target.value})}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem' }} />
            </div>
          ))}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem' }}>Tipo</label>
            <select value={newUnidad.tipo} onChange={e => setNewUnidad({...newUnidad, tipo: e.target.value})}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem' }}>
              {['UMF','HOSPITAL','HG','HR','OTRO'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowNewUnidad(false)} style={{ padding: '0.6rem 1.1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
            <button onClick={handleSaveNewUnidad} disabled={savingNewUnidad}
              style={{ padding: '0.6rem 1.1rem', background: '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: savingNewUnidad ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
              {savingNewUnidad ? 'Guardando...' : 'Crear unidad'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MODAL: New Usuario ────────────────────────────────
  if (showNewUsuario) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Nuevo Usuario</h3>
            <button onClick={() => setShowNewUsuario(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}><X size={20} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {[['nombre','Nombre completo'],['email','Email'],['matricula','Matrícula'],['unidadClave','Clave Unidad']].map(([k,label]) => (
              <div key={k}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.78rem' }}>{label}</label>
                <input value={(newUsuario as any)[k]} onChange={e => setNewUsuario({...newUsuario, [k]: e.target.value})}
                  style={{ width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.82rem', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem' }}>Perfil / Rol</label>
            <select value={newUsuario.rol} onChange={e => setNewUsuario({...newUsuario, rol: e.target.value as Rol})}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
              {ROLES.map(r => <option key={r} value={r}>{TIPO_ROL_LABEL[r]}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowNewUsuario(false)} style={{ padding: '0.6rem 1.1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
            <button onClick={handleSaveNewUsuario} disabled={savingNewUsuario}
              style={{ padding: '0.6rem 1.1rem', background: '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: savingNewUsuario ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
              {savingNewUsuario ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MODAL: Edit Trabajador ───────────────────────────
  if (editTrabajador) {
    const rc = rolColor(editTrabRol);
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Editar Perfil — {editTrabajador.nombre}</h3>
            <button onClick={() => setEditTrabajador(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}><X size={20} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
            <div>Matrícula: <strong style={{color:'#111'}}>{editTrabajador.matricula}</strong></div>
            <div>Tipo Plaza: <strong style={{color: editTrabajador.tipoPlaza === 'CONFIANZA' ? '#16a34a' : '#7c3aed'}}>{editTrabajador.tipoPlaza}</strong></div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem' }}>Perfil de usuario en SICIP</label>
            <select value={editTrabRol} onChange={e => setEditTrabRol(e.target.value as Rol)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
              {ROLES.map(r => <option key={r} value={r}>{TIPO_ROL_LABEL[r]}</option>)}
            </select>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>Este perfil determina qué puede hacer el trabajador en el sistema.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button onClick={() => setEditTrabajador(null)} style={{ padding: '0.6rem 1.1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
            <button onClick={handleSaveTrabajador} disabled={savingTrabajador}
              style={{ padding: '0.6rem 1.1rem', background: '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: savingTrabajador ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
              {savingTrabajador ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// ── Seed Panel ──────────────────────────────────────────────
const UNIDADES_SEED = [
  { clave: 'UMF01', nombre: 'UMF No. 01 "La Paz"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'UMF02', nombre: 'UMF No. 02 "Los Cabos"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'UMF03', nombre: 'UMF No. 03 "Comondú"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'UMF04', nombre: 'UMF No. 04 "Loreto"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'UMF05', nombre: 'UMF No. 05 "Guerrero Negro"', tipo: 'UMF', delegacion: 'Baja California Sur', activo: true },
  { clave: 'HG01', nombre: 'Hospital General La Paz', tipo: 'HOSPITAL', delegacion: 'Baja California Sur', activo: true },
  { clave: 'HG02', nombre: 'Hospital General San José del Cabo', tipo: 'HG', delegacion: 'Baja California Sur', activo: true },
  { clave: 'HG03', nombre: 'Hospital General Ciudad Constitución', tipo: 'HG', delegacion: 'Baja California Sur', activo: true },
  { clave: 'HR01', nombre: 'Hospital Regional La Paz', tipo: 'HR', delegacion: 'Baja California Sur', activo: true },
  { clave: 'OF01', nombre: 'Oficina de Representación BCS', tipo: 'OTRO', delegacion: 'Baja California Sur', activo: true },
];

const TIPOS_SEED = [
  { id: 'tt-te', tipo: 'TIEMPO_EXTRAORDINARIO', nombre: 'Tiempo Extraordinario', descripcion: 'Solicitud de horas extra', modulo: 'SOLICITUDES_PAGO', fundamento: { clausula: 'Cláusula 55', numeral: '7.1.2.1.4', texto: 'Requiere autorización del jefe inmediato' }, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 5 }, requisitosDocumentales: ['Formato de solicitud firmado', 'Autorización del jefe inmediato'], advertencias: ['No puede exceder 3 horas diarias', 'Requiere autorización previa'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a nómina'], causasRechazo: ['Falta de autorización', 'Exceso de horas'] },
  { id: 'tt-gf', tipo: 'GUARDIA_FESTIVA', nombre: 'Guardia Festiva', descripcion: 'Guardias en días inhábiles', modulo: 'SOLICITUDES_PAGO', fundamento: { clausula: 'Cláusula 48', texto: 'Se pagan al 200% del salario ordinario' }, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 5 }, requisitosDocumentales: ['Control de asistencia', 'Autorización del jefe'], advertencias: ['Verificar que no se duplique'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a nómina'], causasRechazo: ['Duplicidad de guardia'] },
  { id: 'tt-nv', tipo: 'NIVELACION', nombre: 'Nivelación', descripcion: 'Nivelación a plaza superior', modulo: 'SOLICITUDES_PAGO', fundamento: { articulo: 'Art. 46 LFT', numeral: '7.1.2.1.4.2', texto: 'Procede tras 30 días en funciones superiores' }, solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 5, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 15 }, requisitosDocumentales: ['Cédula de nivelación', 'Firma del jefe de servicio'], advertencias: ['Afecta quinquenios y prestaciones', 'Máximo 6 meses consecutivos'], flujoPasos: ['Solicitar', 'Recibir', 'Revisar docs', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'], causasRechazo: ['Documentación incompleta', 'Más de 6 meses'] },
  { id: 'tt-ss', tipo: 'SUSTITUCION', nombre: 'Sustitución', descripcion: 'Sustitución de trabajador ausente', modulo: 'SOLICITUDES_PAGO', fundamento: { clausula: 'Cláusula 50 CCT', numeral: '7.1.2.1.4.1', texto: 'El sustituto percibe el salario del sustituido' }, solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 10 }, requisitosDocumentales: ['CFV del sustituido', 'Autorización del jefe'], advertencias: ['Tiene fecha de término definida', 'No adquiere derechos de base'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'], causasRechazo: ['Sin CFV del sustituido'] },
  { id: 'tt-sc', tipo: 'SOLICITUD_CONTRATO', nombre: 'Solicitud de Contrato', descripcion: 'Alta, modificación o baja de contrato', modulo: 'SOLICITUDES_PAGO', fundamento: { articulo: 'Art. 35 LFT', texto: 'El contrato por tiempo determinado debe especificar la causa de temporalidad' }, solicitaRol: ['JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 10, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 30 }, requisitosDocumentales: ['Contrato firmado', 'Cédula de datos'], advertencias: ['Verificar tipo de contrato conforme al CCT'], flujoPasos: ['Solicitar', 'Recibir', 'Revisar', 'Validar', 'Enviar a Delegación', 'Analisis', 'Nómina'], causasRechazo: ['Contrato mal requisitado'] },
  { id: 'tt-vac', tipo: 'VACACIONES', nombre: 'Vacaciones', descripcion: 'Solicitud de vacaciones anuales', modulo: 'LICENCIAS', fundamento: { clausula: 'Cláusula 65 CCT' }, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 15, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: true, generaPago: true, diasMaximosResolucion: 30 }, requisitosDocumentales: ['Formato de vacaciones', 'Autorización del jefe'], advertencias: ['Verificar días disponibles'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'], causasRechazo: ['Sin días disponibles'] },
  { id: 'tt-lm', tipo: 'LICENCIA_MEDICA', nombre: 'Licencia Médica', descripcion: 'Licencia por incapacidad médica', modulo: 'LICENCIAS', fundamento: { numeral: '7.1.2.2', texto: 'Sujeto al SSMM' }, solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 3, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: false, generaPago: true, diasMaximosResolucion: 60 }, requisitosDocumentales: ['ST-3 o licencia ISSSTE'], advertencias: ['Afecta seguridad social'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis'], causasRechazo: ['Sin documentación médica'] },
  { id: 'tt-lsg', tipo: 'LICENCIA_SGSS', nombre: 'Licencia sin Goce de Sueldo', descripcion: 'Licencia sin goce de sueldo', modulo: 'LICENCIAS', fundamento: { clausula: 'Cláusula 72 CCT', texto: 'Requiere autorización de la dirección' }, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 10, requiereEntregaFisica: true, requiereEnvioDelegacion: true, afectaPrestaciones: true, requiereAutorizacionJefe: true, generaPago: false, diasMaximosResolucion: 30 }, requisitosDocumentales: ['Solicitud firmada y justificada', 'Autorización del director'], advertencias: ['Afecta antigüedad y aguinaldo', 'No genera tiempo extra'], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Enviar a Delegación', 'Analisis', 'Concluir'], causasRechazo: ['Falta de justificación'] },
  { id: 'tt-pe', tipo: 'PASE_ENTRADA', nombre: 'Pase de Entrada', descripcion: 'Registro de entrada fuera de horario', modulo: 'PASES', fundamento: { numeral: '7.1.3.1', texto: 'Registrar el mismo día' }, solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 1, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 1 }, requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'], causasRechazo: [] },
  { id: 'tt-ps', tipo: 'PASE_SALIDA', nombre: 'Pase de Salida', descripcion: 'Salida anticipada o por permiso', modulo: 'PASES', fundamento: { numeral: '7.1.3.2' }, solicitaRol: ['TRABAJADOR'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 1, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 1 }, requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Validar', 'Concluir'], causasRechazo: [] },
  { id: 'tt-rd', tipo: 'RECEPCION_DOC', nombre: 'Recepción de Documentación', descripcion: 'Recepción de documentos diversos', modulo: 'RECEPCION_DOC', fundamento: {}, solicitaRol: ['TRABAJADOR', 'JEFE_SERVICIO'], validaRol: ['AREA_PERSONAL', 'ADMIN'], reglas: { plazoEntregaDias: 5, requiereEntregaFisica: true, requiereEnvioDelegacion: false, afectaPrestaciones: false, requiereAutorizacionJefe: false, generaPago: false, diasMaximosResolucion: 5 }, requisitosDocumentales: [], advertencias: [], flujoPasos: ['Solicitar', 'Recibir', 'Concluir'], causasRechazo: [] },
];

function SeedPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const run = async () => {
    setRunning(true);
    setLogs([]);
    try {
      addLog(`Insertando ${UNIDADES_SEED.length} unidades...`);
      for (const u of UNIDADES_SEED) { await setDoc(doc(db, 'unidades', u.clave), u); addLog(`  ✅ ${u.clave} — ${u.nombre}`); }
      addLog(`Insertando ${TIPOS_SEED.length} tipos de trámite...`);
      for (const t of TIPOS_SEED) { await setDoc(doc(db, 'tipos_tramite', t.id), t); addLog(`  ✅ ${t.tipo}`); }
      addLog('🎉 Seed completado!');
    } catch (e: any) { addLog(`❌ Error: ${e.message}`); }
    setRunning(false);
  };

  return (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Seed — Poblar Base de Datos</h3>
          <p style={{ margin: '0.2rem 0 0', color: '#9ca3af', fontSize: '0.8rem' }}>Crea unidades médicas y tipos de trámite en Firestore.</p>
        </div>
        <button onClick={run} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', background: running ? '#9ca3af' : '#005235', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
          <PlayCircle size={16} /> {running ? 'Ejecutando...' : 'Ejecutar Seed'}
        </button>
      </div>
      <div style={{ background: '#1e293b', borderRadius: 8, padding: '1rem', fontSize: '0.78rem', fontFamily: 'monospace', color: '#e2e8f0', maxHeight: 300, overflow: 'auto' }}>
        {logs.length === 0 ? <span style={{ color: '#64748b' }}>Pulsa "Ejecutar Seed"...</span> : logs.map((l, i) => <div key={i} style={{ marginBottom: 2 }}>{l}</div>)}
      </div>
    </div>
  );
}
