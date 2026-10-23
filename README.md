# SICIP

La versión publicada 5.23 incorpora una base central quincenal en Cloudflare D1, consulta de personal y plazas, carga validada de Excel e integración de los módulos existentes.

El código de esa integración, las pruebas y las instrucciones de build están en [central/README.md](central/README.md).

**No desplegar directamente los archivos legados de la raíz:** corresponden a una versión anterior y sus JSON no son la base activa. El build documentado en `central/` aplica la integración a un respaldo identificado del despliegue anterior y produce la aplicación con su Worker. Las actualizaciones quincenales se realizan desde Base central en la aplicación, no reemplazando archivos sueltos ni modificando cuentas de acceso.

No incorporar Excel de personal, snapshots normalizados, tokens ni credenciales al repositorio. Los cortes se conservan en D1; usuarios y movimientos existentes mantienen su almacenamiento original.
