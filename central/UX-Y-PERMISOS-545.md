# Inicio, permisos y pases · 5.45.0

Inicio refresca sus datos automáticamente. Se retira su botón permanente «Actualizar», que se confundía con la actualización de versión. El controlador PWA conserva el aviso exclusivamente para una huella distinta. Avisos del dispositivo consulta permiso, suscripción del navegador y registro central: muestra Activar o Desactivar según ese estado y vuelve a consultarlo al cambiar. Autorizar el permiso sin completar la suscripción no se presenta como una activación terminada.

Todos los trabajadores parten de `inicio`, `tramites.seguimiento`, `solicitudes.pases`, incluso si tenían permisos de la edición anterior. Se aplica al iniciar y sanear sesiones existentes, sin cambiar contraseñas. Administración conserva sus accesos y puede liberar módulos después: cada guardado de permisos lleva `accesosVersion=trabajador-5.45`. Las pruebas de funciones aún restringidas usan concesiones explícitas; las pruebas de la política inicial mantienen cuentas sin concesión. La API y el menú aplican la misma política.

El coordinador de módulos sólo modifica los botones de navegación lateral. Las pestañas administrativas conservan `aria-current` y colores con contraste, incluidos hover y foco.

La búsqueda compartida de firmantes usa un campo por persona, resultados seleccionables por nombre o matrícula y resumen del nombre, matrícula y cargo/categoría. Conserva la matrícula separada para la API. Vacaciones valida a ambos firmantes antes de crear el periodo y usa confirmaciones «Valido que la información ... es correcta». Pases conserva sus funciones de firma con el mismo buscador. Personal elige primero entre tramitar un nuevo pase y capturar uno manual.

El pase se centra en carta, mantiene el contenido dentro de la hoja y usa margen de página cero para suprimir encabezados y pies automáticos en Chrome. Se comprueba con la opción de encabezados/pies habilitada, además de una sola página, unidad oficial y QR. No se agregan datos técnicos al formato.

## Unidades de servicio

La instalación anterior tenía un catálogo, pero ninguna fila en `personal_unidades`. `plan-unidades-padron.py` obtiene unidades explícitas de `jefatura` en las plazas; relaciona ocupantes y, cuando hay correspondencia única, la adscripción del padrón. No interpreta un servicio clínico como unidad ni deduce la adscripción de becados sin una unidad identificable. El plan Q2026021 contiene 56 unidades y 10,640 asignaciones; 2,467 matrículas no tienen correspondencia identificable.

`apply-unidades-padron.py` comprueba quincena y hash del corte activo, conserva nombres editados y asignaciones existentes, y registra la aplicación. Las asignaciones se guardan en D1 para pases, VAC06 y coberturas. Los pases anteriores que carecen de unidad recuperan la asignación al consultar e imprimir; un cambio de estado puede completar ese dato, sin reemplazar su contenido histórico. La captura muestra la unidad asignada; la impresión exige que esté definida. Los casos sin correspondencia se completan desde Administración → Nombres de las unidades.

Validación: 195 pruebas de lógica/API; navegador con alternancia de avisos, permisos iniciales, contraste administrativo, selección única de firmantes, flujo nuevo/manual, impresión y vista móvil; guía completa de vacaciones con selección de firmantes, calendario, PDF y Excel.
