"""Admin publishes shared order; another device and a restricted user receive it without new permissions."""
import asyncio
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);errors=[]
  async def login(width,mat):
   c=await b.new_context(viewport={'width':width,'height':1200 if width==1280 else 844});await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));await p.goto(H+'/login');await p.locator('input[type=text]').first.fill(mat);await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.wait_for_function('window.SICIPCentral?.user&&window.SICIPMenuOrden');return c,p
  c2,other=await login(1280,'TESTUSER')
  for width in [1280,390]:
   c,p=await login(width,'TESTADMIN');await p.goto(H+'/admin?seccion=menu');await p.get_by_role('heading',name='Orden del menú lateral',exact=True).wait_for();await p.locator('[data-menu-status]').filter(has_text='versión').wait_for();assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.screenshot(path=f'/tmp/menu-editor-{width}.png');group=p.locator('[data-menu-group=principal]');await group.locator('[data-menu-item=personal] [data-menu-up]').click();assert 'Cambios pendientes' in await p.locator('[data-menu-status]').inner_text();await p.locator('[data-menu-reset]').click()
   # Drag on desktop; accessible movement buttons on phones.
   first=group.locator('[data-menu-item=inicio]');last=group.locator('[data-menu-item=administracion]')
   if width==1280:
    await first.scroll_into_view_if_needed();await last.drag_to(first)
   else:
    for _ in range(7):await group.locator('[data-menu-item=administracion] [data-menu-up]').click()
   assert await group.locator('[data-menu-item]').first.get_attribute('data-menu-item')=='administracion'
   personal=p.locator('[data-menu-group=personal]');
   for _ in range(3):await personal.locator('[data-menu-item="personal.recepcion"] [data-menu-up]').click()
   assert await personal.locator('[data-menu-item]').first.get_attribute('data-menu-item')=='personal.recepcion'
   for g,id,steps in [('cuadros','cuadros.postular',1),('solicitudes','solicitudes.pecv',1),('jefe','jefe.cobertura.nueva',1),('personal.herramientas','personal.herramientas.reintegro',2)]:
    for _ in range(steps):await p.locator('[data-menu-group="'+g+'"] [data-menu-item="'+id+'"] [data-menu-up]').click()
   await p.locator('[data-menu-save]').click();await p.locator('[data-menu-status]').filter(has_text='Orden guardado. Se aplica').wait_for();version=await p.evaluate('SICIPMenuOrden.version');await p.wait_for_function("document.querySelector('[data-menu-id=administracion]')?.style.order==='0'")
   for id in ['cuadros.postular','solicitudes.pecv','jefe.cobertura.nueva','personal.herramientas.reintegro']:
    await p.wait_for_function('(id)=>[...document.querySelectorAll("nav.sidebar [data-menu-id]")].some(n=>n.dataset.menuId===id&&n.style.order==="0")',arg=id)
   if width<768:await p.locator('[aria-controls=sicip-sidebar]').click()
   await p.locator('[data-sicip-depto-btn]').click();await p.locator('[data-tools-toggle]').click();await p.locator('[data-tools-sub]').wait_for();await p.locator('[data-tools-toggle]').click();await p.locator('[data-tools-sub]').wait_for(state='hidden');await p.wait_for_function("document.querySelector('[data-sicip-depto-sub=recepciones]')?.style.order==='0'");await p.locator('[data-sicip-depto-sub=recepciones]').click();await p.locator('#sicip-recep-selector').wait_for();assert await p.get_by_role('button',name='Volver',exact=False).count()==0;await p.get_by_text('Buscar por Folio',exact=True).click();assert await p.get_by_role('button',name='Volver',exact=False).count()==0;await p.get_by_text('Registrar manualmente',exact=True).click();assert await p.get_by_role('button',name='Volver',exact=False).count()==0;await p.locator('#sicip-recep-tipo').wait_for();assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.screenshot(path=f'/tmp/menu-orden-recepcion-{width}.png')
   await other.wait_for_function('(v)=>SICIPMenuOrden.version===v',arg=version,timeout=22000);assert not await other.locator('[data-sicip-depto-btn]').is_visible();assert await other.locator('[data-menu-id=inicio]').evaluate('(e)=>Number(e.style.order)>0');assert await other.evaluate("fetch('/api/admin/menu/orden').then(r=>r.status)")==403
   # Fresh session gets the published order, not local storage.
   await p.goto(H+'/admin?seccion=menu');await p.locator('[data-menu-group=principal] [data-menu-item]').first.wait_for();assert await p.locator('[data-menu-group=principal] [data-menu-item]').first.get_attribute('data-menu-item')=='administracion';await c.close();print(f'{width}: orden de módulos/submódulos publicado, persistente y compartido; permisos intactos y recepción sin Volver.',flush=True)
  await c2.close();assert not errors,errors;await b.close()
asyncio.run(main())
