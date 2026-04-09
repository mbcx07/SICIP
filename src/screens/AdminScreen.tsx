import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Building2, ShieldCheck, Database, Plus, X, Edit2, Trash2, PlayCircle, CheckCircle2 } from 'lucide-react';
import type { Usuario } from '../types/sicip';
import { getUsuarios, crearUsuario, actualizarUsuario } from '../services/firebase';
import { getUnidades, saveUnidad } from '../services/firebase';
import { Rol } from '../types/sicip';
import { db } from '../services/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

type Tab = 'usuarios' | 'unidades' | 'normativa' | 'seed';

export default function AdminScreen() {
  const { user } = useOutletContext<{ user: Usuario }>();
  const [tab, setTab] = useState<Tab>('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [u, un] = await Promise.all([getUsuarios(), getUnidades()]);
        setUsuarios(u);
        setUnidades(un);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Administración</h2>
        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Gestión de usuarios, unidades y configuración</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-soft)' }}>
        {([
          { key: 'usuarios', label: 'Usuarios', icon: <Users size={16} /> },
          { key: 'unidades', label: 'Unidades', icon: <Building2 size={16} /> },
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

      {tab === 'usuarios' && (
        <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Usuarios ({usuarios.length})</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-soft)' }}>
                {['Nombre', 'Email', 'Rol', 'Unidad', 'Activo'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.uid} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.nombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'var(--brand-100)', color: 'var(--brand-700)', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>{u.rol}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{u.unidadNombre || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: u.activo ? '#22c55e' : '#ef4444' }}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay usuarios registrados</p>
          )}
        </div>
      )}

      {tab === 'unidades' && (
        <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-soft)' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Unidades ({unidades.length})</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-soft)' }}>
                {['Clave', 'Nombre', 'Tipo', 'Delegación'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unidades.map(u => (
                <tr key={u.clave} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>{u.clave}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{u.nombre}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'var(--brand-100)', color: 'var(--brand-700)', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>{u.tipo}</span></td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{u.delegacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {unidades.length === 0 && (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay unidades registradas</p>
          )}
        </div>
      )}

      {tab === 'normativa' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--brand-300)" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Motor Normativo</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0' }}>
            Configura fundamentación legal, advertencias y plazos por tipo de trámite.<br />
            <span style={{ fontSize: '0.8rem' }}>Disponible en la próxima versión.</span>
          </p>
        </div>
      )}

      {tab === 'seed' && <SeedPanel />}
    </div>
  );
}

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
    addLog('Iniciando seed de datos...');
    try {
      addLog(`Insertando ${UNIDADES_SEED.length} unidades...`);
      for (const u of UNIDADES_SEED) {
        await setDoc(doc(db, 'unidades', u.clave), u);
        addLog(`  ✅ ${u.clave} — ${u.nombre}`);
      }
      addLog(`Insertando ${TIPOS_SEED.length} tipos de trámite...`);
      for (const t of TIPOS_SEED) {
        await setDoc(doc(db, 'tipos_tramite', t.id), t);
        addLog(`  ✅ ${t.tipo}`);
      }
      addLog('🎉 Seed completado!');
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    }
    setRunning(false);
  };

  return (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Seed — Poblar Base de Datos</h3>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Crea unidades y tipos de trámite en Firestore. Una vez hecho, ya no será necesario repetirlo.</p>
        </div>
        <button onClick={run} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', background: running ? 'var(--brand-300)' : 'var(--brand-600)', color: 'white', border: 'none', borderRadius: '0.65rem', fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
          <PlayCircle size={16} /> {running ? 'Ejecutando...' : 'Ejecutar Seed'}
        </button>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.65rem', padding: '1rem', fontSize: '0.78rem', fontFamily: 'monospace', color: '#e2e8f0', maxHeight: 320, overflow: 'auto' }}>
        {logs.length === 0 ? <span style={{ color: '#64748b' }}>Pulsa "Ejecutar Seed" para poblar la base de datos...</span> : logs.map((l, i) => <div key={i} style={{ marginBottom: '0.2rem' }}>{l}</div>)}
      </div>
    </div>
  );
}
