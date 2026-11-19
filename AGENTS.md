# SICIP: operación durante la prueba piloto

La aplicación está en uso con capturas reales desde noviembre de 2026. Toda modificación debe conservar esos datos.

- La aplicación publicada es https://sicip-bcs.pages.dev. Construir con `central/scripts/build.py`; no publicar directamente la raíz ni sustituir la aplicación con el programa de Exámenes.
- Los datos operativos viven en Cloudflare D1 y Firestore. Un despliegue de código no debe importar snapshots, vaciar tablas, recrear bases, borrar colecciones, reemplazar cuentas o restaurar respaldos sobre producción.
- Las migraciones normales son aditivas y repetibles. Si una corrección necesita transformar registros existentes, preservar identidad, folios, relaciones, acuses e historial, respaldar antes y comprobar registros anteriores después. No renumerar documentos históricos.
- Antes de una migración o modificación masiva, respaldar los datos afectados fuera del repositorio y registrar conteos/identificadores para comprobar conservación. Las tablas FTS son índices reconstruibles: el exportador D1 exige excluirlas junto con sus tablas auxiliares; conservar también el esquema y las tablas fuente.
- La nube es la fuente de verdad. Las capturas nuevas sólo se consideran guardadas después de confirmación del servidor. Los errores de red deben mostrarse y permitir reintentar sin duplicar. Las copias locales de compatibilidad nunca son la única persistencia de una captura confirmada y no deben sobrescribir la nube.
- Conservar los históricos locales anteriores: migrarlos por matrícula, con reintentos idempotentes, sin borrar copias ni mezclar personas. No afirmar que se migraron otros equipos que no se han conectado.
- Administración debe conservar acceso a las consultas globales. Las vistas personales siguen mostrando sólo los datos del usuario; no ampliarlas a otros trabajadores.
- Preservar contraseñas, roles, permisos y unidades salvo instrucción explícita del usuario. Preservar los bindings y secretos de correo/push al publicar el Worker de notificaciones (`--keep-vars`).
- Probar con cuentas y datos sintéticos. No crear trámites ficticios en producción ni enviar correos de prueba a trabajadores reales. No guardar datos personales, exportaciones ni secretos en Git o en archivos públicos.
- Una publicación requiere pruebas adecuadas, revisión de diferencias, comprobación del despliegue y verificación de que los registros previos permanecen. No restaurar versiones de bases para deshacer un problema de código.
