# Recepción y supervisión · 5.44.0

Administración → Catálogo de recepción permite crear categorías/documentos, editar sus nombres, ordenar y desactivar opciones. El desplegable de Recepciones consulta D1 al abrirse. Desactivar no borra recepciones históricas. Requiere sesión administrativa, controla versiones concurrentes y registra al operador. Tras aplicar las tres sentencias nuevas de `schema.sql`, ejecutar `python3 central/scripts/seed-recepcion.py`; la siembra no reemplaza cambios administrativos.

Administración → Supervisión de cálculos conserva los parámetros, resultado y tabulador de cada cálculo correcto, aunque no se guarde como caso, con matrícula y nombre de la cuenta autenticada, fecha y trabajador calculado. Un reintento idéntico de la misma captura no duplica el registro. Guardar directamente también registra la operación. Los casos exportados incluyen al autor. No se inventan nombres de registros históricos.

Herramientas sólo aparece dentro de Departamento de Personal; cada calculadora tiene su propia pantalla y se cambia desde el menú lateral. Se conserva la compatibilidad de permisos anteriores de nivelación.

El lector de recepción comparte normalización de QR para pases P, coberturas C, vacaciones/PECV V y reclamaciones R, en texto o JSON. No acepta URL ajena. La consulta y recepción final siempre validan el folio y permisos en el servidor. Las pruebas rasterizan los formatos impresos y usan jsQR sobre el área enfocada del QR; no equivalen a probar una cámara física o una impresión deteriorada.

El pase conserva QR de 12 mm y folio lateral, acumulado en el renglón de «con objeto de» y centrado vertical en carta. La regresión mide posiciones y una sola página, además de estadísticas por matrícula y tendencia.
