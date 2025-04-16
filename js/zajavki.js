/**
 * zajavki.js - Комбинированный скрипт для инициализации таблицы заявок и отображения деталей заказа
 *
 * @version 3.2.0
 */

window.initZajavkiTable = function (root = document) {
  // =====================================================================
  // КОНСТАНТЫ И ОСНОВНЫЕ ПЕРЕМЕННЫЕ
  // =====================================================================
  const isMobile = window.innerWidth <= 800;

  // Настройки статусов
  const statusMappings = {
    Создан: { iconClass: "ri-file-line", color: "#53a4d7", priority: 1 },
    Проверен: { iconClass: "ri-checkbox-line", color: "#53a4d7", priority: 2 },
    Упакован: { iconClass: "ri-box-3-line", color: "#ffc525", priority: 3 },
    "В пути": { iconClass: "ri-truck-line", color: "#ffc525", priority: 4 },
    Доставлен: { iconClass: "ri-map-pin-line", color: "#ffc525", priority: 5 },
    Подтвержден: { iconClass: "ri-check-line", color: "#4ac374", priority: 6 },
    Отменен: { iconClass: "ri-close-line", color: "#ff4c4c", priority: 7 },
    default: { iconClass: "ri-question-line", color: "#cccccc", priority: 8 },
  };

  // DOM-элементы
  const elements = {
    table: root.querySelector("#zajavki-table"),
    tableHeader: root.querySelector("#table-header"),
    tableBody: root.querySelector("#table-body"),
    contentSection: root.querySelector(".content"),
    expandSearchButton: root.querySelector(".expand-search"),
    searchFilters: root.querySelector("#search-filters-unique"),
    columnSelector: root.querySelector("#column-selector"),
    dropdown: root.querySelector(".dropdown"),
    blurOverlay: root.querySelector("#blur-overlay"),
    modalContainer: root.querySelector("#order-modal-container"),
    searchButton: root.querySelector(".search-header-button-unique"),
    zkzSwitchButton: root.querySelector(".zkz-switch"),
  };

  // Добавление/инициализация размытия, если его нет
  if (!elements.blurOverlay) {
    elements.blurOverlay = document.createElement("div");
    elements.blurOverlay.id = "blur-overlay";
    elements.blurOverlay.style.position = "fixed";
    elements.blurOverlay.style.top = "0";
    elements.blurOverlay.style.left = "0";
    elements.blurOverlay.style.right = "0";
    elements.blurOverlay.style.bottom = "0";
    elements.blurOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    elements.blurOverlay.style.backdropFilter = "blur(10px)";
    elements.blurOverlay.style.WebkitBackdropFilter = "blur(10px)";
    elements.blurOverlay.style.zIndex = "999";
    elements.blurOverlay.style.display = "none";
    elements.blurOverlay.addEventListener("click", closeAllModals);
    document.body.appendChild(elements.blurOverlay);
  }

  // Конфигурация колонок
  const allColumns = [
    "Доставка",
    "Заказ",
    "Дата доставки",
    "Статус",
    "Клиент",
    "Склад",
    "Сумма",
    "Вал.",
    "Представитель",
    "Фирма",
    "Автор",
    "Сотрудник",
  ];

  const mobileImportantColumns = [
    "Заказ",
    "Дата доставки",
    "Статус",
    "Клиент",
    "Сумма",
    "Представитель",
  ];

  // Список видимых колонок
  let userVisibleColumns = isMobile ? mobileImportantColumns : [...allColumns];

  // Данные и состояние
  let data = [];
  let originalData = [];
  let isOrdersMode = false;
  const sortState = {};

  // Отслеживание открытых модальных окон
  let openModals = [];

  // Функция закрытия всех модальных окон
  function closeAllModals() {
    if (elements.modalContainer) {
      elements.modalContainer.style.display = "none";
    }

    const secondaryModal = root.querySelector(".secondary-modal");
    if (secondaryModal) {
      secondaryModal.style.display = "none";
    }

    // Скрываем оверлей размытия
    if (elements.blurOverlay) {
      elements.blurOverlay.style.display = "none";
    }

    // Восстанавливаем прокрутку основной страницы
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    // Очищаем список открытых модальных окон
    openModals = [];
  }

  // Градация статусов для режима "Показать по заказам"
  const statusPriority = Object.keys(statusMappings).reduce((acc, key) => {
    acc[key] = statusMappings[key].priority;
    return acc;
  }, {});

  // Мобильные элементы
  let cardsContainer = null;
  if (isMobile) {
    cardsContainer = document.createElement("div");
    cardsContainer.className = "cards-container";
    elements.contentSection.appendChild(cardsContainer);

    // Кнопка сортировки для мобильной версии
    const sortButton = document.createElement("button");
    sortButton.className = "sort-button";
    sortButton.innerHTML = '<i class="ri-sort-asc"></i> Сортировать';
    elements.contentSection.insertBefore(sortButton, cardsContainer);

    // Контейнер опций сортировки
    const sortOptions = document.createElement("div");
    sortOptions.className = "sort-options";
    elements.contentSection.appendChild(sortOptions);

    sortButton.addEventListener("click", () => {
      sortOptions.classList.toggle("open");
      if (elements.blurOverlay) {
        elements.blurOverlay.style.display = sortOptions.classList.contains(
          "open"
        )
          ? "block"
          : "none";
      }
    });
  }

  // Кэш для изображений товаров
  window.imageCache = window.imageCache || {};

  // Текущая дата для расчета дат доставки
  const currentDate = new Date();

  // =====================================================================
  // ЗАГРУЗКА ДАННЫХ И ИНИЦИАЛИЗАЦИЯ
  // =====================================================================

  // Загрузка данных
  fetch("/data/zajavki.json")
    .then((response) => response.json())
    .then((jsonData) => {
      data = jsonData;
      originalData = [...jsonData];

      // Устанавливаем начальный режим
      if (elements.zkzSwitchButton) {
        isOrdersMode =
          elements.zkzSwitchButton.textContent.trim() === "Показать по заказам";
      }

      // Инициализируем интерфейс
      if (isMobile) {
        initMobileView();
      } else {
        initTable();
      }

      populateColumnSelector();
    })
    .catch((error) => {
      console.error("Ошибка при загрузке данных JSON:", error);
    });

  // =====================================================================
  // ФУНКЦИИ ДЛЯ МОБИЛЬНОГО ПРЕДСТАВЛЕНИЯ
  // =====================================================================

  // Инициализация мобильного представления
  function initMobileView() {
    if (!cardsContainer) return;
    cardsContainer.innerHTML = "";

    data.forEach((row, index) => {
      const card = createCardFromRow(row, index);
      cardsContainer.appendChild(card);
    });

    populateSortOptions();
  }

  // Создание карточки из строки данных
  function createCardFromRow(row, index) {
    const card = document.createElement("div");
    card.className = "order-card";

    // Заголовок карточки
    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("div");
    title.className = "card-title card-clickable";
    const orderNumber =
      row["Заказ"] || row["Доставка"] || `Запись ${index + 1}`;
    title.textContent = orderNumber;
    title.addEventListener("click", () => openOrderDetails(orderNumber));

    header.appendChild(title);
    card.appendChild(header);

    // Содержимое карточки
    const content = document.createElement("div");
    content.className = "card-content";

    userVisibleColumns.forEach((col) => {
      if (col !== "Заказ" && col !== "Статус") {
        const label = document.createElement("div");
        label.className = "card-label";
        label.textContent = getDisplayColumnName(col);

        const value = document.createElement("div");
        value.className = "card-value";

        if (col === "Дата доставки") {
          const dateValue = row["Дата доставки"] || "";
          value.textContent = isOrdersMode
            ? dateValue
            : dateValue.split(",")[0].trim();
        } else if (["Доставка"].includes(col)) {
          value.textContent = row[col];
          value.classList.add("card-clickable");
          value.addEventListener("click", () => openOrderDetails(row[col]));
        } else {
          value.textContent = row[col] || "-";
        }

        content.appendChild(label);
        content.appendChild(value);
      }
    });

    card.appendChild(content);

    // Секция статуса
    const statusSection = document.createElement("div");
    statusSection.className = "card-status";

    const statusText = row["Статус"].trim();
    const iconInfo = statusMappings[statusText] || statusMappings["default"];

    const icon = document.createElement("i");
    icon.className = `${iconInfo.iconClass} status-icon`;
    icon.style.backgroundColor = iconInfo.color;

    const statusTextElement = document.createElement("div");
    statusTextElement.className = "status-text";
    statusTextElement.textContent = statusText;

    statusSection.appendChild(icon);
    statusSection.appendChild(statusTextElement);

    card.appendChild(statusSection);

    return card;
  }

  // Заполнение опций сортировки
  function populateSortOptions() {
    const sortOptionsContainer = root.querySelector(".sort-options");
    if (!sortOptionsContainer) return;

    sortOptionsContainer.innerHTML = "";

    userVisibleColumns.forEach((col) => {
      // Опция для сортировки по возрастанию
      const ascOption = document.createElement("div");
      ascOption.className = "sort-option";
      ascOption.textContent = `${getDisplayColumnName(col)} (по возрастанию)`;
      ascOption.addEventListener("click", () => {
        sortMobileView(col, "asc");
        sortOptionsContainer.classList.remove("open");
        if (elements.blurOverlay) {
          elements.blurOverlay.style.display = "none";
        }
      });

      // Опция для сортировки по убыванию
      const descOption = document.createElement("div");
      descOption.className = "sort-option";
      descOption.textContent = `${getDisplayColumnName(col)} (по убыванию)`;
      descOption.addEventListener("click", () => {
        sortMobileView(col, "desc");
        sortOptionsContainer.classList.remove("open");
        if (elements.blurOverlay) {
          elements.blurOverlay.style.display = "none";
        }
      });

      sortOptionsContainer.appendChild(ascOption);
      sortOptionsContainer.appendChild(descOption);
    });
  }

  // Сортировка мобильного представления
  function sortMobileView(column, order) {
    sortState[column] = order;

    data.sort((a, b) => {
      const numA = parseFloat(a[column].replace(/[^\d.-]/g, ""));
      const numB = parseFloat(b[column].replace(/[^\d.-]/g, ""));
      if (!isNaN(numA) && !isNaN(numB)) {
        return order === "asc" ? numA - numB : numB - numA;
      }
      return order === "asc"
        ? a[column].localeCompare(b[column], undefined, { sensitivity: "base" })
        : b[column].localeCompare(a[column], undefined, {
            sensitivity: "base",
          });
    });

    initMobileView();
  }

  // =====================================================================
  // ФУНКЦИИ ДЛЯ ТАБЛИЧНОГО ПРЕДСТАВЛЕНИЯ
  // =====================================================================

  // Инициализация таблицы
  function initTable() {
    if (!elements.tableHeader) {
      console.warn("Элемент с id 'table-header' не найден");
      return;
    }

    elements.tableHeader.innerHTML = "";

    // Нумерация строк
    const thNumber = root.ownerDocument.createElement("th");
    thNumber.textContent = "№";
    elements.tableHeader.appendChild(thNumber);

    // Заголовки колонок
    userVisibleColumns.forEach((col) => {
      const th = root.ownerDocument.createElement("th");
      th.classList.add("sortable");

      const displayCol = getDisplayColumnName(col);
      th.innerHTML = `${displayCol}<span class="sort-arrow">&#9660;</span>`;
      th.addEventListener("click", () => sortTable(col, th));
      elements.tableHeader.appendChild(th);
    });

    populateTableBody();
  }

  // Функция для получения отображаемого названия колонки
  function getDisplayColumnName(column) {
    if (column === "Сумма") {
      return isOrdersMode ? "Сумма общ." : "Сумма";
    }

    if (column === "Дата доставки") {
      return isOrdersMode ? "Дата оформления" : "Дата доставки";
    }

    return column;
  }

  // Заполнение данных таблицы
  function populateTableBody() {
    if (!elements.tableBody) {
      console.warn("Элемент с id 'table-body' не найден");
      return;
    }

    elements.tableBody.innerHTML = "";
    data.forEach((row, index) => {
      const tr = root.ownerDocument.createElement("tr");

      // Визуальная нумерация
      const tdNumber = root.ownerDocument.createElement("td");
      tdNumber.textContent = index + 1;
      tr.appendChild(tdNumber);

      userVisibleColumns.forEach((col) => {
        const td = root.ownerDocument.createElement("td");
        if (col === "Статус") {
          // Обработка колонки "Статус" с иконкой
          const statusText = row[col].trim();
          const iconInfo =
            statusMappings[statusText] || statusMappings["default"];

          const icon = root.ownerDocument.createElement("i");
          icon.classList.add(iconInfo.iconClass, "status-icon");
          icon.style.width = "25px";
          icon.style.height = "25px";
          icon.style.display = "inline-flex";
          icon.style.alignItems = "center";
          icon.style.justifyContent = "center";
          icon.style.fontSize = "16px";
          icon.style.marginRight = "5px";
          icon.style.color = "#ffffff";
          icon.style.backgroundColor = iconInfo.color;
          icon.style.borderRadius = "50%";
          icon.style.flexShrink = "0";

          td.appendChild(icon);

          const statusSpan = root.ownerDocument.createElement("span");
          statusSpan.textContent = statusText;
          td.appendChild(statusSpan);
        } else {
          // Обработка даты
          if (col === "Дата доставки") {
            const dateValue = row["Дата доставки"] || "";
            td.textContent = isOrdersMode
              ? dateValue
              : dateValue.split(",")[0].trim();
          } else {
            td.textContent = row[col];
          }

          if (["Доставка", "Заказ", "Номер док."].includes(col)) {
            td.classList.add("clickable");
            td.addEventListener("click", () => openOrderDetails(row[col]));
          }
        }

        tr.appendChild(td);
      });
      elements.tableBody.appendChild(tr);
    });
  }

  // Заполнение выпадающего списка выбора колонок
  function populateColumnSelector() {
    if (!elements.dropdown) {
      console.warn("Элемент с классом 'dropdown' не найден");
      return;
    }

    elements.dropdown.innerHTML = "";

    allColumns.forEach((col) => {
      // В режиме "Показать по заказам" не включаем "Доставка" и "Склад"
      if (isOrdersMode && (col === "Доставка" || col === "Склад")) {
        return;
      }

      const label = root.ownerDocument.createElement("label");
      label.addEventListener("click", (e) => e.stopPropagation());

      const checkbox = root.ownerDocument.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = col;
      checkbox.checked = userVisibleColumns.includes(col);
      checkbox.id = `checkbox-${col}`;

      checkbox.addEventListener("change", (e) => {
        e.stopPropagation();

        if (e.target.checked) {
          if (!userVisibleColumns.includes(col)) {
            // Вставляем колонку в правильном порядке
            const originalIndex = allColumns.indexOf(col);
            userVisibleColumns.splice(originalIndex, 0, col);

            if (isMobile) {
              initMobileView();
              populateSortOptions();
            } else {
              initTable();
            }
          }
        } else {
          userVisibleColumns = userVisibleColumns.filter((c) => c !== col);

          if (isMobile) {
            initMobileView();
            populateSortOptions();
          } else {
            initTable();
          }
        }
      });

      const displayName = getDisplayColumnName(col);
      const labelText = root.ownerDocument.createElement("span");
      labelText.textContent = displayName;

      label.appendChild(checkbox);
      label.appendChild(labelText);
      elements.dropdown.appendChild(label);
    });
  }

  // Сортировка таблицы
  function sortTable(column, thElement) {
    let order = sortState[column] || "asc";
    order = order === "asc" ? "desc" : "asc";
    sortState[column] = order;

    data.sort((a, b) => {
      const numA = parseFloat(a[column].replace(/[^\d.-]/g, ""));
      const numB = parseFloat(b[column].replace(/[^\d.-]/g, ""));
      if (!isNaN(numA) && !isNaN(numB)) {
        return order === "asc" ? numA - numB : numB - numA;
      }
      return order === "asc"
        ? a[column].localeCompare(b[column], undefined, { sensitivity: "base" })
        : b[column].localeCompare(a[column], undefined, {
            sensitivity: "base",
          });
    });

    const allTh = elements.tableHeader.querySelectorAll("th");
    allTh.forEach((th) => {
      th.classList.remove("sorted");
      const arrow = th.querySelector(".sort-arrow");
      if (arrow) {
        arrow.classList.remove("asc", "desc");
      }
    });

    thElement.classList.add("sorted");
    const sortArrow = thElement.querySelector(".sort-arrow");
    if (sortArrow) {
      sortArrow.classList.add(order);
    }

    populateTableBody();
  }

  // =====================================================================
  // ФУНКЦИИ ДЛЯ МОДАЛЬНОГО ОКНА И ДЕТАЛЕЙ ЗАКАЗА
  // =====================================================================

  // Функция открытия модального окна с деталями заказа
  function openOrderDetails(docNumber) {
    if (!elements.modalContainer) {
      console.warn("Контейнер модального окна не найден");
      return;
    }

    // Создаем или находим контейнер для деталей заказа
    let orderDetailsContainer = root.querySelector("#order-details-container");
    if (!orderDetailsContainer) {
      orderDetailsContainer = document.createElement("div");
      orderDetailsContainer.id = "order-details-container";
      orderDetailsContainer.style.width = "100%";
      orderDetailsContainer.style.height = "100%";
      orderDetailsContainer.style.overflow = "auto";
      elements.modalContainer.appendChild(orderDetailsContainer);
    }

    // Показываем модальное окно
    elements.modalContainer.style.display = "block";
    elements.modalContainer.style.position = "fixed";
    elements.modalContainer.style.top = "50px";
    elements.modalContainer.style.left = "0";
    elements.modalContainer.style.width = "100%";

    // Устанавливаем разную высоту в зависимости от типа устройства
    if (isMobile) {
      elements.modalContainer.style.height = "calc(89vh)";
    } else {
      elements.modalContainer.style.height = "calc(94vh)";
    }

    elements.modalContainer.style.zIndex = "1000";
    elements.modalContainer.style.backgroundColor = "transparent";
    elements.modalContainer.style.padding = "0";
    elements.modalContainer.style.boxSizing = "border-box";
    elements.modalContainer.style.display = "flex";
    elements.modalContainer.style.alignItems = "flex-start";
    elements.modalContainer.style.justifyContent = "center";
    elements.modalContainer.style.overflow = "hidden";

    // Блокируем прокрутку основной страницы
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Активируем фоновый оверлей размытия
    if (elements.blurOverlay) {
      elements.blurOverlay.style.display = "block";
    }

    // Добавляем обработчик клика для закрытия модального окна
    elements.blurOverlay.addEventListener("click", closeAllModals);

    // Добавляем в список открытых модальных окон
    openModals.push(elements.modalContainer);

    // Инициализируем окно с деталями заказа
    createOrderDetailsContent(orderDetailsContainer, docNumber);
  }

  // Создаем контент для окна деталей заказа
  function createOrderDetailsContent(container, docNumber) {
    // Загружаем данные о товарах для этого заказа
    loadProductData(container, docNumber);
  }

  // Загрузка данных о товарах для заказа
  function loadProductData(container, docNumber) {
    fetch("/data/data.json")
      .then((response) => response.json())
      .then((jsonData) => {
        // Модифицируем данные для тестирования - делаем 2 товара без остатков
        if (jsonData.length >= 2) {
          jsonData[jsonData.length - 1]["Наличие"] = 0;
          jsonData[jsonData.length - 2]["Наличие"] = 0;
        }

        // Выбираем случайные товары и создаем доставки
        const orderData = createRandomOrderData(jsonData);

        // Создаем контент заказа
        renderOrderDetails(container, docNumber, orderData);
      })
      .catch((error) => {
        console.error("Ошибка загрузки данных товаров:", error);
        renderOrderDetails(container, docNumber, []); // Рендерим пустой заказ в случае ошибки
      });
  }

  // Создание случайных данных о заказе с доставками
  function createRandomOrderData(catalogData) {
    // Выбираем случайное количество товаров (70-100% от каталога)
    const totalProducts = catalogData.length;
    const minProducts = Math.ceil(totalProducts * 0.7);
    const maxProducts = totalProducts;
    const numberOfProducts =
      Math.floor(Math.random() * (maxProducts - minProducts + 1)) + minProducts;

    // Перемешиваем товары и выбираем случайное подмножество
    const shuffled = [...catalogData].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffled.slice(0, numberOfProducts);

    // Присваиваем каждому товару случайное количество и дату доставки
    selectedProducts.forEach((product) => {
      const maxQty = parseInt(product["Наличие"], 10) || 0;
      const minQty = parseInt(product["Мин. Кол."], 10) || 1;
      const randomQty = Math.floor(Math.random() * (maxQty + 1));
      product.quantity =
        randomQty >= minQty ? randomQty : maxQty > 0 ? minQty : 0;
    });

    // Разделяем товары на доставки с разными датами
    const deliveries = distributeProductsToDeliveries(selectedProducts);

    return {
      products: selectedProducts,
      deliveries: deliveries,
    };
  }

  // Распределение товаров по доставкам
  function distributeProductsToDeliveries(products) {
    // Генерируем 3 уникальные даты доставки
    const deliveryDates = getUniqueRandomDeliveryDates(30);

    // Разделяем товары с остатками от товаров без остатков
    const inStockProducts = products.filter(
      (p) => parseInt(p["Наличие"], 10) > 0
    );
    const outOfStockProducts = products.filter(
      (p) => parseInt(p["Наличие"], 10) === 0
    );

    // Создаем словарь доставок по датам
    const deliveries = {};

    // Распределяем товары с остатком по случайным датам доставки
    inStockProducts.forEach((product) => {
      const randomDate =
        deliveryDates[Math.floor(Math.random() * deliveryDates.length)];
      if (!deliveries[randomDate]) {
        deliveries[randomDate] = {
          date: randomDate,
          code: `DST-${Math.floor(1000000 + Math.random() * 9000000)}`,
          status: Math.floor(Math.random() * 7) + 1, // Случайный статус от 1 до 7
          items: [],
        };
      }

      deliveries[randomDate].items.push(product);
    });

    // Создаем специальную доставку для товаров без остатков (если они есть)
    if (outOfStockProducts.length > 0) {
      deliveries["no-stock"] = {
        date: "",
        code: `DST-${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: 0, // Особый статус для товаров без остатка
        items: outOfStockProducts,
      };
    }

    return deliveries;
  }

  // Функция для форматирования даты
  function formatDate(date) {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    if (day < 10) day = "0" + day;
    if (month < 10) month = "0" + month;

    return day + "." + month + "." + year;
  }

  // Генерация 3 уникальных случайных дат
  function getUniqueRandomDeliveryDates(maxDays) {
    const uniqueDates = new Set();
    const today = new Date();

    while (uniqueDates.size < 3) {
      const offset = Math.floor(Math.random() * maxDays) + 1; // от 1 до maxDays
      const randomDate = new Date(
        today.getTime() + offset * 24 * 60 * 60 * 1000
      );
      uniqueDates.add(formatDate(randomDate));
    }

    return Array.from(uniqueDates);
  }

  // Рендеринг деталей заказа
  function renderOrderDetails(container, docNumber, orderData) {
    // Создаем Shadow DOM для изоляции стилей
    let shadow = container.shadowRoot;
    if (!shadow) {
      shadow = container.attachShadow({ mode: "open" });
    }

    // Создаем массив доставок для отображения
    const deliveries = [];
    for (const key in orderData.deliveries) {
      if (key !== "no-stock") {
        deliveries.push(orderData.deliveries[key]);
      }
    }

    // Создаем превью для каждой доставки
    deliveries.forEach((delivery) => {
      delivery.preview = delivery.items.slice(0, 3).map((item) => ({
        code: item["Код"],
        name: item["Наименование"],
        image: item["Изображение"],
      }));
    });

    // Создаем общий массив товаров для расчета итоговой суммы
    const allProducts = deliveries.flatMap((delivery) => delivery.items);

    // Загружаем внешний CSS и создаем контент
    loadCSS(shadow, "/css/order-detail.css").then(() => {
      // Загружаем Remix icons напрямую в shadow DOM
      const iconLink = document.createElement("link");
      iconLink.rel = "stylesheet";
      iconLink.href =
        "https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css";
      shadow.appendChild(iconLink);

      // Добавляем содержимое в Shadow DOM
      shadow.innerHTML += `
        <div class="container">
            <button class="close-btn modal-close-btn" id="modal-close">
                <i class="ri-close-line"></i>
            </button>
            
            <!-- Order Header -->
            <div class="order-header">
                <div class="order-header__top">
                    <div>
                        <h1 class="order-header__title">Заказ ${docNumber} от 26.11.2024</h1>
                        <p class="order-header__date">Последнее изменение: 10.12.2024 17:45:43</p>
                    </div>
                </div>
                <div class="order-header__actions">
                    <button class="action-button">
                        <i class="ri-file-copy-line"></i>
                        Использовать заказ как шаблон
                    </button>
                    <button class="action-button">
                        <i class="ri-question-line"></i>
                        Задать вопрос по заказу
                    </button>
                    <button class="action-button">
                        <i class="ri-exchange-line"></i>
                        Оформить претензию/возврат
                    </button>
                </div>
            </div>

            <!-- Status Section -->
            <div class="status-section">
                <h2 class="section-title">Статусы доставок</h2>
                <ul class="status-list">
                    ${deliveries
                      .map((delivery) => {
                        let statusName = "Создан";
                        let statusIcon = "ri-file-line";
                        let statusColor = "#53a4d7";

                        // Определяем статус по номеру
                        switch (delivery.status) {
                          case 1:
                            statusName = "Создан";
                            statusIcon = "ri-file-line";
                            statusColor = "#53a4d7";
                            break;
                          case 2:
                            statusName = "Проверен";
                            statusIcon = "ri-checkbox-line";
                            statusColor = "#53a4d7";
                            break;
                          case 3:
                            statusName = "Упакован";
                            statusIcon = "ri-box-3-line";
                            statusColor = "#ffc525";
                            break;
                          case 4:
                            statusName = "В пути";
                            statusIcon = "ri-truck-line";
                            statusColor = "#ffc525";
                            break;
                          case 5:
                            statusName = "Доставлен";
                            statusIcon = "ri-map-pin-line";
                            statusColor = "#ffc525";
                            break;
                          case 6:
                            statusName = "Подтвержден";
                            statusIcon = "ri-check-line";
                            statusColor = "#4ac374";
                            break;
                          case 7:
                            statusName = "Отменен";
                            statusIcon = "ri-close-line";
                            statusColor = "#ff4c4c";
                            break;
                          default:
                            statusName = "Создан";
                            statusIcon = "ri-file-line";
                            statusColor = "#53a4d7";
                        }

                        return `
                      <li class="status-item">
                        <span class="status-delivery-code" data-code="${delivery.code}">${delivery.code} на ${delivery.date}</span>
                        <span class="status-badge" style="background-color: ${statusColor}">
                          <i class="${statusIcon}"></i>
                          ${statusName}
                        </span>
                      </li>
                      `;
                      })
                      .join("")}
                </ul>
            </div>

            <!-- Document Structure -->
            <div class="structure-section">
                <h2 class="section-title">Документы по заказу</h2>
                <ul class="structure-list">
                    <li>
                        Лист заявки от покупателя <strong>N01-4566639</strong> (20.11.24)<br>
                        Сумма: ${calculateTotalOrderSum(allProducts).toFixed(2)}
                        <ul>
                            <li>
                                Расходная накладная (документ) <strong>E-01762831</strong><br>
                                Сумма: ${calculateTotalOrderSum(
                                  allProducts
                                ).toFixed(2)}
                            </li>
                            <li>
                                Косметическая отгрузка <strong>EKA-093122</strong> (20.11.24)<br>
                                Сумма: ${calculateTotalOrderSum(
                                  allProducts
                                ).toFixed(2)}
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>

            <!-- Products Section -->
            <div class="products-section">
                ${deliveries
                  .map(
                    (delivery, index) => `
                    <!-- Delivery ${index + 1} -->
                    <div class="delivery-card" data-delivery-code="${
                      delivery.code
                    }">
                        <div class="delivery-card__header">
                            <div class="delivery-header-content">
                                <div class="delivery-card__title">
                                    <i class="ri-truck-line"></i>
                                    ${delivery.code} на ${delivery.date}
                                </div>
                                <div class="delivery-preview">
                                    ${delivery.preview
                                      .map(
                                        (item) => `
                                        <div class="preview-thumbnail" data-code="${item.code}">
                                            <img src="${item.image}" alt="${item.name}">
                                        </div>
                                    `
                                      )
                                      .join("")}
                                    <div class="show-all-btn" data-delivery-code="${
                                      delivery.code
                                    }">
                                        <i class="ri-apps-line"></i>
                                        Показать все (${delivery.items.length})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>

        <!-- Secondary Modal for All Products -->
        <div class="secondary-modal" id="all-products-modal">
            <div class="secondary-modal__header">
                <div class="secondary-modal__title">Все товары доставки</div>
                <button class="close-btn secondary-close-btn" id="secondary-modal-close">
                    <i class="ri-close-line"></i>
                </button>
            </div>
            <div class="secondary-modal__content" id="all-products-container">
                <!-- Will be populated dynamically -->
            </div>
        </div>
      `;

      // Добавляем обработчики событий после создания DOM
      setTimeout(() => {
        initOrderDetailEvents(shadow, deliveries);
      }, 0);
    });
  }

  // Функция для загрузки внешнего CSS
  function loadCSS(shadowRoot, cssPath) {
    return new Promise((resolve, reject) => {
      fetch(cssPath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Не удалось загрузить CSS: ${response.statusText}`);
          }
          return response.text();
        })
        .then((cssText) => {
          const style = document.createElement("style");
          style.textContent = cssText;
          shadowRoot.appendChild(style);
          resolve();
        })
        .catch((error) => {
          console.error("Ошибка загрузки CSS:", error);

          // Создаем резервный стиль в случае ошибки загрузки
          const backupStyle = document.createElement("style");
          backupStyle.textContent = `
            /* Базовые стили */
            :host { display: block; width: 100%; height: 100%; overflow: hidden; font-family: sans-serif; }
            .container { background: white; padding: 20px; max-height: calc(100vh - 70px); overflow-y: auto; }
            /* Предупреждение о проблеме с CSS */
            .container::before { content: "Внимание: CSS не загружен. Используются базовые стили."; display: block; background: #ffecb3; padding: 10px; margin-bottom: 15px; }
          `;
          shadowRoot.appendChild(backupStyle);
          resolve(); // Продолжаем, несмотря на ошибку
        });
    });
  }

  // Инициализация обработчиков событий для деталей заказа
  function initOrderDetailEvents(shadow, deliveries) {
    // Основные элементы управления
    const deliveryHeaders = shadow.querySelectorAll(".delivery-card__header");
    const deliveryCodes = shadow.querySelectorAll(".status-delivery-code");
    const previewThumbnails = shadow.querySelectorAll(".preview-thumbnail");
    const showAllButtons = shadow.querySelectorAll(".show-all-btn");
    const secondaryModal = shadow.querySelector(".secondary-modal");
    const allProductsContainer = shadow.querySelector(
      "#all-products-container"
    );

    // Добавляем обработчики для кнопок закрытия
    const modalCloseBtn = shadow.querySelector("#modal-close");
    const secondaryCloseBtn = shadow.querySelector("#secondary-modal-close");

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", closeAllModals);
    }

    if (secondaryCloseBtn) {
      secondaryCloseBtn.addEventListener("click", () => {
        if (secondaryModal) {
          secondaryModal.style.display = "none";

          // Если нет других открытых модальных окон, скрываем оверлей размытия
          openModals = openModals.filter((modal) => modal !== secondaryModal);
          if (openModals.length === 0 && elements.blurOverlay) {
            elements.blurOverlay.style.display = "none";
          }

          // Восстанавливаем прокрутку, если нет других открытых окон
          if (openModals.length === 0) {
            document.body.style.overflow = "auto";
            document.documentElement.style.overflow = "auto";
          }
        }
      });
    }

    // Навигация к доставке при клике на код доставки
    deliveryCodes.forEach((code) => {
      code.addEventListener("click", () => {
        const deliveryCode = code.getAttribute("data-code");
        const deliveryCard = shadow.querySelector(
          `.delivery-card[data-delivery-code="${deliveryCode}"]`
        );

        if (deliveryCard) {
          // Прокручиваем к доставке
          deliveryCard.scrollIntoView({ behavior: "smooth" });

          // Подсвечиваем доставку
          deliveryCard.style.boxShadow = "0 0 0 2px var(--secondary-color)";
          setTimeout(() => {
            deliveryCard.style.boxShadow = "";
          }, 2000);
        }
      });
    });

    // Обработка превью миниатюр
    previewThumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", (e) => {
        e.stopPropagation();
        const productCode = thumbnail.getAttribute("data-code");
        const deliveryCard = thumbnail.closest(".delivery-card");
        const deliveryCode = deliveryCard.getAttribute("data-delivery-code");
        const delivery = deliveries.find((d) => d.code === deliveryCode);

        // Находим товар и показываем его в модальном окне
        if (delivery) {
          showDeliveryProducts(delivery, productCode);
        }
      });
    });

    // Обработчик для кнопок "Показать все"
    showAllButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const deliveryCode = button.getAttribute("data-delivery-code");
        const delivery = deliveries.find((d) => d.code === deliveryCode);

        if (delivery) {
          showDeliveryProducts(delivery);
        }
      });
    });

    // Обработчик клика вне модального окна для закрытия
    shadow.addEventListener("click", (e) => {
      if (e.target === shadow) {
        closeAllModals();
      }
    });

    // Функция отображения товаров доставки в модальном окне
    function showDeliveryProducts(delivery, highlightProductCode = null) {
      if (!secondaryModal || !allProductsContainer) return;

      // Заполняем модальное окно товарами
      allProductsContainer.innerHTML = `
        <div class="select-all-container">
          <label class="checkbox-container">
            <input type="checkbox" id="select-all-checkbox">
            <span class="checkbox-label">Выбрать все</span>
          </label>
        </div>
        <div class="product-list">
          ${delivery.items
            .map(
              (item) => `
            <div class="product-list-item ${
              highlightProductCode === item["Код"] ? "highlight" : ""
            }" data-product-code="${item["Код"]}">
              <div class="product-list-item__checkbox">
                <label class="checkbox-container">
                  <input type="checkbox" class="item-checkbox">
                  <span class="checkmark"></span>
                </label>
              </div>
              <div class="product-list-item__image">
                <img src="${item["Изображение"]}" alt="${item["Наименование"]}">
              </div>
              <div class="product-list-item__content">
                <div class="product-list-item__code">Код: ${item["Код"]}</div>
                <div class="product-list-item__name">${
                  item["Наименование"]
                }</div>
                <div class="product-list-item__price">${item["Цена"]} ₽</div>
                <div class="product-list-item__actions">
                  <span>Кол-во: <strong>${item.quantity}</strong></span>
                  <span>В наличии: ${item["Наличие"]}</span>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="product-list-footer">
          <div class="product-list-sum">Сумма: ${calculateDeliverySum(
            delivery.items
          ).toFixed(2)} ₽</div>
          <div class="product-list-actions">
            <button class="btn btn-secondary">
              <i class="ri-file-excel-2-line"></i>
              Скачать Excel
            </button>
            <button class="btn btn-primary">
              <i class="ri-shopping-cart-line"></i>
              Оформить отдельно
            </button>
          </div>
        </div>
      `;

      // Обновляем заголовок
      const modalTitle = secondaryModal.querySelector(
        ".secondary-modal__title"
      );
      if (modalTitle) {
        modalTitle.textContent = `Все товары доставки ${delivery.code}`;
      }

      // Если указан код товара для подсветки, прокручиваем к нему
      if (highlightProductCode) {
        setTimeout(() => {
          const highlightedItem = allProductsContainer.querySelector(
            `.product-list-item[data-product-code="${highlightProductCode}"]`
          );
          if (highlightedItem) {
            highlightedItem.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            highlightedItem.style.boxShadow =
              "0 0 0 2px var(--secondary-color)";
            setTimeout(() => {
              highlightedItem.style.boxShadow = "";
            }, 2000);
          }
        }, 100);
      }

      // Открываем модальное окно
      secondaryModal.style.display = "flex";

      // Добавляем в список открытых модальных окон
      openModals.push(secondaryModal);

      // Настраиваем обработчик выбора всех товаров
      const selectAllCheckbox = allProductsContainer.querySelector(
        "#select-all-checkbox"
      );
      const itemCheckboxes =
        allProductsContainer.querySelectorAll(".item-checkbox");

      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", () => {
          const isChecked = selectAllCheckbox.checked;
          itemCheckboxes.forEach((checkbox) => {
            checkbox.checked = isChecked;
          });
        });
      }

      // Добавляем обработчик для обновления "выбрать все" при изменении отдельных чекбоксов
      itemCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          const allChecked = Array.from(itemCheckboxes).every(
            (cb) => cb.checked
          );
          const anyChecked = Array.from(itemCheckboxes).some(
            (cb) => cb.checked
          );

          if (selectAllCheckbox) {
            selectAllCheckbox.checked = allChecked;
            // Здесь можно добавить состояние "indeterminate" если нужно
            selectAllCheckbox.indeterminate = anyChecked && !allChecked;
          }
        });
      });
    }
  }

  // =====================================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // =====================================================================

  // Расчет суммы доставки
  function calculateDeliverySum(items) {
    return items.reduce((sum, item) => {
      const price = parseFloat(item["Цена"]) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      return sum + price * quantity;
    }, 0);
  }

  // Расчет общей суммы заказа
  function calculateTotalOrderSum(items) {
    return items.reduce((sum, item) => {
      const price = parseFloat(item["Цена"]) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      return sum + price * quantity;
    }, 0);
  }

  // Функция загрузки изображений товаров
  async function loadProductImages(article, maxImages = 5) {
    if (window.imageCache && window.imageCache[article]) {
      return window.imageCache[article];
    }

    const imagePaths = [];
    for (let i = 0; i < maxImages; i++) {
      const imageName = i === 0 ? `${article}.jpg` : `${article}_${i}.jpg`;
      imagePaths.push(`images/jpg/Product/${imageName}`);
    }

    const loadPromises = imagePaths.map(async (src) => {
      try {
        const response = await fetch(src, { method: "HEAD" });
        return response.ok ? src : null;
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(loadPromises);
    const validImages = results.filter((src) => src !== null);

    window.imageCache = window.imageCache || {};
    window.imageCache[article] = validImages;

    return validImages;
  }

  // Парсинг строки даты в формате "ДД.MM.ГГГГ" в объект Date
  function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split(".");
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  // Получение уникальных заказов с наименьшим статусом
  function getUniqueOrdersWithLowestStatus(dataArray) {
    const orderMap = {};

    dataArray.forEach((item) => {
      const order = item["Заказ"];
      const status = item["Статус"];
      const priority = statusPriority[status] || statusPriority["default"];

      if (!orderMap[order] || priority < orderMap[order].priority) {
        orderMap[order] = { ...item, priority };
      }
    });

    return Object.values(orderMap);
  }

  // =====================================================================
  // ОБРАБОТЧИКИ СОБЫТИЙ ИНТЕРФЕЙСА
  // =====================================================================

  // Открытие/закрытие меню выбора колонок
  if (elements.columnSelector && elements.dropdown) {
    elements.columnSelector.addEventListener("click", (e) => {
      e.stopPropagation();
      elements.dropdown.classList.toggle("open");
      if (elements.blurOverlay) {
        elements.blurOverlay.style.display =
          elements.dropdown.classList.contains("open") ? "block" : "none";
      }
    });

    // Закрытие меню при клике вне области
    root.ownerDocument.addEventListener("click", (event) => {
      if (!event.target.closest(".filters")) {
        elements.dropdown.classList.remove("open");

        // Если нет других открытых модальных окон, скрываем оверлей размытия
        if (elements.blurOverlay && openModals.length === 0) {
          elements.blurOverlay.style.display = "none";
        }
      }

      // Закрытие сортировки при клике вне области (только для мобильных)
      if (isMobile) {
        const sortOptions = root.querySelector(".sort-options");
        if (sortOptions && !event.target.closest(".sort-button")) {
          sortOptions.classList.remove("open");

          // Если нет других открытых модальных окон, скрываем оверлей размытия
          if (
            elements.blurOverlay &&
            openModals.length === 0 &&
            !elements.dropdown.classList.contains("open")
          ) {
            elements.blurOverlay.style.display = "none";
          }
        }
      }
    });

    // Остановить распространение события при клике внутри выпадающего меню
    elements.dropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Расширенный поиск
  if (elements.expandSearchButton && elements.searchFilters) {
    elements.expandSearchButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = elements.searchFilters.hasAttribute("hidden");
      if (isHidden) {
        elements.searchFilters.removeAttribute("hidden");
        elements.expandSearchButton.setAttribute("aria-expanded", "true");
      } else {
        elements.searchFilters.setAttribute("hidden", "");
        elements.expandSearchButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Применение расширенного поиска
  if (elements.searchButton) {
    elements.searchButton.addEventListener("click", () => {
      const criteria = [];

      // Получаем значения из первого фильтра
      const filter1Column = root.querySelector("#filter1-select1")?.value;
      const filter1Condition = root.querySelector("#filter1-select2")?.value;
      const filter1Value = root.querySelector("#filter1-input")?.value || "";

      if (filter1Value && filter1Column && filter1Condition) {
        criteria.push({
          column: filter1Column,
          condition: filter1Condition,
          value: filter1Value,
        });
      }

      // Получаем значения из второго фильтра
      const filter2Column = root.querySelector("#filter2-select1")?.value;
      const filter2Condition = root.querySelector("#filter2-select2")?.value;
      const filter2Value = root.querySelector("#filter2-input")?.value || "";

      if (filter2Value && filter2Column && filter2Condition) {
        criteria.push({
          column: filter2Column,
          condition: filter2Condition,
          value: filter2Value,
        });
      }

      // Получаем значения даты
      const dateStart = root.querySelector("#filter-date-start")?.value;
      const dateEnd = root.querySelector("#filter-date-end")?.value;

      if (dateStart || dateEnd) {
        criteria.push({
          column: "Дата",
          condition: "dateRange",
          startDate: dateStart,
          endDate: dateEnd,
        });
      }

      // Обработка чекбоксов
      const excludeConfirmed =
        root.querySelector("#filters-confirmed")?.checked || false;
      const excludeDeletion =
        root.querySelector("#filters-deletion")?.checked || false;

      if (excludeConfirmed) {
        criteria.push({
          column: "Статус",
          condition: "notEqual",
          value: "Подтверждено клиентом",
        });
      }

      if (excludeDeletion) {
        criteria.push({
          column: "Статус",
          condition: "notEqual",
          value: "На удаление",
        });
      }

      applyAdvancedSortingAndFiltering(criteria);
    });
  }

  // Функция применения фильтров
  function applyAdvancedSortingAndFiltering(criteria) {
    data = [...originalData];

    criteria.forEach((criterion) => {
      data = data.filter((item) => {
        const itemValue = item[criterion.column];

        switch (criterion.condition) {
          case "содержит":
            return itemValue.includes(criterion.value);
          case "равно":
            return itemValue === criterion.value;
          case "больше":
            return parseFloat(itemValue) > parseFloat(criterion.value);
          case "меньше":
            return parseFloat(itemValue) < parseFloat(criterion.value);
          case "dateRange":
            const itemDate = new Date(itemValue);
            const startDate = criterion.startDate
              ? new Date(criterion.startDate)
              : null;
            const endDate = criterion.endDate
              ? new Date(criterion.endDate)
              : null;
            if (startDate && endDate) {
              return itemDate >= startDate && itemDate <= endDate;
            } else if (startDate) {
              return itemDate >= startDate;
            } else if (endDate) {
              return itemDate <= endDate;
            } else {
              return true;
            }
          case "notEqual":
            return itemValue !== criterion.value;
          default:
            return true;
        }
      });
    });

    if (isMobile) {
      initMobileView();
    } else {
      populateTableBody();
    }
  }

  // Функция переключения режима отображения
  function toggleDisplayMode() {
    if (isOrdersMode) {
      // Переключение в режим "Показать по заказам"
      const uniqueOrders = getUniqueOrdersWithLowestStatus(originalData);
      data = uniqueOrders;

      // Удаляем "Доставка" и "Склад" из userVisibleColumns
      ["Доставка", "Склад"].forEach((col) => {
        const index = userVisibleColumns.indexOf(col);
        if (index !== -1) {
          userVisibleColumns.splice(index, 1);
        }
      });
    } else {
      // Возврат к режиму "Показать по доставкам"
      data = [...originalData];

      // Восстанавливаем "Доставка" и "Склад" в userVisibleColumns
      ["Доставка", "Склад"].forEach((col) => {
        if (!userVisibleColumns.includes(col)) {
          const originalIndex = allColumns.indexOf(col);
          userVisibleColumns.splice(originalIndex, 0, col);
        }
      });
    }

    // Обновляем интерфейс
    if (isMobile) {
      initMobileView();
      populateSortOptions();
    } else {
      initTable();
    }
    populateColumnSelector();
  }

  // Назначение обработчика переключения режима
  if (elements.zkzSwitchButton) {
    elements.zkzSwitchButton.addEventListener("click", () => {
      isOrdersMode = !isOrdersMode;
      elements.zkzSwitchButton.textContent = isOrdersMode
        ? "Показать по доставкам"
        : "Показать по заказам";
      toggleDisplayMode();
    });
  }

  // Обработчик изменения размера окна
  window.addEventListener("resize", () => {
    const newIsMobile = window.innerWidth <= 800;
    if (isMobile !== newIsMobile) {
      // Перезагрузим страницу для корректной адаптации
      window.location.reload();
    }
  });
};
