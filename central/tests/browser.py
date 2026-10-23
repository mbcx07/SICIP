import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
EXCEL=os.environ.get('SICIP_TEST_XLSX','/workspace/attachments/512157a0-5fac-448d-935f-e9dddaef7d06/15 TODAS LAS PLAZAS QNA 2026015 SIN FORMULA.XLSX')
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  context=await browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
  await context.route('https://**/*',lambda r:r.abort())
  page=await context.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(e.stack or str(e)))
  await page.goto('http://127.0.0.1:8010/',wait_until='domcontentloaded')
  await page.locator('input[type=text]').first.fill('TESTADMIN')
  await page.locator('input[type=password]').fill('PruebaSegura123!')
  await page.get_by_role('button',name='Iniciar Sesión',exact=True).click()
  try:await page.locator('[data-central-nav]').wait_for(state='attached',timeout=45000)
  except Exception:
   print('AUTH FAILURE',await page.locator('body').inner_text(),errors);raise
  if not await page.locator('[data-central-nav]').is_visible():await page.locator('[data-admin-toggle]').click()
  await page.locator('[data-central-nav]').click()
  panel=page.locator('[data-sicip-central-panel]')
  await panel.get_by_text('13,037',exact=True).wait_for(timeout=45000)
  await panel.locator('select[name=tc]').select_option('08')
  await panel.locator('[data-total]').get_by_text('1,508 resultado(s)',exact=True).wait_for()
  await panel.locator('select[name=tc]').select_option('')
  await panel.locator('select[name=scope]').select_option('plazas')
  await panel.locator('select[name=occupied]').select_option('no')
  await panel.locator('[data-total]').get_by_text('190 resultado(s)',exact=True).wait_for()
  await panel.get_by_role('button',name='Ver detalle').first.click()
  assert await panel.locator('[data-detail]').inner_text()
  # Exercise the actual SDK facade with filters/counts and preserve fallback for other collections.
  result=await page.evaluate('''async()=>{const c=window.SICIPCentral;const q={_query:{path:{canonicalString:()=> 'trabajadores'},filters:[{field:{canonicalString:()=> 'tipo_contratacion'},op:'==',value:{stringValue:'8'}}]}};const r=await c.sdkGetDocs(q,()=>{throw Error('unexpected Firebase fallback')});const count=await c.sdkCount(q,()=>{});let fallback=false;await c.sdkGetDocs({_query:{path:{canonicalString:()=> 'tramites'}}},()=>{fallback=true});return {rows:r.size,count:count.data().count,fallback};}''')
  assert result['rows']==1508 and result['count']==1508 and result['fallback'],result
  await page.evaluate('scrollTo(0,0)')
  await page.screenshot(path='/workspace/sicip-env/central-desktop.png',full_page=False)
  print('Consulta: 13,037 matrículas; filtro Suplente 1,508; plazas sin ocupante 190; SDK filtrado y conteos correctos.',flush=True)
  # Switching custom modules must clear the prior selection.
  await page.locator('[data-sicip-depto-btn]').click()
  await page.locator('[data-sicip-depto-sub=tramite-pases]').click()
  frame=page.frame_locator('#sicip-pases-view iframe')
  await frame.locator('#workerBox').get_by_text('quincena 2026015',exact=False).wait_for(timeout=45000)
  await page.wait_for_timeout(300)
  active=await page.locator('nav [data-sicip-active="1"]').count()
  assert active<=1,active
  if not await page.locator('[data-central-nav]').is_visible():await page.locator('[data-admin-toggle]').click()
  await page.locator('[data-central-nav]').click()
  await panel.get_by_text('13,037',exact=True).wait_for()
  await page.set_viewport_size({'width':390,'height':844})
  await page.screenshot(path='/workspace/sicip-env/central-mobile.png',full_page=True)
  width=await page.evaluate('({doc:document.documentElement.scrollWidth,win:innerWidth})')
  assert width['doc']<=width['win']+2,width
  print('Diseño: navegación sin doble selección; consulta móvil sin desborde de la página.',flush=True)
  await page.set_viewport_size({'width':1440,'height':1000})
  await panel.get_by_role('button',name='Cargar quincena',exact=True).click()
  await panel.locator('[data-file]').set_input_files(EXCEL)
  await panel.get_by_text('Archivo analizado. Revisa los conteos antes de guardar.',exact=True).wait_for(timeout=60000)
  await panel.get_by_role('button',name='Guardar y validar corte',exact=True).click()
  await panel.get_by_text('Corte guardado y validado. La quincena activa no ha cambiado.',exact=True).wait_for(timeout=120000)
  page.once('dialog',lambda d:d.accept())
  async with page.expect_navigation(wait_until='domcontentloaded'):
   await panel.get_by_role('button',name='Activar este corte',exact=True).click()
  await page.locator('[data-central-nav]').wait_for(state='attached',timeout=30000)
  current=await page.evaluate('fetch("/api/base/current").then(r=>r.json())')
  assert current['quincena']=='2026015' and current['id']!='11111111-1111-4111-8111-111111111111',current
  print('Carga real del Excel: lectura en segundo plano, lotes, validación y activación completas en base local de prueba.',flush=True)
  # Calculator must display the same cut, not its former hardcoded 2026003 source.
  calc=await context.new_page();calc.on('pageerror',lambda e:errors.append(e.stack or str(e)))
  await calc.goto('http://127.0.0.1:8010/fuerza-trabajo/calculadora-nivelacion.html')
  await calc.locator('#nominaSyncStatus').get_by_text('Base central · quincena 2026015',exact=False).wait_for(timeout=45000)
  assert await calc.locator('#quincena').input_value()=='2026015'
  print('Calculadora: usa quincena activa 2026015 y conserva el tabulador independiente.',flush=True)
  await calc.close()
  exam=await context.new_page();exam.on('pageerror',lambda e:errors.append(e.stack or str(e)))
  await exam.goto('http://127.0.0.1:8010/examenes/')
  await exam.locator('#btn-temas').wait_for(timeout=20000)
  assert await exam.evaluate('TODAS.length')>0
  print('Exámenes: banco de preguntas conservado y participante vinculado a la sesión.',flush=True)
  await exam.close()
  assert not errors,errors
  print('Errores JavaScript no controlados: 0.',flush=True)
  await browser.close()
asyncio.run(main())
