"""Extract public rate tables and calculation references only; never imports workers or executes VBA."""
import argparse,hashlib,json,math
from pathlib import Path
import openpyxl
p=argparse.ArgumentParser();p.add_argument('nivelacion',type=Path);p.add_argument('conceptos',type=Path);p.add_argument('destino',type=Path);p.add_argument('--reintegro',type=Path);a=p.parse_args()
meta=lambda f:{'archivo':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
n=openpyxl.load_workbook(a.nivelacion,data_only=True);s=n['TABULADOR'];rows=[]
for r in range(3,s.max_row+1):
 if not isinstance(s.cell(r,3).value,str) or not isinstance(s.cell(r,5).value,(int,float)):continue
 rows.append({'categoria':s.cell(r,3).value.strip(),'puesto':str(s.cell(r,2).value),'fila':r,'valores':{k:float(s.cell(r,c).value or 0) for k,c in {'sueldo':5,'011':6,'013':7,'014':8,'015':9,'054':12,'057':13,'058':14,'smi':25}.items()}})
age={str(r[0]):r[1] for r in n['CAPTURA'].iter_rows(min_row=45,max_row=84,min_col=2,max_col=3,values_only=True)}
c=openpyxl.load_workbook(a.conceptos,data_only=True);s=c['TABULADOR 26-27'];headers=[str(s.cell(1,col).value) for col in range(2,25)];ct=[]
for r in range(2,745):
 cat=s.cell(r,1).value
 if not isinstance(cat,str):continue
 vals={k:s.cell(r,col).value for col,k in enumerate(headers,2) if isinstance(s.cell(r,col).value,(int,float)) and not isinstance(s.cell(r,col).value,bool)}
 assert all(math.isfinite(v) and v>=0 for v in vals.values())
 ct.append({'categoria':cat.strip(),'valores':vals,'fila_origen':r,'completo':len(vals)==23})
assert len({x['categoria'] for x in rows})==len(rows)
# Duplicate labels in the source stay distinct by source row; never silently choose the first.
out={'version':'2026-2027-v1','nombre':'Tabuladores 2026–2027 · archivos aportados','nivelacion':{**meta(a.nivelacion),'hoja':'TABULADOR','filas':rows,'antiguedad_dias':age},'conceptos':{**meta(a.conceptos),'hoja':'TABULADOR 26-27','filas':ct},'observaciones':['Categorías con columnas ausentes: sólo se calculan conceptos cuya tarifa exista. No se completan importes con cero.','La calculadora original de nivelación repite CPTO 50/20 del titular en el suplente y omite CPTO 61 del suplente en la base de antigüedad. La captura nueva usa conceptos 50/20 separados por confirmación del usuario; las demás bases conservan el Excel.']}
if a.reintegro:
 rw=openpyxl.load_workbook(a.reintegro,data_only=True);rs=rw['TABULADOR'];rr=[]
 for r in range(4,rs.max_row+1):
  if isinstance(rs.cell(r,4).value,str) and isinstance(rs.cell(r,7).value,(int,float)):
   rr.append({'categoria':rs.cell(r,4).value.strip(),'fila':r,'valores':{k:float(rs.cell(r,c).value or 0) for k,c in {'sueldo':7,'011':8,'015':11}.items()}})
 out['reintegro']={**meta(a.reintegro),'hoja':'TABULADOR','filas':rr,'justificaciones':[row[0] for row in rw['JUSTIFICACIONES'].iter_rows(values_only=True) if isinstance(row[0],str)],'observaciones':['El encabezado interno dice 2025–2026, aunque el archivo fue aportado como 2026–2027. Se conserva la fuente y se requiere revisión de vigencia.','CAPTURA N23:P23 usa columnas distintas de las etiquetas 002/011/015 y F35 contiene una referencia errónea. La inclusión automática se conserva para revisión; el reintegro usa el importe del descuento confirmado.']}
a.destino.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n');print('Extraído sin padrón:',len(rows),'nivelación;',len(ct),'conceptos,',sum(x['completo'] for x in ct),'completas.')
