"""Real paper formats stay proportional on phones; print layout is unchanged."""
import asyncio,json,subprocess
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
js="""import {vac06HTML} from './src/vac06.mjs';import {pecvHTML} from './src/pecv-print.mjs';
const p={anio:2027,numero:'71',modalidad:'NORMAL',snapshot:{nombre:'ANA PRUEBA',tc:'02',quincena:'2026022'}};const r={folio:'V-000012',matricula:'TESTUSER',tipo:'PROGRAMACION',created_at:'2026-11-13',payload:{marca:'0'},plan:{inicio:'2027-03-17',fin:'2027-04-08'}};
console.log(JSON.stringify([vac06HTML(r,p),pecvHTML({registro:{...r,plan:{...r.plan,disfrute:['2027-03-17'],programacion:{inicio:'2027-03-17',fin_actual:'2027-04-08'}}},periodo:p,programacion:r,trabajador:{nombre:'ANA PRUEBA',matricula:'TESTUSER'},firmantes:{},fecha:'2026-11-13'})]));"""
formats=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT))
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in [360,390,1280]:
   c=await b.new_context(viewport={'width':width,'height':844},is_mobile=width<600,has_touch=width<600);p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));await p.goto('http://127.0.0.1:8010/login');await p.add_style_tag(url='/sicip-central/central.css')
   for i,html in enumerate(formats):
    await p.evaluate("async html=>(await import('/sicip-central/documento-visor.mjs')).mostrarDocumento(html,{titulo:'Formato de prueba'})",html)
    frame=p.frame_locator('.sicip-document-viewer iframe');await frame.locator('#sicip-paper').wait_for();await p.locator('[data-print]:not([disabled])').wait_for();await p.wait_for_timeout(100)
    assert await frame.locator('#sicip-paper').evaluate('(e)=>e.getBoundingClientRect().right<=innerWidth+1')
    assert await frame.locator('.sheet').evaluate('(e)=>e.getBoundingClientRect().right<=innerWidth+1')
    assert await p.locator('[data-print]').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.right<=innerWidth&&r.top>=0}')
    await p.screenshot(path=f'/tmp/visor-{width}-{i}.png')
    # The preview transform must not affect the physical paper dimensions.
    doc=await c.new_page();await doc.set_content(await p.locator('.sicip-document-viewer iframe').evaluate('(e)=>e.srcdoc'));await doc.emulate_media(media='print');assert await doc.locator('#sicip-paper').evaluate('(e)=>getComputedStyle(e).transform==="none"');await doc.pdf(path=f'/tmp/visor-{width}-{i}.pdf',prefer_css_page_size=True);await doc.close();await p.locator('[data-close]').click();await p.locator('.sicip-document-viewer').wait_for(state='detached')
   # Actual pass PDF generation: image preview instead of unsupported embedded PDF.
   await p.evaluate("""()=>{const area=document.createElement('div');area.id='printArea';area.innerHTML='<section class="pass-document" style="height:650px;padding:30px"><h1>PASE DE PRUEBA</h1><p>Formato sintético de prueba móvil</p><div class="pass-Folio"><span>P-000001</span></div></section>';document.body.append(area)}""")
   await p.evaluate("async()=>(await import('/sicip-central/pases-pdf-client.mjs')).generarPDFPase()")
   await p.locator('.pase-pdf-preview img').evaluate('(i)=>i.decode()');assert await p.locator('.pase-pdf-dialog iframe').count()==0;assert await p.locator('.pase-pdf-preview img').evaluate('(i)=>i.getBoundingClientRect().width<=innerWidth');assert (await p.locator('[data-pdf-open]').get_attribute('href')).startswith('blob:')
   async with p.expect_download() as download:await p.locator('[data-pdf-download]').click()
   await (await download.value).save_as(f'/tmp/pase-visor-{width}.pdf');await p.locator('[data-pdf-close]').click();assert not errors,errors;await c.close();print(f'Visor {width}: VAC06/PECV completos, controles accesibles, PDF sin escala de pantalla; pase visible y descargable.',flush=True)
  await b.close()
asyncio.run(main())
