"""Home campaign links to the exact official portal and fits both desktop and phone."""
import asyncio
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in [1280,390]:
   c=await b.new_context(viewport={'width':width,'height':844});await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));await p.goto('http://127.0.0.1:8010/login');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();card=p.locator('[data-home-tarjeton]');await card.wait_for();link=card.get_by_role('link',name='Consultar y descargar mi tarjetón',exact=False);assert await link.get_attribute('href')=='https://rh.imss.gob.mx/Personal/TarjetonDigital/';assert await link.get_attribute('target')=='_blank';assert 'noopener' in await link.get_attribute('rel');text=await card.inner_text();assert all(s in text for s in ['RFC','CURP','código postal','31 de diciembre de 2026']);assert await card.locator('input').count()==0;assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await card.screenshot(path='/tmp/tarjeton-'+str(width)+'.png');assert not errors,errors;await c.close();print('Inicio '+str(width)+': aviso legible, sin desbordamiento y acceso oficial al tarjetón.',flush=True)
  await b.close()
asyncio.run(main())
