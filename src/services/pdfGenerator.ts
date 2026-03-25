// ============================================================
// SICIP — PDF Generator (jsPDF)
// ============================================================
import { jsPDF } from 'jspdf';
import type { Tramite, Usuario } from '../types/sicip';
import { TIPO_TRAMITE_LABELS, ESTATUS_LABELS, INSTITUCION_NOMBRE, OOAD_NOMBRE } from '../constants/sicip';
import { formatFecha, formatFechaTime } from '../utils/sicip';

const BRAND = [0, 92, 63];      // var(--brand-600)
const BRAND_DARK = [0, 51, 36]; // var(--brand-900)
const TEXT = [15, 23, 42];
const MUTED = [100, 116, 139];

function header(doc: jsPDF, title: string, folio: string) {
  // Top bar
  doc.setFillColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.rect(0, 0, 210, 28, 'F');

  // IMSS text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(INSTITUCION_NOMBRE, 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(OOAD_NOMBRE, 14, 18);

  // Folio
  doc.setFontSize(8);
  doc.text(`Folio: ${folio}`, 14, 24);

  // Title
  doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);

  // Line
  doc.setDrawColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.setLineWidth(0.8);
  doc.line(14, 43, 196, 43);
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`SICIP — ${INSTITUCION_NOMBRE}`, 14, 287);
    doc.text(`Página ${i} de ${pageCount}`, 196, 287, { align: 'right' });
    doc.text(new Date().toLocaleDateString('es-MX'), 105, 287, { align: 'center' });
  }
}

function section(doc: jsPDF, y: number, title: string, rows: [string, string][]) {
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 16, y + 5.5);
  let cy = y + 12;
  doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const [label, value] of rows) {
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(label + ':', 16, cy);
    doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
    doc.text(String(value || '—'), 70, cy);
    cy += 6;
  }
  return cy + 4;
}

// ─── Solicitud de Pago ──────────────────────────────────────
export function generarPDFSolicitudPago(tramite: Tramite, solicitante: Usuario): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const folio = tramite.folio;
  const titulo = TIPO_TRAMITE_LABELS[tramite.tipo] || 'Solicitud de Pago';

  header(doc, titulo, folio);

  // Info general
  let y = 50;
  y = section(doc, y, 'Datos del Trámite', [
    ['Folio', folio],
    ['Tipo', titulo],
    ['Fecha de creación', formatFechaTime(tramite.fechaCreacion)],
    ['Fecha de incidencia', tramite.fechaIncidencia ? formatFecha(tramite.fechaIncidencia) : '—'],
    ['Fecha límite de entrega', tramite.fechaLimiteEntrega ? formatFecha(tramite.fechaLimiteEntrega) : '—'],
    ['Estado actual', ESTATUS_LABELS[tramite.estatus] || tramite.estatus],
    ['Unidad', `${tramite.unidadClave} — ${tramite.unidadNombre}`],
  ]);

  y = section(doc, y, 'Datos del Trabajador', [
    ['Nombre', tramite.trabajadorNombre],
    ['Matrícula', tramite.trabajadorMatricula],
    ['Solicitante', solicitante.nombre],
  ]);

  // Datos específicos
  const d = tramite.datos as any;
  if (d) {
    const rows: [string, string][] = [];
    if (d.motivo) rows.push(['Motivo', d.motivo]);
    if (d.horaInicio && d.horaFin) rows.push(['Horario', `${d.horaInicio} a ${d.horaFin}`]);
    if (d.totalHoras) rows.push(['Total horas', `${d.totalHoras}h`]);
    if (d.dias) rows.push(['Días', `${d.dias}`]);
    if (d.trabajadorSustituidoNombre) rows.push(['Trabajador sustituido', `${d.trabajadorSustituidoMatricula} — ${d.trabajadorSustituidoNombre}`]);
    if (d.plazaActual) rows.push(['Plaza actual', d.plazaActual]);
    if (d.plazaSuperior) rows.push(['Plaza superior', d.plazaSuperior]);
    if (d.importSolicitado) rows.push(['Importe solicitado', `$${Number(d.importSolicitado).toLocaleString('es-MX')}`]);
    if (d.qnaPago) rows.push(['Quincena de pago', d.qnaPago]);
    if (rows.length > 0) {
      y = section(doc, y, 'Detalles de la Solicitud', rows);
    }
  }

  // Firmas
  y = Math.max(y + 10, 220);
  doc.setDrawColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.setLineWidth(0.3);

  // Firma solicitante
  doc.rect(20, y, 70, 30);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.setFontSize(7);
  doc.text('Firma del Solicitante', 55, y + 38, { align: 'center' });
  doc.text('Nombre: ' + solicitante.nombre, 55, y + 43, { align: 'center' });

  // Firma validador
  doc.rect(120, y, 70, 30);
  doc.text('Firma y Sello del Área de Personal', 155, y + 38, { align: 'center' });

  footer(doc);
  return doc;
}

// ─── Pase ────────────────────────────────────────────────
export function generarPDFPase(tramite: Tramite): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const d = tramite.datos as any;
  const tipoPase = d?.tipoPase ? TIPO_TRAMITE_LABELS[d.tipoPase] : 'Pase';

  header(doc, tipoPase, tramite.folio);

  let y = 50;
  y = section(doc, y, 'Datos del Pase', [
    ['Tipo', tipoPase],
    ['Fecha', d?.fecha ? formatFecha(d.fecha) : '—'],
    ['Hora', d?.hora || '—'],
    ['Motivo', d?.motivo || '—'],
    ['Destino', d?.destino || '—'],
  ]);

  y = section(doc, y, 'Datos del Trabajador', [
    ['Nombre', tramite.trabajadorNombre],
    ['Matrícula', tramite.trabajadorMatricula],
    ['Unidad', `${tramite.unidadClave} — ${tramite.unidadNombre}`],
  ]);

  footer(doc);
  return doc;
}

// ─── Generic print ────────────────────────────────────────
export function printTramite(tramite: Tramite, usuario: Usuario) {
  let doc: jsPDF;
  if ([3, 4, 5, 6, 7].includes(Number(tramite.tipo))) {
    doc = generarPDFPase(tramite);
  } else {
    doc = generarPDFSolicitudPago(tramite, usuario);
  }
  window.open(doc.output('dataurlstring'), '_blank');
}
