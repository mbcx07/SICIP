import {validateRows, searchKey} from './domain.mjs';
const STAFF=new Set(['ADMIN','ADMINISTRADOR','AREA_PERSONAL','FUERZA_TRABAJO','JEFE_SERVICIO']);
const ADMIN=new Set(['ADMIN','ADMINISTRADOR']);
const FIRESTORE='https://firestore.googleapis.com/v1/projects/sicip-bcs/databases/(default)/documents/usuarios/';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
class Fault extends Error {constructor(status,message){super(message);this.status=status;}}
const assert=(test,status,msg)=>{if(!test)throw new Fault(status,msg);};
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const run=(env,sql,...params)=>env.DB.prepare(sql).bind(...params);
const now=()=>Math.floor(Date.now()/1000);
function value(f){if(!f)return null;if('stringValue'in f)return f.stringValue;if('booleanValue'in f)return f.booleanValue;if('integerValue'in f)return Number(f.integerValue);if('doubleValue'in f)return f.doubleValue;if('arrayValue'in f)return(f.arrayValue.values||[]).map(value);if('mapValue'in f)return Object.fromEntries(Object.entries(f.mapValue.fields||{}).map(([k,v])=>[k,value(v)]));return null;}
async function account(matricula){const r=await fetch(FIRESTORE+encodeURIComponent(matricula),{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});if(r.status===404)return null;assert(r.ok,503,'No se pudo validar la cuenta. Intenta de nuevo.');const d=await r.json();return Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,value(v)]));}
function cleanUser(raw,matricula){const u={matricula,uid:matricula,nombre:String(raw.nombre||matricula),rol:String(raw.rol||'TRABAJADOR').toUpperCase(),activo:raw.activo===true,primerAcceso:raw.primerAcceso!==false};for(const k of ['departamento','departamentoNombre','unidadClave','unidadNombre','puesto','descripcion','tipoContrato'])if(raw[k]!=null)u[k]=raw[k];if(u.rol==='ADMINISTRADOR')u.rol='ADMIN';u.permisos=ADMIN.has(u.rol)?['solicitudes','contrato','cuadros','pases','licencias','recepciones','reportes','plantilla','admin','plazas','vacantes','usuarios','roles','herramientas','bandeja']:Array.isArray(raw.permisos)?raw.permisos:[];return u;}
async function session(request,env,admin=false){
 const token=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)__Host-SICIP_SESSION=([a-f0-9]{64})(?:;|$)/)?.[1];assert(token,401,'Vuelve a iniciar sesión para consultar la base central.');
 const record=await run(env,'SELECT usuario FROM sessions WHERE token_hash=? AND expires>?',await hash(token),now()).first();assert(record,401,'La sesión expiró. Vuelve a iniciar sesión.');const saved=JSON.parse(record.usuario);let user=cleanUser(saved,saved.matricula);
 if(admin){const raw=await account(user.matricula);assert(raw?.activo===true,403,'Cuenta inactiva.');user=cleanUser(raw,user.matricula);assert(ADMIN.has(user.rol),403,'Esta acción requiere un administrador.');}return user;
}
async function body(request,max=1024*1024){const declared=Number(request.headers.get('content-length')||0);assert(declared<=max,413,'La solicitud es demasiado grande.');const text=await request.text();assert(new TextEncoder().encode(text).length<=max,413,'La solicitud es demasiado grande.');try{return JSON.parse(text);}catch{throw new Fault(400,'JSON inválido.');}}
function protectOrigin(request){const origin=request.headers.get('Origin');assert(origin&&origin===new URL(request.url).origin,403,'Origen de solicitud no permitido.');}
async function current(env,requested){const id=requested||(await run(env,"SELECT value FROM settings WHERE key='active'").first())?.value;assert(id,503,'Aún no hay una quincena activa.');const c=await run(env,'SELECT * FROM cortes WHERE id=? AND status=?',id,'VALIDADO').first();assert(c,404,'No se encontró un corte validado.');return {...c,expected:JSON.parse(c.expected),validation:c.validation?JSON.parse(c.validation):null};}
const publicCut=c=>({id:c.id,quincena:c.quincena,created_at:c.created_at,source_name:c.source_name,source_hash:c.source_hash,counts:c.validation?.counts||c.expected.counts,warnings:Object.values((c.validation?.warnings||[]).reduce((all,w)=>{const key=String(w.tipo||'OBSERVACION');all[key]=all[key]||{tipo:key,cantidad:0};all[key].cantidad+=Number(w.cantidad)||1;return all;},{})),status:c.status});
async function validateCut(env,id){
 const cut=await run(env,'SELECT * FROM cortes WHERE id=?',id).first();assert(cut,404,'No existe esta carga.');assert(cut.status==='BORRADOR'||cut.status==='VALIDADO',409,'Carga no disponible.');const expected=JSON.parse(cut.expected),counts={};
 for(const table of ['personas','plazas','antiguedad','catalogos'])counts[table]=(await run(env,`SELECT COUNT(*) n FROM ${table} WHERE corte=?`,id).first()).n;
 for(const table of Object.keys(counts))assert(counts[table]===expected.counts[table],409,`Carga incompleta: ${table}, ${counts[table]} de ${expected.counts[table]}.`);
 const orphan=(await run(env,'SELECT COUNT(*) n FROM plazas z LEFT JOIN personas p ON p.corte=z.corte AND p.matricula=z.ocupante WHERE z.corte=? AND z.ocupante IS NOT NULL AND p.matricula IS NULL',id).first()).n;assert(orphan===0,409,'Hay ocupantes que no existen en el padrón.');
 counts.ocupadas=(await run(env,'SELECT COUNT(*) n FROM plazas WHERE corte=? AND ocupante IS NOT NULL',id).first()).n;counts.sin_ocupante=counts.plazas-counts.ocupadas;
 const antOrphans=(await run(env,'SELECT COUNT(*) n FROM antiguedad a LEFT JOIN personas p ON p.corte=a.corte AND p.matricula=a.matricula WHERE a.corte=? AND p.matricula IS NULL',id).first()).n;
 const titularOrphans=(await run(env,'SELECT COUNT(*) n FROM plazas z LEFT JOIN personas p ON p.corte=z.corte AND p.matricula=z.titular WHERE z.corte=? AND z.titular IS NOT NULL AND p.matricula IS NULL',id).first()).n;
 const warnings=[...(expected.warnings||[]).slice(0,300),...(antOrphans?[{tipo:'ANTIGUEDAD_SIN_PADRON',cantidad:antOrphans}]:[]),...(titularOrphans?[{tipo:'TITULAR_SIN_PADRON',cantidad:titularOrphans}]:[])];
 const result={counts,warnings};await run(env,'UPDATE cortes SET status=?,validation=? WHERE id=?','VALIDADO',JSON.stringify(result),id).run();return result;
}
async function api(request,env){
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(!['GET','HEAD'].includes(method))protectOrigin(request);
 if(path==='/api/login'&&method==='POST'){
  const d=await body(request,2048);assert(typeof d.matricula==='string'&&/^[A-Za-z0-9._-]{1,80}$/.test(d.matricula)&&typeof d.password==='string'&&d.password.length>0&&d.password.length<=256,400,'Matrícula o contraseña inválida.');
  const key=await hash((request.headers.get('CF-Connecting-IP')||'local')+':'+d.matricula),ipkey=await hash('ip:'+(request.headers.get('CF-Connecting-IP')||'local'));
  for(const k of [key,ipkey]){const limit=await run(env,'SELECT intentos FROM auth_limits WHERE key=? AND expires>?',k,now()).first();assert(!limit||limit.intentos<(k===key?8:60),429,'Demasiados intentos. Espera 15 minutos.');}
  const raw=await account(d.matricula),expected=String(raw?.password||d.matricula);const equal=(await hash(d.password))===(await hash(expected));
  if(!raw||raw.activo!==true||!equal){for(const k of [key,ipkey])await run(env,'INSERT INTO auth_limits(key,intentos,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET intentos=CASE WHEN expires<? THEN 1 ELSE intentos+1 END,expires=excluded.expires',k,now()+900,now()).run();throw new Fault(401,'No se pudo iniciar sesión. Revisa tus datos o consulta al administrador.');}
  const user=cleanUser(raw,d.matricula),token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
  await env.DB.batch([run(env,'INSERT INTO sessions(token_hash,usuario,expires) VALUES(?,?,?)',await hash(token),JSON.stringify(user),now()+43200),run(env,'DELETE FROM auth_limits WHERE key=?',key),run(env,'DELETE FROM sessions WHERE expires<?',now())]);
  return json({usuario:user},200,{'Set-Cookie':`__Host-SICIP_SESSION=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=43200`});
 }
 if(path==='/api/session'&&method==='GET')return json({usuario:await session(request,env)});
 if(path==='/api/logout'&&method==='POST'){const token=(request.headers.get('Cookie')||'').match(/__Host-SICIP_SESSION=([a-f0-9]{64})/)?.[1];if(token)await run(env,'DELETE FROM sessions WHERE token_hash=?',await hash(token)).run();return json({ok:true},200,{'Set-Cookie':'__Host-SICIP_SESSION=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0'});}
 if(path==='/api/password'&&method==='POST'){
  const user=await session(request,env),d=await body(request,2048);assert(typeof d.password==='string'&&d.password.length>=8&&d.password.length<=256,400,'Usa una contraseña de 8 a 256 caracteres.');
  const r=await fetch(FIRESTORE+encodeURIComponent(user.matricula)+'?updateMask.fieldPaths=password&updateMask.fieldPaths=primerAcceso',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:{password:{stringValue:d.password},primerAcceso:{booleanValue:false}}})});assert(r.ok,503,'No se pudo cambiar la contraseña.');return json({ok:true});
 }
 if(path==='/api/curriculums'&&method==='POST'){
  const user=await session(request,env),d=await body(request,1500000);assert((await account(user.matricula))?.activo===true,403,'Cuenta inactiva.');
  assert(typeof d.jefe==='string'&&/^[A-Za-z0-9._-]{1,80}$/.test(d.jefe),400,'Selecciona el puesto de confianza.');
  assert(typeof d.name==='string'&&d.name.toLowerCase().endsWith('.pdf')&&d.name.length<=180,400,'El currículum debe ser un archivo PDF.');
  assert(typeof d.data==='string'&&d.data.length<=1400000&&/^[A-Za-z0-9+/]+={0,2}$/.test(d.data),400,'Archivo PDF inválido o mayor de 1 MB.');
  let raw;try{raw=atob(d.data);}catch{throw new Fault(400,'Archivo inválido.');}
  assert(raw.length>8&&raw.length<=1048576&&raw.startsWith('%PDF-')&&raw.slice(-2048).includes('%%EOF'),400,'Selecciona un PDF válido de hasta 1 MB.');
  const cut=await current(env);assert(await run(env,'SELECT matricula FROM personas WHERE corte=? AND matricula=?',cut.id,d.jefe).first(),400,'El puesto seleccionado no existe en el padrón.');
  const id=crypto.randomUUID(),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const statements=[run(env,'INSERT INTO curriculum_files VALUES(?,?,?,?,?,?,?)',id,user.matricula,d.jefe,d.name,raw.length,digest,new Date().toISOString())];for(let i=0;i<d.data.length;i+=60000)statements.push(run(env,'INSERT INTO curriculum_chunks VALUES(?,?,?)',id,i/60000,d.data.slice(i,i+60000)));await env.DB.batch(statements);
  return json({id,name:d.name,size:raw.length,url:'/api/curriculums/'+id},201);
 }
 const cvMatch=path.match(/^\/api\/curriculums\/([a-f0-9-]{36})$/);
 if(cvMatch&&method==='GET'){
  const user=await session(request,env),file=await run(env,'SELECT * FROM curriculum_files WHERE id=?',cvMatch[1]).first();assert(file,404,'Currículum no encontrado.');
  assert(user.matricula===file.owner||user.matricula===file.recipient||ADMIN.has(user.rol)||user.rol==='AREA_PERSONAL',403,'No tienes acceso a este currículum.');
  const {results}=await run(env,'SELECT data FROM curriculum_chunks WHERE file=? ORDER BY numero',file.id).all();const data=atob(results.map(r=>r.data).join(''));return new Response(Uint8Array.from(data,c=>c.charCodeAt(0)),{headers:{'Content-Type':'application/pdf','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(file.name),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 if(path==='/api/postulaciones/recibidas'&&method==='GET'){
  const user=await session(request,env),jefe=url.searchParams.get('jefe');assert(typeof jefe==='string'&&/^[A-Za-z0-9._-]{1,80}$/.test(jefe),400,'Puesto inválido.');assert(user.matricula===jefe||ADMIN.has(user.rol)||user.rol==='AREA_PERSONAL',403,'No puedes consultar solicitudes de otro jefe.');
  const r=await fetch(FIRESTORE.replace('/usuarios/','')+':runQuery',{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json'},body:JSON.stringify({structuredQuery:{from:[{collectionId:'postulaciones_reemplazo'}],where:{fieldFilter:{field:{fieldPath:'cuadroId'},op:'EQUAL',value:{stringValue:jefe}}},limit:500}})});assert(r.ok,503,'No se pudieron consultar las solicitudes recibidas.');const rows=await r.json();return json(rows.filter(x=>x.document).map(x=>({id:x.document.name.split('/').pop(),...Object.fromEntries(Object.entries(x.document.fields||{}).map(([k,v])=>[k,value(v)]))})));
 }
 if(path==='/api/postulaciones'&&method==='GET'){
  const user=await session(request,env),jefe=url.searchParams.get('jefe');assert(typeof jefe==='string'&&/^[A-Za-z0-9._-]{1,80}$/.test(jefe),400,'Puesto inválido.');
  const r=await fetch(FIRESTORE.replace('/usuarios/','')+':runQuery',{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json'},body:JSON.stringify({structuredQuery:{from:[{collectionId:'postulaciones_reemplazo'}],where:{compositeFilter:{op:'AND',filters:[{fieldFilter:{field:{fieldPath:'cuadroId'},op:'EQUAL',value:{stringValue:jefe}}},{fieldFilter:{field:{fieldPath:'trabajadorMatricula'},op:'EQUAL',value:{stringValue:user.matricula}}}]}},limit:10}})});assert(r.ok,503,'No se pudieron consultar las solicitudes previas.');const rows=await r.json();return json(rows.filter(x=>x.document).map(x=>({id:x.document.name.split('/').pop(),...Object.fromEntries(Object.entries(x.document.fields||{}).map(([k,v])=>[k,value(v)]))})));
 }
 if(path==='/api/postulaciones'&&method==='POST'){
  const user=await session(request,env),d=await body(request,2048);assert((await account(user.matricula))?.activo===true,403,'Cuenta inactiva.');assert(typeof d.curriculumId==='string',400,'Debes adjuntar tu currículum antes de solicitar participar.');
  const file=await run(env,'SELECT * FROM curriculum_files WHERE id=? AND owner=?',d.curriculumId,user.matricula).first();assert(file&&file.recipient===d.jefe,400,'Adjunta un currículum para este puesto.');
  const id=(await hash(user.matricula+':'+d.jefe+':'+file.id)).slice(0,40),date=new Date().toISOString();
  const data={cuadroId:d.jefe,trabajadorMatricula:user.matricula,trabajadorNombre:user.nombre,trabajadorDescripcion:user.descripcion||'',trabajadorDepartamento:user.departamento||'',trabajadorDepartamentoNombre:user.departamentoNombre||'',status:'PENDIENTE',fechaPostulacion:date,fechaActualizacion:date,curriculumId:file.id,curriculumUrl:'/api/curriculums/'+file.id,curriculumNombre:file.name};
  const fields=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,{stringValue:String(v)}]));
  const result=await fetch(FIRESTORE.replace('/usuarios/','/postulaciones_reemplazo/')+id+'?currentDocument.exists=false',{method:'PATCH',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json'},body:JSON.stringify({fields})});if(result.status===409||result.status===412){const previous=await fetch(FIRESTORE.replace('/usuarios/','/postulaciones_reemplazo/')+id,{signal:AbortSignal.timeout(10000)});assert(previous.ok,503,'La solicitud ya fue enviada; vuelve a consultar su estado.');const saved=await previous.json();return json({id,...Object.fromEntries(Object.entries(saved.fields||{}).map(([k,v])=>[k,value(v)]))},200);}assert(result.ok,503,'No se pudo guardar la solicitud. Tu currículum está adjunto; puedes reintentar.');
  const note={destinatarioUid:d.jefe,destinatarioMatricula:d.jefe,tipo:'POSTULACION_NUEVA',cuadroId:d.jefe,mensaje:user.nombre+' ha solicitado participar en su cuadro de reemplazo.',leida:false,fecha:date};let warning;
  try{const nr=await fetch(FIRESTORE.replace('/usuarios/','/notificaciones_sicip/')+id,{method:'PATCH',signal:AbortSignal.timeout(4000),headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:Object.fromEntries(Object.entries(note).map(([k,v])=>[k,typeof v==='boolean'?{booleanValue:v}:{stringValue:v}]))})});if(!nr.ok)warning='La solicitud quedó guardada; no se pudo entregar el aviso al jefe.';}catch{warning='La solicitud quedó guardada; no se pudo entregar el aviso al jefe.';}
  return json({id,...data,...(warning?{warning}:{})},201);
 }
 if(path==='/api/base/current'&&method==='GET'){await session(request,env);return json(publicCut(await current(env)));}
 const datasetMatch=path.match(/^\/api\/base\/datasets\/(personas|plazas|antiguedad|catalogos)$/);
 if(datasetMatch&&method==='GET'){
  const user=await session(request,env),cut=await current(env,url.searchParams.get('version')),table=datasetMatch[1];const full=url.searchParams.get('full')==='1';if(full)assert(ADMIN.has(user.rol)||['AREA_PERSONAL','FUERZA_TRABAJO'].includes(user.rol)||!STAFF.has(user.rol),403,'Tu perfil no permite consultar esos campos.');let sql=`SELECT ${['personas','plazas'].includes(table)&&!full?"json_remove(json,'$.privado') AS json":'json'} FROM ${table} WHERE corte=?`,params=[cut.id];
  if(!STAFF.has(user.rol)){
   if(table==='personas'||table==='antiguedad'){sql+=' AND matricula=?';params.push(user.matricula);}
   if(table==='plazas'){sql+=' AND (ocupante=? OR titular=?)';params.push(user.matricula,user.matricula);}
  }
  const column=table==='plazas'?'plaza':table==='catalogos'?'clave':'matricula';const after=url.searchParams.get('after')||'';assert(after.length<=160,400,'Cursor inválido.');if(after){sql+=` AND ${column}>?`;params.push(after);}if(!STAFF.has(user.rol)&&table==='catalogos')sql+=" AND json_extract(json,'$.tipo')<>'restriccion'";const pageValue=url.searchParams.get('page');if(pageValue!==null){const page=Number(pageValue);assert(Number.isInteger(page)&&page>=0&&page<201&&!after,400,'Página inválida.');sql+=` ORDER BY ${column} LIMIT 1000 OFFSET ?`;params.push(page*1000);}else sql+=` ORDER BY ${column} LIMIT 256`;
  const result=await run(env,sql,...params).all();return new Response('['+result.results.map(r=>r.json).join(',')+']',{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-SICIP-Corte':cut.id,'X-Content-Type-Options':'nosniff'}});
 }
 if(path==='/api/base/history'&&method==='GET'){await session(request,env,true);const {results}=await run(env,'SELECT * FROM cortes ORDER BY created_at DESC LIMIT 100').all();const active=(await run(env,"SELECT value FROM settings WHERE key='active'").first())?.value;return json({active,cortes:results.map(c=>publicCut({...c,expected:JSON.parse(c.expected),validation:c.validation?JSON.parse(c.validation):null}))});}
 if(path==='/api/base/imports'&&method==='POST'){
  const user=await session(request,env,true),d=await body(request,200000);assert(/^\d{4}0(?:0[1-9]|1\d|2[0-4])$/.test(d.quincena),400,'Quincena inválida.');assert(/^[a-f0-9]{64}$/.test(d.source_hash),400,'Falta el hash del archivo.');assert(typeof d.source_name==='string'&&d.source_name.length<=250,400,'Nombre de archivo inválido.');
  for(const key of ['personas','plazas','antiguedad','catalogos'])assert(Number.isInteger(d.counts?.[key])&&d.counts[key]>=0&&d.counts[key]<=200000,400,'Conteos inválidos.');assert(d.counts.personas>0&&d.counts.plazas>0,400,'El padrón y las plazas no pueden estar vacíos.');
  const id=crypto.randomUUID();await run(env,'INSERT INTO cortes(id,quincena,created_at,created_by,source_hash,source_name,expected) VALUES(?,?,?,?,?,?,?)',id,d.quincena,new Date().toISOString(),user.matricula,d.source_hash,d.source_name,JSON.stringify({counts:d.counts,warnings:Array.isArray(d.warnings)?d.warnings.slice(0,300):[]})).run();return json({id},201);
 }
 const chunk=path.match(/^\/api\/base\/imports\/([a-f0-9-]{36})\/(personas|plazas|antiguedad|catalogos)$/);
 if(chunk&&method==='PUT'){
  await session(request,env,true);const [,id,table]=chunk,number=Number(url.searchParams.get('chunk'));assert(Number.isInteger(number)&&number>=0&&number<=2000,400,'Número de lote inválido.');const d=await body(request,1500000);validateRows(table,d);const raw=JSON.stringify(d),sha=await hash(raw),prior=await run(env,'SELECT hash FROM chunks WHERE corte=? AND dataset=? AND numero=?',id,table,number).first();if(prior){assert(prior.hash===sha,409,'Este lote ya se recibió con otro contenido.');return json({ok:true,repeated:true});}
  const cut=await run(env,'SELECT status FROM cortes WHERE id=?',id).first();assert(cut?.status==='BORRADOR',409,'La carga no está disponible para cambios.');let insert;
  if(table==='personas')insert=run(env,"INSERT INTO personas(corte,matricula,nombre_search,tc,status,json) SELECT ?,json_extract(value,'$.matricula'),json_extract(value,'$.search'),json_extract(value,'$.tipo_contratacion_clave'),json_extract(value,'$.status_codigo'),value FROM json_each(?)",id,JSON.stringify(d.map(r=>({...r,search:searchKey(r.nombre+' '+r.matricula)}))));
  if(table==='plazas')insert=run(env,"INSERT INTO plazas(corte,plaza,ocupante,titular,puesto,departamento,json) SELECT ?,json_extract(value,'$.plaza_id'),json_extract(value,'$.ocupante_matricula'),json_extract(value,'$.titular_matricula'),json_extract(value,'$.puesto'),json_extract(value,'$.departamento'),value FROM json_each(?)",id,raw);
  if(table==='antiguedad')insert=run(env,"INSERT INTO antiguedad(corte,matricula,json) SELECT ?,json_extract(value,'$.matricula'),value FROM json_each(?)",id,raw);
  if(table==='catalogos')insert=run(env,"INSERT INTO catalogos(corte,clave,json) SELECT ?,json_extract(value,'$.clave'),value FROM json_each(?)",id,raw);
  try{await env.DB.batch([insert,run(env,'INSERT INTO chunks(corte,dataset,numero,hash) VALUES(?,?,?,?)',id,table,number,sha)]);}catch{throw new Fault(409,'No se guardó el lote: revisa duplicados o claves inválidas.');}return json({ok:true,rows:d.length});
 }
 const validate=path.match(/^\/api\/base\/imports\/([a-f0-9-]{36})\/validate$/);
 if(validate&&method==='POST'){await session(request,env,true);return json(await validateCut(env,validate[1]));}
 const activate=path.match(/^\/api\/base\/cortes\/([a-f0-9-]{36})\/activate$/);
 if(activate&&method==='POST'){
  const user=await session(request,env,true),cut=await current(env,activate[1]),d=await body(request,2048);assert(typeof d.expected_current_id==='string',400,'Falta la versión que se está reemplazando.');
  const result=await env.DB.batch([run(env,"UPDATE settings SET value=? WHERE key='active' AND value=?",cut.id,d.expected_current_id),run(env,"INSERT INTO audit(id,corte,accion,usuario,fecha) SELECT ?,?,'ACTIVAR',?,? WHERE changes()=1",crypto.randomUUID(),cut.id,user.matricula,new Date().toISOString())]);assert(result[0].meta.changes===1,409,'La quincena activa cambió. Recarga antes de activar.');return json({ok:true,corte:publicCut(cut)});
 }
 throw new Fault(404,'Ruta no encontrada.');
}
export default {async fetch(request,env,ctx){try{
 const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return await api(request,env);
 if(/^\/data-(?:usuarios(?:-full)?|trabajadores|jefesServicio|plazas(?:-full)?(?:-\d{7})?|vacantes|ft-(?:trabajadores|nomina-\d{7}|antiguedad|clasificacion))\.json$/.test(url.pathname))return json({error:'Consulta estos datos mediante la base central y una sesión válida.'},401);
 if (/^\/(pases|fuerza-trabajo|examenes)\/(?:[^.]*|[^/]+\.html)$/.test(url.pathname)) {try{await session(request,env);}catch(e){if(e.status===401)return Response.redirect(new URL('/login',url),303);throw e;}}
 return await env.ASSETS.fetch(request);
 }catch(e){if(e instanceof Fault)return json({error:e.message},e.status);if(e.message?.includes('Clave')||e.message?.includes('registro')||e.message?.includes('cuentas')||e.message?.includes('lote'))return json({error:e.message},400);console.error('SICIP API failure',e.name);return json({error:'No se pudo completar la operación. Intenta de nuevo.'},500);}}};
