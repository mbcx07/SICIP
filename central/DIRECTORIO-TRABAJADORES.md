# Carga de consulta y firmantes · 5.47.0

El perfil Trabajador recibía correctamente sólo su persona/plazas, pero el buscador de firmantes reutilizaba esa lista y no encontraba a otra matrícula. Administración recibía el padrón completo y por eso no presentaba la falla. No dependía de que una computadora tuviera importado un Excel.

`GET /api/base/directorio` publica, con sesión, una proyección explícita de matrícula, nombre, puesto, categoría y adscripción. Usa la quincena seleccionada y páginas de 1,000 registros. Primero pagina las personas y luego consulta sus plazas por lote; evita ejecutar una subconsulta correlacionada por cada trabajador, que resultó lenta con el padrón real. No incluye CURP, domicilio, correo, bajas, nómina ni otros campos privados, incluso si se solicita `full=1`. Los datasets personales mantienen su restricción por matrícula y los permisos administrativos/historial de pases no cambian.

Para el trabajador, la carga central combina ese directorio con su registro propio para alimentar los buscadores compartidos. Se verifican quincena, cantidad y matrículas únicas, y se conservan las consultas personales separadas. El directorio se consulta en lotes de cuatro páginas. Los catálogos de consulta del trabajador también usan páginas en paralelo, conservando la exclusión de restricciones. Se evita el recorrido serial de cientos de registros por petición en equipos nuevos. Los resultados sólo viven en memoria de la sesión; la fuente sigue siendo D1.

Si falla la carga de los buscadores, Pases muestra un aviso y Reintentar carga, en lugar de dejar sólo un error en consola. Se conserva la autenticación y no se solicitan archivos al usuario.

Validación: 207 pruebas de lógica/API, incluido directorio paginado, proyección de datos y autorización. Navegador con dos contextos nuevos, primero como trabajador y sin sesión administrativa previa: 13,007 personas, 5,475 plazas y 1,105 catálogos públicos, jefe de última página por matrícula, responsable por nombre, cargo visible, datos personales propios y vista móvil.
