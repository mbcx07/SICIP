"""One-time preservation of the existing unit catalog; never assigns workers or overwrites central edits."""
import sys,json,datetime,urllib.request
from cloud import query
DB='f357c36f-3a7e-4e53-b575-0dd5ccb76796'
with urllib.request.urlopen('https://firestore.googleapis.com/v1/projects/sicip-bcs/databases/(default)/documents/unidades?pageSize=500',timeout=30) as response:source=json.load(response)
assert not source.get('nextPageToken'),'El catálogo requiere paginación; no se importará parcialmente.'
rows=[]
for doc in source.get('documents',[]):
 f=doc.get('fields',{});clave=f.get('clave',{}).get('stringValue');nombre=f.get('nombre',{}).get('stringValue');assert clave and nombre and len(clave)<=80 and len(nombre)<=250
 rows.append((clave,nombre,0 if f.get('activo',{}).get('booleanValue') is False else 1))
assert rows,'No se encontró el catálogo anterior; no se insertarán nombres inventados.'
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
for clave,nombre,activo in rows:query(DB,'INSERT INTO unidades_servicio(clave,nombre,activo,version,actor,fecha) VALUES(?,?,?,1,?,?) ON CONFLICT(clave) DO NOTHING',[clave,nombre,activo,'preservacion-catalogo-existente',now])
print('Catálogo anterior preservado:',len(rows),'unidades; sin sobrescribir nombres centrales ni asignar trabajadores.')
