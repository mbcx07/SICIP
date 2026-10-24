"""Configure Web Push without printing private keys. Requires Cloudflare token in environment.
Usage: python configure.py --key-file /private/path/keys.json [--pages] [--worker]
Email: set RESEND_API_KEY and MAIL_FROM secrets on Pages and sicip-notificaciones separately.
"""
import argparse,json,os,subprocess,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from cloud import api
p=argparse.ArgumentParser();p.add_argument('--key-file',required=True,type=Path);p.add_argument('--pages',action='store_true');p.add_argument('--worker',action='store_true');a=p.parse_args()
if not a.key_file.exists():
 script="const c=require('crypto');const {privateKey,publicKey}=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});const j=publicKey.export({format:'jwk'});process.stdout.write(JSON.stringify({private:privateKey.export({format:'jwk'}),public:Buffer.concat([Buffer.from([4]),Buffer.from(j.x,'base64url'),Buffer.from(j.y,'base64url')]).toString('base64url')}))"
 raw=subprocess.check_output(['node','-e',script]);fd=os.open(a.key_file,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
 with os.fdopen(fd,'wb') as f:f.write(raw)
k=json.loads(a.key_file.read_text());values={'VAPID_PUBLIC_KEY':k['public'],'VAPID_PRIVATE_JWK':json.dumps(k['private'],separators=(',',':')),'VAPID_SUBJECT':'https://sicip-bcs.pages.dev'}
if a.pages:
 project=api('/pages/projects/sicip-bcs');configs={}
 for name in ['preview','production']:
  prior=project['deployment_configs'][name];vars=dict(prior.get('env_vars',{}));existing=vars.get('VAPID_PUBLIC_KEY',{}).get('value');assert not existing or existing==k['public'],'Do not rotate keys: use original key file.'
  for n,v in values.items():vars[n]={'type':'secret_text' if n=='VAPID_PRIVATE_JWK' else 'plain_text','value':v}
  configs[name]={'env_vars':vars}
 api('/pages/projects/sicip-bcs','PATCH',{'deployment_configs':configs});print('Claves push configuradas en Pages preview y producción; valores privados omitidos.')
if a.worker:
 for n,v in values.items():
  if n=='VAPID_SUBJECT':continue
  api('/workers/scripts/sicip-notificaciones/secrets','PUT',{'name':n,'text':v,'type':'secret_text'})
 print('Claves push configuradas en el Worker de envío; valores privados omitidos.')
