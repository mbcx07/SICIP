# SICIP 5.23.1 · Base central por quincena

La base de personas y plazas se guarda en Cloudflare D1 (`sicip-central`, binding `DB`). Los módulos leen un corte completo e inmutable mediante la misma sesión. Las cargas se guardan como borrador, se validan y después se activan; activar otro corte no borra usuarios, pases, trámites ni resultados anteriores.

## Uso en la aplicación

1. Iniciar sesión con la matrícula y contraseña existentes. La primera vez tras actualizar se requiere volver a iniciar sesión; no borrar los datos del navegador.
2. Abrir **Administración → Control de personal y plazas** en el menú.
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

Cuadros conserva los cambios pendientes y la búsqueda tanto en asignación administrativa como en Mi Cuadro. Solicitudes y Jefe de Servicio vuelven a enlazar contratación y los demás formularios. El administrador recibe todos los permisos efectivos sin cambiar el perfil de otras cuentas. Plantilla en Administración dirige a la misma base central y se retira la carga Seed BD de esa pantalla.

La postulación de confianza exige un PDF de hasta 1 MB. Se conserva el archivo real, por lotes, en D1; la descarga requiere sesión y permiso de propietario, jefe destinatario, administrador o Personal. La solicitud y su aviso se guardan en Firestore. Un fallo devuelve un mensaje y habilita reintentar; el identificador del envío es estable para el mismo adjunto y destino. Las solicitudes recibidas se consultan al abrir el cuadro, sin depender del JSON estático anterior. No se migran automáticamente las referencias antiguas que nunca contenían un archivo.

Para recepción QR, `_headers` permite cámara sólo al propio sitio. El lector jsQR 1.4.0 (Apache-2.0) se sirve localmente, sin depender del CDN. Se manejan denegación de permiso, cancelación durante apertura y lectura de QR invertidos. El permiso del navegador y una cámara disponible siguen siendo necesarios.

Las lecturas de un corte inmutable usan páginas de 1,000 y solicitudes en paralelo; se verifican conteos y claves. Se eliminan las esperas artificiales de seis segundos y la consulta serial por cada jefe. La primera carga y los movimientos remotos siguen dependiendo de la red.

La regresión de interfaz se ejecuta con `npm run test:ux` contra el harness local; requiere Chromium, Playwright para Python y ffmpeg. Incluye un QR sintético en `tests/fixtures/`, genera una cámara simulada y verifica lectura, selección inmediata en ambos cuadros, currículum obligatorio, recuperación de errores y desplazamientos.
