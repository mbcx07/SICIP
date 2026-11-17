# Orden compartido del menú — 5.67.0

Administración → Orden del menú lateral permite arrastrar los módulos y los accesos de cada submenú. Ofrece Subir/Bajar para celular y teclado (Alt + flechas sobre un renglón), Guardar para todos, restablecer el orden inicial y descartar cambios. El editor incluye los botones reales de Cuadros, Solicitudes, Jefe de Servicio, Personal y Herramientas; los permisos siguen siendo independientes del orden.

La configuración se guarda en D1 bajo `settings.menu_orden`, con versión y auditoría de la matrícula administradora. Solamente un administrador puede escribir. No hay cambios de roles ni permisos, ni se guardan preferencias en localStorage. Los demás usuarios consultan el orden compartido y lo aplican a sus accesos existentes y autorizados; las sesiones abiertas lo comprueban cada 15 segundos, y al recuperar el foco. Hasta la primera publicación se conserva la distribución anterior.

Los movimientos son dentro de la lista de módulos principales o del submenú correspondiente. No se trasladan trámites entre departamentos ni se cambia quién puede usarlos. Los conflictos de versión evitan sobrescribir cambios de otro administrador; recargar descarta el borrador y recupera la versión vigente.

También se eliminan los tres botones «Volver» de las secciones de Recepción de Documentos. Se mantienen los selectores de método, el escáner, su cancelación y el catálogo manual.

Validación: permisos, persistencia central, auditoría, validación de listas, rechazo de duplicados y versiones vencidas, restauración de valores iniciales; navegador a 1280 y 390 píxeles con arrastre, flechas, todos los grupos de submenús, nueva sesión y otra cuenta conectada que recibe el orden conservando sus restricciones. Se verifican Recepción por QR/folio/manual sin botones Volver. Suite: 249 pruebas. Las publicaciones de orden de las pruebas son exclusivamente sintéticas; no se publica un orden de producción en nombre del administrador.
