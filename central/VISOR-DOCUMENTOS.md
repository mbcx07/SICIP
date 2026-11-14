# Documentos en celular — 5.59.0

Los formatos HTML de vacaciones, PECV, coberturas, PD44, herramientas, Historial y Control de Faltas comparten un visor. La vista previa respeta las proporciones de una hoja vertical u horizontal, se adapta al ancho disponible y conserva controles de impresión y cierre fuera del documento. Al imprimir se elimina la escala de pantalla y se conservan las reglas originales del formato.

El pase muestra una imagen de su PDF generado, sin depender del soporte de PDF incrustado del teléfono. Ofrece enlaces explícitos para abrir/imprimir y descargar el archivo. La apertura se produce mediante un enlace pulsado por el usuario, evitando ventanas abiertas después de una operación asíncrona. El PDF conserva una hoja carta y las dimensiones anteriores.

Validación: navegador Chromium a 360, 390 y 1280 píxeles, VAC06 y PECV reales con datos sintéticos, generación y descarga real del PDF del pase, controles accesibles, cierre, proporciones y orientación de impresión; regresión de Historial y suite de 242 pruebas. La impresión física depende de los servicios de impresión disponibles en el dispositivo; no se verificó hardware Android/iOS.
