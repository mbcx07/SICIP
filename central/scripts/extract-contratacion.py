"""Extract non-personal rule catalogs from the supplied program; never executes VBA."""
import zipfile,hashlib,json,sys,re
from pathlib import Path
from lxml import etree as E
file=Path(sys.argv[1]);out=Path(sys.argv[2]);z=zipfile.ZipFile(file);ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))]
def sheet(number):
 result={}
 for c in E.fromstring(z.read(f'xl/worksheets/sheet{number}.xml')).findall('.//m:c',ns):
  v=c.find('m:v',ns)
  if v is not None and v.text is not None:result[c.get('r')]=strings[int(v.text)] if c.get('t')=='s' else v.text
 return result
cap=sheet(1);cat=sheet(11);horarios=[]
for i in range(2,265):
 if 'H'+str(i) not in cat or 'I'+str(i) not in cat:continue
 horarios.append({'codigo':cat['H'+str(i)],'descripcion':cat['I'+str(i)],'minutos':round(float(cat.get('J'+str(i),'0'))*60),'ciclo_dias':int(float(cat.get('K'+str(i),'1')))})
reasons=[cap['F'+str(i)] for i in range(25,42) if cap.get('F'+str(i))]
result={'source':'PROGRAMA DE CONTRATACION HGZ+MF No1.xlsm','sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'motivos':[{'id':re.sub('[^A-Z0-9]+','_',s).strip('_'),'nombre':s} for s in reasons],'horarios':horarios,'unidad':cap['H1'],'bloqueo_presupuesto':{'tipo_plaza':'14','descripcion':'CUBRE VACACIONES BASE','referencia':'CAPTURA!A1, H33; Módulo16.COBER; Hoja2!B6:C6'},'referencias':{'cobertura':'SOLIC DE COBERTURA!A13:K16','sustitucion':'CONTRATO!A124:U145 · 7110-009-003','extra':'TIEMPO EXTRA!AN95:BG118 · 1A12-009-003','horas':'TIEMPO EXTRA!AW107, AY107 y BA107','descansos':'CAPTURA!B19; BASE DE DATOS!C:C (sin valores en el archivo recibido)'}}
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('Catálogo no personal:',len(horarios),'horarios y',len(reasons),'motivos.')
