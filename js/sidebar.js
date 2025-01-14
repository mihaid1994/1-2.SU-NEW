// --- Завёрнутый Скрипт: initSidebar ---

window.initSidebar = function (root = document) {
  // Получаем элемент уведомления внутри переданного корня
  const notificationCard = root.querySelector(".notification-card");

  // Проверяем наличие элемента
  if (!notificationCard) {
    console.warn(
      "Элемент с классом '.notification-card' не найден внутри корня:",
      root
    );
    return;
  }

  // Инициализация: развернутое состояние
  function initializeNotificationCard() {
    notificationCard.classList.add("collapsed");
    notificationCard.classList.remove("expanded");
  }

  // Функция для сворачивания уведомления
  function collapseNotificationCard() {
    notificationCard.classList.add("collapsed");
    notificationCard.classList.remove("expanded");
  }

  // Функция для разворачивания уведомления
  function expandNotificationCard() {
    notificationCard.classList.add("expanded");
    notificationCard.classList.remove("collapsed");
  }

  // Функция для переключения состояния уведомления
  function toggleNotificationCard() {
    if (notificationCard.classList.contains("collapsed")) {
      expandNotificationCard();
    } else {
      collapseNotificationCard();
    }
  }

  // Обработчик клика по уведомлению
  notificationCard.addEventListener("click", toggleNotificationCard);

  // Инициализация состояния уведомления при запуске
  initializeNotificationCard();
};

// Если вы динамически добавляете новые контейнеры, вызывайте initSidebar с соответствующим root
// Например:
// const newRoot = document.querySelector('#new-container');
// window.initSidebar(newRoot);
