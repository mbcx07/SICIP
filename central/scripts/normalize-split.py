"""Normaliza entregas separadas de plazas/matrículas sin evaluar fórmulas ni leer hojas auxiliares."""
import argparse,datetime,hashlib,json,re
from pathlib import Path
import openpyxl
TC={'01':'Confianza','02':'Base','03':'Temporal','08':'Suplente'}
def text(v):
 if v is None or str(v).strip() in ('#N/A','#VALUE!'):return ''
 if isinstance(v,float) and v.is_integer():return str(int(v))
 if isinstance(v,(datetime.datetime,datetime.date)):return v.date().isoformat() if isinstance(v,datetime.datetime) else v.isoformat()
 return str(v).strip()
def date(v):
 s=text(v)
 for f in ('%Y-%m-%d','%d/%m/%Y'):
  try:return datetime.datetime.strptime(s,f).date().isoformat()
  except ValueError:pass
 return None

def normalize(plazas,matriculas,q):
 assert re.fullmatch(r'\d{4}0(0[1-9]|1\d|2[0-4])',q)
 wb=openpyxl.load_workbook(plazas,read_only=True,data_only=True);names=[n for n in wb.sheetnames if 'TODAS LAS PLAZAS' in n.upper() and q in n];assert len(names)==1,'No existe una hoja única de TODAS LAS PLAZAS para la quincena.'
 sheet=wb[names[0]];it=sheet.iter_rows(values_only=True);h=[text(x) for x in next(it)];zs=[];ants={};warnings=[]
 def rows(it,h):
  for row in it:
   r=dict(zip(h,row))
   if any(v is not None for v in row):yield r
 for r in rows(it,h):
  id=text(r.get('Cve Plaza',r.get('Clave de la Plaza')))
  if not id:continue
  assert id.isdigit(),'Clave de plaza inválida'
  get=lambda k:text(r.get(k));mid=get('Empleado ocupante');mid=None if mid in ('','0') else mid
  z={'plaza_id':id,'ocupante_matricula':mid,'titular_matricula':get('Titular de plz.') or None,'nombre_titular_origen':get('Nombre del Empleado Titular'),'situacion_ocupacion':'CON_OCUPANTE' if mid else 'SIN_OCUPANTE','datos_origen':{k:text(v) for k,v in r.items() if k not in ['CURP.','NSS','RFC','SEXO','AÑOS','QNAS','DIAS']}}
  for out,key in {'puesto':'Puesto','categoria':'Descripcion','clasificacion':'Clasificación','departamento':'Departamento','departamento_nombre':'Descripcion1','jefatura':'Pertenece a Jefatura o Coord','localidad':'Localidad','servicio':'Nombre del Servicio','area_responsabilidad':'AR','area_responsabilidad_nombre':'Descripción AR','adscripcion_ip':'Clave de Adscripcion IP','adscripcion_ip2':'Clave de Adscripcion IP2','tipo_plaza_codigo':'TP','tipo_contratacion_codigo':'TC','turno_codigo':'Turno','horario_codigo':'Cve del Horario','horario':'Descripcion2','marca_ocupacion_codigo':'MO','restriccion_origen':'RESTRINGIDAS'}.items():z[out]=get(key)
  for key in ['inicio','termino','ocupacion']:z['fecha_'+key]=date(r.get({'inicio':'Fecha de Inicio','termino':'Fecha de Termino','ocupacion':'Fecha de ocupacion'}[key]))
  if z['titular_matricula']=='0':z['titular_matricula']=None
  zs.append(z)
  if mid and all(isinstance(r.get(k),(int,float)) for k in ['AÑOS','QNAS','DIAS']):
   a,b,c=(int(r[k]) for k in ['AÑOS','QNAS','DIAS']);ant={'matricula':mid,'anios':a,'quincenas':b,'dias':c,'total_dias':a*360+b*15+c,'concepto':'ANTIGUEDAD_PLAZAS','quincena_origen':q,'en_padron':True}
   if mid in ants:assert ants[mid]['total_dias']==ant['total_dias'],'Antigüedad contradictoria'
   ants[mid]=ant
 mw=openpyxl.load_workbook(matriculas,read_only=True,data_only=True);assert len(mw.sheetnames)==1 and q in mw.sheetnames[0];it=mw.active.iter_rows(values_only=True);h=[text(x) for x in next(it)];ps=[]
 for r in rows(it,h):
  mid=text(r.get('Matricula'));assert mid.isdigit(),'Matrícula inválida';tc=text(r.get('Tipo de Contratacion')).zfill(2)
  ps.append({'matricula':mid,'nombre':text(r.get('Nombre')),'puesto_padron':text(r.get('Puesto')),'categoria_padron':text(r.get('Descripcion1')),'departamento_padron':text(r.get('Departamento')),'departamento_nombre_padron':text(r.get('Descripcion2')),'tipo_contratacion_codigo':tc,'tipo_contratacion_clave':tc,'tipo_contratacion_nombre':TC.get(tc,'Sin clasificar'),'status_codigo':text(r.get('Status')),'baja_codigo':text(r.get('Cve Baja')),'fecha_ingreso':date(r.get('Fecha Ingreso')),'fecha_baja':date(r.get('Fecha de Baja')),'privado':{k:text(r.get(v)) for k,v in {'curp':'CURP.','nss':'Número de Seguridad Social','rfc':'RFC','banco':'Banco','forma_pago':'Forma de Pago','sexo':'Sexo'}.items()}})
 mids={p['matricula'] for p in ps};assert len(mids)==len(ps),'Matrículas duplicadas';assert len({z['plaza_id'] for z in zs})==len(zs),'Plazas duplicadas';assert all(not z['ocupante_matricula'] or z['ocupante_matricula'] in mids for z in zs),'Ocupantes sin matrícula'
 for z in zs:
  if z['titular_matricula'] and z['titular_matricula'] not in mids:warnings.append({'tipo':'TITULAR_SIN_PADRON','plaza':z['plaza_id']})
 counts={'personas':len(ps),'plazas':len(zs),'antiguedad':len(ants),'catalogos':0,'ocupadas':sum(bool(z['ocupante_matricula']) for z in zs),'sin_ocupante':sum(not z['ocupante_matricula'] for z in zs)}
 return {'quincena':q,'personas':ps,'plazas':zs,'antiguedad':list(ants.values()),'catalogos':[],'warnings':warnings,'counts':counts,'source_sheets':{'personas':mw.sheetnames[0],'plazas':names[0]},'source_name':plazas.name+' + '+matriculas.name,'source_hash':hashlib.sha256(plazas.read_bytes()+matriculas.read_bytes()).hexdigest()}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('plazas',type=Path);p.add_argument('matriculas',type=Path);p.add_argument('output',type=Path);p.add_argument('--quincena',required=True);a=p.parse_args();s=normalize(a.plazas,a.matriculas,a.quincena);a.output.write_text(json.dumps(s,ensure_ascii=False));print(json.dumps(s['counts']))
