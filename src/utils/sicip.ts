// ============================================================
// SICIP — Utilidades
// ============================================================

import { Estatus, TipoTramite, Rol } from '../types/sicip';
import { TIPO_TRAMITE_LABELS, PLAZO_ENTREGA_DEFAULT_DIAS } from '../constants/sicip';

// ─── Folio ───────────────────────────────────────────────
export function generateFolio(tipo: TipoTramite, unidadClave: string): string {
  const year = new Date().getFullYear();
  const ts = Date.now().toString(36).toUpperCase();
  const tipoPrefix = tipo.substring(0, 4).toUpperCase();
  return `SICIP-${unidadClave}-${year}-${tipoPrefix}-${ts}`;
}

// ─── Fechas ───────────────────────────────────────────────
export function calcularFechaLimite(fechaIncidencia: string, dias = PLAZO_ENTREGA_DEFAULT_DIAS): string {
  const date = new Date(fechaIncidencia);
  date.setDate(date.getDate() + dias);
  return date.toISOString().split('T')[0];
}

export function diasRestantes(fechaLimite: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);
  const diff = limite.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function estaVencido(fechaLimite: string): boolean {
  return diasRestantes(fechaLimite) < 0;
}

export function formatFecha(fecha: string): string {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatFechaTime(fecha: string): string {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Color de estado ──────────────────────────────────────
export function colorPorDiasRestantes(dias: number): string {
  if (dias < 0) return '#b91c1c';    // rojo oscuro
  if (dias === 0) return '#f59e0b'; // ámbar
  if (dias === 1) return '#eab308';  // amarillo
  return '#22c55e';                  // verde
}

// ─── Validadores ─────────────────────────────────────────
export function validarMatricula(mat: string): boolean {
  return /^\d{6,10}$/.test(mat.trim());
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Secure SHA-256 mock (para passwords) ─────────────────
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sicip_salt_2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Inicializar base de trabajadores desde Excel (parse) ──
export function parseExcelToTrabajadores(jsonData: any[]): Partial<any>[] {
  // El Excel puede venir como array de objetos con headers en keys
  return jsonData.map(row => {
    // Detectar columnas por nombre (case-insensitive)
    const keys = Object.keys(row);
    const get = (patterns: string[]) => {
      for (const p of patterns) {
        const k = keys.find(kk => kk.toLowerCase().includes(p.toLowerCase()));
        if (k !== undefined) return row[k];
      }
      return '';
    };

    return {
      matricula: String(get(['matricula', 'no. empleado', 'num_empleado', 'noempleado']) || '').trim(),
      nombre: get(['nombre', 'name', 'nombres']),
      apellidoPaterno: get(['apellido pat', 'apellidopaterno', 'ap_paterno', 'appat']),
      apellidoMaterno: get(['apellido mat', 'apellidomaterno', 'ap_materno', 'appat']),
      curp: get(['curp']),
      rfc: get(['rfc']),
      nss: get(['nss', 'seguro social']),
      area: get(['area', 'departamento', 'depto']),
      categoria: get(['categoria', 'categoría', 'puesto']),
      tipoContrato: get(['tipo contrato', 'tipocontrato', 'contrato']),
      unidadClave: get(['unidad', 'clave unidad', 'clve_unidad', 'cve_unidad']),
      unidadNombre: get(['nombre unidad', 'nom_unidad', 'unidad_nombre']),
      delegacion: get(['delegacion', 'deleg']),
      email: get(['email', 'correo']),
      telefono: get(['telefono', 'tel', 'phone']),
      fechaIngreso: get(['fecha ingreso', 'fecha_ingreso', 'ingreso']),
    };
  }).filter(t => t.matricula && t.nombre);
}
