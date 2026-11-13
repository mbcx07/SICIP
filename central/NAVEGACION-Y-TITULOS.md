# Navegación y títulos · 5.53.0

La visibilidad del menú pertenece al estado React del shell (`data-menu-open`). Escritorio inicia abierto; el botón lo oculta completamente y el espacio de trabajo ocupa el ancho disponible. En móvil es un panel sobre el espacio de trabajo, debajo del encabezado, con desplazamiento propio. Al elegir un destino se cierra; expandir un grupo mantiene el menú abierto. Los cambios de ruta no cierran el menú de escritorio.

El shell ocupa `100dvh` con dos filas: encabezado sin desplazamiento y cuerpo flexible. El menú y el contenido tienen `min-height:0` y su propio scroll. Las sombras, paneles y iframes quedan debajo del encabezado. En móvil el encabezado ocupa una sola fila de 60px, oculta nombre/rol y mantiene menú, marca, perfil, avisos y salida. El perfil continúa disponible por su icono; las etiquetas accesibles se conservan frente al reparador heredado.

`module-headings.css/js` reemplaza el transformador anterior que convertía múltiples H2 y contenedores en heroes, cambiando incluso sus títulos. El nuevo controlador conserva textos y nodos React, identifica el encabezado del módulo visible y aplica tipografía, fondo y espaciado comunes. No mueve formularios ni encabezados fuera de sus padres React. No interviene documentos impresos ni diálogos. La marca S queda en el shell y login; se retiran las inserciones en títulos independientes y visor de pases.

Pases declara el ámbito en el primer script del documento y mantiene la captura oculta hasta completar su preparación. El estado de carga identifica Personal desde el principio; no se muestra el formulario del trabajador durante la espera. Conserva los límites de datos por matrícula/unidad y la distinción de permisos. El iframe sigue creciendo para que el desplazamiento del área de trabajo no se recorte.

El login presenta Instituto Mexicano del Seguro Social y OOAD Baja California Sur en dos líneas independientes, tanto en escritorio como en móvil.

Validación: `tests/navigation-browser.py` con perfiles sintéticos, menú de escritorio/ancho recuperado, scroll en ambas direcciones del menú móvil, barra fija al desplazar contenido, carga lenta de Pases sin vista errónea, Vacaciones/Normativas/Herramientas con estilo común y perfil accesible. Comprobación adicional de Faltas, Reclamaciones, Recepciones y Exámenes. No modifica datos ni reglas de negocio.
