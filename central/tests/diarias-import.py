"""Meaningful import checks: reordered CSV, sparse XLSX, overlap with base, corrections and missing duration."""
import contextlib,importlib.util,io,json,tempfile,unittest
from pathlib import Path
import openpyxl
spec=importlib.util.spec_from_file_location('diarias',Path(__file__).resolve().parents[1]/'scripts/merge-diarias.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class DiariasTests(unittest.TestCase):
 def test_sparse_and_csv_duplicates(self):
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);heads=['Matricula','Incidencia','Fecha','Duracion','Serial','Plaza','Puesto','Status']
   base_row=dict(zip(heads,['123','37','2026-07-20',2,'500','101','CAT1','V']));mat,r,error=m.daily_fact({m.norm(k):v for k,v in base_row.items()});self.assertIsNone(error);r.update(id='old',archivo='base.xlsx',hoja='BD2',fila=2)
   base={'fuentes':[],'cobertura':{},'conteos':{'INCIDENCIA':1,'TRANSACCION':0},'trabajadores':1,'historiales':[{'matricula':mat,'anio':2026,'registros':[r]}]};(d/'base.json').write_text(json.dumps(base))
   w=openpyxl.Workbook();s=w.active;s.title='Original';s.append(heads);s.append(['123','37','20/07/2026',2,500,101,'CAT1','V']);t=w.create_sheet('Complemento');t.append(heads)
   for i,v in enumerate(['123','37','20/07/2026',2,500,101,'CAT1','V'],1):t.cell(999900,i,v)
   bad=w.create_sheet('Notas');bad.append(['No es base de datos']);w.save(d/'julio.xlsx')
   (d/'julio.csv').write_text('Incidencia,Matricula,Serial,Fecha,Status,Duracion,Plaza,Puesto\n37,123,5E2,20/07/2026,V,3.5,101,CAT1\n72,123,501,21/07/2026,V,,101,CAT1\n37,123,502,22/07/2026,C,8,101,CAT1\n',encoding='utf-8-sig')
   with contextlib.redirect_stdout(io.StringIO()):result=m.merge(d/'base.json',[d/'julio.xlsx',d/'julio.csv'],d/'result.json',d/'audit.json')
   rows=result['historiales'][0]['registros'];self.assertEqual(len(rows),3);self.assertEqual(result['conteos']['duplicados_identicos'],2);self.assertEqual(result['conteos']['referencias_actualizadas'],1);self.assertEqual(next(r for r in rows if r['referencia']=='500')['duracion'],3.5);self.assertIsNone(next(r for r in rows if r['concepto']=='72')['duracion']);self.assertEqual(next(r for r in rows if r['referencia']=='502')['estado_origen'],'C');self.assertTrue(json.loads((d/'audit.json').read_text())['archivos'][0]['hojas'][2]['omitida_sin_encabezado']);self.assertEqual(len({m.key(mat,r) for r in rows}),3)
 def test_regenerated_references_keep_distinct_events(self):
  with tempfile.TemporaryDirectory() as tmp:
   d=Path(tmp);(d/'base.json').write_text(json.dumps({'fuentes':[],'cobertura':{},'historiales':[]}));head='Matricula,Incidencia,Fecha,Duracion,Serial,Plaza,Puesto,Status\n'
   (d/'original.csv').write_text(head+'123,37,20/07/2026,2,500,101,CAT1,V\n123,37,20/07/2026,3,501,101,CAT1,V\n')
   (d/'reexportado.csv').write_text(head+'123,37,20/07/2026,2,900,101,CAT1,V\n123,37,20/07/2026,3,901,101,CAT1,V\n')
   (d/'filtro.csv').write_text(head+'123,37,20/07/2026,2,999,101,CAT1,V\n')
   with contextlib.redirect_stdout(io.StringIO()):r=m.merge(d/'base.json',[d/'original.csv',d/'reexportado.csv',d/'filtro.csv'],d/'out.json',d/'audit.json')
   rows=r['historiales'][0]['registros'];self.assertEqual(len(rows),2);self.assertEqual(sum(x['duracion'] for x in rows),5);self.assertEqual({x['referencia'] for x in rows},{'900','901'});self.assertEqual(r['conteos']['repetidos_entre_extracciones'],3)
 def test_auxiliary_without_status_is_not_confirmed(self):
  row={'Matricula':'123','Incidencia':'72','Fecha':'20/07/2026','Duracion':8,'Serial':'500','Plaza':'101','Puesto':'CAT1'}
  _,r,error=m.daily_fact({m.norm(k):v for k,v in row.items()});self.assertIsNone(error);self.assertEqual(r['estado_origen'],'PENDIENTE_VALIDAR')
 def test_identifiers_and_dates(self):
  self.assertEqual(m.numeric_id('1.234E+8'),'123400000');self.assertEqual(m.date('46230'),'2026-07-27');self.assertEqual(m.date('16/10/2026'),'2026-10-16');self.assertEqual(m.norm('Matrícula'),'matricula')
if __name__=='__main__':unittest.main()
