"""Run with SICIP_TEST_ADMIN_ACCOUNTS=1 SICIP_TEST_HISTORY=1 local harness; synthetic only."""
import asyncio
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in (1280,390):
   c=await b.new_context(viewport={'width':width,'height':900});await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   await p.goto(H+'/login');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.wait_for_function('window.SICIPCentral?.user&&window.SICIPModuleHost');await p.evaluate('window.SICIPCentral.load()')
   await p.evaluate('''()=>{const panel=document.createElement('section');panel.dataset.searchTest='';panel.innerHTML='<form><label>Trabajador<input name="matricula" inputmode="numeric" list="old-list"></label><datalist id="old-list"></datalist><button type="submit">Consultar trabajador</button></form><label>Inmutable<input name="trabajador" readonly value="TESTADMIN"></label>';window.SICIPModuleHost.mount(panel);window.reads=0;window.changes=0;const form=panel.querySelector('form');form.onsubmit=e=>{e.preventDefault();window.reads++};form.matricula.onchange=()=>window.changes++;}''')
   panel=p.locator('[data-search-test]');field=panel.locator('input[name=matricula]');await field.wait_for();await p.wait_for_function('document.querySelector("[data-search-test] input").dataset.workerSearchBound==="1"');assert await field.get_attribute('inputmode')=='text';assert await field.get_attribute('list') is None
   for q in ('Juan','TESTUSER','102'):
    await field.fill(q);option=panel.get_by_role('option',name='JUAN CARLOS PEREZ PRUEBA · TESTUSER',exact=False);await option.click();assert await field.input_value()=='TESTUSER';assert await p.evaluate('window.reads')==('Juan','TESTUSER','102').index(q)+1
   assert await p.evaluate('window.changes')>=3;assert await panel.locator('input[readonly]').get_attribute('data-worker-search-bound') is None
   await panel.locator('button[type=submit]').evaluate('(e)=>e.textContent="Consultar y guardar"');await field.fill('102');await panel.get_by_role('option',name='TESTUSER',exact=False).click();assert await p.evaluate('window.reads')==3;await panel.locator('button[type=submit]').evaluate('(e)=>e.textContent="Consultar trabajador"')
   await field.fill('SIN_COINCIDENCIA_ABC');await panel.locator('[role=listbox]').get_by_text('Sin coincidencias',exact=False).wait_for();await field.fill('102');await panel.get_by_role('option',name='JUAN CARLOS',exact=False).wait_for();await field.press('ArrowDown');await p.keyboard.press('Enter');assert await field.input_value()=='TESTUSER'
   await p.evaluate('''async()=>{await import('/sicip-central/contratacion-client.mjs');await window.SICIPContratacion.open(null);}''');form=p.locator('[data-coverage-form]');await form.wait_for()
   for role,q,mat in [('titular','101','TESTADMIN'),('suplente','102','TESTUSER')]:
    picker=form.locator('[data-picker='+role+']');await picker.locator('input').fill(q);await picker.get_by_role('option',name=mat,exact=False).click();await picker.locator('[data-picked]').get_by_text(mat,exact=False).wait_for()
   signer=form.locator('[data-signer=jefe]');await signer.locator('input').fill('101');await signer.get_by_role('option',name='TESTADMIN',exact=False).click();await signer.locator('[data-picked]').get_by_text('TESTADMIN',exact=False).wait_for()
   assert await form.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1');assert not errors,errors
   print('Búsqueda '+str(width)+': nombre/matrícula/plaza sin Enter, selección carga automáticamente, teclado móvil de texto, control readonly conservado, sin coincidencias y recuperación correctas.');await c.close()
  await b.close()
asyncio.run(main())
