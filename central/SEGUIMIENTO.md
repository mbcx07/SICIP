# Menú, nombres y seguimiento · 5.26.0

El menú retira Reportes y su enlace duplicado de estadísticas. Solicitudes queda junto a Mis trámites en el grupo personal. Después aparecen las funciones de Jefe de Servicio, Departamento de Personal y, al final, Administración. El orden visual se aplica a los contenedores del menú, conservando los controladores de cada módulo.

Mis trámites utiliza una consulta autenticada por matrícula; no recibe una matrícula elegida por el navegador. Incluye:

- Coberturas D1 donde la persona sea suplente o titular, independientemente de quién creó el registro. Se conservan tipo, folio, periodo, quincena y estado.
- Trámites de Firestore por `trabajadorMatricula`.
- Recepciones de documentos por `trabajadorMatricula`, con folio y fecha de entrega.
- Solicitudes de currículum / postulaciones por `trabajadorMatricula`.
- Pases centrales D1 y pases anteriores disponibles en Firestore por `matricula`.

Las fuentes se consultan de forma independiente. Una falla se informa sin eliminar los resultados de las demás. Las consultas Firestore muestran hasta 1000 documentos por fuente e informan si se alcanza ese límite. No se deduce recepción sólo por compartir matrícula: el acuse de una solicitud se relaciona por folio o por un evento de recepción específico. Entrega, autorización y pago son estados diferentes; una cobertura sin registro de pago no se presenta como pagada.

Personal dispone de Registrar entrega a Personal en la cobertura enviada/autorizada. Esta acción registra un evento RECIBIR idempotente y auditado; no cambia el presupuesto, autoriza ni registra pago. Recepciones conserva su registro Firestore y además actualiza el seguimiento del folio central cuando corresponde. La cámara y la búsqueda manual resuelven el folio central en otros equipos.

Los pases nuevos se registran en D1 antes de guardarlos localmente e imprimirlos. El registro limita al trabajador a su matrícula; Personal confirma recepción. Los cambios de estado comprueban el estado anterior para evitar sobrescribir una recepción concurrente. Los datos de un pase existente no se sustituyen con un cuerpo de reintento. El historial local sigue disponible como respaldo.

Un pase anterior con folio largo recibe un alias corto estable `P-000123` al sincronizarlo o reimprimirlo. El identificador original se conserva; ambos resuelven el mismo registro. Las reservas comparten el consecutivo global, sin contadores por navegador. La impresión utiliza el alias y un QR de 17 mm que sólo contiene el folio. El espacio reservado al QR es de 21 mm, reduciendo su proporción anterior.

Los registros antiguos que sólo existen en un navegador deben abrirse en ese equipo para poder sincronizarlos; el servidor no puede recuperar un almacenamiento local al que no tiene acceso. Mis trámites sincroniza los pases propios pendientes de migración y conserva una copia `sicip_pases_pre_sync_v1`. Un antecedente local de recibido sin acuse verificable no basta para marcarlo recibido en servidor; se conserva como antecedente local y Personal puede confirmar la entrega. No se borra el folio original ni el respaldo existente.

La presentación de nombres usa los separadores oficiales `apellido paterno/apellido materno/nombres` para mostrarlos como nombres y apellidos, incluyendo apellidos compuestos. Se conserva el padrón original. Las cuentas toman su nombre de presentación del padrón cuando existe la matrícula. Las pantallas, encabezado, Inicio y formatos aplican esta presentación. Los nombres sin separadores no se reordenan adivinando; cuando coinciden con una forma original conocida del padrón se usa su forma estructurada. El caso de cuatro segmentos del padrón contiene dos nombres separados y se presenta conservando ambos nombres. Los tres registros sin separadores y con abreviaturas se conservan sin inventar nombres completos.

Verificación: pruebas API en `seguimiento.test.mjs`, recorrido entre tres cuentas/navegadores en `seguimiento-browser.py`, PDF y QR en `pases-browser.py`, y regresiones de coberturas y navegación. Todas las cuentas y escrituras de prueba son locales y sintéticas. El servidor local intercepta las consultas Firestore de las pruebas.
