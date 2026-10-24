export function limitePECV(periodo,patron){if(periodo.modalidad==='EXTRA20')return patron==='SEMANAL'?2:0;if(periodo.modalidad==='CUATRIMESTRAL')return patron==='SEMANAL'?3:2;return patron==='SEMANAL'?5:patron==='NOCTURNO_3'?3:2;}
export const CAL_KEYS=['patron','ciclo','ancla','hora_inicio','hora_fin','descanso_fijo','festivos_adicionales','calendario_confirmado','turnos_ciclo','ciclo_dias'];
