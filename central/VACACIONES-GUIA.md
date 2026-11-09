# Vacaciones: solicitud física, historial y jornada compartida · 5.39.1

## Captura

La guía identifica al trabajador por matrícula y recupera fotografía, categoría, adscripción, fuente de datos y antigüedad disponible. La confirmación de identidad queda alineada con su texto. Los turnos se presentan por nombre (Matutino, Vespertino, Nocturno, Móvil, Jornada Acumulada); conservan su código en la base.

La pantalla de periodo permite solicitar uno nuevo o editar una solicitud pendiente. La descripción completa de la marca se muestra debajo de un selector compacto. Los cálculos siguen validando antigüedad, días, marcas encadenadas, roles A/B, vencimiento y equivalencias en servidor. Registrar el periodo es preparación de la solicitud y no una certificación administrativa. El nuevo flujo no almacena `certificado:true`.

**TC 08:** la identificación proviene del padrón, sin confiar en el código que mande el navegador. Sólo admite programación anual, sin anticipación y con un año efectivo. Para programación normal requiere dos periodos semestrales vencidos; para cuatrimestral, tres. El número de periodos vencidos se solicita porque no se deduce de la antigüedad. Una fecha de vencimiento futura no puede declararse vencida. Una antigüedad ausente en el corte no se inventa. La regla también se aplica a derechos anteriores cuando se reutilizan.

La tabla visual reproduce las columnas del oficio: número, inicio, términos según días de derecho y observación A/B. La columna aplicable se resalta y el número queda centrado. En celular, la tabla tiene desplazamiento horizontal propio. Se conserva el rol madre y el real; el aviso del inhábil aparece debajo del real cuando coincide con una jornada de entrada o salida del trabajador.

Se confirma turno, horas y descansos reales. Horarios por día se capturan únicamente para mixta acumulada; otras jornadas descartan estos campos. La equivalencia mixta confirmada sigue limitada a 10 días (dos fines de semana y dos guardias). No se extrapolan otras cantidades.

## Estado y recepción

Terminar la captura genera `PENDIENTE_AUTORIZACION`: se imprime la VAC-06, se recaban las firmas y se entrega físicamente al Departamento de Personal. No ejecuta ENVIAR, CERTIFICAR ni AUTORIZAR. La huella de los dos calendarios se comprueba de nuevo al guardar.

Una VAC-06 pendiente puede contener varios roles del mismo trabajador/año/firmantes, sin repetir casillas. Una vez recibida, su composición queda cerrada: los roles adicionales requieren otra solicitud. Los formatos anteriores conservan su historial y no se mezclan con solicitudes nuevas. Los expedientes individuales siguen vinculados mediante `vac06_raiz`; la impresión usa un solo folio y QR. Los planes pendientes cuentan para la secuencia de captura y el saldo mostrado, pero no se presentan como vacaciones autorizadas o capturadas en SIAP. Un índice parcial impide duplicar simultáneamente la misma fracción pendiente/recibida.

Recepción confirma el documento físico por QR o folio. Actualiza todos sus roles a `RECIBIDO_PERSONAL`, guarda acuses/eventos individuales y un solo aviso por documento. Repetir el escaneo no incrementa versiones ni duplica avisos. Recibir no equivale a capturar en SIAP: se conservan las validaciones de PECV que requieren programación reflejada en nómina.

El detalle presenta imprimir, cancelar y ver historial; Terminar trámite vuelve al Historial. Cancelar una VAC-06 del nuevo flujo cancela sus roles en una transacción y conserva acuses, eventos y jornada. No hay controles de pago, certificación, devolución ni cargas de escaneos. Las cargas de adjuntos del nuevo flujo se rechazan; los documentos históricos existentes se conservan. Se retiran las pantallas de certificación independiente y TP 14 del cliente de Vacaciones.

## Jornada permanente

`personal_jornadas` guarda una versión por matrícula, independiente de la quincena. Vacaciones la guarda junto con la solicitud en la misma transacción. Una edición concurrente revierte solicitud, calendarios y cambio de jornada: no deja un registro parcialmente guardado. Cada cambio tiene autor, fecha y contenido en `personal_jornada_audit`.

`GET /api/personal/jornadas?matricula=...` permite consulta al trabajador de su propia jornada y a los perfiles de personal autorizados. Mientras no exista una jornada independiente, recupera la última programación válida confirmada y la presenta como referencia versión 0. No interpreta un horario de plaza como descansos conocidos.

Administración → Jornadas y tabuladores → Jornada y descansos por trabajador permite consultar/editar por matrícula, con validación de versión. `PUT /api/personal/jornadas` exige administrador activo. Sus cambios no reescriben solicitudes anteriores. Coberturas recupera los descansos del titular y suplente por separado y permite confirmarlos para la solicitud; convierte lunes=0 del calendario a domingo=0 de Coberturas.

## Historial, Excel e impresión

Historial usa búsqueda y filtros por columna, con fechas/régimen desplegables. La consulta se ejecuta en servidor y respeta permisos y matrícula; no filtra únicamente lo que ya está cargado. Excel consulta todas las páginas y agrega «Tipo de programación»: Semestral, Cuatrimestral, Extraordinario de 20 años, Académica o Anual de Estatuto. TC 08 se identifica como semestral con programación anual de suplente. Los estados se presentan en español.

El PDF oficial conserva los campos institucionales. Fecha y «Folio: …» están arriba a la derecha, con el folio debajo de la fecha y el QR al lado. La quincena de inclusión queda siempre vacía para llenado manual. El visor usa botones verde/blanco con tamaño suficiente y cierre visible.

## Validación

`npm test` incluye permisos, TC08 sin anticipación, madurez anual, persistencia/versiones de jornada, reversión atómica ante conflicto, recepción/cancelación de varios roles e idempotencia de avisos. `tests/vacaciones-solicitudes-browser.py` comprueba el flujo con cuentas sintéticas, campos de marca, alineación de identidad, Historial, XLSX real, PDF carta de una página, posición del folio, visor, TC08, Administración y vista móvil. No se crean solicitudes de prueba ni se envían correos en producción.

Las reglas previas y derechos históricos se conservan para consulta y trazabilidad; no se modifican masivamente estados anteriores al desplegar este cambio.
