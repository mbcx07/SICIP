import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as a:
  b=await a.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height in [(390,844),(1280,900)]:
   p=await b.new_page(viewport={'width':width,'height':height});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   await p.goto(H+'/sicip-version.json');await p.set_content('<link rel="stylesheet" href="'+H+'/sicip-central/central.css"><main style="max-width:1100px;margin:auto;padding:12px"><section id="campaign" hidden></section></main>')
   await p.evaluate("""async()=>{const m=await import('/sicip-central/campana25n-client.mjs');window.mount25N=m.montarCampana25N;m.montarCampana25N(document.querySelector('#campaign'),{actualizado:'2026-11-25T12:00:00-07:00'});} """)
   await p.locator('.campana25n').wait_for();assert await p.locator('.campana25n h2').inner_text()=='Únete para poner fin a las violencias hacia las mujeres';assert await p.locator('.campana25n li').count()==5
   assert await p.locator('.campana25n a').get_attribute('href')=='http://intranet/comision-bilateral/Paginas/index.aspx';assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   await p.screenshot(path='/workspace/sicip-env/campana25n-'+str(width)+'.png',full_page=True)
   await p.evaluate("mount25N(document.querySelector('#campaign'),{actualizado:'2026-11-25T23:59:59.300-07:00'})");await p.wait_for_timeout(900);assert not await p.locator('#campaign').is_visible()
   await p.evaluate("mount25N(document.querySelector('#campaign'),{actualizado:'2026-11-26T08:00:00-07:00'})");assert not await p.locator('#campaign').is_visible();assert not errors,errors;await p.close()
  p=await b.new_page(viewport={'width':390,'height':844});await p.route('https://**/*',lambda r:r.abort())
  async def fecha_campana(route):
   r=await route.fetch();d=await r.json();d['actualizado']='2026-11-25T12:00:00-07:00';await route.fulfill(response=r,json=d)
  await p.route('**/api/inicio',fecha_campana);await p.goto(H+'/login');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.locator('.sicip-home .campana25n').wait_for();assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.screenshot(path='/workspace/sicip-env/campana25n-inicio-movil.png',full_page=True);await p.close()
  await b.close();print('25N: diseño móvil/escritorio sin desbordamiento, enlace institucional y ocultamiento automático al vencer verificados.')
asyncio.run(main())
