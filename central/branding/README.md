# Identidad SICIP · 5.51.0

S verde/dorada con circuitos elegida por el usuario el 13/11/2026. Se prepararon mediante edición de imagen un icono cuadrado y un emblema con fondo transparente. Fuentes conservadas en este directorio; los originales generados permanecen en `/workspace/generated_images` en el entorno de trabajo.

`icons/` contiene exportaciones para instalación (192/512 px), Android maskable con margen adicional, Apple touch 180 px, favicon PNG/ICO, insignia monocroma de notificaciones, símbolo transparente y marca horizontal. El manifiesto mantiene `id`, `scope` y `start_url` para conservar la identidad de las instalaciones existentes y utiliza rutas nuevas para los iconos. La actualización del icono ya instalado la administra el navegador/sistema operativo y puede ser diferida.

`brand_patch.py` aplica estos recursos a login, encabezado, módulos independientes, favicon, Apple touch y notificaciones. Los emblemas oficiales IMSS de formatos y documentos permanecen en su lugar. El nuevo logo no altera áreas de firmas, QR ni geometría de impresión. El hash de versión incluye recursos gráficos y manifiesto, además del código.

Validación visual: `tests/branding-browser.py` comprueba login en escritorio y móvil, encabezado sin desbordamiento horizontal, módulos independientes, favicon e iconos del manifiesto. No cambia reglas de negocio ni datos centrales.
