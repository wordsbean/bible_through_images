// ============================================================
// 이미지로 읽는 다국어 성경 - Lingo Power / Service Worker
// ------------------------------------------------------------
// - 핵심 파일(HTML, 목차 인덱스, 매핑 데이터)은 설치 시점에 미리 캐싱
// - 책별 절 데이터(bible_data/*.json)는 사용자가 실제로 그 책을 열 때 캐싱
// - 이미지(jsDelivr CDN, 다른 도메인)도 처음 볼 때 캐싱해두고, 그다음부턴 오프라인에서도 표시됨
// ============================================================

const CACHE_NAME = 'bible-images-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './bible_data/index.json',
  './family_parent_map.json',
  './devotional_365.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST 등은 그대로 네트워크로

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached; // 캐시 우선 - 오프라인에서도 즉시 표시

      return fetch(req)
        .then((res) => {
          // 이미지(jsDelivr CDN, 다른 도메인)든 같은 도메인 데이터든, 정상 응답이면 캐시에 저장해서
          // 다음번엔 오프라인이거나 네트워크가 느려도 바로 뜨게 함
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached); // 네트워크도 실패하면 그냥 undefined(브라우저 기본 처리)
    })
  );
});
