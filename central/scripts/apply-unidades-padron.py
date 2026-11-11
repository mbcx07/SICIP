"""Assign only unassigned workers from an explicit reviewed roster plan; never overwrite an administrative assignment."""
import json,sys,datetime,uuid,hashlib
from pathlib import Path
from cloud import query
DB='f357c36f-3a7e-4e53-b575-0dd5ccb76796';path=Path(sys.argv[1]);plan=json.loads(path.read_text());c=query(DB,"SELECT c.id,c.quincena,c.source_hash FROM settings s JOIN cortes c ON c.id=s.value WHERE s.key='active'")[0]['results'][0];assert c['quincena']==plan['quincena'] and c['source_hash']==plan['source_hash'],'La quincena activa cambió.';now=datetime.datetime.now(datetime.timezone.utc).isoformat();actor='PADRON_Q'+plan['quincena']
query(DB,"INSERT INTO unidades_servicio(clave,nombre,activo,version,actor,fecha) SELECT json_extract(value,'$.clave'),json_extract(value,'$.nombre'),1,1,?,? FROM json_each(?) WHERE true ON CONFLICT(clave) DO NOTHING",[actor,now,json.dumps(plan['unidades'],ensure_ascii=False)])
for start in range(0,len(plan['asignaciones']),300):
 rows=plan['asignaciones'][start:start+300];query(DB,"INSERT INTO personal_unidades(matricula,unidad,version,actor,fecha) SELECT json_extract(value,'$.matricula'),json_extract(value,'$.unidad'),1,?,? FROM json_each(?) WHERE true ON CONFLICT(matricula) DO NOTHING",[actor,now,json.dumps(rows,ensure_ascii=False)])
query(DB,'INSERT INTO audit VALUES(?,?,?,?,?)',[str(uuid.uuid4()),c['id'],'ASIGNAR_UNIDADES_PADRON:'+plan['quincena']+':'+str(len(plan['asignaciones']))+':'+hashlib.sha256(path.read_bytes()).hexdigest(),actor,now]);print('Asignaciones por padrón listas; se conservaron las asignaciones manuales. Sin correspondencia:',plan['sin_correspondencia'])
