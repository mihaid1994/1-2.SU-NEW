// Проверяем поддержку Service Worker в браузере
if ("serviceWorker" in navigator) {
  let newWorker;
  let refreshing = false;

  // Регистрируем Service Worker
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker зарегистрирован:", registration.scope);

        // Слушаем обновления
        registration.addEventListener("updatefound", () => {
          newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            // Если новый Service Worker установлен и готов
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.error("Ошибка при регистрации Service Worker:", error);
      });
  });

  // Автоматически обновляем страницу при смене Service Worker
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });
}

// Показываем уведомление об обновлении
function showUpdateNotification() {
  // Создаем элемент уведомления
  const updateBanner = document.createElement("div");
  updateBanner.style.position = "fixed";
  updateBanner.style.bottom = "0";
  updateBanner.style.left = "0";
  updateBanner.style.right = "0";
  updateBanner.style.backgroundColor = "#4285f4";
  updateBanner.style.color = "white";
  updateBanner.style.padding = "1rem";
  updateBanner.style.textAlign = "center";
  updateBanner.style.zIndex = "9999";

  updateBanner.innerHTML = `
      <p style="margin: 0 0 0.5rem 0">Доступно обновление приложения!</p>
      <button id="update-btn" style="background: white; color: #4285f4; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
        Обновить сейчас
      </button>
    `;

  document.body.appendChild(updateBanner);

  // Обработчик нажатия на кнопку обновления
  document.getElementById("update-btn").addEventListener("click", () => {
    if (newWorker) {
      // Сообщаем Service Worker о необходимости обновления
      newWorker.postMessage({ action: "skipWaiting" });
    }
  });
}
