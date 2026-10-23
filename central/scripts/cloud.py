"""Cloudflare D1 setup and reproducible data preparation; never prints tokens or row contents."""
import os,json,urllib.request,urllib.error,hashlib,argparse,uuid,datetime
from pathlib import Path
ACCOUNT='bb84fe256d3d1915bd3d78dc340df13e'
ROOT=Path(__file__).resolve().parents[1]
def api(path,method='GET',body=None):
 data=json.dumps(body,ensure_ascii=False).encode() if body is not None else None
 req=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+path,data=data,method=method,headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=60) as response:out=json.load(response)
 except urllib.error.HTTPError as e:raise RuntimeError('Cloudflare HTTP '+str(e.code)+' en '+path.split('?')[0]) from None
 if not out.get('success'):raise RuntimeError('Cloudflare rechazó la operación. Códigos: '+str([e.get('code') for e in out.get('errors',[])]))
 return out.get('result')
def query(database,sql,params=None):
 result=api('/d1/database/'+database+'/query','POST',{'sql':sql,'params':params or []})
 if any(not r.get('success',True) for r in result):raise RuntimeError('D1 no completó la consulta.')
 return result

def seed(database,snapshot_path,record_path,activate=False):
 raw=snapshot_path.read_bytes();s=json.loads(raw);digest=hashlib.sha256(raw).hexdigest();
 if record_path.exists():
  record=json.loads(record_path.read_text());assert record['normalized_hash']==digest,'El contenido normalizado cambió; usa un registro nuevo.'
  id=record['id']
 else:
  id=str(uuid.uuid4());record={'id':id,'quincena':s['quincena'],'normalized_hash':digest,'source_hash':s['source_hash']};record_path.write_text(json.dumps(record,indent=2))
 expected={'counts':s['counts'],'warnings':s.get('warnings',[])[:300],'normalized_hash':digest}
 prior=query(database,'SELECT status,expected FROM cortes WHERE id=?',[id])[0]['results']
 if prior:
  assert json.loads(prior[0]['expected'])==expected,'El borrador previo tiene otro contenido.'
 else:query(database,'INSERT INTO cortes(id,quincena,created_at,created_by,source_hash,source_name,expected) VALUES(?,?,?,?,?,?,?)',[id,s['quincena'],datetime.datetime.now(datetime.timezone.utc).isoformat(),'configuracion-cloud',s['source_hash'],s['source_name'],json.dumps(expected,ensure_ascii=False)])
 if not prior or prior[0]['status']!='VALIDADO':
  statements={
  'personas':"INSERT OR IGNORE INTO personas(corte,matricula,nombre_search,tc,status,json) SELECT ?,json_extract(value,'$.matricula'),json_extract(value,'$.search'),json_extract(value,'$.tipo_contratacion_clave'),json_extract(value,'$.status_codigo'),value FROM json_each(?)",
  'plazas':"INSERT OR IGNORE INTO plazas(corte,plaza,ocupante,titular,puesto,departamento,json) SELECT ?,json_extract(value,'$.plaza_id'),json_extract(value,'$.ocupante_matricula'),json_extract(value,'$.titular_matricula'),json_extract(value,'$.puesto'),json_extract(value,'$.departamento'),value FROM json_each(?)",
  'antiguedad':"INSERT OR IGNORE INTO antiguedad(corte,matricula,json) SELECT ?,json_extract(value,'$.matricula'),value FROM json_each(?)",
  'catalogos':"INSERT OR IGNORE INTO catalogos(corte,clave,json) SELECT ?,json_extract(value,'$.clave'),value FROM json_each(?)"}
  import unicodedata
  for table in statements:
   data=s[table]
   if table=='personas':
    data=[{**r,'search':''.join(c for c in unicodedata.normalize('NFD',r['nombre']+' '+r['matricula']) if not unicodedata.combining(c)).lower()} for r in data]
   for i in range(0,len(data),300):query(database,statements[table],[id,json.dumps(data[i:i+300],ensure_ascii=False,separators=(',',':'))])
   print(s['quincena'],table,len(data),'guardados',flush=True)
  counts={}
  for table in statements:
   n=query(database,'SELECT COUNT(*) n FROM '+table+' WHERE corte=?',[id])[0]['results'][0]['n'];assert n==s['counts'][table],table;counts[table]=n
  orphan=query(database,'SELECT COUNT(*) n FROM plazas z LEFT JOIN personas p ON p.corte=z.corte AND p.matricula=z.ocupante WHERE z.corte=? AND z.ocupante IS NOT NULL AND p.matricula IS NULL',[id])[0]['results'][0]['n'];assert orphan==0,'Hay ocupantes sin padrón.'
  counts['ocupadas']=query(database,'SELECT COUNT(*) n FROM plazas WHERE corte=? AND ocupante IS NOT NULL',[id])[0]['results'][0]['n'];counts['sin_ocupante']=counts['plazas']-counts['ocupadas']
  query(database,'UPDATE cortes SET status=?,validation=? WHERE id=?',['VALIDADO',json.dumps({'counts':counts,'warnings':s.get('warnings',[])[:300]},ensure_ascii=False),id])
 if activate:
  query(database,"INSERT INTO settings(key,value) VALUES('active',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[id])
  query(database,'INSERT INTO audit(id,corte,accion,usuario,fecha) VALUES(?,?,?,?,?)',[str(uuid.uuid4()),id,'ACTIVAR_INICIAL','configuracion-cloud',datetime.datetime.now(datetime.timezone.utc).isoformat()])
 print(json.dumps({'id':id,'quincena':s['quincena'],'validated':True,'activated':activate}),flush=True)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('action',choices=['schema','bind','seed','activate']);p.add_argument('--database',required=True);p.add_argument('--snapshot',type=Path);p.add_argument('--record',type=Path);p.add_argument('--initial',action='store_true');p.add_argument('--expected');a=p.parse_args()
 if a.action=='schema':query(a.database,(ROOT/'schema.sql').read_text());print('Esquema D1 preparado.')
 if a.action=='bind':
  project=api('/pages/projects/sicip-bcs');configs={}
  for name in ['preview','production']:
   config=project['deployment_configs'][name];config['d1_databases']={**config.get('d1_databases',{}),'DB':{'id':a.database}};configs[name]=config
  api('/pages/projects/sicip-bcs','PATCH',{'deployment_configs':configs});print('Binding DB guardado para preview y producción; valores existentes conservados.')
 if a.action=='seed':seed(a.database,a.snapshot,a.record,a.initial)
 if a.action=='activate':
  id=json.loads(a.record.read_text())['id'];assert a.expected,'Falta el corte actual esperado.'
  before=query(a.database,"SELECT value FROM settings WHERE key='active'")[0]['results'];assert before and before[0]['value']==a.expected,'La versión activa cambió.'
  valid=query(a.database,'SELECT status FROM cortes WHERE id=?',[id])[0]['results'];assert valid and valid[0]['status']=='VALIDADO'
  updated=query(a.database,"UPDATE settings SET value=? WHERE key='active' AND value=?",[id,a.expected]);assert updated[0].get('meta',{}).get('changes')==1,'La activación no se aplicó: cambió el corte activo.';query(a.database,'INSERT INTO audit(id,corte,accion,usuario,fecha) VALUES(?,?,?,?,?)',[str(uuid.uuid4()),id,'ACTIVAR','configuracion-cloud',datetime.datetime.now(datetime.timezone.utc).isoformat()]);print('Corte activado:',id)
