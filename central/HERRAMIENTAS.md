# Herramientas de Personal · 2026–2027

Ubicación: Departamento de Personal → Herramientas → Calculadora de Nivelación / Conceptos por primera vez / Reintegro de Faltas. Se usan las matrículas del corte central seleccionado, con el corte vigente por defecto; no se importaron las bases de trabajadores antiguas de los libros.

Se extrajeron 292 categorías de nivelación y 743 filas de conceptos. En conceptos, 292 filas contienen las 23 tarifas y 451 tienen columnas ausentes. Las celdas ausentes siguen ausentes: los cálculos que las requieran se bloquean. Las categorías con etiquetas repetidas se distinguen por la fila de origen.

Nivelación usa MV ×1.4, nocturno ×2.3334, acumulada ×3.5, unidades enteras, tabla de antigüedad para concepto 22 y límite de 35% SQ salvo R51/CRM. Por confirmación del usuario, los conceptos 50 y 20 se capturan y calculan por separado para titular y suplente, incluso si coinciden. Las demás bases conservan las fórmulas aportadas, incluida la base del 22 del suplente. El motor conserva un modo interno de reproducción histórica para contrastar las fórmulas originales en pruebas, pero la captura nueva exige conceptos independientes. La prueba de referencia reproduce el importe 1492.4358850417946 del archivo, con tolerancia numérica menor a una milmillonésima.

Conceptos reutiliza las reglas de captura SIAP del cuadro de decisiones 2026 ya incorporadas en PD44, con las tarifas nuevas. No representa los campos de días, horas o porcentajes como pago en pesos. Las discrepancias previamente identificadas (008 y cifra control del 015) se conservan como pendientes de revisión, sin aplicarlas a solicitudes PD44 automáticamente. Los conceptos sin regla validada se bloquean.

Los casos se recalculan en el servidor y se guardan en D1 con entradas, resultado, matrícula, corte, relación/lote, actor, versión y huella del archivo tabulador. Se exige revisar la aplicación del tabulador al caso; el nombre del archivo no establece por sí mismo su fecha legal inicial. Los reintentos del mismo guardado son idempotentes. Las cancelaciones conservan los cálculos originales en el historial y auditoría.

La consulta se actualiza en línea cada 10 segundos mientras esté visible, admite filtros y exporta todos los resultados por páginas a XLSX o a un informe imprimible/guardable como PDF. El detalle exporta el desglose. No se guardan casos en almacenamiento local del navegador. Las funciones antiguas de Fuerza de Trabajo no se migran ni se eliminan sus registros en esta entrega; la nueva herramienta central mantiene su propio historial.

## Reintegro de Faltas

El tercer archivo aporta su tabulador y justificaciones. El reintegro captura el importe realmente descontado en el tarjetón, genera el importe negativo del 172, su cifra de control y los movimientos del histórico. La inclusión estima `(sueldo + 011 + 015) / 15 / 8 × horas`, pero queda en revisión mientras no se capture un importe confirmado con su referencia: las fórmulas originales apuntan a columnas incorrectas. No se ejecutan macros ni enlaces externos.

Los meses se derivan de la tabla C23:G34 del libro: 172/672/622 con dos meses de desfase; DP/151/49B al mes siguiente; 55A seis meses después. Para TC08 se añaden 680 y SDI. La incidencia del año anterior se muestra en meses 14 y 15 conforme a la nota del libro, sin duplicar importes ni asignarlos a ambos meses automáticamente. Se evalúa el año de la quincena de proceso, no el reloj del equipo. Cada incidencia se registra por día.

El encabezado interno del tabulador aún dice 2025–2026 aunque el archivo se aportó como 2026–2027. Se conserva esta observación en pantalla y salida. Los meses y referencias se presentan para revisión del operador. El detalle imprimible incluye las columnas de modificación al histórico y la exportación XLSX agrega una hoja de movimientos de acumulados.
