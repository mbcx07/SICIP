"""Extrae hechos de BD/BD2/Consulta; no ejecuta macros ni fórmulas del libro."""
import argparse,collections,datetime,hashlib,json,re
from pathlib import Path
import openpyxl

def text(v):
 if v is None:return ''
 if isinstance(v,(int,float)) and float(v).is_integer():return str(int(v))
 return str(v).strip()
def num(v):
 try:return float(str(v).replace(',',''))
 except (ValueError,TypeError):return 0

def fecha(v):
 if isinstance(v,(int,float)) and 1<v<73050:return openpyxl.utils.datetime.from_excel(v).strftime('%Y-%m-%d')
 if isinstance(v,(datetime.datetime,datetime.date)):return v.strftime('%Y-%m-%d')
 s=text(v)
 for f in ['%d/%m/%Y','%d/%m/%y','%Y-%m-%d','%d/%m/%Y %H:%M:%S','%Y-%m-%d %H:%M:%S']:
  try:return datetime.datetime.strptime(s,f).date().isoformat()
  except ValueError:pass
 return None

def codigo(v):
 s=text(v).upper()
 return str(int(s)).zfill(2) if s.isdigit() else s

def extract(ausentismo,transacciones):
 groups=collections.defaultdict(list);sources=[];bad=collections.Counter();seen={};counts=collections.Counter();periods={}
 for path,sheets in [(transacciones,['Consulta']),(ausentismo,['BD','BD2'])]:
  w=openpyxl.load_workbook(path,read_only=True,data_only=True);sha=hashlib.sha256(path.read_bytes()).hexdigest();sources.append({'archivo':path.name,'sha256':sha,'hojas':sheets})
  for sheet in sheets:
   it=w[sheet].iter_rows(values_only=True);heads=[text(v) for v in next(it)];kind='INCIDENCIA' if sheet=='BD2' else 'TRANSACCION';dates=[]
   for rownum,row in enumerate(it,2):
    r=dict(zip(heads,row));mid=text(r.get('Matricula'));start=fecha(r.get('Fecha' if kind=='INCIDENCIA' else 'Fecha inicial'));end=fecha(r.get('Fecha Final')) or start;code=codigo(r.get('Incidencia' if kind=='INCIDENCIA' else 'Concepto'))
    if not mid.isdigit() or not start or not code:bad[sheet]+=1;continue
    if not 1900<int(start[:4])<2100:bad[sheet]+=1;continue
    dates.append(start)
    item={'clase':kind,'concepto':code,'inicio':start,'fin':end,'duracion':num(r.get('Duracion')),'importe':num(r.get('Importe')),'plaza':text(r.get('Plaza')),'departamento':text(r.get('Departamento')),'puesto':text(r.get('Puesto')),'jornada':text(r.get('Jornada')),'horario':text(r.get('Horario actual')) or text(r.get('Horario')),'turno':text(r.get('Clave de turno',r.get('inc_cvetur'))),'sustituye':text(r.get('Empleado sustituto',r.get('inc_empsus'))),'plaza_sustituida':text(r.get('Plaza que sustituye',r.get('Plaza Sustuituida'))),'puesto_sustituido':text(r.get('Puesto Sustituye',r.get('Puesto sustituido'))),'referencia':text(r.get('Transaccion' if kind=='TRANSACCION' else 'Serial')),'estado_origen':text(r.get('Status')),'quincena_origen':text(r.get('Quincena'))}
    # Same programmed transaction may also appear in BD. Preserve distinct lines;
    # only suppress exact canonical duplicates across the overlapping extracts.
    key=hashlib.sha256(json.dumps([mid,kind,code,start,end,item['referencia'],item['plaza'],item['puesto'],item['plaza_sustituida'],item['duracion'],item['importe']],ensure_ascii=False).encode()).hexdigest()
    if key in seen:counts['duplicados_'+kind]+=1;continue
    seen[key]=True;item.update({'id':key,'archivo':path.name,'hoja':sheet,'fila':rownum});groups[(mid,int(start[:4]))].append(item);counts[kind]+=1
   periods[path.name+' / '+sheet]={'desde':min(dates) if dates else None,'hasta':max(dates) if dates else None,'filas_invalidas':bad[sheet]}
 result={'fuentes':sources,'cobertura':periods,'conteos':dict(counts),'trabajadores':len({m for m,y in groups}),'historiales':[{'matricula':m,'anio':y,'registros':sorted(v,key=lambda r:(r['inicio'],r['clase'],r['id']))} for (m,y),v in sorted(groups.items())]}
 return result
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('ausentismo',type=Path);p.add_argument('transacciones',type=Path);p.add_argument('salida',type=Path);a=p.parse_args();r=extract(a.ausentismo,a.transacciones);a.salida.write_text(json.dumps(r,ensure_ascii=False,separators=(',',':')));print(json.dumps({k:v for k,v in r.items() if k!='historiales'},ensure_ascii=False))
