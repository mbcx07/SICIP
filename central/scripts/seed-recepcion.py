"""Seed reception types without overwriting administrator edits. Uses configured Cloudflare token."""
import json,subprocess,datetime
from cloud import query,ROOT
rows=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{catalogoInicial}from './src/recepcion-catalogo-seed.mjs';process.stdout.write(JSON.stringify(catalogoInicial()))"],cwd=ROOT))
query('f357c36f-3a7e-4e53-b575-0dd5ccb76796',"INSERT INTO recepcion_catalogo(id,clave,categoria,nombre,orden,actor,fecha) SELECT json_extract(value,'$.id'),json_extract(value,'$.clave'),json_extract(value,'$.categoria'),json_extract(value,'$.nombre'),json_extract(value,'$.orden'),'SISTEMA',? FROM json_each(?) WHERE true ON CONFLICT(clave) DO NOTHING",[datetime.datetime.now(datetime.timezone.utc).isoformat(),json.dumps(rows,ensure_ascii=False)])
print('Catálogo inicial sembrado sin reemplazar cambios administrativos.')
