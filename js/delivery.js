// --- Завёрнутый Скрипт: initDelivery ---
// Этот скрипт должен быть инициализирован извне (например, через shadow root)
// через вызов: window.initDelivery(shadowRoot);
window.initDelivery = function (root = window) {
  /***********************
   * ИНИЦИАЛИЗАЦИЯ ДАННЫХ
   ***********************/
  // Если window.data ещё не определён, задаём его как пустой массив
  window.data = window.data || [];

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
     (без изменений)
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
    const groupedData = groupByDelivery(window.data);
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
      const selected = window.data.filter((item) => item.selected);
      downloadExcel(selected.length ? selected : window.data);
    });
    const downloadPdfButton = document.createElement("button");
    downloadPdfButton.className = "download-pdf";
    downloadPdfButton.textContent = "PDF";
    downloadPdfButton.addEventListener("click", () => {
      const selected = window.data.filter((item) => item.selected);
      downloadPDF(selected.length ? selected : window.data);
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
    renderListSection(window.data);
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
    window.data = window.data.filter((item) => item["Код"] !== productCode);
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
   * В мобильной версии (ширина <= 800px) – открываем.
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
      // Если мы на мобильном
      if (window.matchMedia("(max-width: 800px)").matches) {
        loadProductImages(imageElement.alt).then((images) => {
          // Если нет картинок, fallback
          if (!images || images.length === 0) {
            images = [imageElement.dataset.fullsrc || imageElement.src];
          }
          showFullScreenSlider(images, imageElement.alt);
        });
      }
      // Иначе (десктоп) — вообще ничего не делаем на клик
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
   * showFullScreenSlider(images):
   * - Если images.length < 2 => не показываем стрелки и индикаторы
   * - Иначе показываем, как раньше, с доработкой для мобильного макета:
   *   верхняя часть (2/3 высоты экрана) содержит слайдер, нижняя – информацию о товаре.
   */
  function showFullScreenSlider(images, article) {
    // Размер слайдера (квадратная область)
    const sliderWidth = Math.min(window.innerWidth * 0.9, 600);
    // Отступ между слайдами
    const slideGap = 10;

    // Основной overlay – на всю страницу, с вертикальным делением
    const overlay = document.createElement("div");
    overlay.className = "fullscreen-slider-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.8)",
      display: "flex",
      flexDirection: "column",
      zIndex: "9999",
      overflowY: "auto",
      overflowX: "hidden", // ограничиваем горизонтальную прокрутку
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Верхняя часть (2/3 высоты экрана) для слайдера
    const upperContainer = document.createElement("div");
    Object.assign(upperContainer.style, {
      flex: "0 0 66.66vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
    overlay.appendChild(upperContainer);

    // Нижняя часть (информация о товаре) – высота по содержимому
    const lowerContainer = document.createElement("div");
    Object.assign(lowerContainer.style, {
      width: "100%",
      padding: "16px",
      backgroundColor: "#fff",
      color: "#000",
      boxSizing: "border-box",
    });
    overlay.appendChild(lowerContainer);

    // Контейнер для слайдов внутри верхней части
    const sliderWrapper = document.createElement("div");
    sliderWrapper.style.position = "relative";
    sliderWrapper.style.width = sliderWidth + "px";
    sliderWrapper.style.height = sliderWidth + "px";
    sliderWrapper.style.overflow = "visible";
    upperContainer.appendChild(sliderWrapper);

    // Контейнер самих слайдов (горизонтально)
    const sliderContainer = document.createElement("div");
    Object.assign(sliderContainer.style, {
      display: "flex",
      height: sliderWidth + "px",
      width: (sliderWidth + slideGap) * images.length - slideGap + "px",
      transition: "transform 0.3s ease-out",
    });
    sliderWrapper.appendChild(sliderContainer);

    // Создаем слайды
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

    // Кнопка закрытия (крестик)
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
    if (images.length < 2) {
      // Если изображение одно – показываем описание без стрелок/индикаторов
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

    // Если изображений 2 и более – добавляем навигационные элементы и индикаторы
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

    // Заполнение описательной части с отступами между секциями, таблицами в обёртке с overflow‑x и пустым блоком в конце
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
    window.data = selected;
  }

  function recalculateSubtotalAndTotal() {
    subtotal = 0;
    totalItems = 0;
    window.data = window.data.filter((item) => item.quantity > 0);
    window.data.forEach((item) => {
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
          window.data.length > 0 && window.data.every((item) => item.selected);
        selectAllCheckbox.checked = allSelected;
      }
    }
  }

  /* ====================================================
     МОДУЛЬ МОДЕЛЬНОГО РЕЖИМА – Мобильная версия
     ====================================================
     Здесь вместо таблиц генерируются карточки товаров.
  */
  let mobileFuncRow = null;

  async function renderMobileCart() {
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
    Array.from(deliveryContainer.children).forEach((child) => {
      if (!child.classList.contains("mobile-functional-row")) {
        child.remove();
      }
    });
    renderMobileFunctionalRow();
    window.data.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "mobile-cart-item";
      card.setAttribute("data-price", item["Цена"]);

      // Единый контейнер для чекбокса и изображения (вертикальный стак)
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
      checkbox.addEventListener("change", (e) => {
        item.selected = checkbox.checked;
        updateCartSummaryMobile();
        updateMobileSelectAllCheckbox();
      });
      checkboxContainer.appendChild(checkbox);
      mediaContainer.appendChild(checkboxContainer);

      // Контейнер для изображения – квадратный
      const imgContainer = document.createElement("div");
      imgContainer.className = "item-image-container";
      imgContainer.style.position = "relative";
      imgContainer.style.backgroundColor = "#fff";
      imgContainer.style.borderRadius = "8px";
      imgContainer.style.overflow = "hidden";
      imgContainer.style.aspectRatio = "1 / 1";

      const img = document.createElement("img");
      img.className = "item-image";
      img.src = item["Изображение"] || "https://via.placeholder.com/150";
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

      // Детали товара
      const details = document.createElement("div");
      details.className = "item-details";
      const header = document.createElement("div");
      header.className = "item-header";
      const nameSpan = document.createElement("span");
      nameSpan.className = "item-name";
      nameSpan.textContent = item["Наименование"];
      const removeBtn = document.createElement("button");
      removeBtn.className = "item-remove";
      removeBtn.title = "Удалить товар";
      removeBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
      removeBtn.addEventListener("click", () => {
        window.data = window.data.filter((prod) => prod["Код"] !== item["Код"]);
        renderMobileCart();
        updateCartSummaryMobile();
      });
      header.appendChild(nameSpan);
      header.appendChild(removeBtn);
      details.appendChild(header);

      // Информация о минимальном количестве
      const minQtyInfo = document.createElement("div");
      minQtyInfo.className = "min-qty-info";
      minQtyInfo.textContent = "мин: " + (item["Мин. Кол."] || 1);
      minQtyInfo.style.fontSize = "12px";
      minQtyInfo.style.color = "#777";
      details.appendChild(minQtyInfo);

      // Блок цены и управления количеством
      const info = document.createElement("div");
      info.className = "item-info";
      const priceDiv = document.createElement("div");
      priceDiv.className = "item-price";
      priceDiv.textContent = item["Цена"] + " ₽";
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

      const totalDiv = document.createElement("div");
      totalDiv.className = "item-total";
      totalDiv.textContent =
        (item["Цена"] * (item.quantity || 1)).toFixed(2) + " ₽";
      details.appendChild(totalDiv);

      card.appendChild(details);
      deliveryContainer.appendChild(card);
    });
    updateCartSummaryMobile();
  }

  function updateMobileItemTotal(card, item) {
    const totalDiv = card.querySelector(".item-total");
    totalDiv.textContent =
      (item["Цена"] * (item.quantity || 1)).toFixed(2) + " ₽";
  }

  function updateCartSummaryMobile() {
    let total = 0;
    let count = 0;
    const anySelected = window.data.some((item) => item.selected);
    window.data.forEach((item) => {
      const qty = item.quantity || 1;
      if (anySelected) {
        if (item.selected) {
          total += parseFloat(item["Цена"]) * qty;
          count++;
        }
      } else {
        total += parseFloat(item["Цена"]) * qty;
        count++;
      }
    });
    const summaryValueElem = document.querySelector(".summary-value");
    if (summaryValueElem)
      summaryValueElem.textContent = total.toFixed(2) + " ₽";
    const totalItemsElem = document.getElementById("total-items");
    if (totalItemsElem) totalItemsElem.textContent = count;
    updateMobileSelectAllCheckbox();
  }

  function updateMobileSelectAllCheckbox() {
    if (mobileFuncRow) {
      const selectAllCheckbox = mobileFuncRow.querySelector(
        ".mobile-select-all-checkbox"
      );
      if (selectAllCheckbox) {
        const allSelected =
          window.data.length > 0 && window.data.every((item) => item.selected);
        selectAllCheckbox.checked = allSelected;
      }
    }
  }

  // Функция создания функциональной строки для мобильного режима
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

    // Очищаем содержимое перед обновлением
    mobileFuncRow.innerHTML = "";

    // Функция создания кнопки-иконки
    function createIconButton(iconClass, color, title, onClick) {
      const button = document.createElement("div");
      button.className = "icon-button";
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.width = "40px";
      button.style.height = "40px";
      button.style.borderRadius = "8px"; // Скругленные углы
      button.style.backgroundColor = "#F8F9FA"; // Светлый фон
      button.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)"; // Тень
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

    // Левый блок: только чекбокс "Выбрать все"
    const leftGroup = document.createElement("div");
    leftGroup.className = "mobile-func-left";
    leftGroup.style.display = "flex";
    leftGroup.style.alignItems = "center";
    leftGroup.style.gap = "10px";

    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.className = "mobile-select-all-checkbox";
    selectAllCheckbox.style.width = "24px";
    selectAllCheckbox.style.height = "24px";
    selectAllCheckbox.addEventListener("change", () => {
      const checked = selectAllCheckbox.checked;
      window.data.forEach((item) => {
        item.selected = checked;
      });
      renderMobileCart();
      updateCartSummaryMobile();
    });

    const selectAllLabel = document.createElement("span");
    selectAllLabel.textContent = "Выбрать все";
    selectAllLabel.className = "mobile-select-all-label";
    selectAllLabel.style.cursor = "pointer";
    selectAllLabel.addEventListener("click", () => selectAllCheckbox.click());

    leftGroup.appendChild(selectAllLabel);
    leftGroup.appendChild(selectAllCheckbox);

    // Правый блок: сортировка, Excel, PDF и корзина
    const rightGroup = document.createElement("div");
    rightGroup.className = "mobile-func-right";
    rightGroup.style.display = "flex";
    rightGroup.style.alignItems = "center";
    rightGroup.style.gap = "10px";

    const sortButton = createIconButton(
      "ri-arrow-up-down-line",
      "#555555", // Темно-серый цвет
      "Сортировка",
      () => showSortModal()
    );

    const excelButton = createIconButton(
      "ri-file-excel-line",
      "#008000", // Зеленый значок Excel
      "Скачать Excel (выбранные товары)",
      () => {
        const selected = window.data.filter((item) => item.selected);
        downloadExcel(selected.length ? selected : window.data);
      }
    );

    const pdfButton = createIconButton(
      "ri-file-pdf-2-line",
      "#D32F2F", // Насыщенный красный значок PDF
      "Скачать PDF (выбранные товары)",
      () => {
        const selected = window.data.filter((item) => item.selected);
        downloadPDF(selected.length ? selected : window.data);
      }
    );

    const deleteButton = createIconButton(
      "ri-delete-bin-6-line",
      "#555555", // Темно-серый значок корзины
      "Удалить выбранные товары",
      () => {
        window.data = window.data.filter((item) => !item.selected);
        renderMobileCart();
        updateCartSummaryMobile();
      }
    );

    // Добавляем кнопки в правый блок в требуемом порядке
    rightGroup.appendChild(sortButton);
    rightGroup.appendChild(excelButton);
    rightGroup.appendChild(pdfButton);
    rightGroup.appendChild(deleteButton);

    mobileFuncRow.appendChild(leftGroup);
    mobileFuncRow.appendChild(rightGroup);

    updateMobileSelectAllCheckbox();
  }

  function showSortModal() {
    const overlay = document.createElement("div");
    overlay.className = "mobile-sort-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "2000";

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
    closeBtn.style.left = "10px";
    closeBtn.style.background = "transparent";
    closeBtn.style.border = "none";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.cursor = "pointer";
    closeBtn.addEventListener("click", () => {
      overlay.remove();
    });

    const modalTitle = document.createElement("h3");
    modalTitle.textContent = "Сортировка";
    modalTitle.style.textAlign = "center";
    modalTitle.style.marginBottom = "20px";

    modal.appendChild(closeBtn);
    modal.appendChild(modalTitle);

    const sortOptions = [
      "По дате добавления",
      "По дате доставки",
      "Сначала новинки",
      "Сначала дорогие",
      "Сначала дешевые",
      "Сначала дорогие (за ед вложения)",
      "Сначала дешевые (За ед вложения)",
      "По алфавиту",
      "По артикулу",
      "По размеру скидки",
    ];
    const optionsList = document.createElement("div");
    optionsList.className = "mobile-sort-options";
    optionsList.style.display = "flex";
    optionsList.style.flexDirection = "column";
    optionsList.style.gap = "10px";
    sortOptions.forEach((optionText) => {
      const option = document.createElement("div");
      option.className = "mobile-sort-option";
      option.textContent = optionText;
      option.style.padding = "10px";
      option.style.border = "1px solid #ccc";
      option.style.borderRadius = "4px";
      option.style.cursor = "pointer";
      option.addEventListener("click", () => {
        optionsList.querySelectorAll(".mobile-sort-option").forEach((opt) => {
          opt.classList.remove("selected");
          opt.style.backgroundColor = "";
        });
        option.classList.add("selected");
        option.style.backgroundColor = "#ddd";
      });
      optionsList.appendChild(option);
    });
    modal.appendChild(optionsList);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // Функция переключения рендера в зависимости от ширины экрана
  function initCartRendering() {
    if (window.matchMedia("(max-width: 800px)").matches) {
      renderMobileCart();
      moveSidebarToMobile();
    } else {
      renderDeliveryView();
    }
  }

  // Мобильная доработка: перемещаем содержимое сайдбара
  function moveSidebarToMobile() {
    const sidebar = root.querySelector(".order-summary");
    if (sidebar) {
      sidebar.style.position = "static";
      sidebar.style.width = "100%";
    }
  }

  // Инициализируем рендер после загрузки данных
  initCartRendering();

  /* =======================================
     ФУНКЦИОНАЛ ДЛЯ ДЕСКТОПНОЙ ВЕРСИИ
     (оставляем без изменений)
  ======================================= */
  document.addEventListener("click", (event) => {
    if (isAltQPressed) {
      const isInsideSection = event.target.closest(".delivery-section");
      if (!isInsideSection) toggleSelectAll();
    }
  });

  // Загрузка данных из JSON
  fetch("/data/data.json")
    .then((response) => response.json())
    .then((data) => {
      selectRandomProducts(data);
      initCartRendering();
      recalculateSubtotalAndTotal();
      updateValues();
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
