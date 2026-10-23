# Análisis de VACACIONES 2019.xlsm para SICIP

Fecha de revisión: 23 de octubre de 2026. Análisis estático de OOXML, valores guardados y código VBA; ninguna macro ejecutada. Las reglas extraídas son históricas, no una certificación de normativa vigente. El archivo original y sus registros personales permanecen fuera del repositorio.

## Actualización normativa

Se recibió y revisó posteriormente el procedimiento **1A74-003-025**, registrado el 28/12/2023. El [contraste normativo](vacaciones-normativa-1A74-003-025.md) resuelve las marcas generales, las equivalencias de 7–20 días y varias reglas de pagos y permisos. Los pendientes de este análisis original deben leerse con esa actualización; no es necesario solicitar otra vez esas definiciones. La extracción del Excel se conserva como evidencia histórica, sin alterar sus anomalías.

## Resultado

El archivo sirve como referencia funcional para **Departamento de Personal → Vacaciones: registro y trámite**. No es adecuado publicarlo como calculadora vigente sin corregir el calendario y validar sus tablas. Esta entrega documenta el análisis y extrae catálogos históricos; no agrega todavía un módulo operativo ni modifica producción.

Contiene 16 pestañas: 15 hojas y una hoja de gráfico. Trece están ocultas. Sus pantallas mencionan distintas versiones (2015, 2018 y 2019) y el registro contiene movimientos de 2020. El nombre del archivo no determina la vigencia de sus reglas.

## Flujos comprobados

| Flujo | Evidencia del archivo | Comportamiento para integrar |
|---|---|---|
| Programación del rol | CAPTURA ROL VACACIONAL; macros TIPOPROG, TIPOPROGCUATRI y TIPOPROG2 | Semestral, cuatrimestral y modalidad «20 años», conservando el tipo y su autorización. |
| VAC-06 | INICIO!M28 y registros de ROL VACACIONAL | Conservar el tipo documental y relación con la programación; validar su significado operativo actual. |
| Permiso económico a cuenta de vacaciones (PECV) | CAPTURA PECV; macros PECV1…PECV5 | Días concretos, referencia documental y folio del periodo del que se descuentan. El Excel permite seleccionar de 1 a 5 días; ese límite es histórico. |
| Días por memorándum | CAPTURA PECV!C9, O7:P8; INICIO!M30 | Mismo control de fechas y saldo, distinguiendo el documento y su motivo. |
| Diferimiento | DIF; macro capdif | Relacionar el folio original, referencia, nuevo periodo, días y pendiente. No crear un nuevo derecho por volver a programar los mismos días. |
| Seguimiento | ROL VACACIONAL!A:O | Folio, matrícula, categoría, fechas, días, especialidad, tipo, observaciones, turno, descansos, periodo ajustado y campo ANT/AGUI. |

El alta de trabajadores del Excel inserta filas en una base propia. En SICIP debe sustituirse por consulta de la base central por matrícula y corte; no debe crearse un segundo padrón de vacaciones.

## Derechos, equivalencias y calendario

Son tres conceptos distintos que el módulo debe mostrar juntos:

1. **Derecho del periodo**: días asignados según regla, modalidad y marca. La tabla U10:AL109 contiene 100 filas y diferentes columnas por marca. Hay celdas «IMPROCEDENTE» que deben bloquear una combinación, no convertirse en cero días.
2. **Jornadas equivalentes de disfrute**: tabla DIF X DESC!G34:I48, para 6 a 20 días, con columnas diurna, noches y acumulada. Por ejemplo, 10 → 6 noches / 4 acumuladas; 15 → 9 / 6; 20 → 12 / 8. Son valores del archivo antiguo, pendientes de validación actual.
3. **Fechas reales de ausencia y regreso**: dependen de la jornada, descansos, ciclo de trabajo y días excluidos aplicables. No equivalen a sumar los días de derecho al inicio.

Para ciclos alternos o acumulados, conocer «nocturno» no basta: hacen falta el patrón autorizado y una fecha de anclaje del ciclo, o una relación explícita de jornadas. Las fechas deben manejarse como fechas civiles de la unidad, sin desplazamientos por zona horaria. El calendario diario debe explicar qué día es jornada, descanso, festivo aplicable o excepción, y cuánto consume. El regreso es la siguiente jornada programada posterior al último disfrute.

La base central actual no contiene descansos semanales suficientemente fiables para todos los trabajadores. No se deben asignar sábado y domingo por omisión. Personal debe confirmar y guardar el patrón con vigencia, usando el catálogo de jornadas autorizado de Administración donde corresponda. Un cambio posterior no debe recalcular silenciosamente una solicitud ya autorizada: ésta conserva su regla y calendario originales.

## Problemas concretos del programa antiguo

- CAPTURA ROL VACACIONAL!J36 y J37 usan **WORKDAY**, que presupone sábado y domingo de descanso. El periodo principal sigue esa ruta.
- DIF X DESC!D3 y E3 intentan ajustar el periodo con **WORKDAY.INTL**. Ese resultado se guarda aparte en ROL VACACIONAL!N19; no sustituye de forma uniforme las fechas principales F19:G19. Se conservan así dos representaciones del periodo.
- DIF X DESC!H35 calcula `G35/1.6`: 7 días → **4.375 noches**. Las otras filas son mayoritariamente enteras. No existe una política de redondeo suficientemente explícita para trasladar este dato como regla vigente.
- CATEGORIAS!J5:J6 conserva factores aproximados 2.3 y 3.5. DIF X DESC!F2 multiplica por un factor, mientras E3 usa la tabla de equivalencias. Ambos caminos no constituyen una única regla consistente; no debe sustituirse la tabla por una división general.
- Los descansos de DIF X DESC incluyen patrones expandidos: por ejemplo, «DOMINGO» aparece asociado a domingo, martes, jueves y sábado. Interpretar esas etiquetas como un único descanso semanal cambiaría el resultado.
- Hay listas de festivos y roles con fechas fijas de años anteriores. No deben reutilizarse para el año actual.
- CAPTURA ROL VACACIONAL!H7, CAPTURA PECV!M7 y DIF!M7 solicitan la quinta columna de un rango A:D: referencia fuera del rango, con errores guardados `#REF!`. También aparecen `#VALUE!` y `#N/A` en las capturas. Los valores guardados no garantizan que una fórmula siga funcionando al recalcular.
- INICIO!F54:H54 consulta un archivo externo de plazas. La aplicación web debe usar exclusivamente el corte central identificado y guardar su procedencia.
- Las macros guardan datos copiando filas y valores. No proporcionan concurrencia, saldo transaccional, autorización de cambios ni auditoría suficiente para varios capturistas.
- Los pendientes y cancelaciones aparecen en observaciones libres. No deben reconstruirse como saldos vigentes mediante interpretación automática de esas frases.

## Pagos: lo que sí está y lo que falta

Hay observaciones «MAS PAGO DE 20 AÑOS» y un campo ANT/AGUI. No se identificó una fórmula completa para determinar importes, conceptos y quincena de pago. La modalidad «20 años» en la tabla de días no demuestra por sí sola una orden ni un pago realizado.

La integración necesita separar **programación**, **disfrute**, **solicitud de pago** y **pago confirmado**, conservando concepto, referencia y quincena. Una recepción en Personal no significa pago. Las reglas económicas requieren catálogo vigente y evidencia del importe autorizado; no deben inferirse de las notas históricas.

## Integración propuesta y datos compartidos

- **Administración**: publicar versiones de derechos, marcas, equivalencias, tratamiento de fracciones, jornadas/ciclos, festivos aplicables, tipos documentales y conceptos de pago, con vigencia y referencia normativa. La extracción histórica permanece sin publicar hasta su validación.
- **Departamento de Personal**: buscar matrícula; seleccionar programación y periodo de derecho; identificar corte; confirmar jornada/descansos; calcular calendario; capturar PECV, memorándum o diferimiento vinculados al periodo; revisar saldo, referencias y documentos; registrar entrega, autorización y cancelación según atribuciones.
- **Mis Trámites**: consultar por matrícula las vacaciones y permisos propios, aunque Personal los haya capturado, con su estado y acuse. No divulgar expedientes de otros trabajadores.
- **Servidor**: guardar periodos de derecho, movimientos de saldo, solicitudes, versiones de reglas, calendario calculado, corte de origen y auditoría. Reservar/descontar saldo en una transacción y controlar la versión del registro para impedir doble descuento por dos capturistas. Usar una clave idempotente para reintentos y folios centrales.
- **Fechas y corte**: elegir la quincena por la fecha efectiva de cada movimiento, mostrarla y conservar el identificador del corte. Cuando no exista el corte requerido, indicarlo; no sustituirlo silenciosamente por la base actual. El año del derecho puede ser distinto del año de disfrute y de la quincena de pago.
- **Conexión**: confirmar guardado sólo después de la respuesta del servidor. Sin conexión, mostrar que no se guardó; no generar folios locales ni aceptar movimientos que parezcan compartidos.
- **Actualización entre usuarios**: canal autenticado de eventos por ámbito y permisos; al confirmar una transacción, avisar a las vistas afectadas para consultar los datos canónicos. Recuperar el estado al reconectar y mostrar desconexiones. No exponer matrículas ni detalles a través de un canal público. Un sondeo periódico debe identificarse como tal, no presentarse como actualización instantánea.

## Situación real del almacenamiento actual de SICIP

La revisión de código confirma que contratos, presupuestos, tabuladores publicados y pases nuevos ya tienen persistencia central. **Todavía no existe un mecanismo general que refresque todos los módulos entre usuarios en tiempo real.**

`central/public/pases-sync.js` conserva una copia de pases en localStorage y la sincroniza; `central/src/seguimiento-client.mjs` incluye migración de pases antiguos del navegador. La herramienta de nivelación conserva relaciones localmente (`sicip_nivelacion_relaciones`). Estas rutas necesitan adecuación para que toda información operativa dependa del servidor. No se deben borrar los respaldos antiguos antes de comprobar su migración. Preferencias visuales o cookies de sesión no deben confundirse con registros operativos compartidos.

El nuevo módulo debe nacer con persistencia central, sin depender de localStorage. Eso, por sí solo, no convierte automáticamente los demás módulos a tiempo real: el trabajo de sincronización general debe verificarse también con dos sesiones independientes.

## Validaciones necesarias para ponerlo en operación

1. Significado vigente de las marcas 0, 1, 2, 3, 4, 5, 6 y 9 y sus variantes internas 1A/1B, 0A/0B/0C, 5A/5B.
2. Tabla vigente de equivalencias, reglas para fracciones y elegibilidad de semestral/cuatrimestral/20 años.
3. Tratamiento de festivos por jornada, ciclos autorizados y fecha de anclaje.
4. Alcance de VAC-06, ANT/AGUI y conceptos/reglas de pago.
5. Saldos iniciales conciliados por trabajador y periodo. El archivo histórico no se importa como saldo actual.

Pruebas de aceptación: descanso distinto del fin de semana, noche alterna, jornada acumulada, festivo, año bisiesto, cambio de año, regreso en la próxima jornada; PECV y diferimiento sin doble descuento; dos capturistas sobre el último saldo; reintento de guardado; trabajador viendo un registro creado por Personal; reconexión y actualización entre dos navegadores; pagos sin confundirse con entrega o autorización.

## Extracción reproducible

`central/scripts/analyze-vacaciones.py` genera `vacaciones-2019-reglas-historicas.json` leyendo estáticamente el XLSM. Exporta inventario, errores agregados, 100 filas de derechos, 15 filas de equivalencias y 27 patrones históricos de descanso. No exporta nombres, matrículas, movimientos individuales ni VBA. No ejecuta fórmulas, no redondea, no resuelve las marcas y no activa catálogos en producción.
