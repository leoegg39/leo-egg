const CACHE='leo-egg-github-v767-force';
const CORE=['./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin) return;

  // App shell and live data must always try the network first.
  if(e.request.mode==='navigate' || u.pathname.endsWith('/index.html') || u.pathname.endsWith('/live.json')){
    e.respondWith(
      fetch(e.request,{cache:'no-store'})
        .then(r=>r)
        .catch(()=>caches.match('./index.html').then(x=>x||caches.match(e.request)))
    );
    return;
  }

  // Static assets can be cached, but refresh the cache in the background.
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fresh=fetch(e.request).then(r=>{
        if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
        return r;
      }).catch(()=>cached);
      return cached||fresh;
    })
  );
});
