"""Background refresh preserves DOM, open content and widgets; deadline hides announcements."""
import asyncio,json,time
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);p=await b.new_page(viewport={'width':390,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));await p.route('https://**/*',lambda r:r.abort());phase={'change':False,'calls':0}
  async def home_route(route):
   r=await route.fetch();d=await r.json();phase['calls']+=1
   if phase['change']:d['resumen']['mes_total']+=7
   await route.fulfill(response=r,json=d)
  await p.route('**/api/inicio',home_route);await p.goto(H+'/login');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();home=p.locator('.sicip-home');await home.locator('.conv-card').nth(5).wait_for();await p.wait_for_timeout(600)
  assert 'El cuadro de reemplazo identifica posibles sustitutos' not in await home.inner_text();await home.locator('details').last.evaluate('(e)=>e.open=true');await p.evaluate('''()=>{const h=document.querySelector('.sicip-home');window.homeRefs=[...h.children];window.islandRefs=['[data-home-photo]','[data-home-install]','[data-device-notifications]','[data-home-convocatorias]'].map(s=>h.querySelector(s));window.adRef=h.querySelector('.conv-grid');window.openRef=h.querySelector('details[open]');}''')
  for _ in range(3):
   calls=phase['calls'];await p.evaluate("dispatchEvent(new Event('focus'))")
   for i in range(40):
    if phase['calls']>calls:break
    await p.wait_for_timeout(100)
   await p.wait_for_timeout(150)
  assert phase['calls']>=4;assert await p.evaluate('homeRefs.every(n=>n.isConnected)&&islandRefs.every(n=>n.isConnected)&&adRef===document.querySelector(".conv-grid")&&openRef.open')
  phase['change']=True;calls=phase['calls'];await p.evaluate("dispatchEvent(new Event('focus'))")
  for _ in range(40):
   if phase['calls']>calls:break
   await p.wait_for_timeout(100)
  await p.wait_for_timeout(300);assert await home.locator('.home-metrics button').first.locator('b').inner_text()=='7';assert await p.evaluate('homeRefs.every(n=>n.isConnected)&&islandRefs.every(n=>n.isConnected)&&adRef===document.querySelector(".conv-grid")&&openRef.open');assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');print('Inicio: tres refrescos sin desmontar pantalla; estadísticas cambian sin reemplazar foto, avisos, controles ni cerrar detalles.',flush=True)
  state={'expired':False}
  async def calls_route(route):
   r=await route.fetch();d=await r.json();now=int(time.time()*1000);d['servidor']=now
   for c in d['convocatorias']:c['cierre']='2000-01-01T00:00:00Z' if state['expired'] else __import__('datetime').datetime.fromtimestamp((now+1200)/1000,__import__('datetime').timezone.utc).isoformat();c['estado']='CERRADA' if state['expired'] else 'INSCRIPCION_ABIERTA'
   await route.fulfill(response=r,json=d)
  await p.route('**/api/convocatorias',calls_route);await p.evaluate("import('/sicip-central/convocatorias-client.mjs').then(m=>m.montarConvocatoriasInicio(document.querySelector('[data-home-convocatorias]')))");state['expired']=True;await p.wait_for_timeout(2500);assert not await home.locator('[data-home-convocatorias]').is_visible();assert await home.locator('.conv-card:visible').count()==0;assert not errors,errors;print('Al vencer el plazo, el aviso se oculta automáticamente sin borrar PDF ni historial.',flush=True);await b.close()
asyncio.run(main())
