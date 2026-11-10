# Administración de Personal y Plazas

La administración inicia en **Personal y Plazas** y consulta el padrón completo del corte activo, incluso las matrículas sin cuenta. Las otras pestañas son Jornadas y tabuladores e Historial de cortes; se retiró la carga de quincenas de la interfaz.

Al seleccionar una persona, el administrador puede habilitar su cuenta, asignarle un rol y seleccionar módulos y submódulos. Los permisos respetan el ámbito del rol; Administración conserva todos sus accesos. Las cuentas anteriores sin selección explícita mantienen su comportamiento hasta que se guarden sus permisos. Cada cambio comprueba la versión de la cuenta para evitar sobrescribir cambios simultáneos e invalida sus sesiones anteriores.

El restablecimiento requiere confirmar la matrícula seleccionada. Establece matrícula como contraseña temporal y exige cambiarla al entrar. No reactiva cuentas deshabilitadas y no permite restablecer la propia cuenta desde este botón. Genera un aviso y encola correo a las direcciones verificadas; si no hay correo verificado o falta el servicio, la interfaz lo indica. Los reintentos de una misma operación no vuelven a sobrescribir una contraseña ya modificada.

Las operaciones se registran en `admin_personal_operaciones` y en auditoría. No se crean cuentas masivamente ni se modifica el padrón al administrar accesos.

Validación: pruebas de API con Firestore simulado, concurrencia y reintentos, sesiones y cambio inicial de contraseña; prueba de navegador con 1,504 personas, permisos efectivos y pantalla móvil. Las pruebas de restablecimiento utilizan cuentas sintéticas, sin cambiar contraseñas de producción.
