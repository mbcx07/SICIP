# Validación de SICIP 5.23.1

- 12 pruebas de API: sesión, campos privados, permisos, protección de origen, activación con control de versión, retorno al corte anterior, rechazos e idempotencia de lotes, paginación y cierre de sesión.
- 6 pruebas con el Excel real 2026015: hojas y conteos, ocupante/titular, restricciones, fechas vacías, contratación, integridad de campos NSS y complementos, duplicados y quincena incorrecta.
- Flujo Chromium contra API local con SQLite real y cuentas sintéticas: acceso, consulta y filtros, navegación entre módulos, vista móvil de 390 px, carga completa del Excel en segundo plano, lotes, validación, activación, calculadora y complemento Exámenes. Cero errores JavaScript no controlados.
- Verificación de la API publicada en Cloudflare: 13,037 personas, 5,438 plazas, 7,646 registros de antigüedad y 6,626 entradas de catálogo comparados registro por registro con el snapshot validado, sin diferencias ni duplicados.
- Verificación de acceso remoto sin sesión y rechazo de carga al perfil de solo lectura. La sesión efímera del operador se eliminó al terminar; no se crearon cuentas Firebase ni se usaron contraseñas de usuarios reales.

El corte 2026015 conserva 5,248 plazas ocupadas y 190 sin ocupante. Las 61 sin ocupante con titular no se declaran vacantes definitivas. La importación registra observaciones de origen y conserva variantes de los catálogos; los códigos laborales desconocidos no se clasifican por suposición.

Estas comprobaciones no constituyen una auditoría completa de las reglas de Firestore ni de las fórmulas salariales. El tabulador conserva su propia vigencia y se comprobó que la calculadora usa la misma quincena de personal.

Regresión 5.23.1: encabezado y menú sin superposición, scroll independiente, una sola selección activa, asignación inmediata en modal y Mi Cuadro, acceso administrativo a contratación, PDF obligatorio almacenado y descargable con control de permisos, reintento de postulación tras error, lectura de QR real desde cámara simulada y altura completa del iframe de Pases. La prueba de cámara usa un dispositivo simulado; no confirma los permisos ni el hardware del teléfono de cada usuario.
