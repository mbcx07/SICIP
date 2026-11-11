# Inicio, instalación y Aura Laboral central

Inicio reemplaza la pantalla React anterior, en lugar de taparla con otra versión después de cargar. Se desactivan las superposiciones locales de Inicio y Aura. Los indicadores se consultan por la matrícula autenticada en `/api/inicio`, con solicitudes de las fuentes centrales y anteriores, recibos, faltas y avisos. El conteo de no leídos utiliza la misma tabla que la campana; ambos reciben los cambios mediante un evento compartido. Las solicitudes elaboradas por jefatura o Personal para la matrícula también aparecen. Los acuses de un mismo folio no se cuentan como una segunda solicitud.

El tablero muestra actividad mensual/anual, pendientes, entregas, avisos y Aura. Mis trámites ofrece búsqueda de folio/texto, tipo, estado, entrega y fechas. Ante una consulta incompleta se muestra qué fuente falta y no se certifica una quincena sin incidencias.

La instalación conserva `beforeinstallprompt` y llama a `prompt()` directamente desde el clic. Aceptar el diálogo no se presenta como instalación terminada: se espera `appinstalled`. El anuncio se integra en Inicio, no se repite sobre los módulos ni dentro de iframes. Safari/iOS y navegadores que no proporcionan el diálogo reciben una explicación accionable de la limitación. No se puede abrir por código el menú Compartir de Apple. Las actualizaciones no fuerzan recargas al aparecer un nuevo service worker.

## Reconocimiento por quincena

Aura ya no depende de puntos manipulables en localStorage. Conserva la escala de 420 puntos por quincena y 100 puntos por nivel, con un máximo de 100 niveles anuales. Se reducen 84 puntos por pase personal, licencia personal, incapacidad por enfermedad general o riesgo de trabajo, o falta injustificada registrada, hasta cero; no se usan puntos negativos. Pases oficiales/médicos y licencias o incapacidades por maternidad no reducen Aura. Los borradores y cancelaciones no cuentan como solicitudes.

La incorporación empieza el día de la primera consulta de Inicio; sólo se reconocen quincenas completas cuyo inicio sea igual o posterior a esa fecha. No se inventan puntos retroactivos a partir de la falta de registros históricos. Las copias locales anteriores se conservan, pero no se aceptan como puntos verificados.

El worker programado de notificaciones revisa participantes por lotes y vuelve a intentar las fuentes que fallen. El resultado se guarda una vez por matrícula y quincena y puede corregirse si cambian los registros. Los correos y notificaciones se identifican por quincena/nivel para no duplicarlos al reintentar. Los avisos usan la misma cola de correo verificado y Web Push existente. Los popups tienen su propio acuse: cerrar un popup no borra la notificación ni cambia su estado de lectura en la campana. Los puntos no constituyen evaluación laboral, autorización de pago ni certificación de asistencia.

Las faltas nuevas de Control de Faltas se guardan primero en el servidor y se muestran sólo tras la confirmación. Los registros anteriores se consultan en línea desde Firestore por matrícula. Las licencias se identifican en los trámites y recepciones existentes. No se interpreta una falla de consulta como ausencia de incidencias.

## Información sobre prestaciones

Los avisos educativos se apoyan en el CCT 2025–2027: cláusula 47 (servicio efectivo y vacaciones), 107 (aguinaldo proporcional y protección de enfermedad/maternidad) y 144 (fondo de ahorro proporcional al tiempo laborado). La pantalla no calcula descuentos ni declara una pérdida automática del periodo vacacional; remite la validación de régimen, incidencias, antigüedad y vencimiento a Personal. Estatuto y otras contrataciones pueden tener reglas distintas.

Verificación: pruebas de fechas, puntaje, fuentes incompletas, privacidad por matrícula, no duplicación de avisos, correo/push en cola y acuse de popups. Navegador con respuestas lentas: no aparece la capa anterior, el contador coincide, se genera un nivel real, el popup se presenta una vez, el botón invoca la instalación nativa y el historial filtra correctamente. Escritorio y móvil sin desbordamientos.


## Actualización 5.44.0

La ayuda de instalación incluye Windows, Android y iPhone/iPad. Se conserva sólo la señal de instalación del navegador, sin datos personales: `appinstalled`, modo standalone o aplicación relacionada; aceptar el diálogo no equivale a instalar. Si el navegador vuelve a ofrecer instalación, se limpia la señal anterior. No todos los navegadores permiten consultar aplicaciones instaladas desde una pestaña.

Cada compilación tiene una huella en `sicip-version.json`, sin caché. Al iniciar, si la página es anterior y no se ha editado un formulario, se actualiza automáticamente una vez. Con la aplicación abierta se consulta cada minuto y al recuperar visibilidad o conexión; una versión diferente presenta Actualizar ahora. Activar el service worker y recargar elimina el aviso al coincidir la huella. La espera del service worker conserva la captura actual hasta pulsar el botón. El guardado de trámites sigue siendo central.
