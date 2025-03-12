document.addEventListener("DOMContentLoaded", function () {
  // ========================================================
  // Получаем элементы триггеров (десктоп и мобиль)
  // ========================================================
  const desktopAccountButton = document.querySelector(
    ".hide-mobile #accountButton"
  );
  const mobileAccountButton = document.querySelector(
    ".hide-desktop #accountButton"
  );
  // Единый блок шторки аккаунта
  const unifiedAccountDropdown = document.getElementById(
    "accountDropdownUnified"
  );
  const loginButton = document.getElementById("loginButton");

  // Получаем logButton из каждого триггера
  const desktopLogButton = desktopAccountButton
    ? desktopAccountButton.querySelector("#logButton")
    : null;
  const mobileLogButton = mobileAccountButton
    ? mobileAccountButton.querySelector("#logButton")
    : null;

  // ========================================================
  // Состояние входа
  // ========================================================
  let isLoggedIn = true;
  localStorage.setItem("isLoggedIn", "true");
  console.log("Initial isLoggedIn:", isLoggedIn);

  // ========================================================
  // Сохраняем оригинальное содержимое unified dropdown (информация аккаунта)
  // ========================================================
  const unifiedInfoButtons =
    unifiedAccountDropdown.querySelector(".info-buttons");
  const unifiedOriginalInfoButtonsContent = unifiedInfoButtons.innerHTML;
  const unifiedButtonsToHide = {
    orders: unifiedAccountDropdown.querySelector(".orders-button2"),
    waitlist: unifiedAccountDropdown.querySelector(".waitlist-button"),
    settings: unifiedAccountDropdown.querySelector(".settings-ac-button"),
  };

  // ========================================================
  // Функция обновления интерфейса аккаунта (единая для мобильной и десктопной версии)
  // ========================================================
  function updateUnifiedAccountUI() {
    const infoButtons = unifiedAccountDropdown.querySelector(".info-buttons");

    if (window.matchMedia("(max-width: 800px)").matches) {
      // Мобильный режим
      if (isLoggedIn) {
        infoButtons.innerHTML = unifiedOriginalInfoButtonsContent;
        const logRegister =
          unifiedAccountDropdown.querySelector(".logregister");
        if (logRegister) {
          logRegister.remove();
          console.log(".logregister removed (mobile)");
        }
        const userButton =
          (mobileAccountButton
            ? mobileAccountButton.querySelector("#UserButton")
            : null) ||
          (desktopAccountButton
            ? desktopAccountButton.querySelector("#UserButton")
            : null);
        if (userButton) {
          userButton.classList.remove(
            "ri-error-warning-line",
            "exclamation-mark"
          );
          userButton.classList.add("ri-account-circle-line");
          console.log("UserButton set to user (mobile)");
        }
        const cabinetButton =
          unifiedAccountDropdown.querySelector(".Cabinet-button");
        if (cabinetButton) {
          cabinetButton.textContent = "Личный кабинет";
          console.log("Cabinet-button set to 'Личный кабинет' (mobile)");
        }
        Object.values(unifiedButtonsToHide).forEach((btn) => {
          if (btn) btn.style.display = "block";
        });
      } else {
        infoButtons.innerHTML = "";
        if (!unifiedAccountDropdown.querySelector(".logregister")) {
          const newLogRegister = document.createElement("div");
          newLogRegister.classList.add("logregister");
          newLogRegister.innerHTML = `
            <span class="name">
              <i class="ri-login-circle-line"></i> Вход / Регистрация
            </span>
          `;
          infoButtons.appendChild(newLogRegister);
          console.log(".logregister added (mobile)");
          newLogRegister.style.whiteSpace = "nowrap";
          newLogRegister.style.textAlign = "center";
          newLogRegister.addEventListener("click", function () {
            loginButton.click();
            console.log("Simulated click on #loginButton (mobile)");
          });
        }
        const userButton =
          (mobileAccountButton
            ? mobileAccountButton.querySelector("#UserButton")
            : null) ||
          (desktopAccountButton
            ? desktopAccountButton.querySelector("#UserButton")
            : null);
        if (userButton) {
          userButton.classList.remove("ri-account-circle-line");
          userButton.classList.add("ri-error-warning-line");
          console.log("UserButton set to exclamation (mobile)");
        }
        const cabinetButton =
          unifiedAccountDropdown.querySelector(".Cabinet-button");
        if (cabinetButton) {
          cabinetButton.textContent = "Возможности личного кабинета";
          console.log(
            "Cabinet-button set to 'Возможности личного кабинета' (mobile)"
          );
        }
        infoButtons.style.display = "flex";
        infoButtons.style.justifyContent = "center";
        infoButtons.style.alignItems = "center";
        Object.values(unifiedButtonsToHide).forEach((btn) => {
          if (btn) btn.style.display = "none";
        });
      }
    } else {
      // Десктопный режим
      if (isLoggedIn) {
        infoButtons.innerHTML = unifiedOriginalInfoButtonsContent;
        const logRegister =
          unifiedAccountDropdown.querySelector(".logregister");
        if (logRegister) {
          logRegister.remove();
          console.log(".logregister removed (desktop)");
        }
        const userButton =
          (desktopAccountButton
            ? desktopAccountButton.querySelector("#UserButton")
            : null) ||
          (mobileAccountButton
            ? mobileAccountButton.querySelector("#UserButton")
            : null);
        if (userButton) {
          userButton.classList.remove(
            "ri-error-warning-line",
            "exclamation-mark"
          );
          userButton.classList.add("ri-account-circle-line");
          console.log("UserButton set to user (desktop)");
        }
        const cabinetButton =
          unifiedAccountDropdown.querySelector(".Cabinet-button");
        if (cabinetButton) {
          cabinetButton.textContent = "Личный кабинет";
          console.log("Cabinet-button set to 'Личный кабинет' (desktop)");
        }
        Object.values(unifiedButtonsToHide).forEach((btn) => {
          if (btn) btn.style.display = "block";
        });
      } else {
        infoButtons.innerHTML = "";
        if (!unifiedAccountDropdown.querySelector(".logregister")) {
          const newLogRegister = document.createElement("div");
          newLogRegister.classList.add("logregister");
          newLogRegister.innerHTML = `
            <span class="name">
              <i class="ri-login-circle-line"></i> Вход / Регистрация
            </span>
          `;
          infoButtons.appendChild(newLogRegister);
          console.log(".logregister added (desktop)");
          newLogRegister.style.whiteSpace = "nowrap";
          newLogRegister.style.textAlign = "center";
          newLogRegister.addEventListener("click", function () {
            loginButton.click();
            console.log("Simulated click on #loginButton (desktop)");
          });
        }
        const userButton =
          (desktopAccountButton
            ? desktopAccountButton.querySelector("#UserButton")
            : null) ||
          (mobileAccountButton
            ? mobileAccountButton.querySelector("#UserButton")
            : null);
        if (userButton) {
          userButton.classList.remove("ri-account-circle-line");
          userButton.classList.add("ri-error-warning-line");
          console.log("UserButton set to exclamation (desktop)");
        }
        const cabinetButton =
          unifiedAccountDropdown.querySelector(".Cabinet-button");
        if (cabinetButton) {
          cabinetButton.textContent = "Возможности личного кабинета";
          console.log(
            "Cabinet-button set to 'Возможности личного кабинета' (desktop)"
          );
        }
        infoButtons.style.display = "flex";
        infoButtons.style.justifyContent = "center";
        infoButtons.style.alignItems = "center";
        Object.values(unifiedButtonsToHide).forEach((btn) => {
          if (btn) btn.style.display = "none";
        });
      }
    }
    localStorage.setItem("isLoggedIn", isLoggedIn);
  }

  // Инициализация интерфейса при загрузке страницы
  updateUnifiedAccountUI();

  // ========================================================
  // Единая функция переключения dropdown (вызывается триггерами с десктопа и мобильного)
  // ========================================================
  function toggleUnifiedDropdown() {
    unifiedAccountDropdown.classList.toggle("show");
    // Для визуального выделения можно переключать active-класс на обоих триггерах
    if (desktopAccountButton) desktopAccountButton.classList.toggle("active");
    if (mobileAccountButton) mobileAccountButton.classList.toggle("active");
    console.log("Unified account dropdown toggled");
  }

  // Обработчики клика для триггеров
  if (desktopLogButton) {
    desktopLogButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleUnifiedDropdown();
      console.log("Desktop logButton toggled unified dropdown");
    });
  }

  if (mobileLogButton) {
    mobileLogButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleUnifiedDropdown();
      console.log("Mobile logButton toggled unified dropdown");
    });
  }

  // ========================================================
  // Закрытие dropdown при клике вне его (единое для обеих версий)
  // ========================================================
  document.addEventListener("click", function (e) {
    if (
      desktopAccountButton &&
      !desktopAccountButton.contains(e.target) &&
      mobileAccountButton &&
      !mobileAccountButton.contains(e.target) &&
      !unifiedAccountDropdown.contains(e.target)
    ) {
      unifiedAccountDropdown.classList.remove("show");
      if (desktopAccountButton) desktopAccountButton.classList.remove("active");
      if (mobileAccountButton) mobileAccountButton.classList.remove("active");
      console.log("Unified dropdown closed on outside click");
    }
  });

  // ========================================================
  // Закрытие dropdown при нажатии ESC (единое)
  // ========================================================
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      unifiedAccountDropdown.classList.remove("show");
      if (desktopAccountButton) desktopAccountButton.classList.remove("active");
      if (mobileAccountButton) mobileAccountButton.classList.remove("active");
      console.log("Unified dropdown closed on ESC key");
    }
  });

  // ========================================================
  // Делегирование событий внутри unified dropdown
  // ========================================================
  unifiedAccountDropdown.addEventListener("click", function (e) {
    const target = e.target.closest("button, .logregister, .icon-group");
    if (!target) return;

    if (target.id === "logout") {
      e.stopPropagation();
      console.log("Logout clicked");
      isLoggedIn = false;
      updateUnifiedAccountUI();
      return;
    }

    if (target.id === "workTogether") {
      e.stopPropagation();
      target.classList.toggle("active");
      const toggleIcon = target.querySelector("i");
      if (toggleIcon) {
        toggleIcon.classList.toggle("ri-toggle-fill");
      }
      console.log(
        "'Work Together' toggled:",
        target.classList.contains("active")
      );
      return;
    }

    if (target.id === "hintMode") {
      e.stopPropagation();
      const hintIcon = target.querySelector("i");
      if (hintIcon) {
        hintIcon.classList.toggle("active");
      }
      console.log(
        "Hint Mode toggled:",
        hintIcon && hintIcon.classList.contains("active")
      );
      return;
    }

    if (target.classList.contains("logregister")) {
      e.stopPropagation();
      loginButton.click();
      console.log("Simulated click on #loginButton via dropdown");
      return;
    }

    // После обработки любого другого клика внутри dropdown – закрываем его
    unifiedAccountDropdown.classList.remove("show");
    if (desktopAccountButton) desktopAccountButton.classList.remove("active");
    if (mobileAccountButton) mobileAccountButton.classList.remove("active");
    console.log("Unified dropdown closed via delegation");
  });

  // ========================================================
  // Обработчик для loginButton (общий)
  // ========================================================
  loginButton.addEventListener("click", function () {
    console.log("loginButton clicked, but login is not performed");
  });
});
