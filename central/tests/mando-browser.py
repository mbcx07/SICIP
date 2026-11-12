"""Synthetic mando roster in all searches; harness: SICIP_TEST_MANDO=1 SICIP_TEST_ADMIN_ACCOUNTS=1."""
import asyncio
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);errors=[]
  for mat in ['TESTADMIN','TESTJEFE','TESTUSER']:
   c=await b.new_context(viewport={'width':1300,'height':950});await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));await p.goto(H+'/login');await p.locator('input[type=text]').first.fill(mat);await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.locator('nav.sidebar').wait_for();await p.evaluate('SICIPCentral.load()');jefes=await p.evaluate("SICIPCentral.collection('jefesServicio')");assert any(j['matricula']=='TESTJEFE' and j['descripcion']=='Jefe de Departamento' for j in jefes),mat
   data=await p.evaluate('({user:SICIPCentral.user,people:SICIPCentral.current.counts.personas})');assert data['people']==3,data
   if mat=='TESTADMIN':
    assert data['user']['rol']=='ADMIN' and data['user']['unidadNombre']=='Departamento de Personal del OOAD';await p.goto(H+'/pases/index.html?scope=trabajador');await p.locator('#workerBox').wait_for();await p.get_by_text('Unidad asignada al trabajador: Departamento de Personal del OOAD',exact=False).wait_for();assert await p.locator('[data-suplente-unit]').count()==0
   if mat=='TESTUSER':
    await p.goto(H+'/pases/index.html?scope=trabajador');search=p.locator('.signer-search input[type=search]').first;await search.wait_for();await search.fill('TESTJEFE');option=p.get_by_role('option',name='ANA MARÍA PÉREZ PRUEBA · TESTJEFE · Jefe de Departamento',exact=True);await option.click();assert await p.locator('#jefeMatricula').input_value()=='TESTJEFE';assert 'Jefe de Departamento' in await p.locator('[data-signer-summary]').first.inner_text()
   print(mat,'mando visible como jefe; permisos y directorio correctos.',flush=True);await c.close()
  assert not errors,errors;await b.close()
asyncio.run(main())
