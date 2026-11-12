"""An administrator's personal page must never render another employee's cached history."""
import asyncio
from playwright.async_api import async_playwright
HOST='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=await b.new_context(viewport={'width':1440,'height':1000});await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  await p.goto(HOST+'/login');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.locator('nav.sidebar').wait_for()
  async def api(path,method='GET',d=None):return await p.evaluate('(v)=>window.SICIPCentral.api(v.path,{method:v.method,...(v.d?{body:JSON.stringify(v.d)}:{})})',{'path':path,'method':method,'d':d})
  for key in ['A','B']:await api('/api/admin/unidades','POST',{'clave':key,'nombre':'Unidad '+key,'activo':True,'version':0})
  for mat,key in [('TESTADMIN','A'),('TESTUSER','B')]:await api('/api/admin/unidades/asignar','POST',{'unidad':key,'matriculas':[mat]})
  day=(await api('/api/inicio'))['fecha']
  for mat,f in [('TESTADMIN','PROPIO-ADMIN'),('TESTUSER','AJENO-TRABAJADOR')]:await api('/api/pases/registros','POST',{'folio':f,'matricula':mat,'nombre':mat,'fecha':day,'hora':'12:00','tipoAsunto':'PARTICULAR','tipoHorario':'SALIDA','estado':'PENDIENTE_ENTREGA'})
  await api('/api/unidades/preferencias','PUT',{'claves':['B'],'version':0});await api('/api/pases/unidad-preferida','PUT',{'unidad':'A'});allrows=(await api('/api/pases/registros?scope=personal'))['pases']
  await p.goto(HOST+'/pases/index.html?scope=personal');await p.wait_for_function('window.SICIPPasesGestionLista');await p.evaluate('(rows)=>window.SICIPPasesStorage.write(rows)',allrows)
  await c.add_init_script("window.__foreignPassSeen=false;new MutationObserver(()=>{if(document.querySelector('#passesTbody')?.innerHTML.includes('AJENO-TRABAJADOR'))window.__foreignPassSeen=true}).observe(document,{childList:true,subtree:true})")
  async def slow(r):await asyncio.sleep(.5);await r.continue_()
  await p.route('**/api/pases/registros?scope=propio*',slow);await p.goto(HOST+'/pases/index.html?scope=trabajador');await p.locator('[data-pass-edit="PROPIO-ADMIN"]').wait_for();assert 'AJENO-TRABAJADOR' not in await p.locator('#passesTbody').inner_html();assert not await p.evaluate('window.__foreignPassSeen');assert await p.locator('[data-unit-filter],[data-pass-unit]').count()==0;print('Administrador en su módulo personal: sólo su matrícula, incluso con caché ajena y respuesta lenta; sin filtro de unidades.',flush=True)
  await p.goto(HOST+'/pases/index.html?scope=personal');await p.wait_for_function('window.SICIPPasesGestionLista');assert await p.locator('[data-unit-filter]').count()==0;assert await p.locator('[data-pass-unit]').input_value()=='A';assert 'PROPIO-ADMIN' in await p.locator('#passesTbody').inner_html();assert 'AJENO-TRABAJADOR' not in await p.locator('#passesTbody').inner_html();await p.locator('[data-pass-unit]').select_option('B');await p.locator('[data-pass-edit="AJENO-TRABAJADOR"]').wait_for();assert 'PROPIO-ADMIN' not in await p.locator('#passesTbody').inner_html();await p.reload();await p.locator('[data-pass-edit="AJENO-TRABAJADOR"]').wait_for();assert await p.locator('[data-pass-unit]').input_value()=='B'
  await p.goto(HOST+'/pases/index.html?scope=trabajador');await p.locator('[data-pass-edit="PROPIO-ADMIN"]').wait_for();assert 'AJENO-TRABAJADOR' not in await p.locator('#passesTbody').inner_html();assert not await p.evaluate('window.__foreignPassSeen');assert await p.locator('[data-unit-filter]').count()==0;assert not errors,errors;await b.close();print('Personal usa únicamente el combo de unidad, recuerda selección y no aplica el filtro antiguo; al volver al módulo propio se ocultan los pases ajenos.',flush=True)
asyncio.run(main())
