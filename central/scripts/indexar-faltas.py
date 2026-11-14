"""Materialize active daily absence dates for scalable ranking; keep legacy source intact."""
import argparse,datetime,json,sys
from pathlib import Path
from cloud import query
p=argparse.ArgumentParser();p.add_argument('historial',type=Path);p.add_argument('--database',required=True);p.add_argument('--carga',required=True);p.add_argument('--anteriores',type=Path);a=p.parse_args();root=Path(__file__).resolve().parents[1];query(a.database,(root/'migrations/20261114_ranking_faltas.sql').read_text())
s=json.loads(a.historial.read_text());events={}
for h in s['historiales']:
 for r in h['registros']:
  if r['clase']=='INCIDENCIA' and r['concepto'] in ['72','E71','E72','E73'] and (not r.get('estado_origen') or r['estado_origen']=='V'):events[(h['matricula'],r['inicio'])]=r['concepto']
rows=[{'matricula':m,'fecha':d,'concepto':c} for (m,d),c in sorted(events.items())]
for i in range(0,len(rows),500):query(a.database,"INSERT INTO historial_faltas SELECT ?,json_extract(value,'$.matricula'),json_extract(value,'$.fecha'),json_extract(value,'$.concepto') FROM json_each(?) WHERE 1 ON CONFLICT(carga,matricula,fecha) DO NOTHING",[a.carga,json.dumps(rows[i:i+500])])
r=query(a.database,'SELECT COUNT(*) total FROM historial_faltas WHERE carga=?',[a.carga])[0]['results'][0];assert r['total']==len(events),r
old=0
if a.anteriores:
 docs=json.loads(a.anteriores.read_text()).get('documents',[])
 for doc in docs:
  fields=doc.get('fields',{});v=lambda k:fields.get(k,{}).get('stringValue',str(fields.get(k,{}).get('integerValue','')));mat=v('matricula');fecha=v('fecha')[:10];assert mat and fecha and datetime.date.fromisoformat(fecha);payload={'observaciones':v('observaciones'),'origen':'Registro anterior de Personal'};query(a.database,"INSERT INTO faltas_anteriores VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET matricula=excluded.matricula,fecha=excluded.fecha,estado=excluded.estado,payload=excluded.payload",[doc['name'].split('/')[-1],mat,fecha,v('estado') or 'REGISTRADA',json.dumps(payload)]);old+=1
query(a.database,"INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",['faltas_indice:'+a.carga,str(len(events))]);print(json.dumps({'dias_unicos_nomina':len(events),'registros_anteriores':old,'carga':a.carga}),flush=True)
