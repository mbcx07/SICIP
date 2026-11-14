"""Consistent SICIP visual identity and versioned PWA assets. Official form seals are unchanged."""
from pathlib import Path
import sys,shutil,json,re,base64
out=Path(sys.argv[1]);root=Path(__file__).resolve().parents[1];icons=out/'icons';icons.mkdir(exist_ok=True);stamp='20261113-marca'
for p in (root/'branding/icons').iterdir():shutil.copy2(p,icons/p.name)
for size in [192,512]:shutil.copy2(icons/f'sicip-551-{size}.png',icons/f'sicip-{size}.png')
shutil.copy2(icons/'favicon.ico',out/'favicon.ico')
raw=base64.b64encode((icons/'sicip-symbol.png').read_bytes()).decode();symbol=f'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><image width="320" height="320" href="data:image/png;base64,{raw}"/></svg>'
(icons/'sicip-logo.svg').write_text(symbol)
# Horizontal wordmark is supplied alongside the standalone emblem.
manifest=json.loads((out/'manifest.webmanifest').read_text());manifest['icons']=[{'src':f'/icons/sicip-551-{size}.png','sizes':f'{size}x{size}','type':'image/png','purpose':'any'} for size in [192,512]]+[{'src':'/icons/sicip-551-maskable-512.png','sizes':'512x512','type':'image/png','purpose':'maskable'}];manifest['theme_color']='#003B2A';manifest['background_color']='#003B2A';(out/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
for p in out.rglob('*.html'):
 s=p.read_text();s=re.sub(r'<link\b[^>]*\brel=[\"\'](?:icon|shortcut icon|apple-touch-icon)[\"\'][^>]*>','',s,flags=re.I)
 tags=f'<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png?v={stamp}"><link rel="icon" type="image/x-icon" href="/favicon.ico?v={stamp}"><link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-551.png">'
 s=s.replace('</head>',tags+'<link rel="stylesheet" href="/sicip-central/module-headings.css?v=20261113-navegacion"><script defer src="/sicip-central/module-headings.js?v=20261113-navegacion"></script></head>',1)
 if p==out/'index.html':s=s.replace('</body>','<script src="/sicip-central/menu-icons.js?v=20261114-apertura"></script></body>')
 if p==out/'examenes/index.html':
  s=s.replace('<header class="bg-imss text-white shadow-lg">','<header class="sicip-page-heading">').replace('<div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl font-black text-imss-verde">IMSS</div>','')
 if p==out/'pases/index.html':
  init='<script>document.documentElement.dataset.pasesScope=new URLSearchParams(location.search).get("scope")||"trabajador";</script><style>html:not([data-pases-ready="1"]) .wrap{display:none}html:not([data-pases-ready="1"]) body:before{content:"Preparando pases…";display:block;padding:28px;font:14px system-ui;color:#164532}html[data-pases-scope="personal"]:not([data-pases-ready="1"]) body:before{content:"Preparando Trámite de Pases de Personal…"}</style>'
  s=s.replace('<head>','<head>'+init,1)
 p.write_text(s)
for p in [out/'sw.js',out/'sicip-central/push-events.js']:
 s=p.read_text();s=re.sub(r'/icons/sicip-192\.png(?:\?v=[A-Za-z0-9_-]+)?','/icons/sicip-551-192.png',s);s=re.sub(r"(badge\s*:\s*['\"])/icons/sicip-551-192.png",r'\1/icons/sicip-badge-551.png',s);p.write_text(s)
with (out/'_headers').open('a') as f:f.write('\n/favicon.ico\n  Cache-Control: no-cache, must-revalidate\n/icons/sicip-192.png\n  Cache-Control: no-cache, must-revalidate\n/icons/sicip-512.png\n  Cache-Control: no-cache, must-revalidate\n/icons/sicip-symbol.png\n  Cache-Control: no-cache, must-revalidate\n')
