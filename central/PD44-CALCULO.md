# PD44 · conceptos por una vez: fuentes y alcance

Fuentes recibidas el 6 de noviembre de 2026: `CTOS 1RA VEZ 2025 - 2026  A LA QNA 2026003 INCREMENTO correccion.xlsm` y `cuadro de desiciones (enviada por mexico 2026) Conceptos por Una vez.pdf` (2 páginas escaneadas). Se inspeccionaron hojas, fórmulas, macros como texto e imágenes del PDF; no se ejecutó VBA.

## Hallazgos

- La tabla estructurada `tblTabulador`, hoja `TABULADOR 25-26`, rango A1:X293, contiene 292 categorías únicas y 23 columnas numéricas. No tiene errores dentro de ese rango. Hay referencias de trabajo y un #REF fuera de la tabla; no se importan esas celdas.
- El libro también contiene un padrón y registros personales. No se trasladan al repositorio, biblioteca pública ni módulo de reclamaciones: sólo se extrae el tabulador sin personas. El trabajador sigue viniendo del padrón SICIP.
- El PDF define la preparación de un renglón SIAP. «IMPORTE» no significa universalmente pesos: para 173 son horas décimas, para 174 minutos, para 032 es 1, etc. No se dispone de una fórmula universal de pago neto; la API devuelve `total_pesos: null`.
- `CAPTURA!AE12` usa AH7 o AH8; AH7 suma código numérico, D12, G12, J13 y M12. AH8 omite el código para IEG/IM/IRT/COM. Factor 6.º/7.º, base22 y marca no forman parte de esa cifra de control. Se conservan tarifas completas y suma decimal exacta; el control se presenta a dos decimales.
- La quincena 2026003 aparece en el nombre del archivo. No acredita por sí sola inicio/fin de vigencia para todo 2025–2026. Cada publicación se limita a la quincena que Administración haya revisado y confirmado.

## Automatización

La propuesta prepara importe, unidades, día/grupo, jornada/complemento, factor autorizado, base22, marca, fechas y cifra de control para los grupos sustentados. Los días/horas/minutos efectivos, signo y factor normativo se confirman por el analista: ni fechas de un periodo ni categoría por sí solas acreditan cuántas incidencias hubo o qué factor corresponde.

Las bases se toman de la columna del concepto y categoría/jornada exacta del archivo, no de un salario supuesto ni de coincidencia difusa. 010 usa base4, 030 base2, 035/037 base5, 032/033 base3, 129/171/175/177 base8, IEG/IM/IRT base6; base22 proviene de columna BASE 9 en los grupos indicados. 001/003 usan la columna 002 como sueldo diario canónico que el cuadro requiere; los conceptos que tienen columna propia usan la suya. El cuadro del PDF muestra los componentes de las bases; el Excel entrega valores agregados, no el desglose de cada componente por trabajador. Por ello no se promete reconstruir prestaciones individuales ausentes.

El signo negativo sólo se aplica a campos de importe/unidades marcados (−), por decisión explícita del analista conforme a la nota del cuadro. No se invierte automáticamente todo un renglón por llamarse «reintegro», ni se infiere el signo de un pago neto inexistente.

La propuesta no modifica el expediente. Aplicar exige revisar y confirmar, elegir reporte 1–5 y confirmar expresamente cualquier reemplazo. Se copia al grupo «Conceptos por una vez» del 1A74-009-141 y se guarda entrada, regla, tarifa, versión/hash de tabulador, actor, fecha y cifra sin redondear. Nunca autoriza, paga ni transmite a SIAP. Una versión de tabulador nueva no recalcula expedientes guardados; si cambia entre vista previa y aplicación se rechaza la propuesta obsoleta. Los cálculos se congelan tras resolución. Editar la solicitud invalida los renglones automáticos; una edición manual de reportes retira la etiqueta de cálculo automático.

Un periodo que atraviesa varias quincenas no usa una tarifa única: requiere separar el análisis por quincena. Una categoría/jornada que no coincide exactamente se selecciona y justifica; no se elige por similitud de nombre.

## Discrepancias pendientes

- **008:** el PDF lo muestra en dos grupos incompatibles. El usuario respondió que desconoce cuándo corresponde cada modalidad. Se pueden inspeccionar ambas propuestas, pero quedan REQUIERE_VALIDACION y no se aplican automáticamente ni se completa una cifra de control como válida. Debe aclararlo la instancia responsable.
- **015:** el cuadro pide porcentaje entero, días y sueldo+011 en campos independientes; el libro multiplica J12×K12×L12 en J13 antes de sumar la cifra de control. Se identifica esa discrepancia y se impide la aplicación automática hasta conciliar la regla.
- **164:** el PDF exige base8, pero el Excel no aporta columna 164. No se sustituye silenciosamente por 171.
- **BEC:** el código alfanumérico no está en la exclusión expresa de AH14; no se supone cómo sumarlo. COM/IEG/IM/IRT sí están excluidos expresamente.
- Conceptos heredados de PD44 no sustentados en el cuadro mantienen captura manual; no reciben fórmulas inventadas. Los grupos exclusivos de sustitutos requieren TC08; 036 exige TC01/02.

## Administración y datos

Administración → Jornadas y tabuladores incorpora «Tabulador diario · conceptos por una vez (PD44)». Permite cargar la referencia recibida o un archivo .xlsm/.xlsx/.json con las mismas columnas. El lector sólo toma TABULADOR y no ejecuta macros. Valida categorías únicas, columnas, números, huella y confirmación de vigencia; cada publicación conserva su versión en D1.

`pd44/tabuladores-schema.sql` es aditivo/idempotente y está incluido en schema.sql. `scripts/extract-pd44-tabulador.py` reproduce la extracción a `src/pd44-tabulador-referencia.json`. No distribuir el libro completo con registros personales como recurso público.

Motor: `pd44-calculo.mjs`. API: `pd44-tabuladores-api.mjs`. Interfaz de análisis: `pd44-calculo-client.mjs`; configuración: `pd44-tarifas-client.mjs`. La biblioteca Normativas conserva el PDF original con texto OCR y aviso de verificar las tablas en la imagen.

## Verificación

Pruebas numéricas independientes de suma decimal, unidades/signos, exclusión de factores de control, asignación de marcas, restricciones TC, ambigüedades y categorías. API: permisos, vigencia exacta, propuesta sin mutación, aplicación confirmada, reemplazo explícito, versiones inmutables, invalidación al editar, protección contra versión obsoleta y periodos multiquincena. Navegador: publicación desde Administración, captura PD44, propuesta/aplicación, impresión de dos caras y móvil. Usar sólo cuentas y datos sintéticos.
