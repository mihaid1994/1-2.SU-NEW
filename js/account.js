// account.js

document.addEventListener("DOMContentLoaded", function () {
  const accountButton = document.getElementById("accountButton");
  const accountDropdown = document.getElementById("accountDropdown");
  const logButton = document.getElementById("logButton");
  const loginButton = document.getElementById("loginButton");

  // Получаем элементы внутри .info-buttons
  const infoButtons = accountDropdown.querySelector(".info-buttons");

  // Сохраняем оригинальное содержимое .info-buttons для восстановления
  const originalInfoButtonsContent = infoButtons.innerHTML;

  // Элементы, которые нужно скрыть при незалогиненном состоянии
  const buttonsToHide = {
    orders: accountDropdown.querySelector(".orders-button2"),
    waitlist: accountDropdown.querySelector(".waitlist-button"),
    settings: accountDropdown.querySelector(".settings-ac-button"),
  };

  // Инициализация переменной isLoggedIn с установкой в true при каждой загрузке страницы
  let isLoggedIn = true; // Всегда устанавливаем в true при загрузке страницы
  localStorage.setItem("isLoggedIn", "true"); // Сохраняем состояние в localStorage

  console.log("Initial isLoggedIn:", isLoggedIn);

  /**
   * Функция обновления интерфейса аккаунта в зависимости от состояния входа
   */
  function updateAccountUI() {
    const logRegister = accountDropdown.querySelector(".logregister");
    const userButton = document.getElementById("UserButton");
    const cabinetButton = accountDropdown.querySelector(".Cabinet-button");

    if (isLoggedIn) {
      // Восстанавливаем оригинальное содержимое .info-buttons
      infoButtons.innerHTML = originalInfoButtonsContent;

      // Удаляем элемент .logregister, если он существует
      if (logRegister) {
        logRegister.remove();
        console.log(".logregister удален");
      }

      // Изменяем иконку на иконку пользователя
      if (userButton) {
        userButton.classList.remove(
          "ri-error-warning-line",
          "exclamation-mark"
        );
        userButton.classList.add("ri-account-circle-line");
        console.log("UserButton иконка изменена на пользователя");
      }

      // Изменяем название кнопки на "Личный кабинет"
      if (cabinetButton) {
        cabinetButton.textContent = "Личный кабинет";
        console.log("Cabinet-button переименован на 'Личный кабинет'");
      }

      // Показываем скрытые кнопки
      Object.values(buttonsToHide).forEach((btn) => {
        if (btn) {
          btn.style.display = "block";
        }
      });
    } else {
      // Очищаем содержимое .info-buttons
      infoButtons.innerHTML = "";

      // Создаем элемент .logregister, если его еще нет
      if (!accountDropdown.querySelector(".logregister")) {
        const newLogRegister = document.createElement("div");
        newLogRegister.classList.add("logregister");
        newLogRegister.innerHTML = `
          <span class="name">
            <i class="ri-login-circle-line"></i> Вход / Регистрация
          </span>
        `;
        infoButtons.appendChild(newLogRegister);
        console.log(".logregister добавлен");

        // Добавляем стиль nowrap и центрирование
        newLogRegister.style.whiteSpace = "nowrap";
        newLogRegister.style.textAlign = "center";

        // Добавляем обработчик клика для имитации клика на целевой элемент
        newLogRegister.addEventListener("click", function () {
          // Имитация клика на целевом элементе (#loginButton)
          loginButton.click();
          console.log("Имитация клика на #loginButton");
        });
      }

      // Изменяем иконку на восклицательный знак без добавления дополнительного класса
      if (userButton) {
        userButton.classList.remove("ri-account-circle-line");
        userButton.classList.add("ri-error-warning-line");
        console.log("UserButton иконка изменена на восклицательный знак");
      }

      // Изменяем название кнопки на "Возможности личного кабинета"
      if (cabinetButton) {
        cabinetButton.textContent = "Возможности личного кабинета";
        console.log(
          "Cabinet-button переименован на 'Возможности личного кабинета'"
        );
      }

      // Центрируем .logregister
      infoButtons.style.display = "flex";
      infoButtons.style.justifyContent = "center";
      infoButtons.style.alignItems = "center";

      // Скрываем определенные кнопки
      Object.values(buttonsToHide).forEach((btn) => {
        if (btn) {
          btn.style.display = "none";
        }
      });
    }

    // Сохранение состояния в localStorage
    localStorage.setItem("isLoggedIn", isLoggedIn);
  }

  // Инициализация интерфейса при загрузке страницы
  updateAccountUI();

  // Получаем элементы модального окна регистрации
  const registrationModal = document.getElementById("registrationModal");
  const closeModalButton = registrationModal.querySelector(".close-button");

  /**
   * Функция для открытия модального окна регистрации
   * Сейчас не используется, можно удалить или оставить для будущих нужд
   */
  function openRegistrationModal() {
    // registrationModal.classList.remove("hidden");
    // registrationModal.classList.add("show");
    console.log("Форма регистрации не будет открыта напрямую.");
  }

  /**
   * Функция для закрытия модального окна регистрации
   * Сейчас не используется, можно удалить или оставить для будущих нужд
   */
  function closeRegistrationModal() {
    // registrationModal.classList.remove("show");
    // registrationModal.classList.add("hidden");
    console.log("Форма регистрации не будет закрыта напрямую.");
  }

  // Обработчик для закрытия модального окна при клике на кнопку закрытия
  closeModalButton.addEventListener("click", function () {
    closeRegistrationModal();
  });

  // Обработчик для закрытия модального окна при клике вне его
  window.addEventListener("click", function (event) {
    if (event.target === registrationModal) {
      closeRegistrationModal();
    }
  });

  /**
   * Обработчик для кнопки "Вход / Регистрация" в выпадающем меню аккаунта
   */
  logButton.addEventListener("click", function (e) {
    e.preventDefault(); // Предотвращаем переход по ссылке
    e.stopPropagation(); // Предотвращаем всплытие события
    accountDropdown.classList.toggle("show");
    accountButton.classList.toggle("active");
    console.log("Выпадающее меню переключено");
  });

  /**
   * Закрытие выпадающего меню при клике вне его
   */
  document.addEventListener("click", function (e) {
    if (
      !accountButton.contains(e.target) &&
      !accountDropdown.contains(e.target)
    ) {
      accountDropdown.classList.remove("show");
      accountButton.classList.remove("active");
      console.log("Выпадающее меню закрыто при клике вне");
    }
  });

  /**
   * Закрытие меню при нажатии на кнопку ESC
   */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      accountDropdown.classList.remove("show");
      accountButton.classList.remove("active");
      console.log("Выпадающее меню закрыто при нажатии ESC");
    }
  });

  /**
   * Функция для переключения иконки "Совместная работа"
   */
  const iconGroups = accountDropdown.querySelectorAll(
    ".info-buttons .icon-group"
  );

  iconGroups.forEach(function (group) {
    // Проверяем, содержит ли группа текст "Совместная работа"
    if (group.textContent.trim().startsWith("Совместная работа")) {
      group.addEventListener("click", function (e) {
        e.stopPropagation(); // Предотвращаем всплытие события
        group.classList.toggle("active"); // Переключаем класс active

        // Переключение иконки (например, добавление класса для изменения иконки)
        const toggleIcon = group.querySelector("i");
        if (toggleIcon) {
          toggleIcon.classList.toggle("ri-toggle-fill");
        }

        console.log(
          "Совместная работа переключена:",
          group.classList.contains("active")
        );
      });
    }
  });

  /**
   * Делегирование событий для клика на любые кликабельные элементы внутри accountDropdown
   */
  accountDropdown.addEventListener("click", function (e) {
    // Расширяем селекторы для захвата .icon-group
    const target = e.target.closest("button, .logregister, .icon-group");
    if (!target) return;

    if (target.id === "logout") {
      e.stopPropagation();
      console.log("Logout button clicked");
      // Логика для выхода из аккаунта
      isLoggedIn = false;
      updateAccountUI();
      console.log("Выпадающее меню обновлено после выхода");
      return;
    }

    if (target.id === "workTogether") {
      e.stopPropagation();
      console.log("Work Together clicked");
      // Логика для Work Together
      const group = target;
      group.classList.toggle("active");
      const toggleIcon = group.querySelector("i");
      if (toggleIcon) {
        toggleIcon.classList.toggle("ri-toggle-fill");
      }
      console.log(
        "Совместная работа переключена:",
        group.classList.contains("active")
      );
      return;
    }

    if (target.id === "hintMode") {
      e.stopPropagation();
      console.log("Hint Mode clicked");
      // Логика для Hint Mode
      const hintIcon = target.querySelector("i");
      if (hintIcon) {
        hintIcon.classList.toggle("active");
      }
      console.log(
        "Режим подсказок активен:",
        hintIcon.classList.contains("active")
      );
      return;
    }

    if (target.classList.contains("logregister")) {
      e.stopPropagation();
      // Открываем форму регистрации путем имитации клика на целевой элемент (#loginButton)
      loginButton.click();
      console.log("Имитация клика на #loginButton");
      return;
    }

    // Если клик на другие элементы, закрываем меню
    accountDropdown.classList.remove("show");
    accountButton.classList.remove("active");
    console.log("Выпадающее меню закрыто через делегирование");
  });

  // Измененный обработчик для loginButton
  loginButton.addEventListener("click", function () {
    // Убираем изменение состояния входа
    console.log("Клик на loginButton, но вход не выполняется");
    // isLoggedIn = true;
    // updateAccountUI();
  });

  // Инициализация формы регистрации
  // window.initRegisterFunction(registrationModal); // Убираем прямую инициализацию регистрации
});
