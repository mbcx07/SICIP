/* Background handlers: independent of an open page or an authenticated page session. */
self.addEventListener('push',event=>{
 let p={};try{p=event.data?event.data.json():{};}catch{p={};}
 event.waitUntil(self.registration.showNotification(p.title||'Aviso SICIP',{body:p.body||'Tienes una actualización. Abre SICIP para consultarla.',icon:'/icons/sicip-192.png',badge:'/icons/sicip-192.png',tag:p.tag||'sicip-aviso',data:{url:p.url||'/mis-tramites'}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();let url=new URL('/mis-tramites',self.location.origin).href;
 try{const target=new URL(event.notification.data?.url||'/mis-tramites',self.location.origin);if(target.origin===self.location.origin)url=target.href;}catch{}
 event.waitUntil((async()=>{const windows=await clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows)if('focus'in client){await client.navigate(url);return client.focus();}return clients.openWindow(url);})());
});
