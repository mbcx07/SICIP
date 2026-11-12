# Cierre de quincena y pases · 5.48.0

El programador de notificaciones revisa cada minuto. El 15 y el último día del mes, desde las 09:00 de America/Mazatlan, crea un aviso por matrícula y quincena si quedan pases, coberturas, vacaciones/PECV o reclamaciones PD44 solicitados sin acuse en Personal. Incluye pendientes anteriores; excluye borradores, cancelados y recibidos. Agrupa varios roles de una VAC06 bajo su folio raíz. No recuerda como entrega física un currículum adjuntado en línea.

El aviso se guarda en la app y se distribuye a las suscripciones push y correos verificados mediante el servicio existente. Revalida pendientes antes de preparar y enviar; una entrega registrada entre tanto suprime el envío. La aceptación del proveedor no garantiza la visualización en un dispositivo desconectado o sin permisos. Clave idempotente `CIERRE_QUINCENA:<quincena>:<matricula>`. Procesa hasta 25 nuevos destinatarios por minuto. Desplegar también `central/notifications/wrangler.jsonc` con `--keep-vars`, conservando Gmail y VAPID.

El primer acceso usa los nombres propios del padrón (tercer componente de APELLIDO/SEGUNDO APELLIDO/NOMBRES). Los suplentes TC08 seleccionan su unidad de trabajo en pases; no se cambia su adscripción. Los demás trabajadores usan su unidad asignada. Personal conserva su selector propio.

Imprimir un pase genera un PDF carta de una página con el formato y QR, sin encabezados ni pies de página del navegador. La generación se carga bajo demanda y abre un visor con impresión y descarga. No se usa impresión HTML para esta acción.

Validación: 213 pruebas Node y `tests/pases-cierre-browser.py` con Chromium, QR leído desde PDF a 300 dpi, vista móvil y saludo JUAN CARLOS desde el padrón sintético. Ejecutar el harness con `SICIP_TEST_ADMIN_ACCOUNTS=1 SICIP_TEST_GIVEN_NAME=1`.
