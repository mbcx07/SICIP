# Contratación y coberturas · 5.25.0

Se analizó `PROGRAMA DE CONTRATACION HGZ+MF No1.xlsm` como ZIP/XML y VBA estático, sin ejecutar macros. Los catálogos conservan SHA-256, 263 horarios y 17 motivos. No se importan sus trabajadores ni sus salarios históricos.

La impresión reproduce las tablas de CONTRATO A124:U145 y TIEMPO EXTRA AN95:BG118: dos papeletas por hoja carta, ejemplares de trabajador y Personal, con sus claves 7110-009-003 y 1A12-009-003. Se conservan cuadros, firmas y datos de origen. Los pequeños espacios que Excel extiende sobre celdas vacías se agrupan en HTML para que unidad y etiquetas no se corten. Cada papeleta incluye QR del folio corto, sin datos personales.

Se retira el calendario de casillas de la captura. Las nuevas capturas usan la fórmula del Excel: CATEHOR H266/I266, días inclusivos del periodo divididos entre el ciclo del horario. Se capturan descansos para la papeleta. Los planes de solicitudes existentes siguen conservados en su registro. La restricción de plaza 14 proviene de Hoja2 y las macros originales; no es un código de contratación del trabajador.

La fecha inicial determina la quincena (1–15 y 16–fin de mes). Se busca un corte validado de esa quincena y se muestra su archivo. Si falta, se bloquea el guardado, sin usar silenciosamente el padrón activo. Cambiar fechas de un borrador puede cambiar su corte; los datos se resuelven de nuevo en servidor. No se cambia el corte activo global. Una solicitud enviada conserva su copia de personas, plaza y firmas. Para periodos que abarcan varias quincenas, la captura indica que usa la base y presupuesto de la fecha inicial.

Los dos firmantes se buscan en el padrón de la quincena. Empiezan vacíos y, después del envío, se recuerda la última pareja por usuario capturista y trabajador suplente. Se guarda su identidad en la solicitud. Los cambios de estado conservan auditoría y control de versión.

Administración → Jornadas y tabuladores concentra:

- Jornadas en borrador/autorizadas/suspendidas, por unidad y quincena, con códigos de categoría permitidos, horas y tarifa autorizada por hora.
- Un fondo compartido por unidad y quincena. Todas sus jornadas consumen el mismo fondo. La captura muestra autorizado, comprometido, disponible, importe solicitado y saldo estimado. Se reserva al enviar; devolver/cancelar libera el importe. Autorizar conserva el compromiso. No se permite bajar el presupuesto por debajo de lo comprometido ni cambiar reglas de una jornada que ya tenga reservas. Triggers SQL evitan sobregiros y lotes transaccionales evitan estados sin reserva.
- Tabuladores importables como JSON/CSV, con versiones inmutables por quincena, huella y auditoría. Un botón carga para revisión el tabulador de cálculo correcto ya existente en la herramienta; no se publica automáticamente para periodos no confirmados.

Sólo ADMIN/ADMINISTRADOR publica catálogos, presupuestos y tabuladores, con cuenta vigente revalidada en servidor. El motivo Jornada autorizada exige catálogo autorizado, unidad/quincena compatibles, categoría admitida, horas correctas y saldo suficiente. No se inventan ni se precargan presupuestos o categorías autorizadas.

La calculadora de nivelación consulta el tabulador publicado para la quincena seleccionada. Si falta, identifica expresamente su referencia existente como pendiente de publicación, sin sustituirla por el tabulador publicado de otra quincena. Se conserva la referencia ya usada por la herramienta y se centraliza la publicación en Administración. Las solicitudes de cobertura no inventan importes de nómina ni contratos laborales definitivos a partir de salarios antiguos.

Pruebas: `npm test --prefix central`, `python3 central/tests/contratacion-browser.py`, `python3 central/tests/contratacion-config-browser.py` contra el servidor local con cuentas sintéticas. Se prueban dos papeletas en una página, lectura QR, firmas, importación administrativa, selección de corte, presupuesto compartido, bloqueo de sobregiro y versiones de tabulador.

Extractores reproducibles: `scripts/extract-contratacion.py` y `scripts/extract-contratacion-formatos.py`. La fuente y análisis con datos personales permanecen fuera del repositorio.
