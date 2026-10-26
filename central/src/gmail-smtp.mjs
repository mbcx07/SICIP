// Implicit TLS to Gmail only. Never logs SMTP replies or credentials.
const utf8=new TextEncoder();
const encoded=s=>btoa(String.fromCharCode(...utf8.encode(s)));
const address=s=>typeof s==='string'&&s.length<=254&&/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s);
export function gmailMessage({from,to,subject,text,id,date=new Date()}){
 if(!address(from)||!address(to)||!/^[-a-zA-Z0-9]+$/.test(id))throw Error('MAIL_INVALIDO');
 const title=String(subject).replace(/[\r\n]/g,' ').slice(0,150),body=encoded(String(text).replace(/\r?\n/g,'\r\n')).match(/.{1,76}/g)?.join('\r\n')||'';
 // Fold encoded words at safe Unicode character boundaries.
 const words=[];let chunk='';for(const c of title){if(utf8.encode(chunk+c).length>36){words.push('=?UTF-8?B?'+encoded(chunk)+'?=');chunk='';}chunk+=c;}if(chunk)words.push('=?UTF-8?B?'+encoded(chunk)+'?=');
 return ['From: SICIP <'+from+'>','To: <'+to+'>','Date: '+date.toUTCString(),'Message-ID: <sicip-'+id+'@'+from.split('@')[1]+'>','Subject: '+words.join('\r\n '),'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',body,''].join('\r\n');
}
export async function gmailSend(env,message,{connect,timeout=20000,authenticateOnly=false}={}){
 const from=env.GMAIL_USER,password=String(env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');
 if(!address(from)||!from.endsWith('@gmail.com')||!password)throw Error('GMAIL_CONFIG');
 const mime=authenticateOnly?'':gmailMessage({...message,from});
 if(!connect)({connect}=await import('cloudflare:sockets'));
 const socket=connect({hostname:'smtp.gmail.com',port:465},{secureTransport:'on'});let reader,writer,timer,buffer='';const decoder=new TextDecoder();
 const operation=(async()=>{
  await socket.opened;reader=socket.readable.getReader();writer=socket.writable.getWriter();
  async function line(){while(!buffer.includes('\r\n')){const {value,done}=await reader.read();if(done)throw Error('SMTP_CERRADO');buffer+=decoder.decode(value,{stream:true});if(buffer.length>32768)throw Error('SMTP_RESPUESTA');}const i=buffer.indexOf('\r\n'),s=buffer.slice(0,i);buffer=buffer.slice(i+2);return s;}
  async function reply(expected){let code;for(let n=0;n<100;n++){const s=await line();if(!/^\d{3}[ -]/.test(s))throw Error('SMTP_RESPUESTA');const current=Number(s.slice(0,3));if(code&&code!==current)throw Error('SMTP_RESPUESTA');code=current;if(s[3]===' '){if(code!==expected)throw Error('SMTP_'+code);return;}}throw Error('SMTP_RESPUESTA');}
  async function command(s,expected){await writer.write(utf8.encode(s+'\r\n'));await reply(expected);}
  await reply(220);await command('EHLO sicip-bcs.pages.dev',250);
  await command('AUTH PLAIN '+encoded('\0'+from+'\0'+password),235);
  if(!authenticateOnly){await command('MAIL FROM:<'+from+'>',250);await command('RCPT TO:<'+message.to+'>',250);await command('DATA',354);await writer.write(utf8.encode(mime+'.\r\n'));await reply(250);}
  // A successful final DATA response is acceptance; QUIT errors cannot undo it.
  return new Response(null,{status:200});
 })();
 try{return await Promise.race([operation,new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('SMTP_TIMEOUT'));void socket.close().catch(()=>{});},timeout);})]);}
 finally{clearTimeout(timer);try{await socket.close();}catch{}try{reader?.releaseLock();writer?.releaseLock();}catch{}}
}
