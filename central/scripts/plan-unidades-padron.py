"""Derive service units from explicit roster jefatura. Preserve manual assignments on application."""
import json,hashlib,collections,sys
from pathlib import Path
s=json.loads(Path(sys.argv[1]).read_text());departments=collections.defaultdict(set);occupied=collections.defaultdict(set);units={}
for z in s['plazas']:
 name=str(z.get('jefatura') or '').strip()
 if not name or name in ['BECADOS']:continue
 key='QNA-'+hashlib.sha256(name.encode()).hexdigest()[:16];units[key]={'clave':key,'nombre':name};departments[str(z.get('departamento') or '')].add(key)
 if z.get('ocupante_matricula'):occupied[z['ocupante_matricula']].add(key)
assignments=[];missing=ambiguous=0
for p in s['personas']:
 keys=occupied[p['matricula']] or departments[str(p.get('departamento_padron') or '')]
 if len(keys)==1:assignments.append({'matricula':p['matricula'],'unidad':next(iter(keys))})
 elif keys:ambiguous+=1
 else:missing+=1
plan={'source_hash':s['source_hash'],'quincena':s['quincena'],'unidades':list(units.values()),'asignaciones':assignments,'sin_correspondencia':missing,'ambiguos':ambiguous};Path(sys.argv[2]).write_text(json.dumps(plan,ensure_ascii=False));print('Unidades explícitas:',len(units),'asignaciones:',len(assignments),'sin correspondencia:',missing,'ambiguas:',ambiguous)
