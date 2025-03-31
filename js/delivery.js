// --- Завёрнутый Скрипт: initDelivery ---
// Этот скрипт должен быть инициализирован извне (например, через shadow root)
// через вызов: window.initDelivery(shadowRoot);

window.initDelivery = function (root = window) {
  /***********************
   * ИНИЦИАЛИЗАЦИЯ ДАННЫХ
   ***********************/
  root.data = root.data || [];
  root.selectedSortOptions = root.selectedSortOptions || {};

  // Объект сортировки по умолчанию для мобильного модального окна
  const defaultSortOrder = {
    "По дате добавления": "asc",
    "Сначала новинки": "desc",
    "Сначала дорогие": "desc",
    "Сначала дешевые": "asc",
    "Сначала дорогие (за ед вложения)": "desc",
    "Сначала дешевые (за ед вложения)": "asc",
    "По алфавиту": "asc",
    "По артикулу": "asc",
  };

  // Функция для преобразования строки "ДД.MM.ГГГГ" в объект Date
  function parseDate(dateStr) {
    if (!dateStr) return new Date(0); // Если вдруг нет даты, вернём "минимальную" дату
    const parts = dateStr.split(".");
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  /***********************
   * ДЕСКТОПНЫЙ ФУНКЦИОНАЛ
   ***********************/
  const hideSidebarButton = root.querySelector(".hide-right-sidebar");
  const showSidebarButton = root.querySelector(".show-right-sidebar");
  const orderSummary = root.querySelector(".order-summary");
  const mainContent = root.querySelector(".content");

  if (
    !hideSidebarButton ||
    !showSidebarButton ||
    !orderSummary ||
    !mainContent
  ) {
    console.warn(
      "Некоторые элементы управления сайдбаром не найдены внутри корня:",
      root
    );
    return;
  }

  const sidebarVisibleByDefault = true;
  if (orderSummary) {
    orderSummary.style.position = "fixed";
    orderSummary.style.right = "0";
  }

  function initializeSidebar() {
    if (sidebarVisibleByDefault) {
      orderSummary.classList.remove("hidden");
      showSidebarButton.style.display = "none";
      hideSidebarButton.style.display = "flex";
      mainContent.classList.add("with-sidebar");
      mainContent.classList.remove("full-width");
    } else {
      orderSummary.classList.add("hidden");
      showSidebarButton.style.display = "flex";
      hideSidebarButton.style.display = "none";
      mainContent.classList.add("full-width");
      mainContent.classList.remove("with-sidebar");
    }
  }
  initializeSidebar();

  hideSidebarButton.addEventListener("click", () => {
    orderSummary.classList.add("hidden");
    hideSidebarButton.style.display = "none";
    showSidebarButton.style.display = "flex";
    mainContent.classList.remove("with-sidebar");
    mainContent.classList.add("full-width");
  });

  showSidebarButton.addEventListener("click", () => {
    orderSummary.classList.remove("hidden");
    hideSidebarButton.style.display = "flex";
    showSidebarButton.style.display = "none";
    mainContent.classList.remove("full-width");
    mainContent.classList.add("with-sidebar");
  });

  // Переменные для расчётов
  let totalItems = 0,
    shippingCost = 0,
    subtotal = 0,
    discount = 0,
    discountPercent = 14,
    totalToPay = 0;

  function updateValues() {
    const elements = {
      totalItems: root.getElementById("total-items"),
      shippingCost: root.getElementById("shipping-cost"),
      subtotal: root.getElementById("subtotal"),
      discountInput: root.getElementById("discount-input"),
      discountPercentInput: root.getElementById("discount-percent"),
      totalToPay: root.getElementById("total-to-pay"),
    };

    if (elements.totalItems) elements.totalItems.textContent = totalItems;
    if (elements.shippingCost)
      elements.shippingCost.textContent = `${shippingCost.toLocaleString()} ₽`;
    if (elements.subtotal)
      elements.subtotal.textContent = `${subtotal.toLocaleString()} ₽`;
    if (elements.discountInput)
      elements.discountInput.value = discount.toFixed(2);
    if (elements.discountPercentInput)
      elements.discountPercentInput.value = discountPercent.toFixed(2);
    if (elements.totalToPay)
      elements.totalToPay.textContent = `${totalToPay.toLocaleString()} ₽`;
  }

  const deliveryContainer = root.getElementById("delivery-sections");
  if (!deliveryContainer) {
    console.warn(
      "Элемент с id 'delivery-sections' не найден внутри корня:",
      root
    );
    return;
  }

  const currentDate = new Date();
  let popupImage = document.createElement("img");
  popupImage.className = "popup-image";
  document.body.appendChild(popupImage);

  // Флаг для режима отображения десктопа (таблицы)
  let currentViewMode = "deliveries";

  // Элементы переключения (для десктопа)
  const toggleText = root.getElementById("toggleText");
  const toggleIcon = root.getElementById("toggleIcon");
  const toggleButton = root.querySelector(".toggle-button");
  if (toggleButton) {
    toggleButton.addEventListener("click", toggleViewMode);
  }

  function toggleViewMode() {
    if (currentViewMode === "deliveries") {
      currentViewMode = "list";
      if (toggleText) toggleText.textContent = "Разделить список на доставки";
      if (toggleIcon) {
        toggleIcon.classList.remove("ri-file-list-3-line");
        toggleIcon.classList.add("ri-box-3-line");
      }
      renderListView();
    } else {
      currentViewMode = "deliveries";
      if (toggleText) toggleText.textContent = "Показать списком";
      if (toggleIcon) {
        toggleIcon.classList.remove("ri-box-3-line");
        toggleIcon.classList.add("ri-file-list-3-line");
      }
      renderDeliveryView();
    }
  }

  /* ===============================
     ФУНКЦИОНАЛ ДЛЯ ДЕСКТОПНОЙ ВЕРСИИ
  =============================== */
  function parseDeliveryDays(logisticString) {
    const match = logisticString.match(/до (\d+) дней/);
    return match ? parseInt(match[1], 10) : 1;
  }

  function calculateDeliveryDate(days) {
    const deliveryDate = new Date(currentDate);
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toLocaleDateString("ru-RU");
  }

  // Если data не является массивом – возвращаем пустой объект
  function groupByDelivery(data) {
    if (!Array.isArray(data)) return {};
    return data.reduce((acc, item) => {
      const deliveryDays = parseDeliveryDays(item["Логистика"]);
      const deliveryDate = calculateDeliveryDate(deliveryDays);
      if (!acc[deliveryDate]) acc[deliveryDate] = [];
      acc[deliveryDate].push(item);
      return acc;
    }, {});
  }

  function calculateDeliveryDateForExcel(items) {
    if (!items || items.length === 0) return "N/A";
    const deliveryDays = parseDeliveryDays(items[0]["Логистика"]);
    return calculateDeliveryDate(deliveryDays);
  }

  function renderDeliveryView() {
    deliveryContainer.innerHTML = "";
    const groupedData = groupByDelivery(root.data);
    renderDeliverySections(groupedData);
    initializeAfterRender();
  }

  function renderDeliverySections(groupedData) {
    Object.keys(groupedData).forEach((deliveryDate) => {
      const section = createDeliverySection(
        deliveryDate,
        groupedData[deliveryDate]
      );
      deliveryContainer.appendChild(section);
    });
  }

  function createDeliverySection(deliveryDate, items) {
    const section = document.createElement("div");
    section.className = "delivery-section";
    const header = createDeliveryheader(deliveryDate, items);
    section.appendChild(header);
    const content = createDeliveryContent(items);
    section.appendChild(content);

    header.addEventListener("click", (event) => {
      if (isAltQPressed) return;
      if (
        event.target.closest(".collapsed-order-button") ||
        event.target.closest(".header-icon") ||
        event.target.closest(".product-image") ||
        event.target.closest(".select-all-checkbox")
      ) {
        return;
      }
      toggleSectionContent(header, content, items);
    });
    return section;
  }

  function createDeliveryheader(deliveryDate, items) {
    const header = document.createElement("div");
    header.className = "delivery-header";
    const headerText = document.createElement("h2");
    headerText.textContent = `Доставка на: ${deliveryDate}`;
    const headerImagesContainer = document.createElement("div");
    headerImagesContainer.className = "header-images-container";
    headerImagesContainer.style.display = "none";
    const headerRight = createheaderRight(items);
    const arrowSpan = document.createElement("span");
    arrowSpan.className = "arrow";
    arrowSpan.textContent = "▼";
    const headerLeft = document.createElement("div");
    headerLeft.className = "header-left-container";
    headerLeft.appendChild(headerText);
    header.append(headerLeft, headerImagesContainer, headerRight, arrowSpan);
    return header;
  }

  function createheaderRight(items) {
    const headerRight = document.createElement("div");
    headerRight.className = "header-right";
    headerRight.style.display = "none";
    const collapsedSum = document.createElement("div");
    collapsedSum.className = "collapsed-sum";
    collapsedSum.textContent = `Сумма: ${calculateDeliverySum(items)} ₽`;
    const collapsedOrderButton = document.createElement("button");
    collapsedOrderButton.className = "collapsed-order-button";
    collapsedOrderButton.textContent = "Перенести в другую корзину";
    collapsedOrderButton.addEventListener("click", (event) => {
      event.stopPropagation();
      alert("Перенести в другую корзину");
    });
    headerRight.append(collapsedSum, collapsedOrderButton);
    return headerRight;
  }

  function createDeliveryContent(items) {
    const content = document.createElement("div");
    content.className = "delivery-content";
    // Десктоп: таблица товаров
    const table = createProductsTable(items);
    content.appendChild(table);
    const actionsContainer = createActionsContainer(items);
    content.appendChild(actionsContainer);
    return content;
  }

  function createProductsTable(items) {
    const table = document.createElement("table");
    table.className = "iksweb";
    const thead = createTablehead();
    table.appendChild(thead);
    const tbody = createTableBody(items);
    table.appendChild(tbody);
    addSorting(table, items);
    return table;
  }

  function createTablehead() {
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th data-column="select-all">
          <input type="checkbox" class="select-all-checkbox" title="Выбрать/Снять выбор со всех товаров">
        </th>
        <th>Изображение</th>
        <th data-column="Код" class="sortable">Код <span class="sort-arrow"></span></th>
        <th data-column="Наименование" class="sortable">Наименование <span class="sort-arrow"></span></th>
        <th data-column="Цена" class="sortable">Цена <span class="sort-arrow"></span></th>
        <th data-column="Наличие" class="sortable">Наличие <span class="sort-arrow"></span></th>
        <th data-column="Мин. Кол." class="sortable">Мин. Кол. <span class="sort-arrow"></span></th>
        <th>Кол.</th>
        <th data-column="Сумма" class="sortable">Сумма <span class="sort-arrow"></span></th>
      </tr>
    `;
    const selectAllCheckbox = thead.querySelector(".select-all-checkbox");
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", (event) => {
        const isChecked = event.target.checked;
        const table = event.target.closest("table");
        if (!table) return;
        const tbody = table.querySelector("tbody");
        if (isChecked) {
          selectAllInTable(table, tbody);
        } else {
          deselectAllInTable(table, tbody);
        }
        updateheaderCheckboxState(table);
      });
    }
    return thead;
  }

  function createTableBody(items) {
    const tbody = document.createElement("tbody");
    items.forEach((item, index) => {
      const row = createTableRow(item, index);
      tbody.appendChild(row);
    });
    return tbody;
  }

  function createTableRow(item, index) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="number-cell" data-number="${index + 1}">${index + 1}</td>
      <td><img src="${
        item["Изображение"]
      }" alt="Изображение" class="product-image" data-fullsrc="${
      item["Изображение"]
    }"></td>
      <td>${item["Код"]}</td>
      <td>${item["Наименование"]}</td>
      <td class="price-cell">${item["Цена"]} ₽</td>
      <td>${item["Наличие"]}</td>
      <td>${item["Мин. Кол."]}</td>
    `;
    const quantityCell = createQuantityCell(item);
    row.appendChild(quantityCell);
    const sumCell = document.createElement("td");
    sumCell.className = "sum-cell";
    sumCell.textContent = "0 ₽";
    row.appendChild(sumCell);
    initializeRowEvents(row, item, index);
    return row;
  }

  function createQuantityCell(item) {
    const quantityCell = document.createElement("td");
    const cartContainer = document.createElement("div");
    cartContainer.className = "cart-container";
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = item.quantity || 0;
    quantityInput.min = item["Мин. Кол."] || 1;
    quantityInput.max = item["Наличие"] || 0;
    quantityInput.className = "quantity-input";
    quantityInput.addEventListener("input", () =>
      validateAndCorrectInput(quantityInput, true)
    );
    const cartIcon = document.createElement("img");
    cartIcon.src = "/images/svg/Icon/carted_ico.svg";
    cartIcon.alt = "Удалить товар";
    cartIcon.className = "cart-icon";
    cartIcon.addEventListener("click", () => toggleCartIcon(cartIcon));
    cartContainer.append(quantityInput, cartIcon);
    quantityCell.appendChild(cartContainer);
    return quantityCell;
  }

  function createActionsContainer(items) {
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "actions-container";
    const downloadExcelButton = document.createElement("button");
    downloadExcelButton.className = "download-excel";
    downloadExcelButton.textContent = "Excel";
    downloadExcelButton.addEventListener("click", () => {
      const selected = root.data.filter((item) => item.selected);
      downloadExcel(selected.length ? selected : root.data);
    });
    const downloadPdfButton = document.createElement("button");
    downloadPdfButton.className = "download-pdf";
    downloadPdfButton.textContent = "PDF";
    downloadPdfButton.addEventListener("click", () => {
      const selected = root.data.filter((item) => item.selected);
      downloadPDF(selected.length ? selected : root.data);
    });
    const orderButton = document.createElement("button");
    orderButton.className = "order-button";
    orderButton.textContent = "Перенести в другую корзину";
    orderButton.addEventListener("click", (event) => {
      event.stopPropagation();
      alert("Перенести в другую корзину");
    });
    const deliverySum = document.createElement("div");
    deliverySum.className = "delivery-sum";
    deliverySum.textContent = `Сумма: ${calculateDeliverySum(items)} ₽`;
    actionsContainer.append(
      downloadExcelButton,
      downloadPdfButton,
      orderButton,
      deliverySum
    );
    return actionsContainer;
  }

  function toggleSectionContent(header, content, items) {
    const isCollapsed = content.classList.contains("collapsed");
    const headerRight = header.querySelector(".header-right");
    const headerImagesContainer = header.querySelector(
      ".header-images-container"
    );
    if (isCollapsed) {
      content.classList.remove("collapsed");
      headerRight.style.display = "none";
      headerImagesContainer.style.display = "none";
      header.classList.remove("collapsed");
    } else {
      content.classList.add("collapsed");
      headerRight.style.display = "flex";
      headerImagesContainer.style.display = "flex";
      headerImagesContainer.innerHTML = "";
      items.forEach((item) => {
        const img = document.createElement("img");
        img.src = item["Изображение"];
        img.alt = "Изображение";
        img.className = "product-image";
        img.dataset.fullsrc = item["Изображение"];
        initializeImageEvents(img);
        headerImagesContainer.appendChild(img);
      });
      header.classList.add("collapsed");
    }
  }

  function renderListView() {
    deliveryContainer.innerHTML = "";
    renderListSection(root.data);
    initializeAfterRender();
  }

  function renderListSection(data) {
    const section = document.createElement("div");
    section.className = "delivery-section";
    const header = document.createElement("div");
    header.className = "delivery-header";
    const headerText = document.createElement("h2");
    headerText.textContent = "Список товаров:";
    const headerRight = createheaderRight(data);
    header.append(headerText, headerRight);
    section.appendChild(header);
    const content = createDeliveryContent(data);
    section.appendChild(content);
    deliveryContainer.appendChild(section);
  }

  function calculateDeliverySum(items) {
    return items
      .reduce((sum, item) => {
        const price = parseFloat(item["Цена"]) || 0;
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + price * quantity;
      }, 0)
      .toFixed(2);
  }

  function validateAndCorrectInput(input, showPopup = true) {
    let value = parseInt(input.value, 10) || 0;
    const minQty = parseInt(input.min, 10) || 1;
    const maxQty = parseInt(input.max, 10) || 0;
    if (value < minQty) value = minQty;
    if (value > maxQty && showPopup) {
      const row = input.closest("tr");
      createPopup(row, "waiting");
    }
    input.value = value;
    updateSum(input);
  }

  function updateSum(input) {
    const row = input.closest("tr");
    const priceCell = row.querySelector("td.price-cell");
    if (!priceCell) return;
    const priceText = priceCell.textContent.replace(/\s/g, "").replace("₽", "");
    const price = parseFloat(priceText) || 0;
    const quantity = parseInt(input.value, 10) || 0;
    const sumCell = row.querySelector(".sum-cell");
    sumCell.textContent = `${(price * quantity).toFixed(2)} ₽`;
    recalculateSubtotalAndTotal();
  }

  function createPopup(row, type = "waiting") {
    const existingPopup = document.querySelector(`.${type}-popup`);
    if (existingPopup) return;
    const popup = document.createElement("div");
    popup.classList.add(`${type}-popup`);
    popup.innerHTML =
      type === "restore" ? getRestorePopupContent() : getWaitingPopupContent();
    document.body.appendChild(popup);
    positionPopup(row, popup);
    popup.classList.add("fadeIn");
    popup.querySelector(".close-popup").addEventListener("click", () => {
      popup.remove();
    });
    if (type === "restore") {
      const restoreText = popup.querySelector(".restore-text");
      if (restoreText) {
        restoreText.style.cursor = "pointer";
        restoreText.addEventListener("click", () => {
          row.classList.remove("deleted-row");
          const cartIcon = row.querySelector(".cart-icon");
          if (cartIcon) cartIcon.src = "/images/svg/Icon/carted_ico.svg";
          const quantityInput = row.querySelector(".quantity-input");
          if (quantityInput) quantityInput.disabled = false;
          popup.remove();
        });
      }
      const deleteIcon = popup.querySelector(".delete-icon");
      if (deleteIcon) {
        deleteIcon.style.cursor = "pointer";
        deleteIcon.addEventListener("click", () => {
          deleteProduct(row);
          popup.remove();
        });
      }
    } else if (type === "waiting") {
      expandWaitingPopup(popup);
    }
  }

  function positionPopup(row, popup) {
    const rowRect = row.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    popup.style.position = "absolute";
    popup.style.top = `${rowRect.bottom + scrollTop}px`;
    popup.style.left = `${rowRect.left + scrollLeft}px`;
    popup.style.zIndex = "1001";
  }

  function getRestorePopupContent() {
    return `
      <p class="restore-text" data-tooltip="Восстановить строку">Восстановить строку?</p>
      <img src="/images/svg/Icon/carted_ico.svg" alt="Удалить товар" class="delete-icon" data-tooltip="Удалить товар">
      <button class="close-popup" data-tooltip="Закрыть всплывающее окно">&times;</button>
    `;
  }

  function getWaitingPopupContent() {
    return `
      <p class="waiting-list-text" data-tooltip="Добавить товар в лист ожидания">Добавить в лист ожидания?</p>
      <button class="close-popup" data-tooltip="Закрыть всплывающее окно">&times;</button>
    `;
  }

  function deleteProduct(row) {
    const productCode = row.querySelector("td:nth-child(3)").textContent.trim();
    root.data = root.data.filter((item) => item["Код"] !== productCode);
    if (currentViewMode === "deliveries") {
      renderDeliveryView();
    } else {
      renderListView();
    }
    recalculateSubtotalAndTotal();
  }

  function expandWaitingPopup(popup) {
    popup.classList.add("expand");
    const formContent = document.createElement("div");
    formContent.className = "popup-form-content";
    formContent.innerHTML = `
      <div class="form-group">
        <label>Количество:</label>
        <input type="number" class="waiting-quantity" placeholder="Сколько?" data-tooltip="Введите количество для листа ожидания" />
      </div>
      <div class="form-group">
        <label>Комментарий:</label>
        <textarea class="waiting-comment" placeholder="Например: Прошу связаться со мной по номеру +79..., чтобы уточнить детали" data-tooltip="Добавьте комментарий к листу ожидания"></textarea>
      </div>
      <button class="add-to-waiting-list" data-tooltip="Добавить товар в лист ожидания">Добавить</button>
    `;
    popup.appendChild(formContent);
    const addButton = popup.querySelector(".add-to-waiting-list");
    if (addButton) {
      addButton.addEventListener("click", () => {
        console.log("Добавлено в лист ожидания");
        popup.remove();
      });
    }
  }

  function toggleCartIcon(icon) {
    const row = icon.closest("tr");
    if (!row) return;
    const quantityInput = row.querySelector(".quantity-input");
    if (row.classList.contains("deleted-row")) {
      row.classList.remove("deleted-row");
      icon.src = "/images/svg/Icon/carted_ico.svg";
      if (quantityInput) quantityInput.disabled = false;
      const existingPopup = row.querySelector(".restore-popup");
      if (existingPopup) existingPopup.remove();
    } else {
      row.classList.add("deleted-row");
      icon.src = "/images/svg/Icon/carted_ico.svg";
      if (quantityInput) quantityInput.disabled = true;
      createPopup(row, "restore");
    }
  }

  /**
   * ВАЖНО:
   * - В десктопной версии мы не открываем fullscreen slider.
   * - В мобильной версии (ширина <= 800px) — открываем, но если изображение только одно, убираем кнопки и индикаторы.
   */
  function initializeRowEvents(row, item, index) {
    const quantityInput = row.querySelector(".quantity-input");
    if (quantityInput) {
      quantityInput.value = item.quantity || 0;
      quantityInput.addEventListener("input", () =>
        validateAndCorrectInput(quantityInput, true)
      );
    }
    const productImage = row.querySelector(".product-image");
    if (productImage) {
      initializeImageEvents(productImage);
    }
    const numberCell = row.querySelector(".number-cell");
    if (numberCell) {
      initializeNumberCellEvents(numberCell, row, item, index);
    }
    updateSum(quantityInput);
  }

  /**
   * В десктопной версии мы НЕ открываем слайдер по клику.
   * В мобильной версии (ширина <= 800px) – открываем.
   */
  function initializeImageEvents(imageElement) {
    // На десктопе — только всплывающее увеличенное изображение при наведении
    imageElement.addEventListener("mouseover", function () {
      popupImage.src = imageElement.dataset.fullsrc || imageElement.src;
      popupImage.style.display = "block";
    });
    imageElement.addEventListener("mousemove", function (e) {
      if (popupImage.style.display === "block") {
        const imageWidth = 200;
        const imageHeight = 200;
        const padding = 10;
        let leftPosition = e.pageX + padding;
        let topPosition = e.pageY + padding;
        if (leftPosition + imageWidth > window.innerWidth + window.scrollX) {
          leftPosition = e.pageX - imageWidth - padding;
        }
        if (topPosition + imageHeight > window.innerHeight + window.scrollY) {
          topPosition = e.pageY - imageHeight - padding;
        }
        popupImage.style.left = `${leftPosition}px`;
        popupImage.style.top = `${topPosition}px`;
        popupImage.style.width = `${imageWidth}px`;
        popupImage.style.height = `${imageHeight}px`;
        popupImage.style.position = "absolute";
        popupImage.style.zIndex = "1000";
        popupImage.style.borderRadius = "10px";
      }
    });
    imageElement.addEventListener("mouseout", function () {
      popupImage.style.display = "none";
    });

    // Для мобильной версии — открываем слайдер
    imageElement.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 800px)").matches) {
        loadProductImages(imageElement.alt).then((images) => {
          if (!images || images.length === 0) {
            images = [imageElement.dataset.fullsrc || imageElement.src];
          }
          showFullScreenSlider(images, imageElement.alt);
        });
      }
    });
  }

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

  /**
   * showFullScreenSlider(images, article):
   * - Если images.length < 2 => не показываем стрелки и индикаторы
   * - Иначе показываем, как раньше, с доработкой для мобильного макета:
   *   верхняя часть (2/3 высоты экрана) содержит слайдер, нижняя – информацию о товаре.
   */
  function showFullScreenSlider(images, article) {
    const sliderWidth = Math.min(window.innerWidth * 0.9, 600);
    const slideGap = 10;
    const overlay = document.createElement("div");
    overlay.className = "fullscreen-slider-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.48)",
      backdropFilter: "blur(2px)",
      display: "flex",
      flexDirection: "column",
      zIndex: "9999",
      overflowY: "auto",
      overflowX: "hidden",
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const upperContainer = document.createElement("div");
    Object.assign(upperContainer.style, {
      flex: "0 0 66.66vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
    overlay.appendChild(upperContainer);

    const lowerContainer = document.createElement("div");
    Object.assign(lowerContainer.style, {
      width: "100%",
      padding: "16px",
      backgroundColor: "#fff",
      color: "#000",
      boxSizing: "border-box",
    });
    overlay.appendChild(lowerContainer);

    const sliderWrapper = document.createElement("div");
    sliderWrapper.style.position = "relative";
    sliderWrapper.style.width = sliderWidth + "px";
    sliderWrapper.style.height = sliderWidth + "px";
    sliderWrapper.style.overflow = "visible";
    upperContainer.appendChild(sliderWrapper);

    const sliderContainer = document.createElement("div");
    Object.assign(sliderContainer.style, {
      display: "flex",
      height: sliderWidth + "px",
      width: (sliderWidth + slideGap) * images.length - slideGap + "px",
      transition: "transform 0.3s ease-out",
    });
    sliderWrapper.appendChild(sliderContainer);

    images.forEach((src, idx) => {
      const slide = document.createElement("div");
      slide.style.flex = "0 0 " + sliderWidth + "px";
      slide.style.width = sliderWidth + "px";
      slide.style.height = sliderWidth + "px";
      if (idx < images.length - 1) {
        slide.style.marginRight = slideGap + "px";
      }
      slide.style.display = "flex";
      slide.style.justifyContent = "center";
      slide.style.alignItems = "center";

      const img = document.createElement("img");
      img.src = src;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.borderRadius = "8px";

      slide.appendChild(img);
      sliderContainer.appendChild(slide);
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "-60px",
      right: "0",
      fontSize: "28px",
      fontWeight: "bold",
      backgroundColor: "orange",
      color: "#fff",
      border: "none",
      padding: "5px 10px",
      borderRadius: "4px",
      cursor: "pointer",
      zIndex: "10000",
    });
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.remove();
    });
    sliderWrapper.appendChild(closeBtn);

    let currentSlide = 0;

    // Если всего 1 изображение => не показываем стрелки и индикаторы, а низ заполняем расширенным описанием:
    if (images.length < 2) {
      lowerContainer.innerHTML = `
      <div class="description-section" style="margin-bottom: 20px;">
        <h2>Фотореле EKF PS-5 15А 3300Вт IP66 PROxima</h2>
        <p>
          Фотореле PS-5 применяется для управления освещением или другой нагрузкой
          в зависимости от уровня освещенности. Обычно фотореле применяется в системах
          управления уличным освещением и включает/выключает нагрузку в момент захода/восхода солнца.
          Допускается прямое подключение нагрузки с током не более 15А. Нагрузка большей мощности
          может быть подключена при помощи контактора. Порог срабатывания по освещенности настраивается
          в диапазоне 5-50 лк. Фотореле имеет степень защиты IP66, что позволяет устанавливать его
          в условиях сильного воздействия пыли и влаги.
        </p>
      </div>
      <div class="description-section" style="margin-bottom: 20px;">
        <h3>Характеристики</h3>
        <div class="table-wrapper" style="overflow-x: auto; border: 1px solid #ccc;">
          <table>
            <tr><td>Статус</td><td>Регулярная</td></tr>
            <tr><td>Макс. ток коммутируем. резистивной нагрузки, А</td><td>15</td></tr>
            <tr><td>Макс. коммутационная мощность (подключ. нагрузка), Вт</td><td>3 300</td></tr>
            <tr><td>Установка сумеречного порога, лк</td><td>5...50</td></tr>
            <tr><td>Подходит для степени защиты (IP)</td><td>IP66</td></tr>
            <tr><td>Номин. напряжение, В</td><td>230</td></tr>
            <tr><td>Задержка включения, с</td><td>5</td></tr>
            <tr><td>Задержка отключения, с</td><td>540</td></tr>
            <tr><td>Цвет по RAL</td><td>9 010</td></tr>
            <tr><td>Освещённость, при которой происходит отключение, лк</td><td>5...50</td></tr>
            <tr><td>Рабочая температура, °C</td><td>-25...40</td></tr>
            <tr><td>Цвет</td><td>Белый</td></tr>
            <tr><td>Гарантийный срок эксплуатации</td><td>7 лет</td></tr>
          </table>
        </div>
      </div>
      <div class="description-section" style="margin-bottom: 20px;">
        <h3>Логистические параметры</h3>
        <div class="table-wrapper" style="overflow-x: auto; border: 1px solid #ccc;">
          <table>
            <tr>
              <th>Вид параметра</th>
              <th>Индивидуальная</th>
              <th>Групповая</th>
              <th>Транспортная</th>
            </tr>
            <tr>
              <td>Количество в упаковке</td>
              <td>1</td>
              <td>1</td>
              <td>100</td>
            </tr>
            <tr>
              <td>Единица хранения</td>
              <td>Штука</td>
              <td>Штука</td>
              <td>Коробка</td>
            </tr>
            <tr>
              <td>Штрих-код</td>
              <td>4690216240947</td>
              <td>4690216240947</td>
              <td>14690216240944</td>
            </tr>
            <tr>
              <td>Вес брутто, кг</td>
              <td>0.1390</td>
              <td>0.1390</td>
              <td>14.2000</td>
            </tr>
            <tr>
              <td>Объем, м³</td>
              <td>0.00090000</td>
              <td>0.00090000</td>
              <td>0.07792300</td>
            </tr>
            <tr>
              <td>Длина, м</td>
              <td>0.0900</td>
              <td>0.0900</td>
              <td>0.4500</td>
            </tr>
            <tr>
              <td>Ширина, м</td>
              <td>0.1190</td>
              <td>0.1190</td>
              <td>0.4630</td>
            </tr>
            <tr>
              <td>Высота, м</td>
              <td>0.0840</td>
              <td>0.0840</td>
              <td>0.3740</td>
            </tr>
          </table>
        </div>
      </div>
      <div class="description-section" style="margin-bottom: 20px;">
        <h3>Комплектация:</h3>
        <ul>
          <li>Фотореле</li>
          <li>Паспорт</li>
          <li>Крепежный уголок</li>
          <li>Крепеж</li>
          <li>Упаковка</li>
        </ul>
      </div>
      <div style="height: 100px;"></div>
    `;
      document.body.appendChild(overlay);
      return;
    }

    // Если 2+ изображений => показываем индикаторы, стрелки и чуть более короткое описание
    const indicatorsContainer = document.createElement("div");
    Object.assign(indicatorsContainer.style, {
      position: "absolute",
      bottom: "-50px",
      left: "0",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      gap: "16px",
      alignItems: "center",
    });
    images.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.style.width = "16px";
      dot.style.height = "16px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = i === 0 ? "orange" : "#ddd";
      dot.style.transition = "transform 0.3s ease, background-color 0.3s ease";
      indicatorsContainer.appendChild(dot);
    });
    sliderWrapper.appendChild(indicatorsContainer);

    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "◀";
    prevBtn.title = "Предыдущее";
    Object.assign(prevBtn.style, {
      position: "absolute",
      bottom: "-70px",
      left: "calc(50% - 190px)",
      fontSize: "24px",
      backgroundColor: "orange",
      border: "none",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      zIndex: "10000",
    });

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "▶";
    nextBtn.title = "Следующее";
    Object.assign(nextBtn.style, {
      position: "absolute",
      bottom: "-70px",
      left: "calc(50% + 140px)",
      fontSize: "24px",
      backgroundColor: "orange",
      border: "none",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      zIndex: "10000",
    });
    sliderWrapper.appendChild(prevBtn);
    sliderWrapper.appendChild(nextBtn);

    function updateSlidePosition() {
      prevTranslate = -((sliderWidth + slideGap) * currentSlide);
      sliderContainer.style.transition = "transform 0.3s ease-out";
      sliderContainer.style.transform = `translateX(${prevTranslate}px)`;
      updateIndicators();
    }

    function updateIndicators() {
      const dots = indicatorsContainer.querySelectorAll("div");
      dots.forEach((dot, i) => {
        if (i === currentSlide) {
          dot.style.transform = "scale(1.4)";
          dot.style.backgroundColor = "orange";
        } else {
          dot.style.transform = "scale(1)";
          dot.style.backgroundColor = "#ddd";
        }
      });
    }

    prevBtn.addEventListener("click", () => {
      currentSlide = (currentSlide - 1 + images.length) % images.length;
      updateSlidePosition();
    });
    nextBtn.addEventListener("click", () => {
      currentSlide = (currentSlide + 1) % images.length;
      updateSlidePosition();
    });

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    sliderContainer.addEventListener("touchstart", onTouchStart);
    sliderContainer.addEventListener("touchmove", onTouchMove);
    sliderContainer.addEventListener("touchend", onTouchEnd);

    function onTouchStart(e) {
      isDragging = true;
      startX = e.touches[0].clientX;
      sliderContainer.style.transition = "none";
    }
    function onTouchMove(e) {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - startX;
      currentTranslate = prevTranslate + deltaX;
      sliderContainer.style.transform = `translateX(${currentTranslate}px)`;
    }
    function onTouchEnd() {
      isDragging = false;
      const movedBy = currentTranslate - prevTranslate;
      if (movedBy < -50) {
        currentSlide = (currentSlide + 1) % images.length;
      } else if (movedBy > 50) {
        currentSlide = (currentSlide - 1 + images.length) % images.length;
      }
      sliderContainer.style.transition = "transform 0.3s ease-out";
      updateSlidePosition();
    }
    updateSlidePosition();

    // Короткое описание (если нужно – правьте его под свои нужды):
    lowerContainer.innerHTML = `
    <div class="description-section" style="margin-bottom: 20px;">
      <h2>Фотореле EKF PS-5 15А 3300Вт IP66 PROxima</h2>
      <p>
        Фотореле PS-5 применяется для управления освещением или другой нагрузкой.
        Допускается прямое подключение нагрузки с током не более 15А.
      </p>
    </div>
    <div class="description-section" style="margin-bottom: 20px;">
      <h3>Характеристики</h3>
      <div class="table-wrapper" style="overflow-x: auto; border: 1px solid #ccc;">
        <table>
          <tr><td>Статус</td><td>Регулярная</td></tr>
          <tr><td>Макс. ток резистивной нагрузки, А</td><td>15</td></tr>
          <tr><td>Мощность, Вт</td><td>3 300</td></tr>
          <tr><td>Порог, лк</td><td>5...50</td></tr>
          <tr><td>Защита (IP)</td><td>IP66</td></tr>
          <tr><td>Номин. напряжение, В</td><td>230</td></tr>
          <tr><td>Задержка включения, с</td><td>5</td></tr>
          <tr><td>Задержка отключения, с</td><td>540</td></tr>
          <tr><td>Цвет по RAL</td><td>9 010</td></tr>
          <tr><td>Рабочая температура, °C</td><td>-25...40</td></tr>
          <tr><td>Цвет</td><td>Белый</td></tr>
          <tr><td>Гарантия</td><td>7 лет</td></tr>
        </table>
      </div>
    </div>
    <div class="description-section" style="margin-bottom: 20px;">
      <h3>Логистические параметры</h3>
      <div class="table-wrapper" style="overflow-x: auto; border: 1px solid #ccc;">
        <table>
          <tr>
            <th>Параметр</th>
            <th>Индивидуальная</th>
            <th>Групповая</th>
            <th>Транспортная</th>
          </tr>
          <tr>
            <td>Кол-во в упаковке</td>
            <td>1</td>
            <td>1</td>
            <td>100</td>
          </tr>
          <tr>
            <td>Единица хранения</td>
            <td>Штука</td>
            <td>Штука</td>
            <td>Коробка</td>
          </tr>
          <tr>
            <td>Штрих-код</td>
            <td>4690216240947</td>
            <td>4690216240947</td>
            <td>14690216240944</td>
          </tr>
          <tr>
            <td>Вес, кг</td>
            <td>0.1390</td>
            <td>0.1390</td>
            <td>14.2000</td>
          </tr>
          <tr>
            <td>Объем, м³</td>
            <td>0.00090000</td>
            <td>0.00090000</td>
            <td>0.07792300</td>
          </tr>
          <tr>
            <td>Длина, м</td>
            <td>0.0900</td>
            <td>0.0900</td>
            <td>0.4500</td>
          </tr>
          <tr>
            <td>Ширина, м</td>
            <td>0.1190</td>
            <td>0.1190</td>
            <td>0.4630</td>
          </tr>
          <tr>
            <td>Высота, м</td>
            <td>0.0840</td>
            <td>0.0840</td>
            <td>0.3740</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="description-section" style="margin-bottom: 20px;">
      <h3>Комплектация:</h3>
      <ul>
        <li>Фотореле</li>
        <li>Паспорт</li>
        <li>Крепежный уголок</li>
        <li>Крепеж</li>
        <li>Упаковка</li>
      </ul>
    </div>
    <div style="height: 100px;"></div>
  `;
    document.body.appendChild(overlay);
  }

  /* =======================================
     ДАЛЕЕ БЕЗ ИЗМЕНЕНИЙ (корзина, сортировка)
  ======================================= */
  function addSorting(table, data) {
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    let currentSortColumn = null;
    let currentSortOrder = "asc";
    thead.addEventListener("click", (event) => {
      if (isAltQPressed) return;
      const th = event.target.closest("th");
      if (!th || !th.classList.contains("sortable")) return;
      const column = th.getAttribute("data-column");
      if (currentSortColumn === column) {
        currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
      } else {
        currentSortColumn = column;
        currentSortOrder = "asc";
      }
      const sortedData = [...data].sort((a, b) => {
        let aValue, bValue;
        if (column === "index") {
          aValue = data.indexOf(a);
          bValue = data.indexOf(b);
        } else if (["Цена", "Наличие", "Мин. Кол.", "Сумма"].includes(column)) {
          aValue = parseFloat(a[column]) || 0;
          bValue = parseFloat(b[column]) || 0;
        } else {
          aValue = a[column] ? a[column].toString().toLowerCase() : "";
          bValue = b[column] ? b[column].toString().toLowerCase() : "";
        }
        if (aValue > bValue) return currentSortOrder === "asc" ? 1 : -1;
        if (aValue < bValue) return currentSortOrder === "asc" ? -1 : 1;
        return 0;
      });
      updateTableBody(tbody, sortedData);
      updateSortArrows(thead, currentSortColumn, currentSortOrder);
      initializeAfterRender();
    });
  }

  function updateTableBody(tbody, data) {
    tbody.innerHTML = "";
    data.forEach((item, index) => {
      const row = createTableRow(item, index);
      tbody.appendChild(row);
    });
  }

  function updateSortArrows(thead, currentColumn, currentSortOrder) {
    const sortArrows = thead.querySelectorAll(".sort-arrow");
    sortArrows.forEach((arrow) => {
      arrow.textContent = "";
      arrow.style.color = "transparent";
    });
    const activeTh = thead.querySelector(`th[data-column="${currentColumn}"]`);
    if (activeTh) {
      const arrow = activeTh.querySelector(".sort-arrow");
      if (arrow) {
        arrow.textContent = currentSortOrder === "asc" ? "▲" : "▼";
        arrow.style.color = "orange";
      }
    }
  }

  function selectRandomProducts(data) {
    const totalProducts = data.length;
    const minProducts = Math.ceil(totalProducts * 0.7);
    const maxProducts = totalProducts;
    const numberOfProducts =
      Math.floor(Math.random() * (maxProducts - minProducts + 1)) + minProducts;
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numberOfProducts);
    selected.forEach((item) => {
      const maxQty = parseInt(item["Наличие"], 10) || 0;
      const randomQty = Math.floor(Math.random() * (maxQty + 1));
      const minQty = parseInt(item["Мин. Кол."], 10) || 1;
      item.quantity = randomQty >= minQty ? randomQty : minQty;
    });
    root.data = selected;
  }

  function recalculateSubtotalAndTotal() {
    subtotal = 0;
    totalItems = 0;
    root.data = root.data.filter((item) => item.quantity > 0);
    root.data.forEach((item) => {
      const price = parseFloat(item["Цена"]) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      subtotal += price * quantity;
      if (quantity > 0) totalItems += 1;
    });
    const discountInput = root.getElementById("discount-input");
    const discountPercentInput = root.getElementById("discount-percent");
    if (discountInput && discountPercentInput) {
      if (
        !discountInput.dataset.manual &&
        !discountPercentInput.dataset.manual
      ) {
        discountPercent = 14;
        discount = (subtotal * discountPercent) / 100;
        discountInput.value = discount.toFixed(2);
        discountPercentInput.value = discountPercent.toFixed(2);
      } else if (discountPercentInput.dataset.manual) {
        discountPercent = parseFloat(discountPercentInput.value) || 0;
        discount = (subtotal * discountPercent) / 100;
        discountInput.value = discount.toFixed(2);
      } else if (discountInput.dataset.manual) {
        discount = parseFloat(discountInput.value.replace(/\s/g, "")) || 0;
        discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
        discountPercentInput.value = discountPercent.toFixed(2);
      }
    }
    totalToPay = subtotal - discount;
    shippingCost = calculateShippingCost();
    updateValues();
    updateAllheaderCheckboxes();
    updateMobileSelectAllCheckbox();
  }

  function calculateShippingCost() {
    return 1350;
  }

  let isAltQPressed = false;
  document.addEventListener("keydown", (event) => {
    if (
      event.altKey &&
      (event.code === "KeyQ" || event.key.toLowerCase() === "й")
    ) {
      if (!isAltQPressed) {
        isAltQPressed = true;
        document.body.classList.add("alt-q-active");
      }
    }
  });
  document.addEventListener("keyup", (event) => {
    if (event.code === "KeyQ" || event.key.toLowerCase() === "й") {
      if (isAltQPressed) {
        isAltQPressed = false;
        document.body.classList.remove("alt-q-active");
      }
    }
  });

  function initializeNumberCellEvents(cell, row, item, index) {
    cell.addEventListener("click", (event) => {
      if (isAltQPressed) return;
      event.stopPropagation();
      const isSelected = row.classList.contains("selected");
      if (isSelected) {
        deselectRow(row);
      } else {
        selectRow(row);
      }
      const table = row.closest("table");
      if (table) updateheaderCheckboxState(table);
    });
  }

  function selectRow(row) {
    const numberCell = row.querySelector(".number-cell");
    if (numberCell) {
      numberCell.textContent = "✔";
      numberCell.style.color = "darkorange";
    }
    row.classList.add("selected");
  }

  function deselectRow(row) {
    const numberCell = row.querySelector(".number-cell");
    if (numberCell) {
      numberCell.textContent = numberCell.dataset.number;
      numberCell.style.color = "";
    }
    row.classList.remove("selected");
  }

  function toggleSelectAllInSection(header) {
    const section = header.closest(".delivery-section");
    const table = section.querySelector("table");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    const isAllSelected = table.classList.contains("all-selected");
    if (isAllSelected) {
      deselectAllInTable(table, tbody);
      table.classList.remove("all-selected");
    } else {
      selectAllInTable(table, tbody);
      table.classList.add("all-selected");
    }
    updateheaderCheckboxState(table);
  }

  function selectAllInTable(table, tbody) {
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row) => {
      if (!row.classList.contains("selected")) selectRow(row);
    });
  }

  function deselectAllInTable(table, tbody) {
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row) => {
      if (row.classList.contains("selected")) deselectRow(row);
    });
  }

  function toggleSelectAll() {
    const allTables = deliveryContainer.querySelectorAll("table");
    const isAllSelected = deliveryContainer.classList.contains("all-selected");
    if (isAllSelected) {
      allTables.forEach((table) => {
        const tbody = table.querySelector("tbody");
        deselectAllInTable(table, tbody);
      });
      deliveryContainer.classList.remove("all-selected");
    } else {
      allTables.forEach((table) => {
        const tbody = table.querySelector("tbody");
        selectAllInTable(table, tbody);
      });
      deliveryContainer.classList.add("all-selected");
    }
    updateAllheaderCheckboxes();
  }

  function resetAllSelections() {
    const allTables = deliveryContainer.querySelectorAll("table");
    allTables.forEach((table) => {
      const tbody = table.querySelector("tbody");
      deselectAllInTable(table, tbody);
      table.classList.remove("all-selected");
    });
    deliveryContainer.classList.remove("all-selected");
    updateAllheaderCheckboxes();
  }

  function initializeAfterRender() {
    initializeheaderCheckboxes();
  }

  function initializeheaderCheckboxes() {
    const allheaders = deliveryContainer.querySelectorAll(
      ".delivery-section table thead"
    );
    allheaders.forEach((thead) => {
      const selectAllCheckbox = thead.querySelector(".select-all-checkbox");
      if (selectAllCheckbox) {
        const table = selectAllCheckbox.closest("table");
        if (table) {
          updateheaderCheckboxState(table);
        }
      }
    });
  }

  function updateheaderCheckboxState(table) {
    const selectAllCheckbox = table.querySelector(".select-all-checkbox");
    if (!selectAllCheckbox) return;
    const totalRows = table.querySelectorAll("tbody tr").length;
    const selectedRows = table.querySelectorAll("tbody tr.selected").length;
    if (selectedRows === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (selectedRows === totalRows) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }

  function updateAllheaderCheckboxes() {
    const allTables = deliveryContainer.querySelectorAll("table");
    allTables.forEach((table) => {
      updateheaderCheckboxState(table);
    });
  }

  // Для мобильной версии: обновляем состояние чекбокса "Выбрать все"
  function updateMobileSelectAllCheckbox() {
    if (mobileFuncRow) {
      const selectAllCheckbox = mobileFuncRow.querySelector(
        ".mobile-select-all-checkbox"
      );
      if (selectAllCheckbox) {
        const allSelected =
          root.data.length > 0 && root.data.every((item) => item.selected);
        selectAllCheckbox.checked = allSelected;
      }
    }
  }

  /* ====================================================
     МОДУЛЬ МОБИЛЬНОГО РЕЖИМА – Мобильная версия
     (здесь мы добавим логику ГРУППИРОВКИ по дате доставки)
  ==================================================== */

  let mobileFuncRow = null;

  // Функция для форматирования даты в формат ДД.MM.ГГГГ
  function formatDate(date) {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    if (day < 10) day = "0" + day;
    if (month < 10) month = "0" + month;
    return day + "." + month + "." + year;
  }

  // Функция для генерации ровно 3 уникальных случайных дат в ближайшие maxDays дней
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

  // Функция для генерации count случайных дат в ближайшие maxDays дней
  function getRandomDeliveryDates(count, maxDays) {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const offset = Math.floor(Math.random() * maxDays) + 1; // от 1 до maxDays
      const randomDate = new Date(
        today.getTime() + offset * 24 * 60 * 60 * 1000
      );
      dates.push(formatDate(randomDate));
    }
    return dates;
  }

  /**
   * Функция для применения выбранных опций сортировки и группировки (мобильная версия).
   * В конце вызывается либо renderMobileCart(inStockItems, outOfStockItems),
   * либо renderMobileGroupedView(inStockItems, outOfStockItems).
   *
   * Ключевая идея: мы не меняем root.data напрямую —
   * а делим её на inStock / outOfStock, сортируем ТОЛЬКО inStock,
   * и затем отрисовываем отдельно.
   */
  function applyMobileSortAndGroup() {
    // Используем локальные данные из текущего shadow root
    const localData = root.data;
    const selectedSortOptions = root.selectedSortOptions;

    const inStockItems = localData.filter(
      (item) => parseInt(item["Наличие"], 10) > 0
    );
    const outOfStockItems = localData.filter(
      (item) => parseInt(item["Наличие"], 10) === 0
    );

    let sortedInStock = [...inStockItems];

    if (selectedSortOptions.sort) {
      const sortOption = selectedSortOptions.sort;
      const sortOrder = selectedSortOptions.sortOrder || "asc";
      sortedInStock.sort((a, b) => {
        let aVal, bVal;
        switch (sortOption) {
          case "По дате добавления":
            aVal = a.createdAt || a.deliveryDate || "";
            bVal = b.createdAt || b.deliveryDate || "";
            break;
          case "Сначала новинки":
            aVal = a.isNew ? 1 : 0;
            bVal = b.isNew ? 1 : 0;
            break;
          case "Сначала дорогие":
            aVal = parseFloat(a["Цена"]) || 0;
            bVal = parseFloat(b["Цена"]) || 0;
            break;
          case "Сначала дешевые":
            aVal = parseFloat(a["Цена"]) || 0;
            bVal = parseFloat(b["Цена"]) || 0;
            break;
          case "Сначала дорогие (за ед вложения)":
            aVal = parseFloat(a["Цена"]) / (a.quantity || 1);
            bVal = parseFloat(b["Цена"]) / (b.quantity || 1);
            break;
          case "Сначала дешевые (за ед вложения)":
            aVal = parseFloat(a["Цена"]) / (a.quantity || 1);
            bVal = parseFloat(b["Цена"]) / (b.quantity || 1);
            break;
          case "По алфавиту":
            aVal = a["Наименование"] ? a["Наименование"].toLowerCase() : "";
            bVal = b["Наименование"] ? b["Наименование"].toLowerCase() : "";
            break;
          case "По артикулу":
            aVal = a["Код"] ? a["Код"].toLowerCase() : "";
            bVal = b["Код"] ? b["Код"].toLowerCase() : "";
            break;
          default:
            aVal = "";
            bVal = "";
        }
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        return 0;
      });
    }

    if (selectedSortOptions.group === "По дате доставки") {
      sortedInStock.sort(
        (a, b) => parseDate(a.deliveryDate) - parseDate(b.deliveryDate)
      );
      renderMobileGroupedView(sortedInStock, outOfStockItems);
    } else {
      renderMobileCart(sortedInStock, outOfStockItems);
    }
  }

  /**
   * Функция рендерит мобильные карточки одним списком (без группировки).
   * inStockItems - массив товаров с остатком > 0 (уже отсортированные, если нужно)
   * outOfStockItems - массив товаров без остатков
   */
  function renderMobileCart(inStockItems, outOfStockItems) {
    // Если функциональная строка (mobileFuncRow) ещё не создана – создаём её и вставляем в deliveryContainer
    if (!mobileFuncRow) {
      mobileFuncRow = document.createElement("div");
      mobileFuncRow.className = "mobile-functional-row";
      mobileFuncRow.style.display = "flex";
      mobileFuncRow.style.justifyContent = "space-between";
      mobileFuncRow.style.alignItems = "center";
      mobileFuncRow.style.padding = "0 0 10px 0";
      deliveryContainer.insertBefore(
        mobileFuncRow,
        deliveryContainer.firstChild
      );
    }

    // Очищаем контейнер, оставляя только mobileFuncRow
    Array.from(deliveryContainer.children).forEach((child) => {
      if (!child.classList.contains("mobile-functional-row")) {
        child.remove();
      }
    });

    // Рендерим верхнюю строку (функциональную панель)
    renderMobileFunctionalRow();

    // Генерируем 3 уникальные даты один раз для всех inStock товаров
    const uniqueDates = getUniqueRandomDeliveryDates(30);

    // Рисуем inStockItems (товары с остатками)
    inStockItems.forEach((item, index) => {
      // Если у товара не установлена дата доставки, присваиваем одну из уникальных дат
      if (!item.deliveryDate) {
        item.deliveryDate =
          uniqueDates[Math.floor(Math.random() * uniqueDates.length)];
      }

      const card = document.createElement("div");
      card.className = "mobile-cart-item";
      card.setAttribute("data-price", item["Цена"]);
      card.style.marginTop = "10px";
      card.style.border = "1px solid #ddd";
      card.style.borderRadius = "8px";
      card.style.padding = "10px";

      // Медиа-блок: чекбокс, изображение, код
      const mediaContainer = document.createElement("div");
      mediaContainer.className = "media-container";
      mediaContainer.style.display = "flex";
      mediaContainer.style.flexDirection = "column";
      mediaContainer.style.alignItems = "left";
      mediaContainer.style.gap = "10px";

      // Чекбокс
      const checkboxContainer = document.createElement("div");
      checkboxContainer.className = "mobile-checkbox-above";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "mobile-select-checkbox";
      checkbox.style.width = "24px";
      checkbox.style.height = "24px";
      checkbox.checked = !!item.selected;
      checkbox.addEventListener("change", () => {
        item.selected = checkbox.checked;
        updateCartSummaryMobile();
        updateMobileSelectAllCheckbox();
      });
      checkboxContainer.appendChild(checkbox);
      mediaContainer.appendChild(checkboxContainer);

      // Изображение
      const imgContainer = document.createElement("div");
      imgContainer.className = "item-image-container";
      imgContainer.style.position = "relative";
      imgContainer.style.backgroundColor = "#fff";
      imgContainer.style.borderRadius = "8px";
      imgContainer.style.overflow = "hidden";
      imgContainer.style.aspectRatio = "1 / 1";

      const img = document.createElement("img");
      img.className = "item-image";
      img.src = item["Изображение"];
      img.alt = "Изображение товара " + (index + 1);
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.cursor = "pointer";
      img.addEventListener("click", () => {
        loadProductImages(item["Код"]).then((images) => {
          if (!images || images.length === 0) {
            images = [img.dataset.fullsrc || img.src];
          }
          showFullScreenSlider(images, item["Код"]);
        });
      });
      imgContainer.appendChild(img);
      mediaContainer.appendChild(imgContainer);

      // Код товара с иконкой копирования
      const codeContainer = document.createElement("div");
      codeContainer.className = "item-code";
      codeContainer.style.display = "flex";
      codeContainer.style.alignItems = "center";
      codeContainer.style.marginTop = "8px";
      codeContainer.style.cursor = "pointer";

      const codeText = document.createElement("span");
      codeText.textContent = item["Код"];
      codeText.style.fontSize = "12px";
      codeText.style.color = "#585151";

      const copyIcon = document.createElement("i");
      copyIcon.className = "ri-file-copy-line";
      copyIcon.style.cursor = "pointer";
      copyIcon.style.marginLeft = "5px";
      copyIcon.style.color = "#585151";

      codeContainer.addEventListener("click", () => {
        navigator.clipboard.writeText(item["Код"]).then(() => {
          copyIcon.className = "ri-check-line";
          copyIcon.style.color = "orange";
          setTimeout(() => {
            copyIcon.className = "ri-file-copy-line";
            copyIcon.style.color = "#585151";
          }, 2000);
        });
      });

      codeContainer.appendChild(codeText);
      codeContainer.appendChild(copyIcon);
      mediaContainer.appendChild(codeContainer);

      card.appendChild(mediaContainer);

      // Детали товара: название, кнопки, цена, количество, дата, сумма
      const details = document.createElement("div");
      details.className = "item-details";

      // Заголовок с названием и кнопками
      const header = document.createElement("div");
      header.className = "item-header";
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "flex-start";

      const nameSpan = document.createElement("span");
      nameSpan.className = "item-name";
      nameSpan.textContent = item["Наименование"];
      header.appendChild(nameSpan);

      // Кнопки справа
      const actionButtonsContainer = document.createElement("div");
      actionButtonsContainer.style.display = "flex";
      actionButtonsContainer.style.flexDirection = "column";
      actionButtonsContainer.style.alignItems = "flex-end";

      // Кнопка удаления
      const removeBtn = document.createElement("button");
      removeBtn.className = "item-remove";
      removeBtn.title = "Удалить товар";
      removeBtn.style.fontSize = "24px";
      removeBtn.style.color = "#777";
      removeBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
      removeBtn.addEventListener("click", () => {
        // Удаляем товар из локальных данных (root.data)
        root.data = root.data.filter((prod) => prod["Код"] !== item["Код"]);
        applyMobileSortAndGroup();
        updateCartSummaryMobile();
      });
      actionButtonsContainer.appendChild(removeBtn);

      // Кнопка добавления в избранное
      const favBtn = document.createElement("button");
      favBtn.className = "item-fav";
      favBtn.title = "Добавить в избранное";
      favBtn.innerHTML = '<i class="ri-heart-line"></i>';
      favBtn.style.color = "#e93535";
      favBtn.style.background = "transparent";
      favBtn.style.fontSize = "24px";
      favBtn.style.border = "none";
      favBtn.addEventListener("click", () => {
        showMobilePopup(`Товар ${item["Код"]} добавлен в избранное`, 1500);
      });
      actionButtonsContainer.appendChild(favBtn);

      header.appendChild(actionButtonsContainer);
      details.appendChild(header);

      // Блок цены и управления количеством
      const info = document.createElement("div");
      info.className = "item-info";

      const priceDiv = document.createElement("div");
      priceDiv.className = "item-price";
      priceDiv.textContent = item["Цена"] + " ₽";
      const perUnitSpan = document.createElement("span");
      perUnitSpan.textContent = " за ед.";
      perUnitSpan.style.fontSize = "12px";
      perUnitSpan.style.color = "#777";
      priceDiv.appendChild(perUnitSpan);

      const minQtySpan = document.createElement("span");
      minQtySpan.className = "min-qty-info";
      minQtySpan.textContent = " мин: " + (item["Мин. Кол."] || 1);
      minQtySpan.style.fontSize = "12px";
      minQtySpan.style.color = "#777";
      priceDiv.appendChild(minQtySpan);
      info.appendChild(priceDiv);

      // Управление количеством
      const quantityDiv = document.createElement("div");
      quantityDiv.className = "item-quantity";

      const minusBtn = document.createElement("button");
      minusBtn.className = "qty-btn minus";
      minusBtn.title = "Уменьшить количество";
      minusBtn.innerHTML = '<i class="ri-subtract-line"></i>';

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.className = "item-qty";
      qtyInput.min = item["Мин. Кол."] || 1;
      qtyInput.value = item.quantity || item["Мин. Кол."] || 1;
      qtyInput.addEventListener("change", () => {
        let qty = parseInt(qtyInput.value) || 1;
        if (qty < (item["Мин. Кол."] || 1)) {
          qty = item["Мин. Кол."] || 1;
        }
        item.quantity = qty;
        qtyInput.value = qty;
        updateMobileItemTotal(card, item);
        updateCartSummaryMobile();
      });

      const plusBtn = document.createElement("button");
      plusBtn.className = "qty-btn plus";
      plusBtn.title = "Увеличить количество";
      plusBtn.innerHTML = '<i class="ri-add-line"></i>';
      plusBtn.addEventListener("click", () => {
        let qty = parseInt(qtyInput.value) || 1;
        qty++;
        item.quantity = qty;
        qtyInput.value = qty;
        updateMobileItemTotal(card, item);
        updateCartSummaryMobile();
      });

      minusBtn.addEventListener("click", () => {
        let qty = parseInt(qtyInput.value) || 1;
        if (qty > (item["Мин. Кол."] || 1)) {
          qty--;
          item.quantity = qty;
          qtyInput.value = qty;
          updateMobileItemTotal(card, item);
          updateCartSummaryMobile();
        }
      });

      quantityDiv.appendChild(minusBtn);
      quantityDiv.appendChild(qtyInput);
      quantityDiv.appendChild(plusBtn);
      info.appendChild(quantityDiv);
      details.appendChild(info);

      // Блок с датой доставки и суммой
      const deliveryInfoContainer = document.createElement("div");
      deliveryInfoContainer.style.display = "flex";
      deliveryInfoContainer.style.justifyContent = "space-between";
      deliveryInfoContainer.style.alignItems = "center";
      deliveryInfoContainer.style.fontSize = "12px";
      deliveryInfoContainer.style.color = "#777";

      const deliveryDateSpan = document.createElement("span");
      deliveryDateSpan.className = "delivery-date";
      deliveryDateSpan.textContent = "Дата доставки: " + item.deliveryDate;

      const sumSpan = document.createElement("span");
      sumSpan.className = "item-sum";
      const calcSum = item["Цена"] * (item.quantity || 1);
      sumSpan.textContent = "сумма: " + calcSum.toFixed(2) + " ₽";

      deliveryInfoContainer.appendChild(deliveryDateSpan);
      deliveryInfoContainer.appendChild(sumSpan);
      details.appendChild(deliveryInfoContainer);

      card.appendChild(details);
      deliveryContainer.appendChild(card);
    });

    // Рисуем товары без остатков (если имеются)
    if (outOfStockItems.length > 0) {
      const outOfStockSection = renderOutOfStockSection(outOfStockItems);
      deliveryContainer.appendChild(outOfStockSection);
    }

    updateCartSummaryMobile();
  }

  /**
   * Рендерит уведомляющий блок + карточки товаров без остатков (outOfStockItems).
   * 1) Уведомляющая карточка остаётся как есть (массовое удаление, массовое "в избранное").
   * 2) Каждая карточка также получает свои кнопки удаления / избранного, стилизованные (в сером).
   */
  function renderOutOfStockSection(outOfStockItems) {
    const section = document.createElement("div");
    section.className = "out-of-stock-section";

    // Уведомляющая карточка (массовое удаление и добавление в избранное)
    const notificationCard = document.createElement("div");
    notificationCard.className = "notification-card";
    notificationCard.style.padding = "10px";
    notificationCard.style.backgroundColor = "#2f8dac";
    notificationCard.style.borderRadius = "8px";
    notificationCard.style.marginBottom = "10px";
    notificationCard.style.display = "flex";
    notificationCard.style.justifyContent = "space-between";
    notificationCard.style.alignItems = "center";

    const notifText = document.createElement("span");
    notifText.textContent = "Есть позиции без остатков:";
    notifText.style.fontSize = "20px";

    // Кнопка массового удаления
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "notif-delete-button";
    deleteBtn.style.background = "transparent";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.innerHTML =
      '<i class="ri-delete-bin-line" style="font-size:33px; color:#ffffff;"></i>';
    deleteBtn.addEventListener("click", () => {
      outOfStockItems.forEach((outItem) => {
        root.data = root.data.filter((prod) => prod["Код"] !== outItem["Код"]);
      });
      applyMobileSortAndGroup();
      updateCartSummaryMobile();
    });

    // Кнопка массового добавления в избранное
    const favBtn = document.createElement("button");
    favBtn.className = "notif-fav-button";
    favBtn.style.background = "transparent";
    favBtn.style.border = "none";
    favBtn.style.cursor = "pointer";
    favBtn.innerHTML =
      '<i class="ri-heart-line" style="font-size:33px; color:#ffffff;"></i>';
    favBtn.addEventListener("click", () => {
      showMobilePopup("Товары без остатков добавлены в избранное", 1500);
    });

    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.appendChild(favBtn);
    btnContainer.appendChild(deleteBtn);

    notificationCard.appendChild(notifText);
    notificationCard.appendChild(btnContainer);
    section.appendChild(notificationCard);

    // Рендерим каждую карточку товара без остатков
    outOfStockItems.forEach((item, index) => {
      // Для товаров без остатков сбрасываем дату доставки
      item.deliveryDate = "";

      const card = document.createElement("div");
      card.className = "mobile-cart-item out-of-stock";
      card.setAttribute("data-price", item["Цена"]);
      card.style.backgroundColor = "#ffffff";
      card.style.marginTop = "10px";
      card.style.border = "1px solid #ddd";
      card.style.borderRadius = "8px";
      card.style.padding = "10px";

      // Медиа-блок (без чекбокса)
      const mediaContainer = document.createElement("div");
      mediaContainer.className = "media-container";
      mediaContainer.style.display = "flex";
      mediaContainer.style.flexDirection = "column";
      mediaContainer.style.alignItems = "left";
      mediaContainer.style.gap = "10px";

      const imgContainer = document.createElement("div");
      imgContainer.className = "item-image-container";
      imgContainer.style.position = "relative";
      imgContainer.style.backgroundColor = "#e0e0e0";
      imgContainer.style.borderRadius = "8px";
      imgContainer.style.overflow = "hidden";
      imgContainer.style.aspectRatio = "1 / 1";

      const img = document.createElement("img");
      img.className = "item-image";
      img.src = item["Изображение"];
      img.alt = "Изображение товара (no-stock) " + index;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.cursor = "pointer";
      // Применяем серый фильтр
      img.style.filter = "grayscale(100%)";
      img.addEventListener("click", () => {
        loadProductImages(item["Код"]).then((images) => {
          if (!images || images.length === 0) {
            images = [img.dataset.fullsrc || img.src];
          }
          showFullScreenSlider(images, item["Код"]);
        });
      });
      imgContainer.appendChild(img);
      mediaContainer.appendChild(imgContainer);

      // Код товара (без чекбокса)
      const codeContainer = document.createElement("div");
      codeContainer.className = "item-code";
      codeContainer.style.display = "flex";
      codeContainer.style.alignItems = "center";
      codeContainer.style.marginTop = "8px";
      codeContainer.style.cursor = "pointer";

      const codeText = document.createElement("span");
      codeText.textContent = item["Код"];
      codeText.style.fontSize = "12px";
      codeText.style.color = "#888";
      const copyIcon = document.createElement("i");
      copyIcon.className = "ri-file-copy-line";
      copyIcon.style.cursor = "pointer";
      copyIcon.style.marginLeft = "5px";
      copyIcon.style.color = "#888";

      codeContainer.addEventListener("click", () => {
        navigator.clipboard.writeText(item["Код"]).then(() => {
          copyIcon.className = "ri-check-line";
          copyIcon.style.color = "orange";
          setTimeout(() => {
            copyIcon.className = "ri-file-copy-line";
            copyIcon.style.color = "#888";
          }, 2000);
        });
      });
      codeContainer.appendChild(codeText);
      codeContainer.appendChild(copyIcon);
      mediaContainer.appendChild(codeContainer);

      card.appendChild(mediaContainer);

      // Блок деталей (только для чтения, количество = 0)
      const details = document.createElement("div");
      details.className = "item-details";

      // Заголовок с названием и кнопками удаления/избранного для конкретной карточки
      const header = document.createElement("div");
      header.className = "item-header";
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "flex-start";

      const nameSpan = document.createElement("span");
      nameSpan.className = "item-name";
      nameSpan.textContent = item["Наименование"];
      nameSpan.style.color = "#888";
      header.appendChild(nameSpan);

      const actionButtonsContainer = document.createElement("div");
      actionButtonsContainer.style.display = "flex";
      actionButtonsContainer.style.flexDirection = "column";
      actionButtonsContainer.style.alignItems = "flex-end";

      // Кнопка удаления для этой карточки
      const removeBtn = document.createElement("button");
      removeBtn.className = "item-remove out-of-stock-remove";
      removeBtn.title = "Удалить этот товар";
      removeBtn.style.fontSize = "24px";
      removeBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
      removeBtn.style.color = "#888";
      removeBtn.style.background = "transparent";
      removeBtn.style.border = "none";
      removeBtn.addEventListener("click", () => {
        root.data = root.data.filter((prod) => prod["Код"] !== item["Код"]);
        applyMobileSortAndGroup();
        updateCartSummaryMobile();
      });
      actionButtonsContainer.appendChild(removeBtn);

      // Кнопка "в избранное" для этой карточки
      const favBtn = document.createElement("button");
      favBtn.className = "item-fav out-of-stock-fav";
      favBtn.title = "Добавить этот товар в избранное";
      favBtn.innerHTML = '<i class="ri-heart-line"></i>';
      favBtn.style.color = "#e93535";
      favBtn.style.background = "transparent";
      favBtn.style.fontSize = "24px";
      favBtn.style.border = "none";
      favBtn.addEventListener("click", () => {
        showMobilePopup(`Товар ${item["Код"]} добавлен в избранное`, 1500);
      });
      actionButtonsContainer.appendChild(favBtn);

      header.appendChild(actionButtonsContainer);
      details.appendChild(header);

      // Информация о цене (только для чтения, количество = 0)
      const info = document.createElement("div");
      info.className = "item-info";

      const priceDiv = document.createElement("div");
      priceDiv.className = "item-price";
      priceDiv.textContent = item["Цена"] + " ₽";
      const perUnitSpan = document.createElement("span");
      perUnitSpan.textContent = " за ед.";
      perUnitSpan.style.fontSize = "12px";
      priceDiv.style.color = "#888";
      priceDiv.appendChild(perUnitSpan);

      info.appendChild(priceDiv);

      // Контроль количества (отключён, значение 0)
      const quantityDiv = document.createElement("div");
      quantityDiv.className = "item-quantity";
      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.className = "item-qty";
      qtyInput.min = item["Мин. Кол."] || 1;
      qtyInput.value = 0;
      qtyInput.disabled = true;
      quantityDiv.appendChild(qtyInput);
      info.appendChild(quantityDiv);
      details.appendChild(info);

      // Блок для вывода суммы (дата доставки не выводится для товаров без остатков)
      const deliveryInfoContainer = document.createElement("div");
      deliveryInfoContainer.style.display = "flex";
      deliveryInfoContainer.style.justifyContent = "space-between";
      deliveryInfoContainer.style.alignItems = "center";
      deliveryInfoContainer.style.fontSize = "12px";
      deliveryInfoContainer.style.color = "#888";

      // Не выводим дату доставки, оставляем пустой
      const deliveryDateSpan = document.createElement("span");
      deliveryDateSpan.className = "delivery-date";
      deliveryDateSpan.textContent = "";

      const sumSpan = document.createElement("span");
      sumSpan.className = "item-sum";
      sumSpan.textContent = "сумма: 0.00 ₽";

      deliveryInfoContainer.appendChild(deliveryDateSpan);
      deliveryInfoContainer.appendChild(sumSpan);
      details.appendChild(deliveryInfoContainer);

      card.appendChild(details);
      section.appendChild(card);
    });

    return section;
  }

  /**
   * Функция, рендерящая мобильные карточки, разбитые на группы по `deliveryDate`.
   * inStockItems - товары с остатками (уже отсортированные), outOfStockItems - без остатков.
   */
  function renderMobileGroupedView(inStockItems, outOfStockItems) {
    // Очищаем контейнер
    deliveryContainer.innerHTML = "";

    // Переносим (или пересоздаём) mobileFuncRow
    if (!mobileFuncRow) {
      mobileFuncRow = document.createElement("div");
      mobileFuncRow.className = "mobile-functional-row";
      mobileFuncRow.style.display = "flex";
      mobileFuncRow.style.justifyContent = "space-between";
      mobileFuncRow.style.alignItems = "center";
      mobileFuncRow.style.padding = "10px";
    }
    deliveryContainer.appendChild(mobileFuncRow);
    renderMobileFunctionalRow();

    // Группируем товары (только inStock!)
    const grouped = inStockItems.reduce((acc, item) => {
      const d = item.deliveryDate || "Неизвестная дата";
      if (!acc[d]) acc[d] = [];
      acc[d].push(item);
      return acc;
    }, {});

    // Отрисовываем каждый блок
    Object.keys(grouped).forEach((date) => {
      const groupBlock = document.createElement("div");
      groupBlock.className = "mobile-group-block";
      groupBlock.style.marginBottom = "20px";

      const groupHeader = document.createElement("h3");
      groupHeader.textContent = "Доставка: " + date;
      groupHeader.style.backgroundColor = "#f2f2f2";
      groupHeader.style.padding = "8px";
      groupHeader.style.borderRadius = "4px";
      groupBlock.appendChild(groupHeader);

      grouped[date].forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "mobile-cart-item";
        card.setAttribute("data-price", item["Цена"]);
        card.style.marginTop = "10px";
        card.style.border = "1px solid #ddd";
        card.style.borderRadius = "8px";
        card.style.padding = "10px";

        // Чекбокс
        const mediaContainer = document.createElement("div");
        mediaContainer.className = "media-container";
        mediaContainer.style.display = "flex";
        mediaContainer.style.flexDirection = "column";
        mediaContainer.style.alignItems = "left";
        mediaContainer.style.gap = "10px";

        const checkboxContainer = document.createElement("div");
        checkboxContainer.className = "mobile-checkbox-above";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "mobile-select-checkbox";
        checkbox.style.width = "24px";
        checkbox.style.height = "24px";
        checkbox.checked = !!item.selected;
        checkbox.addEventListener("change", () => {
          item.selected = checkbox.checked;
          updateCartSummaryMobile();
          updateMobileSelectAllCheckbox();
        });
        checkboxContainer.appendChild(checkbox);
        mediaContainer.appendChild(checkboxContainer);

        // Картинка
        const imgContainer = document.createElement("div");
        imgContainer.className = "item-image-container";
        imgContainer.style.position = "relative";
        imgContainer.style.backgroundColor = "#fff";
        imgContainer.style.borderRadius = "8px";
        imgContainer.style.overflow = "hidden";
        imgContainer.style.aspectRatio = "1 / 1";

        const img = document.createElement("img");
        img.className = "item-image";
        img.src = item["Изображение"];
        img.alt = "Изображение товара " + (index + 1);
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.cursor = "pointer";
        img.addEventListener("click", () => {
          loadProductImages(item["Код"]).then((images) => {
            if (!images || images.length === 0) {
              images = [img.dataset.fullsrc || img.src];
            }
            showFullScreenSlider(images, item["Код"]);
          });
        });
        imgContainer.appendChild(img);
        mediaContainer.appendChild(imgContainer);
        card.appendChild(mediaContainer);

        // Детали
        const details = document.createElement("div");
        details.className = "item-details";

        const header = document.createElement("div");
        header.className = "item-header";
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "flex-start";

        const nameSpan = document.createElement("span");
        nameSpan.className = "item-name";
        nameSpan.textContent = item["Наименование"];
        header.appendChild(nameSpan);

        // Кнопки справа
        const actionButtonsContainer = document.createElement("div");
        actionButtonsContainer.style.display = "flex";
        actionButtonsContainer.style.flexDirection = "column";
        actionButtonsContainer.style.alignItems = "flex-end";

        const removeBtn = document.createElement("button");
        removeBtn.className = "item-remove";
        removeBtn.title = "Удалить товар";
        removeBtn.style.fontSize = "24px";
        removeBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
        removeBtn.addEventListener("click", () => {
          // Удаляем товар
          root.data = root.data.filter((prod) => prod["Код"] !== item["Код"]);
          // Перерисовываем с учётом сортировки/группировки
          applyMobileSortAndGroup();
          updateCartSummaryMobile();
        });
        actionButtonsContainer.appendChild(removeBtn);

        // Избранное
        const favBtn = document.createElement("button");
        favBtn.className = "item-fav";
        favBtn.title = "Добавить в избранное";
        favBtn.innerHTML = '<i class="ri-heart-line"></i>';
        favBtn.style.color = "#777";
        favBtn.style.background = "transparent";
        favBtn.style.fontSize = "24px";
        favBtn.style.border = "none";
        favBtn.addEventListener("click", () => {
          showMobilePopup(`Товар ${item["Код"]} добавлен в избранное`, 1500);
        });
        actionButtonsContainer.appendChild(favBtn);

        header.appendChild(actionButtonsContainer);
        details.appendChild(header);

        // Цена + количество
        const info = document.createElement("div");
        info.className = "item-info";

        const priceDiv = document.createElement("div");
        priceDiv.className = "item-price";
        priceDiv.textContent = item["Цена"] + " ₽";
        const perUnitSpan = document.createElement("span");
        perUnitSpan.textContent = " за ед.";
        perUnitSpan.style.fontSize = "12px";
        perUnitSpan.style.color = "#777";
        priceDiv.appendChild(perUnitSpan);

        const minQtySpan = document.createElement("span");
        minQtySpan.className = "min-qty-info";
        minQtySpan.textContent = " мин: " + (item["Мин. Кол."] || 1);
        minQtySpan.style.fontSize = "12px";
        minQtySpan.style.color = "#777";
        priceDiv.appendChild(minQtySpan);
        info.appendChild(priceDiv);

        const quantityDiv = document.createElement("div");
        quantityDiv.className = "item-quantity";

        const minusBtn = document.createElement("button");
        minusBtn.className = "qty-btn minus";
        minusBtn.title = "Уменьшить количество";
        minusBtn.innerHTML = '<i class="ri-subtract-line"></i>';

        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.className = "item-qty";
        qtyInput.min = item["Мин. Кол."] || 1;
        qtyInput.value = item.quantity || 1;
        qtyInput.addEventListener("change", () => {
          let qty = parseInt(qtyInput.value) || 1;
          if (qty < (item["Мин. Кол."] || 1)) {
            qty = item["Мин. Кол."] || 1;
          }
          item.quantity = qty;
          qtyInput.value = qty;
          updateMobileItemTotal(card, item);
          updateCartSummaryMobile();
        });

        const plusBtn = document.createElement("button");
        plusBtn.className = "qty-btn plus";
        plusBtn.title = "Увеличить количество";
        plusBtn.innerHTML = '<i class="ri-add-line"></i>';
        plusBtn.addEventListener("click", () => {
          let qty = parseInt(qtyInput.value) || 1;
          qty++;
          item.quantity = qty;
          qtyInput.value = qty;
          updateMobileItemTotal(card, item);
          updateCartSummaryMobile();
        });

        minusBtn.addEventListener("click", () => {
          let qty = parseInt(qtyInput.value) || 1;
          if (qty > (item["Мин. Кол."] || 1)) {
            qty--;
            item.quantity = qty;
            qtyInput.value = qty;
            updateMobileItemTotal(card, item);
            updateCartSummaryMobile();
          }
        });

        quantityDiv.appendChild(minusBtn);
        quantityDiv.appendChild(qtyInput);
        quantityDiv.appendChild(plusBtn);
        info.appendChild(quantityDiv);
        details.appendChild(info);

        // Доставка + сумма
        const deliveryInfoContainer = document.createElement("div");
        deliveryInfoContainer.style.display = "flex";
        deliveryInfoContainer.style.justifyContent = "space-between";
        deliveryInfoContainer.style.alignItems = "center";
        deliveryInfoContainer.style.fontSize = "12px";
        deliveryInfoContainer.style.color = "#777";

        const deliveryDateSpan = document.createElement("span");
        deliveryDateSpan.className = "delivery-date";
        deliveryDateSpan.textContent = "Дата доставки: " + item.deliveryDate;

        const sumSpan = document.createElement("span");
        sumSpan.className = "item-sum";
        sumSpan.textContent =
          "сумма: " + (item["Цена"] * (item.quantity || 1)).toFixed(2) + " ₽";

        deliveryInfoContainer.appendChild(deliveryDateSpan);
        deliveryInfoContainer.appendChild(sumSpan);
        details.appendChild(deliveryInfoContainer);

        card.appendChild(details);
        groupBlock.appendChild(card);
      });

      deliveryContainer.appendChild(groupBlock);
    });

    // В самом конце рисуем блок "без остатков"
    if (outOfStockItems && outOfStockItems.length > 0) {
      const outOfStockSection = renderOutOfStockSection(outOfStockItems);
      deliveryContainer.appendChild(outOfStockSection);
    }

    updateCartSummaryMobile();
  }

  function updateMobileItemTotal(card, item) {
    const sumSpan = card.querySelector(".item-sum");
    sumSpan.textContent =
      "сумма: " + (item["Цена"] * (item.quantity || 1)).toFixed(2) + " ₽";
    sumSpan.style.fontSize = "12px";
    sumSpan.style.color = "#777";
  }

  function updateCartSummaryMobile() {
    let total = 0;
    let count = 0;
    // Суммируем только те товары, у которых item.selected === true
    root.data.forEach((item) => {
      if (item.selected) {
        const qty = item.quantity || 1;
        total += parseFloat(item["Цена"]) * qty;
        count++;
      }
    });
    // Обновляем элементы внутри текущего shadow root:
    const summaryValueElem = root.querySelector(".summary-value");
    if (summaryValueElem)
      summaryValueElem.textContent = total.toFixed(2) + " ₽";
    const totalItemsElem = root.getElementById("total-items");
    if (totalItemsElem) totalItemsElem.textContent = count;

    const checkoutTotalElem = root.querySelector(".checkout-total-sum");
    if (checkoutTotalElem) {
      checkoutTotalElem.textContent =
        "Сумма к оплате: " + total.toFixed(2) + " ₽";
    }

    updateMobileSelectAllCheckbox();
  }

  // Функция создания функциональной строки для мобильного режима (Новый вариант)
  function renderMobileFunctionalRow() {
    if (!mobileFuncRow) {
      mobileFuncRow = document.createElement("div");
      mobileFuncRow.className = "mobile-functional-row";
      mobileFuncRow.style.display = "flex";
      mobileFuncRow.style.justifyContent = "space-between";
      mobileFuncRow.style.alignItems = "center";
      mobileFuncRow.style.padding = "10px";
      mobileFuncRow.style.borderBottom = "1px solid #ccc";
      deliveryContainer.insertBefore(
        mobileFuncRow,
        deliveryContainer.firstChild
      );
    }
    mobileFuncRow.innerHTML = "";

    function createIconButton(iconClass, color, title, onClick) {
      const button = document.createElement("div");
      button.className = "icon-button";
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.width = "40px";
      button.style.height = "40px";
      button.style.borderRadius = "8px";
      button.style.backgroundColor = "#F8F9FA";
      button.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
      button.style.cursor = "pointer";

      const icon = document.createElement("i");
      icon.className = iconClass;
      icon.style.fontSize = "24px";
      icon.style.color = color;
      icon.title = title;

      button.appendChild(icon);
      button.addEventListener("click", onClick);

      return button;
    }

    // Левый блок: чекбокс "Выбрать все"
    const leftGroup = document.createElement("div");
    leftGroup.className = "mobile-func-left";
    leftGroup.style.display = "flex";
    leftGroup.style.gap = "5px";
    leftGroup.style.alignItems = "center";
    leftGroup.style.paddingLeft = "12px";
    leftGroup.style.paddingRight = "8px";
    leftGroup.style.paddingTop = "5px";
    leftGroup.style.paddingBottom = "5px";

    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.className = "mobile-select-all-checkbox";
    selectAllCheckbox.style.width = "24px";
    selectAllCheckbox.style.height = "24px";
    selectAllCheckbox.addEventListener("change", () => {
      const checked = selectAllCheckbox.checked;
      root.data.forEach((item) => {
        item.selected = checked;
      });
      // пересобираем UI
      applyMobileSortAndGroup();
      updateCartSummaryMobile();
    });

    const selectAllLabel = document.createElement("span");
    selectAllLabel.innerHTML = '<i class="ri-check-double-fill"></i>';
    selectAllLabel.className = "mobile-select-all-label";
    selectAllLabel.style.fontSize = "24px";
    selectAllLabel.style.cursor = "pointer";
    selectAllLabel.style.color = "#555555";
    selectAllLabel.addEventListener("click", () => selectAllCheckbox.click());

    leftGroup.appendChild(selectAllCheckbox);
    leftGroup.appendChild(selectAllLabel);

    // Правый блок: кнопки Excel, PDF, избранное, удаление, сортировка, перенос
    const rightGroup = document.createElement("div");
    rightGroup.className = "mobile-func-right";
    rightGroup.style.display = "flex";
    rightGroup.style.alignItems = "center";
    rightGroup.style.gap = "7.5px";

    const sortButton = createIconButton(
      "ri-arrow-up-down-line",
      "#555555",
      "Сортировка",
      () => showSortModal()
    );

    const excelButton = createIconButton(
      "ri-file-excel-line",
      "#008000",
      "Скачать Excel (выбранные товары)",
      () => {
        const selected = root.data.filter((item) => item.selected);
        downloadExcel(selected.length ? selected : root.data);
      }
    );

    const pdfButton = createIconButton(
      "ri-file-pdf-2-line",
      "#D32F2F",
      "Скачать PDF (выбранные товары)",
      () => {
        const selected = root.data.filter((item) => item.selected);
        downloadPDF(selected.length ? selected : root.data);
      }
    );

    const transferButton = createIconButton(
      "",
      "#555555",
      "Перенести выбранные товары в другую корзину",
      () => {
        const selected = root.data.filter((item) => item.selected);
        if (selected.length === 0) {
          showMobilePopup("Выберите товары для перемещения в другую корзину");
        } else {
          showTransferPopup();
        }
      }
    );
    transferButton.innerHTML =
      '<i class="ri-corner-up-right-double-fill" style="font-size:22px; color: #555555;"></i><i class="ri-shopping-cart-2-line" style="font-size:22px; color: #555555;"></i>';
    transferButton.style.width = "60px";

    const favoritesButton = createIconButton(
      "ri-heart-line",
      "#555555",
      "Добавить выбранные товары в избранное",
      () => {
        const selected = root.data.filter((item) => item.selected);
        if (selected.length === 0) {
          showMobilePopup("Выберите товары для добавления в избранное");
        } else {
          showMobilePopup("Выбранные товары добавлены в избранное", 1500);
        }
      }
    );

    const deleteButton = createIconButton(
      "ri-delete-bin-6-line",
      "#555555",
      "Удалить выбранные товары",
      () => {
        const selected = root.data.filter((item) => item.selected);
        if (selected.length === 0) {
          showMobilePopup("Выберите товары для удаления");
        } else {
          root.data = root.data.filter((item) => !item.selected);
          applyMobileSortAndGroup();
          updateCartSummaryMobile();
        }
      }
    );

    rightGroup.appendChild(excelButton);
    rightGroup.appendChild(pdfButton);
    rightGroup.appendChild(favoritesButton);
    rightGroup.appendChild(deleteButton);
    rightGroup.appendChild(sortButton);
    rightGroup.appendChild(transferButton);

    mobileFuncRow.appendChild(leftGroup);
    mobileFuncRow.appendChild(rightGroup);

    updateMobileSelectAllCheckbox();
  }

  // ===== ВСПЛЫВАЮЩИЕ ОКНА (мобильные) =====
  function showMobilePopup(message, duration = 1500) {
    const popupOverlay = document.createElement("div");
    popupOverlay.style.position = "fixed";
    popupOverlay.style.top = "0";
    popupOverlay.style.left = "0";
    popupOverlay.style.padding = "10px";
    popupOverlay.style.width = "100vw";
    popupOverlay.style.height = "100vh";
    popupOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    popupOverlay.style.backdropFilter = "blur(3px)";
    popupOverlay.style.display = "flex";
    popupOverlay.style.justifyContent = "center";
    popupOverlay.style.alignItems = "center";
    popupOverlay.style.zIndex = "3000";

    const popupBox = document.createElement("div");
    popupBox.style.backgroundColor = "rgba(255,255,255,0.9)";
    popupBox.style.borderRadius = "10px";
    popupBox.style.padding = "20px";
    popupBox.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    popupBox.textContent = message;

    popupOverlay.appendChild(popupBox);
    document.body.appendChild(popupOverlay);

    setTimeout(() => {
      popupOverlay.classList.add("fadeOut");
      setTimeout(() => {
        popupOverlay.remove();
      }, 300);
    }, duration);
  }

  function showTransferPopup() {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.padding = "10px";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.3)";
    overlay.style.backdropFilter = "blur(3px)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "3000";

    const popup = document.createElement("div");
    popup.style.backgroundColor = "rgba(255,255,255,0.95)";
    popup.style.borderRadius = "10px";
    popup.style.padding = "20px";
    popup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    popup.style.minWidth = "250px";
    popup.style.position = "relative";

    const title = document.createElement("h3");
    title.textContent = "Куда переместить?";
    title.style.marginBottom = "10px";
    popup.appendChild(title);

    const options = ["Корзина 1", "Корзина 2", "ИП Иванов", "ООО ПромТоргСтол"];
    options.forEach((optionText) => {
      const optionBtn = document.createElement("button");
      optionBtn.textContent = optionText;
      optionBtn.style.margin = "5px";
      optionBtn.style.padding = "8px 12px";
      optionBtn.style.border = "none";
      optionBtn.style.borderRadius = "6px";
      optionBtn.style.backgroundColor = "#ff8420";
      optionBtn.style.color = "#fff";
      optionBtn.style.cursor = "pointer";
      optionBtn.addEventListener("click", () => {
        overlay.remove();
        showMobilePopup(`Товары перенесены в ${optionText}`, 1500);
      });
      popup.appendChild(optionBtn);
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "5px";
    closeBtn.style.right = "5px";
    closeBtn.style.background = "transparent";
    closeBtn.style.border = "none";
    closeBtn.style.fontSize = "18px";
    closeBtn.style.cursor = "pointer";
    closeBtn.addEventListener("click", () => {
      overlay.remove();
    });
    popup.appendChild(closeBtn);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  function initMobileHeaderButtons() {
    const headerTitle = document.querySelector(".header-title");
    if (!headerTitle) return;

    let mobileHeaderButtons = headerTitle.querySelector(
      ".mobile-header-buttons"
    );
    if (!mobileHeaderButtons) {
      mobileHeaderButtons = document.createElement("div");
      mobileHeaderButtons.className = "mobile-header-buttons";
      mobileHeaderButtons.style.display = "flex";
      mobileHeaderButtons.style.gap = "10px";
      mobileHeaderButtons.style.marginTop = "10px";
      headerTitle.appendChild(mobileHeaderButtons);
    }

    mobileHeaderButtons.innerHTML = "";

    const sortButton = createIconButton(
      "ri-arrow-up-down-line",
      "#555555",
      "Сортировка",
      () => showSortModal()
    );
    const excelButton = createIconButton(
      "ri-file-excel-line",
      "#008000",
      "Скачать Excel (выбранные товары)",
      () => {
        const selected = root.data.filter((item) => item.selected);
        downloadExcel(selected.length ? selected : root.data);
      }
    );
    const pdfButton = createIconButton(
      "ri-file-pdf-2-line",
      "#D32F2F",
      "Скачать PDF (выбранные товары)",
      () => {
        const selected = root.data.filter((item) => item.selected);
        downloadPDF(selected.length ? selected : root.data);
      }
    );

    mobileHeaderButtons.appendChild(sortButton);
    mobileHeaderButtons.appendChild(excelButton);
    mobileHeaderButtons.appendChild(pdfButton);

    function createIconButton(iconClass, color, title, onClick) {
      const button = document.createElement("button");
      button.style.backgroundColor = "transparent";
      button.style.border = "none";
      button.style.cursor = "pointer";

      const icon = document.createElement("i");
      icon.className = iconClass;
      icon.style.fontSize = "24px";
      icon.style.color = color;
      icon.title = title;

      button.appendChild(icon);
      button.addEventListener("click", onClick);

      return button;
    }
  }

  // Прикрепляем функцию showSortModal к window, чтобы она была глобально доступна
  window.showSortModal = function () {
    const overlay = document.createElement("div");
    overlay.className = "mobile-sort-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    overlay.style.backdropFilter = "blur(3px)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "1500";

    const modal = document.createElement("div");
    modal.className = "mobile-sort-modal";
    modal.style.background = "#fff";
    modal.style.borderRadius = "8px";
    modal.style.padding = "20px";
    modal.style.width = "90%";
    modal.style.maxWidth = "400px";
    modal.style.position = "relative";

    const closeBtn = document.createElement("button");
    closeBtn.className = "mobile-sort-close";
    closeBtn.textContent = "✕";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "10px";
    closeBtn.style.right = "15px";
    closeBtn.style.background = "transparent";
    closeBtn.style.border = "none";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.cursor = "pointer";
    // После закрытия окна применяем выбранные опции сортировки/группировки
    closeBtn.addEventListener("click", () => {
      overlay.remove();
      applyMobileSortAndGroup();
    });

    modal.appendChild(closeBtn);

    const optionsList = document.createElement("div");
    optionsList.className = "mobile-sort-options";
    optionsList.style.display = "flex";
    optionsList.style.flexDirection = "column";
    optionsList.style.gap = "10px";

    // === Блок "Группировка"
    const groupLabel = document.createElement("div");
    groupLabel.textContent = "Группировка";
    groupLabel.style.fontWeight = "bold";
    groupLabel.style.margin = "30px 0 5px";
    optionsList.appendChild(groupLabel);

    const groupOptions = ["По дате доставки"];
    const groupOptionElems = [];

    groupOptions.forEach((optionText) => {
      const option = document.createElement("div");
      option.className = "mobile-sort-option";
      option.style.display = "flex";
      option.style.justifyContent = "space-between";
      option.style.alignItems = "center";
      option.style.padding = "10px";
      option.style.border = "1px solid #ccc";
      option.style.borderRadius = "4px";
      option.style.cursor = "pointer";

      const textSpan = document.createElement("span");
      textSpan.textContent = optionText;

      const checkIcon = document.createElement("i");
      checkIcon.className = "ri-check-line";
      checkIcon.style.fontSize = "18px";
      checkIcon.style.color = "#f67200";
      checkIcon.style.fontWeight = "bold";
      checkIcon.style.marginLeft = "10px";
      checkIcon.style.display = "none";

      option.appendChild(textSpan);
      option.appendChild(checkIcon);
      optionsList.appendChild(option);
      groupOptionElems.push({ option, text: optionText, checkIcon });

      if (
        root.selectedSortOptions &&
        root.selectedSortOptions.group === optionText
      ) {
        checkIcon.style.display = "inline";
      }

      option.addEventListener("click", () => {
        if (root.selectedSortOptions.group === optionText) {
          root.selectedSortOptions.group = null;
          checkIcon.style.display = "none";
        } else {
          groupOptionElems.forEach(({ checkIcon }) => {
            checkIcon.style.display = "none";
          });
          root.selectedSortOptions.group = optionText;
          checkIcon.style.display = "inline";
        }
      });
    });

    // === Блок "Сортировка"
    const sortLabel = document.createElement("div");
    sortLabel.textContent = "Сортировка";
    sortLabel.style.fontWeight = "bold";
    sortLabel.style.margin = "20px 0 5px";
    optionsList.appendChild(sortLabel);

    const sortOptions = [
      "По дате добавления",
      "Сначала новинки",
      "Сначала дорогие",
      "Сначала дешевые",
      "Сначала дорогие (за ед вложения)",
      "Сначала дешевые (за ед вложения)",
      "По алфавиту",
      "По артикулу",
    ];
    const sortOptionElems = [];

    sortOptions.forEach((optionText) => {
      const option = document.createElement("div");
      option.className = "mobile-sort-option";
      option.style.display = "flex";
      option.style.justifyContent = "space-between";
      option.style.alignItems = "center";
      option.style.padding = "10px";
      option.style.border = "1px solid #ccc";
      option.style.borderRadius = "4px";
      option.style.cursor = "pointer";

      const textSpan = document.createElement("span");
      textSpan.textContent = optionText;

      const iconContainer = document.createElement("div");
      iconContainer.style.display = "flex";
      iconContainer.style.alignItems = "center";
      iconContainer.style.gap = "5px";

      const checkIcon = document.createElement("i");
      checkIcon.className = "ri-check-line";
      checkIcon.style.fontSize = "18px";
      checkIcon.style.color = "#f67200";
      checkIcon.style.fontWeight = "bold";
      checkIcon.style.display = "none";

      const arrowIcon = document.createElement("i");
      arrowIcon.style.fontSize = "16px";
      arrowIcon.style.color = "#f67200";
      arrowIcon.style.display = "none";

      iconContainer.appendChild(checkIcon);
      iconContainer.appendChild(arrowIcon);

      option.appendChild(textSpan);
      option.appendChild(iconContainer);
      optionsList.appendChild(option);
      sortOptionElems.push({ option, text: optionText, checkIcon, arrowIcon });

      if (
        root.selectedSortOptions &&
        root.selectedSortOptions.sort === optionText
      ) {
        checkIcon.style.display = "inline";
        arrowIcon.style.display = "inline";
        arrowIcon.textContent =
          root.selectedSortOptions.sortOrder === "desc" ? "▼" : "▲";
      }

      option.addEventListener("click", () => {
        if (root.selectedSortOptions.sort === optionText) {
          root.selectedSortOptions.sortOrder =
            root.selectedSortOptions.sortOrder === "desc" ? "asc" : "desc";
        } else {
          sortOptionElems.forEach(({ checkIcon, arrowIcon }) => {
            checkIcon.style.display = "none";
            arrowIcon.style.display = "none";
          });
          root.selectedSortOptions.sort = optionText;
          root.selectedSortOptions.sortOrder =
            defaultSortOrder[optionText] || "asc";
        }
        sortOptionElems.forEach(({ text, checkIcon, arrowIcon }) => {
          if (text === root.selectedSortOptions.sort) {
            checkIcon.style.display = "inline";
            arrowIcon.style.display = "inline";
            arrowIcon.textContent =
              root.selectedSortOptions.sortOrder === "desc" ? "▼" : "▲";
          } else {
            checkIcon.style.display = "none";
            arrowIcon.style.display = "none";
          }
        });
      });
    });

    modal.appendChild(optionsList);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  };

  function initCartRendering() {
    if (window.matchMedia("(max-width: 800px)").matches) {
      // Вместо renderMobileCart();
      // вызываем applyMobileSortAndGroup();
      applyMobileSortAndGroup();
      moveSidebarToMobile();
    } else {
      renderDeliveryView();
    }
  }

  // Замените существующую функцию moveSidebarToMobile на следующую:
  function moveSidebarToMobile() {
    const sidebar = root.querySelector(".order-summary");
    if (sidebar) {
      // Скрываем блок с суммой заказа в мобильной версии
      const orderSummaryCard = sidebar.querySelector(".order-summary-card");
      if (orderSummaryCard) {
        orderSummaryCard.style.display = "none";
      }
      // При необходимости скрываем и весь сайдбар
      sidebar.style.display = "none";
    }
    // Рендерим фиксированную строку оформления в нижней части экрана
    renderMobileCheckoutBar();
  }

  // Новая версия функции, которая отрисовывает строку оформления внутри текущего root (шадоу рут)
  function renderMobileCheckoutBar() {
    // Если такая строка уже существует внутри root – удаляем её
    let existingBar = root.querySelector(".mobile-checkout-bar");
    if (existingBar) existingBar.remove();

    const checkoutBar = document.createElement("div");
    checkoutBar.className = "mobile-checkout-bar";
    Object.assign(checkoutBar.style, {
      position: "fixed",
      bottom: "45px",
      left: "0",
      width: "100%",
      backgroundColor: "#fff",
      boxShadow: "0 -2px 5px rgba(0,0,0,0.2)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px",
      zIndex: "2000",
    });

    // Элемент для отображения итоговой суммы
    const totalSumElem = document.createElement("div");
    totalSumElem.className = "checkout-total-sum";
    // Ищем элемент с суммой внутри текущего root
    const summaryValueElem = root.querySelector(".summary-value");
    totalSumElem.textContent =
      "Сумма к оплате: " +
      (summaryValueElem ? summaryValueElem.textContent : "0 ₽");

    // Кнопка оформления заказа
    const checkoutButton = document.createElement("button");
    checkoutButton.className = "checkout-button";
    checkoutButton.textContent = "Оформить заказ";
    Object.assign(checkoutButton.style, {
      padding: "10px 20px",
      backgroundColor: "orange",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    });

    checkoutButton.addEventListener("click", () => {
      // При клике на кнопку ищем внутри текущего root элемент .order-summary-card
      const orderSummaryCard = root.querySelector(".order-summary-card");
      if (orderSummaryCard) {
        showOrderSummaryModal(orderSummaryCard);
      }
    });

    checkoutBar.appendChild(totalSumElem);
    checkoutBar.appendChild(checkoutButton);
    // Вставляем строку в current shadow root
    root.appendChild(checkoutBar);
  }

  // Модальное окно также вставляем в текущий root
  function showOrderSummaryModal(orderSummaryCard) {
    const modalOverlay = document.createElement("div");
    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "3000",
    });

    const modalContent = document.createElement("div");
    Object.assign(modalContent.style, {
      position: "relative",
      background: "#fff",
      padding: "20px",
      borderRadius: "8px",
      maxWidth: "90%",
      maxHeight: "90%",
      overflowY: "auto",
    });

    // Глубокое клонирование order-summary-card (с сохранением всех стилей)
    const orderSummaryClone = orderSummaryCard.cloneNode(true);
    orderSummaryClone.style.display = "block"; // гарантируем видимость
    modalContent.appendChild(orderSummaryClone);

    // Кнопка закрытия модального окна (крестик)
    const closeButton = document.createElement("button");
    closeButton.textContent = "✕";
    Object.assign(closeButton.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      background: "transparent",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
    });
    closeButton.addEventListener("click", () => {
      modalOverlay.remove();
    });
    modalContent.appendChild(closeButton);

    modalOverlay.appendChild(modalContent);

    // Вставляем модальное окно внутрь текущего root, чтобы оно наследовало стили
    root.appendChild(modalOverlay);

    // Обновляем сумму внутри модального окна (если там есть элемент с id "total-to-pay")
    updateModalTotal();
  }

  // Функция обновления элементов с id "total-to-pay" внутри текущего root
  function updateModalTotal() {
    root.querySelectorAll("#total-to-pay").forEach((elem) => {
      elem.textContent = `${totalToPay.toLocaleString()} ₽`;
    });
  }

  /* =======================================
     ДЕСКТОП: ALT+Q = выбрать все
  ======================================= */
  document.addEventListener("click", (event) => {
    if (isAltQPressed) {
      const isInsideSection = event.target.closest(".delivery-section");
      if (!isInsideSection) toggleSelectAll();
    }
  });

  // Загрузка данных из JSON (замените ваш существующий фрагмент)
  fetch("/data/data.json")
    .then((response) => response.json())
    .then((data) => {
      // ГАРАНТИРОВАННО делаем 2 товара без остатков:
      if (data.length >= 2) {
        data[data.length - 1]["Наличие"] = 0;
        data[data.length - 2]["Наличие"] = 0;
      }
      // Далее всё как раньше:
      selectRandomProducts(data); // ваш код, который выбирает рандомное кол-во товаров
      initCartRendering(); // функция переключения десктоп/моб. режима
      recalculateSubtotalAndTotal(); // пересчёт итоговых сумм
      updateValues(); // обновление DOM-элементов с суммами
    })
    .catch((error) => console.error("Ошибка загрузки данных:", error));

  const discountInput = root.getElementById("discount-input");
  const discountPercentInput = root.getElementById("discount-percent");
  if (discountInput && discountPercentInput) {
    discountInput.addEventListener("input", () => {
      discountInput.dataset.manual = true;
      discountPercentInput.dataset.manual = false;
      discount = parseFloat(discountInput.value.replace(/\s/g, "")) || 0;
      discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
      discountPercentInput.value = discountPercent.toFixed(2);
      totalToPay = subtotal - discount;
      updateValues();
    });
    discountPercentInput.addEventListener("input", () => {
      discountPercentInput.dataset.manual = true;
      discountInput.dataset.manual = false;
      discountPercent = parseFloat(discountPercentInput.value) || 0;
      discount = (subtotal * discountPercent) / 100;
      discountInput.value = discount.toFixed(2);
      totalToPay = subtotal - discount;
      updateValues();
      discountInput.dataset.manual = true;
      recalculateSubtotalAndTotal();
    });
  }

  function getCartDate() {
    const lastChangeText = root.querySelector(".last-change-text");
    if (!lastChangeText) return "N/A";
    const text = lastChangeText.textContent;
    const match = text.match(/Последнее изменение:\s*(\d{2}\.\d{2}\.\d{4})/);
    return match ? match[1] : "N/A";
  }

  function downloadExcel(items) {
    const cartDate = getCartDate();
    if (typeof handleDownloadExcel === "function") {
      handleDownloadExcel(items, cartDate);
    } else {
      alert("Функция скачивания Excel не определена.");
    }
  }

  function downloadPDF(items) {
    const cartDate = getCartDate();
    if (typeof handleDownloadPDF === "function") {
      handleDownloadPDF(items, cartDate);
    } else {
      alert("Функция скачивания PDF не определена.");
    }
  }

  document.addEventListener("click", (event) => {
    if (isAltQPressed) {
      const isInsideSection = event.target.closest(".delivery-section");
      if (!isInsideSection) toggleSelectAll();
    }
  });
};
