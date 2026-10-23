"""Read-only deployment verification using a short-lived operator-created session.
No Firebase account is created or impersonated; the probe cannot pass the live account check for writes.
The token stays in memory and the D1 session is removed in finally (also expires in 5 minutes).
"""
import argparse,json,time,secrets,hashlib,urllib.request,urllib.parse,urllib.error,concurrent.futures
from pathlib import Path
from cloud import query
p=argparse.ArgumentParser();p.add_argument('--database',required=True);p.add_argument('--host',required=True);p.add_argument('--record',type=Path,required=True);p.add_argument('--snapshot',type=Path,required=True);p.add_argument('--expect-active',action='store_true');a=p.parse_args()
snapshot=json.loads(a.snapshot.read_text());version=json.loads(a.record.read_text())['id'];token=secrets.token_hex(32);token_hash=hashlib.sha256(token.encode()).hexdigest()
actor={'matricula':'cloud-read-probe-'+secrets.token_hex(8),'nombre':'Validación temporal de solo lectura','rol':'AREA_PERSONAL','activo':True,'primerAcceso':False,'permisos':[]}
query(a.database,'INSERT INTO sessions(token_hash,usuario,expires) VALUES(?,?,?)',[token_hash,json.dumps(actor),int(time.time())+300])
headers={'User-Agent':'Mozilla/5.0','Cookie':'__Host-SICIP_SESSION='+token,'Origin':a.host,'Accept':'application/json'}
def get(path,auth=True,method='GET',data=None):
 h=dict(headers)
 if not auth:h.pop('Cookie')
 if data is not None:h['Content-Type']='application/json'
 request=urllib.request.Request(a.host+path,headers=h,method=method,data=json.dumps(data).encode() if data is not None else None)
 try:
  with urllib.request.urlopen(request,timeout=30) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:
  try:d=json.load(e)
  except Exception:d={}
  return e.code,d
try:
 status,_=get('/api/base/current',False);assert status==401,('anonymous',status)
 if a.expect_active:
  status,live=get('/api/base/current');assert status==200 and live.get('id')==version and live.get('quincena')==snapshot['quincena'],'Unexpected active cut'
  print('Corte activo confirmado: '+live['quincena'],flush=True)
 status,_=get('/api/base/imports',method='POST',data={});assert status==403,('read-only guard',status)
 def verify(table):
  after='';keys=set();n=0;key='plaza_id' if table=='plazas' else 'clave' if table=='catalogos' else 'matricula'
  expected={r[key]:r for r in snapshot[table]}
  for page in range(1001):
   suffix='&full=1' if table in ['personas','plazas'] else ''
   status,data=get('/api/base/datasets/'+table+'?version='+version+'&after='+urllib.parse.quote(after,safe='')+suffix)
   assert status==200,(table,status)
   assert isinstance(data,list) and len(data)<=256,(table,'pagination format')
   for r in data:
    assert r[key] not in keys,(table,'duplicate');keys.add(r[key]);actual=dict(r);actual.pop('search',None);assert actual==expected.get(r[key]),(table,'content differs from validated snapshot')
    if table=='plazas':assert 'datos_origen' in r and 'fechas' in r.get('privado',{}),'missing complete plaza data'
   n+=len(data)
   if len(data)<256:break
   after=data[-1][key]
  assert n==snapshot['counts'][table],(table,n,snapshot['counts'][table])
  return {'dataset':table,'rows_verified':n,'duplicates':0}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for result in pool.map(verify,['personas','plazas','antiguedad','catalogos']):print(json.dumps(result),flush=True)
 print('Acceso sin sesión rechazado y carga denegada al perfil de prueba de solo lectura.',flush=True)
finally:
 query(a.database,'DELETE FROM sessions WHERE token_hash=?',[token_hash]);print('Sesión temporal eliminada.',flush=True)
