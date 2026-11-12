"""Import federal mando roster; preserve source history, credentials, roles and ordinary payroll cuts."""
import json,hashlib,uuid,datetime,unicodedata,urllib.request,urllib.error,urllib.parse,os
from pathlib import Path
from cloud import query,api
DB='f357c36f-3a7e-4e53-b575-0dd5ccb76796'
BASE='https://firestore.googleapis.com/v1/projects/sicip-bcs/databases/(default)/documents/usuarios/'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def key(s):return ''.join(c for c in unicodedata.normalize('NFD',s) if not unicodedata.combining(c)).lower().replace('/',' ')
def aplicar(database,cut):
 rows=query(database,'SELECT json FROM nomina_mando ORDER BY matricula')[0]['results']
 if not rows:return 0
 meta=query(database,'SELECT status,expected FROM cortes WHERE id=?',[cut])[0]['results'][0];assert meta['status']=='BORRADOR'
 for row in rows:
  p=json.loads(row['json']);old=query(database,'SELECT json FROM personas WHERE corte=? AND matricula=?',[cut,p['matricula']])[0]['results'];old=json.loads(old[0]['json']) if old else {};merged={**old,**{k:v for k,v in p.items() if v is not None and v!=''},'privado':{**old.get('privado',{}),**{k:v for k,v in p.get('privado',{}).items() if v}}}
  query(database,'INSERT INTO personas VALUES(?,?,?,?,?,?) ON CONFLICT(corte,matricula) DO UPDATE SET nombre_search=excluded.nombre_search,tc=excluded.tc,status=excluded.status,json=excluded.json',[cut,p['matricula'],key(p['nombre']+' '+p['matricula']),merged.get('tipo_contratacion_clave',''),merged.get('status_codigo',''),json.dumps(merged,ensure_ascii=False)])
 expected=json.loads(meta['expected']);expected['counts']['personas']=query(database,'SELECT count(*) n FROM personas WHERE corte=?',[cut])[0]['results'][0]['n'];expected['nomina_mando']={'cantidad':len(rows),'fuente':rows and query(database,"SELECT value FROM settings WHERE key='nomina_mando_fuente'")[0]['results'][0]['value']};query(database,'UPDATE cortes SET expected=? WHERE id=?',[json.dumps(expected),cut]);return len(rows)
def request(url,method='GET',body=None):
 req=urllib.request.Request(url,method=method,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)
 except urllib.error.HTTPError as e:
  if method=='GET' and e.code==404:return None
  raise RuntimeError('Firestore HTTP '+str(e.code)) from None

def importar(source,record,apply=False,unidades=None):
 unidades=unidades or {}
 data=json.loads(Path(source).read_text());assert len(data['personas'])==len({p['matricula'] for p in data['personas']});print(json.dumps({'plan':True,'matriculas':len(data['personas']),'quincena_mando':data['quincena'],'unidades_confirmadas':len(unidades),'aplicar':apply}))
 if not apply:return
 path=Path(record);path.mkdir(parents=True,exist_ok=True);os.chmod(path,0o700)
 priorpath=path/'respaldo.json';accounts={}
 for p in data['personas']:accounts[p['matricula']]=request(BASE+p['matricula'])
 active=query(DB,"SELECT value FROM settings WHERE key='active'")[0]['results'][0]['value'];c=query(DB,'SELECT * FROM cortes WHERE id=?',[active])[0]['results'][0]
 if not priorpath.exists():
  priorpath.write_text(json.dumps({'active':active,'cut':c,'cuentas':accounts,'unidades':query(DB,'SELECT * FROM personal_unidades WHERE matricula IN (SELECT value FROM json_each(?))',[json.dumps(list(accounts))])[0]['results'],'mando':query(DB,'SELECT * FROM nomina_mando')[0]['results']}));os.chmod(priorpath,0o600)
 stamp=now();hash=data['source_hash'];query(DB,'INSERT OR IGNORE INTO nomina_mando_fuentes VALUES(?,?,?,?,?)',[hash,data['quincena'],data['source_name'],stamp,json.dumps({'personas':len(data['personas']),'omitidas':len(data['omitidas'])})])
 for p in data['personas']:
  raw=json.dumps(p,ensure_ascii=False);query(DB,'INSERT OR IGNORE INTO nomina_mando_historial VALUES(?,?,?)',[hash,p['matricula'],raw]);query(DB,'INSERT INTO nomina_mando VALUES(?,?,?) ON CONFLICT(matricula) DO UPDATE SET fuente=excluded.fuente,json=excluded.json',[p['matricula'],hash,raw])
 # This file replaces the active mando source; prior source stays in history.
 query(DB,'DELETE FROM nomina_mando WHERE fuente<>?',[hash]);query(DB,"INSERT INTO settings VALUES('nomina_mando_fuente',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[hash])
 cutfile=path/'corte.json'
 if cutfile.exists():cut=json.loads(cutfile.read_text())['id']
 else:
  cut=str(uuid.uuid4());cutfile.write_text(json.dumps({'id':cut,'previo':active}));query(DB,'INSERT INTO cortes(id,quincena,created_at,created_by,source_hash,source_name,expected) VALUES(?,?,?,?,?,?,?)',[cut,c['quincena'],stamp,'importacion-mando',c['source_hash'],c['source_name']+' + Nómina de Mando '+data['quincena'],c['expected']])
 status=query(DB,'SELECT status FROM cortes WHERE id=?',[cut])[0]['results'][0]['status']
 if status=='BORRADOR':
  for table in ['personas','plazas','antiguedad','catalogos']:
   cols={'personas':'matricula,nombre_search,tc,status,json','plazas':'plaza,ocupante,titular,puesto,departamento,json','antiguedad':'matricula,json','catalogos':'clave,json'}[table];query(DB,f'INSERT OR IGNORE INTO {table}(corte,{cols}) SELECT ?,{cols} FROM {table} WHERE corte=?',[cut,active])
  aplicar(DB,cut);expected=json.loads(query(DB,'SELECT expected FROM cortes WHERE id=?',[cut])[0]['results'][0]['expected']);counts={t:query(DB,f'SELECT count(*) n FROM {t} WHERE corte=?',[cut])[0]['results'][0]['n'] for t in ['personas','plazas','antiguedad','catalogos']};assert counts=={k:expected['counts'][k] for k in counts};counts['ocupadas']=query(DB,'SELECT count(*) n FROM plazas WHERE corte=? AND ocupante IS NOT NULL',[cut])[0]['results'][0]['n'];counts['sin_ocupante']=counts['plazas']-counts['ocupadas'];query(DB,"UPDATE cortes SET status='VALIDADO',validation=? WHERE id=?",[json.dumps({'counts':counts,'warnings':expected.get('warnings',[]),'nomina_mando':expected['nomina_mando']}),cut])
 # Catalogue: exact names only. Never map a mando department to an unrelated ordinary plaza.
 units=query(DB,'SELECT clave,nombre FROM unidades_servicio WHERE activo=1')[0]['results'];lookup={key(u['nombre']):u['clave'] for u in units}
 for p in data['personas']:
  name=unidades.get(p['matricula'],p['departamento_nombre_padron']);uk=lookup.get(key(name)) or 'MANDO-'+hashlib.sha256(key(name).encode()).hexdigest()[:16];query(DB,'INSERT OR IGNORE INTO unidades_servicio(clave,nombre,activo,version,actor,fecha) VALUES(?,?,1,1,?,?)',[uk,name,'importacion-mando',stamp]);query(DB,'INSERT INTO personal_unidades VALUES(?,?,1,?,?) ON CONFLICT(matricula) DO UPDATE SET unidad=excluded.unidad,version=personal_unidades.version+1,actor=excluded.actor,fecha=excluded.fecha WHERE personal_unidades.unidad<>excluded.unidad',[p['matricula'],uk,'importacion-mando',stamp]);p['unidad_clave']=uk;p['unidad_nombre']=name
 # JS permission registry is authoritative; no passwords are read into logs or reset for existing users.
 import subprocess
 permissions=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{ACCESOS,ACCESOS_TRABAJADOR_INICIALES,permisosHeredados}from './central/src/accesos.mjs';const ids=[...ACCESOS_TRABAJADOR_INICIALES,...ACCESOS.filter(x=>x.startsWith('jefe.')||['cuadros.mi','cuadros.recibidas'].includes(x))];console.log(JSON.stringify({ids,all:ACCESOS,legacy:permisosHeredados(ids)}))"],text=True))
 created=promoted=admins=0
 def encode(v):return {'booleanValue':v} if isinstance(v,bool) else {'arrayValue':{'values':[encode(x) for x in v]}} if isinstance(v,list) else {'stringValue':str(v)}
 for p in data['personas']:
  mat=p['matricula'];account=request(BASE+mat);fields=account.get('fields',{}) if account else {};role=fields.get('rol',{}).get('stringValue','TRABAJADOR');patch={'nombre':p['nombre'],'puesto':p['puesto_padron'],'descripcion':p['categoria_padron'],'departamento':p['departamento_padron'],'departamentoNombre':p['departamento_nombre_padron'],'unidadClave':p['unidad_clave'],'unidadNombre':p['unidad_nombre'],'nominaOrigen':'MANDO_FEDERAL'}
  if not account:patch.update(password=mat,primerAcceso=True,activo=True);created+=1
  if role in ['ADMIN','ADMINISTRADOR']:admins+=1
  elif role in ['TRABAJADOR','JEFE_SERVICIO']:
   ids=list(dict.fromkeys([v.get('stringValue') for v in fields.get('accesos',{}).get('arrayValue',{}).get('values',[]) if v.get('stringValue') in permissions['all']]+permissions['ids']));legacy=list(dict.fromkeys([v.get('stringValue') for v in fields.get('permisos',{}).get('arrayValue',{}).get('values',[]) if v.get('stringValue')]+permissions['legacy']));patch.update(rol='JEFE_SERVICIO',accesosDefinidos=True,accesos=ids,permisos=legacy);promoted+=1
  params=[('updateMask.fieldPaths',k) for k in patch]+[('currentDocument.updateTime',account['updateTime'])] if account else [('updateMask.fieldPaths',k) for k in patch]+[('currentDocument.exists','false')];request(BASE+mat+'?'+urllib.parse.urlencode(params),'PATCH',{'fields':{k:encode(v) for k,v in patch.items()}})
  # Refresh existing sessions without changing token, password or admin permissions.
  session_patch={k:v for k,v in patch.items() if k not in ['password','primerAcceso','nominaOrigen']};session_patch['nombre']=' '.join(p['nombre'].split('/')[2:]+p['nombre'].split('/')[:2]);session_patch['nombreSaludo']=p['nombre'].split('/')[2];query(DB,"UPDATE sessions SET usuario=json_patch(usuario,?) WHERE json_extract(usuario,'$.matricula')=?",[json.dumps(session_patch),mat])
 changed=query(DB,"UPDATE settings SET value=? WHERE key='active' AND value IN (?,?)",[cut,active,cut])[0].get('meta',{}).get('changes');assert changed==1,'Cambió el corte activo; revisar antes de activar.';query(DB,'INSERT OR IGNORE INTO audit VALUES(?,?,?,?,?)',[cut,cut,'INTEGRAR_NOMINA_MANDO:'+hash,'importacion-mando',stamp]);result={'corte':cut,'previo':active,'personas_mando':len(data['personas']),'cuentas_nuevas':created,'cuentas_jefe':promoted,'administradores_conservados':admins};(path/'resultado.json').write_text(json.dumps(result));print(json.dumps(result))
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('--record',required=True);p.add_argument('--apply',action='store_true');p.add_argument('--unidades',help='JSON privado matrícula: nombre confirmado de unidad');a=p.parse_args();importar(a.source,a.record,a.apply,json.loads(Path(a.unidades).read_text()) if a.unidades else {})
