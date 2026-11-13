"""Chosen SICIP identity: login/header, responsive layout, all standalone pages and install assets."""
import asyncio
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);p=await b.new_page(viewport={'width':1440,'height':1000});await p.route('https://**/*',lambda r:r.abort());errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  await p.goto(H+'/login');logo=p.locator('.sicip-login-logo');await logo.wait_for();await logo.evaluate('(i)=>i.decode()');assert await logo.evaluate('(i)=>i.naturalWidth>0');await p.screenshot(path='/tmp/sicip-brand-login-desktop.png');await p.set_viewport_size(dict(width=390,height=844));assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.screenshot(path='/tmp/sicip-brand-login-mobile.png');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.locator('nav.sidebar').wait_for(state='attached');await p.locator('.sicip-shell-logo').evaluate('(i)=>i.decode()');assert await p.locator('.sicip-shell-logo').evaluate('(i)=>i.naturalWidth>0');assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.screenshot(path='/tmp/sicip-brand-home-mobile.png')
  for route in ['/pases/index.html?scope=trabajador','/examenes/index.html','/fuerza-trabajo/calculadora-nivelacion.html']:
   await p.goto(H+route);i=p.locator('img[alt="Logo SICIP"]').first;await i.wait_for();await i.evaluate('(i)=>i.decode()');assert await i.evaluate('(i)=>i.naturalWidth>0');assert await p.locator('link[rel=icon][type="image/png"]').count()==1
  m=await(await p.request.get(H+'/manifest.webmanifest')).json();assert m['id']=='/?source=pwa';assert any(i.get('purpose')=='maskable' for i in m['icons'])
  for item in m['icons']:
   r=await p.request.get(H+item['src']);assert r.ok;assert (await r.body())[:8]==b'\x89PNG\r\n\x1a\n'
  assert not errors,errors;await b.close();print('Logo visible en login/escritorio/móvil, encabezado y módulos; iconos PNG de instalación y máscara independiente correctos.')
asyncio.run(main())
