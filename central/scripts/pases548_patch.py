from pathlib import Path
import sys
out=Path(sys.argv[1]);p=out/'pases/index.html';s=p.read_text();old='setTimeout(function(){window.print()},120)';assert old in s;s=s.replace(old,"document.getElementById('printArea').dataset.paseFolio=p.folioCorto||p.folio;document.getElementById('printArea').dataset.paseRevision=p.revision;setTimeout(async function(){try{await (await import('/sicip-central/pases-pdf-client.mjs')).generarPDFPase();}catch(e){alert('No se pudo generar el PDF: '+e.message);}},120)");p.write_text(s)
