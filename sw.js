// Never intercept private storage/auth traffic or persist private photos offline.
// The one exception: the public Road to Hāna guide photos (Wikimedia Commons) are kept for no-signal stretches of the drive.
const HANA_CACHE='hana-photos-v1';
const HANA_FILES=['/assets/hana/african-tulip.webp','/assets/hana/hana-bay.webp','/assets/hana/honomanu.webp','/assets/hana/keanae-coast.webp','/assets/hana/keanae-taro.webp','/assets/hana/mile-marker-zero.webp','/assets/hana/one-lane-bridge.webp','/assets/hana/paia.webp','/assets/hana/rainbow-eucalyptus.webp','/assets/hana/roadside-waterfall.webp','/assets/hana/rooster.webp','/assets/hana/sea-cave.webp','/assets/hana/shampoo-ginger.webp','/assets/hana/waianapanapa.webp','/assets/hana/waikamoi.webp','/road-to-hana.webp'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(HANA_CACHE).then(c=>c.addAll(HANA_FILES)).catch(()=>{}))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('loy-')).map(key=>caches.delete(key)))),
  self.clients.claim()
])));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(HANA_FILES.includes(url.pathname)){
    event.respondWith(caches.open(HANA_CACHE).then(c=>c.match(url.pathname).then(hit=>hit||fetch(event.request).then(r=>{if(r.ok)c.put(url.pathname,r.clone());return r}))));
    return;
  }
  // Network-only: no photo, auth or application response is added to a cache.
  event.respondWith(fetch(event.request));
});
