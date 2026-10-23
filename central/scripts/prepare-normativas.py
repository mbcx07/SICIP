#!/usr/bin/env python3
"""Prepare a private import bundle: original files plus page text. Never run macros.
Usage: prepare-normativas.py attachments_directory output_directory
PDF text/OCR is untrusted source material, indexed only as data.
"""
from pathlib import Path
import hashlib,json,sys,fitz,subprocess,concurrent.futures
ROOT=Path(__file__).resolve().parents[1]
PDFS={'1A74-003-025.pdf':('1A74-003-025','Trámite y otorgamiento de vacaciones','CCT / Estatuto','2023'), '1A74-003-023.pdf':('1A74-003-023','Autorización de guardias','CCT / Estatuto','2024'), '1A74-003-037.pdf':('1A74-003-037','Autorización de nivelación a plaza superior','CCT','2023'), '1A74-003-034.pdf':('1A74-003-034','Control de asistencia, puntualidad y sustituciones','CCT / Estatuto','2023'), '1A74-003-032.pdf':('1A74-003-032','Modificación de horarios institucionales','CCT / Estatuto','2024'), '1A74-003-031.pdf':('1A74-003-031','Autorización de tiempo extraordinario','CCT / Estatuto','2023'), '1A74-003-033.pdf':('1A74-003-033','Bajas, altas y cambios en nómina ordinaria','CCT / Estatuto','2023'), '1A75-003-010.pdf':('1A75-003-010','Operación de Bolsa de Trabajo','CCT / Programa IMSS-BIENESTAR','2024'), 'CONTRATO COLECTIVO DE TRABAJO 2025-2027.pdf':('CCT-2025-2027','Contrato Colectivo de Trabajo 2025–2027','CCT','2025-2027'), 'Oficioa Circular 274_Vac CCT 2027.pdf':('CIRCULAR-274-2027','Programación de vacaciones CCT y tablas de roles 2027','CCT','2027'), 'Oficio Circular 273_Vac Estatuto Confianza A 2027.pdf':('CIRCULAR-273-2027','Programación de vacaciones Estatuto Confianza A y tablas de roles 2027','Estatuto','2027'), 'Instructivo de Operación Cubre vacaciones 2027.pdf':('INSTRUCTIVO-CV-2027','Operación de cobertura con plazas TP 14 cubre-vacaciones','CCT / TP 14','2027'), 'Lineamietos programación Cubre Vaciones 2027.pdf':('LINEAMIENTOS-CV-2027','Lineamientos de programación de cobertura cubre-vacaciones','CCT / TP 14','2027')}
def prepare(attachments,out):
 out.mkdir(parents=True,exist_ok=True);tess=Path('/workspace/sicip-env/tessdata');manifest=[]
 def ocr(path,page,ident):
  cache=out/f'{ident}-{page+1}-ocr.txt'
  if cache.exists():return cache.read_text()
  doc=fitz.open(path);p=doc[page];best=''
  for angle in [0,90]:
   img=out/f'{ident}-{page+1}-{angle}.png';p.get_pixmap(matrix=fitz.Matrix(2.5,2.5).prerotate(angle)).save(str(img));args=['tesseract',str(img),'stdout','--tessdata-dir',str(tess),'-l','spa','--psm','3'];r=subprocess.run(args,capture_output=True,text=True,check=True);img.unlink();txt=r.stdout
   if len(txt)>len(best):best=txt
   if len(best)>200:break
  cache.write_text(best);return best
 for name,meta in PDFS.items():
  found=list(attachments.rglob(name));assert len(found)==1,(name,'must have one source');path=found[0];raw=path.read_bytes();sha=hashlib.sha256(raw).hexdigest();ident=meta[0].lower()+'-'+sha[:12];doc=fitz.open(path)
  pages=[{'pagina':i+1,'texto':p.get_text(sort=True),'ocr':False} for i,p in enumerate(doc)]
  missing=[i for i,p in enumerate(pages) if len(p['texto'].strip())<80]
  with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
   for i,txt in zip(missing,pool.map(lambda i:ocr(path,i,ident),missing)):
    pages[i]={'pagina':i+1,'texto':txt,'ocr':True}
  entry=dict(id=ident,clave=meta[0],titulo=meta[1],ambito=meta[2],version=meta[3],nombre=name,mime='application/pdf',bytes=len(raw),sha256=sha,paginas=len(doc),privado=0,ocr=int(any(p['ocr'] for p in pages)),path=str(path))
  (out/(ident+'.json')).write_text(json.dumps({'documento':entry,'paginas':pages},ensure_ascii=False));manifest.append(entry);print('Preparado',meta[0],len(pages),'páginas',len(missing),'OCR',flush=True)
 for path in attachments.rglob('*'):
  if path.suffix.lower() not in ['.xlsx','.xlsm']:continue
  raw=path.read_bytes();sha=hashlib.sha256(raw).hexdigest();ident='excel-'+sha[:16];entry=dict(id=ident,clave='REFERENCIA-HISTORICA',titulo=path.stem+' · archivo histórico con datos personales',ambito='Referencia histórica · sólo Administración',version='HISTORICO',nombre=path.name,mime='application/vnd.ms-excel.sheet.macroEnabled.12' if path.suffix.lower()=='.xlsm' else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',bytes=len(raw),sha256=sha,paginas=0,privado=1,ocr=0,path=str(path));(out/(ident+'.json')).write_text(json.dumps({'documento':entry,'paginas':[{'pagina':1,'texto':entry['titulo']+'. Herramienta o base histórica aportada por el usuario. No es normativa vigente. No se indexan nombres, matrículas ni celdas personales.','ocr':False}]},ensure_ascii=False));manifest.append(entry)
 note='Aclaración operativa confirmada por el usuario el 23 de octubre de 2026. Tipo de plaza TP 13: plaza cubre descansos. Tipo de plaza TP 14: plaza cubre vacaciones. Fuente: aclaración expresa del responsable del sistema. Se conserva la contradicción de páginas 144 y 199 de 1A75-003-010 como antecedente. El Instructivo y los Lineamientos de cubre-vacaciones 2027 confirman TP 14. Esta nota no es un oficio ni modifica el PDF original.'
 raw=note.encode();path=out/'aclaracion-tp13-tp14.txt';path.write_bytes(raw);sha=hashlib.sha256(raw).hexdigest();ident='aclaracion-tp-'+sha[:12];entry=dict(id=ident,clave='ACLARACION-TP-13-14',titulo='Aclaración operativa TP 13 cubre descansos y TP 14 cubre vacaciones',ambito='Aclaración del usuario · no es normativa',version='2026-10-23',nombre=path.name,mime='text/plain; charset=utf-8',bytes=len(raw),sha256=sha,paginas=1,privado=0,ocr=0,path=str(path));(out/(ident+'.json')).write_text(json.dumps({'documento':entry,'paginas':[{'pagina':1,'texto':note,'ocr':False}]},ensure_ascii=False));manifest.append(entry)
 (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print('Biblioteca:',len(manifest),'documentos',flush=True)
if __name__=='__main__':prepare(Path(sys.argv[1]),Path(sys.argv[2]))
