// /js/globalcomm.js

/**
 * GComm - Global Communication Module
 *
 * Этот модуль обеспечивает обмен сообщениями между различными страницами вашего проекта.
 * Используется BroadcastChannel API для передачи сообщений между страницами одного происхождения.
 * Все компоненты системы имеют уникальные имена с префиксом "GComm_" для предотвращения конфликтов.
 */

(function (global) {
  // Уникальный префикс для всех компонентов системы
  const PREFIX = "GComm";

  /**
   * GComm_PageRegistry
   *
   * Глобальный реестр страниц с уникальными идентификаторами и путями.
   * Содержит сопоставление путей страниц с уникальными идентификаторами.
   * Убедитесь, что все ваши страницы включены в этот объект с правильными путями и уникальными идентификаторами.
   */
  const GComm_PageRegistry = {
    "/index.html": "GComm_parent", // Добавьте вашу родительскую страницу
    "/test.html": "GComm_testPage",
    "/pages/cabinet_postavshika.html": "GComm_cabinetPostavshika",
    "/pages/categories.html": "GComm_categories",
    "/pages/chat.html": "GComm_chat",
    "/pages/delivery.html": "GComm_delivery",
    "/pages/index.html": "GComm_home",
    "/pages/info.html": "GComm_info",
    "/pages/resapi.html": "GComm_resapi",
    "/pages/returns.html": "GComm_returns",
    "/pages/search_cat.html": "GComm_searchCat",
    "/pages/zajavka_open.html": "GComm_zajavkaOpen",
    "/pages/zajavki.html": "GComm_zajavki",
    // Добавьте новые страницы здесь
  };

  /**
   * GComm_MessageBus
   *
   * Класс управления сообщениями.
   * Управляет отправкой и получением сообщений через BroadcastChannel.
   */
  class GComm_MessageBus {
    /**
     * Конструктор класса GComm_MessageBus.
     * Инициализирует BroadcastChannel и устанавливает обработчик входящих сообщений.
     * @param {string} channelName - Имя канала для BroadcastChannel. По умолчанию "GComm_global_message_bus".
     */
    constructor(channelName = "GComm_global_message_bus") {
      this.channel = new BroadcastChannel(channelName);
      this.callbacks = {}; // Объект для хранения подписок на команды

      // Устанавливаем обработчик входящих сообщений
      this.channel.onmessage = this.handleMessage.bind(this);
    }

    /**
     * getCurrentPageId
     *
     * Получение уникального идентификатора текущей страницы на основе пути URL.
     * @returns {string} - Уникальный идентификатор страницы.
     */
    getCurrentPageId() {
      const path = window.location.pathname;
      return GComm_PageRegistry[path] || "GComm_unknownPage";
    }

    /**
     * GComm_sendCommand
     *
     * Отправка команды конкретной странице по её идентификатору.
     * @param {string} targetPageId - Уникальный идентификатор целевой страницы.
     * @param {string} command - Название команды.
     * @param {object} payload - Полезная нагрузка команды (опционально).
     */
    GComm_sendCommand(targetPageId, command, payload = {}) {
      if (!targetPageId || !command) {
        console.error(
          `[${PREFIX}] Target Page ID и Command обязательны для отправки команды.`
        );
        return;
      }

      this.channel.postMessage({
        system: false, // Указывает, что это пользовательское сообщение
        target: targetPageId, // Целевая страница или "GComm_broadcast" для широковещательной отправки
        command: command, // Название команды
        payload: payload, // Полезная нагрузка
        timestamp: new Date().toISOString(), // Временная метка
      });

      console.log(
        `[${PREFIX}] Команда "${command}" отправлена на "${targetPageId}".`
      );
    }

    /**
     * GComm_broadcastCommand
     *
     * Широковещательная отправка команды всем страницам.
     * @param {string} command - Название команды.
     * @param {object} payload - Полезная нагрузка команды (опционально).
     */
    GComm_broadcastCommand(command, payload = {}) {
      if (!command) {
        console.error(
          `[${PREFIX}] Command обязателен для широковещательной отправки.`
        );
        return;
      }

      this.channel.postMessage({
        system: false,
        target: "GComm_broadcast", // Специальное значение для широковещательной отправки
        command: command,
        payload: payload,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[${PREFIX}] Команда "${command}" отправлена всем страницам.`
      );
    }

    /**
     * GComm_on
     *
     * Подписка на определённые команды.
     * @param {string} command - Название команды для подписки.
     * @param {function} callback - Функция обратного вызова при получении команды.
     */
    GComm_on(command, callback) {
      if (!this.callbacks[command]) {
        this.callbacks[command] = [];
      }
      this.callbacks[command].push(callback);
    }

    /**
     * handleMessage
     *
     * Обработка входящих сообщений.
     * Вызывает соответствующие колбэки для полученных команд.
     * @param {MessageEvent} event - Событие сообщения.
     */
    handleMessage(event) {
      const message = event.data;

      // Игнорировать системные сообщения (если они будут добавлены в будущем)
      if (message.system) return;

      const { target, command, payload } = message;

      const currentPageId = this.getCurrentPageId();

      // Проверка, адресовано ли сообщение текущей странице или это широковещательное сообщение
      if (target !== "GComm_broadcast" && target !== currentPageId) {
        return; // Сообщение не предназначено для этой страницы
      }

      console.log(
        `[${PREFIX}] Получена команда "${command}" от "${
          payload.sender || "unknown"
        }".`
      );

      // Выполнение всех зарегистрированных колбэков для команды
      if (this.callbacks[command]) {
        this.callbacks[command].forEach((cb) => cb(payload, message));
      }
    }

    /**
     * GComm_getRegisteredPages
     *
     * Получение списка зарегистрированных страниц.
     * В текущей реализации возвращает статический реестр, но может быть расширено для динамической регистрации.
     * @returns {object} - Объект с зарегистрированными страницами.
     */
    GComm_getRegisteredPages() {
      return GComm_PageRegistry;
    }
  }

  /**
   * GComm_TabManager
   *
   * Класс управления вкладками на родительской странице.
   * Включает функции создания, активации и закрытия вкладок.
   * Также обрабатывает команды открытия вкладок, полученные от дочерних страниц.
   */
  class GComm_TabManager {
    constructor() {
      this.tabs = document.querySelector(".tabs"); // Контейнер для вкладок
      this.tabContent = document.querySelector(".tab-content"); // Контейнер для содержимого вкладок

      // Создание общего контейнера для кнопок
      this.buttonsContainer = document.createElement("div");
      this.buttonsContainer.classList.add("tabs-buttons"); // Добавляем CSS-класс

      // Создание кнопки добавления корзины
      this.createCartButton = document.createElement("button");
      this.createCartButton.id = "create-cart-button";
      this.createCartButton.classList.add("create-cart-button");
      this.createCartButton.setAttribute(
        "data-tooltip",
        "Создать новую корзину"
      );
      this.createCartButton.innerHTML = `
        <i class="ri-add-fill" style="margin-right: 5px; pointer-events: none;"></i>
        <i class="ri-shopping-cart-2-line" style="pointer-events: none;"></i>
      `;

      // Создание кнопки "Заказы"
      this.createOrderButton = document.createElement("button");
      this.createOrderButton.id = "create-order-button";
      this.createOrderButton.classList.add("create-order-button");
      this.createOrderButton.setAttribute(
        "data-tooltip",
        "Открыть журнал заказов"
      );
      this.createOrderButton.innerHTML = `
        <i class="ri-list-check-3" style="margin-right: 5px; pointer-events: none;"></i>
      `;

      // Создание кнопки "Чат"
      this.createChatButton = document.createElement("button");
      this.createChatButton.id = "create-chat-button";
      this.createChatButton.classList.add("create-chat-button");
      this.createChatButton.setAttribute("data-tooltip", "Написать в чат");
      this.createChatButton.innerHTML = `
        <i class="ri-chat-check-fill" style="margin-right: 5px; pointer-events: none;"></i>
      `;

      // Добавляем кнопки в общий контейнер
      this.buttonsContainer.appendChild(this.createChatButton);
      this.buttonsContainer.appendChild(this.createOrderButton);
      this.buttonsContainer.appendChild(this.createCartButton);

      // Добавляем общий контейнер кнопок в основной контейнер вкладок
      this.tabs.appendChild(this.buttonsContainer);

      this.activeCartNames = {}; // Справочник активных корзин: { tabId: 'Корзина 1' }

      this.tabCounter = 0;
      this.cartNumbers = new Set();
      this.tabNames = new Set();

      // Глобальные переменные для корректировки высоты iframe
      this.isAdjustingHeight = false;
      this.MIN_HEIGHT_DIFF = 10; // Минимальная разница в пикселях

      // Получаем список вкладок, при активации которых отображается кнопка создания корзины
      this.cartButtonTriggerTabs = new Set(
        Array.from(
          document.querySelectorAll("#cart-button-trigger-tabs li")
        ).map((li) => li.textContent.trim())
      );

      // Инициализация Set с именами существующих вкладок
      Array.from(this.tabs.children).forEach((child) => {
        if (child !== this.buttonsContainer) {
          const tab = child.querySelector(".tab");
          if (tab) {
            this.tabNames.add(tab.dataset.name);
            if (tab.dataset.name.startsWith("Корзина")) {
              const number = parseInt(tab.dataset.name.split(" ")[1]);
              if (!isNaN(number)) {
                this.cartNumbers.add(number);
              }
            }
          }
        }
      });

      // Устанавливаем обработчики событий для кнопки создания корзины
      this.createCartButton.addEventListener("click", () => {
        const url = "/pages/delivery.html";
        this.createTab("Корзина", url, true);
      });

      // Устанавливаем обработчики событий для кнопки Чата
      this.createChatButton.addEventListener("click", () => {
        const url = "/pages/chat.html";
        this.createTab("Чат", url, false); // Передаем false для isCart
      });

      // Устанавливаем обработчики событий для кнопки "Заказы"
      this.createOrderButton.addEventListener("click", () => {
        const url = "/pages/zajavki.html"; // URL страницы заказов
        this.openPageAsTab("Заказы", url);
      });

      // Обработчики меню для открытия страниц в вкладках
      const menuLinks = document.querySelectorAll(".menu a, .secondary-button");
      menuLinks.forEach((link) => {
        if (link) {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            const title = link.textContent.trim();
            const url = link.getAttribute("data-page");
            if (url) {
              this.openPageAsTab(title, url);
            }
          });
        }
      });

      // Обработчик кнопки "Заказы"
      const ordersButton = document.querySelector(".orders-button");
      if (ordersButton) {
        ordersButton.addEventListener("click", (e) => {
          e.preventDefault();
          const title = "Заказы";
          const url = "/pages/zajavki.html";
          this.openPageAsTab(title, url);
        });
      }

      // Обработчик кнопки "Личный кабинет"
      const cabinetButton = document.querySelector(".Cabinet-button");
      if (cabinetButton) {
        cabinetButton.addEventListener("click", (e) => {
          e.preventDefault();
          const title = "Личный кабинет";
          const url = "/pages/cabinet_postavshika.html";
          this.openPageAsTab(title, url);
        });
      }

      // Обработчик кнопки "Чат"
      const chatButton = document.querySelector(".chat-button");
      if (chatButton) {
        chatButton.addEventListener("click", (e) => {
          e.preventDefault();
          const title = "Чат";
          const url = "/pages/chat.html";
          this.openPageAsTab(title, url);
        });
      }

      // Обработчик логотипа (например, для главной страницы)
      const logoButton = document.querySelector(".logo-button");
      if (logoButton) {
        logoButton.addEventListener("click", (e) => {
          e.preventDefault();
          const title = "Главная";
          const url = "/pages/index.html";
          this.openPageAsTab(title, url);
        });
      }

      // Обработчик кнопки поиска
      const searchButton = document.querySelector(".search-button");
      if (searchButton) {
        searchButton.addEventListener("click", (e) => {
          e.preventDefault();
          const query = document.querySelector(".search-input").value.trim();
          const title = query ? `Результаты: ${query}` : "Поиск";
          const url = `/pages/search_cat.html?q=${encodeURIComponent(query)}`;
          this.openPageAsTab(title, url);
        });
      }

      // Инициализация с открытой главной страницей
      this.openPageAsTab("Главная", "/pages/index.html");

      // Первоначальная проверка видимости кнопки создания корзины
      this.updateCreateCartButtonVisibility();

      // Обработчик изменения размера окна для корректировки высоты iframe "Чат", "Личный кабинет" и других iframes
      window.addEventListener("resize", () => {
        document
          .querySelectorAll(
            'iframe[data-is-chat="true"], iframe[data-is-cabinet="true"]'
          )
          .forEach((iframe) => {
            if (iframe.dataset.isChat === "true") {
              this.setChatIframeHeight(iframe);
            }
            if (iframe.dataset.isCabinet === "true") {
              this.setCabinetIframeHeight(iframe);
            }
          });

        // Дополнительно корректируем высоту всех других iframe
        document
          .querySelectorAll(
            'iframe:not([data-is-chat="true"]):not([data-is-cabinet="true"])'
          )
          .forEach((iframe) => {
            this.adjustIframeHeight(iframe);
          });
      });

      // Подписка на команды открытия вкладок от дочерних страниц
      global.GComm_MessageBus.GComm_on("GComm_openTab", (payload) => {
        const { title, url } = payload;
        if (title && url) {
          this.openPageAsTab(title, url);
        } else {
          console.error(
            `[${PREFIX}] Некорректные данные для команды "GComm_openTab":`,
            payload
          );
        }
      });
    }

    /**
     * notifyCartUpdate
     *
     * Уведомление об изменении данных корзин.
     */
    notifyCartUpdate() {
      const event = new CustomEvent("cartUpdate", {
        detail: { activeCartNames: this.activeCartNames },
      });
      window.dispatchEvent(event);
    }

    /**
     * findNextCartName
     *
     * Функция для поиска следующего доступного имени корзины.
     * @returns {string} - Название следующей корзины.
     */
    findNextCartName() {
      let index = 1;
      while (this.cartNumbers.has(index)) {
        index++;
      }
      return `Корзина ${index}`;
    }

    /**
     * createTab
     *
     * Функция для создания вкладки.
     * @param {string} title - Заголовок вкладки.
     * @param {string} contentURL - URL содержимого вкладки.
     * @param {boolean} isCart - Флаг, указывающий, является ли вкладка корзиной.
     * @returns {string} - ID созданной вкладки.
     */
    createTab(title, contentURL, isCart = false) {
      // Проверка на существующую вкладку (только для не-корзин)
      if (!isCart) {
        const existingTab = Array.from(this.tabs.children).find(
          (child) =>
            child !== this.buttonsContainer && child.dataset.name === title
        );
        if (existingTab) {
          this.activateTab(existingTab.dataset.tab);
          return existingTab.dataset.tab; // Возвращаем ID существующей вкладки
        }
      }

      // Для корзин ищем следующий доступный номер
      if (isCart) {
        title = this.findNextCartName();
        this.cartNumbers.add(parseInt(title.split(" ")[1]));
      }

      this.tabCounter++;
      const tabId = `tab-${this.tabCounter}`;

      // Создание элемента вкладки
      const tab = document.createElement("div");
      tab.classList.add("tab");
      tab.setAttribute("data-tab", tabId);
      tab.setAttribute("data-name", title);
      tab.innerHTML = `
        <span class="tab-title">${title}</span>
        <button class="close-tab" title="Закрыть вкладку">&times;</button>
      `;
      this.tabs.insertBefore(tab, this.buttonsContainer); // Вставляем перед контейнером кнопок
      this.tabNames.add(title);

      // Добавляем корзину в справочник активных корзин
      if (isCart) {
        this.activeCartNames[tabId] = title;
        this.notifyCartUpdate(); // Уведомляем об изменении
      }

      // Добавление редактирования названия для вкладок-корзин
      const titleElement = tab.querySelector(".tab-title");
      if (isCart) {
        titleElement.setAttribute("contenteditable", "true");
        titleElement.addEventListener("blur", () => {
          const newName = titleElement.textContent.trim();
          if (newName) {
            tab.dataset.name = newName; // Обновляем имя вкладки
            this.activeCartNames[tabId] = newName; // Обновляем справочник
          } else {
            titleElement.textContent = this.activeCartNames[tabId]; // Восстанавливаем старое имя, если новое пустое
          }
          this.notifyCartUpdate(); // Уведомляем об изменении
        });
      }

      // Создание элемента контента с iframe
      const content = document.createElement("div");
      content.classList.add("content");
      content.setAttribute("data-content", tabId);
      const iframe = document.createElement("iframe");
      iframe.src = contentURL;
      iframe.setAttribute("frameborder", "0");

      // Установка стилей для iframe
      iframe.style.width = "100%";
      iframe.style.border = "none";
      iframe.style.overflow = "hidden";
      iframe.style.display = "block";
      iframe.style.height = "0px";

      // Проверка, является ли вкладка "Чат" или "Личный кабинет"
      if (title === "Чат" || contentURL.includes("/pages/chat.html")) {
        iframe.setAttribute("data-is-chat", "true");
      }
      if (
        title === "Личный кабинет" ||
        contentURL.includes("/pages/cabinet_postavshika.html")
      ) {
        iframe.setAttribute("data-is-cabinet", "true");
      }

      content.appendChild(iframe);
      this.tabContent.appendChild(content);

      // Активация новой вкладки
      this.activateTab(tabId);
      this.updateTabsVisibility(); // Обновляем видимость вкладок
      this.updateCreateCartButtonVisibility(); // Обновляем видимость кнопки

      // Добавление обработчиков событий
      tab.querySelector(".close-tab").addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeTab(tabId);
      });

      tab.addEventListener("click", () => {
        this.activateTab(tabId);
      });

      // Обработчик загрузки iframe
      iframe.addEventListener("load", () => {
        console.log(`Iframe с URL ${iframe.src} загружен`);
        this.adjustIframeHeight(iframe);

        try {
          const iframeDocument =
            iframe.contentDocument || iframe.contentWindow.document;
          const iframeBody = iframeDocument.body;

          const observer = new MutationObserver(() => {
            this.adjustIframeHeight(iframe);
          });

          const config = {
            childList: true,
            subtree: true,
            characterData: true,
          };
          observer.observe(iframeBody, config);

          if ("ResizeObserver" in window) {
            const resizeObserver = new ResizeObserver(() => {
              this.adjustIframeHeight(iframe);
            });
            resizeObserver.observe(iframeBody);
          }
        } catch (error) {
          console.error("Ошибка наблюдения за iframe:", error);
        }
      });

      return tabId; // Возвращаем ID созданной вкладки
    }

    /**
     * adjustIframeHeight
     *
     * Функция для корректировки высоты iframe на основе футтера и доступного пространства.
     * @param {HTMLIFrameElement} iframe - Элемент iframe.
     */
    adjustIframeHeight(iframe) {
      // Проверяем, является ли это iframe "Чатом" или "Личным кабинетом"
      if (iframe.dataset.isChat === "true") {
        this.setChatIframeHeight(iframe);
        return;
      }

      if (iframe.dataset.isCabinet === "true") {
        this.setCabinetIframeHeight(iframe);
        return;
      }

      if (this.isAdjustingHeight) return; // Выходим, если уже идет корректировка

      try {
        this.isAdjustingHeight = true; // Устанавливаем флаг

        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow.document;

        let contentHeight;
        // Поиск футтера по классу "footer"
        const footer = iframeDocument.querySelector(".footer");
        if (footer) {
          const footerRect = footer.getBoundingClientRect();

          // Вычисляем нижнюю позицию футтера относительно верхней части документа
          const footerBottom = footerRect.bottom;

          // Добавляем небольшой отступ, например, 20px
          contentHeight = Math.ceil(footerBottom + 0);
        } else {
          // Если футтер не найден, используем scrollHeight как резервный вариант
          contentHeight = iframeDocument.body.scrollHeight;
          this.logMessage(
            `Футтер не найден. Используем scrollHeight: ${contentHeight}px`
          );
        }

        // Вычисляем доступную высоту для iframe
        const iframeRect = iframe.getBoundingClientRect();
        const availableHeight = window.innerHeight - iframeRect.top;

        // Устанавливаем высоту как максимум между контентом и доступной высотой
        const newHeight = Math.max(contentHeight, availableHeight);

        const currentHeight = parseInt(iframe.style.height, 10) || 0;
        if (Math.abs(newHeight - currentHeight) > this.MIN_HEIGHT_DIFF) {
          iframe.style.height = `${newHeight}px`;
          this.logMessage(
            `Установлена высота iframe: max(${contentHeight}px, ${availableHeight}px) = ${newHeight}px`
          );
        }
      } catch (error) {
        console.error("Не удалось изменить высоту iframe:", error);
        iframe.style.height = "100vh";
      } finally {
        this.isAdjustingHeight = false; // Сбрасываем флаг
      }
    }

    /**
     * setChatIframeHeight
     *
     * Функция для установки высоты iframe "Чат".
     * @param {HTMLIFrameElement} iframe - Элемент iframe.
     */
    setChatIframeHeight(iframe) {
      try {
        const windowHeight = window.innerHeight;
        const tabsHeight = this.tabs.offsetHeight;
        const offsetTop = this.tabs.getBoundingClientRect().top;
        const newHeight = windowHeight - offsetTop - tabsHeight;

        const currentHeight = parseInt(iframe.style.height, 10) || 0;
        if (Math.abs(newHeight - currentHeight) > this.MIN_HEIGHT_DIFF) {
          iframe.style.height = `${newHeight}px`;
          this.logMessage(`Установлена высота iframe Чат: ${newHeight}px`);
        }

        // Убираем прокрутку внутри iframe
        iframe.style.overflow = "hidden";
      } catch (error) {
        console.error("Не удалось установить высоту iframe Чат:", error);
        iframe.style.height = "100vh";
      }
    }

    /**
     * setCabinetIframeHeight
     *
     * Функция для установки высоты iframe "Личный кабинет".
     * @param {HTMLIFrameElement} iframe - Элемент iframe.
     */
    setCabinetIframeHeight(iframe) {
      try {
        const windowHeight = window.innerHeight;
        const tabsHeight = this.tabs.offsetHeight;
        const offsetTop = this.tabs.getBoundingClientRect().top;
        const newHeight = windowHeight - offsetTop - tabsHeight;

        const currentHeight = parseInt(iframe.style.height, 10) || 0;
        if (Math.abs(newHeight - currentHeight) > this.MIN_HEIGHT_DIFF) {
          iframe.style.height = `${newHeight}px`;
          this.logMessage(
            `Установлена высота iframe Личный кабинет: ${newHeight}px`
          );
        }

        // Убираем прокрутку внутри iframe
        iframe.style.overflow = "hidden";
      } catch (error) {
        console.error(
          "Не удалось установить высоту iframe Личный кабинет:",
          error
        );
        iframe.style.height = "100vh";
      }
    }

    /**
     * activateTab
     *
     * Функция для активации вкладки.
     * @param {string} tabId - ID вкладки для активации.
     */
    activateTab(tabId) {
      // Деактивируем все вкладки
      document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.remove("active");
        // Удаляем изменение z-index для отдельных вкладок
        // tab.style.zindex = "1"; // Комментируем эту строку
        const titleElement = tab.querySelector(".tab-title");
        if (titleElement && tab.dataset.tab !== tabId) {
          titleElement.setAttribute("contenteditable", "false");
        }
      });

      // Скрываем все содержимое вкладок
      document.querySelectorAll(".content").forEach((content) => {
        content.style.display = "none";
      });

      // Активируем выбранную вкладку и показываем её содержимое
      const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
      const activeContent = document.querySelector(
        `.content[data-content="${tabId}"]`
      );
      if (activeTab && activeContent) {
        activeTab.classList.add("active");
        // Удаляем изменение z-index для активной вкладки
        // activeTab.style.zindex = "10"; // Комментируем эту строку
        activeContent.style.display = "block";

        const titleElement = activeTab.querySelector(".tab-title");
        if (titleElement && activeTab.dataset.name.startsWith("Корзина")) {
          titleElement.setAttribute("contenteditable", "true");
        }
      }
    }

    /**
     * closeTab
     *
     * Функция для закрытия вкладки.
     * @param {string} tabId - ID вкладки для закрытия.
     */
    closeTab(tabId) {
      const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
      const content = document.querySelector(
        `.content[data-content="${tabId}"]`
      );

      if (tab && content) {
        const isActive = tab.classList.contains("active");
        const tabName = tab.dataset.name;
        tab.remove();
        content.remove();
        this.tabNames.delete(tabName);

        // Удаляем из справочника активных корзин
        if (tabId in this.activeCartNames) {
          delete this.activeCartNames[tabId];
          this.notifyCartUpdate(); // Уведомляем об изменении
        }

        if (tabName.startsWith("Корзина")) {
          const number = parseInt(tabName.split(" ")[1]);
          if (!isNaN(number)) {
            this.cartNumbers.delete(number);
          }
        }

        if (isActive) {
          const remainingTabs = document.querySelectorAll(".tab");
          if (remainingTabs.length > 0) {
            const lastTabId =
              remainingTabs[remainingTabs.length - 1].getAttribute("data-tab");
            this.activateTab(lastTabId);
          }
        }

        this.updateTabsVisibility(); // Обновляем видимость вкладок
        this.updateCreateCartButtonVisibility(); // Обновляем видимость кнопки

        // Если после закрытия вкладок осталась только главная, скрываем раздел вкладок
        const openTabs = document.querySelectorAll(".tab");
        const isOnlymain =
          openTabs.length === 1 && openTabs[0].dataset.name === "Главная";
        if (openTabs.length === 0 || isOnlymain) {
          this.openPageAsTab("Главная", "/pages/index.html");
        }
      }
    }

    /**
     * openPageAsTab
     *
     * Функция для открытия страницы в новой вкладке или активации существующей.
     * @param {string} title - Заголовок вкладки.
     * @param {string} url - URL содержимого вкладки.
     */
    openPageAsTab(title, url) {
      const existingTab = Array.from(this.tabs.children).find(
        (child) =>
          child !== this.buttonsContainer && child.dataset.name === title
      );

      if (existingTab) {
        const tabId = existingTab.dataset.tab;
        this.activateTab(tabId);
      } else {
        this.createTab(title, url);
      }
    }

    /**
     * updateTabsVisibility
     *
     * Функция для обновления видимости раздела вкладок.
     */
    updateTabsVisibility() {
      const openTabs = document.querySelectorAll(".tab");
      if (openTabs.length === 1 && openTabs[0].dataset.name === "Главная") {
        this.tabs.classList.add("collapsed");
      } else {
        this.tabs.classList.remove("collapsed");
      }
    }

    /**
     * updateCreateCartButtonVisibility
     *
     * Обновлённая функция для обновления видимости кнопки создания корзины.
     * В данном случае кнопка всегда видна.
     */
    updateCreateCartButtonVisibility() {
      // Кнопки всегда отображаются
      this.createCartButton.style.display = "block";
      this.createOrderButton.style.display = "block";

      // Логируем текущее состояние кнопок
      this.logMessage("Кнопки 'Добавить корзину' и 'Заказы' всегда видны.");
    }

    /**
     * logMessage
     *
     * Функция логирования для отладки.
     * @param {string} message - Сообщение для логирования.
     */
    logMessage(message) {
      console.log(`[LOG]: ${message}`);
    }
  }

  /**
   * Инициализация GComm_MessageBus и GComm_TabManager
   */
  global.GComm_MessageBus = new GComm_MessageBus(); // Экземпляр MessageBus
  global.GComm_TabManager = new GComm_TabManager(); // Экземпляр TabManager
})(window);
