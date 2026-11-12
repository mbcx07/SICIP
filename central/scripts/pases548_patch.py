from pathlib import Path
import sys
out=Path(sys.argv[1]);p=out/'pases/index.html';s=p.read_text();old='setTimeout(function(){window.print()},120)';assert old in s;s=s.replace(old,"setTimeout(async function(){try{await (await import('/sicip-central/pases-pdf-client.mjs')).generarPDFPase();}catch(e){alert('No se pudo generar el PDF: '+e.message);}},120)");p.write_text(s)
