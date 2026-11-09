# Programación guiada de vacaciones · 2027

Sustituye la entrada principal de Nuevo trámite por una guía de cinco pantallas. Las opciones anteriores (PECV, memorándum, reposición, ajustes autorizados y edición histórica) siguen disponibles en «Otros trámites»; no se eliminan expedientes ni derechos.

1. **Identificar.** Consulta automática al capturar/seleccionar matrícula, con control de respuestas tardías. Muestra nombre completo, categoría, adscripción, contratación, plaza/horario, antigüedad de la base vigente y su quincena. Debe confirmarse la identidad antes de continuar. Fotografía desde el padrón/cuenta SICIP mediante endpoint autenticado; si falta se indica «Sin fotografía registrada», sin fabricar retratos. No se exportan fotografías ni datos de la cuenta. Sólo se admiten imágenes raster codificadas o URLs HTTPS de almacenamiento Google/Firebase conocido.
2. **Derecho.** Selección semestral, cuatrimestral, extraordinario de 20 años; Estatuto/académico se distinguen según el tipo de contratación. Seleccionar un periodo certificado disponible o certificar uno nuevo; número del tarjetón y soporte siguen siendo necesarios porque no se deducen inequívocamente de la antigüedad. La antigüedad vigente se recupera automáticamente; una ausencia de dato requiere certificación, no años supuestos. Marca con descripción contextual, estado vencido/no vencido y, en el segundo caso, fecha de vencimiento. Se muestran días y primera fecha permitida. Días efectivos laborados y exposición a radiaciones se certifican cuando apliquen.
3. **Rol madre.** Calendario por mes con los 24 roles A (nones/largos) y B (pares/cortos) de las circulares 2027. Muestra rango exacto según tabla oficial, días y anticipación. Se puede seleccionar un rol incompatible para leer el motivo, pero continuar queda bloqueado. El servidor valida marca, días, régimen, vencimiento y secuencia antes de avanzar, sin crear un periodo ni registrar calendarios en la consulta previa.
4. **Diferimiento real.** Confirma patrón, entrada/salida, descansos y, cuando corresponda, guardia adicional u horas por día. Recupera el último calendario confirmado y el horario de plaza, sin asignar descansos desconocidos. Aplica equivalencias y excluye festivos/descansos, incluyendo salidas nocturnas en inhábil. Muestra madre, jornadas equivalentes, primera entrada, última salida y reincorporación. La fecha real se calcula y luego se confirma; una fecha arbitraria diferente se bloquea. Para un ajuste autorizado distinto se usa el trámite específico, sin disfrazarlo de equivalencia automática.
5. **Registrar.** Revisión de ambos calendarios, buscador de firmantes y referencia. Guarda en D1 y envía a Personal; conserva MADRE y REAL en la misma transacción del expediente. El registro no autoriza ni captura por sí solo en SIAP. VAC-06 queda disponible de manera opcional después de registrar para CCT, con los datos del padrón y el disfrute real; Estatuto conserva su formato distinto. No se añaden etiquetas internas al documento oficial.

## Vencido declarado

Si se certifica un periodo vencido sin conocer su fecha exacta, se conserva `vencido: true` y la fecha de declaración. No se inventa un vencimiento usando la fecha del día. Se permite seleccionar roles del calendario publicado sin anticipar un derecho futuro. Un vencimiento futuro no puede declararse vencido. Para el primer periodo de Estatuto se mantiene obligatoria la fecha exacta, porque debe comprobarse el plazo de seis meses. Los demás plazos se siguen calculando según circular: 120/105/0 y excepciones existentes.

## Coherencia e historial

Las consultas previas no escriben periodos, registros ni calendarios. La certificación usa identificador de captura para reintentos. Cada revisión recibe una huella del rol madre y real calculados; al guardar se exige la misma revisión, además de identidad, jornada, fecha y registro confirmados. Un cálculo distinto se rechaza y debe recalcularse. La edición de borradores de la nueva guía usa la misma secuencia; la edición de expedientes anteriores conserva su flujo. Los firmantes se recuerdan por trabajador al enviar, como antes. Los controles de captura se bloquean durante consultas para impedir confirmar una propuesta calculada con parámetros que cambiaron mientras llegaba la respuesta.

Las marcas 7 y 8 no generan ausencia y omiten el paso de jornada; se registra aplicación sin inventar rol madre/real de disfrute. La marca 7 conserva su enlace obligatorio al inicio de un periodo ordinario autorizado. La equivalencia mixta sigue confirmada únicamente para 10 días: cuatro jornadas de fin de semana más dos guardias adicionales; no se extrapolan otras cantidades.

## Consulta y salida

Expedientes consulta el servidor por filtros de nombre/matrícula/folio, categoría, adscripción, régimen, modalidad, marca, estado, rol y fechas madre o reales (intersección del periodo con el rango). Todas las consultas/exportaciones respetan el perfil y matrícula. Los listados son resúmenes: el detalle completo se obtiene al abrir un expediente, evitando descargar cientos de calendarios/jornadas para mostrar una tabla.

Excel `.xlsx` incluye identificación, periodo, marca, fuente, antigüedad certificada, madre, primera entrada/última salida/reincorporación reales, equivalencia y seguimiento. Consulta todas las páginas de los filtros, con límite superior de ID para no incorporar registros nuevos a mitad de exportación. PDF se obtiene desde la impresión del informe filtrado; a más de 5000 filas se pide acotar la impresión y se conserva la opción de Excel (hasta 200000 filas). Los registros sin disfrute muestran aplicación separada y no simulan fechas de ausencia.

## Archivos y validación

- `vacaciones-programacion-client.mjs`: guía principal.
- `vacaciones-guia-domain.mjs`: compatibilidad y descripción de marcas.
- `vacaciones-api.mjs`: preparación compartida del derecho, roles, cálculo previo, fotografía protegida y registro.
- `vacaciones-consulta-api.mjs` / `vacaciones-export-client.mjs`: filtros y salidas.
- Sin migración de tablas: los campos nuevos se conservan en payloads versionados; los registros anteriores permanecen intactos.

Pruebas con datos sintéticos: consultas previas sin escritura, 120/105 días, roles cortos incompatibles, secuencia, acumulada con festivo, confirmación de fecha/huella, dos calendarios atómicos, privacidad de foto, filtros y paginación, Excel real leído con openpyxl, VAC-06 en una hoja carta horizontal, informe PDF y vista móvil. La guía no presupone que exista fotografía ni que una base sin datos contenga antigüedad o descansos certificados.

## Presentación y VAC-06 con varios roles (5.38.0)

El calendario conserva la disposición de la tabla del oficio: 24 renglones, inicio, términos por días de derecho y observación A/B. La columna de días seleccionada queda resaltada; la tabla tiene desplazamiento horizontal propio en pantalla pequeña. Seleccionar un rol incompatible muestra su motivo y mantiene bloqueado continuar.

Los horarios diferentes por día se capturan sólo en jornada mixta acumulada; al cambiar a otra jornada se eliminan de la solicitud los horarios particulares. El cálculo identifica inhábiles que coinciden con jornadas del trabajador, incluida la salida de una velada, y muestra el aviso debajo del rol real sin descontar esos días como vacaciones.

Al terminar una programación se puede agregar otro rol a la misma VAC-06. Los expedientes conservan sus derechos, validaciones, estados y calendarios individuales, y se vinculan en D1 mediante `payload.vac06_raiz`. La consulta `/api/vacaciones/registros/:uuid/vac06` recupera el conjunto autorizado para esa cuenta, con sus periodos certificados. La impresión usa el folio y QR del expediente raíz. Se validan trabajador, año, CCT, firmantes y casillas únicas (dos semestrales, tres cuatrimestrales y una extra); no se omiten las restricciones normativas de secuencia. Una inserción condicionada impide dos capturas simultáneas en la misma casilla vinculada. La edición conserva el vínculo y vuelve a comprobar el conjunto.

Folio y QR se imprimen junto a la fecha, arriba a la derecha. La casilla inferior «Quincena de inclusión» queda siempre vacía, incluso si un expediente histórico contiene `v06_qna`, para su llenado manual por el operador.
