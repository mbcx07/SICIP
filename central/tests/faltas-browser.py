"""Control de Faltas reads the same payroll source and never counts local or duplicate captures."""
import asyncio
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in [1280,390]:
   c=await b.new_context(viewport={'width':width,'height':844});await c.route('https://**/*',lambda r:r.abort());p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));await p.goto(H+'/login');await p.locator('input[type=text]').first.fill('TESTADMIN');await p.locator('input[type=password]').fill('PruebaSegura123!');await p.get_by_role('button',name='Iniciar Sesión',exact=True).click();await p.wait_for_function('window.SICIPWorkflows&&window.SICIPCentral?.user');await p.evaluate("localStorage.setItem('sicip_faltas_injustificadas_v1',JSON.stringify([{matricula:'TESTUSER',fecha:'2026-11-14',id:'LOCAL-NO-CONTAR'}]))")
   if width==390:await p.locator('[aria-controls=sicip-sidebar]').click()
   await p.locator('[data-sicip-depto-btn]').click();await p.get_by_role('button',name='Control de Faltas',exact=False).click();await p.locator('#sf-review-mat').fill('TESTUSER');await p.locator('#sf-review').click();result=p.locator('#sf-result');await result.get_by_role('heading',name='Faltas por quincena').wait_for();assert '14/2026' in await result.inner_text();assert 'Incidencias diarias de nómina' in await result.inner_text(),await result.inner_text();assert 'LOCAL-NO-CONTAR' not in await result.inner_text();first=await result.locator('.sicip-flow-kpi b').nth(1).inner_text();assert first==('1' if width==1280 else '2'),first
   if width==1280:
    for id,date in [('MANUAL-MISMO-DIA','2026-07-21'),('MANUAL-OTRO-DIA','2026-07-22')]:
     r=await p.evaluate("async x=>{const r=await SICIPCentral.api('/api/personal/incidencias',{method:'POST',body:JSON.stringify({id:x.id,fecha:x.date,matricula:'TESTUSER'})});return r}",{'id':id,'date':date});assert r['ok']
    await p.locator('#sf-review').click();await p.wait_for_function("document.querySelectorAll('#sf-result .sicip-flow-kpi b')[1]?.textContent==='2'");assert '14/2026' in await result.inner_text()
   assert not errors,errors;await p.screenshot(path='/tmp/faltas-'+str(width)+'.png',full_page=True);await c.close();print('Control de Faltas '+str(width)+': nómina central, resumen quincenal y deduplicación correctos.',flush=True)
  await b.close()
asyncio.run(main())
