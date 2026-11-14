"""Header bell restores embedded modules; pass preview opens in the visible app, not a long iframe."""
import asyncio
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in [390,1280]:
   c=await b.new_context(viewport={'width':width,'height':844},is_mobile=width<600,has_touch=width<600);await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   await p.goto(H+'/login');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.wait_for_function('window.SICIPCentral?.user&&window.SICIPModuleHost&&window.SICIPNotifications')
   await p.evaluate(r"""()=>{const panel=document.createElement('section');panel.id='sicip-pases-view';panel.innerHTML='<iframe title="Pases de prueba" style="width:100%;height:3000px;border:0"></iframe>';SICIPModuleHost.mount(panel);panel.firstChild.srcdoc='<!doctype html><html><head><link rel="stylesheet" href="/sicip-central/central.css"></head><body><button id="print">Imprimir pase</button><div id="printArea"><section class="pass-document" style="height:650px;padding:20px"><h1>PASE SINTÉTICO</h1><div class="pass-Folio"><span>P-000001</span></div></section></div><script type="module">import {generarPDFPase} from "/sicip-central/pases-pdf-client.mjs";document.getElementById("print").onclick=generarPDFPase;<\/script></body></html>';}""")
   frame=p.frame_locator('#sicip-pases-view iframe');await frame.locator('#print').evaluate('(b)=>new Promise(resolve=>{const t=setInterval(()=>{if(b.onclick){clearInterval(t);resolve();}},30)})');await frame.locator('#print').click();await p.locator('.pase-pdf-dialog').wait_for();await p.locator('[data-pdf-download]').wait_for();assert await p.locator('.pase-pdf-dialog').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}')
   assert await frame.locator('.pase-pdf-dialog').count()==0;await p.locator('.pase-pdf-preview img').evaluate('(e)=>e.decode()');await p.screenshot(path=f'/tmp/pase-embedded-{width}.png');await p.locator('[data-pdf-close]').click()
   # Click the real header button while a custom module still hides React's content.
   await p.get_by_role('button',name='Mis notificaciones',exact=True).click();await p.locator('[data-notifications]').get_by_role('heading',name='Mis notificaciones',exact=True).wait_for();assert await p.locator('#sicip-pases-view').count()==0;assert await p.locator('[data-notifications]').is_visible();assert p.url.endswith('/notificaciones');await p.screenshot(path=f'/tmp/campana-{width}.png');assert not errors,errors
   await c.close();print(f'{width}: clic en imprimir desde iframe muestra PDF en pantalla principal; campana abre avisos después de módulo embebido.',flush=True)
  await b.close()
asyncio.run(main())
