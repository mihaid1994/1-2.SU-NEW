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

// При установке Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker...", event);

  // Пропускаем стадию ожидания и сразу активируем
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      return cache.addAll(filesToCache);
    })
  );
});

// При активации Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Service Worker...", event);

  // Получаем контроль сразу после активации
  self.clients.claim();

  // Удаляем старые кеши
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// При запросе ресурсов (стратегия: сначала кеш, потом сеть)
self.addEventListener("fetch", (event) => {
  // Пропускаем запросы API и другие динамические ресурсы
  if (event.request.url.includes("/api/") || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Если ресурс найден в кеше, возвращаем его
      if (cachedResponse) {
        return cachedResponse;
      }

      // Иначе обращаемся к сети
      return fetch(event.request)
        .then((response) => {
          // Проверяем валидность ответа
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Клонируем ответ, т.к. он может быть использован только один раз
          const responseToCache = response.clone();

          // Добавляем в кеш для дальнейшего использования
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.log(
            "[Service Worker] Fetch failed; returning offline page",
            error
          );
          // Если не можем получить ресурс, показываем офлайн-страницу
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }

          // Или возвращаем заглушку для изображений
          if (event.request.destination === "image") {
            return new Response(
              '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
                '<rect width="400" height="300" fill="#f0f0f0"/>' +
                '<text x="50%" y="50%" font-size="24" text-anchor="middle" fill="#999">Офлайн</text>' +
                "</svg>",
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }

          return new Response("Ресурс недоступен в офлайн-режиме");
        });
    })
  );
});

// Обработка сообщений (для принудительного обновления)
self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
