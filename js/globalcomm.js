(function (global) {
  class GComm_TabManager {
    constructor() {
      this.specLoad = {}; // Объект для хранения данных specload.json
      this.tabShadowRoots = {}; // Объект для хранения Shadow Root по tabId

      // Проверяем состояние загрузки документа
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          this.init();
        });
      } else {
        this.init();
      }
    }

    async init() {
      // Загружаем specload.json
      try {
        const response = await fetch("/data/specload.json");
        if (!response.ok) {
          throw new Error(
            `Не удалось загрузить specload.json: ${response.statusText}`
          );
        }
        this.specLoad = await response.json();
        console.log("specload.json загружен успешно.");
      } catch (error) {
        console.error("Ошибка при загрузке specload.json:", error);
      }

      this.tabs = document.querySelector(".tabs");
      this.tabContent = document.querySelector(".tab-content");

      if (!this.tabs) {
        console.error("Элемент с классом .tabs не найден на странице.");
        return;
      }

      // Проверяем, существует ли уже контейнер для специальных кнопок
      this.buttonsContainer = this.tabs.querySelector(".tabs-buttons");
      if (!this.buttonsContainer) {
        // Если не существует, создаём его
        this.buttonsContainer = document.createElement("div");
        this.buttonsContainer.classList.add("tabs-buttons");

        // Кнопка «Создать корзину»
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

        // Кнопка «Чат»
        this.createChatButton = document.createElement("button");
        this.createChatButton.id = "create-chat-button";
        this.createChatButton.classList.add("create-chat-button");
        this.createChatButton.setAttribute("data-tooltip", "Написать в чат");
        this.createChatButton.innerHTML = `
          <i class="ri-chat-check-fill" style="margin-right: 5px; pointer-events: none;"></i>
        `;

        // Добавляем кнопки в общий контейнер
        this.buttonsContainer.appendChild(this.createChatButton);
        this.buttonsContainer.appendChild(this.createCartButton);

        // Добавляем общий контейнер кнопок в основной контейнер вкладок
        this.tabs.appendChild(this.buttonsContainer);
      } else {
        // Если контейнер уже существует, находим кнопки внутри него
        this.createCartButton = this.buttonsContainer.querySelector(
          "#create-cart-button"
        );

        this.createChatButton = this.buttonsContainer.querySelector(
          "#create-chat-button"
        );
      }

      // Отслеживаем корзины
      this.activeCartNames = {};
      this.tabCounter = 0;
      this.cartNumbers = new Set();
      this.tabNames = new Set();

      // Инициализация табов (если есть изначальные)
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

      // Флаг для отслеживания процесса создания корзины
      this.isCreatingCart = false;

      // Обработчики кнопок
      this.createCartButton.addEventListener("click", async () => {
        if (this.isCreatingCart) {
          console.warn("Создание корзины уже в процессе.");
          return; // Прекращаем выполнение, если уже создается корзина
        }

        this.isCreatingCart = true; // Устанавливаем флаг
        this.createCartButton.disabled = true; // Отключаем кнопку

        try {
          const url = "/pages/delivery.html";
          // Всегда создаём новую корзину с уникальным именем
          await this.createTab("Корзина", url, true); // Ждем завершения создания вкладки
        } catch (error) {
          console.error("Ошибка при создании корзины:", error);
        } finally {
          this.isCreatingCart = false; // Сбрасываем флаг после завершения
          this.createCartButton.disabled = false; // Включаем кнопку обратно
        }
      });

      this.createChatButton.addEventListener("click", async () => {
        const url = "/pages/chat.html";
        await this.openPageAsTab("Чат", url);
      });

      // Обработка меню для открытия вкладок
      const menuLinks = document.querySelectorAll(".menu a, .secondary-button");
      menuLinks.forEach((link) => {
        link.addEventListener("click", async (e) => {
          e.preventDefault();
          const title = link.textContent.trim();
          const url = link.getAttribute("data-page");
          if (url) {
            await this.openPageAsTab(title, url);
          }
        });
      });

      const ordersButton = document.querySelector(".orders-button");
      if (ordersButton) {
        ordersButton.addEventListener("click", async (e) => {
          e.preventDefault();
          const title = "Журнал заказов";
          const url = "/pages/zajavki.html";
          await this.openPageAsTab(title, url);
        });
      }

      const ordersButton2 = document.querySelector(".orders-button2");
      if (ordersButton2) {
        ordersButton2.addEventListener("click", async (e) => {
          e.preventDefault();
          const title = "Журнал заказов";
          const url = "/pages/zajavki.html";
          await this.openPageAsTab(title, url);
        });
      }

      const contactsButton = document.querySelector(".contacts-button");
      if (contactsButton) {
        contactsButton.addEventListener("click", async (e) => {
          e.preventDefault();
          const title = "Контакты";
          const url = "/pages/Contacts.html";
          await this.openPageAsTab(title, url);
        });
      }

      const registrationButton = document.getElementById("loginButton");
      if (registrationButton) {
        registrationButton.addEventListener("click", async (e) => {
          e.preventDefault(); // Предотвращаем переход по ссылке
          const title = "Вход в аккаунт";
          const url = "/pages/registration.html";
          await this.openPageAsTab(title, url);
        });
      }

      const openwaitlistButton = document.querySelector(".waitlist-button");
      if (openwaitlistButton) {
        openwaitlistButton.addEventListener("click", async (e) => {
          e.preventDefault();

          // Открываем вкладку "Личный кабинет" и получаем её ID
          const title = "Личный кабинет";
          const url = "/pages/cabinet_postavshika.html";
          const parentTabId = await this.openPageAsTab(title, url);

          // Активируем внутреннюю вкладку "Настройки аккаунта"
          const innerDataTab = "waitlist";
          this.activateInnerTab(parentTabId, innerDataTab);
        });
      }

      const openbalanceLoyalityElements = document.querySelectorAll(
        ".label, .value, .Cabinet-button"
      );

      openbalanceLoyalityElements.forEach((element) => {
        element.addEventListener("click", async (e) => {
          e.preventDefault();

          // Открываем вкладку "Личный кабинет" и получаем её ID
          const title = "Личный кабинет";
          const url = "/pages/cabinet_postavshika.html";
          const parentTabId = await this.openPageAsTab(title, url);

          // Активируем внутреннюю вкладку "Баланс и система лояльности"
          const innerDataTab = "balanceLoyalty";
          this.activateInnerTab(parentTabId, innerDataTab);
        });
      });

      const openSettingsButton = document.querySelector(".settings-ac-button");
      if (openSettingsButton) {
        openSettingsButton.addEventListener("click", async (e) => {
          e.preventDefault();

          // Открываем вкладку "Личный кабинет" и получаем её ID
          const title = "Личный кабинет";
          const url = "/pages/cabinet_postavshika.html";
          const parentTabId = await this.openPageAsTab(title, url);

          // Активируем внутреннюю вкладку "Настройки аккаунта"
          const innerDataTab = "templates";
          this.activateInnerTab(parentTabId, innerDataTab);
        });
      }

      const chatButton = document.querySelector(".chat-button");
      if (chatButton) {
        chatButton.addEventListener("click", async (e) => {
          e.preventDefault();
          const title = "Чат";
          const url = "/pages/chat.html";
          await this.openPageAsTab(title, url);
        });
      }

      const logoButton = document.querySelector(".logo-button");
      if (logoButton) {
        logoButton.addEventListener("click", async (e) => {
          e.preventDefault();
          const title = "Главная";
          const url = "/pages/index.html";
          await this.openPageAsTab(title, url);
        });
      }

      // Добавление обработчика для кнопки поиска на основной странице
      this.initializeMainSearchHandler();

      // Изначально открываем «Главная»
      this.openPageAsTab("Главная", "/pages/index.html");

      this.updateCreateCartButtonVisibility();

      // Обработчик события resize для динамической регулировки высоты страницы
      window.addEventListener("resize", () => {
        this.updatePageHeight();
      });

      // Добавляем обработчик кликов в основной документ
      this.initializeMainDocumentLinkHandler();
    }

    /**
     * Инициализирует обработчик для кликов в основном документе.
     */
    initializeMainDocumentLinkHandler() {
      document.body.addEventListener("click", async (e) => {
        const el = e.target.closest('[data-open-tab="true"]');
        if (el) {
          e.preventDefault();
          const title =
            el.getAttribute("data-tab-title") || el.textContent.trim();
          const url =
            el.getAttribute("data-tab-url") || el.getAttribute("href");
          if (url) {
            await this.openPageAsTab(title, url);
          }
        }
      });
    }

    /**
     * Инициализирует обработчик для кликов внутри Shadow Root.
     * @param {ShadowRoot} shadowRoot
     */
    initializeShadowLinkHandler(shadowRoot) {
      shadowRoot.addEventListener("click", async (e) => {
        const el = e.target.closest('[data-open-tab="true"]');
        if (el) {
          e.preventDefault();
          const title =
            el.getAttribute("data-tab-title") || el.textContent.trim();
          const url =
            el.getAttribute("data-tab-url") || el.getAttribute("href");
          if (url) {
            await this.openPageAsTab(title, url);
          }
        }
      });
    }

    /**
     * Инициализирует обработчик для кнопки поиска на основной странице.
     */
    initializeMainSearchHandler() {
      // Используем ID для уникальности
      const searchButton = document.getElementById("searchButton");
      const searchInput = document.getElementById("searchInput");

      if (searchButton && searchInput) {
        console.log("Search button and input found."); // Для отладки

        searchButton.addEventListener("click", async (e) => {
          e.preventDefault();
          console.log("Кнопка поиска на основной странице нажата.");

          const query = searchInput.value.trim();
          let title, contentURL;

          if (query === "") {
            // console.warn("Поиск: пустой запрос"); // Удаляем предупреждение
            title = "Поиск";
            contentURL = "/pages/search_cat.html";
          } else {
            title = `Результаты: ${query}`;
            contentURL = "/pages/search_cat.html";
            // Передаём параметр поиска через глобальную переменную
            window.currentSearchQuery = query;
          }

          console.log(
            `Основной поиск: title="${title}", contentURL="${contentURL}"`
          );

          // Открываем вкладку с результатами поиска
          await this.openPageAsTab(title, contentURL);
        });
      } else {
        if (!searchButton) {
          console.error("Основная кнопка поиска (#searchButton) не найдена.");
        }
        if (!searchInput) {
          console.error("Поле ввода поиска (#searchInput) не найдено.");
        }
      }
    }

    /**
     * notifyCartUpdate
     * Уведомляем, что изменились данные по корзинам.
     */
    notifyCartUpdate() {
      const event = new CustomEvent("cartUpdate", {
        detail: { activeCartNames: this.activeCartNames },
      });
      window.dispatchEvent(event);
    }

    /**
     * findNextCartName
     * Подбираем уникальное имя "Корзина X".
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
     * Создаём вкладку, загружаем HTML-фрагмент вместо iframe,
     * вставляем содержимое в Shadow DOM для изоляции стилей и скриптов.
     *
     * @param {string} title
     * @param {string} contentURL
     * @param {boolean} isCart
     * @returns {string} tabId
     */
    async createTab(title, contentURL, isCart = false) {
      // Для корзин всегда создаём новую вкладку с уникальным названием
      if (isCart) {
        title = this.findNextCartName();
        this.cartNumbers.add(parseInt(title.split(" ")[1]));
      } else {
        // Проверка: если вкладка не корзина и уже существует, активируем её
        const existingTab = Array.from(this.tabs.children).find(
          (child) =>
            child !== this.buttonsContainer && child.dataset.name === title
        );
        if (existingTab) {
          this.activateTab(existingTab.dataset.tab);
          return existingTab.dataset.tab;
        }
      }

      this.tabCounter++;
      const tabId = `tab-${this.tabCounter}`;

      // Заголовок вкладки
      const tab = document.createElement("div");
      tab.classList.add("tab");
      tab.setAttribute("data-tab", tabId);
      tab.setAttribute("data-name", title);
      tab.innerHTML = `
        <span class="tab-title">${title}</span>
        <button class="close-tab" title="Закрыть вкладку">&times;</button>
      `;
      this.tabs.insertBefore(tab, this.buttonsContainer);
      this.tabNames.add(title);

      if (isCart) {
        this.activeCartNames[tabId] = title;
        this.notifyCartUpdate();
      }

      // Редактирование названия для корзин
      const titleElement = tab.querySelector(".tab-title");
      if (isCart) {
        titleElement.setAttribute("contenteditable", "true");
        titleElement.addEventListener("blur", () => {
          const newName = titleElement.textContent.trim();
          if (newName) {
            tab.dataset.name = newName;
            this.activeCartNames[tabId] = newName;
          } else {
            titleElement.textContent = this.activeCartNames[tabId];
          }
          this.notifyCartUpdate();
          this.updatePageHeight();
        });
      }

      // Создаём контейнер содержимого
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("content");
      contentDiv.setAttribute("data-content", tabId);
      contentDiv.style.display = "none";

      // Создаём Shadow Root для изоляции
      const shadowRoot = contentDiv.attachShadow({ mode: "open" });

      this.tabContent.appendChild(contentDiv);

      // Обработчик закрытия вкладки
      tab.querySelector(".close-tab").addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeTab(tabId);
      });
      // Клик по самой вкладке => активация
      tab.addEventListener("click", () => {
        this.activateTab(tabId);
      });

      // --- Загружаем HTML-фрагмент через fetch ---
      try {
        console.log(`Загружается содержимое из URL: ${contentURL}`);
        const response = await fetch(contentURL);
        if (!response.ok) {
          throw new Error(
            `Не удалось загрузить содержимое: ${contentURL} (${response.status})`
          );
        }
        const html = await response.text();

        // Создаём tempDiv для парсинга
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        // Обрабатываем стили и скрипты внутри Shadow DOM
        this.processStyles(tempDiv, shadowRoot);
        this.processScripts(tempDiv, shadowRoot);

        // Вставляем остаток внутрь Shadow Root (без <script> и <style>)
        shadowRoot.append(...Array.from(tempDiv.childNodes));

        // Инициализируем обработчики кликов внутри Shadow Root
        this.initializeShadowLinkHandler(shadowRoot);

        // Специфичная инициализация для различных страниц через specload.json
        await this.initializePageSpecific(contentURL, shadowRoot);

        // Сохраняем ссылку на Shadow Root
        this.tabShadowRoots[tabId] = shadowRoot;

        // Устанавливаем MutationObserver для отслеживания изменений содержимого
        const observer = new MutationObserver(() => {
          this.updatePageHeight();
        });
        observer.observe(shadowRoot, { childList: true, subtree: true });
      } catch (error) {
        console.error(
          `(TabManager) Ошибка при загрузке "${contentURL}":`,
          error
        );
        shadowRoot.innerHTML = `<p>Не удалось загрузить ${contentURL}. ${error.message}</p>`;
      }

      // Активируем вкладку после успешного создания
      this.activateTab(tabId);
      this.updateTabsVisibility();
      this.updateCreateCartButtonVisibility();
      this.updatePageHeight();

      return tabId; // Возвращаем ID вкладки
    }

    /**
     * Метод для активации внутренней вкладки внутри Shadow Root родительской вкладки.
     *
     * @param {string} parentTabId - ID родительской вкладки
     * @param {string} innerTabDataTab - Значение data-tab внутренней вкладки
     */
    activateInnerTab(parentTabId, innerTabDataTab) {
      const shadowRoot = this.tabShadowRoots[parentTabId];
      if (!shadowRoot) {
        console.error(
          `Shadow Root для вкладки с ID "${parentTabId}" не найден.`
        );
        return;
      }

      const innerTabLink = shadowRoot.querySelector(
        `.tab-link[data-tab="${innerTabDataTab}"]`
      );
      if (innerTabLink) {
        innerTabLink.click(); // Имитируем нажатие на внутреннюю вкладку
        console.log(
          `Внутренняя вкладка "${innerTabDataTab}" активирована внутри "${parentTabId}".`
        );
      } else {
        console.error(
          `Внутренняя ссылка с data-tab="${innerTabDataTab}" не найдена внутри "${parentTabId}".`
        );
      }
    }

    /**
     * Инициализирует специфичные для страницы функции из specload.json
     *
     * @param {string} contentURL
     * @param {ShadowRoot} shadowRoot
     */
    async initializePageSpecific(contentURL, shadowRoot) {
      if (this.specLoad[contentURL]) {
        const { scripts, initFunctions } = this.specLoad[contentURL];

        // Функция для загрузки отдельных скриптов
        const loadScript = (src) => {
          return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error(`Не удалось загрузить скрипт: ${src}`));
            document.head.appendChild(script);
          });
        };

        // Загружаем все скрипты
        for (const scriptSrc of scripts) {
          try {
            await loadScript(scriptSrc);
            console.log(`Скрипт ${scriptSrc} загружен успешно.`);
          } catch (err) {
            console.error(err.message);
          }
        }

        // Выполняем функции инициализации
        for (const funcName of initFunctions) {
          if (typeof window[funcName] === "function") {
            try {
              await window[funcName](shadowRoot);
              console.log(`Функция ${funcName} выполнена успешно.`);
            } catch (err) {
              console.error(`Ошибка при выполнении функции ${funcName}:`, err);
            }
          } else {
            console.error(`Функция ${funcName} не определена.`);
          }
        }
      } else {
        console.warn(
          `Конфигурация для "${contentURL}" не найдена в specload.json.`
        );
      }
    }

    /**
     * openPageAsTab
     * Открывает/активирует вкладку
     *
     * @param {string} title
     * @param {string} url
     */
    async openPageAsTab(title, url) {
      const existingTab = Array.from(this.tabs.children).find(
        (child) =>
          child !== this.buttonsContainer && child.dataset.name === title
      );
      if (existingTab) {
        const tabId = existingTab.dataset.tab;
        this.activateTab(tabId);
        return tabId; // Возвращаем ID существующей вкладки
      } else {
        // Проверяем, если это вкладка корзины
        const isCart = title.startsWith("Корзина");
        const tabId = await this.createTab(title, url, isCart);
        return tabId; // Возвращаем ID новой вкладки
      }
    }

    /**
     * processScripts
     * Извлекает <script> теги из tempDiv и выполняет их внутри Shadow Root.
     * Скрипты без атрибута data-global изолируются, скрипты с data-global="true" взаимодействуют с глобальным контекстом.
     *
     * @param {HTMLElement} tempDiv - временный контейнер с загруженным HTML
     * @param {ShadowRoot} shadowRoot - Shadow Root контейнера содержимого вкладки
     */
    processScripts(tempDiv, shadowRoot) {
      const scripts = tempDiv.querySelectorAll("script");
      scripts.forEach((script) => {
        const newScript = document.createElement("script");

        // Проверяем наличие атрибута data-global
        const isGlobal = script.getAttribute("data-global") === "true";

        if (isGlobal) {
          // Скрипты, взаимодействующие с глобальным контекстом
          // Копируем атрибуты (например, src)
          Array.from(script.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          // Вставляем скрипт в document.head для глобального выполнения
          document.head.appendChild(newScript);
        } else {
          // Изолированные скрипты
          // Копируем атрибуты (например, src)
          Array.from(script.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (script.src) {
            // Внешний скрипт
            newScript.src = script.src;
            newScript.async = false; // Чтобы сохранить порядок выполнения
          } else {
            // Инлайновый скрипт
            newScript.textContent = `(function() { ${script.textContent} })();`;
          }

          // Добавляем скрипт в Shadow Root для выполнения
          shadowRoot.appendChild(newScript);
        }

        // Удаляем оригинальный скрипт из tempDiv
        script.remove();
      });
    }

    /**
     * processStyles
     * Извлекает <style> и <link rel="stylesheet"> теги из tempDiv и подключает их внутри Shadow Root.
     *
     * @param {HTMLElement} tempDiv - временный контейнер с загруженным HTML
     * @param {ShadowRoot} shadowRoot - Shadow Root контейнера содержимого вкладки
     */
    processStyles(tempDiv, shadowRoot) {
      const styleTags = tempDiv.querySelectorAll(
        "style, link[rel='stylesheet']"
      );
      styleTags.forEach((style) => {
        if (style.tagName.toLowerCase() === "style") {
          // Инлайновый стиль
          const newStyle = document.createElement("style");
          newStyle.textContent = style.textContent;
          shadowRoot.appendChild(newStyle);
        } else if (style.tagName.toLowerCase() === "link") {
          // Внешний стиль
          const href = style.getAttribute("href");
          if (href) {
            const newLink = document.createElement("link");
            newLink.rel = "stylesheet";
            newLink.href = href;
            shadowRoot.appendChild(newLink);
          }
        }
        // Удаляем оригинальный тег из tempDiv
        style.remove();
      });
    }

    /**
     * activateTab
     * Активирует вкладку с указанным ID
     *
     * @param {string} tabId
     */
    activateTab(tabId) {
      // Деактивируем все вкладки
      this.tabs.querySelectorAll(".tab").forEach((t) => {
        t.classList.remove("active");
        const titleEl = t.querySelector(".tab-title");
        if (titleEl && t.dataset.tab !== tabId) {
          titleEl.setAttribute("contenteditable", "false");
        }
      });

      // Скрываем все содержимые вкладки
      this.tabContent.querySelectorAll(".content").forEach((c) => {
        c.style.display = "none";
      });

      // Активируем выбранную вкладку и отображаем её содержимое
      const activeTab = this.tabs.querySelector(`.tab[data-tab="${tabId}"]`);
      const activeContent = this.tabContent.querySelector(
        `.content[data-content="${tabId}"]`
      );
      if (activeTab && activeContent) {
        activeTab.classList.add("active");
        activeContent.style.display = "block";

        // Если это корзина, разрешаем редактирование
        if (activeTab.dataset.name.startsWith("Корзина")) {
          const titleEl = activeTab.querySelector(".tab-title");
          if (titleEl) {
            titleEl.setAttribute("contenteditable", "true");
          }
        }

        // Обновляем текущую активную вкладку
        this.currentActiveTab = tabId;

        // Обновляем ссылку на Shadow Root уже активной вкладки
        this.tabShadowRoots[tabId] = activeContent.shadowRoot;

        // Обновляем высоту страницы под содержимое активной вкладки
        this.updatePageHeight();
        console.log(`Вкладка "${activeTab.dataset.name}" активирована.`);
      } else {
        console.warn(`Не удалось найти вкладку или содержимое с ID: ${tabId}`);
      }
    }

    /**
     * closeTab
     * Закрывает вкладку
     *
     * @param {string} tabId
     */
    closeTab(tabId) {
      const tabEl = this.tabs.querySelector(`.tab[data-tab="${tabId}"]`);
      const contentEl = this.tabContent.querySelector(
        `.content[data-content="${tabId}"]`
      );
      if (tabEl && contentEl) {
        const isActive = tabEl.classList.contains("active");
        const tabName = tabEl.dataset.name;
        tabEl.remove();
        contentEl.remove();
        this.tabNames.delete(tabName);

        if (tabId in this.activeCartNames) {
          delete this.activeCartNames[tabId];
          this.notifyCartUpdate();
        }
        if (tabName.startsWith("Корзина")) {
          const number = parseInt(tabName.split(" ")[1]);
          if (!isNaN(number)) {
            this.cartNumbers.delete(number);
          }
        }
        if (isActive) {
          const remainingTabs = this.tabs.querySelectorAll(".tab");
          if (remainingTabs.length > 0) {
            const lastTabId =
              remainingTabs[remainingTabs.length - 1].getAttribute("data-tab");
            this.activateTab(lastTabId);
          }
        }
        this.updateTabsVisibility();
        this.updateCreateCartButtonVisibility();
        this.updatePageHeight();

        const openTabs = this.tabs.querySelectorAll(".tab");
        const isOnlyMain =
          openTabs.length === 1 && openTabs[0].dataset.name === "Главная";
        if (openTabs.length === 0 || isOnlyMain) {
          this.openPageAsTab("Главная", "/pages/index.html");
        }
      }
    }

    /**
     * updateTabsVisibility
     * Если осталась одна "Главная", сворачиваем .tabs
     */
    updateTabsVisibility() {
      const openTabs = this.tabs.querySelectorAll(".tab");
      if (openTabs.length === 1 && openTabs[0].dataset.name === "Главная") {
        this.tabs.classList.add("collapsed");
      } else {
        this.tabs.classList.remove("collapsed");
      }
    }

    /**
     * updateCreateCartButtonVisibility
     * Упрощённо оставляем всегда видимой
     */
    updateCreateCartButtonVisibility() {
      this.createCartButton.style.display = "block";
      // console.log("Кнопки 'Создать корзину' и 'Журнал заказов' видны.");
    }

    /**
     * updatePageHeight
     * Обновляет высоту страницы под содержимое активной вкладки,
     * но не меньше полной высоты экрана.
     */
    updatePageHeight() {
      // Находим активную вкладку
      const activeContentDiv =
        this.tabContent.querySelector(
          `.content[data-content="${this.currentActiveTab}"]`
        ) ||
        Array.from(this.tabContent.children).find(
          (div) => div.style.display === "block"
        );

      if (activeContentDiv) {
        // Получаем высоту содержимого Shadow DOM
        const shadowRoot = activeContentDiv.shadowRoot;
        if (shadowRoot) {
          const contentHeight = shadowRoot.scrollHeight;
          const viewportHeight = window.innerHeight;

          // Вычисляем новую высоту: максимальное значение между содержимым и высотой экрана
          const newHeight = Math.max(contentHeight, viewportHeight);

          // Устанавливаем высоту основного контейнера
          document.body.style.height = `${newHeight}px`;
          document.documentElement.style.height = `${newHeight}px`;
        }
      } else {
        // Если нет активного содержимого, устанавливаем минимальную высоту
        const viewportHeight = window.innerHeight;
        document.body.style.height = `${viewportHeight}px`;
        document.documentElement.style.height = `${viewportHeight}px`;
      }
    }
  }

  /**
   * Инициализация
   */
  global.GComm_TabManager = new GComm_TabManager();
  // global.GComm_TabOpener = new GComm_TabOpener(global.GComm_TabManager);
})(window);
