# Foto compartida del trabajador — 5.61.0

Inicio y Mi perfil muestran la foto y permiten agregarla o cambiarla. Historial consulta la foto del trabajador seleccionado. Vacaciones usa la misma fuente central. Si no existe una foto, se muestra un espacio identificado; una falla al cargar no borra el componente.

La foto se redimensiona a 360 × 480 en el navegador, se convierte a JPEG y se guarda en D1 para la matrícula autenticada. La imagen tiene un límite de 200 KB en el servidor; no se guarda en localStorage. La edición no permite escoger otra matrícula. Los accesos a fotografías de otros trabajadores conservan la autorización de Historial/vacaciones. Las respuestas son privadas y no se almacenan en caché.

Cuando no hay imagen central se conservan las fuentes anteriores admitidas del padrón y de la cuenta, sin sobrescribirlas. La nueva tabla es aditiva y no cambia permisos, contraseñas ni cortes de nómina.

Validación: autorización y aislamiento de edición, consulta cruzada autorizada, rechazo de archivos falsos/formatos activos/tamaños excesivos; carga de imagen real desde Inicio, Mi perfil, nueva sesión sin almacenamiento del dispositivo e Historial en celular y escritorio. Suite completa: 245 pruebas.
