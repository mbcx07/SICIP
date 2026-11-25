"""Annual history, catalogue detail, filters and exports; no lifetime totals or money."""
import asyncio,re,openpyxl
from pathlib import Path
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);errors=[]
  for width in [1280,390]:
   c=await b.new_context(viewport={'width':width,'height':900})
   await c.route('https://**/*',lambda r:r.abort())
   p=await c.new_page()
   p.on('pageerror',lambda e:errors.append(str(e)))
   await p.goto(H+'/login')
   await p.locator('input[type=text]').first.fill('TESTADMIN')
   await p.locator('input[type=password]').fill('PruebaSegura123!')
   await p.get_by_role('button',name='Iniciar Sesión',exact=True).click()
   await p.wait_for_function('window.SICIPCentral?.user&&window.SICIPModuleHost')
   await p.locator('nav.sidebar [data-access-id="jefe.historial"]').wait_for(state='attached')
   if width==390:await p.locator('[aria-controls="sicip-sidebar"]').click()
   await p.locator('nav.sidebar').get_by_role('button',name='Jefe de Servicio',exact=False).first.click()
   await p.locator('[data-access-id="jefe.historial"]').click()
   panel=p.locator('[data-sicip-module-panel=historial-trabajador]')
   await panel.locator('[data-worker-search]').fill('Juan')
   await panel.get_by_role('option',name='JUAN CARLOS PEREZ PRUEBA · TESTUSER',exact=False).click()
   await panel.locator('[data-indicador=pases_personales]').wait_for()
   assert await panel.locator('[data-indicador]').count()==13
   assert re.search(r'1\s*pase',(await panel.locator('[data-indicador=pases_personales]').inner_text())),repr(await panel.locator('[data-indicador=pases_personales]').inner_text())
   assert re.search(r'1\s*pase',(await panel.locator('[data-indicador=pases_medicos]').inner_text())),repr(await panel.locator('[data-indicador=pases_medicos]').inner_text())
   assert 'vida laboral' not in (await panel.inner_text()).lower();assert re.search(r'2\s*días',await panel.locator('[data-indicador=vacaciones]').inner_text());assert 'Presencia en lugar de trabajo' not in await panel.inner_text()
   assert 'acumulado disponible' not in (await panel.inner_text()).lower()
   await panel.locator('[data-view=mensual]').click()
   assert await panel.locator('[data-summary] tbody tr').count()==13
   await panel.locator('[data-view=conceptos]').click()
   search=panel.locator('[data-concept-search]')
   await search.fill('PAV')
   assert await panel.locator('[data-concept-table] tbody tr').count()==1
   assert 'Permiso' in await panel.locator('[data-concept-table]').inner_text()
   await search.fill('')
   await panel.locator('[data-concept-group]').select_option('REPOSICIONES')
   assert '69C' in await panel.locator('[data-concept-table]').inner_text()
   await panel.locator('[data-concept-group]').select_option('')
   await panel.locator('[data-year]').select_option('2025')
   await p.wait_for_function("document.querySelector('[data-summary]')?.textContent.includes('Resumen del año 2025')")
   assert re.search(r'3\s*días',await panel.locator('[data-indicador=licencias_sin_sueldo]').inner_text())
   assert re.search(r'0\s*pases',await panel.locator('[data-indicador=pases_personales]').inner_text())
   await panel.locator('[data-year]').select_option('2026')
   await p.wait_for_function("document.querySelector('[data-summary]')?.textContent.includes('Resumen del año 2026')")
   async with p.expect_download() as dl:await panel.locator('[data-excel]').click()
   download=await dl.value
   file='/tmp/historial-anual-'+str(width)+'.xlsx'
   await download.save_as(file)
   w=openpyxl.load_workbook(file,read_only=True,data_only=True)
   assert w.sheetnames==['Trabajador','Resumen anual','Mensual','Conceptos']
   values=[str(v or '') for sheet in w for row in sheet.iter_rows(values_only=True) for v in row]
   assert not any('vida laboral' in v.lower() or 'acumulado disponible' in v.lower() for v in values)
   assert 'PAV' in values and '69C' in values;assert 'PR' not in values and 'EPR' not in values and '32' not in values and '33' not in values
   assert '2025' not in values
   assert not re.search(r'MXN|\$\d|\b(?:200|400|777)\b',' '.join(values))
   w.close()
   await panel.locator('[data-pdf]').click()
   frame=p.frame_locator('.sicip-document-viewer iframe')
   await frame.locator('#sicip-paper').wait_for()
   text=await frame.locator('body').inner_text()
   assert 'Resumen anual' in text and 'Conceptos registrados' in text and 'PAV' in text
   assert 'vida laboral' not in text.lower()
   assert 'acumulado disponible' not in text.lower()
   assert not re.search(r'MXN|\$\d|\b(?:200|400|777)\b',text)
   await p.locator('.sicip-document-viewer [data-close]').click()
   assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   await p.screenshot(path='/workspace/sicip-env/historial-anual-'+str(width)+'.png',full_page=True)
   await c.close()
   print('Historial '+str(width)+': 13 indicadores anuales, conceptos y filtros, años separados, Excel y PDF sin acumulado de vida laboral ni importes.',flush=True)
  assert not errors,errors;await b.close()
asyncio.run(main())
