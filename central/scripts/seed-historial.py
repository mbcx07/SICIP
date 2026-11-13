"""Carga versionada e idempotente; activa sólo después de validar todas las matrículas/años."""
import argparse,base64,datetime,gzip,hashlib,json
from pathlib import Path
from cloud import query
p=argparse.ArgumentParser();p.add_argument('archivo',type=Path);p.add_argument('--database',required=True);p.add_argument('--activar',action='store_true');a=p.parse_args();s=json.loads(a.archivo.read_text());load='hist-'+hashlib.sha256(json.dumps(s['fuentes'],sort_keys=True).encode()).hexdigest()[:24]
schema=(Path(__file__).resolve().parents[1]/'schema.sql').read_text().split('-- Payroll extracts are versioned')[1].split('\n',1)[1];query(a.database,schema)
existing=query(a.database,'SELECT id FROM historial_cargas WHERE id=?',[load])[0]['results']
if not existing:query(a.database,'INSERT INTO historial_cargas(id,fecha,fuentes,cobertura,conteos) VALUES(?,?,?,?,?)',[load,datetime.datetime.now(datetime.timezone.utc).isoformat(),json.dumps(s['fuentes'],ensure_ascii=False),json.dumps(s['cobertura'],ensure_ascii=False),json.dumps({**s['conteos'],'trabajadores':s['trabajadores'],'historiales':len(s['historiales'])})])
chunk=[];size=0;sent=0
sql="INSERT INTO historial_nomina(carga,matricula,anio,payload) SELECT ?,json_extract(value,'$.matricula'),json_extract(value,'$.anio'),json_extract(value,'$.payload') FROM json_each(?) WHERE 1 ON CONFLICT(carga,matricula,anio) DO NOTHING"
def send():
 global sent,chunk,size
 if not chunk:return
 query(a.database,sql,[load,json.dumps(chunk,separators=(',',':'))]);sent+=len(chunk);print('Historiales guardados',sent,flush=True);chunk=[];size=0
for h in s['historiales']:
 payload=json.dumps({'encoding':'gzip-base64','data':base64.b64encode(gzip.compress(json.dumps(h['registros'],ensure_ascii=False,separators=(',',':')).encode(),mtime=0)).decode(),'registros':len(h['registros'])},separators=(',',':'))
 row={'matricula':h['matricula'],'anio':h['anio'],'payload':payload};n=len(json.dumps(row))
 if size+n>170000:send()
 chunk.append(row);size+=n
send();r=query(a.database,"SELECT count(*) total,SUM(json_extract(payload,'$.registros')) hechos FROM historial_nomina WHERE carga=?",[load])[0]['results'][0];assert r['total']==len(s['historiales']) and r['hechos']==s['conteos']['TRANSACCION']+s['conteos']['INCIDENCIA'],r
query(a.database,"UPDATE historial_cargas SET estado='VALIDADO' WHERE id=?",[load])
if a.activar:query(a.database,"INSERT INTO settings VALUES('historial_nomina_activa',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[load])
print(json.dumps({'carga':load,'validado':True,'activado':a.activar,**r}),flush=True)
