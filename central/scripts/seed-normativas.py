#!/usr/bin/env python3
"""Idempotent private D1 upload, activated only after count/byte verification.
Usage: seed-normativas.py database-id prepared-directory [--local-sql output.sql]
"""
import base64,json,sys,datetime,time
from pathlib import Path
from cloud import query
DB=sys.argv[1];root=Path(sys.argv[2]);manifest=json.loads((root/'manifest.json').read_text());local=Path(sys.argv[4]) if len(sys.argv)>4 and sys.argv[3]=='--local-sql' else None
if local:local.write_text('')
def execute(sql,params=None):
 if local:
  for v in params or []:
   q='NULL' if v is None else str(v) if isinstance(v,(int,float)) else "'"+str(v).replace("'","''")+"'";sql=sql.replace('?',q,1)
  with local.open('a') as f:f.write(sql+';\n')
  return [{'results':[]}]
 for attempt in range(4):
  try:return query(DB,sql,params)
  except Exception:
   if attempt==3:raise
   time.sleep(1+attempt)
for entry in manifest:
 id=entry['id'];data=json.loads((root/(id+'.json')).read_text());prior=[] if local else execute('SELECT publicado FROM normativa_documentos WHERE id=?',[id])[0]['results']
 if prior and prior[0]['publicado']==1:print('Verificado previo',entry['clave'],flush=True);continue
 cols=['id','clave','titulo','nombre','mime','bytes','sha256','paginas','ambito','version','privado','ocr'];execute('INSERT OR IGNORE INTO normativa_documentos('+','.join(cols)+',creado_en) VALUES('+','.join('?' for _ in range(13))+')',[entry[k] for k in cols]+[datetime.datetime.now(datetime.timezone.utc).isoformat()])
 raw=Path(entry['path']).read_bytes();chunks=[{'numero':i//49152,'data':base64.b64encode(raw[i:i+49152]).decode(),'bytes':len(raw[i:i+49152])} for i in range(0,len(raw),49152)]
 for start in range(0,len(chunks),6):execute("INSERT OR REPLACE INTO normativa_archivos SELECT ?,json_extract(value,'$.numero'),json_extract(value,'$.data'),json_extract(value,'$.bytes') FROM json_each(?)",[id,json.dumps(chunks[start:start+6],separators=(',',':'))])
 execute('DELETE FROM normativa_indice WHERE documento=?',[id])
 for start in range(0,len(data['paginas']),15):execute("INSERT INTO normativa_indice(documento,pagina,texto) SELECT ?,json_extract(value,'$.pagina'),json_extract(value,'$.texto') FROM json_each(?)",[id,json.dumps(data['paginas'][start:start+15],ensure_ascii=False,separators=(',',':'))])
 if not local:
  check=execute('SELECT COUNT(*) n,SUM(bytes) bytes FROM normativa_archivos WHERE documento=?',[id])[0]['results'][0];assert check['n']==len(chunks) and check['bytes']==len(raw)
  pages=execute('SELECT COUNT(*) n FROM normativa_indice WHERE documento=?',[id])[0]['results'][0]['n'];assert pages==len(data['paginas'])
 execute('UPDATE normativa_documentos SET publicado=1 WHERE id=?',[id]);print('Publicado',entry['clave'],len(raw),'bytes',len(data['paginas']),'páginas',flush=True)
print('Biblioteca lista',len(manifest),flush=True)
