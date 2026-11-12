// Authenticated business directory for worker/signature pickers; never exposes payroll/private records.
export async function directorioAPI(request,env,h){const {session,current,run,json,assert}=h;await session(request,env);assert(request.method==='GET',405,'Consulta de sólo lectura.');const url=new URL(request.url),c=await current(env,url.searchParams.get('version')||undefined),page=Number(url.searchParams.get('page')||0);assert(Number.isInteger(page)&&page>=0&&page<201,400,'Página inválida.');const rows=(await run(env,`SELECT p.matricula,json_extract(p.json,'$.nombre') nombre,
 COALESCE(NULLIF(z.puesto,''),json_extract(p.json,'$.puesto_padron'),'') puesto_padron,
 COALESCE(NULLIF(json_extract(z.json,'$.categoria'),''),json_extract(p.json,'$.categoria_padron'),'') categoria_padron,
 COALESCE(NULLIF(z.departamento,''),json_extract(p.json,'$.departamento_padron'),'') departamento_padron,
 COALESCE(NULLIF(json_extract(z.json,'$.departamento_nombre'),''),json_extract(p.json,'$.departamento_nombre_padron'),'') departamento_nombre_padron
 FROM personas p LEFT JOIN plazas z ON z.corte=p.corte AND z.plaza=(SELECT plaza FROM plazas WHERE corte=p.corte AND ocupante=p.matricula ORDER BY plaza LIMIT 1)
 WHERE p.corte=? ORDER BY p.matricula LIMIT 1000 OFFSET ?`,c.id,page*1000).all()).results;return json({corte:c.id,quincena:c.quincena,total:c.validation?.counts?.personas??c.expected.counts.personas,pagina:page,personas:rows});}
