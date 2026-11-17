"""Operational receipt entry survives legacy cleanup and honours explicit permissions."""
import asyncio
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']);errors=[]
  async def login(mat,width):
   c=await b.new_context(viewport={'width':width,'height':844},permissions=['camera']);await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));await p.goto(H+'/login');await p.locator('input[type=text]').first.fill(mat);await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.wait_for_function('window.SICIPCentral?.user&&window.SICIPPersonal');return c,p
  async def receipt(p,width):
   if width<768:await p.locator('[aria-controls=sicip-sidebar]').click()
   await p.locator('[data-sicip-depto-btn]').click();button=p.locator('[data-sicip-depto-sub=recepciones]');await button.wait_for();await p.wait_for_timeout(1800);assert await button.is_visible();assert await button.get_attribute('data-access-id')=='personal.recepcion';assert await p.locator('nav.sidebar [data-sicip-depto-sub=recepciones]').count()==1;await button.click();await p.locator('#sicip-recep-selector').wait_for();assert await p.get_by_text('Escanear QR',exact=True).is_visible();await p.get_by_text('Buscar por Folio',exact=True).click();await p.locator('#sicip-recep-folio-input').fill('P-000001')
   async with p.expect_request('**/api/seguimiento/documento?folio=P-000001'):await p.locator('#sicip-recep-folio-input').press('Enter')
   await p.get_by_text('Registrar manualmente',exact=True).click();await p.locator('#sicip-recep-trab-buscar').wait_for();await p.wait_for_function("document.querySelector('#sicip-recep-tipo')?.options.length>1");await p.locator('#sicip-recep-trab-buscar').fill('TESTUSER');await p.get_by_text('Escanear QR',exact=True).click();await p.locator('.sicip-recep-qr-overlay').wait_for();await p.get_by_role('button',name='Cancelar escaneo').click();await p.locator('.sicip-recep-qr-overlay').wait_for(state='detached');assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.screenshot(path=f'/tmp/recepcion-menu-{width}.png')
  for width in [390,1280]:
   c,p=await login('TESTADMIN',width);await receipt(p,width);await c.close();print(f'{width}: menú visible después de limpieza; QR, folio y formulario manual con catálogo disponibles.',flush=True)
  c,a=await login('TESTADMIN',1280)
  await a.evaluate("async()=>{const api=SICIPCentral.api,p=await api('/api/admin/personal/TESTUSER');await api('/api/admin/personal/TESTUSER/accesos',{method:'POST',body:JSON.stringify({request_key:crypto.randomUUID(),version:p.version,rol:'AREA_PERSONAL',activo:true,accesos:['inicio','personal.recepcion']})})}")
  c2,p=await login('TESTUSER',1280);await receipt(p,1280);await c2.close();print('Área de Personal con permiso explícito: acceso visible y operativo.',flush=True)
  await a.evaluate("async()=>{const api=SICIPCentral.api,p=await api('/api/admin/personal/TESTUSER');await api('/api/admin/personal/TESTUSER/accesos',{method:'POST',body:JSON.stringify({request_key:crypto.randomUUID(),version:p.version,rol:'TRABAJADOR',activo:true,accesos:['inicio','tramites.seguimiento','solicitudes.pases']})})}")
  c2,p=await login('TESTUSER',1280);await p.wait_for_timeout(1200);assert not await p.locator('[data-sicip-depto-sub=recepciones]').is_visible();assert await p.evaluate("fetch('/api/seguimiento/documento?folio=P-000001').then(r=>r.status)")==403;await c2.close();await c.close();assert not errors,errors;await b.close();print('Trabajador sin permiso: menú y API restringidos.',flush=True)
asyncio.run(main())
