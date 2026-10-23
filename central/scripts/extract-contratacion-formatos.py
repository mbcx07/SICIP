import zipfile,json,re,base64
from lxml import etree as E
from pathlib import Path
import argparse
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--out',type=Path,default=Path(__file__).resolve().parents[1]/'src/contratacion-formatos.json');args=p.parse_args();src=args.source;z=zipfile.ZipFile(src);ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def col(s):
 n=0
 for c in s:n=n*26+ord(c)-64
 return n
rels=E.fromstring(z.read('xl/_rels/workbook.xml.rels'));paths={r.get('Id'):r.get('Target').lstrip('/')for r in rels};book=E.fromstring(z.read('xl/workbook.xml'));styles=E.fromstring(z.read('xl/styles.xml'));xfs=styles.find('m:cellXfs',ns);borders=styles.find('m:borders',ns)
strings=[''.join(si.itertext()) for si in E.fromstring(z.read('xl/sharedStrings.xml'))];result={}
for name,start,end,first,last in [('CONTRATO',124,145,1,21),('TIEMPO EXTRA',95,118,40,59)]:
 sheet=next(s for s in book.find('m:sheets',ns)if s.get('name')==name);path=paths[sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')];root=E.fromstring(z.read(path if path.startswith('xl/')else 'xl/'+path));merges=[]
 for m in root.findall('m:mergeCells/m:mergeCell',ns):
  a,b=m.get('ref').split(':');ac,ar=re.match(r'([A-Z]+)(\d+)',a).groups();bc,br=re.match(r'([A-Z]+)(\d+)',b).groups()
  if start<=int(ar)<=end and first<=col(ac)<=last:merges.append([int(ar),col(ac),int(br),col(bc)])
 rows=[]
 for row in root.findall('m:sheetData/m:row',ns):
  r=int(row.get('r'))
  if not start<=r<=end:continue
  cells=[]
  for c in row:
   ref=c.get('r');cc=col(re.match('[A-Z]+',ref)[0])
   if not first<=cc<=last:continue
   xf=xfs[int(c.get('s','0'))];border=borders[int(xf.get('borderId','0'))];edges={edge:bool(border.find('m:'+edge,ns)is not None and border.find('m:'+edge,ns).get('style'))for edge in ['left','right','top','bottom']};v=c.find('m:v',ns);value=v.text if v is not None else '';label=(strings[int(value)] if c.get('t')=='s' and value else value) if c.find('m:f',ns) is None else ''
   cells.append({'ref':ref,'c':cc,'label':str(label)if label is not None else '', 'edges':edges})
  rows.append({'r':r,'height':float(row.get('ht','15')),'cells':cells})
 widths=[8.43]*(last-first+1)
 for c in root.findall('m:cols/m:col',ns):
  for n in range(max(first,int(c.get('min'))),min(last,int(c.get('max')))+1):widths[n-first]=float(c.get('width','8.43'))
 result[name]={'start':start,'end':end,'first':first,'last':last,'merges':merges,'rows':rows,'widths':widths}
# All cells containing source workers/names/dates are bindings, not public labels.
for name,keys in [('CONTRATO',['A133','I133','Q133','A136','B136','C136','D136','F136','G136','I136','K136','L136','O136','R136','S136','U136','D142','I142','A143']),('TIEMPO EXTRA',['AN104','AT104','BA104','AN107','AO107','AQ107','AR107','AT107','AW107','AY107','BA107','AS113','AV113','AN114','AN115','AN116','AN117','AP117'])]:
 for row in result[name]['rows']:
  for c in row['cells']:
   if c['ref']in keys:c['label']=''
for name,drawing,rid in [('CONTRATO','drawing3','rId5'),('TIEMPO EXTRA','drawing4','rId2')]:
 rels=E.fromstring(z.read('xl/drawings/_rels/'+drawing+'.xml.rels'));target=next(r.get('Target')for r in rels if r.get('Id')==rid);result[name]['logo']='data:image/jpeg;base64,'+base64.b64encode(z.read('xl/'+target.removeprefix('../'))).decode()
args.out.write_text(json.dumps(result,ensure_ascii=False,indent=1))
print({k:sum(r['height']for r in v['rows'])for k,v in result.items()})
