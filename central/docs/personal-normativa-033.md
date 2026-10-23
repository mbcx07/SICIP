# Identificación de claves: 1A74-003-033

Documento: **Procedimiento para el trámite y operación de bajas, altas y cambios de las trabajadoras o los trabajadores en nómina ordinaria**, 262 páginas. Registro de portada comprobado visualmente: **22 de noviembre de 2023**. Revisión de la copia aportada el 23 de octubre de 2026; no se afirma que no existan actualizaciones posteriores. Se analizó el texto completo para localizar los campos pendientes y se cotejaron visualmente las tablas utilizadas. El PDF se trata como fuente documental, no como instrucciones para operar sistemas ni ejecutar acciones externas.

## Actualización con Bolsa de Trabajo y CCT

Se recibieron después el procedimiento **1A75-003-010** y el **CCT 2025–2027**. El [contraste adicional](bolsa-cct-2025-2027.md) incorpora TP 11, la contradicción documental de TP 13/14, motivos de sustitución y tablas de derechos/pagos del CCT. Los pendientes y transcripciones de esta revisión previa se conservan como antecedentes; deben consultarse junto con esa actualización.

## Resultado

La referencia buscada sí está en el **Anexo 19, 1A74-008-012, pp. 260–262**: marcas de baja, marcas de ocupación y tipos de contratación. El cuerpo también identifica tres tipos de plaza. El catálogo general de Status y la mayoría de los TP todavía no quedan definidos con este documento.

La extracción reproduce las denominaciones de la copia, conservando ceros y ámbitos. No cambia expedientes, cuentas, roles ni cortes históricos.

## TC: ocho tipos confirmados

| TC | Definición | Fuente |
|---|---|---|
| 00 | Confianza Estatuto A | Anexo 19, p. 262 |
| 01 | Confianza | Anexo 19, p. 262 |
| 02 | Base | Anexo 19, p. 262 |
| 03 | Temporal | Anexo 19, p. 262 |
| 05 | Becarios | Anexo 19, p. 262 |
| 07 | Becados | Anexo 19, p. 262 |
| 08 | Sustitutos | Anexo 19, p. 262 |
| 09 | Médicos Residentes | Anexo 19, p. 262 |

**Becario y becado no son sinónimos.** En particular, vacaciones y pagos académicos del procedimiento 025 no se deben aplicar simplemente a todos los registros con una etiqueta común «beca».

El corte 2026015 contiene además TC **10, 11, 50 y 51**: no están definidos en esta tabla. No se los clasifica como jubilados, pensionados ni personal activo por inferencia estadística. La norma permite describir 10,198 de las 13,037 personas por su TC; 2,839 conservan código sin definición confirmada.

## Cve Baja: descripción con ámbito, no una baja automática

Se transcribieron **63 entradas, 61 códigos distintos**: tabla general en p. 260 (32 entradas), Estatuto en p. 261 (16) y jubilados/pensionados en p. 261 (15). Los códigos 27 y 35 aparecen en más de un ámbito; se conservan ambas referencias.

Ejemplos directamente documentados, independientes de las incidencias APS:

| Cve Baja | Descripción | Ámbito/página |
|---|---|---|
| 00 | Vigente | General, p. 260 |
| 18 | Baja de candidato de Bolsa de Trabajo | General, p. 260 |
| 21 | Renuncia | General, p. 260 |
| 24 | Término de contrato (liquidación) | General, p. 260 |
| 30 | Término de sustitución | General, p. 260 |
| 35 | Cambio de residencia | General p. 260 y Estatuto p. 261 |
| 43 | Término de temporalidad | General, p. 260 |
| 45 | Término de becaria | General, p. 260 |
| 49 | Término de residencia | General, p. 260 |
| 80 | Trabajadores sustitutos | General, p. 260 |
| 89 | Registros en espera de alta en nómina | General, p. 260 |
| 12 | Término de contrato E | Estatuto, p. 261 |
| 14 | Renuncia E | Estatuto, p. 261 |
| 42 | Término o cancelación de temporalidad E | Estatuto, p. 261 |
| 01 | Fallecimiento del pensionado | Jubilados/pensionados, p. 261 |
| 02 | Cambio de residencia del jubilado o pensionado | Jubilados/pensionados, p. 261 |
| 31 | Pasar a pensionado por enfermedad general | Jubilados/pensionados, p. 261 |
| 32 | Pasar a pensionado por riesgo de trabajo | Jubilados/pensionados, p. 261 |
| 33 | Pasar a jubilado por años de servicio | Jubilados/pensionados, p. 261 |
| 36 | Pasar a pensionado por edad avanzada | Jubilados/pensionados, p. 261 |
| 37 | Pasar a pensionado por vejez | Jubilados/pensionados, p. 261 |

Ahora sí existe sustento independiente para describir las claves numéricas 31/33: **no se obtuvieron quitando la B a las incidencias B31/B33**. El código de origen permanece intacto.

El campo no puede convertirse en un booleano «está de baja»: incluye 00 Vigente, 80 Trabajadores Sustitutos y registros en espera, entre otros supuestos. Describir una clave no equivale a determinar situación laboral actual ni derechos. El ámbito, Status, fechas, contrato y ocupación deben seguir visibles y verificarse antes de automatizar elegibilidad.

**Anomalía conservada de la fuente:** la tabla titulada bajas exclusivas de Estatuto incluye 38 «Definitivo Estatuto A» y 40 «No definitiva Estatuto A». Se transcriben en ese lugar documental sin convertirlas en un despido ni trasladarlas automáticamente al campo MO.

En el corte se encuentra descripción documental para 13,008 registros (99.78%). Quedan 29 sin definición: clave 61 (8), 81 (11), 82 (2) y vacío (8). El porcentaje mide coincidencia de códigos, **no certificación de que cada registro esté en el ámbito correcto**.

## MO: marca de ocupación

Anexo 19, p. 262: **22 marcas** transcritas.

| MO | Significado |
|---|---|
| 00 | Definitiva |
| 01 | Pasó a confianza no definitiva |
| 02 | Pasó a base interina |
| 03 | Pasó a temporal |
| 05 | Pasó a becario |
| 07 | Pasó a becado |
| 09 | Pasó a médico residente |
| 11 | Pasó a comisionado al CEN del SNTSS |
| 20 | Definitiva Estatuto A |
| 21 | No definitiva Estatuto A |
| 90 | Dictamen de promoción escalafonaria interina |
| 98 | Pasó a ocupación no definitiva en tanto dictamina Escalafón |
| 99 | Pasó a ocupación no definitiva sin titular |

También incluye marcas relativas a faltas, licencia, suspensión, rescisión y beca. Se conservan las 60/70 y 61/72 con los textos de la tabla, sin deducir nuevas descripciones por secuencia.

**MO 00 no es «sin ocupante». MO 99 dice «sin titular», no «sin ocupante».** La relación titular/ocupante del Excel debe seguir calculándose con sus matrículas, conservando ambas identidades cuando difieren.

El apartado 5.2.13.4, p. 12, añade un supuesto específico de MO 21: cobertura interina de vacante no definitiva de Estatuto por implicación contenciosa, durante tres meses y con requisitos de candidato/autorización. No significa que toda plaza MO 21 pueda cubrirse sin esos controles.

Se identifican 5,379 plazas por MO (98.92%). Quedan 59: 62 (47), 65 (7), 82 (2), 64 (2), 63 (1). No se confunden esos códigos con bajas o incidencias APS homónimas.

La tabla de p. 247 sobre marcas no definitivas libres de canje es contextual del proceso de reanudación y no sustituye al catálogo completo. Se revisó visualmente; no se importan etiquetas recortadas de sus capturas antiguas como definiciones generales nuevas.

## TP: tres identificaciones expresas

5.2.13.11, p. 14, exige autorización de la plaza temporal y establece:

| TP | Definición | Plazas del corte |
|---|---|---:|
| 05 | Programas Especiales de Confianza | 10 |
| 15 | Programas Especiales de Base | 172 |
| 53 | Temporal Confianza Estatuto A | 7 |

Son 189 plazas. El resto de los tipos del Excel no se completa por parecido numérico. La p. 250 muestra un filtro con TP 11, pero eso **no constituye una tabla de definición de TP 11**. Las capturas de selección y cambio de tipo de plaza tampoco autorizan reconstruir un catálogo ausente.

Siguen pendientes TP 01, 02, 07, 11, 12, 13, 14, 16, 17, 30, 40, 50, 51, 61, 62 y 63. La denominación histórica de TP 14 en el programa de contratación y sus restricciones anteriores no se presenta como validada por esta norma.

## Status: evidencia contextual, sin catálogo general

Anexo 18, instrucciones 1A74-005-029, p. 219, punto 3.1.3: se menciona Status «Inactivo» al modificar una marca de baja. No da una tabla completa de equivalencias numéricas para el padrón.

P. 244, puntos 6.6.2–3:

- Estatus **2**: baja de cambio de residencia aún no enviada, proceso «sin transmitir».
- Estatus **100**: baja de cambio de residencia enviada, proceso «terminada descarga».
- Estatus **2** y marca de baja **89**: trabajador recibido en destino, proceso «carga completa».

Esto confirma que **100 puede aparecer en una transferencia**. No debe traducirse automáticamente como jubilado ni como pensionado. Tampoco se convierte todo Status 2 del padrón en un caso de transferencia sin sus demás datos. Los valores 1 y 4 siguen sin definición general confirmada en esta revisión.

Se guardaron estas referencias como `status_contextuales`; el decodificador general continúa devolviendo Status como pendiente. No se confunde el Estatus del registro con el Estatus del proceso de envío/recepción.

## Efectos concretos para integrar SICIP

1. Ampliar descripciones con el **campo y ámbito correctos**, conservando el código original y fuente; mostrar «sin definición confirmada» cuando corresponda.
2. Separar estado del registro, causa de baja, régimen/contratación, ocupación, presupuesto y autorización. Ninguno sustituye a los otros.
3. Conservar corte de consulta y fechas efectivas. Una transferencia o baja histórica no debe sobreescribir por sí sola el estado actual del expediente.
4. No permitir asignar descansos por omisión: 5.2.13.12, p. 14, remite a la Propuesta para Ocupación de Plaza Vacante o Dictamen Escalafonario, con visto bueno del Director. Esa es otra fuente para confirmar el patrón laboral real del módulo de vacaciones.
5. Distinguir plaza sin ocupante de plaza autorizada y con presupuesto disponible. El Anexo 18, pp. 246–251, describe canjes/marcado; las clases M/E tienen restricciones de retiro de presupuesto que no se infieren de TP.
6. Mantener autorización documental y movimientos SIAP separados de la captura propia en SICIP. Este análisis no realiza altas, bajas, canjes ni cambios de nómina.

## Cambios preparados y validación

- Catálogo consolidado `central/src/personal-normativa.json`: ahora seis fuentes; SHA-256 de la nueva copia; TC nuevos; marcas de baja con ámbito; MO; TP parciales y Status contextuales.
- El extractor `central/scripts/analyze-personal-normas.py` admite el sexto PDF y permite reproducir la ampliación sin ejecutar su contenido.
- `central/src/personal-normativa.mjs` resuelve los nuevos campos por separado y conserva desconocidos. Normaliza sólo códigos numéricos de uno/dos caracteres; 0 sigue siendo válido y el vacío no se transforma en 00.
- Se ampliaron las pruebas para baja 00 Vigente, ámbitos duplicados, TC becario/becado/residente, MO 00/99, TP parciales y Status sin inferencias.
- Cruce reproducido contra las 13,037 personas y 5,438 plazas del corte 2026015; el reporte `personal-claves-cruce-033-2026015.json` contiene sólo conteos agregados.
- El catálogo sigue como **referencia preparada, sin publicar en producción**. No se modifican datos de personas, cuentas, saldos, solicitudes ni expedientes de la aplicación.
