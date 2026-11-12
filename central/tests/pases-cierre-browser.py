"""Synthetic TC08 unit selection, clean PDF/QR, mobile view and first-access given name. Harness requires SICIP_TEST_ADMIN_ACCOUNTS=1 SICIP_TEST_GIVEN_NAME=1."""
import asyncio,json,base64
from pathlib import Path
import fitz
from playwright.async_api import async_playwright
H='http://127.0.0.1:8010'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);a=await b.new_page();p=await (await b.new_context()).new_page();errors=[]
  for x in[a,p]:
   await x.route('https://**/*',lambda r:r.abort());x.on('pageerror',lambda e:errors.append(str(e)));x.on('dialog',lambda d:d.accept())
  async def login(x,m,password='PruebaSegura123!'):
   await x.goto(H+'/login');await x.locator('input[type=text]').first.fill(m);await x.locator('input[type=password]').fill(password);await x.get_by_role('button',name='Iniciar Sesión',exact=True).click();await x.wait_for_function('window.SICIPCentral?.user')
  async def api(x,path,method='GET',data=None):return await x.evaluate('(v)=>SICIPCentral.api(v.path,{method:v.method,...(v.data?{body:JSON.stringify(v.data)}:{})})',dict(path=path,method=method,data=data))
  await login(a,'TESTADMIN');await login(p,'TESTUSER');await a.locator('nav.sidebar').wait_for();await p.locator('nav.sidebar').wait_for()
  for k in['A','B']:await api(a,'/api/admin/unidades','POST',dict(clave=k,nombre='Unidad '+k,activo=True,version=0))
  await api(a,'/api/admin/unidades/asignar','POST',dict(unidad='A',matriculas=['TESTUSER']))
  await p.goto(H+'/pases/index.html?scope=trabajador');await p.locator('[data-suplente-unit]').wait_for();assert await p.locator('[data-suplente-unit]').input_value()==''
  await p.locator('[data-suplente-unit]').select_option('B');assert (await p.evaluate('SICIPPasesContexto()'))['unidad_clave']=='B';print('TC08 selector obligatorio sin predeterminado, unidad B seleccionada.',flush=True)
  day=(await api(p,'/api/inicio'))['fecha'];folio=(await api(p,'/api/pases/folio','POST',dict(request_id='aaaaaaaa-1111-4111-8111-222222222222')))['folio']
  await api(p,'/api/pases/registros','POST',dict(folio=folio,matricula='TESTUSER',nombre='ANA MARÍA PÉREZ',categoria='ENFERMERA GENERAL',servicio='Servicio',fecha=day,hora='12:00',tipoAsunto='PARTICULAR',tipoHorario='SALIDA',destino='Domicilio particular',motivo='Asunto personal',objeto='Sin regreso',estado='PENDIENTE_ENTREGA',unidad_clave='B',unidad_suplente=True))
  await p.evaluate('SICIPPasesSync.refresh()');await p.evaluate('(f)=>SICIPPases.print(f)',folio);await p.locator('.pase-pdf-dialog').wait_for(timeout=60000)
  raw=bytes(await p.evaluate('async()=>Array.from(new Uint8Array(await SICIPPasePDF.blob.arrayBuffer()))'));Path('/tmp/pase-548.pdf').write_bytes(raw);doc=fitz.open(stream=raw,filetype='pdf');assert len(doc)==1;assert tuple(doc[0].rect)==(0,0,612,792);pix=doc[0].get_pixmap(matrix=fitz.Matrix(300/72,300/72));pix.save('/tmp/pase-548.png')
  await p.add_script_tag(url=H+'/sicip-central/vendor/jsQR.js');qr=await p.evaluate('''async src=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const d=ctx.getImageData(0,0,c.width,c.height);return jsQR(d.data,d.width,d.height)?.data;}''','data:image/png;base64,'+base64.b64encode(pix.tobytes('png')).decode());assert qr,(len(raw),'QR missing');print('PDF carta limpio, una página; QR legible:',qr,flush=True)
  await p.locator('[data-pdf-close]').click();await p.set_viewport_size(dict(width=390,height=844));assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await p.evaluate('(f)=>SICIPPases.print(f)',folio);await p.locator('.pase-pdf-dialog').wait_for();await p.locator('[data-pdf-close]').click()
  await api(a,'/api/admin/personal/TESTUSER/reiniciar-password','POST',dict(request_key='aaaaaaaa-1111-4111-8111-333333333333'));await p.context.clear_cookies();await p.goto(H+'/login');await p.evaluate('sessionStorage.clear();localStorage.clear()');await login(p,'TESTUSER','TESTUSER');await p.get_by_text('¡Bienvenido,',exact=False).wait_for();g=await p.get_by_text('¡Bienvenido,',exact=False).inner_text();assert 'JUAN CARLOS' in g,g;print('Primer acceso:',g,flush=True);assert not errors,errors;await b.close()
asyncio.run(main())
