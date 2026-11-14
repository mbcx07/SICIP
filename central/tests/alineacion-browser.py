"""Shared typography in actual modules, keeping inputs, search options and printed forms intact."""
import asyncio
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);errors=[]
  for width in [390,1280]:
   c=await b.new_context(viewport={'width':width,'height':844});await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));await p.goto(H+'/login');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.wait_for_function('window.SICIPPersonal&&window.SICIPContratacion&&window.SICIPHerramientas&&window.SICIPPerfil');await p.locator('link[href*="content-alignment"]').wait_for(state='attached')
   modules=[('perfil','SICIPPerfil.open()'),('vacaciones','SICIPPersonal.vacaciones()'),('normativas','SICIPPersonal.normativas()'),('reclamaciones','SICIPPersonal.pd44()'),('coberturas','SICIPContratacion.open()'),('nivelacion',"SICIPHerramientas.open(null,'NIVELACION')"),('conceptos',"SICIPHerramientas.open(null,'CONCEPTOS')"),('reintegro',"SICIPHerramientas.open(null,'REINTEGRO')"),('historial',"import('/sicip-central/historial-client.mjs').then(m=>m.mountHistorial(null,{matricula:'TESTUSER'}))")]
   for name,action in modules:
    await p.evaluate('async()=>{SICIPModuleHost.showReact();await ('+action+');}');heading=p.locator('main h1:visible').first;await heading.wait_for();assert await heading.evaluate('(e)=>getComputedStyle(e).textAlign==="center"'),name
    assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),name
    fields=p.locator('main input:visible:not([type=checkbox]):not([type=radio])');
    if await fields.count():assert await fields.first.evaluate('(e)=>["start","left"].includes(getComputedStyle(e).textAlign)'),name
    await p.locator('main').evaluate('(e)=>e.scrollTo(0,0)');await p.screenshot(path=f'/tmp/alineacion-{name}-{width}.png')
   # Scope check: the screen rules do not change the official paper form.
   await p.evaluate("()=>{const x=document.createElement('div');x.id='printArea';x.innerHTML='<h2 style=\"text-align:left\">FORMATO OFICIAL</h2>';document.querySelector('main').append(x);}");assert await p.locator('#printArea h2').evaluate('(e)=>getComputedStyle(e).textAlign==="left"')
   await c.close();print(f'{width}: perfil, vacaciones, normativas, reclamaciones, coberturas, tres herramientas e historial: títulos centrados, campos legibles y formato de impresión intacto.',flush=True)
  assert not errors,errors;await b.close()
asyncio.run(main())
