(function (global) {
  class GComm_TabManager {
    constructor() {
      // Данные конфигурации и управления вкладками
      this.specLoad = {}; // Данные из specload.json
      this.tabShadowRoots = {}; // Shadow Root для каждой вкладки
      this.tabStyleData = {}; // Данные по конструктивным стилям для каждой вкладки (с media)

      // ------------------- [BASKET EVENTS SECTION] -------------------
      this.activeCartNames = {}; // Ключ: tabId, значение: имя корзины (например, "Корзина 1")
      this.cartNumbers = new Set(); // Для генерации уникальных номеров корзин
      this.carts = {}; // Дополнительное хранилище, если потребуется
      this.activeCartId = null; // Значение, устанавливаемое при нажатии кнопки активации (pin)
      // ------------------------------------------------------------------

      // Проверяем поддержку Constructable Stylesheets
      this.useConstructableStylesheets =
        "adoptedStyleSheets" in Document.prototype &&
        typeof CSSStyleSheet !== "undefined" &&
        CSSStyleSheet.prototype.replace;
      // Кэш для загруженных стилей
      this.constructableStylesheetCache = {};

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

      // Если контейнер специальных кнопок отсутствует – создаём его
      this.buttonsContainer = this.tabs.querySelector(".tabs-buttons");
      if (!this.buttonsContainer) {
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
        this.createCartButton.innerHTML = `<span style="pointer-events: none;">Создать новую корзину</span>`;

        // Кнопка «Чат»
        this.createChatButton = document.createElement("button");
        this.createChatButton.id = "create-chat-button";
        this.createChatButton.classList.add("create-chat-button");
        this.createChatButton.setAttribute("data-tooltip", "Написать в чат");
        this.createChatButton.innerHTML = `<span style="pointer-events: none;">Написать в чат</span>`;

        this.buttonsContainer.appendChild(this.createChatButton);
        this.buttonsContainer.appendChild(this.createCartButton);
        this.tabs.appendChild(this.buttonsContainer);
      } else {
        this.createCartButton = this.buttonsContainer.querySelector(
          "#create-cart-button"
        );
        this.createChatButton = this.buttonsContainer.querySelector(
          "#create-chat-button"
        );
      }

      // Инициализация вкладок
      this.tabCounter = 0;
      this.tabNames = new Set();
      Array.from(this.tabs.children).forEach((child) => {
        if (child !== this.buttonsContainer) {
          const tab = child.querySelector(".tab");
          if (tab) {
            this.tabNames.add(tab.dataset.name);
            // Если название начинается с "Корзина", добавляем номер в набор
            if (tab.dataset.name.startsWith("Корзина")) {
              const number = parseInt(tab.dataset.name.split(" ")[1]);
              if (!isNaN(number)) {
                this.cartNumbers.add(number);
              }
            }
          }
        }
      });

      this.isCreatingCart = false;

      // Обработчик для кнопок "cart-button"
      const cartButtons = document.querySelectorAll("#cart-button");
      if (cartButtons.length > 0) {
        cartButtons.forEach((cartButton) => {
          cartButton.addEventListener("click", async () => {
            const tabManager = window.GComm_TabManager;
            if (!tabManager) {
              console.error("Tab Manager не найден.");
              return;
            }
            const existingTab = Array.from(tabManager.tabs.children).find(
              (child) =>
                child !== tabManager.buttonsContainer &&
                child.dataset.name === "Корзина 1"
            );
            if (existingTab) {
              tabManager.activateTab(existingTab.dataset.tab);
            } else {
              await tabManager.createTab(
                "Корзина 1",
                "/pages/delivery.html",
                true
              );
            }
          });
        });
      }

      // Обработчик для кнопки "Создать корзину"
      this.createCartButton.addEventListener("click", async () => {
        if (this.isCreatingCart) {
          console.warn("Создание корзины уже в процессе.");
          return;
        }
        this.isCreatingCart = true;
        this.createCartButton.disabled = true;
        try {
          const url = "/pages/delivery.html";
          await this.createTab("Корзина", url, true);
        } catch (error) {
          console.error("Ошибка при создании корзины:", error);
        } finally {
          this.isCreatingCart = false;
          this.createCartButton.disabled = false;
        }
      });

      // Обработчик для кнопки "Чат"
      this.createChatButton.addEventListener("click", async () => {
        const url = "/pages/chat.html";
        await this.openPageAsTab("Чат", url);
      });

      // Обработка меню
      const menuLinks = document.querySelectorAll(".menu a, .secondary-button");
      menuLinks.forEach((link) => {
        link.addEventListener("click", async (e) => {
          e.preventDefault();
          const title =
            link.getAttribute("data-tab-title") || link.textContent.trim();
          const url = link.getAttribute("data-page");
          if (url) {
            await this.openPageAsTab(title, url);
          }
        });
      });

      // Прочие обработчики (Журнал заказов, Контакты, Вход, и т.д.)
      const ordersButtons = document.querySelectorAll(".orders-button");
      if (ordersButtons.length > 0) {
        ordersButtons.forEach((ordersButton) => {
          ordersButton.addEventListener("click", async (e) => {
            e.preventDefault();
            await this.openPageAsTab("Журнал заказов", "/pages/zajavki.html");
          });
        });
      }
      const ordersButton2 = document.querySelector(".orders-button2");
      if (ordersButton2) {
        ordersButton2.addEventListener("click", async (e) => {
          e.preventDefault();
          await this.openPageAsTab("Журнал заказов", "/pages/zajavki.html");
        });
      }
      const contactsButtons = document.querySelectorAll(".contacts-button");
      if (contactsButtons.length > 0) {
        contactsButtons.forEach((contactsButton) => {
          contactsButton.addEventListener("click", async (e) => {
            e.preventDefault();
            await this.openPageAsTab("Контакты", "/pages/Contacts.html");
          });
        });
      }
      const registrationButtons = document.querySelectorAll("#loginButton");
      if (registrationButtons.length > 0) {
        registrationButtons.forEach((registrationButton) => {
          registrationButton.addEventListener("click", async (e) => {
            e.preventDefault();
            await this.openPageAsTab(
              "Вход в аккаунт",
              "/pages/registration.html"
            );
          });
        });
      }
      const productCardButtons =
        document.querySelectorAll("#productcardbutton");
      if (productCardButtons.length > 0) {
        productCardButtons.forEach((productCardButton) => {
          productCardButton.addEventListener("click", async (e) => {
            e.preventDefault();
            await this.openPageAsTab(
              "Фотореле EKF PS-5",
              "/pages/productcard.html"
            );
          });
        });
      }
      const openwaitlistButtons = document.querySelectorAll(".waitlist-button");
      if (openwaitlistButtons.length > 0) {
        openwaitlistButtons.forEach((openwaitlistButton) => {
          openwaitlistButton.addEventListener("click", async (e) => {
            e.preventDefault();
            const title = "Личный кабинет";
            const url = "/pages/cabinet_postavshika.html";
            const parentTabId = await this.openPageAsTab(title, url);
            const innerDataTab = "waitlist";
            this.activateInnerTab(parentTabId, innerDataTab);
          });
        });
      }
      const openbalanceLoyalityElements = document.querySelectorAll(
        ".label, .value, .Cabinet-button"
      );
      openbalanceLoyalityElements.forEach((element) => {
        element.addEventListener("click", async (e) => {
          e.preventDefault();
          const title = "Личный кабинет";
          const url = "/pages/cabinet_postavshika.html";
          const parentTabId = await this.openPageAsTab(title, url);
          const innerDataTab = "balanceLoyalty";
          this.activateInnerTab(parentTabId, innerDataTab);
        });
      });
      const openSettingsButtons = document.querySelectorAll(
        ".settings-ac-button"
      );
      if (openSettingsButtons.length > 0) {
        openSettingsButtons.forEach((openSettingsButton) => {
          openSettingsButton.addEventListener("click", async (e) => {
            e.preventDefault();
            const title = "Личный кабинет";
            const url = "/pages/cabinet_postavshika.html";
            const parentTabId = await this.openPageAsTab(title, url);
            const innerDataTab = "templates";
            this.activateInnerTab(parentTabId, innerDataTab);
          });
        });
      }
      const chatButtons = document.querySelectorAll(".chat-button");
      if (chatButtons.length > 0) {
        chatButtons.forEach((chatButton) => {
          chatButton.addEventListener("click", async (e) => {
            e.preventDefault();
            await this.openPageAsTab("Чат", "/pages/chat.html");
          });
        });
      }
      const logoButtons = document.querySelectorAll(".logo-button");
      if (logoButtons.length > 0) {
        logoButtons.forEach((logoButton) => {
          logoButton.addEventListener("click", async (e) => {
            e.preventDefault();
            await this.openPageAsTab("Главная", "/pages/index.html");
          });
        });
      }

      // Обработчик кнопок поиска
      const searchBars = document.querySelectorAll(".search-bar");
      if (searchBars.length > 0) {
        searchBars.forEach((searchBar) => {
          const searchButton = searchBar.querySelector("#searchButton");
          const searchInput = searchBar.querySelector("#searchInput");
          if (searchButton && searchInput) {
            console.log("Search button and input found in a search-bar.");
            searchButton.addEventListener("click", async (e) => {
              e.preventDefault();
              console.log("Кнопка поиска нажата.");
              const query = searchInput.value.trim();
              let title, contentURL;
              if (query === "") {
                title = "Поиск";
                contentURL = "/pages/search_cat.html";
              } else {
                title = `Результаты: ${query}`;
                contentURL = "/pages/search_cat.html";
                window.currentSearchQuery = query;
              }
              console.log(
                `Поиск: title="${title}", contentURL="${contentURL}"`
              );
              await this.openPageAsTab(title, contentURL);
            });
          } else {
            if (!searchButton)
              console.error(
                "Основная кнопка поиска (#searchButton) не найдена в search-bar."
              );
            if (!searchInput)
              console.error(
                "Поле ввода поиска (#searchInput) не найдено в search-bar."
              );
          }
        });
      } else {
        console.error("Элементы с классом .search-bar для поиска не найдены.");
      }
      const searchIcons = document.querySelectorAll("#searchIcon");
      if (searchIcons.length > 0) {
        searchIcons.forEach((searchIcon) => {
          searchIcon.addEventListener("click", (e) => {
            e.preventDefault();
            const searchBar = e.target.closest(".search-bar");
            if (searchBar) {
              const input = searchBar.querySelector("#searchInput");
              if (input) {
                input.focus();
              }
            }
          });
        });
      }

      // Изначально открываем "Главная"
      this.openPageAsTab("Главная", "/pages/index.html");
      this.updateCreateCartButtonVisibility();

      // При изменении размеров окна обновляем высоту страницы и, если используется Constructable Stylesheets, обновляем списки adoptedStyleSheets
      window.addEventListener("resize", () => {
        this.updatePageHeight();
        if (this.useConstructableStylesheets) {
          this.updateAdoptedStylesheets();
        }
      });

      // Обработчик кликов в основном документе
      this.initializeMainDocumentLinkHandler();

      // ------------------ [BASKET EVENTS LISTENERS] ------------------
      window.addEventListener("cartActivated", (e) => {
        const cartId = e.detail.cartId;
        this.setActiveCart(cartId);
      });
      window.addEventListener("cartTitleChanged", (e) => {
        const cartId = e.detail.cartId;
        const newTitle = e.detail.newTitle;
        this.renameCart(cartId, newTitle);
      });
      // ------------------------------------------------------------------
    }

    // --------------- [BASKET MANAGEMENT METHODS] ---------------
    setActiveCart(cartId) {
      if (!cartId) return;
      this.activeCartId = cartId;
      console.log("Активная корзина установлена:", cartId);
      this.updateActiveCartIcons();
    }

    renameCart(cartId, newTitle) {
      let tab = this.tabs.querySelector(".tab.active");
      if (!tab) {
        tab = Array.from(this.tabs.children).find(
          (el) => el.dataset && el.dataset.name === cartId
        );
      }
      if (tab) {
        const hadPin = !!tab.querySelector(".tab-cart-activate-icon");
        const titleEl = tab.querySelector(".tab-title");
        if (titleEl) {
          let textUpdated = false;
          for (let i = 0; i < titleEl.childNodes.length; i++) {
            const node = titleEl.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
              node.nodeValue = newTitle;
              textUpdated = true;
              break;
            }
          }
          if (!textUpdated) {
            titleEl.appendChild(document.createTextNode(newTitle));
          }
        }
        tab.dataset.name = newTitle;
        const tabId = tab.getAttribute("data-tab");
        this.activeCartNames[tabId] = newTitle;
        console.log(`Вкладка "${cartId}" переименована в "${newTitle}".`);
        if (hadPin) {
          let iconEl = tab.querySelector(".tab-cart-activate-icon");
          if (!iconEl) {
            iconEl = document.createElement("i");
            iconEl.classList.add("tab-cart-activate-icon");
            const titleSpan = tab.querySelector(".tab-title");
            if (titleSpan) {
              titleSpan.insertAdjacentElement("beforebegin", iconEl);
            } else {
              tab.insertBefore(iconEl, tab.firstChild);
            }
          }
          iconEl.className = "tab-cart-activate-icon ri-pushpin-fill";
        }
      }
    }

    updateActiveCartIcons() {
      const activeTab = this.tabs.querySelector(".tab.active");
      if (activeTab) {
        let iconEl = activeTab.querySelector(".tab-cart-activate-icon");
        if (!iconEl) {
          iconEl = document.createElement("i");
          iconEl.classList.add("tab-cart-activate-icon");
          const titleSpan = activeTab.querySelector(".tab-title");
          if (titleSpan) {
            titleSpan.insertAdjacentElement("beforebegin", iconEl);
          } else {
            activeTab.insertBefore(iconEl, activeTab.firstChild);
          }
        }
        iconEl.className = "tab-cart-activate-icon ri-pushpin-fill";
      }
      const otherTabs = Array.from(this.tabs.children).filter(
        (el) => el !== this.buttonsContainer && !el.classList.contains("active")
      );
      otherTabs.forEach((tab) => {
        const iconEl = tab.querySelector(".tab-cart-activate-icon");
        if (iconEl) {
          iconEl.remove();
        }
      });
    }
    // ------------- [END OF BASKET MANAGEMENT METHODS] -------------

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

    notifyCartUpdate() {
      const event = new CustomEvent("cartUpdate", {
        detail: { activeCartNames: this.activeCartNames },
      });
      window.dispatchEvent(event);
    }

    findNextCartName() {
      let index = 1;
      while (this.cartNumbers.has(index)) {
        index++;
      }
      return `Корзина ${index}`;
    }

    async loadConstructableStylesheet(url) {
      if (this.constructableStylesheetCache[url]) {
        return this.constructableStylesheetCache[url];
      }
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Не удалось загрузить стиль: ${url}`);
        }
        const cssText = await response.text();
        const sheet = new CSSStyleSheet();
        await sheet.replace(cssText);
        this.constructableStylesheetCache[url] = sheet;
        return sheet;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }

    async processStyles(tempDiv, shadowRoot, tabId) {
      if (this.useConstructableStylesheets) {
        let sheetData = [];
        const styleTags = tempDiv.querySelectorAll("style");
        for (const styleTag of styleTags) {
          let sheet = new CSSStyleSheet();
          try {
            await sheet.replace(styleTag.textContent);
          } catch (err) {
            console.error("Ошибка обработки стиля:", err);
          }
          sheetData.push({ sheet, media: null });
          styleTag.remove();
        }
        const linkTags = tempDiv.querySelectorAll("link[rel='stylesheet']");
        for (const link of linkTags) {
          const href = link.getAttribute("href");
          let media = link.getAttribute("media") || null;
          try {
            const sheet = await this.loadConstructableStylesheet(href);
            sheetData.push({ sheet, media });
          } catch (err) {
            console.error(err);
          }
          link.remove();
        }
        // Применяем adoptedStyleSheets в зависимости от media-запросов
        const adopted = sheetData
          .filter((item) => {
            if (!item.media) return true;
            return window.matchMedia(item.media).matches;
          })
          .map((item) => item.sheet);
        shadowRoot.adoptedStyleSheets = adopted;
        return sheetData;
      } else {
        // Фолбэк: копирование стилей в shadowRoot
        const styleTags = tempDiv.querySelectorAll(
          "style, link[rel='stylesheet']"
        );
        styleTags.forEach((style) => {
          if (style.tagName.toLowerCase() === "style") {
            const newStyle = document.createElement("style");
            newStyle.textContent = style.textContent;
            shadowRoot.appendChild(newStyle);
          } else if (style.tagName.toLowerCase() === "link") {
            const href = style.getAttribute("href");
            if (href) {
              const newLink = document.createElement("link");
              newLink.rel = "stylesheet";
              newLink.href = href;
              shadowRoot.appendChild(newLink);
            }
          }
          style.remove();
        });
        return null;
      }
    }

    processScripts(tempDiv, shadowRoot) {
      const scripts = tempDiv.querySelectorAll("script");
      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        const isGlobal = script.getAttribute("data-global") === "true";
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (isGlobal) {
          document.head.appendChild(newScript);
        } else {
          if (script.src) {
            newScript.src = script.src;
            newScript.async = false;
          } else {
            newScript.textContent = `(function() { ${script.textContent} })();`;
          }
          shadowRoot.appendChild(newScript);
        }
        script.remove();
      });
    }

    async initializePageSpecific(contentURL, shadowRoot) {
      if (this.specLoad[contentURL]) {
        const { scripts, initFunctions } = this.specLoad[contentURL];
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
        for (const scriptSrc of scripts) {
          try {
            await loadScript(scriptSrc);
            console.log(`Скрипт ${scriptSrc} загружен успешно.`);
          } catch (err) {
            console.error(err.message);
          }
        }
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

    async openPageAsTab(title, url) {
      const existingTab = Array.from(this.tabs.children).find(
        (child) =>
          child !== this.buttonsContainer && child.dataset.name === title
      );
      if (existingTab) {
        const tabId = existingTab.dataset.tab;
        this.activateTab(tabId);
        return tabId;
      } else {
        const isCart = title.startsWith("Корзина");
        const tabId = await this.createTab(title, url, isCart);
        return tabId;
      }
    }

    async createTab(title, contentURL, isCart = false) {
      if (isCart) {
        title = this.findNextCartName();
        this.cartNumbers.add(parseInt(title.split(" ")[1]));
      } else {
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
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("content");
      contentDiv.setAttribute("data-content", tabId);
      contentDiv.style.display = "none";
      const shadowRoot = contentDiv.attachShadow({ mode: "open" });
      this.tabContent.appendChild(contentDiv);
      tab.querySelector(".close-tab").addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeTab(tabId);
      });
      tab.addEventListener("click", () => {
        this.activateTab(tabId);
      });
      try {
        console.log(`Загружается содержимое из URL: ${contentURL}`);
        const response = await fetch(contentURL);
        if (!response.ok) {
          throw new Error(
            `Не удалось загрузить содержимое: ${contentURL} (${response.status})`
          );
        }
        const html = await response.text();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const sheetData = await this.processStyles(tempDiv, shadowRoot, tabId);
        if (sheetData) {
          this.tabStyleData[tabId] = sheetData;
        }
        this.processScripts(tempDiv, shadowRoot);
        shadowRoot.append(...Array.from(tempDiv.childNodes));
        // Добавляем правило для отключения горизонтальной прокрутки в мобильной версии,
        // но ограничиваем его только на уровне хоста, чтобы не сдвигать внутренние стили.
        if (window.innerWidth <= 800) {
          const disableHorizScrollStyle = document.createElement("style");
          disableHorizScrollStyle.textContent = `:host { overflow-x: hidden !important; }`;
          shadowRoot.prepend(disableHorizScrollStyle);
        }
        this.initializeShadowLinkHandler(shadowRoot);
        await this.initializePageSpecific(contentURL, shadowRoot);
        this.tabShadowRoots[tabId] = shadowRoot;
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
      this.activateTab(tabId);
      this.updateTabsVisibility();
      this.updateCreateCartButtonVisibility();
      this.updatePageHeight();
      return tabId;
    }

    updateAdoptedStylesheets() {
      for (const tabId in this.tabStyleData) {
        const sheetData = this.tabStyleData[tabId];
        const shadowRoot = this.tabShadowRoots[tabId];
        if (shadowRoot) {
          const adopted = sheetData
            .filter((item) => {
              if (!item.media) return true;
              return window.matchMedia(item.media).matches;
            })
            .map((item) => item.sheet);
          shadowRoot.adoptedStyleSheets = adopted;
        }
      }
    }

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
        innerTabLink.click();
        console.log(
          `Внутренняя вкладка "${innerTabDataTab}" активирована внутри "${parentTabId}".`
        );
      } else {
        console.error(
          `Внутренняя ссылка с data-tab="${innerTabDataTab}" не найдена внутри "${parentTabId}".`
        );
      }
    }

    activateTab(tabId) {
      this.tabs.querySelectorAll(".tab").forEach((t) => {
        t.classList.remove("active");
        const titleEl = t.querySelector(".tab-title");
        if (titleEl && t.dataset.tab !== tabId) {
          titleEl.setAttribute("contenteditable", "false");
        }
      });
      this.tabContent.querySelectorAll(".content").forEach((c) => {
        c.style.display = "none";
      });
      const activeTab = this.tabs.querySelector(`.tab[data-tab="${tabId}"]`);
      const activeContent = this.tabContent.querySelector(
        `.content[data-content="${tabId}"]`
      );
      if (activeTab && activeContent) {
        activeTab.classList.add("active");
        activeContent.style.display = "block";
        if (activeTab.dataset.name) {
          const titleEl = activeTab.querySelector(".tab-title");
          if (titleEl) {
            titleEl.setAttribute("contenteditable", "true");
          }
        }
        this.currentActiveTab = tabId;
        this.tabShadowRoots[tabId] = activeContent.shadowRoot;
        this.updatePageHeight();
        console.log(`Вкладка "${activeTab.dataset.name}" активирована.`);
      } else {
        console.warn(`Не удалось найти вкладку или содержимое с ID: ${tabId}`);
      }
    }

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

    updateTabsVisibility() {
      const openTabs = this.tabs.querySelectorAll(".tab");
      if (openTabs.length === 1 && openTabs[0].dataset.name === "Главная") {
        this.tabs.classList.add("collapsed");
      } else {
        this.tabs.classList.remove("collapsed");
      }
    }

    updateCreateCartButtonVisibility() {
      this.createCartButton.style.display = "block";
    }

    // Изменённый метод updatePageHeight:
    // Для мобильной версии (ширина <=800px) вычисляем доступную высоту, учитывая
    // верхнюю панель (.top-panel) и нижнюю панель (bottom‑bar).
    // Если вкладки видимы (не имеют класс collapsed), то их высота прибавляется к верхней границе.
    // При этом внешняя прокрутка отключается, а скроллирование осуществляется только внутри области контента.
    updatePageHeight() {
      if (window.innerWidth <= 800) {
        // Получаем элементы верхней / нижней панелей
        const topPanel = document.querySelector(".top-panel");
        const bottomBar = document.querySelector(".bottom-bar");
        const topPanelHeight = topPanel ? topPanel.offsetHeight : 0;
        const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 0;

        // Если вкладки не "collapsed", их высота прибавляется к верхней границе
        let tabsHeight = 0;
        if (!this.tabs.classList.contains("collapsed")) {
          tabsHeight = this.tabs.offsetHeight;
        }

        // Ищем активный блок контента
        const activeContentDiv =
          this.tabContent.querySelector(
            `.content[data-content="${this.currentActiveTab}"]`
          ) ||
          Array.from(this.tabContent.children).find(
            (div) => div.style.display === "block"
          );

        if (activeContentDiv) {
          // Суммарная высота «верхней части» (top-panel + вкладки)
          const offsetTop = topPanelHeight + tabsHeight;

          // Рассчитываем высоту контентного блока с учётом нижней панели
          const availableHeight =
            window.innerHeight - offsetTop - bottomBarHeight;

          // Смещаем контент вниз на offsetTop, чтобы верхняя панель и вкладки не перекрывали
          activeContentDiv.style.marginTop = offsetTop + "px";
          // Задаём ему вычисленную высоту и включаем вертикальный скролл
          activeContentDiv.style.height = availableHeight + "px";
          activeContentDiv.style.overflowY = "auto";
        }

        // Отключаем внешнюю прокрутку
        document.body.style.height = `${window.innerHeight}px`;
        document.documentElement.style.height = `${window.innerHeight}px`;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      } else {
        // Логика для десктопной версии остаётся прежней
        const activeContentDiv =
          this.tabContent.querySelector(
            `.content[data-content="${this.currentActiveTab}"]`
          ) ||
          Array.from(this.tabContent.children).find(
            (div) => div.style.display === "block"
          );
        if (activeContentDiv) {
          const shadowRoot = activeContentDiv.shadowRoot;
          if (shadowRoot) {
            const contentHeight = shadowRoot.scrollHeight;
            const viewportHeight = window.innerHeight;
            const newHeight = Math.max(contentHeight, viewportHeight);
            document.body.style.height = `${newHeight}px`;
            document.documentElement.style.height = `${newHeight}px`;
          }
        } else {
          const viewportHeight = window.innerHeight;
          document.body.style.height = `${viewportHeight}px`;
          document.documentElement.style.height = `${viewportHeight}px`;
        }

        // Включаем стандартную прокрутку
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    }

    async openPageAsTab(title, url) {
      const existingTab = Array.from(this.tabs.children).find(
        (child) =>
          child !== this.buttonsContainer && child.dataset.name === title
      );
      if (existingTab) {
        const tabId = existingTab.dataset.tab;
        this.activateTab(tabId);
        return tabId;
      } else {
        const isCart = title.startsWith("Корзина");
        const tabId = await this.createTab(title, url, isCart);
        return tabId;
      }
    }
  }

  // Экспорт глобального таб-менеджера
  global.GComm_TabManager = new GComm_TabManager();
})(window);
