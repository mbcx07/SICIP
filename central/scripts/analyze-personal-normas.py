#!/usr/bin/env python3
"""Static, field-scoped reference catalog; never executes PDF content.
Usage: python3 analyze-personal-normas.py output.json 1A74-003-023.pdf ...
Requires PyMuPDF. Extracts only selected nonpersonal published catalog tables.
"""
import hashlib,json,re,sys
from pathlib import Path
import fitz

def extract(paths):
    dates={'023':'2024-01-10','037':'2023-12-15','034':'2023-10-27','032':'2024-04-05','031':'2023-10-24','033':'2023-11-22'}
    titles={'023':'Procedimiento para la autorización de guardias','037':'Procedimiento para la autorización de nivelación a plaza superior','034':'Procedimiento para el control de asistencia, puntualidad y sustituciones','032':'Procedimiento para la modificación de horarios institucionales','031':'Procedimiento para la autorización de tiempo extraordinario','033':'Procedimiento para el trámite y operación de bajas, altas y cambios de las trabajadoras o los trabajadores en nómina ordinaria'}
    docs={p.stem:fitz.open(p) for p in paths}
    sources=[{'clave':p.stem,'titulo':titles[p.stem[-3:]],'registro_portada':dates[p.stem[-3:]],'paginas':len(docs[p.stem]),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]
    aps=[]
    for page in [144,145,146]:
        for line in docs['1A74-003-034'][page-1].get_text(sort=True).splitlines():
            m=re.match(r'^\s*([A-Z0-9]{2,3})\s+(.+?)\s*$',line)
            if m and m[1] not in ['APS'] and not m[2].startswith('DE INCIDENCIAS'):
                aps.append({'clave':m[1],'descripcion':m[2].split('Clave:')[0].rstrip(),'pagina':page,'fuente':'1A74-003-034','catalogo':'1A74-008-144','ambito_tabla':'ESTATUTO' if page==146 else 'GENERAL_CCT'})
    schedules=[]
    for page in [36,37]:
        for line in docs['1A74-003-032'][page-1].get_text(sort=True).splitlines():
            m=re.match(r'^\s*([0-9A-Z]{3}E)\s+(.+?)\s+([1-5])\s*$',line)
            if m:schedules.append({'clave':m[1],'descripcion':m[2],'turno':m[3],'pagina':page,'fuente':'1A74-003-032','catalogo':'1A74-008-011','regimen':'ESTATUTO'})
    tc=[{'clave':key,'descripcion':name,'fuente':'1A74-003-031','pagina':5,'numeral':'4.15, nota','apoyo':[{'fuente':'1A74-003-023','pagina':9,'numeral':'5.2.6–5.2.7'},{'fuente':'1A74-003-032','pagina':6,'numeral':'5.2.3'}]} for key,name in [('00','Estatuto de Confianza A'),('01','Confianza'),('02','Base'),('03','Temporal'),('08','Sustituto')]]
    prefixes=[{'prefijo':key,'registros_semanales':n,'descripcion':desc,'fuente':'1A74-003-032','pagina':25,'catalogo':'1A74-008-009'} for key,n,desc in [('B',4,'Cuatro veces a la semana'),('C',3.5,'Cada tercer día o tres días y domingos alternos'),('D',3,'Tres días a la semana'),('E',2.5,'Dos días por semana y domingos alternos'),('F',2,'Dos días a la semana'),('0',5,'Cinco días a la semana')]]
    concepts=[{'clave':key,'descripcion':desc,'regimen':reg,'fuente':src,'pagina':page,'numeral':num} for key,desc,reg,src,page,num in [('35','Guardia festiva','TC_01_02_03_08','1A74-003-023',9,'5.2.6'),('735','Guardia festiva','TC_00','1A74-003-023',9,'5.2.7'),('37','Tiempo extraordinario','TC_01_02_03_08','1A74-003-031',4,'4.5'),('737','Tiempo extraordinario','TC_00','1A74-003-031',4,'4.6'),('10','Nivelación a plaza superior','PERSONAL_BASE_CON_REQUISITOS','1A74-003-037',7,'5.2.5–5.2.10'),('08B','Sustitución en día festivo','SUSTITUTO_CON_AUTORIZACION','1A74-003-023',13,'5.2.31–5.2.33')]]
    exclusive=[{'categorias':['20360280'],'contexto':'MEDICO_FAMILIAR_GENERAL','horarios':['0301','0302','0313','0314','0323','0324','0329'],'pagina':22}, {'categorias':['20360180','20360280','20730180','20730080','20100080'],'contexto':'Para 20360280 sólo Atención Continua; Análisis y Evaluación Salud en el Trabajo','horarios':['0303','0304','0305','0306','0307','0308','0312','0326','0327','0328','D735','D736','D737','E703','F711','F714'],'pagina':22}, {'categorias':['20220080'],'contexto':'ESTOMATOLOGO','horarios':['0309','0310','0311','0321'],'pagina':22}, {'categorias':['22560080','21560080'],'contexto':'QUIMICO_CLINICO_Y_JEFE_SECCION','horarios':['0315','0316','0317','0318','0319','0322','D740','D741','F717'],'pagina':22}, {'categorias':['20360480'],'contexto':'UMF hasta 10 consultorios, consulta externa','horarios':['0123','0160'],'pagina':23}, {'categorias':['20360480'],'contexto':'UMF atención médica continua','horarios':['0123','0459','0160','0225','F702'],'pagina':23}, {'categorias':[],'contexto':'Orientador de iniciación cultural: la tabla no indica clave de categoría','horarios':['0804'],'pagina':23}, {'categorias':[],'contexto':'Orientador de actividades artísticas música: la tabla no indica clave de categoría','horarios':['B814'],'pagina':23}]
    for row in exclusive:row.update({'fuente':'1A74-003-032','catalogo':'1A74-008-010'})
    result={'horarios_exclusivos_por_categoria':exclusive,'estado':'REFERENCIA_DOCUMENTAL_NO_PUBLICADA','fuentes':sources,'tipos_contratacion':tc,'conceptos':concepts,'incidencias_aps':aps,'horarios_estatuto':schedules,'prefijos_horarios':prefixes,'pendientes_no_inferir':['tipo_plaza_codigo','marca_ocupacion_codigo','status_codigo','baja_codigo'],'advertencias':['Los códigos pertenecen a campos distintos: TC, concepto, incidencia APS, horario, TP, MO, Status y Cve Baja no son intercambiables.','Incidencias B31/B33 no prueban una equivalencia con Cve Baja numérica 31/33.','Frecuencia de registro no determina descansos concretos ni calendario de ciclos.','Los horarios exclusivos de Estatuto se resuelven por catálogo completo antes de interpretar un prefijo.','Se conservan las filas repetidas del catálogo APS como apariciones documentales; no se asigna significado distinto por duplicación.','No se afirma vigencia externa actual ni se importa un catálogo en producción con esta extracción.']}


    if '1A74-003-033' in docs:
        doc=docs['1A74-003-033']
        bajas=[];mo=[];new_tc=[]
        for page in [260,261,262]:
            section='GENERAL' if page==260 else 'ESTATUTO' if page==261 else 'MO'
            for line in doc[page-1].get_text(sort=True).splitlines():
                if 'jubilados y pensionados' in line:section='JUBILADOS_PENSIONADOS'
                if 'Tabla de tipos de contratación' in line:section='TC'
                m=re.match(r'^\s*([0-9]{1,2})\s+(.+?)\s*$',line)
                if not m:continue
                row={'clave':m[1].zfill(2),'descripcion':m[2],'fuente':'1A74-003-033','pagina':page,'catalogo':'1A74-008-012'}
                if section=='TC':new_tc.append(row)
                elif section=='MO':mo.append(row)
                else:bajas.append({**row,'ambito':section})
        for row in new_tc:
            prior=next((x for x in tc if x['clave']==row['clave']),None)
            if prior:prior.setdefault('apoyo',[]).append({k:row[k] for k in ['fuente','pagina','catalogo']})
            else:tc.append(row)
        result['marcas_baja']=bajas
        result['marcas_ocupacion']=mo
        result['tipos_plaza']=[{'clave':key,'descripcion':desc,'fuente':'1A74-003-033','pagina':14,'numeral':'5.2.13.11'} for key,desc in [('53','Temporal Confianza Estatuto “A”'),('05','Programas Especiales de Confianza'),('15','Programas Especiales de Base')]]
        result['status_contextuales']=[{'clave':'2','contexto':'Bajas de cambio de residencia aún no enviadas; proceso sin transmitir','fuente':'1A74-003-033','pagina':244,'numeral':'6.6.2, Anexo 18'}, {'clave':'100','contexto':'Bajas de cambio de residencia ya enviadas; proceso terminada descarga','fuente':'1A74-003-033','pagina':244,'numeral':'6.6.2, Anexo 18'}, {'clave':'2','contexto':'Recepción de cambio de residencia con marca de baja 89 y proceso carga completa','fuente':'1A74-003-033','pagina':244,'numeral':'6.6.3, Anexo 18'}]
        result['pendientes_no_inferir']=['status_codigo (catálogo general)','tipo_plaza_codigo no identificado','marca_ocupacion_codigo no identificado','baja_codigo no identificado','tipos_contratacion 10, 11, 50, 51']
        result['advertencias'].append('033 aporta tablas numéricas de baja independientes de APS: se usan directamente con su ámbito, sin quitar prefijos a incidencias APS. La tabla de Status encontrada es contextual de cambio de residencia, no un catálogo general.')
    return result

if __name__=='__main__':
    result=extract([Path(p) for p in sys.argv[2:]])
    Path(sys.argv[1]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'fuentes':len(result['fuentes']),'tc':len(result['tipos_contratacion']),'aps_apariciones':len(result['incidencias_aps']),'aps_claves':len({r['clave'] for r in result['incidencias_aps']}),'horarios_estatuto':len(result['horarios_estatuto'])}))
