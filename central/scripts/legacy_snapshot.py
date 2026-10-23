"""Retain a rollback cut from the previous application's domain JSONs, never from users."""
from pathlib import Path
import json,hashlib,argparse
from collections import Counter
p=argparse.ArgumentParser();p.add_argument('base',type=Path);p.add_argument('out',type=Path);a=p.parse_args()
def load(n):return json.loads((a.base/n).read_text())
def t(v):return '' if v is None else str(v).strip()
def get(r,*keys):
 for k in keys:
  if r.get(k) is not None:return r[k]
 return ''
def null(v):return None if t(v) in ('','0') else t(v)
tc={'01':'Confianza','02':'Base','03':'Temporal','08':'Suplente'}
people=[]
for r in load('data-ft-trabajadores.json'):
 k=t(r['matricula']);c=t(r.get('tipo_contratacion'));c=str(int(c)).zfill(2) if c.isdigit() else c
 people.append({'matricula':k,'nombre':t(r.get('nombre')),'puesto_padron':t(r.get('puesto')),'categoria_padron':t(r.get('descripcion_puesto')),'departamento_padron':t(r.get('departamento')),'departamento_nombre_padron':t(r.get('descripcion_departamento')),'tipo_contratacion_codigo':t(r.get('tipo_contratacion')),'tipo_contratacion_clave':c,'tipo_contratacion_nombre':tc.get(c,'Sin clasificar'),'status_codigo':t(r.get('status')),'baja_codigo':t(r.get('cve_baja')),'fecha_ingreso':r.get('fecha_ingreso'),'fecha_baja':r.get('fecha_baja'),'privado':{k:t(r.get(k)) for k in ['curp','rfc','nss','banco','forma_pago','sexo']}})
plazas=[]
for r in load('data-plazas-2026009.json'):
 plazas.append({'plaza_id':t(r['Clave de la Plaza']),'ocupante_matricula':null(r.get('Empleado ocupante')),'titular_matricula':null(r.get('Titular de plz.')),'nombre_titular_origen':t(get(r,'Nombre del Empleado Titular','Nombre Empleado Titular')),'puesto':t(r.get('Puesto')),'categoria':t(r.get('Descripcion')),'clasificacion':t(get(r,'Clasificación','clasificiacion')),'departamento':t(r.get('Departamento')),'departamento_nombre':t(r.get('Descripcion1')),'jefatura':t(get(r,'Pertenece a Jefatura o Coord','PERTENECE A JEFATURA O COORD')),'localidad':t(get(r,'Localidad','LOCALIDAD')),'servicio':t(r.get('Nombre del Servicio')),'area_responsabilidad':t(r.get('AR')),'area_responsabilidad_nombre':t(get(r,'Descripción AR','Descripcion AR')),'adscripcion_ip':t(r.get('Clave de Adscripcion IP')),'adscripcion_ip2':t(r.get('Clave de Adscripcion IP2')),'tipo_plaza_codigo':t(r.get('TP')),'tipo_contratacion_codigo':t(r.get('TC')),'turno_codigo':t(r.get('Turno')),'horario_codigo':t(r.get('Clave del Horario')),'horario':t(r.get('Descripcion2')),'marca_ocupacion_codigo':t(r.get('MO')),'restriccion_origen':t(get(r,'RESTRINGIDAS','RESTRINGIDA')),'fecha_inicio':r.get('Fecha de Inicio'),'fecha_termino':r.get('Fecha de Termino'),'fecha_ocupacion':r.get('Fecha de ocupacion')})
ids={p['matricula'] for p in people};nomina={t(p['matricula']):p for p in load('data-ft-nomina-2026009.json')};added=0
for z in plazas:
 mid=z['ocupante_matricula']
 if mid and mid not in ids:
  r=nomina.get(mid);assert r,'El legado tiene un ocupante sin padrón ni nómina verificable.'
  c=t(r.get('tipo_contratacion'));c=str(int(c)).zfill(2) if c.isdigit() else c
  people.append({'matricula':mid,'nombre':t(r.get('nombre')),'puesto_padron':t(r.get('puesto')),'categoria_padron':t(r.get('descripcion_puesto')),'departamento_padron':t(r.get('departamento')),'departamento_nombre_padron':t(r.get('descripcion_departamento')),'tipo_contratacion_codigo':t(r.get('tipo_contratacion')),'tipo_contratacion_clave':c,'status_codigo':'','baja_codigo':''});ids.add(mid);added+=1
raw=load('data-ft-antiguedad.json');ant=list(raw.values()) if isinstance(raw,dict) else raw
ant=[{**r,'matricula':t(r.get('matricula'))} for r in ant if null(r.get('matricula'))]
catalogs={}
for z in plazas:
 if z['departamento']:catalogs['adscripcion:'+z['departamento']]={'clave':'adscripcion:'+z['departamento'],'tipo':'adscripcion','datos':{'ADSCRIP':z['departamento'],'DESCRIPCION ADSCRIPCION':z['departamento_nombre']}}
 if z['puesto']:catalogs['categoria:'+z['puesto']]={'clave':'categoria:'+z['puesto'],'tipo':'categoria','datos':{'CLAVE CATEGORIA':z['puesto'],'DESCRIPCION DE CATEGORIA':z['categoria']}}
s={'quincena':'2026009','personas':people,'plazas':plazas,'antiguedad':ant,'catalogos':list(catalogs.values()),'warnings':[{'tipo':'RESPALDO_LEGADO','detalle':'Corte reconstruido desde los archivos utilizados por la aplicación anterior.'}],'source_name':'Respaldo de base anterior 2026009','source_hash':hashlib.sha256((a.base/'data-plazas-2026009.json').read_bytes()+(a.base/'data-ft-trabajadores.json').read_bytes()).hexdigest()}
s['counts']={k:len(s[k]) for k in ['personas','plazas','antiguedad','catalogos']};s['counts']['ocupadas']=sum(bool(z['ocupante_matricula']) for z in plazas);s['counts']['sin_ocupante']=len(plazas)-s['counts']['ocupadas']
a.out.write_text(json.dumps(s,ensure_ascii=False,separators=(',',':')));print(json.dumps({'counts':s['counts'],'padron_complemented_from_legacy_nomina':added}))
