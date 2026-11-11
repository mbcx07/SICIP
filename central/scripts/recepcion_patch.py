from pathlib import Path
import sys,re
out=Path(sys.argv[1]);p=out/'sicip-recepciones-module.js';s=p.read_text()
start=s.index('  var TIPOS_CATEGORIAS = [');end=s.index('];',start)+2
s=s[:start]+'''  var TIPOS_CATEGORIAS = [];
  async function cargarCatalogoRecepcion(){
    var select=document.getElementById('sicip-recep-tipo');if(!select)return;
    var previous=select.value,sub=document.getElementById('sicip-recep-subtipo'),previousSub=sub&&sub.value;
    select.disabled=true;
    try{var data=await window.SICIPCentral.api('/api/recepcion/catalogo');TIPOS_CATEGORIAS=data.categorias;
      select.innerHTML='<option value="">— Selecciona categoría —</option>'+TIPOS_CATEGORIAS.map(function(c){return '<option value="'+esc(c.label)+'">'+esc(c.label)+'</option>';}).join('');
      select.value=previous;window.__SICIP_RECEP_ON_CAT__(select.value);if(sub&&previousSub)sub.value=previousSub;
    }catch(e){select.innerHTML='<option value="">No se pudo cargar el catálogo. Vuelve a abrir Recepciones.</option>';toast(e.message,'error');}finally{select.disabled=false;}
  }
  window.addEventListener('sicip:catalogo-recepcion-cambiado',cargarCatalogoRecepcion);
'''+s[end:]
s=s.replace('    showContent(html);','    showContent(html);\n    cargarCatalogoRecepcion();')
start=s.index('    var data;',s.index('  function processQRData(rawData)'));end=s.index("    log('QR procesado:",start)
s=s[:start]+'''    var folio=window.SICIPFolioQR&&window.SICIPFolioQR(rawData);
    if(!folio){toast('Este QR no contiene un folio SICIP válido.','error');return;}
    var data={folio:folio};
'''+s[end:]
s=s.replace('  // ════════════════ BÚSQUEDA POR FOLIO','  window.SICIPProcesarQR=processQRData;\n\n  // ════════════════ BÚSQUEDA POR FOLIO',1)
p.write_text(s)
p=out/'sicip-fuerza-trabajo-link.js';s=p.read_text();assert 'function patchSidebar() {' in s;s=s.replace('function patchSidebar() {','function patchSidebar() {return;');p.write_text(s)
p=out/'pases/index.html';s=p.read_text();s=re.sub(r'@page\s*\{[^}]*\}', '@page{size:letter portrait;margin:.4in!important}', s)
old='''<div class="p515Row"><span>con objeto de</span><div class="p515Line">'+esc(p.objeto||p.motivo)+'</div></div><div class="p515Accum">PASES ACUMULADOS EN EL MES: <span class="p515Line" style="display:inline-block;width:42px">'+s.part+'</span></div>'''
new='''<div class="p515Row object"><span>con objeto de</span><div class="p515Line">'+esc(p.objeto||p.motivo)+'</div><div class="p515Accum">PASES ACUMULADOS EN EL MES: <span class="p515Line" style="display:inline-block;width:42px">'+s.part+'</span></div></div>'''
# The passes patch may already rename classes at runtime, leaving these template classes intact.
assert old in s,'Pass accumulated template changed';s=s.replace(old,new);p.write_text(s)
