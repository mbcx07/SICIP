# Vacaciones 2027

Departamento de Personal → Vacaciones. Persistencia central en D1; no se guarda el expediente en almacenamiento local. Consulta automática cada 5 segundos y seguimiento personal cada 10 segundos. La captura requiere conexión y confirmación del servidor.

1. Personal certifica el derecho: matrícula, corte quincenal, régimen, modalidad, antigüedad, periodos vencidos y referencia documental. El expediente conserva el corte y los datos de origen sin cambiar la base activa.
2. Se elige marca y rol 2027, ciclo laboral confirmado, fecha de anclaje y horario. Para veladas se identifica también el descanso fijo. El cálculo muestra jornadas reales, término y regreso, equivalencias y fuentes.
3. El borrador puede editarse. Enviar → certificar → autorizar reserva el saldo y valida empalmes. La captura SIAP requiere un acuse ingresado por Personal; no existe envío automático a SIAP. Pago y autorización son estados independientes con referencias.
4. PECV, diferimiento y reposición se vinculan al expediente original. La reposición requiere comprobante PDF privado antes de certificar. Se impide duplicar jornadas, exceder el derecho y modificar vacaciones con cobertura activa.
5. La programación TP14 exige Base, vigencia, unidad, categoría, turno y datos FA/FC/FI confirmados. Se imprime cédula en tres tantos. Finalizar bloquea nuevas asignaciones; reordenar conserva historial y libera las fechas. Para sustituir una asignación anterior deben reordenarse y capturarse las afectadas en secuencia. El relevo por baja requiere revisión y nueva asignación por Personal, sin transferencia automática a una matrícula distinta.

Reglas versionadas: circulares 273/274 de 1 de septiembre de 2026, instructivo y lineamientos de cubrevacaciones 2027. Estatuto y CCT se calculan por separado. Desde el sexto año de Estatuto se rechaza marca 0 y se requieren fracciones semejantes 2/3. Los documentos históricos se conservan como fuentes históricas. Se bloquea el diferimiento de periodos que ya tienen PECV autorizado: requieren conciliación de Personal antes de emitir un nuevo expediente; no se altera silenciosamente el saldo anterior.

Administrador/Personal/Fuerza de Trabajo certifican y autorizan. Jefes capturan para trabajadores y ven sus propios expedientes creados; el trabajador consulta los vinculados a su matrícula en Mis Trámites, aunque otro usuario los haya capturado. Adjuntos sólo para los participantes autorizados y Personal, sin indexar información médica en Normativas.

Validación: pruebas de API con base SQLite real, derechos, calendarios, controles de saldo/versiones, adjuntos y permisos; navegador con cuentas independientes, impresión carta y cédula de tres páginas, consulta de fuentes y diseño móvil. Los registros de prueba no se insertan en producción.
