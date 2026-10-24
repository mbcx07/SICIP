# Solicitud personal PECV

Disponible en Solicitudes → Permiso a cuenta de vacaciones · PECV. Recupera exclusivamente la matrícula de la sesión, sus programaciones autorizadas, periodo SIAP, datos laborales y firmantes. Sin rol disponible indica acudir al Departamento de Personal para iniciar la programación; sin periodo SIAP solicita completar los datos en Personal.

El trabajador elige fechas anteriores al disfrute, dentro del saldo normativo. La solicitud se guarda ENVIADA, aparece en Mis trámites y no descuenta días hasta la autorización de Personal. La certificación guarda al actor real del servidor; no puede enviarla el trabajador. La consulta se actualiza cada diez segundos conservando la captura en curso. No se guarda información operativa en almacenamiento local.

La impresión reproduce el formato 1A74-009-021 del archivo PECV normado 2024.xlsx, en una página carta, con logo original, folio y QR de 10 mm. La huella del archivo fuente se conserva en src/pecv-formato.json. Los espacios de certificación permanecen pendientes hasta que Personal certifica; las firmas físicas quedan en blanco. Personal puede imprimir el mismo formato desde su registro.

Validación: pruebas de API y plantilla, flujo navegador con trabajador y Personal, idempotencia, permisos por matrícula, certificación, autorización, descuento, impresión carta, QR legible y pantalla móvil. Los datos usados para estas pruebas son sintéticos.
