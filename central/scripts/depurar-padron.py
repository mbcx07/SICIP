"""Versioned roster reconciliation. Preserve occupied/titular/mando identities.
Input/output are private snapshots; this script never connects to a live database.
"""
import argparse,collections,json,re,unicodedata
from pathlib import Path

def nombre(value):
 return ' '.join(''.join(c for c in unicodedata.normalize('NFD',str(value or '').upper()) if not unicodedata.combining(c)).replace('/',' ').split())
def identificador(person,key):
 value=re.sub(r'[^A-Z0-9Ñ&]','',nombre(person.get('privado',{}).get(key)))
 pattern=r'[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d' if key=='curp' else r'[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}' if key=='rfc' else r'\d{11}'
 return value if re.fullmatch(pattern,value) and (key!='nss' or len(set(value))>1) else ''
def depurar(snapshot):
 people={p['matricula']:p for p in snapshot['personas']};assert len(people)==len(snapshot['personas']),'Matrículas repetidas dentro del padrón.'
 occupied={z['ocupante_matricula'] for z in snapshot['plazas'] if z.get('ocupante_matricula')};protected=occupied|{z['titular_matricula'] for z in snapshot['plazas'] if z.get('titular_matricula')}|{p['matricula'] for p in people.values() if p.get('nomina_origen')=='MANDO_FEDERAL'}
 index={k:collections.defaultdict(set) for k in ('curp','rfc','nss','nombre')}
 for mid in occupied:
  for key in index:
   value=nombre(people[mid]['nombre']) if key=='nombre' else identificador(people[mid],key)
   if value:index[key][value].add(mid)
 confirmed=[];pending=[]
 for mid,p in people.items():
  if mid in protected:continue
  hits={k:index[k].get(nombre(p['nombre']) if k=='nombre' else identificador(p,k),set()) for k in index};targets=set().union(*hits.values())
  if not targets:continue
  if len(targets)>1:pending.append({'anterior':mid,'candidatos':sorted(targets),'motivo':'VARIAS_IDENTIDADES'});continue
  target=next(iter(targets));matched={k for k,v in hits.items() if target in v};strong=matched-{'nombre'}
  row={'anterior':mid,'vigente':target,'coinciden':sorted(matched),'conflictos':[k for k in ('curp','rfc','nss') if identificador(p,k) and identificador(people[target],k) and identificador(p,k)!=identificador(people[target],k)]}
  safe=('curp' in strong and 'nombre' in matched) or {'curp','rfc'}<=strong or (len(strong)>=2 and 'nombre' in matched)
  (confirmed if safe else pending).append(row)
 removed={r['anterior'] for r in confirmed};result={**snapshot,'personas':[p for p in snapshot['personas'] if p['matricula'] not in removed]};result['counts']={**snapshot['counts'],'personas':len(result['personas'])}
 assert not any(a['matricula'] in removed for a in snapshot.get('antiguedad',[])),'Un duplicado conserva antigüedad propia; revisar antes de depurar.'
 return result,{'confirmados':confirmed,'pendientes':pending}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('entrada',type=Path);parser.add_argument('salida',type=Path);parser.add_argument('--reporte',type=Path,required=True);args=parser.parse_args();assert args.entrada.resolve()!=args.salida.resolve(),'Conservar el archivo de entrada.'
 result,report=depurar(json.loads(args.entrada.read_text()));args.salida.write_text(json.dumps(result,ensure_ascii=False));args.reporte.write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'personas':len(result['personas']),'duplicados_confirmados':len(report['confirmados']),'pendientes':len(report['pendientes'])}))
