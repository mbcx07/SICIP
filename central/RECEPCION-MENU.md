# Recepción en Departamento de Personal — 5.64.0

El acceso se muestra como «Recepción de documentos · QR y manual» dentro de Departamento de Personal. Conserva el permiso `personal.recepcion` y abre el módulo existente con sus tres métodos: escaneo QR, búsqueda por folio y registro manual.

La limpieza del menú antiguo ocultaba botones por su texto, incluyendo botones operativos del propio menú de Personal. Ahora excluye ese menú de la limpieza y asigna al acceso su permiso explícito, evitando depender de la etiqueta visible o del icono.

Pruebas de navegador en celular y escritorio: acceso visible después de los ciclos de limpieza, apertura, búsqueda central de folio, formulario manual con catálogo y apertura/cierre del escáner. Se verifica además el acceso de Área de Personal con permiso explícito y la restricción de menú y consulta de documentos para un trabajador sin permiso. Las pruebas usan cuentas y datos sintéticos; no crean recepciones en producción.
