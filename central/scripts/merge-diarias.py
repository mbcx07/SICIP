"""Merge daily XLSX/CSV extracts into a versioned payroll snapshot without repeated events.
Only cached Excel values are read; macros/formulas are never executed. Sparse sheets
are streamed by physical XML row, not by the (sometimes million-row) print range.
"""
import argparse,collections,csv,datetime,hashlib,importlib.util,json,re,unicodedata,xml.etree.ElementTree as ET
from decimal import Decimal,InvalidOperation
from pathlib import Path
import openpyxl
spec=importlib.util.spec_from_file_location('historical_normalizer',Path(__file__).with_name('normalize-historial.py'));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
NS='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',str(s or '').strip().lower()) if not unicodedata.combining(c))
def numeric_id(v):
 s=mod.text(v)
 try:
  d=Decimal(s)
  if d.is_finite() and d==d.to_integral():return format(d.quantize(Decimal(1)),'f')
 except InvalidOperation:pass
 return s

def date(v):
 if isinstance(v,str) and re.fullmatch(r'\d{4,5}(?:\.\d+)?',v) and 30000<float(v)<73050:return mod.fecha(float(v))
 s=mod.text(v)
 if re.match(r'^\d{4}-\d{2}-\d{2}T',s):return datetime.date.fromisoformat(s[:10]).isoformat()
 return mod.fecha(v)
def key(mid,r):
 if r['clase']!='INCIDENCIA':return 't:'+r['id']
 ref=numeric_id(r.get('referencia'))
 identity=[mid,r['inicio'],r['concepto'],ref,numeric_id(r.get('plaza')),numeric_id(r.get('puesto'))]
 if not ref or ref=='0':identity += [r.get('duracion'),r.get('horario'),r.get('turno')]
 return 'i:'+hashlib.sha256(json.dumps(identity,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def group_key(mid,r):return (mid,r['inicio'],r['concepto'],numeric_id(r.get('plaza')),numeric_id(r.get('puesto')))
def core(r):return {k:r.get(k) for k in ['concepto','inicio','fin','duracion','plaza','puesto','jornada','horario','turno','sustituye','plaza_sustituida','puesto_sustituido','referencia','estado_origen']}
def xml_rows(sheet):
 with sheet._get_source() as src:
  for _,node in ET.iterparse(src,events=['end']):
   if node.tag!=NS+'row':continue
   row={};number=int(node.attrib.get('r',0))
   for cell in node.findall(NS+'c'):
    address=cell.attrib.get('r','A1');letters=re.match('[A-Z]+',address)[0];col=0
    for c in letters:col=col*26+ord(c)-64
    kind=cell.attrib.get('t');v=cell.findtext(NS+'v')
    if kind=='s' and v is not None:v=sheet._shared_strings[int(v)]
    elif kind=='inlineStr':v=''.join(cell.itertext())
    elif kind=='b':v=v=='1'
    if v is not None:row[col-1]=v
   if row:yield number,row
   node.clear()
def sources(path):
 if path.suffix.lower()=='.csv':
  raw=path.read_bytes();encoding='utf-16' if raw[:2] in [b'\xff\xfe',b'\xfe\xff'] else 'utf-8-sig'
  try:raw.decode(encoding)
  except UnicodeDecodeError:encoding='cp1252'
  with path.open(encoding=encoding,newline='') as file:
   sample=file.read(8192);file.seek(0);delimiter=csv.Sniffer().sniff(sample,delimiters=',;\t').delimiter
   rows=csv.reader(file,delimiter=delimiter);yield 'CSV',((i,{j:v for j,v in enumerate(r)}) for i,r in enumerate(rows,1))
 else:
  w=openpyxl.load_workbook(path,read_only=True,data_only=True)
  try:
   for sheet in w:yield sheet.title,xml_rows(sheet)
  finally:w.close()
def daily_fact(r):
 get=lambda k:r.get(norm(k));mid=numeric_id(get('Matricula'));start=date(get('Fecha'));code=mod.codigo(get('Incidencia'))
 if not mid.isdigit() or mid=='0':return None,None,'matricula'
 if not start:return None,None,'fecha'
 if not code or code in ['#N/A','#VALUE!']:return None,None,'incidencia'
 dur=mod.text(get('Duracion'))
 try:duration=float(dur.replace(',',''))
 except ValueError:duration=None
 item={'clase':'INCIDENCIA','concepto':code,'inicio':start,'fin':start,'duracion':duration,'importe':0,'plaza':numeric_id(get('Plaza')),'departamento':mod.text(get('Departamento')),'puesto':numeric_id(get('Puesto')),'jornada':mod.text(get('Jornada')),'horario':mod.text(get('Horario')),'turno':numeric_id(get('inc_cvetur')),'sustituye':numeric_id(get('inc_empsus')),'plaza_sustituida':numeric_id(get('Plaza Sustuituida')),'puesto_sustituido':numeric_id(get('Puesto sustituido')),'referencia':numeric_id(get('Serial')),'estado_origen':mod.text(get('Status')).upper() or 'PENDIENTE_VALIDAR','quincena_origen':numeric_id(get('Quincena')),'fecha_registro':date(get('Fecha de Registro'))}
 item['id']=key(mid,item)[2:];return mid,item,None

def merge(base,files,out,audit):
 old=json.loads(base.read_text());facts={};owners={};counts=collections.Counter();report=[];coverage=dict(old['cobertura']);fuentes=list(old['fuentes']);occurrences=collections.Counter();conflicts=[];buckets=collections.defaultdict(lambda:collections.defaultdict(dict))
 for h in old['historiales']:
  for r in h['registros']:
   k=key(h['matricula'],r)
   if k in facts:counts['duplicados_base']+=1;continue
   facts[k]=(h['matricula'],r);owners[k]=0;buckets[group_key(h['matricula'],r)][(0,0)][k]=True if r['clase']=='INCIDENCIA' else False
 for order,path in enumerate(files,1):
  sha=hashlib.sha256(path.read_bytes()).hexdigest();source={'archivo':path.name,'sha256':sha,'tipo':'INCIDENCIAS_DIARIAS','version_importador':'diarias-v1','hojas':[]};summary={'archivo':path.name,'hojas':[]}
  for sheet_order,(sheet,rows) in enumerate(sources(path),1):
   heads=None;stats=collections.Counter();dates=[];workers=set();units=set();statuses=collections.Counter();invalid=collections.Counter()
   for rownum,values in rows:
    if heads is None:
     labels={i:norm(v) for i,v in values.items()}
     if {'matricula','incidencia','fecha','duracion'}.issubset(labels.values()):heads=labels;continue
     if rownum>30:break
     continue
    r={heads[i]:v for i,v in values.items() if i in heads}
    if not any(mod.text(v) for v in r.values()):continue
    mid,item,error=daily_fact(r)
    if error:invalid[error]+=1;continue
    stats['filas_validas']+=1
    if item['duracion'] is None:stats['duracion_sin_dato']+=1;occurrences[item['concepto']]+=1
    dates.append(item['inicio']);workers.add(mid);units.add(item['departamento']);statuses[item['estado_origen']]+=1
    k=key(mid,item);buckets[group_key(mid,item)][(order,sheet_order)][k]=True;item.update({'archivo':path.name,'hoja':sheet,'fila':rownum});prior=facts.get(k)
    if prior:
     previous_order=owners[k]
     if item['estado_origen']=='PENDIENTE_VALIDAR' and prior[1].get('estado_origen') not in ('','PENDIENTE_VALIDAR',None):
      stats['pendientes_no_sustituyen_confirmados']+=1;continue
     if core(prior[1])==core(item):
      stats['duplicados_identicos']+=1;counts['duplicados_identicos']+=1
      if not previous_order:stats['coinciden_base']+=1
      else:stats['coinciden_nuevos']+=1
      continue
     # A reference can repeat in complementary sheets. Differences are retained
     # in the audit. New extracts outrank the previous snapshot; within a book
     # prefer the entry with the latest registration date, then the later sheet.
     stats['referencias_actualizadas']+=1;counts['referencias_actualizadas']+=1
     conflicts.append({'archivo':path.name,'hoja':sheet,'fila':rownum,'previo_archivo':prior[1]['archivo'],'previo_hoja':prior[1]['hoja'],'id':item['id'],'cambios':[f for f in core(item) if core(item)[f]!=core(prior[1])[f]]})
     if previous_order and (prior[1].get('fecha_registro') or '')>(item.get('fecha_registro') or ''):continue
    else:stats['nuevas']+=1
    facts[k]=(mid,item);owners[k]=order
   sr={'hoja':sheet,**dict(stats),'filas_invalidas':dict(invalid),'desde':min(dates) if dates else None,'hasta':max(dates) if dates else None,'trabajadores':len(workers),'departamentos':len(units),'estados':dict(statuses),'omitida_sin_encabezado':heads is None};summary['hojas'].append(sr);source['hojas'].append(sheet)
   if dates:coverage[path.name+' / '+sheet]={k:sr[k] for k in ['desde','hasta','filas_invalidas','trabajadores','departamentos']}
  report.append(summary);fuentes.append(source);print(json.dumps(summary,ensure_ascii=False),flush=True)
 # Some historical exports regenerated Serial. Never add two extracts of the
 # same worker/day/concept/job. Retain the largest explicitly observed event
 # set from a single sheet, preferring the new extract on equal cardinality.
 # Thus two legitimate events in one extract remain two, not one.
 keep={k for k,(mid,r) in facts.items() if r['clase']=='TRANSACCION'}
 for g,origins in buckets.items():
  eligible={source:{k for k,valid in keys.items() if valid and k in facts and facts[k][1]['clase']=='INCIDENCIA'} for source,keys in origins.items()}
  confirmed={source:{k for k in keys if facts[k][1].get('estado_origen')=='V'} for source,keys in eligible.items()}
  if any(confirmed.values()):eligible=confirmed
  eligible={source:keys for source,keys in eligible.items() if keys}
  if eligible:keep.update(max(eligible.items(),key=lambda pair:(len(pair[1]),pair[0]))[1])
 # Preserve unconfirmed origin states as evidence, outside V-based statistics.
 keep.update(k for k,(mid,r) in facts.items() if r['clase']=='INCIDENCIA' and r.get('estado_origen') in ('E','I','PENDIENTE_VALIDAR'))
 counts['repetidos_entre_extracciones']=sum(r['clase']=='INCIDENCIA' for mid,r in facts.values())-sum(facts[k][1]['clase']=='INCIDENCIA' for k in keep)
 facts={k:value for k,value in facts.items() if k in keep}
 groups=collections.defaultdict(list)
 for mid,r in facts.values():groups[(mid,int(r['inicio'][:4]))].append(r);counts[r['clase']]+=1
 result={'fuentes':fuentes,'cobertura':coverage,'conteos':dict(counts),'trabajadores':len({mid for mid,y in groups}),'historiales':[{'matricula':m,'anio':y,'registros':sorted(rows,key=lambda r:(r['inicio'],r['clase'],r['id']))} for (m,y),rows in sorted(groups.items())]}
 out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
 audit.write_text(json.dumps({'archivos':report,'conteos':dict(counts),'trabajadores':result['trabajadores'],'duraciones_sin_dato_por_concepto':dict(occurrences),'referencias_actualizadas':conflicts},ensure_ascii=False,indent=2))
 print(json.dumps({'conteos':dict(counts),'trabajadores':result['trabajadores'],'historiales':len(groups)},ensure_ascii=False),flush=True)
 return result
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('base',type=Path);p.add_argument('lista',type=Path);p.add_argument('salida',type=Path);p.add_argument('--auditoria',type=Path,required=True);a=p.parse_args();merge(a.base,[Path(x) for x in json.loads(a.lista.read_text())],a.salida,a.auditoria)
