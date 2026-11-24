# SICIP 5.26.0 · Base central por quincena

La base de personas y plazas se guarda en Cloudflare D1 (`sicip-central`, binding `DB`). Los módulos leen un corte completo e inmutable mediante la misma sesión. Las cargas se guardan como borrador, se validan y después se activan; activar otro corte no borra usuarios, pases, trámites ni resultados anteriores.

## Uso en la aplicación

1. Iniciar sesión con la matrícula y contraseña existentes. La primera vez tras actualizar se requiere volver a iniciar sesión; no borrar los datos del navegador.
2. Abrir **Administración** y elegir la pestaña **Personal y plazas**.
3. Usar **Consulta** para buscar por matrícula, nombre o plaza. Se distinguen personas sin plaza, ocupante y titular; no se interpreta «sin plaza» como baja o jubilación.
4. Un administrador puede abrir **Cargar quincena**, elegir el Excel completo y revisar la vista previa y observaciones.
5. **Guardar y validar corte** sube lotes recuperables. No cambia el corte activo.
6. **Activar este corte** actualiza la referencia de consulta de forma atómica. Las pestañas abiertas muestran un aviso para actualizar sin perder una captura en curso.
7. **Historial de cortes** permite activar uno anterior. Los datos del corte anterior se conservan.

Tipos confirmados: 01 Confianza, 02 Base, 03 Temporal y 08 Suplente. Los otros códigos quedan sin clasificar; Status y Cve Baja se conservan como códigos.

## Datos y permisos

- `personas`: padrón completo, con o sin plaza.
- `plazas`: consolidado de Todas las plazas, ocupante y titular separados, campos del origen y complemento Fechas Plazas.
- `antiguedad`: unidades DP y cálculo del desglose de años/quincenas/días.
- `catalogos`: categorías, adscripciones, bloques separados de AR, restricciones y conversión de unidades. Las variantes de una misma clave se conservan como alternativas y observaciones.
- La importación no crea cuentas ni cambia contraseñas, roles o estado de acceso.
- La sesión se valida en servidor y se guarda en una cookie Secure/HttpOnly/SameSite=Strict. D1 conserva únicamente el hash del token de sesión.
- Los trabajadores consultan su registro y sus plazas. Los perfiles de personal autorizados pueden consultar el padrón; la entrega de identificación y datos de Fechas Plazas está controlada por perfil.
- Los JSON personales heredados se excluyen del nuevo despliegue. No publicar el Excel, snapshots normalizados ni credenciales en el repositorio o en `public/`.
- El sistema conserva la cuenta y el almacenamiento transaccional originales de Firestore. Este cambio no migra ni endurece las reglas de seguridad de ese proyecto: requiere una revisión aparte con acceso administrativo de Firebase.

## Integración y diseño

`src/client.mjs` carga y pagina los datasets de una versión fija, crea las proyecciones compatibles y comparte la misma base con los iframes de Pases, calculadora y Exámenes. El adaptador del bundle intercepta lecturas de las colecciones de dominio; las cuentas y los movimientos continúan usando sus flujos existentes. Las escrituras de plantilla por las pantallas antiguas se rechazan y dirigen a la importación central.

La calculadora usa el corte de personal activo. Su tabulador salarial mantiene vigencia y actualización independientes; este Excel no sustituye ese tabulador.

Los nuevos pases, recepciones y trámites registran el corte/quincena de origen. Los registros anteriores no se reescriben. Exámenes se incorpora como complemento en el mismo sistema; el enlace a la versión anterior conserva el acceso a sus resultados locales previos. No se copia ni elimina el almacenamiento de otro dominio.

Se corrigieron la selección duplicada del menú, estilos que recoloreaban botones grises, eliminación de botones Volver, interferencia de Herramientas con paneles ajenos, una inserción de menú con padre incorrecto y la regeneración continua de Aura fuera de Inicio. No se cambian nombres del padrón con reemplazos globales de texto.

## Desarrollo y comprobaciones

Node 24 y Python 3. Instalar dependencias con `npm ci` en esta carpeta. Usar el checkout existente; no crear worktrees salvo solicitud expresa.

```sh
npm test
SICIP_TEST_XLSX='/ruta/al/archivo.xlsx' npm run test:workbook
node scripts/normalize.mjs '/ruta/al/archivo.xlsx' /workspace/sicip-data/corte.json 2026015
```

Las pruebas de libro verifican el corte 2026015 de referencia; el Excel original no se incluye en Git. Las pruebas de API usan SQLite real a través de un adaptador D1 y cuentas sintéticas, sin cambiar cuentas de producción.

Para probar la interfaz contra una base local con cuentas sintéticas:

```sh
node tests/server.mjs /ruta/al/build /workspace/sicip-data/corte.json
SICIP_TEST_XLSX='/ruta/al/archivo.xlsx' python3 tests/browser.py
```

Las cuentas del harness existen únicamente en el proceso de prueba. Ese servidor y sus mocks no forman parte del despliegue.

## Build y despliegue

La fuente legada disponible es un bundle compilado. La base documentada es el despliegue Cloudflare `1bea7cfb-acd9-4721-91ec-7b97ae1e662e`, conservado antes de esta integración. `scripts/build.py` aplica cambios comprobados a esa base y rechaza volver a parchear un bundle ya adaptado.

```sh
python3 scripts/build.py --base /ruta/al/respaldo-1bea7cfb --out /ruta/a/un/build-nuevo
npx wrangler pages deploy /ruta/a/un/build-nuevo --project-name sicip-bcs --branch nombre-de-prueba
```

Probar primero la versión de prueba. Para producción usar `--branch main`. La configuración de Pages debe conservar sus variables existentes y tener binding `DB` a la base D1 indicada. No incrustar tokens ni valores de secretos en comandos o archivos.

`schema.sql` prepara las tablas e índices. `scripts/cloud.py` permite aplicar el esquema, conservar el binding y cargar snapshots de preparación mediante la autenticación Cloudflare inyectada. Rechaza reutilizar un registro de importación cuando cambió el contenido normalizado. Los archivos de registro y snapshots deben permanecer fuera del checkout y del directorio público.

## Recuperación

La activación guarda una sola referencia, con control de la versión esperada, y deja una entrada de auditoría. Un corte incompleto no puede activarse. Los lotes repetidos con el mismo contenido son idempotentes; claves duplicadas o contenido diferente se rechazan sin pisar datos.

Para volver al corte anterior usar Historial. Para una falla del código, Cloudflare conserva el despliegue anterior `1bea7cfb-acd9-4721-91ec-7b97ae1e662e`. La base D1 y el respaldo previo no se borran al volver a desplegar. El corte 2026009 de respaldo fue reconstruido desde los JSON de la aplicación anterior, no desde un Excel original de esa quincena.

## Correcciones de interfaz y flujos 5.23.1

El encabezado queda por encima del menú. Menú y contenido tienen desplazamientos independientes, con una sola opción activa y sin colores fluorescentes fijos. Los avisos de instalación y foto se muestran dentro de Inicio. Se respeta el espacio de las lupas de búsqueda. Pases ajusta la altura del iframe al documento completo y Recepciones deja de remontarse encima de otro módulo.

Cuadros conserva los cambios pendientes y la búsqueda tanto en asignación administrativa como en Mi Cuadro. Los enlaces añadidos al formulario de contratación antiguo se retiraron: no corresponden al módulo de cobertura descrito por el usuario. El administrador recibe todos los permisos efectivos sin cambiar el perfil de otras cuentas. Personal y plazas, Cargar quincena e Historial de cortes se integran como pestañas de la misma Administración, junto a Usuarios, Roles y Unidades. Se retira la carga Seed BD de esa pantalla.

La postulación de confianza exige un PDF de hasta 1 MB. Se conserva el archivo real, por lotes, en D1; la descarga requiere sesión y permiso de propietario, jefe destinatario, administrador o Personal. La solicitud y su aviso se guardan en Firestore. Un fallo devuelve un mensaje y habilita reintentar; el identificador del envío es estable para el mismo adjunto y destino. Las solicitudes recibidas se consultan al abrir el cuadro, sin depender del JSON estático anterior. No se migran automáticamente las referencias antiguas que nunca contenían un archivo.

Para recepción QR, `_headers` permite cámara sólo al propio sitio. El lector jsQR 1.4.0 (Apache-2.0) se sirve localmente, sin depender del CDN. Se manejan denegación de permiso, cancelación durante apertura y lectura de QR invertidos. El permiso del navegador y una cámara disponible siguen siendo necesarios.

Las lecturas de un corte inmutable usan páginas de 1,000 y solicitudes en paralelo; se verifican conteos y claves. Se eliminan las esperas artificiales de seis segundos y la consulta serial por cada jefe. La primera carga y los movimientos remotos siguen dependiendo de la red.

La regresión de interfaz se ejecuta con `npm run test:ux` contra el harness local; requiere Chromium, Playwright para Python y ffmpeg. Incluye un QR sintético en `tests/fixtures/`, genera una cámara simulada y verifica lectura, selección inmediata en ambos cuadros, currículum obligatorio, recuperación de errores y desplazamientos.

## Pases e integración 5.23.2

Administración mantiene su encabezado y sus pestañas al consultar o cargar datos; el panel central se monta como hijo, sin sustituir la vista de administración. El nombre completo del encabezado usa espacios para las barras del nombre sólo en su presentación.

Las solicitudes de pase comienzan con asunto y horario vacíos y obligatorios. La fecha conserva la validación contra retroactividad y muestra un aviso junto al campo. El servidor reserva folios globales consecutivos `P-000001` con clave de reintento estable: no se generan UUID largos ni consecutivos independientes por navegador. Los pases ya emitidos no cambian de folio y sus respaldos continúan siendo compatibles. La reserva del consecutivo no migra el historial local del pase a D1. La captura manual acepta `123`, `P-123` o `P-000123` para buscar el mismo folio corto.

La impresión usa clases y geometría propias para evitar las reglas de tamaños fijos acumuladas de la plantilla antigua. Conserva constancia, estadísticas y gráficos, con texto adaptable, folio separado y QR generado en el navegador mediante qrcode-generator 1.4.4 (MIT), sin enviar los datos al servicio QR externo. Se verifican PDFs carta de una página, tanto con folios nuevos como históricos largos y nombres extensos.

El módulo Contratación y coberturas se recuperó del programa Excel original. Véase [CONTRATACION.md](CONTRATACION.md) para su alcance, reglas y validación.

## Seguimiento personal 5.26.0

[Menú, nombres, folios y conexión de Mis trámites](SEGUIMIENTO.md).

## Prueba piloto: conservación y persistencia (noviembre de 2026)

Las reglas operativas vigentes están en [AGENTS.md](../AGENTS.md). El build y la publicación cambian código, no cargan ni sustituyen las bases operativas. Las migraciones se ejecutan aparte y deben conservar los registros anteriores. Los respaldos y las fuentes originales se guardan fuera de Git; nunca se publican como assets.

Pases, recepción/derivaciones, coberturas, vacaciones, PECV, PD44, cálculos, perfiles, notificaciones y padrón usan D1. Las cuentas, cuadros y trámites heredados mantienen su almacenamiento en Firestore. Pases conserva una copia de compatibilidad en el navegador después del guardado central; no es la fuente de verdad ni un motivo para limpiar el navegador.

Desde 5.68.2, Exámenes registra y consulta resultados en `examenes_resultados` de D1. El administrador puede consultar todos desde el historial de Exámenes. Los resultados locales anteriores de la misma matrícula se importan cuando esa persona abre Exámenes en el navegador original; se conserva la copia y los reintentos no duplican resultados. Los registros locales de otra matrícula no se atribuyen a la sesión actual. No existe una operación de borrado del historial en la nueva API. Un resultado cuyo envío falla muestra el estado pendiente y un botón de reintento: no se anuncia como guardado.

## Perfil, sesión y vinculación de correos (5.69)

El perfil ordena datos personales, contacto de emergencia, correos y verificación. Guardar cambios sólo persiste datos: cada correo tiene su propio envío y confirmación. El botón de guardar se activa al modificar el formulario y vuelve a desactivarse únicamente tras la confirmación del servidor. Un fallo al consultar avisos push no bloquea el formulario.

Cada código tiene vigencia de 15 minutos; una segunda solicitud durante ese plazo no cambia el código ni duplica el correo. El estado de verificación devuelve sólo vencimiento, intentos restantes y estado de envío de la matrícula autenticada, nunca el código ni su hash. El contador se recupera al reabrir el perfil. Cinco intentos incorrectos bloquean la validación hasta solicitar otro al vencimiento. La aceptación del proveedor de correo se distingue de la entrega efectiva.

Una respuesta 401 en una operación autenticada lleva al login y explica el vencimiento. Se eliminan sólo las referencias de sesión del navegador; no se borran datos ni históricos locales. No se conservan borradores personales en almacenamiento local: la pantalla advierte que las modificaciones sin guardar tendrán que recapturarse. Un error de contraseña en el login no dispara otra redirección.

## Orden del primer acceso (5.69.1)

El cambio inicial de contraseña se completa antes de abrir el perfil obligatorio. Las sesiones que aún tienen `primerAcceso` regresan a esa pantalla; la comprobación periódica de contacto no puede taparla. El formulario exige los mismos ocho caracteres mínimos que el servidor y sólo avanza tras confirmación del guardado. La contraseña no se copia al objeto de usuario de `sessionStorage`. Completar datos personales o vincular un correo no cambia la contraseña de acceso.

## Emisión y cancelación de pases (5.69.2)

La generación del PDF valida en el servidor que el pase siga vigente y registra una emisión para impresión/descarga en `pases_eventos`. No se entrega un PDF nuevo de un pase cancelado. Desde esa emisión, la cancelación corresponde a Personal con justificación; el trabajador sólo puede cancelar antes de emitir y entregar. La impresión se registra al generar el PDF, pues el navegador no confirma si finalmente salió una hoja física. No se inventan eventos de impresión de documentos históricos: las emisiones anteriores a este control no tienen esa evidencia. Las copias ya descargadas fuera del sistema no pueden revocarse; la recepción valida el estado vigente del folio.

El aviso de sesión caducada se elimina al autenticar correctamente, se cancela su redirección pendiente y una respuesta atrasada de una sesión anterior no vuelve a vencer la nueva.

## Convocatorias y perfiles para reemplazo (5.70)

El catálogo `convocatorias` guarda por número de convocatoria y plaza la transcripción cotejada de escolaridad, experiencia, alternativas, fechas y lugar de inscripción. Los seis originales 2026.03.194–199 se conservan íntegros, con SHA-256, en `public/convocatorias/`; el build los copia a `/convocatorias/` y el Worker exige sesión para descargarlos. `scripts/seed-convocatorias.py` agrega números nuevos sin reemplazar registros existentes. El estado informativo se calcula con la fecha local; el cierre conserva el histórico.

Inicio difunde las plazas vacantes y su inscripción **presencial**. Leer o descargar una convocatoria no registra una inscripción y no envía currículums. Esto es independiente del cuadro de reemplazo para ausencias, vacaciones y preparación de relevos por jubilación. No se amplían permisos al publicar avisos.

En el editor del cuadro, Administración puede elegir un perfil de puesto como referencia y revisar la escolaridad y experiencia antes de guardar. Los perfiles no se asignan automáticamente por categoría ni por el ocupante de una vacante. Las alternativas «Y» y «O» se conservan. El guardado central usa una máscara de sólo requisitos y fecha de actualización, con control de versión: no reemplaza candidatos, prioridades ni solicitudes. La creación de un cuadro usa `exists=false` y nunca reemplaza uno existente.

### Felicitación quincenal por pases personales

El Worker `sicip-notificaciones` revisa el día 1 y el 16, desde las 09:00 de `America/Mazatlan`, la quincena inmediatamente anterior. Recorre por lotes a los trabajadores inscritos en Inicio antes del cierre y presentes en el padrón vigente. Consulta los pases centrales y heredados; no cuentan médicos, oficiales ni cancelados. Las licencias e incidencias no forman parte de esta felicitación y no alteran la puntuación de Aura. Una fuente fallida o incompleta impide asumir cero pases y se reintenta durante esa jornada, sin bloquear las demás matrículas.

Cada reconocimiento usa una clave única por matrícula/quincena. Queda en las notificaciones del trabajador y el despachador existente lo envía a sus correos verificados y dispositivos suscritos. No requiere sesión abierta. No se crean trámites ni se modifican pases. Probar únicamente con datos y transportes sintéticos; no disparar el cron manualmente en producción para verificarlo.

### Resumen semanal para jefes de servicio

Cada lunes desde las 09:00 de Baja California Sur, el Worker recorre las cuentas activas de rol JEFE_SERVICIO con paginación y envía un resumen único por jefe/semana anterior (lunes a domingo, según fecha del pase). Consulta D1 y los pases heredados, sin duplicar folios, y atribuye por jefeMatricula, nunca por creador ni por nombre. Excluye médicos, oficiales y cancelados. Distingue recibidos por Personal de pendientes: seleccionar firmante no acredita firma ni autorización electrónica. La cuenta recibe incluso el resumen en cero; los fallos de fuente se reintentan el mismo lunes y no se interpretan como cero. El aviso permanece en plataforma, usa los correos verificados y suscripciones push existentes y no contiene datos individuales de trabajadores. No requiere cambios de roles ni permisos.
