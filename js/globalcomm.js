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

      // Реорганизация структуры вкладок для поддержки горизонтальной прокрутки
      this.restructureTabsContainer();

      // Инициализация вкладок
      this.tabCounter = 0;
      this.tabNames = new Set();
      Array.from(this.tabsScrollContainer.children).forEach((child) => {
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
            const existingTab = Array.from(
              tabManager.tabsScrollContainer.children
            ).find((child) => child.dataset.name === "Корзина 1");
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

      // Прочие обработчики (Журнал заказов, Контакты, Вход и т.д.)
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
        document.querySelectorAll(".productcardbutton");
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

      // Инициализация скроллинга вкладок
      this.initTabsScrolling();

      // При изменении размеров окна обновляем высоту страницы и, если используется Constructable Stylesheets, обновляем списки adoptedStyleSheets
      window.addEventListener("resize", () => {
        this.updatePageHeight();
        if (this.useConstructableStylesheets) {
          this.updateAdoptedStylesheets();
        }
        // Обновляем индикаторы скролла при изменении размера окна
        this.updateScrollIndicators();
      });

      // Обработчик кликов в основном документе
      this.initializeMainDocumentLinkHandler();

      // Наблюдатель за изменениями в контейнере вкладок
      if ("ResizeObserver" in window) {
        const tabsResizeObserver = new ResizeObserver(() => {
          this.updatePageHeight();
          this.updateScrollIndicators();
        });
        tabsResizeObserver.observe(this.tabs);
      }

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

    // Метод для реорганизации структуры контейнера вкладок
    restructureTabsContainer() {
      // Сохраняем оригинальный HTML контейнера
      const originalTabsHTML = this.tabs.innerHTML;

      // Очищаем контейнер
      this.tabs.innerHTML = "";

      // Создаем контейнер для скроллируемых вкладок
      this.tabsScrollContainer = document.createElement("div");
      this.tabsScrollContainer.classList.add("tabs-scroll-container");

      // Создаем контейнер для кнопок
      this.buttonsContainer = document.createElement("div");
      this.buttonsContainer.classList.add("tabs-buttons");

      // Добавляем оба контейнера в основной контейнер вкладок
      this.tabs.appendChild(this.tabsScrollContainer);
      this.tabs.appendChild(this.buttonsContainer);

      // Временный div для парсинга оригинального HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = originalTabsHTML;

      // Перемещаем все существующие вкладки в контейнер для скролла
      const originalTabs = tempDiv.querySelectorAll(".tab");
      originalTabs.forEach((tab) => {
        // Добавляем атрибут draggable для перетаскивания
        tab.setAttribute("draggable", "true");
        this.tabsScrollContainer.appendChild(tab);
      });

      // Находим или создаем кнопки
      const originalButtonsContainer = tempDiv.querySelector(".tabs-buttons");

      if (originalButtonsContainer) {
        // Используем существующие кнопки
        this.createChatButton = originalButtonsContainer.querySelector(
          "#create-chat-button"
        );
        this.createCartButton = originalButtonsContainer.querySelector(
          "#create-cart-button"
        );

        // Очищаем контейнер кнопок и добавляем кнопки с иконками
        this.buttonsContainer.innerHTML = "";
      } else {
        // Создаем новые кнопки
        this.createChatButton = document.createElement("button");
        this.createChatButton.id = "create-chat-button";
        this.createChatButton.classList.add("create-chat-button");
        this.createChatButton.setAttribute("data-tooltip", "Написать в чат");

        this.createCartButton = document.createElement("button");
        this.createCartButton.id = "create-cart-button";
        this.createCartButton.classList.add("create-cart-button");
        this.createCartButton.setAttribute(
          "data-tooltip",
          "Создать новую корзину"
        );
      }

      // Добавляем текст и иконки для адаптивности (иконки будут показаны только на мобильном)
      this.createChatButton.innerHTML = `
        <span class="button-text" style="pointer-events: none;">Написать в чат</span>
        <i class="button-icon ri-chat-3-line" style="pointer-events: none; display: none;"></i>
      `;
      this.createCartButton.innerHTML = `
        <span class="button-text" style="pointer-events: none;">Создать новую корзину</span>
        <i class="button-icon ri-shopping-basket-line" style="pointer-events: none; display: none;"></i>
      `;

      // Добавляем кнопки в контейнер
      this.buttonsContainer.appendChild(this.createChatButton);
      this.buttonsContainer.appendChild(this.createCartButton);

      // Добавляем стили для новой структуры
      this.addTabsStyles();

      // Инициализируем перетаскивание для всех уже существующих вкладок
      const tabs = this.tabsScrollContainer.querySelectorAll(".tab");
      tabs.forEach((tab) => {
        this.initTabDragAndDrop(tab);
      });

      // Создаем индикатор перетаскивания
      this.dropIndicator = document.createElement("div");
      this.dropIndicator.classList.add("tab-drop-indicator");
      this.tabsScrollContainer.appendChild(this.dropIndicator);
    }

    // Метод для добавления стилей для новой структуры вкладок
    addTabsStyles() {
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        .tabs {
          display: flex;
          align-items: center;
          width: 100%;
          position: relative;
        }
        
        .tabs-scroll-container {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          scroll-behavior: smooth;
          -ms-overflow-style: none;
          scrollbar-width: none;
          flex: 1;
          white-space: nowrap;
          max-width: calc(100% - 80px);
        }
        
        .tabs-scroll-container::-webkit-scrollbar {
          display: none;
        }
        
        .tab {
          margin-right: 5px;
          user-select: none;
        }
        
        .tab-title {
          user-select: none;
        }
        
        .tab[contenteditable="true"] {
          user-select: text;
        }
        
        .tabs-buttons {
          display: flex;
          gap: 5px;
          margin-left: 5px;
          flex-shrink: 0;
          align-items: center;
        }
        
        /* Стили для кнопок не модифицируем, используем только для иконок/текста */
        .create-chat-button i, .create-cart-button i {
          font-size: 1.2em;
        }
        
        /* Текст показывается по умолчанию */
        .button-text {
          display: inline-block;
        }
        
        /* Иконки скрыты по умолчанию */
        .button-icon {
          display: none;
        }
        
        .tab-scroll-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          opacity: 0.6;
          font-size: 12px;
          padding: 2px;
          background: rgba(0,0,0,0.1);
          border-radius: 3px;
          display: none;
          pointer-events: none;
        }
        
        .tab-scroll-left {
          left: 0;
          border-radius: 0 3px 3px 0;
        }
        
        .tab-scroll-right {
          right: 80px;
          border-radius: 3px 0 0 3px;
        }
        
        /* Стили для перетаскивания */
        .tab.dragging {
          opacity: 0.5;
        }
        
        .tab-drop-indicator {
          border-right: 2px dashed #007d7e;
          height: 75%;
          position: absolute;
          top: 12.5%;
          z-index: 10;
          pointer-events: none;
          display: none;
        }
        
        @media (max-width: 800px) {
          .tabs-scroll-container {
            max-width: calc(100% - 70px);
          }
          
          /* В мобильной версии скрываем текст и показываем иконки */
          .button-text {
            display: none;
          }
          
          .button-icon {
            display: inline-block !important;
          }
          
          .tab-scroll-right {
            right: 70px;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }

    // Метод для инициализации горизонтального скролла вкладок
    initTabsScrolling() {
      // Обработчик прокрутки колесиком мыши
      this.tabsScrollContainer.addEventListener("wheel", (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          this.tabsScrollContainer.scrollLeft += e.deltaY;
          this.updateScrollIndicators();
        }
      });

      // Создаём индикаторы скролла
      this.createScrollIndicators();

      // Обновляем индикаторы при скролле
      this.tabsScrollContainer.addEventListener("scroll", () => {
        this.updateScrollIndicators();
      });

      // Начальное обновление индикаторов
      this.updateScrollIndicators();
    }

    // Метод для создания индикаторов скролла
    createScrollIndicators() {
      // Левый индикатор
      this.leftScrollIndicator = document.createElement("div");
      this.leftScrollIndicator.classList.add(
        "tab-scroll-indicator",
        "tab-scroll-left"
      );
      this.leftScrollIndicator.innerHTML = "◄";

      // Правый индикатор
      this.rightScrollIndicator = document.createElement("div");
      this.rightScrollIndicator.classList.add(
        "tab-scroll-indicator",
        "tab-scroll-right"
      );
      this.rightScrollIndicator.innerHTML = "►";

      this.tabs.appendChild(this.leftScrollIndicator);
      this.tabs.appendChild(this.rightScrollIndicator);
    }

    // Метод для обновления индикаторов скролла
    updateScrollIndicators() {
      if (
        !this.leftScrollIndicator ||
        !this.rightScrollIndicator ||
        !this.tabsScrollContainer
      )
        return;

      const hasLeftScroll = this.tabsScrollContainer.scrollLeft > 0;
      const hasRightScroll =
        this.tabsScrollContainer.scrollLeft <
        this.tabsScrollContainer.scrollWidth -
          this.tabsScrollContainer.clientWidth -
          1;

      this.leftScrollIndicator.style.display = hasLeftScroll ? "block" : "none";
      this.rightScrollIndicator.style.display = hasRightScroll
        ? "block"
        : "none";
    }

    // Метод для инициализации Drag and Drop для вкладок
    initTabDragAndDrop(tab) {
      // Создаем индикатор места вставки, если его еще нет
      if (!this.dropIndicator) {
        this.dropIndicator = document.createElement("div");
        this.dropIndicator.classList.add("tab-drop-indicator");
        this.tabsScrollContainer.appendChild(this.dropIndicator);
      }

      tab.addEventListener("dragstart", (e) => {
        // Предотвращаем перетаскивание, если редактируется название
        if (tab.querySelector('.tab-title[contenteditable="true"]')) {
          e.preventDefault();
          return false;
        }

        // Сохраняем ID перетаскиваемой вкладки
        e.dataTransfer.setData("text/plain", tab.dataset.tab);
        e.dataTransfer.effectAllowed = "move";

        // Добавляем класс для визуального стиля перетаскивания
        tab.classList.add("dragging");

        // Устанавливаем отступы для правильного позиционирования курсора
        const rect = tab.getBoundingClientRect();
        e.dataTransfer.setDragImage(tab, rect.width / 2, rect.height / 2);

        // Отключаем перетаскивание на изображениях и кнопках внутри вкладки
        const nonDraggableElements = tab.querySelectorAll(
          "img, button, .tab-edit-button"
        );
        nonDraggableElements.forEach((el) => {
          el.setAttribute("draggable", "false");
        });
      });

      tab.addEventListener("dragend", () => {
        tab.classList.remove("dragging");
        this.hideDropIndicator();
      });

      // Обработчики для tabsScrollContainer (область, где можно бросить вкладку)
      this.tabsScrollContainer.addEventListener("dragover", (e) => {
        e.preventDefault(); // Разрешаем drop
        e.dataTransfer.dropEffect = "move";
        this.updateDropIndicatorPosition(e);
      });

      this.tabsScrollContainer.addEventListener("dragenter", (e) => {
        e.preventDefault();
      });

      this.tabsScrollContainer.addEventListener("dragleave", (e) => {
        // Скрываем индикатор, только если мышь покидает контейнер вкладок
        const relatedTarget = e.relatedTarget;
        if (!this.tabsScrollContainer.contains(relatedTarget)) {
          this.hideDropIndicator();
        }
      });

      this.tabsScrollContainer.addEventListener("drop", (e) => {
        e.preventDefault();

        const draggedTabId = e.dataTransfer.getData("text/plain");
        const draggedTab = this.tabsScrollContainer.querySelector(
          `.tab[data-tab="${draggedTabId}"]`
        );

        if (!draggedTab) return;

        const dropPosition = this.getDropPosition(e);
        if (!dropPosition) return;

        // Перемещаем вкладку в новую позицию
        if (dropPosition.target && dropPosition.beforeTarget) {
          this.tabsScrollContainer.insertBefore(
            draggedTab,
            dropPosition.target
          );
        } else {
          this.tabsScrollContainer.appendChild(draggedTab);
        }

        // Скрываем индикатор места вставки
        this.hideDropIndicator();
      });
    }

    // Метод для обновления позиции индикатора вставки
    updateDropIndicatorPosition(e) {
      const dropPosition = this.getDropPosition(e);

      if (!dropPosition) {
        this.hideDropIndicator();
        return;
      }

      const { target, beforeTarget } = dropPosition;

      if (target) {
        const rect = target.getBoundingClientRect();

        if (beforeTarget) {
          // Показываем индикатор слева от целевой вкладки
          this.dropIndicator.style.left = `${
            rect.left - this.tabsScrollContainer.getBoundingClientRect().left
          }px`;
        } else {
          // Показываем индикатор справа от целевой вкладки
          this.dropIndicator.style.left = `${
            rect.right - this.tabsScrollContainer.getBoundingClientRect().left
          }px`;
        }

        this.dropIndicator.style.display = "block";
      } else {
        this.hideDropIndicator();
      }
    }

    // Метод для определения позиции вставки
    getDropPosition(e) {
      // Получаем элемент под курсором
      const targetElement = e.target.closest(".tab");

      // Если курсор не над вкладкой или над перетаскиваемой вкладкой, возвращаем null
      if (!targetElement || targetElement.classList.contains("dragging")) {
        return null;
      }

      // Игнорируем, если это кнопка и не вкладка
      if (targetElement.closest(".tabs-buttons")) {
        return null;
      }

      const rect = targetElement.getBoundingClientRect();
      const mouseX = e.clientX;

      // Определяем, должна ли вкладка быть вставлена перед или после целевой вкладки
      const beforeMiddle = mouseX < rect.left + rect.width / 2;

      return {
        target: targetElement,
        beforeTarget: beforeMiddle,
      };
    }

    // Метод для скрытия индикатора вставки
    hideDropIndicator() {
      if (this.dropIndicator) {
        this.dropIndicator.style.display = "none";
      }
    }

    // --------------- [BASKET MANAGEMENT METHODS] ---------------
    setActiveCart(cartId) {
      if (!cartId) return;
      this.activeCartId = cartId;
      console.log("Активная корзина установлена:", cartId);
      this.updateActiveCartIcons();
    }

    renameCart(cartId, newTitle) {
      let tab = this.tabsScrollContainer.querySelector(".tab.active");
      if (!tab) {
        tab = Array.from(this.tabsScrollContainer.children).find(
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
      const activeTab = this.tabsScrollContainer.querySelector(".tab.active");
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
      const otherTabs = Array.from(this.tabsScrollContainer.children).filter(
        (el) => !el.classList.contains("active")
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
      const existingTab = Array.from(this.tabsScrollContainer.children).find(
        (child) => child.dataset.name === title
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
        const existingTab = Array.from(this.tabsScrollContainer.children).find(
          (child) => child.dataset.name === title
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
      tab.setAttribute("draggable", "true"); // Делаем таб перетаскиваемым
      tab.innerHTML = `
        <span class="tab-title">${title}</span>
        <button class="close-tab" title="Закрыть вкладку">&times;</button>
      `;
      this.tabsScrollContainer.appendChild(tab);
      this.tabNames.add(title);
      if (isCart) {
        this.activeCartNames[tabId] = title;
        this.notifyCartUpdate();
      }

      const titleElement = tab.querySelector(".tab-title");
      if (isCart) {
        // Создаем отдельный элемент для редактирования вместо contenteditable
        const editButton = document.createElement("span");
        editButton.classList.add("tab-edit-button");
        editButton.innerHTML = "✎";
        editButton.style.cssText = `
          margin-left: 4px;
          cursor: pointer;
          opacity: 0.5;
          font-size: 10px;
        `;

        tab.appendChild(editButton);

        // Редактирование только при клике на кнопку редактирования
        editButton.addEventListener("click", (e) => {
          e.stopPropagation();
          titleElement.setAttribute("contenteditable", "true");
          // При редактировании отключаем перетаскивание
          tab.setAttribute("draggable", "false");
          titleElement.focus();

          // Выделяем весь текст
          const range = document.createRange();
          range.selectNodeContents(titleElement);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        });

        titleElement.addEventListener("blur", () => {
          titleElement.setAttribute("contenteditable", "false");
          // Возвращаем возможность перетаскивания
          tab.setAttribute("draggable", "true");
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

        // Обработка клавиши Enter для завершения редактирования
        titleElement.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            titleElement.blur();
          }
        });
      }

      // Добавляем обработчики перетаскивания
      this.initTabDragAndDrop(tab);

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
        // Для мобильной версии отключаем горизонтальную прокрутку на уровне хоста shadow root.
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
      // Обновляем индикаторы скролла после добавления новой вкладки
      this.updateScrollIndicators();
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
      this.tabsScrollContainer.querySelectorAll(".tab").forEach((t) => {
        t.classList.remove("active");
        const titleEl = t.querySelector(".tab-title");
        if (titleEl) {
          titleEl.setAttribute("contenteditable", "false");
        }
      });
      this.tabContent.querySelectorAll(".content").forEach((c) => {
        c.style.display = "none";
      });
      const activeTab = this.tabsScrollContainer.querySelector(
        `.tab[data-tab="${tabId}"]`
      );
      const activeContent = this.tabContent.querySelector(
        `.content[data-content="${tabId}"]`
      );
      if (activeTab && activeContent) {
        activeTab.classList.add("active");
        activeContent.style.display = "block";

        this.currentActiveTab = tabId;
        this.tabShadowRoots[tabId] = activeContent.shadowRoot;
        // Обновляем высоту активного содержимого и пересчитываем её после рендера
        this.updatePageHeight();
        requestAnimationFrame(() => {
          this.updatePageHeight();
        });
        console.log(`Вкладка "${activeTab.dataset.name}" активирована.`);

        // Прокручиваем вкладку в область видимости, если она не полностью видна
        const tabRect = activeTab.getBoundingClientRect();
        const containerRect = this.tabsScrollContainer.getBoundingClientRect();

        if (tabRect.left < containerRect.left) {
          // Если вкладка слева за пределами видимости
          this.tabsScrollContainer.scrollLeft +=
            tabRect.left - containerRect.left - 10;
        } else if (tabRect.right > containerRect.right) {
          // Если вкладка справа за пределами видимости
          this.tabsScrollContainer.scrollLeft +=
            tabRect.right - containerRect.right + 10;
        }

        // Обновляем индикаторы скролла после активации вкладки
        this.updateScrollIndicators();
      } else {
        console.warn(`Не удалось найти вкладку или содержимое с ID: ${tabId}`);
      }
    }

    closeTab(tabId) {
      const tabEl = this.tabsScrollContainer.querySelector(
        `.tab[data-tab="${tabId}"]`
      );
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
          const remainingTabs =
            this.tabsScrollContainer.querySelectorAll(".tab");
          if (remainingTabs.length > 0) {
            const lastTabId =
              remainingTabs[remainingTabs.length - 1].getAttribute("data-tab");
            this.activateTab(lastTabId);
          }
        }
        this.updateTabsVisibility();
        this.updateCreateCartButtonVisibility();
        this.updatePageHeight();
        const openTabs = this.tabsScrollContainer.querySelectorAll(".tab");
        const isOnlyMain =
          openTabs.length === 1 && openTabs[0].dataset.name === "Главная";
        if (openTabs.length === 0 || isOnlyMain) {
          this.openPageAsTab("Главная", "/pages/index.html");
        }

        // Обновляем индикаторы скролла после удаления вкладки
        this.updateScrollIndicators();
      }
    }

    updateTabsVisibility() {
      const openTabs = this.tabsScrollContainer.querySelectorAll(".tab");
      if (openTabs.length === 1 && openTabs[0].dataset.name === "Главная") {
        this.tabs.classList.add("collapsed");
      } else {
        this.tabs.classList.remove("collapsed");
      }
    }

    updateCreateCartButtonVisibility() {
      this.createCartButton.style.display = "block";
    }

    updatePageHeight() {
      if (window.innerWidth <= 800) {
        const topPanel = document.querySelector(".top-panel");
        const bottomBar = document.querySelector(".bottom-bar");
        const topPanelHeight = topPanel ? topPanel.offsetHeight : 0;
        const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 0;
        const activeContentDiv =
          this.tabContent.querySelector(
            `.content[data-content="${this.currentActiveTab}"]`
          ) ||
          Array.from(this.tabContent.children).find(
            (div) => div.style.display === "block"
          );
        if (activeContentDiv) {
          if (this.tabs.classList.contains("collapsed")) {
            // Если вкладок нет, устанавливаем marginTop равным высоте шапки.
            activeContentDiv.style.marginTop = topPanelHeight + "px";
            const availableHeight =
              window.innerHeight - topPanelHeight - bottomBarHeight;
            activeContentDiv.style.height = availableHeight + "px";
          } else {
            // Если вкладки присутствуют, обнуляем margin и рассчитываем высоту по реальной позиции.
            activeContentDiv.style.marginTop = "0px";
            const rect = activeContentDiv.getBoundingClientRect();
            const availableHeight =
              window.innerHeight - rect.top - bottomBarHeight;
            activeContentDiv.style.height = availableHeight + "px";
          }
          activeContentDiv.style.overflowY = "auto";
        }
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
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    }
  }

  // Экспорт глобального таб-менеджера
  global.GComm_TabManager = new GComm_TabManager();
})(window);
