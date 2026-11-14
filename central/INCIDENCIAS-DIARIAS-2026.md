# Incidencias diarias y tarjetón · 5.57.0

Se integran los 15 XLSX/CSV entregados después de la publicación 5.56.0. La lectura identifica columnas por encabezado normalizado, admite orden diferente, fechas nativas, números de serie de Excel y texto, y procesa físicamente las filas XML de hojas dispersas con rangos aparentes de más de un millón de filas. No ejecuta macros, fórmulas ni instrucciones de los documentos. Se preservan las 81,339 transacciones programadas anteriores y el padrón quincenal 22/2026; esta entrega amplía sólo la carga histórica de nómina.

## Verificación de repetidos

La primera comparación usa matrícula, fecha, concepto, referencia normalizada, plaza y puesto. Detecta referencias científicas/numéricas equivalentes, coincidencias entre hojas y versiones con distinta cantidad. Las diferencias quedan auditadas; una lista auxiliar sin estado no sustituye un registro confirmado.

Algunas exportaciones regeneraron la referencia Serial. Para no sumar exportaciones del mismo trabajador/día/concepto/plaza/puesto, se conserva el mayor conjunto explícito de eventos observado en una sola hoja, con prioridad para la extracción nueva cuando la cardinalidad coincide. Dos eventos distintos de la misma extracción se conservan como dos: no se reduce todo el tiempo extra del día a una sola fila. Las versiones E/I y las listas auxiliares sin estado se conservan como evidencia separada de las estadísticas V.

La carga depurada contiene 645,918 registros: 564,579 incidencias y 81,339 transacciones, correspondientes a 6,002 trabajadores y 6,004 combinaciones trabajador/año. Se separaron 82,235 coincidencias idénticas, 36,157 repeticiones entre extracciones y 17 referencias repetidas de la base anterior (118,409 en total). Además se auditaron 2,323 comparaciones de referencias con diferencias de contenido, sin sumarlas como nuevos eventos. La validación independiente comprueba unicidad de identificadores y claves, preservación exacta de las transacciones previas y concordancia de los diez historiales de mayor volumen con el cálculo quincenal del sistema.

## Cobertura y estados

Los datos se ubican por Fecha, nunca por el nombre del archivo. En particular «16 al 300926 INCREMENTO» contiene fechas del 30/09 al 14/10, con gran solapamiento con el archivo de la primera quincena de octubre. Otros archivos contienen registros posteriores al periodo de su nombre y algunas entregas CSV cubren sólo parte de las fechas/unidades: no se presume cobertura completa del OOAD ni se interpreta falta de datos como cero incidencias.

La carga conserva 555,528 incidencias V, 4,553 I, 4,396 E y 102 referencias auxiliares pendientes de validar. Se solicitó al usuario el significado de E/I en este reporte; mientras se confirma, se conserva la regla previa de estadísticas V y se identifica en Historial y Control de Faltas cuando hay movimientos pendientes. No se inventan horas para duraciones vacías. En estos archivos los vacíos corresponden principalmente a PR/EPR; se conservan como dato ausente, no como una duración capturada de cero.

El historial incluye ambas claves de falta 72/E72 y cuenta una sola falta por fecha del trabajador, igual que Control de Faltas. Se mantienen horas 37/37A, días 35, resúmenes quincenales y exportaciones sin detalle individual ni importes de esos conceptos. No se suman transacciones programadas de 37 a las horas diarias.

## Inicio

Se adapta el contenido del cartel en una tarjeta institucional responsive, con ilustración de documento, revisión de RFC/CURP/código postal y orientación para corrección en el Departamento de Personal. El botón abre exactamente https://rh.imss.gob.mx/Personal/TarjetonDigital/ en una pestaña nueva con noopener/noreferrer. El portal oficial gestiona la consulta/descarga; SICIP no solicita credenciales del IMSS. La fecha límite del cartel, 31/12/2026, sólo se muestra hasta ese día en America/Mazatlan; el acceso al tarjetón permanece disponible después.

Validación: 233 pruebas Node, cuatro pruebas del importador (CSV, XLSX disperso, referencias regeneradas, eventos distintos y listas no confirmadas), revisión independiente de toda la carga y de diez historiales, navegador a 1280/390 px para Historial/Control de Faltas/Inicio, y reporte Excel agregado. Los archivos personales y las auditorías detalladas permanecen fuera del repositorio y no se publican como recursos estáticos.
