import {sha} from './notificaciones-core.mjs';
export async function examenesAPI(request,env,{session,run,json,body,assert}){
 const u=await session(request,env),url=new URL(request.url),admin=['ADMIN','ADMINISTRADOR'].includes(u.rol);
 if(request.method==='GET'){
  const all=url.searchParams.get('scope')==='todos';assert(!all||admin,403,'Sólo Administración consulta todos los resultados.');const before=url.searchParams.get('antes')||'',[fecha,id]=before.split('|');assert(!before||/^\d+\|[a-f0-9]{64}$/.test(before),400,'Página inválida.');
  const rows=(await run(env,'SELECT * FROM examenes_resultados WHERE (?=1 OR matricula=?) AND (?=\'\' OR fecha<? OR (fecha=? AND id<?)) ORDER BY fecha DESC,id DESC LIMIT 201',all?1:0,u.matricula,before,Number(fecha)||0,Number(fecha)||0,id||'').all()).results;
  return json({resultados:rows.slice(0,200).map(r=>({...JSON.parse(r.payload),id:r.id,matricula:r.matricula,usuario:r.nombre})),siguiente:rows.length>200?rows[199].fecha+'|'+rows[199].id:null});
 }
 assert(request.method==='POST',405,'El historial no se elimina.');const d=await body(request,10000);assert(!d.matricula||d.matricula===u.matricula,403,'Sólo puedes guardar tus propios resultados.');assert(Number.isSafeInteger(d.fecha)&&d.fecha>0&&Number.isInteger(d.total)&&d.total>0&&d.total<=5000&&Number.isInteger(d.correctas)&&d.correctas>=0&&d.correctas<=d.total,400,'Resultado inválido.');assert(typeof d.tema==='string'&&d.tema.length<=250&&['practica','examen'].includes(d.modo),400,'Tema o modo inválido.');
 const payload={fecha:d.fecha,tema:d.tema,modo:d.modo,total:d.total,correctas:d.correctas,calificacion:d.correctas/d.total*100,tiempoMin:Number(d.tiempoMin)||0},id=await sha(u.matricula+'|'+JSON.stringify(payload));
 await run(env,'INSERT INTO examenes_resultados(id,matricula,nombre,fecha,payload,guardado) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',id,u.matricula,u.nombre,d.fecha,JSON.stringify(payload),new Date().toISOString()).run();return json({...payload,id,matricula:u.matricula,usuario:u.nombre,guardado:true});
}
