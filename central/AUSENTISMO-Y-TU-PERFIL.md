# Historial, Control de Faltas y Tu Perfil IMSS — 5.58.0

Historial entrega diez indicadores sin importes: faltas, licencias sin/con sueldo, enfermedad general, riesgo de trabajo, maternidad, vacaciones, horas de tiempo extra, días de guardia y días de nivelación. Incluye resumen anual, meses, años y acumulado de la vida laboral disponible. Excel y PDF conservan esas unidades; la API no entrega movimientos monetarios.

Las cantidades provienen de las fuentes cargadas. No se convierten horas suponiendo una jornada de ocho horas. Sólo se distribuyen intervalos por días naturales entre meses cuando su cantidad coincide con la extensión del intervalo; las demás cantidades permanecen en el mes de inicio. No se infieren descansos. El acumulado disponible no certifica una vida laboral completa. Se excluyen estados no vigentes y registros futuros.

Control de Faltas consulta un índice central de fechas únicas por matrícula, combinado con registros manuales y anteriores, sin duplicar una fecha. Permite ordenar los diez primeros o ampliar resultados y combinar año, mes, vida disponible, intervalo, categoría, unidad y trabajador. La categoría y unidad corresponden al padrón vigente. Cada carga futura genera el índice antes de activarse. La migración es aditiva y no modifica cuentas ni permisos.

Inicio enlaza a https://tuperfil.imss.gob.mx/guitpei-web/login. Se verificaron públicamente acceso por matrícula, registro y recuperación de contraseña; las opciones protegidas de asistencia requieren iniciar sesión y no fueron inspeccionadas. SICIP no solicita ni almacena credenciales de ese portal.

Los nuevos recordatorios de documentos pendientes del último día hábil de la quincena incluyen un enlace al portal y la indicación de revisar checadas y acudir a Personal para justificar ausencias. Se conserva el horario y criterio de destinatarios; no se reenvían mensajes ya enviados.

Validación: pruebas de dominio/API, autorizaciones, deduplicación, filtros, correo HTML y navegación en escritorio/celular con datos sintéticos. Se revisaron exportaciones sin importes. Las fuentes históricas se mantienen fuera del repositorio y de los recursos públicos.
