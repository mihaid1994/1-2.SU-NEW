// sidebar.js

document.addEventListener("DOMContentLoaded", function () {
  const notificationCard = document.querySelector(".notification-card");

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

  // Инициализация
  initializeNotificationCard();
});
