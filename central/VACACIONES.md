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

## Impresión VAC-06

La opción «Imprimir VAC-06 con QR» reproduce la distribución de Solicitud de vacaciones fuera de calendario, clave 1A74-009-064 (anexo 2, páginas 48–52 del procedimiento 1A74-003-025), en una hoja carta horizontal. No es el resumen anterior. La sección «Datos del formato VAC-06» en la captura guarda los datos adicionales con el expediente central y permite corregirlos mientras es borrador/devuelto. Se conserva el orden oficial apellido paterno, materno y nombres dentro del formato, aunque la plataforma muestre primero los nombres. Si el padrón no permite separar apellidos, Personal debe capturarlos explícitamente.

Seleccionar el ordinal del periodo (1/2 normal, 1/2/3 cuatrimestral); no se deduce de un número de periodo acumulado como 70. La quincena de proceso es un dato independiente del corte del padrón. Los campos no confirmados se imprimen en blanco, sin calcular importes o cifras de control de nómina. Los nombres de firmantes se conservan y las firmas se realizan en el papel. El QR de 12 mm identifica el folio en el margen de control y no reemplaza firmas. Para PECV y Estatuto se conserva el resumen identificado como tal, pues sus formatos normativos son distintos (1A74-009-021 y 1A74-009-066).

## Captura guiada (5.28.0)

El módulo abre en la captura por pasos, recuperando los recorridos de INICIO, CAPTURA ROL VACACIONAL, CAPTURA PECV y DIF del Excel. Primero busca matrícula/nombre en el padrón central y después permite elegir rol, VAC-06, PECV, memorándum, diferimiento o reposición. Sólo se muestran los campos de la ruta seleccionada.

El contexto del trabajador consulta centralmente persona, plazas, antigüedad DP, derechos, programaciones, última jornada guardada y firmantes recordados. Nombre, apellidos, categoría, adscripción y horario se precargan de sus fuentes; los descansos ausentes del padrón se confirman una vez y se reutilizan. Si hay varias plazas se selecciona la correspondiente. Se conserva el corte del periodo elegido; se informa antes de guardar. La antigüedad del corte se muestra como antecedente y Personal confirma el derecho efectivo, sin proyectar automáticamente años de servicio.

PECV y memorándum requieren programación autorizada previa. Si falta, la pantalla ofrece programar para el mismo trabajador y guarda la intención de continuar; al autorizar y acreditar SIAP aparece «Continuar con días a cuenta». El servidor impide saltarse la programación e impone el calendario de origen, para que cambiar un patrón no permita aumentar el límite. La revisión muestra las jornadas antes/después, el nuevo término y regreso. El descuento se aplica al autorizar y no crea un segundo derecho. Memorándum se identifica separadamente y usa los controles de días a cuenta.

El formato VAC-06 se genera exclusivamente para el documento VAC06 (o un registro anterior marcado expresamente fuera de calendario), con sus campos adicionales precargados. El rol ordinario, PECV, memorándum y otros trámites muestran su resumen. No se etiqueta un resumen de Estatuto o PECV como su formato oficial. La impresión previa que generaba VAC-06 para toda programación CCT queda sustituida por esta selección explícita.

Registros existentes conservados. El asistente permite volver al paso anterior y editar borradores guardados. No guarda datos operativos en localStorage. Los botones de certificado/autorización/SIAP siguen sujetos a roles, versiones y auditoría; guardar un borrador no descuenta vacaciones.
