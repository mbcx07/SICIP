# Eliminar opciones de recepción — 5.65.0

Administración → Catálogo de recepción presenta «Eliminar» junto a «Editar». La confirmación se realiza dentro de la misma pantalla e identifica documento y categoría; «Conservar documento» cancela sin escribir.

Al confirmar, el documento desaparece de la lista administrativa y de los selectores de nuevas recepciones. La baja se registra en auditoría con la matrícula del administrador y se conserva internamente la identificación de la opción. No se alteran recepciones anteriores. La carga del catálogo inicial no reactiva elementos eliminados; una edición obsoleta tampoco puede restaurarlos.

La API DELETE requiere administrador y versión vigente. Las modificaciones concurrentes devuelven un conflicto para evitar borrar una opción que cambió desde la consulta. El evento de actualización permite refrescar el catálogo de recepción montado en la sesión.

Validación: permisos, entradas inválidas, conflicto de versiones, auditoría, exclusión de ambas listas, persistencia tras la carga inicial y rechazo de edición antigua. Prueba de navegador a 390 y 1280 píxeles: cancelar, confirmar, limpiar un formulario que estaba editando la opción, recargar y abrir captura manual. Suite completa: 246 pruebas. Sólo se eliminaron opciones sintéticas en el entorno de pruebas.
