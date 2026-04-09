/**
 * generateTEPDF.js
 * Genera el PDF oficial de Solicitud de Autorización de Conceptos Extraordinarios
 * (Tiempo Extraordinario y Guardia Festiva) usando jsPDF.
 * Diseño basado en el formato Excel oficial del IMSS.
 */
import jsPDF from 'jspdf';
import { Tramite } from '../types/sicip';
import { OOAD_NOMBRE, INSTITUCION_NOMBRE } from '../constants/sicip';

// ── Configuración de página ───────────────────────────────
const PAGE_W = 215.9; // Carta horizontal mm
const PAGE_H = 279.4;
const M = 10; // margen

// Colores IMSS
const GREEN_DARK = [0, 82, 53];
const GREEN_MED = [0, 107, 71];
const GREEN_LIGHT = [230, 243, 238];
const GRAY = [148, 163, 184];
const BLACK = [15, 23, 42];
const WHITE = [255, 255, 255];

function setFill(doc: jsPDF, color: number[]) { doc.setFillColor(color[0], color[1], color[2]); }
function setDraw(doc: jsPDF, color: number[]) { doc.setDrawColor(color[0], color[1], color[2]); }
function setTextColor(doc: jsPDF, color: number[]) { doc.setTextColor(color[0], color[1], color[2]); }

function cell(doc: jsPDF, x: number, y: number, w: number, h: number, text: string, opts: {
  fontSize?: number; fontStyle?: string; align?: string; valign?: string;
  fill?: boolean; fillColor?: number[]; textColor?: number[]; lineHeight?: number;
} = {}) {
  const {
    fontSize = 8, fontStyle = 'normal', align = 'left', valign = 'middle',
    fill = false, fillColor, textColor: tc = BLACK,
  } = opts;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  if (fill && fillColor) setFill(doc, fillColor);
  if (tc) setTextColor(doc, tc);
  doc.setDrawColor(200, 200, 200);

  if (fill && fillColor) {
    doc.rect(x, y, w, h, 'FD');
  } else {
    doc.rect(x, y, w, h);
  }

  const lines = doc.splitTextToSize(text, w - 4);
  let textY = y + 2;
  if (valign === 'middle') {
    textY = y + (h - lines.length * (fontSize * 0.36)) / 2;
  }
  doc.text(lines, x + 2, textY + fontSize * 0.36);
}

// ── Tipos de concepto ─────────────────────────────────────
export type ConceptoTipo = 'TIEMPO_EXTRAORDINARIO' | 'GUARDIA_FESTIVA';
export type ConceptoSubtipo = 'FESTIVAS' | 'NO_FESTIVAS';

interface TrabajadorTE {
  matricula: string;
  nombre: string;
  categoriaJornada: string;
  motivoCobertura: string;
  numHorasDiarias?: number;
  numDias?: number;
  totalHoras?: number;
}

interface TEDatos {
  conceptoTipo: ConceptoTipo;
  conceptoSubtipo: ConceptoSubtipo;
  unidadNombre: string;
  servicioSolicitante: string;
  fechaSolicitud: string;
  periodo: string;
  trabajadores: TrabajadorTE[];
  observaciones?: string;
  numConsecutivo?: string;
}

// ── Generador principal ───────────────────────────────────
export function generateTEPDF(datos: TEDatos, folio?: string): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

  // ── Header verde ──────────────────────────────────────────
  setFill(doc, GREEN_DARK);
  doc.rect(0, 0, PAGE_W, 18, 'F');

  // Título principal
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, WHITE);
  doc.text('SOLICITUD DE AUTORIZACIÓN DE CONCEPTOS EXTRAORDINARIOS', PAGE_W / 2, 8, { align: 'center' });

  // OOAD info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`OOAD: ${OOAD_NOMBRE}`, M, 14);
  doc.text(`Delegación: 03 BAJA CALIFORNIA SUR`, M + 55, 14);
  doc.text(`Fecha: ${datos.fechaSolicitud}`, PAGE_W - M - 40, 14);

  // ── Tipo de concepto (checkboxes) ─────────────────────────
  const yTipo = 20;
  setFill(doc, GREEN_LIGHT);
  doc.rect(M, yTipo, PAGE_W - 2 * M, 10, 'F');

  const isTE = datos.conceptoTipo === 'TIEMPO_EXTRAORDINARIO';
  const isFestivas = datos.conceptoSubtipo === 'FESTIVAS';

  doc.setFontSize(8.5);
  setTextColor(doc, BLACK);

  // Checkboxes
  const checkBox = (x: number, y: number, checked: boolean, label: string) => {
    setDraw(doc, GREEN_DARK);
    setFill(doc, WHITE);
    doc.rect(x, y, 3.5, 3.5, 'FD');
    if (checked) {
      setFill(doc, GREEN_DARK);
      doc.rect(x + 0.8, y + 0.8, 1.8, 1.8, 'F');
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + 5, y + 3);
  };

  const yCB = yTipo + 2;
  checkBox(M + 2, yCB, !isTE && datos.conceptoTipo === 'GUARDIA_FESTIVA', '35 / 735  GUARDIAS');
  checkBox(M + 42, yCB, isTE, '37 / 737  TIEMPO EXTRAORDINARIO');
  checkBox(M + 100, yCB, !isFestivas, 'NO FESTIVAS');
  checkBox(M + 130, yCB, isFestivas, 'FESTIVAS');

  // ── Datos de unidad y servicio ────────────────────────────
  const yUnit = 32;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, GREEN_DARK);

  // Fila: Unidad
  doc.text('NOMBRE DE LA UNIDAD O DEPENDENCIA', M, yUnit);
  setDraw(doc, [200, 200, 200]);
  setFill(doc, WHITE);
  doc.rect(M, yUnit + 1.5, 120, 7, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, BLACK);
  doc.text(datos.unidadNombre.toUpperCase(), M + 2, yUnit + 6.5);

  // Servicio solicitante
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, GREEN_DARK);
  doc.text('SERVICIO SOLICITANTE', M + 125, yUnit);
  setFill(doc, WHITE);
  doc.rect(M + 125, yUnit + 1.5, 60, 7, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, BLACK);
  doc.text(datos.servicioSolicitante.toUpperCase(), M + 127, yUnit + 6.5);

  // ── Tabla de trabajadores ──────────────────────────────────
  const yTabla = yUnit + 12;

  // Header de tabla
  const cols = [
    { label: 'MATRÍCULA', x: M, w: 22 },
    { label: 'NOMBRE', x: M + 22, w: 52 },
    { label: 'CATEGORÍA Y JORNADA', x: M + 74, w: 40 },
    { label: 'MOTIVO DE COBERTURA', x: M + 114, w: 57 },
    { label: 'PERIODO', x: M + 171, w: 14 },
    { label: 'NUM.HRS\nDIARIAS', x: M + 185, w: 12 },
    { label: 'NUM\nDÍAS', x: M + 197, w: 9 },
    { label: 'TOTAL\nHORAS', x: M + 206, w: 9 },
  ];

  setFill(doc, GREEN_DARK);
  cols.forEach(c => {
    doc.rect(c.x, yTabla, c.w, 9, 'F');
  });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, WHITE);
  cols.forEach(c => {
    const lines = c.label.split('\n');
    doc.text(lines[0], c.x + c.w / 2, yTabla + 3.5, { align: 'center' });
    if (lines[1]) doc.text(lines[1], c.x + c.w / 2, yTabla + 7, { align: 'center' });
  });

  // Filas de trabajadores
  datos.trabajadores.forEach((t, i) => {
    const yRow = yTabla + 9 + i * 10;
    const fillRow = i % 2 === 0;
    setFill(doc, fillRow ? WHITE : GREEN_LIGHT);
    cols.forEach(c => { doc.rect(c.x, yRow, c.w, 10, 'FD'); });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, BLACK);

    const textY = yRow + 4;
    doc.text(t.matricula, M + 22 + 2, textY);
    doc.text(t.nombre.substring(0, 35), M + 74 + 2, textY);
    doc.text(t.categoriaJornada.substring(0, 28), M + 114 + 2, textY);
    doc.text(t.motivoCobertura.substring(0, 40), M + 171 + 2, textY);
    doc.text(String(t.numHorasDiarias || ''), M + 185 + 2, textY, { align: 'center' });
    doc.text(String(t.numDias || ''), M + 197 + 2, textY, { align: 'center' });
    doc.text(String(t.totalHoras || ''), M + 206 + 2, textY, { align: 'center' });
  });

  // ── Observaciones ──────────────────────────────────────────
  const yObs = yTabla + 9 + datos.trabajadores.length * 10 + 3;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, GREEN_DARK);
  doc.text('OBSERVACIONES', M, yObs);
  setFill(doc, WHITE);
  setDraw(doc, [200, 200, 200]);
  doc.rect(M, yObs + 1.5, 120, 14, 'FD');

  if (datos.observaciones) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, BLACK);
    const lines = doc.splitTextToSize(datos.observaciones, 115);
    doc.text(lines.slice(0, 4), M + 2, yObs + 6);
  }

  // ── Firmas ────────────────────────────────────────────────
  const yFirmas = yObs + 18;

  // Área de Personal
  setFill(doc, GREEN_LIGHT);
  doc.rect(M, yFirmas, 80, 30, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, GREEN_DARK);
  doc.text('ÁREA DE PERSONAL', M + 2, yFirmas + 4);

  setDraw(doc, [150, 150, 150]);
  doc.line(M + 5, yFirmas + 22, M + 75, yFirmas + 22);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, GRAY);
  doc.text('SELLO / ACUSE DE RECIBIDO', M + 2, yFirmas + 25);

  // Firma Jefatura de Servicio
  setFill(doc, GREEN_LIGHT);
  doc.rect(M + 85, yFirmas, 65, 30, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setTextColor(doc, GREEN_DARK);
  doc.text('AUTORIZACIÓN DE LA PERSONA TITULAR', M + 87, yFirmas + 4);
  doc.text('DE LA JEFATURA DE LA DEPENDENCIA', M + 87, yFirmas + 8);

  setDraw(doc, [150, 150, 150]);
  doc.line(M + 90, yFirmas + 22, M + 145, yFirmas + 22);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, GRAY);
  doc.text('FIRMA Y SELLO', M + 102, yFirmas + 25);

  // Folio
  if (folio) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, GRAY);
    doc.text(`Folio: ${folio}`, PAGE_W - M - 35, PAGE_H - M);
  }

  // Clave de formato
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, GRAY);
  doc.text('1A74-009-003', PAGE_W / 2, PAGE_H - M, { align: 'center' });

  // ── Footer institucional ──────────────────────────────────
  setFill(doc, GREEN_DARK);
  doc.rect(0, PAGE_H - 7, PAGE_W, 7, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, WHITE);
  doc.text(`${INSTITUCION_NOMBRE} — ${OOAD_NOMBRE} — SICIP`, PAGE_W / 2, PAGE_H - 3, { align: 'center' });

  return doc;
}

// ── Helper para extraer datos del trámite ─────────────────
export function tramiteToTEDatos(t: Tramite): TEDatos {
  const datos = t.datos as any || {};

  const nombreCompleto = t.trabajadorNombre || '';
  const nombreParts = nombreCompleto.split(' ');
  const nombreFormateado = nombreParts.join(' ').toUpperCase();

  return {
    conceptoTipo: t.tipo === 'GUARDIA_FESTIVA' ? 'GUARDIA_FESTIVA' : 'TIEMPO_EXTRAORDINARIO',
    conceptoSubtipo: datos.esFestiva ? 'FESTIVAS' : 'NO_FESTIVAS',
    unidadNombre: t.unidadNombre || '',
    servicioSolicitante: datos.servicioSolicitante || '',
    fechaSolicitud: t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX'),
    periodo: datos.periodo || '',
    trabajadores: [{
      matricula: t.trabajadorMatricula || '',
      nombre: nombreFormateado,
      categoriaJornada: datos.categoriaJornada || '',
      motivoCobertura: datos.motivo || '',
      numHorasDiarias: datos.totalHoras || 0,
      numDias: datos.numDias || 1,
      totalHoras: datos.totalHoras || 0,
    }],
    observaciones: datos.observaciones || '',
  };
}

// ── Abrir diálogo de impresión ─────────────────────────────
export function printTEPDF(datos: TEDatos, folio?: string) {
  const doc = generateTEPDF(datos, folio);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}
