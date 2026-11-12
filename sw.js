/* สมุดโอที: ทำให้เปิดได้ตอนไม่มีเน็ต
   หน้าเว็บ: ลองโหลดใหม่ก่อน (รอไม่เกิน 4 วินาที) ถ้าไม่ได้ใช้ของที่จำไว้ จึงได้ฟีเจอร์ใหม่ทุกครั้งที่ออนไลน์
   ฟอนต์และรูป: ใช้ของที่จำไว้ก่อน แล้วอัปเดตเงียบ ๆ ข้อมูลของผู้ใช้อยู่ใน localStorage ไม่เกี่ยวกับไฟล์นี้ */
const CACHE = 'otbook-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !font) return;
  if (req.mode === 'navigate') {
    const timeout = new Promise((_, rej) => setTimeout(rej, 4000));
    e.respondWith(
      Promise.race([fetch(req), timeout]).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
        return res;
      }).catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
