TASK: Construye la aplicación "Calculadora de Nivelación" completa y funcional para SICIP.

CONTEXTO CRÍTICO:
- Los datos del Excel ya fueron procesados y exportados a JSON en estos archivos:
  - /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/fuerza-trabajo/tabulador.json (lookup por puesto, ~100KB)
  - /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/fuerza-trabajo/escalafon.json (lookup por puesto, ~15KB)
  - /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/fuerza-trabajo/antparams.json (array ~1KB)
  - /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/data-ft-trabajadores.json (12,300 workers)
  - /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/data-ft-antiguedad.json (7,253 records)
  - /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/data-ft-clasificacion.json (4,986 records)

- Firestore project: sicip-bcs, API Key: AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8
- Reglas Firestore: allow read, write: if true

ENTREGABLES (todos dentro de /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/fuerza-trabajo/):

1. calculadora-nivelacion.html — ARCHIVO PRINCIPAL. Aplicación monolítica HTML+CSS+JS.
   DEBE INCLUIR todo en un solo archivo (excepto datos externos que carga vía fetch).

   Lógica de cálculo COMPLETA (replicando el Excel Nivelacion_Base):
   
   Dado un puesto_sustituto y puesto_nivelar (códigos numéricos de categoría):
   
   a) Buscar en tabulador (por puesto) los siguientes conceptos para CADA uno:
      - 01/02 = sueldo_nuevo
      - 011 = c011
      - 013 = c013
      - 014 = c014
      - 015 = c015
      - 054 = c054
      - 057 = c057
      - 058 = c058
      - 061 = c061
      - 064 = c064
   
   b) Calcular 022 (prima de antigüedad) para CADA uno:
      - lookup años desde antiguedad (por matrícula)
      - lookup días de sueldo desde antparams table (buscar por años)
      - 022 = ((01/02 + 011 + 013 + 057 + 058 + 061) / 360) * dias_sueldo
      - Si no hay años registrados, 022 = 0
   
   c) Calcular totales:
      - total_sustituto = suma de todos sus conceptos
      - total_nivelar = suma de todos sus conceptos
      - diferencia = total_nivelar - total_sustituto
   
   d) Validaciones:
      - MISMA_RAMA: si rama_esc de ambos coincide
      - CATEGORIA_UNICA: si rama_esc_nivelar == "CUT"
      - DIFERENTE_RAMA: si no coincide
      - CATEGORIA_INMEDIATA_SUPERIOR: si esc_nivelar == esc_sustituto + 1 AND misma rama
      - NO_INMEDIATA: en otro caso
   
   e) Importe final:
      - importe = (diferencia / 15) * (dias * factor)
      - factor seleccionable: 1.4, 2.33, 3.5
   
   CORRECCIÓN CRÍTICA: En el Excel original, algunos conceptos del "A NIVELAR" usaban el puesto del sustituto por error. En la web:
   - Todos los conceptos SUSTITUTO se buscan con puesto_sustituto
   - Todos los conceptos NIVELAR se buscan con puesto_nivelar
   (No hay excepciones)

   Carga de datos:
   - Los catálogos pequeños: fetch('./tabulador.json'), fetch('./escalafon.json'), fetch('./antparams.json')
   - Los datos grandes (trabajadores y antigüedad): cargar desde Firestore REST API:
     (primera vez, si está vacío, usar los JSON files y subirlos a Firestore)
     GET https://firestore.googleapis.com/v1/projects/sicip-bcs/databases/(default)/documents/ft_trabajadores?key=AIzaSyCBs_vl7IZ98Cr-Hs3VdVuDJyKPZetfOW8
   - Usar sesionStorage para cachear datos cargados

   Excel Upload:
   - Cargar SheetJS desde CDN: https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js
   - Detectar hojas por nombre parcial (Matriculas*, antiguedad*, tabulador*, Escalafon*, clasificacion*)
   - Validar columnas requeridas
   - Subir lotes de 500 documentos a Firestore usando REST API (POST /documents con batch commit)
   - Registrar la carga en ft_cargas_quincena

   Historial:
   - Guardar cálculos en ft_calculos_nivelacion (Firestore)
   - Consultar por: matrícula, quincena, fecha, usuario, categoría

   PDF: usar jsPDF CDN para exportar

   ROLES (integrar con SICIP sessionStorage 'sicip_usuario'):
   - ADMIN (del SICIP) → acceso completo
   - FUERZA_TRABAJO → capturista (calcula, guarda, ve historial, exporta)
   - OTROS → solo consulta (ver reportes)

   DISEÑO:
   - IMSS-green (#005235) theme
   - Sidebar izquierdo fijo
   - Cards con sombras
   - Tabla comparativa lado a lado (Sustituto | A Nivelar)
   - Validaciones: verde ✓, rojo ✗, amarillo ⚠️
   - Responsive

2. INSTALACION.md — Instrucciones completas de instalación y despliegue
3. ESTRUCTURA.md — Diagrama de carpetas, colecciones Firestore, flujo de datos

IMPORTANTE: La app debe ser FULLY FUNCTIONAL. No código placeholder. Todas las búsquedas, cálculos, validaciones, guardado, exportación deben funcionar.

El archivo calculadora-nivelacion.html se escribe en /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/fuerza-trabajo/calculadora-nivelacion.html
Los docs se escriben en /home/ubuntu/.openclaw/workspace/memory/sicip-deployed/fuerza-trabajo/

NO salgas del directorio de trabajo especificado.