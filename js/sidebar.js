// --- Переработанный Скрипт: initSidebar для Off-Canvas подхода ---
window.initSidebar = function (root = document) {
  // Первым делом проверяем, не мобильная ли версия
  // Если ширина экрана меньше 800px, не применяем off-canvas сайдбар
  if (window.matchMedia("(max-width: 800px)").matches) {
    console.log("Мобильная версия: off-canvas сайдбар не применяется");
    return null; // Не инициализируем сайдбар для мобильной версии
  }

  // Получаем элементы внутри переданного корня
  const notificationCard = root.querySelector(".notification-card");
  const orderSummaryCard = root.querySelector(".order-summary-card");
  const actionsCard = root.querySelector(".actions-card");
  const aside = root.querySelector(".order-summary"); // Контейнер сайдбара

  // Проверяем наличие основных элементов
  if (!notificationCard || !orderSummaryCard || !actionsCard) {
    console.warn(
      "Один или несколько основных элементов не найдены внутри корня:",
      root
    );
    return null;
  }

  // Создаем единый сайдбар для всех элементов
  const createOffCanvasSidebar = () => {
    const sidebar = document.createElement("div");
    sidebar.className = "off-canvas-sidebar";

    // Добавляем заголовок сайдбара
    const headerSection = document.createElement("div");
    headerSection.className = "sidebar-header";

    // Кнопка закрытия сайдбара
    const closeButton = document.createElement("button");
    closeButton.className = "sidebar-close-button";
    closeButton.innerHTML = '<i class="ri-close-line"></i>';

    applyStyles(closeButton, {
      position: "absolute",
      top: "15px",
      right: "15px",
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      backgroundColor: "rgba(0,0,0,0.1)",
      color: "#fff",
      border: "none",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      zIndex: "1012",
      transition: "background-color 0.3s ease",
    });

    closeButton.addEventListener("mouseover", () => {
      closeButton.style.backgroundColor = "rgba(0,0,0,0.2)";
    });

    closeButton.addEventListener("mouseout", () => {
      closeButton.style.backgroundColor = "rgba(0,0,0,0.1)";
    });

    closeButton.addEventListener("click", collapseSidebar);

    // Секция для показа/скрытия уведомлений
    const notificationToggle = document.createElement("div");
    notificationToggle.className = "notification-toggle";
    notificationToggle.innerHTML =
      '<i class="ri-notification-3-line"></i> Позиции без остатка';

    applyStyles(notificationToggle, {
      position: "absolute",
      top: "100px",
      left: "15px",
      padding: "6px 12px",
      background: "#d9994f",
      color: "white",
      borderRadius: "20px",
      fontSize: "14px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      transition: "background-color 0.3s ease",
    });

    notificationToggle.addEventListener("mouseover", () => {
      notificationToggle.style.backgroundColor = "#c2883f";
    });

    notificationToggle.addEventListener("mouseout", () => {
      notificationToggle.style.backgroundColor = "#d9994f";
    });

    notificationToggle.addEventListener("click", toggleNotificationSection);

    headerSection.appendChild(closeButton);
    headerSection.appendChild(notificationToggle);
    sidebar.appendChild(headerSection);

    // Создаем контейнер для уведомлений (изначально скрытый)
    const notificationSection = document.createElement("div");
    notificationSection.className = "notification-section";

    applyStyles(notificationSection, {
      padding: "15px",
      backgroundColor: "#d9994f",
      margin: "50px 0 15px 0",
      borderRadius: "8px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
      overflow: "hidden",
      maxHeight: "0",
      opacity: "0",
      transition:
        "max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease, margin-bottom 0.3s ease",
    });

    // Помещаем оригинальный notificationCard в контейнер уведомлений
    notificationSection.appendChild(notificationCard);
    sidebar.appendChild(notificationSection);

    // Контейнер для orderSummaryCard и actionsCard
    const orderSection = document.createElement("div");
    orderSection.className = "order-section";

    applyStyles(orderSection, {
      paddingTop: "60px", // место для заголовка
      minHeight: "calc(100vh - 60px)",
      boxSizing: "border-box",
    });

    // Добавляем оригинальные элементы (а не клоны)
    orderSection.appendChild(orderSummaryCard);
    orderSection.appendChild(actionsCard);

    sidebar.appendChild(orderSection);

    // Общие стили для сайдбара
    applyStyles(sidebar, {
      position: "fixed",
      top: "0",
      right: "0",
      height: "100vh",
      width: "370px",
      backgroundColor: "#f9f9f9",
      boxShadow: "-5px 0 15px rgba(0,0,0,0.1)",
      zIndex: "1011",
      padding: "0 15px",
      overflowY: "auto",
      transform: "translateX(100%)",
      visibility: "hidden",
      transition: "transform 0.3s ease-in-out, visibility 0.3s ease-in-out",
    });

    return sidebar;
  };

  // Создаем кнопку вызова сайдбара
  const createSidebarButton = () => {
    const button = document.createElement("button");
    button.className = "sidebar-icon-button";

    // Иконка корзины для сайдбара
    button.innerHTML = '<i class="ri-shopping-cart-2-line"></i>';

    applyStyles(button, {
      position: "fixed",
      top: "130px",
      right: "20px",
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "#ff8420",
      color: "white",
      border: "none",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      zIndex: "1010",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      transition: "transform 0.3s ease, background-color 0.3s ease",
    });

    // Анимация при наведении
    button.addEventListener("mouseover", () => {
      button.style.transform = "scale(1.1)";
      button.style.backgroundColor = "#e87200";
    });

    button.addEventListener("mouseout", () => {
      button.style.transform = "scale(1)";
      button.style.backgroundColor = "#ff8420";
    });

    button.addEventListener("click", expandSidebar);

    return button;
  };

  // Создаем затемнение (оверлей) для фона при открытом сайдбаре
  const createOverlay = () => {
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";

    applyStyles(overlay, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "1008",
      opacity: "0",
      visibility: "hidden",
      transition: "opacity 0.3s ease, visibility 0.3s ease",
    });

    overlay.addEventListener("click", collapseSidebar);

    return overlay;
  };

  // Применяем стили к элементу
  function applyStyles(element, styles) {
    Object.keys(styles).forEach((property) => {
      element.style[property] = styles[property];
    });
  }

  // Функция для отображения/скрытия секции уведомлений
  function toggleNotificationSection() {
    const notificationSection = sidebar.querySelector(".notification-section");

    if (notificationSection.style.maxHeight === "500px") {
      // Скрыть секцию
      notificationSection.style.maxHeight = "0";
      notificationSection.style.opacity = "0";
      notificationSection.style.marginTop = "0";
      notificationSection.style.marginBottom = "0";
    } else {
      // Показать секцию
      notificationSection.style.maxHeight = "500px";
      notificationSection.style.opacity = "1";
      notificationSection.style.marginTop = "50px";
      notificationSection.style.marginBottom = "15px";
    }
  }

  // Стилизация полей ввода и выпадающих списков подсказок
  function styleSuggestionBoxes() {
    // Получаем все блоки подсказок
    const suggestionBoxes = [
      sidebar.querySelector("#suggestions-inn"),
      sidebar.querySelector("#suggestions-org"),
      sidebar.querySelector("#suggestions-management"),
    ].filter((box) => box !== null);

    // Получаем все контейнеры полей ввода
    const inputContainers = sidebar.querySelectorAll(".input-container");

    // Стилизуем контейнеры полей ввода
    inputContainers.forEach((container) => {
      applyStyles(container, {
        position: "relative",
        width: "100%",
        marginBottom: "10px",
      });

      // Находим поле ввода внутри контейнера
      const input = container.querySelector("input");
      if (input) {
        applyStyles(input, {
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          fontSize: "14px",
          boxSizing: "border-box",
        });

        // Добавляем эффекты при фокусе
        input.addEventListener("focus", () => {
          input.style.borderColor = "#ff8420";
          input.style.boxShadow = "0 0 0 2px rgba(255,132,32,0.2)";
        });

        input.addEventListener("blur", () => {
          input.style.borderColor = "#ddd";
          input.style.boxShadow = "none";
        });
      }
    });

    // Стилизуем блоки подсказок
    suggestionBoxes.forEach((box) => {
      if (box) {
        applyStyles(box, {
          position: "absolute",
          top: "100%",
          left: "0",
          width: "100%",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "0 0 6px 6px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          zIndex: "1020",
          maxHeight: "200px",
          overflowY: "auto",
          display: "none",
        });

        // Добавляем слушатель мутаций, чтобы стилизовать элементы подсказок при их добавлении
        const observer = new MutationObserver((mutations) => {
          const suggestionItems = box.querySelectorAll(".suggestion-item");
          suggestionItems.forEach((item) => {
            applyStyles(item, {
              padding: "8px 12px",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
              fontSize: "14px",
              transition: "background-color 0.2s ease",
            });

            // Выделение при наведении
            item.addEventListener("mouseover", () => {
              item.style.backgroundColor = "#f5f5f5";
            });

            item.addEventListener("mouseout", () => {
              item.style.backgroundColor = "transparent";
            });

            // Стилизуем подсвеченные совпадения
            const highlights = item.querySelectorAll(".highlight");
            highlights.forEach((highlight) => {
              applyStyles(highlight, {
                backgroundColor: "rgba(255,132,32,0.2)",
                color: "#ff8420",
                fontWeight: "bold",
                padding: "0 2px",
                borderRadius: "2px",
              });
            });
          });
        });

        observer.observe(box, { childList: true });
      }
    });
  }

  // Создаем необходимые элементы
  const sidebar = createOffCanvasSidebar();
  const sidebarButton = createSidebarButton();
  const overlay = createOverlay();

  // Добавляем элементы в DOM
  root.appendChild(sidebar);
  root.appendChild(sidebarButton);
  root.appendChild(overlay);

  // Если исходная боковая панель существует, скрываем её
  if (aside) {
    aside.style.display = "none";
  }

  // Обработчик изменения размера окна
  const handleResize = () => {
    // Если размер экрана стал меньше 800px (мобильная версия)
    if (window.matchMedia("(max-width: 800px)").matches) {
      // Скрываем off-canvas sidebar и возвращаем все элементы обратно
      collapseSidebar();

      // Восстанавливаем видимость исходных элементов для мобильной версии
      if (aside) {
        aside.style.display = "block";
      }

      // Скрываем наши кнопки и элементы
      if (sidebarButton) sidebarButton.style.display = "none";
    } else {
      // Вернулись на десктоп
      if (aside) {
        aside.style.display = "none";
      }

      // Восстанавливаем видимость кнопки
      if (sidebarButton) sidebarButton.style.display = "flex";
    }
  };

  // Подписываемся на изменение размера окна
  window.addEventListener("resize", handleResize);

  // Функция для сворачивания сайдбара
  function collapseSidebar() {
    applyStyles(sidebar, {
      transform: "translateX(100%)",
      visibility: "hidden",
    });

    applyStyles(overlay, {
      opacity: "0",
      visibility: "hidden",
    });

    // Показываем кнопку
    sidebarButton.style.display = "flex";
  }

  // Функция для разворачивания сайдбара
  function expandSidebar() {
    applyStyles(sidebar, {
      transform: "translateX(0)",
      visibility: "visible",
    });

    applyStyles(overlay, {
      opacity: "1",
      visibility: "visible",
    });

    // Скрываем кнопку
    sidebarButton.style.display = "none";
  }

  // Начальное состояние - свёрнутое
  collapseSidebar();

  // Добавляем обработчик нажатия клавиши Escape для закрытия сайдбара
  root.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && sidebar.style.visibility === "visible") {
      collapseSidebar();
    }
  });

  // Улучшаем стили кнопок внутри order-summary-card и actions-card
  const improveButtonStyles = () => {
    // Улучшаем стиль кнопки "К оформлению"
    const proceedButton = sidebar.querySelector(".proceed-button");
    if (proceedButton) {
      applyStyles(proceedButton, {
        backgroundColor: "#ff8420",
        color: "white",
        border: "none",
        padding: "12px 16px",
        fontSize: "16px",
        fontWeight: "bold",
        textAlign: "center",
        borderRadius: "8px",
        cursor: "pointer",
        width: "80%",
        margin: "15px auto 5px auto",
        display: "block",
        transition: "background-color 0.3s ease",
      });

      proceedButton.addEventListener("mouseover", () => {
        proceedButton.style.backgroundColor = "#e87200";
      });

      proceedButton.addEventListener("mouseout", () => {
        proceedButton.style.backgroundColor = "#ff8420";
      });
    }

    // Улучшаем стили кнопок в actions-card
    const actionButtons = sidebar.querySelectorAll(".actions-card button");
    actionButtons.forEach((button) => {
      applyStyles(button, {
        backgroundColor: "#b0b0b0",
        color: "white",
        padding: "8px 12px",
        margin: "4px 0",
        fontSize: "14px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "background-color 0.3s ease",
      });

      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "#8d8d8d";
      });

      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "#b0b0b0";
      });
    });

    // Улучшаем стили кнопок в notification-card
    const notificationButtons = sidebar.querySelectorAll(
      ".notification-card button"
    );
    notificationButtons.forEach((button) => {
      applyStyles(button, {
        backgroundColor: "#a6763e",
        color: "white",
        padding: "8px 12px",
        margin: "6px 0",
        fontSize: "14px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "background-color 0.3s ease",
      });

      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "#95683a";
      });

      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "#a6763e";
      });
    });
  };

  // Инициализируем стили для блоков подсказок после загрузки сайдбара
  setTimeout(() => {
    styleSuggestionBoxes();
    improveButtonStyles();
  }, 100);

  // Назначаем функцию обновления стилей в случае, если скрипт initInnInput будет выполнен позже
  window.updateSidebarSuggestionStyles = styleSuggestionBoxes;

  // Если initInnInput уже был вызван, мы можем сразу дополнительно вызвать его с нашим новым root
  if (window.initInnInput && typeof window.initInnInput === "function") {
    // Вызываем инициализацию через небольшую задержку, чтобы DOM успел обновиться
    setTimeout(() => {
      window.initInnInput(sidebar);
    }, 200);
  }

  // Возвращаем управление сайдбаром для возможного использования в других частях кода
  return {
    expandSidebar: expandSidebar,
    collapseSidebar: collapseSidebar,
    sidebar: sidebar,
    mainButton: sidebarButton,
    toggleNotificationSection: toggleNotificationSection,
    styleSuggestionBoxes: styleSuggestionBoxes,
    // Функция для очистки ресурсов при удалении сайдбара
    destroy: () => {
      window.removeEventListener("resize", handleResize);

      // Возвращаем элементы в исходное состояние
      if (aside) {
        aside.style.display = "block";
      }

      // Удаляем созданные элементы
      if (sidebar && sidebar.parentNode) {
        sidebar.parentNode.removeChild(sidebar);
      }

      if (sidebarButton && sidebarButton.parentNode) {
        sidebarButton.parentNode.removeChild(sidebarButton);
      }

      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    },
  };
};

// Вызов функции при загрузке DOM
document.addEventListener("DOMContentLoaded", function () {
  // Подключаем Remix Icon если его нет
  if (!document.querySelector('link[href*="remixicon"]')) {
    const remixIconLink = document.createElement("link");
    remixIconLink.rel = "stylesheet";
    remixIconLink.href =
      "https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css";
    document.head.appendChild(remixIconLink);
  }
});
