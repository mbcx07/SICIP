"""Add official calls without replacing existing calls, cuadros, candidates or applications."""
import json,datetime
from pathlib import Path
from cloud import query
DB='f357c36f-3a7e-4e53-b575-0dd5ccb76796'
rows=json.loads((Path(__file__).resolve().parents[1]/'src/convocatorias-seed.json').read_text());assert len(rows)==len({r['id'] for r in rows})
existing={r['id']:r for r in query(DB,'SELECT id,hash,payload FROM convocatorias')[0]['results']}
for c in rows:
 if c['id'] in existing:
  old=existing[c['id']];assert old['hash']==c['sha256'] and json.loads(old['payload'])==c,'Convocatoria existente con cambios: revisar y respaldar antes de actualizar '+c['id']
query(DB,"INSERT INTO convocatorias(id,plaza,inicio,fin,fecha_emision,payload,hash,updated_at) SELECT json_extract(value,'$.id'),json_extract(value,'$.plaza'),json_extract(value,'$.inicio'),json_extract(value,'$.fin'),json_extract(value,'$.fecha_emision'),value,json_extract(value,'$.sha256'),? FROM json_each(?) WHERE true ON CONFLICT(id) DO NOTHING",[datetime.datetime.now(datetime.timezone.utc).isoformat(),json.dumps(rows,ensure_ascii=False)])
print('Convocatorias agregadas sin reemplazar registros existentes.')
