// Имя кеша, меняйте при обновлении приложения
const CACHE_NAME = "1-2-su-v1.0.0";

// Список файлов для кеширования при установке
const filesToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // CSS файлы
  "/css/desktop.css",
  "/css/mobile.css",
  "/css/test-desktop.css",
  "/css/test-mobile.css",
  "/css/categories-desktop.css",
  "/css/categories-mobile.css",
  // JavaScript файлы
  "/js/globalcomm.js",
  "/js/combined.js",
  "/js/inputimit.js",
  "/js/excel_pdf.js",
  "/js/account.js",
  "/js/registration.js",
  "/js/nouislider.min.js",
  // Иконки
  "/images/icons/icon-72x72.png",
  "/images/icons/icon-96x96.png",
  "/images/icons/icon-128x128.png",
  "/images/icons/icon-144x144.png",
  "/images/icons/icon-152x152.png",
  "/images/icons/icon-192x192.png",
  "/images/icons/icon-384x384.png",
  "/images/icons/icon-512x512.png",
  // Логотип
  "/images/svg/Logo/energomixlogo.svg",
  // Основные изображения
  "/images/jpg/ban/kontakty-2.jpg",
  "/images/jpg/Brandfull/image1.jpg",
  "/images/jpg/Brandfull/image2.jpg",
  "/images/jpg/Brandfull/image3.jpg",
  "/images/jpg/Brandfull/image4.jpg",
  "/images/jpg/Brandfull/image5.jpg",
  "/images/jpg/Brandfull/image6.jpg",
];

// Установка Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(filesToCache);
    })
  );
});

// Активация Service Worker
self.addEventListener("activate", (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Стратегия кеширования: сначала кеш, потом сеть
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
