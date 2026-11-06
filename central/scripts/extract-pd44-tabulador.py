"""Read only the structured rate table. Never executes VBA or imports employee sheets."""
import argparse,hashlib,json,math
from pathlib import Path
import openpyxl
p=argparse.ArgumentParser();p.add_argument('archivo',type=Path);p.add_argument('destino',type=Path);a=p.parse_args()
w=openpyxl.load_workbook(a.archivo,data_only=True,read_only=False);s=w['TABULADOR 25-26'];ref=s.tables['tblTabulador'].ref
from openpyxl.utils.cell import range_boundaries
c0,r0,c1,r1=range_boundaries(ref);headers=[str(s.cell(r0,c).value).strip() for c in range(c0,c1+1)];assert headers[0]=='CATEGORIA' and headers[-1]=='BASE 9'
rows=[]
for r in range(r0+1,r1+1):
 values=[s.cell(r,c).value for c in range(c0,c1+1)];assert isinstance(values[0],str) and all(isinstance(v,(int,float)) and math.isfinite(v) and v>=0 for v in values[1:]);rows.append({'categoria':values[0].strip(),'valores':dict(zip(headers[1:],values[1:])),'fila_origen':r})
assert len({r['categoria'] for r in rows})==len(rows)
result={'nombre':'Conceptos por una vez · tabulador diario 2025–2026 · referencia QNA 2026003','quincena_referencia':'2026003','archivo':a.archivo.name,'sha256':hashlib.sha256(a.archivo.read_bytes()).hexdigest(),'hoja':s.title,'rango':ref,'filas':rows,'advertencia':'La quincena del nombre del archivo no acredita vigencia automática en otras quincenas.'}
a.destino.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n');print('Tabulador extraído:',len(rows),'categorías; sin registros de personas ni macros.')
