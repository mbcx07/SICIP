#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const SA_FILE = '/home/moises-beltran-castro/.openclaw/media/inbound/sicip-1369d-firebase-adminsdk-jcczy-f115364f6d---fff9c8ad-56ff-4ca4-bf70-dc7f8042010b.json';
const UID = 'WIqzVpBI8lQ9mkGJluXDUpZlQTF3';
const EMAIL = 'moises.beltran@imss.gob.mx';

async function getToken() {
  const sa = JSON.parse(fs.readFileSync(SA_FILE, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
  const p = Buffer.from(JSON.stringify({iss:sa.client_email,sub:sa.client_email,aud:'https://oauth2.googleapis.com/token',scope:'https://www.googleapis.com/auth/cloud-platform',iat:now,exp:now+3600})).toString('base64url');
  const crypto = require('crypto');
  const s = crypto.createSign('RSA-SHA256'); s.update(h+'.'+p);
  const sig = s.sign(sa.private_key,'base64url');
  const jwt = h+'.'+p+'.'+sig;
  const r = await req('POST','oauth2.googleapis.com','/token',null,`grant_type=urn%3Aietf%3Aparams%3Aoauth2%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`);
  return JSON.parse(r).access_token;
}

function req(method, host, path, headers, body) {
  return new Promise((res,rej)=>{
    const o = {hostname:host,path,method,headers:headers||{}};
    const q = https.request(o,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));});
    q.on('error',rej);
    if(body)q.write(body);
    q.end();
  });
}

function toFields(obj) {
  const f={};
  for(const [k,v] of Object.entries(obj)) {
    if(v==null)continue;
    if(typeof v==='string')f[k]={stringValue:v};
    else if(typeof v==='number')f[k]={integerValue:v};
    else if(typeof v==='boolean')f[k]={booleanValue:v};
    else if(Array.isArray(v))f[k]={arrayValue:{values:v.map(i=>typeof i==='string'?{stringValue:i}:{stringValue:String(i)})}};
    else if(typeof v==='object')f[k]={mapValue:{fields:toFields(v)}};
    else f[k]={stringValue:String(v)};
  }
  return f;
}

async function firestore(method, coll, docId, data) {
  const t = await getToken();
  const p = `/v1/projects/sicip-1369d/databases/(default)/documents/${coll}/${docId}?access_token=${t}`;
  const b = data ? JSON.stringify({fields:toFields(data)}) : null;
  const r = await req(method,'firestore.googleapis.com',p,{'Authorization':'Bearer '+t,'Content-Type':'application/json'},b);
  return JSON.parse(r);
}

async function main() {
  console.log('=== Configurando Firestore ===\n');

  // 1. Usuario admin doc
  console.log('1. Creando documento de usuario admin...');
  try {
    const r = await firestore('PATCH','usuarios',UID,{
      uid:UID, email:EMAIL, nombre:'Administrador', rol:'ADMIN', activo:true,
      fechaCreacion:new Date().toISOString(), matricula:null, unidadClave:null, unidadNombre:null
    });
    console.log('   ✅', r.name || 'OK');
  } catch(e) { console.log('   ⚠️', e.message || JSON.parse(e.message||'{}').error?.message); }

  // 2. Unidades
  console.log('\n2. Creando unidades...');
  const unidades = [
    {clave:'03HD01',nombre:'Hospital General La Paz',tipo:'HOSPITAL',delegacion:'Baja California Sur',activo:true},
    {clave:'03UM34',nombre:'UMF 34 La Paz',tipo:'UMF',delegacion:'Baja California Sur',activo:true},
    {clave:'03HG02',nombre:'Hospital General Cabo San Lucas',tipo:'HG',delegacion:'Baja California Sur',activo:true},
    {clave:'03UM19',nombre:'UMF 19 San José del Cabo',tipo:'UMF',delegacion:'Baja California Sur',activo:true},
  ];
  for(const u of unidades) {
    try { const r = await firestore('PATCH','unidades',u.clave,u); console.log('   ✅', u.clave); } catch(e) {}
  }

  // 3. Tipos de tramite
  console.log('\n3. Creando tipos de trámite...');
  const tipos = [
    {id:'sustitucion',tipo:'SUSTITUCION',nombre:'Sustitución',modulo:'SOLICITUDES_PAGO',solicitaRol:['JEFE_SERVICIO','AREA_PERSONAL'],validaRol:['AREA_PERSONAL','ADMIN'],activo:true},
    {id:'tiempo_extraordinario',tipo:'TIEMPO_EXTRAORDINARIO',nombre:'Tiempo Extraordinario',modulo:'SOLICITUDES_PAGO',solicitaRol:['JEFE_SERVICIO','AREA_PERSONAL'],validaRol:['AREA_PERSONAL','ADMIN'],activo:true},
    {id:'guardia_festiva',tipo:'GUARDIA_FESTIVA',nombre:'Guardia Festiva',modulo:'SOLICITUDES_PAGO',solicitaRol:['JEFE_SERVICIO'],validaRol:['AREA_PERSONAL','ADMIN'],activo:true},
    {id:'nivelacion',tipo:'NIVELACION',nombre:'Nivelación a Plaza Superior',modulo:'SOLICITUDES_PAGO',solicitaRol:['JEFE_SERVICIO','AREA_PERSONAL'],validaRol:['AREA_PERSONAL','ADMIN'],activo:true},
    {id:'solicitud_contrato',tipo:'SOLICITUD_CONTRATO',nombre:'Solicitud de Contrato',modulo:'SOLICITUDES_PAGO',solicitaRol:['JEFE_SERVICIO','AREA_PERSONAL'],validaRol:['AREA_PERSONAL','ADMIN'],activo:true},
    {id:'pase_salida',tipo:'PASE_SALIDA',nombre:'Pase de Salida',modulo:'PASES',solicitaRol:['TRABAJADOR'],validaRol:['JEFE_SERVICIO','AREA_PERSONAL','ADMIN'],activo:true},
  ];
  for(const t of tipos) {
    try { await firestore('PATCH','tipos_tramite',t.id,t); console.log('   ✅', t.nombre); } catch(e) { console.log('   ⚠️', t.id); }
  }

  // 4. Config
  console.log('\n4. Creando configuración...');
  try {
    await firestore('PATCH','configuracion','sistema',{
      nombreInstitucion:'Instituto Mexicano del Seguro Social',
      ooad:'Delegación Baja California Sur',
      ejercicioActual:new Date().getFullYear(),
      mensajeBienvenida:'Bienvenido al Sistema Integral de Captura de Información de Personal'
    });
    console.log('   ✅ Sistema configurado');
  } catch(e) {}

  console.log('\n=== ✅ Listo ===');
  console.log('\n📧 Login:', EMAIL);
  console.log('🔑 Password: Mo1s3s');
  console.log('\n📋 UID del admin:', UID);
}
main().catch(e=>console.error('❌',e.message));
