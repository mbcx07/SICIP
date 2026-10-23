# Identificación de claves y restricciones: cinco procedimientos de Personal

Revisión: 23 de octubre de 2026. Se extrajo el texto de los cinco PDF aportados, se buscaron los campos pendientes y se revisaron visualmente las portadas y las tablas de horarios e incidencias utilizadas. Se registran las fechas visibles en sus sellos, no las fechas de creación digital del PDF. Estas copias son fuentes documentales; no se afirma que no existan reformas posteriores. No se ejecuta contenido de los documentos ni se interpretan sus disposiciones como instrucciones para realizar acciones externas.

## Actualización con el procedimiento 033

Se recibió posteriormente **1A74-003-033**, registrado el 22/11/2023. El [análisis del sexto documento](personal-normativa-033.md) incorpora tablas numéricas de bajas y MO, TC 05/07/09, tres TP y referencias contextuales de Status. Los pendientes indicados abajo corresponden a la revisión inicial de cinco documentos; su estado actualizado está en ese análisis. Se preservan las advertencias sobre campos y ámbitos: APS y Cve Baja siguen siendo catálogos separados.

## Fuentes recibidas

| Clave | Procedimiento | Registro de portada | Páginas | Aplicación en SICIP |
|---|---|---|---:|---|
| 1A74-003-023 | Autorización de guardias | 10/01/2024 | 38 | Guardias festivas y en descanso semanal, conceptos 35/735/35A y sustitución festiva 08B. |
| 1A74-003-037 | Autorización de nivelación a plaza superior | 15/12/2023 | 18 | Concepto 10, elegibilidad y diferencia salarial. |
| 1A74-003-034 | Control de asistencia, puntualidad y sustituciones | 27/10/2023 | 337 | Incidencias APS, pases, firmas autorizadas, horarios personales y registro de sustituciones. |
| 1A74-003-032 | Modificación de horarios institucionales | 05/04/2024 | 37 | Catálogos de horarios exclusivos, frecuencia de asistencia y autorización de cambios. |
| 1A74-003-031 | Autorización de tiempo extraordinario | 24/10/2023 | 21 | Conceptos 37/737, programas especiales, límites y presupuesto. |

## Campo TC: identificación confirmada

1A74-003-031, definiciones 4.5–4.6 (p. 4) y nota de 4.15 (p. 5), identifica expresamente estos tipos. Lo confirman 1A74-003-023, 5.2.6–7 (p. 9), y 1A74-003-032, 5.2.3 (p. 6).

| TC normalizado | Nombre | Precaución |
|---|---|---|
| 00 | Estatuto de Confianza A | El valor original 0 es una clave válida: no significa vacío, ausencia ni baja. |
| 01 | Confianza | No confundir con Estatuto. |
| 02 | Base | No garantiza por sí mismo elegibilidad para cualquier cobertura. |
| 03 | Temporal | Verificar vigencia contractual y condiciones del trámite. |
| 08 | Sustituto | «Suplente» es la denominación funcional usada previamente por el usuario; conservar el código y la denominación normativa. |

El corte central 2026015 contiene 422 personas con TC 0 y 160 plazas con TC 0. Son registros de aquel corte; no se afirma que todos estén activos actualmente. Los TC 5, 7, 9, 10, 11, 50 y 51 del padrón siguen sin identificación suficiente en estos cinco procedimientos. No inferir jubilación ni suplencia a partir de ellos.

## Los campos no comparten un catálogo

| Campo o espacio de claves | Qué se identificó | Qué no debe inferirse |
|---|---|---|
| TC | 00, 01, 02, 03 y 08 | Situación laboral actual o causa de baja. |
| Incidencia APS | Anexo 13 de 034, catálogo 1A74-008-144, pp. 144–146 | Que el mismo número sea un TP, MO o Cve Baja. |
| Concepto | 10, 35/735, 37/737 y 08B con su contexto | Que el código APS y el de nómina sean siempre idénticos; Estatuto usa, por ejemplo, incidencia E37 y concepto 737. |
| Horario | Anexos 1, 2 y 5 de 032 | Días concretos de descanso o anclaje de un ciclo sólo por su prefijo. |
| TP | No se encontró una tabla completa que traduzca los valores del Excel | Que TP 11 signifique lo mismo que TC 11, o TP 14 que incidencia 14. |
| MO | Sin catálogo completo identificado | Que MO 0 sea ausencia de dato, o MO 99 una vacante por simple intuición. |
| Status | Sin correspondencia documentada con el campo del padrón | Convertir Status 1/2/100/4 en activo/jubilado sin su catálogo. |
| Cve Baja | Sin correspondencia documentada con las claves numéricas del padrón | Quitar la B de B31/B33 y aplicarlo como código de baja numérico. |

El catálogo APS sí define **B31 = trabajador pasó a pensionado**, **B33 = trabajador pasó a jubilado** y **B35 = cambio de residencia** (pp. 144–145). Son incidencias APS: no prueban la interpretación de Cve Baja 31, 33 o 35. Tampoco un movimiento histórico aislado prueba la situación actual.

El corte tiene 19 valores distintos de TP, 21 de MO, 4 de Status y 38 de Cve Baja. Se conservaron los códigos originales y se generaron conteos agregados en `personal-claves-corte-2026015.json`, sin nombres ni matrículas.

La referencia más concreta para continuar con los catálogos de altas/bajas y plazas es **1A74-003-033**, que el procedimiento 032 remite expresamente en su p. 8, junto con las instrucciones SIAP **1A74-005-029** (Anexo 18). Es una pista documental; no se afirma que esos catálogos estén allí sin revisar la copia correspondiente.

## Horarios: qué permite comprobar la norma

### Catálogo exclusivo de Estatuto

032, Anexo 5, clave **1A74-008-011**, pp. 36–37: 67 claves extraídas conservando descripción y turno. Se cruzaron con el campo `horario_codigo`: 14 claves distintas coinciden en 160 plazas; todas esas plazas tienen TC 0 en el corte. La coincidencia respalda ese cruce, sin reclasificar automáticamente por una letra final.

Hay ciclos que invalidan una regla genérica de «cinco días y descanso sábado/domingo»: 062E/063E trabajan 10 días y descansan 4; 064E/065E trabajan 6 y descansan 1; otros horarios son alternos o acumulados. Requieren fecha de anclaje y descansos efectivos para generar el calendario vacacional.

**Conservar anomalías de la fuente:** F66E aparece con turno 1 aunque su descripción es acumulada de fin de semana; X66E también aparece con turno 1. Se conserva tal como está documentado y se señala para revisión, sin cambiarlo automáticamente a turno 5.

### Frecuencia de registros

032, Anexo 2, clave **1A74-008-009**, p. 25:

| Primer carácter | Registros semanales | Texto de la tabla |
|---|---:|---|
| B | 4 | Cuatro veces a la semana. |
| C | 3.5 | Cada tercer día o tres días y domingos alternos. |
| D | 3 | Tres días a la semana. |
| E | 2.5 | Dos días por semana y domingos alternos. |
| F | 2 | Dos días a la semana. |
| 0 | 5 | Cinco días a la semana. |

Son frecuencias de asistencia, no equivalencias normativas de vacaciones ni divisores salariales. Resolver primero el horario completo del catálogo aplicable: **062E no debe transformarse en cinco registros semanales por empezar con 0**. Mantener las claves como texto y conservar ceros iniciales.

### Horarios por categoría y servicio

032, Anexo 1, clave **1A74-008-010**, pp. 22–23: se conservaron ocho grupos con categoría/contexto y horarios. Incluyen Médico Familiar 20360280, Médico No Familiar 20360180, traslado de pacientes 20730180/20730080, Cirujano Maxilofacial 20100080, Estomatólogo 20220080, Químico Clínico 21560080 y Jefe de Sección 22560080, y Médico General 20360480.

El contexto es obligatorio: 20360480 tiene horarios distintos para consulta externa de UMF hasta 10 consultorios y para atención médica continua. 20360280 también aparece en dos grupos según servicio. No unir todas las listas y presentar cualquier horario como autorizado para cualquier servicio. Las categorías de orientadores se citan por nombre, sin inventar un código ausente de la tabla.

### Modificaciones de horario

032, 5.2.2–5 (pp. 6–7): ocupar plaza definitiva; cambio temporal hasta 120 días naturales, sin prórroga; aplicar sólo a TC 0/1/2/3 en los supuestos previstos; sustitutos TC 8 e interinos que cubren al titular deben respetar el horario de la plaza, sin modificarlo. Usar clave vigente del catálogo SIAP y horario exclusivo análogo cuando corresponda.

5.2.8–13: autoridades y anticipación del trámite; no implicar cambio de turno para modificación definitiva; comienzo de quincena salvo horarios móviles; distinguir temporal por horarios personales de APS y definitivo reflejado en la base SIAP. Guardar vigencia y autorización en SICIP no equivale a modificar SIAP.

## Nivelación: 037

Concepto **10**. No es la diferencia salarial entre dos puestos elegidos libremente.

- 5.2.4–9, pp. 7–8: presupuesto autorizado; trabajador de base del mismo centro/ámbito de adscripción; categoría prioritaria; categoría inmediata inferior de la misma rama, o cambio de rama registrado para categoría autónoma/pie de rama en los supuestos normativos.
- 5.2.10, p. 7: lista específica de categorías médicas de confianza y Subjefe de Enfermeras que se pueden cubrir; no todas las plazas de confianza.
- 5.2.11–14, p. 8: motivos expresos; vacaciones sólo cuando no existan plazas cubre-vacaciones; plaza en plantilla autorizada, excluyendo compensadas/sobrantes; actividad sindical del representante no cubierta por este concepto.
- 5.2.15–17, p. 8: respetar turno, horario y descansos de la plaza nivelada; registro de asistencia; no autorizar si el trabajador nivelado presenta ausentismo.
- **5.2.18, pp. 8–9**: con cambio de rama registrado y categoría igual a la plaza, 100% de diferencia salarial. En casos urgentes e imprescindibles sin ese cambio registrado, o al nivelar confianza, diferencia sin exceder 35% del salario del trabajador nivelado. No aplicar 35% como regla universal ni pagarlo automáticamente como porcentaje fijo.

El tabulador central aporta valores salariales, pero no demuestra rama, cambio de rama autorizado, categoría prioritaria, ausencia ni disponibilidad de una plaza cubre-vacaciones. Esos datos deben incorporarse o certificarse antes de autorizar. El formato es **Solicitud de sustitución 1A74-009-100**, no el de conceptos extraordinarios; la referencia al Excel inicial debe cotejarse con ese formato normativo.

## Tiempo extraordinario: 031

Concepto **37** para TC 01/02/03/08 y **737** para TC 00 (4.5–6 y nota de 4.15). No usar el mismo concepto para ambos regímenes.

5.2.7–12, pp. 9–10: presupuesto autorizado, programa especial identificado con su clave alfanumérica cuando corresponda; pertenecer al mismo OOAD, cargo a unidad autorizante; condiciones sobre candidatos en Bolsa y motivos de cobertura; no ausentismo del ejecutante; límite general de **9 horas semanales y 20 quincenales**, con las excepciones expresamente citadas. Se debe acumular lo autorizado en otras solicitudes/unidades del mismo trabajador para comprobar el límite, no validar formulario por formulario de forma aislada.

5.2.13–20, p. 11: tope salarial para confianza N41; Estatuto SA1; para categoría superior se paga considerando el tope, no se deduce una prohibición absoluta. Diferenciar horario normal del extraordinario. En otra unidad tras jornada normal, una hora de separación; misma unidad, un minuto, con registros y excepciones previstas. Calcular con salario de la categoría ostentada y horas efectivas, no el salario de la plaza cubierta.

5.2.21, p. 12: actividad sindical puede cubrirse por 37 bajo condiciones específicas. No reutilizar la prohibición de nivelación 10 como prohibición general de tiempo extra. Formato **1A74-009-003**.

## Guardias: 023

5.2.1–2, pp. 6–8: distinguir guardia festiva **35/735** de descanso semanal **35A**. TC 0 usa 735; TC 1/2/3/8 usa 35 en la regla general (5.2.6–7). El **sustituto contratado para guardia festiva 08B** tiene tratamiento particular en 5.2.31–33 (p. 13), previa autorización y con Solicitud de sustitución 1A74-009-100. No convertir automáticamente cualquier captura de guardia de un TC 08 en 35 sin examinar el supuesto.

5.2.8–16, pp. 9–10: mismo OOAD; cargo a unidad autorizante; sin ausentismo el mismo día; horario diferente salvo descansos aplicables; límite general de 20 horas quincenales con tabla de excepciones festivas. Confianza hasta N56 y Estatuto hasta QA1 en los supuestos del procedimiento. Jornada festiva igual a la normal; descanso semanal no coincidente con festivo, salvo excepción indicada para Subdirección Médica.

**Inconsistencia de calendario en la copia:** tabla 2, pp. 9–10, vincula «1° de octubre ... transmisión del Poder Ejecutivo» con quincena **023**. No coincide con el esquema de 24 quincenas usado en SICIP. No copiar esa asociación sin revisión ni calcular festivos de todos los años a partir de esa fila. Semana Mayor es variable y requiere calendario anual.

5.2.27–28, p. 12: reglas particulares para jornada acumulada que cruza medianoche/festivo, con afectación en quincena del día de entrada. Se necesitan horas de inicio y término reales, no sólo una fecha. No tratar como idénticos todos los intervalos de dos días civiles.

Formatos: **1A74-009-003** para solicitud de conceptos extraordinarios, **1A74-009-001** rol 35 y **1A74-009-123** rol 735.

## Asistencia y pases: 034

Se extrajeron 142 apariciones y **138 claves distintas** de incidencias del Anexo 13, pp. 144–146. La p. 145 repite PSP/R2/RE/SA: se conserva la evidencia sin crear cuatro incidencias adicionales. Se separó el pie de página pegado al texto de SS3 durante la extracción.

Ejemplos: 63 vacaciones; 67/68/69 incapacidades; 08/08A/08B sustituciones; 10 nivelación; 35/35A guardias; 37/37A tiempo extra; 723 falta sin entrada frente a E74 de Estatuto; SS sin salida frente a ES2 de Estatuto. No convertir indiscriminadamente prefijos E en equivalencias universales.

El procedimiento diferencia expresamente:

- Pase CCT **1A74-009-038** (Anexo 11, pp. 135–138).
- Pase Estatuto **1A74-009-083** (Anexo 12, pp. 139–142).
- Justificación de omisión CCT **1A74-009-041** y Estatuto **1A74-009-084**.
- Registro de firmas **1A74-009-142** y funcionarios facultados **1A74-009-143**, con rol y vigencia. Poder encontrar un nombre para firmar no acredita su facultad para todos los trámites.

5.4.9–10, p. 20: entregar el pase a Personal no sustituye el registro biométrico de salida. El QR debe dar seguimiento al expediente y recepción; no justificar automáticamente asistencia ni cerrar una incidencia sin las verificaciones previstas. 5.4.19, p. 21, agrega control quincenal de minutos de pases particulares para efectos de estímulo CCT, que no debe extenderse automáticamente a Estatuto.

Los apartados PECV de 034 y el procedimiento específico 025 deben compararse por versión y ámbito antes de combinar condiciones. La copia 034 es anterior al registro de 025; conservar ambas referencias y no tratar como una sola norma sin control de vigencia.

## Avance guardado y alcance

- `central/src/personal-normativa.json`: referencias con SHA-256, TC, conceptos, incidencias, horarios y grupos por categoría/servicio. Estado **REFERENCIA_DOCUMENTAL_NO_PUBLICADA**.
- `central/src/personal-normativa.mjs`: consulta por campo exacto; conserva originales y desconocidos. Consulta primero horario Estatuto completo antes de prefijos. No determina por sí solo elegibilidad, salario ni situación laboral.
- `central/scripts/analyze-personal-normas.py`: extracción estática reproducible con los PDF aportados, sin exportar expedientes personales.
- `central/tests/personal-normativa.test.mjs`: cinco pruebas sobre separación de campos/regímenes, ceros válidos, frecuencias, contexto de servicio y anomalías de fuente.
- No se han alterado cortes históricos, clasificaciones laborales, solicitudes reales ni producción. Estos catálogos están preparados para integrar con trazabilidad; no son una publicación en la nube ni un nuevo mecanismo de actualización entre usuarios.

Las siguientes definiciones pendientes deben poder agregarse sin sobrescribir el dato de origen ni reinterpretar retroactivamente documentos ya autorizados. Cada expediente debe conservar la regla y el corte usados al tramitarlo.
