# Contratación y coberturas · 5.24.0

El archivo original `PROGRAMA DE CONTRATACION HGZ+MF No1.xlsm` se analizó como ZIP/XML y se extrajo su VBA de manera estática, sin ejecutar macros. El catálogo público conserva el SHA-256 de la fuente, 263 horarios y 17 motivos; no contiene sus trabajadores, salarios ni registros históricos.

CAPTURA aporta titular (B5), suplente (B13), tipo/motivo (B6/C6), periodos (B9:D10), horario (B18), descansos (B19), jornadas (H17), horas diarias (I17) e indicadores de infectocontagiosidad y emanaciones (D22:D23). CATEHOR aporta los horarios. La restricción de cobertura de vacaciones base corresponde a tipo de plaza 14, según Hoja2 y las macros COBER/COBERTURA; no corresponde al tipo de contratación del trabajador.

La columna de descansos consultada por el archivo está vacía. Por ello la captura obliga a confirmar descansos y permite revisar cada fecha del calendario. No se deducen descansos de una matrícula ni de un horario nocturno. Las jornadas y horas representan la cobertura solicitada, no una liquidación salarial.

Se detectaron 17 fórmulas con referencias rotas en CONTRATO y tabuladores antiguos. No se importan esos cálculos ni se sustituyen los padrones actuales con los del archivo. Los formatos de solicitud siguen las claves 7110-009-003 (sustitución/nivelación) y 1A12-009-003 (conceptos extraordinarios); no generan un contrato laboral definitivo ni calculan remuneraciones.

Jefe de Servicio → Contratación y coberturas permite Contrato, Tiempo extra, Nivelación y Guardia festiva, con titular/plaza, suplente, motivo, periodo, horario, descansos y calendario. Departamento de Personal → Bandeja de coberturas permite revisar y autorizar/devolver. Administración dispone de ambos accesos.

Los borradores se guardan en D1. Cada solicitud conserva el corte y una copia mínima de personas/plaza, calendario y versión de reglas. Enviar requiere completar y validar la captura. Los cambios de estado y comentarios quedan auditados; se impiden modificaciones por versiones concurrentes. Los jefes consultan sus solicitudes; Personal, Fuerza de Trabajo y Administración pueden revisar la bandeja. Las escrituras revalidan la cuenta vigente en servidor. No se mandan mensajes externos.

Una solicitud de un corte anterior se consulta sin alterar su contexto y puede copiarse al corte actual para revisarla. Los registros existentes de pases y otros trámites no se migran ni eliminan. CSV exporta los registros cargados y la impresión incluye estado, folio corto, calendario y firmas.

Validación: `npm test --prefix central`; `python3 central/tests/contratacion-browser.py` contra el servidor local de pruebas. El extractor reproducible es `central/scripts/extract-contratacion.py`; el archivo fuente y los análisis con información personal se mantienen fuera del repositorio.
