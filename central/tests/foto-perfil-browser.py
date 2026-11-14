"""Upload once; a fresh device, Mi perfil and another user's Historial see the same central image."""
import asyncio,io
from PIL import Image
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
buf=io.BytesIO();Image.new('RGB',(100,140),(35,120,80)).save(buf,format='PNG');photo=buf.getvalue()
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);errors=[]
  async def login(width,mat):
   c=await b.new_context(viewport={'width':width,'height':844});await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));await p.goto(H+'/login');await p.locator('input[type=text]').first.fill(mat);await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.wait_for_function('window.SICIPCentral?.user&&window.SICIPPerfil');await p.locator('[data-home-photo]').wait_for();return c,p
  for width in [390,1280]:
   c,p=await login(width,'TESTUSER');await p.locator('[data-home-photo] input').set_input_files({'name':'foto.png','mimeType':'image/png','buffer':photo});await p.locator('[data-home-photo] [role=status]').filter(has_text='Foto guardada').wait_for();await p.wait_for_function("document.querySelector('[data-home-photo] img')?.naturalWidth===360");assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.screenshot(path=f'/tmp/foto-inicio-{width}.png');await p.evaluate('SICIPPerfil.open()');await p.wait_for_function("document.querySelector('[data-profile-photo] img')?.naturalWidth===360");await p.screenshot(path=f'/tmp/foto-perfil-{width}.png');await c.close()
   c,p=await login(width,'TESTUSER');await p.wait_for_function("document.querySelector('[data-home-photo] img')?.naturalWidth===360");await c.close()
   c,p=await login(width,'TESTADMIN');await p.evaluate("async()=>(await import('/sicip-central/historial-client.mjs')).mountHistorial(null,{matricula:'TESTUSER'})");await p.wait_for_function("document.querySelector('[data-worker-photo] img')?.naturalWidth===360");assert await p.locator('[data-worker-photo]').get_attribute('data-photo-owner')=='TESTUSER';assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.screenshot(path=f'/tmp/foto-historial-{width}.png');await c.close();print(f'{width}: foto guardada en línea visible en Inicio, Mi perfil, equipo nuevo e Historial de otro usuario autorizado.',flush=True)
  assert not errors,errors;await b.close()
asyncio.run(main())
