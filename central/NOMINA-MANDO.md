# Nómina de Mando · 5.49.0

Fuente federal complementaria al padrón ordinario. Importar únicamente la hoja `mando`, con matrícula válida; excluir vacantes sin matrícula/0 y la hoja histórica BAJAS. No crear plazas ordinarias a partir de números de plaza federales: pertenecen a un universo diferente.

`normalize-mando.mjs` normaliza nombres y fechas y conserva RFC/CURP/NSS sólo en `privado`. Revisar el orden de nombres de las filas que vienen nombres/apellidos y pasarlas como cuarto argumento (matrículas separadas por coma). La mayoría viene apellidos/nombres; admite apellidos compuestos como DE LA TOBA. No deducir régimen de Estatuto/CCT ni códigos TC/status/baja a partir de títulos de mando. La fecha de ingreso es una referencia de origen, no certificación de antigüedad efectiva DP.

Tablas `nomina_mando_fuentes`, `nomina_mando_historial` y `nomina_mando` conservan procedencia y versiones. `mando.py` respalda cuentas y asignaciones en un directorio privado fuera del repositorio, clona el corte activo y aplica el complemento por matrícula. Conserva todas las plazas y cortes anteriores. La quincena de la nómina ordinaria sigue siendo la original; `nomina_quincena` identifica por separado la de mando.

En registros coincidentes prevalecen nombre, cargo y departamento de mando. Se conservan otros campos ordinarios y su información privada no reemplazada. `cloud.seed` y la validación de nuevos cortes reaplican el complemento vigente, evitando perder mandos en la siguiente actualización. El directorio autenticado expone procedencia y datos laborales básicos, nunca identificadores privados. El catálogo de jefes incluye la nómina de mando aunque no ocupe plaza ordinaria.

Las nuevas cuentas se crean como JEFE_SERVICIO, con Inicio, Mis trámites, Pases, cuadro propio/solicitudes recibidas y funciones de jefe. Inicio con matrícula en ambos campos y cambio obligatorio de contraseña. Las cuentas existentes conservan contraseña; administradores conservan rol y permisos. Para TRABAJADOR/JEFE_SERVICIO se incorporan los accesos de jefe sin borrar accesos explícitos existentes. Los roles de Personal no se degradan. Una cuenta ya deshabilitada no se reactiva implícitamente.

La unidad se obtiene del departamento/cargo de la nómina; usar `--unidades archivo-privado.json` para nombres confirmados por el usuario (matrícula: unidad). Se integra al catálogo de Administración y asignaciones centralizadas que usan pases y otros trámites. No modificar documentos ya generados: conservan su unidad histórica.

Proceso:

1. Normalizar el archivo a JSON privado y revisar conteos/duplicados/nombres/fechas.
2. Aplicar sólo la migración aditiva `sql/mando.sql`.
3. Ejecutar `python3 central/scripts/mando.py normalizado.json --record DIRECTORIO_PRIVADO --unidades UNIDADES.json` para revisar el plan; agregar `--apply` para efectuar la carga.
4. Verificar conteos, invariancia de plazas, roles/contraseñas anteriores, unidad confirmada y búsquedas desde cuenta de trabajador.

Validación: pruebas `mando.test.mjs` y `mando-browser.py` (harness `SICIP_TEST_MANDO=1 SICIP_TEST_ADMIN_ACCOUNTS=1`).
