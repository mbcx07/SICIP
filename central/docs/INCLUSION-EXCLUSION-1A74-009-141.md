# Análisis del submódulo Inclusión, exclusión y ajustes de nómina

Análisis funcional original del 5 de noviembre de 2026. La implementación posterior basada en PD44 se documenta en [PD44.md](../PD44.md); las propuestas siguientes describen el análisis previo. Fuente revisada: PDF aportado por el usuario `1A74-003-034.pdf`, 337 páginas. Anexo 3, páginas impresas 97–102; anverso en 98 y reverso en 99. Instructivo de 25 campos en 100–102. El texto del documento es referencia normativa, no autorización para ejecutar cambios externos.

## Propósito y ubicación

Departamento de Personal → Inclusión, exclusión y ajustes de nómina. El título oficial de impresión es «Solicitud de Inclusión, Exclusión de Conceptos y/o Modificación al Histórico de Acumulados», clave 1A74-009-141. No confundir este trámite con alta/baja de plazas ni modificar por él el padrón central.

La política 5.1.26 exige este formato cuando existen diferencias en pagos/descuentos de incidencias APS. La política 5.1.25 establece validación quincenal de su aplicación. La guía de crítica de nómina, apartado 13 (páginas 81–82), relaciona solicitudes, soporte documental y contestación de inconsistencias. No es un formulario exclusivo de reintegros.

## Captura guiada propuesta

1. Buscar trabajador por matrícula o nombre. Mostrar identidad, categoría, adscripción y fuente quincenal. Seleccionar quincena de incidencia APS (AAAAQQQ) y quincena de proceso (AAAAQQQ) separadamente. Consultar el corte histórico correspondiente, si existe, y advertir si falta; nunca sustituirlo silenciosamente por el vigente. Conservar en la solicitud una instantánea de los datos y su corte.
2. Seleccionar operación: inclusión para pago, descuento o reintegro; exclusión; ajuste al histórico de acumulados. El formato representa cinco opciones, no una única opción genérica «inclusión». Si se permiten varias operaciones, vincular explícitamente cada concepto/registro a su operación y mantener la impresión inequívoca. La regla de combinación debe validarse antes de imponer selecciones múltiples o exclusivas.
3. Capturar conceptos o contadores/registros a ajustar, periodo de inicio y fin, motivo y fundamento normativo/contractual. Incorporar soportes documentales y número de anexos. No inventar catálogos SIAP, fórmulas, cifras de control ni obligatoriedad de documentos que esta norma no especifique.
4. Seleccionar jefe de dependencia o responsable de Servicios de Personal mediante buscador; mostrar trabajador firmante. Firmas autógrafas en la impresión. La política 5.1.27 remite al registro de firmas 1A74-009-142, actualizado anualmente y ante cambios de funcionario; guardar el último nombre usado no prueba facultad vigente.
5. Revisión, guardado central e impresión fiel del anverso/reverso. La sección exclusiva del Departamento de Personal del OOAD se captura en una etapa diferenciada por personal autorizado.
6. Seguimiento por folio: envío, recepción, revisión y, cuando se acredite, actualización en SIAP. Una recepción o autorización no significa pago efectuado. Conservar historial de devoluciones y correcciones sin borrar el expediente.

## Campos oficiales del anverso

| Núm. | Campo | Tratamiento propuesto |
|---|---|---|
| 1 | OOAD: número y descripción | Configuración institucional; no inventar número |
| 2 | Nombre de la dependencia | Derivar de unidad validada; conservar instantánea |
| 3 | Fecha de elaboración | Día, mes y año |
| 4 | Folio | Consecutivo de servidor, breve y único |
| 5 | Apellido paterno, materno y nombre(s) | Padrón; respetar orden de casillas oficiales |
| 6 | Matrícula | Padrón |
| 7 | Categoría | Corte identificado |
| 8 | Adscripción | Descripción de clave departamental del corte |
| 9 | Solicitud: pago/descuento/reintegro/exclusión/ajuste | Casillas del formato |
| 10 | Concepto(s)/registro(s) | Código(s) o contador(es), sin inventar significado |
| 11 | Quincena de incidencia APS | AAAAQQQ |
| 12 | Quincena de proceso | AAAAQQQ; independiente de incidencia |
| 13 | Número de anexos | Mostrar cantidad declarada y adjuntos; no equiparar automáticamente archivos con anexos documentales |
| 14 | Periodo del/al | Fechas DD/MM/AAAA; fin no anterior a inicio |
| 15 | Motivo | Argumento normativo o contractual |
| 16 | Trabajadora/trabajador | Espacio para firma autógrafa |
| 17 | Jefe de dependencia | Nombre y firma autógrafa |

No imponer que incidencia y proceso sean la misma quincena. Validar el formato AAAAQQQ y que QQQ sea 001–024. El motivo no debe generarse como una afirmación normativa sin respaldo.

## Campos exclusivos de Personal del OOAD

La sección inferior del anverso y el reverso contienen:

- **18. Conceptos fijos:** matrícula, concepto, unidades, importe, quincena inicial/final, número de control, descripción y cifra de control.
- **19. Histórico de acumulados:** matrícula, contador, mes, unidades suma/resta, importe suma/resta, descripción, dice y debe decir.
- **20. Conceptos por una vez:** matrícula, concepto, importe, unidades, día/grupo, jornada/complemento, factor 6.º y 7.º, descripción, base 22, marca, fecha inicial/final y cifra de control. Conservar las denominaciones oficiales al imprimir.
- **21. Quincena de proceso.**
- **22. Elaboró reporte(s):** nombre y firma.
- **23. Autorizó jefa o jefe de la oficina:** nombre y firma.
- **24. Actualizó en SIAP:** nombre y firma de quien efectivamente realizó la inclusión.
- **25. Observaciones:** en el reverso.

El reverso presenta cinco columnas «Reporte 1» a «Reporte 5» para cada uno de los tres grupos 18–20. Modelar estas filas/columnas como registros estructurados; no como un solo texto libre. No calcular cifras de control sin conocer su regla oficial. La norma asigna esta captura al analista; los permisos actuales genéricos AREA_PERSONAL no prueban por sí solos autorización para todas las funciones del OOAD.

## Impresión

Reproducir dos caras: anverso y reverso oficial. Este formato no es el contrato de dos papeletas por hoja. Preservar tablas, casillas, firmas y clave documental. Las imágenes del anexo incluyen números de referencia del instructivo: esos círculos numerados no son datos de la solicitud.

La incorporación de QR/folio debe conservar el espacio de folio y no tapar bordes, textos ni firmas. La norma pide folio consecutivo; un QR sería control adicional de SICIP, no requisito encontrado en este anexo. Reservar su ubicación y comprobar impresión real antes de fijar medidas. No imprimir estados internos como ENVIADA o etiquetas de depuración dentro del documento oficial.

## Integraciones propuestas en SICIP

- Persistencia compartida en D1 y documentos adjuntos en almacenamiento privado, con autorización del servidor; sin base de negocio local.
- Base central y sus cortes históricos para identidad y datos laborales. Elegir la fuente según incidencia/periodo y mostrarla; no inferir que la quincena de proceso determina por sí sola el corte correcto.
- Mis trámites: el trabajador ve las solicitudes asociadas a su matrícula, aunque las capture Personal.
- Recepciones: resolución por folio breve/QR y acuse único; reutilizar el esquema existente con un tipo propio, sin colisiones con P/C/V.
- Notificaciones: tránsito y entrega a Personal, reutilizando la cola y correos verificados; no enviar dos veces por una misma transición.
- Normativas: enlazar 1A74-003-034 a páginas 98–102 para consultar formato e instructivo.
- Bitácora: autor, fecha, estado anterior/nuevo, cambios, versión impresa, fuente quincenal y comprobante de procesamiento cuando corresponda.

## Estados propuestos, no prescritos por el documento

BORRADOR → ENVIADA → RECIBIDA_PERSONAL → EN_REVISION → AUTORIZADA → ACTUALIZADA_SIAP. DEVUELTA permite corregir y reenviar con historial; CANCELADA conserva expediente. No completar ACTUALIZADA_SIAP automáticamente: requiere registro del responsable y evidencia. Si también se controla «reflejado en nómina», tratarlo como verificación posterior separada, nunca deducirlo de la impresión o del acuse.

## Pendientes de precisar antes de automatizar cálculos o atribuciones

1. Catálogo vigente de conceptos/contadores, tipos de dato, parámetros y cálculo de cifras de control. El anexo ofrece campos, no toda la lógica SIAP.
2. Qué usuarios del sistema representan al analista y funcionarios autorizados del OOAD; separar elaboración, autorización y actualización.
3. Código institucional de OOAD y dependencias, si no están completos en la configuración vigente.
4. Reglas sobre combinaciones de operaciones, documentación soporte y plazos específicos según concepto. No generalizar las reglas de un concepto a todos los demás.
5. Confirmar con impresión de prueba el tamaño/escala y uso de anverso/reverso; no reconstruir como dos papeletas ni reutilizar la plantilla VAC06.

## Validación de una implementación futura

Comprobar permisos por etapa y matrícula, folio concurrente único, cortes históricos, separación incidencia/proceso, orden oficial de nombres, cinco reportes por grupo en reverso, adjuntos privados, bitácora, recepción idempotente, avisos únicos, límites de texto sin recortes y lectura QR tras impresión. Usar datos sintéticos; no modificar SIAP ni expedientes reales para pruebas.
