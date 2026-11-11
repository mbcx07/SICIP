"""Synthetic central catalog, reception parser and installed/version transitions."""
import asyncio,json
from playwright.async_api import async_playwright
HOST='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=await b.new_context(viewport={'width':1440,'height':1100});await ctx.route('https://**/*',lambda r:r.abort());p=await ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  await p.goto(HOST);await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.locator('.home-metrics').wait_for()
  await p.goto(HOST+'/notificaciones');await p.locator('.notif-inline').wait_for();await p.wait_for_timeout(800);assert await p.locator('.notif-inline').count()==1
  await p.evaluate('window.SICIPPWA.showInstallHelp()');d=p.locator('[data-install-help]');text=await d.inner_text();assert all(t in text for t in ['Windows','Android','iPhone']);await d.get_by_role('button',name='Entendido').click();await p.evaluate("window.dispatchEvent(new Event('appinstalled'))");await p.goto(HOST+'/');await p.locator('.home-metrics').wait_for();assert await p.locator('[data-install-app]').count()==0
  await p.evaluate("()=>{window.SICIPModuleHost?.showReact();history.pushState({},'', '/admin?seccion=recepcion');dispatchEvent(new PopStateEvent('popstate'))}");await p.get_by_role('heading',name='Catálogo de recepción',exact=True).wait_for();f=p.locator('.admin-personal-card form');await f.locator('[name=categoria]').fill('Catálogo de prueba');await f.locator('[name=nombre]').fill('Documento sintético');await f.get_by_role('button',name='Guardar documento').click();await p.get_by_text('Documento guardado.',exact=False).wait_for();await p.goto(HOST+'/recepciones');await p.locator('#sicip-recep-tipo option[value="Catálogo de prueba"]').wait_for(state='attached');await p.evaluate("()=>{window.__SICIP_RECEP_MANUAL__?.();const x=document.querySelector('#sicip-recep-tipo');x.value='Catálogo de prueba';x.dispatchEvent(new Event('change'))}");assert 'Documento sintético' in await p.locator('#sicip-recep-subtipo').inner_text()
  # Use the actual camera decoder entry point; lookup reaches the central resolver, even if this synthetic folio doesn't exist.
  for folio in ['P-000001','C-000002','V-000003','R-000004']:
   async with p.expect_request('**/api/seguimiento/documento?folio='+folio):await p.evaluate('(f)=>window.SICIPProcesarQR(JSON.stringify({folio:f}))',folio)
  assert await p.locator('[data-sicip-herramientas-root]').count()==0
  # A new release appears while open; clicking it reloads once, then the notice clears against the new build.
  manifest={'version':'5.44.1','build':'a'*64}
  await p.route('**/sicip-version.json?*',lambda r:r.fulfill(json=manifest));await p.evaluate('window.SICIPPWA.checkUpdate()');await p.locator('[data-app-update]').wait_for();await p.route('**/sicip-pwa.js*',lambda r:replace_build(r,'a'*64))
  async with p.expect_navigation():await p.locator('[data-app-update] button').click()
  await p.wait_for_function("window.SICIPPWA?.build==='"+'a'*64+"'");await p.evaluate('window.SICIPPWA.checkUpdate()');assert await p.locator('[data-app-update]').count()==0;assert await p.locator('[data-install-app]').count()==0
  assert not errors,errors;await b.close();print('Catálogo visible en Recepción; cuatro familias de folio; ayuda Windows/Android/iOS; instalación persistente y actualización sin aviso residual comprobados.',flush=True)
async def replace_build(route,value):
 r=await route.fetch();s=await r.text();import re;s=re.sub(r"const BUILD='[a-f0-9]{64}'","const BUILD='"+value+"'",s);await route.fulfill(response=r,body=s)
asyncio.run(main())
