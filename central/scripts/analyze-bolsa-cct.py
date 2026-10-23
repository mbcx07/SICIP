#!/usr/bin/env python3
"""Transcribe selected rules from supplied PDFs, preserving contradictions.
Usage: analyze-bolsa-cct.py output.json bolsa.pdf cct.pdf
No VBA, embedded actions or instructions are executed. Requires PyMuPDF.
"""
import hashlib,json,sys
from pathlib import Path
import fitz

def extract(bolsa_path,cct_path):
    bolsa=fitz.open(bolsa_path);cct=fitz.open(cct_path)
    def src(path,doc,clave,titulo,**other):return {'clave':clave,'titulo':titulo,'paginas':len(doc),'sha256':hashlib.sha256(Path(path).read_bytes()).hexdigest(),**other}
    def ref(page,numeral,**other):return {'fuente':'1A75-003-010','pagina':page,'numeral':numeral,**other}
    # Verify anchors against text before exporting the manually reviewed tables.
    assert '13 (Cubre Descansos)' in bolsa[143].get_text(sort=True)
    assert '13 Cubre' in bolsa[198].get_text(sort=True) and 'Vacaciones' in bolsa[198].get_text(sort=True)
    assert '16 días hábiles' in ' '.join(cct[36].get_text().split())
    assert 'Cláusula 136.- Vigencia' in cct[71].get_text()
    motivos=['Plaza vacante de base con presupuesto','Vacaciones, cuando no existan plazas cubre-vacaciones que cubran este ausentismo','Incapacidad por Riesgo de Trabajo','Incapacidad por Maternidad','Incapacidad por Enfermedad General','Licencia sin Sueldo','Licencia con Sueldo','Beca con Sueldo','Beca sin Sueldo','Falta injustificada','Suspensión Temporal','Nivelación a Plaza Superior','Personal docente área médica','Cláusula 7 del CCT','6º y 7º día','Contingencia','Jornadas Especiales Plaza Cero 0 (requiere autorización especial)','Comisiones Especiales (Programa IMSS-BIENESTAR)','Día de descanso obligatorio','Comisiones Cláusula 42 CCT (únicamente incisos H, I, J)']
    return {'estado':'REFERENCIA_DOCUMENTAL_NO_PUBLICADA','fuentes':[src(bolsa_path,bolsa,'1A75-003-010','Procedimiento para la operación de bolsa de trabajo',registro_portada='2024-06-07'),src(cct_path,cct,'CCT-2025-2027','Contrato Colectivo de Trabajo 2025–2027',vigencia_desde='2025-10-16',vigencia_hasta=None,referencia_vigencia={'clausula':'136','pagina':72},advertencia='La cláusula indica vigencia indefinida y revisión; no se deduce caducidad el 15/10/2027 ni vigencia inmutable de cada importe.')],
    'tipos_plaza':[{'clave':'11','descripcion':'Plazas Operativas',**ref(199,'1.5.5 a, Anexo 3')}, {'clave':'13','descripcion':'Cubre Descansos','estado':'CONFLICTO_DOCUMENTAL',**ref(144,'1.3.2, Anexo 3')}, {'clave':'13','descripcion':'Cubre Vacaciones','estado':'CONFLICTO_DOCUMENTAL',**ref(199,'1.5.5 a, Anexo 3')}, {'clave':'14','descripcion':'Cubre Vacaciones','estado':'CONFLICTO_DOCUMENTAL',**ref(144,'1.3.2, Anexo 3')}, {'clave':'14','descripcion':'Cubre Descansos','estado':'CONFLICTO_DOCUMENTAL',**ref(199,'1.5.5 a, Anexo 3')}],
    'motivos_sustitucion':[{'clave':str(i),'descripcion':desc,**ref(20,'5.2.54')} for i,desc in enumerate(motivos,1)],
    'conceptos':[{'clave':'008','descripcion':'Sueldo de Sustituto','regimen':'BOLSA_TRABAJO_CON_REQUISITOS',**ref(19,'5.2.54; lista en p.20')}],
    'status_contextuales':[{'clave':'2','descripcion':'Inactivo','contexto':'Maestro de Empleados afectado por baja de candidato de Bolsa con clave 17 o 18; distinto de eliminar sólo el registro BT',**ref(136,'1.2.2–1.2.3, Anexo 3')}],
    'cct':{'ambito':'CCT; no trasladar automáticamente al régimen de Estatuto','vacaciones':{'clausula':'47','paginas':[37,38,39,40],'minimo_anual_texto':16,'aumento_anual_texto':1,'tope_texto':20,'maximo_fracciones':2,'advertencia':'Transcripción de la opción normal; no calcula todas las opciones ni resuelve por sí sola la transitoria 3a y la LFT. No sumar automáticamente ayuda y segundo periodo.',
    'radiaciones_periodos':[{'antiguedad_anios':i,'periodos':days} for i,days in enumerate([[7,8,7],[8,8,8],[8,9,8],[9,9,9],[9,10,9],[10,10,10]])],'radiaciones_ultimo_tramo':'5 y más años',
    'ayuda_normal':[{'antiguedad_anios':i,'dias_salario':n} for i,n in enumerate([23,25,27,29,31],1)],'ayuda_normal_ultimo_tramo':'5 y más años','ayuda_cuatrimestral_texto':[{'tramo':s,'dias_salario':n} for s,n in [('Hasta 1',8),('1 a 2',9),('2 a 3',10),('3 a 4',11),('4 a 5',12),('5 y más',13)]],'limites_tramos_cuatrimestrales':'Se conservan literalmente sin inferir inclusividad de extremos.',
    'prima_tasa':0.25,'pagos_quincena':'PREVIA_AL_DISFRUTE',
    'opciones_extra_20':[{'tipo':'DISFRUTE_CON_AYUDA','dias_disfrute':10,'dias_salario_ayuda':10},{'tipo':'TRABAJO_CON_AYUDA','dias_disfrute':0,'dias_salario_ayuda':30},{'tipo':'TRABAJO_REDUCCION_JUBILACION','dias_disfrute':0,'dias_reduccion_jubilacion':30},{'tipo':'DISFRUTE_SIN_AYUDA','dias_disfrute':15,'dias_salario_ayuda':0}],
    'opcion_segundo_periodo':{'maximo_dias':15,'condicion':'Optar por no recibir ayuda; primer periodo no fraccionable'},'temporales':{'pagina':40,'dias_servicio_texto':365,'forma_textual':'en forma interrumpida','advertencia':'No convertir automáticamente a 365 consecutivos; conciliar contratos y antigüedad efectiva.'}},
    'descansos':{'clausula':'46','paginas':[36,37],'semanales':'Dos días consecutivos fijos; pueden ser distintos a sábado y domingo por acuerdo','prima_dominical':0.25,'obligatorios_texto':['1 enero','Primer lunes de febrero','Tercer lunes de marzo','1 mayo','10 mayo','15 septiembre','16 septiembre','Tercer lunes de noviembre','25 diciembre','Jueves, viernes y sábado de Semana Mayor o Primavera','Jornada electoral según leyes federales/locales','1 octubre cada seis años cuando corresponda transmisión del Poder Ejecutivo Federal']},
    'nivelacion':{'clausula':'27','paginas':[27,28],'vacante_mas_30_dias':'Poner a disposición de Comisión/Subcomisión competente para dictamen','cobertura_provisional':'Base, inmediata inferior y mismo centro, preferentemente mayor antigüedad; exclusión indicada de quienes estén a dos años o menos de derechos de jubilación/pensión descritos','no_genera':'Derechos escalafonarios ni de nivelación sólo por desempeñar labores superiores'},
    'extra_y_guardias':{'clausulas':['32','33','34','35','36','37','45'],'paginas':[30,31,36],'ordinario_extra_hasta_9_semanales_incremento':1.0,'ordinario_extra_excedente_9_semanales_incremento':2.0,'incrementos_fuente':'Cláusula 37, p.31: 100% más y 200% más, respectivamente; pago de exceso no equivale a autorización para exceder límites.','redondeo_texto':'Menos de 30 minutos se computa media hora; excedente de 30 y menor de 60 se computa una hora','descanso_semanal_salario_total':3,'descanso_obligatorio_salario_total':3,'coincidencia_descanso_obligatorio_y_semanal_salario_total':4,'advertencia':'Son salarios totales descritos, no factores para sumar ciegamente sobre nómina pagada. Distinguir ordinario/extraordinario, unidades, fracciones y supuesto.'},
    'tabulador':{'paginas':[91,92,93,94,95,96,97,98,99,100,101,102],'tipo':'Sueldos base y rama/escalafón; no salario integrado completo','politica':'Conservar fuente, categoría, jornada y vigencia. No sustituir automáticamente tabuladores publicados por quincena ni asumir que un único importe cubre todas las revisiones futuras.'},
    'transitoria_3a':{'pagina':80,'efecto_texto':'Disposiciones contractuales inferiores a la LFT se sustituyen por ésta','automatizacion':'No usar tope literal de tabla aislada como decisión jurídica universal.'}}}

if __name__=='__main__':
    result=extract(sys.argv[2],sys.argv[3]);Path(sys.argv[1]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'fuentes':len(result['fuentes']),'tp_referencias':len(result['tipos_plaza']),'motivos':len(result['motivos_sustitucion'])}))
