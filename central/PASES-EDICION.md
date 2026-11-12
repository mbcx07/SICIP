# Pases: edición, validación y unidad de trabajo · 5.46.0

El trabajador puede editar sus pases pendientes y cancelarlos antes de entregar. No puede cambiar matrícula, identidad, folio ni unidad asignada. La unidad se toma del padrón central. Al entregarse, tanto el estado como el acuse central bloquean sus cambios, incluso desde una pantalla anterior o el POST heredado.

Personal trabaja con una unidad seleccionada del catálogo. La última selección queda en D1 por operador y se recupera al entrar desde otro dispositivo. Se aplica al pase nuevo o manual, sin modificar la adscripción de la persona. Una corrección explícita de unidad en un pase pendiente también conserva la selección; cancelar o reclasificar otro documento no cambia esta preferencia.

Personal puede editar pendientes y cancelar recibidos indicando motivo. Después de recibir sólo se admite reclasificar OFICIAL/MÉDICO a PARTICULAR, con justificación; no permite convertirlo de nuevo a oficial ni modificar fechas, firmas o unidad. Se conserva el acuse. El cambio genera una notificación al trabajador con folio, motivo y clasificación; la cola de correo y push existente la distribuye a los canales verificados/registrados.

La recepción muestra el asunto declarado y permite abrir el pase para corregir antes de recibir. El módulo de pases presenta una confirmación de requisitos y firmas. Si se cambia el documento mientras otra persona tiene abierta la validación, debe revisarse otra vez. Un trabajador que tenía una edición abierta cuando se recibió no puede guardarla.

`pases_eventos` conserva antes/después, operador, motivo, fecha y request_key. Actualización, evento y notificación son una transacción con comparación del estado, contenido y revisión anteriores. Los reintentos idénticos no duplican eventos ni avisos; una recepción simultánea no deja cambios parciales. Los folios y QR se conservan. El historial consulta el servidor y se actualiza periódicamente y al recuperar foco.

Validación: casos de propietario/ajeno, unidad por modalidad, tipos oficial y médico, recepción simultánea, revisión vencida, cancelación pendiente/recibida, protección del acuse, reintentos, historial y avisos. Navegador con dos sesiones: edición pendiente, recepción mientras se edita, bloqueo del trabajador, reclasificación con aviso, cancelación por Personal, unidad recordada y captura manual sin alterar la adscripción; diseño móvil.

## Historial propio y unidad · 5.46.1

La consulta distingue `scope=propio` y `scope=personal`. El primero limita filas y consulta individual a la matrícula autenticada, también para administradores. La interfaz no muestra registros del almacenamiento antes de completar la consulta; filtra por propietario además de la respuesta del servidor. Una cuenta que entra al módulo propio después de usar Personal no reutiliza la lista ajena del navegador.

En pases se retira «Unidades que atiendo». Personal usa su combo existente para la unidad de captura y para consultar el historial de esa unidad; la última selección sigue guardada por operador. Los filtros anteriores de unidades no intervienen en ninguna modalidad de pases, y conservan su función en otros trámites. La consulta del trabajador muestra todo su historial propio sin restringirlo a una unidad. Las respuestas tardías de una selección anterior no reemplazan la lista actual.

Validación: 204 pruebas de lógica/API; navegador con caché de dos matrículas y carga lenta, cuenta administradora en modo propio, cambio entre modalidades y selección de unidad; regresión de edición y recepción con dos sesiones.
