document.addEventListener("DOMContentLoaded", () => {
  // Элементы управления сайдбаром
  const hideSidebarButton = document.querySelector(".hide-right-sidebar");
  const showSidebarButton = document.querySelector(".show-right-sidebar");
  const orderSummary = document.querySelector(".order-summary");
  const mainContent = document.querySelector(".content");

  const sidebarVisibleByDefault = true;

  // Инициализация состояния сайдбара
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
  let totalItems = 0;
  let shippingCost = 0;
  let subtotal = 0;
  let discount = 0;
  let discountPercent = 14;
  let totalToPay = 0;

  function updateValues() {
    const elements = {
      totalItems: document.getElementById("total-items"),
      shippingCost: document.getElementById("shipping-cost"),
      subtotal: document.getElementById("subtotal"),
      discountInput: document.getElementById("discount-input"),
      discountPercentInput: document.getElementById("discount-percent"),
      totalToPay: document.getElementById("total-to-pay"),
    };

    if (elements.totalItems) {
      elements.totalItems.textContent = totalItems;
    }

    if (elements.shippingCost) {
      elements.shippingCost.textContent = `${shippingCost.toLocaleString()} ₽`;
    }

    if (elements.subtotal) {
      elements.subtotal.textContent = `${subtotal.toLocaleString()} ₽`;
    }

    if (elements.discountInput) {
      elements.discountInput.value = discount.toFixed(2);
    }

    if (elements.discountPercentInput) {
      elements.discountPercentInput.value = discountPercent.toFixed(2);
    }

    if (elements.totalToPay) {
      elements.totalToPay.textContent = `${totalToPay.toLocaleString()} ₽`;
    }
  }

  const deliveryContainer = document.getElementById("delivery-sections");
  const currentDate = new Date();
  const popupImage = document.createElement("img");
  let currentViewMode = "deliveries";

  // **Добавлено:** Получение элементов текста и иконки переключателя
  const toggleText = document.getElementById("toggleText");
  const toggleIcon = document.getElementById("toggleIcon");

  const toggleButton = document.querySelector(".toggle-button");
  toggleButton.addEventListener("click", toggleViewMode);

  function toggleViewMode() {
    if (currentViewMode === "deliveries") {
      currentViewMode = "list";
      toggleText.textContent = "Разделить список на доставки";
      toggleIcon.classList.remove("ri-file-list-3-line");
      toggleIcon.classList.add("ri-box-3-line");
      renderListView();
    } else {
      currentViewMode = "deliveries";
      toggleText.textContent = "Показать списком";
      toggleIcon.classList.remove("ri-box-3-line");
      toggleIcon.classList.add("ri-file-list-3-line");
      renderDeliveryView();
    }
  }

  // Функция парсинга количества дней доставки
  function parseDeliveryDays(logisticString) {
    const match = logisticString.match(/до (\d+) дней/);
    return match ? parseInt(match[1], 10) : 1;
  }

  // Функция расчёта даты доставки
  function calculateDeliveryDate(days) {
    const deliveryDate = new Date(currentDate);
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toLocaleDateString("ru-RU");
  }

  // Функция группировки данных по дате доставки
  function groupByDelivery(data) {
    return data.reduce((acc, item) => {
      const deliveryDays = parseDeliveryDays(item["Логистика"]);
      const deliveryDate = calculateDeliveryDate(deliveryDays);
      if (!acc[deliveryDate]) acc[deliveryDate] = [];
      acc[deliveryDate].push(item);
      return acc;
    }, {});
  }

  // Функция расчёта даты доставки для Excel и PDF
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

  function renderListView() {
    deliveryContainer.innerHTML = "";
    renderListSection(window.data);
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

    const header = createDeliveryHeader(deliveryDate, items);
    section.appendChild(header);

    const content = createDeliveryContent(items);
    section.appendChild(content);

    header.addEventListener("click", (event) => {
      if (isAltQPressed) {
        return;
      }

      if (
        event.target.closest(".collapsed-order-button") ||
        event.target.closest(".header-icon") ||
        event.target.closest(".product-image") ||
        event.target.closest(".select-all-checkbox") // Добавлено, чтобы не срабатывать при клике на чекбокс
      ) {
        return;
      }
      toggleSectionContent(header, content, items);
    });

    return section;
  }

  function createDeliveryHeader(deliveryDate, items) {
    const header = document.createElement("div");
    header.className = "delivery-header";

    // Удаляем добавление чекбокса из заголовка секции
    // Чекбокс теперь находится внутри <th> таблицы

    const headerText = document.createElement("h2");
    headerText.textContent = `Доставка на: ${deliveryDate}`;

    const headerImagesContainer = document.createElement("div");
    headerImagesContainer.className = "header-images-container";
    headerImagesContainer.style.display = "none";

    const headerRight = createHeaderRight(items);

    const arrowSpan = document.createElement("span");
    arrowSpan.className = "arrow";
    arrowSpan.textContent = "▼";

    // Оборачиваем текст в отдельные контейнеры для лучшей стилизации
    const headerLeft = document.createElement("div");
    headerLeft.className = "header-left-container";
    headerLeft.appendChild(headerText);

    header.append(headerLeft, headerImagesContainer, headerRight, arrowSpan);

    return header;
  }

  function createHeaderRight(items) {
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

    const table = createProductsTable(items);
    content.appendChild(table);

    const actionsContainer = createActionsContainer(items);
    content.appendChild(actionsContainer);

    return content;
  }

  function createProductsTable(items) {
    const table = document.createElement("table");
    table.className = "iksweb";

    const thead = createTableHead();
    table.appendChild(thead);

    const tbody = createTableBody(items);
    table.appendChild(tbody);

    addSorting(table, items);

    return table;
  }

  function createTableHead() {
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

    // Добавляем обработчик события для чекбокса "Выбрать все"
    const selectAllCheckbox = thead.querySelector(".select-all-checkbox");
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
      updateHeaderCheckboxState(table);
    });

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

    // **Modified:** Added data-number attribute to store the original number
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
    quantityInput.min = item["Мин. Кол."];
    quantityInput.max = item["Наличие"];
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
    downloadExcelButton.addEventListener("click", () => downloadExcel(items));

    const downloadPdfButton = document.createElement("button");
    downloadPdfButton.className = "download-pdf";
    downloadPdfButton.textContent = "PDF";
    downloadPdfButton.addEventListener("click", () => downloadPDF(items));

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

  function renderListSection(data) {
    const section = document.createElement("div");
    section.className = "delivery-section";

    const header = document.createElement("div");
    header.className = "delivery-header";

    const headerText = document.createElement("h2");
    headerText.textContent = "Список товаров:";

    const headerRight = createHeaderRight(data);

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
    if (existingPopup) {
      return;
    }

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
      restoreText.style.cursor = "pointer";
      restoreText.addEventListener("click", () => {
        row.classList.remove("deleted-row");
        const cartIcon = row.querySelector(".cart-icon");
        if (cartIcon) {
          cartIcon.src = "/images/svg/Icon/carted_ico.svg";
        }
        const quantityInput = row.querySelector(".quantity-input");
        if (quantityInput) {
          quantityInput.disabled = false;
        }
        popup.remove();
      });

      const deleteIcon = popup.querySelector(".delete-icon");
      deleteIcon.style.cursor = "pointer";
      deleteIcon.addEventListener("click", () => {
        deleteProduct(row);
        popup.remove();
      });
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

    popup
      .querySelector(".add-to-waiting-list")
      .addEventListener("click", () => {
        console.log("Добавлено в лист ожидания");
        popup.remove();
      });
  }

  function toggleCartIcon(icon) {
    const row = icon.closest("tr");
    if (!row) return;

    const quantityInput = row.querySelector(".quantity-input");

    if (row.classList.contains("deleted-row")) {
      row.classList.remove("deleted-row");
      icon.src = "/images/svg/Icon/carted_ico.svg";
      if (quantityInput) {
        quantityInput.disabled = false;
      }
      const existingPopup = row.querySelector(".restore-popup");
      if (existingPopup) {
        existingPopup.remove();
      }
    } else {
      row.classList.add("deleted-row");
      icon.src = "/images/svg/Icon/carted_ico.svg"; // Возможно, здесь должен быть другой src для иконки удаления
      if (quantityInput) {
        quantityInput.disabled = true;
      }
      createPopup(row, "restore");
    }
  }

  function initializeRowEvents(row, item, index) {
    const quantityInput = row.querySelector(".quantity-input");
    quantityInput.value = item.quantity || 0;
    quantityInput.addEventListener("input", () =>
      validateAndCorrectInput(quantityInput, true)
    );

    const productImage = row.querySelector(".product-image");
    initializeImageEvents(productImage);

    const numberCell = row.querySelector(".number-cell");
    initializeNumberCellEvents(numberCell, row, item, index);

    updateSum(quantityInput);
  }

  function initializeImageEvents(imageElement) {
    imageElement.addEventListener("mouseover", function () {
      popupImage.src = imageElement.dataset.fullsrc || imageElement.src;
      popupImage.style.display = "block";
      document.body.appendChild(popupImage);
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
  }

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
      arrow.textContent = currentSortOrder === "asc" ? "▲" : "▼";
      arrow.style.color = "orange";
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
      if (quantity > 0) {
        totalItems += 1;
      }
    });

    const discountInput = document.getElementById("discount-input");
    const discountPercentInput = document.getElementById("discount-percent");

    if (!discountInput.dataset.manual && !discountPercentInput.dataset.manual) {
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

    totalToPay = subtotal - discount;
    shippingCost = calculateShippingCost();

    updateValues();

    // Обновляем состояние всех чекбоксов заголовков после изменения данных
    updateAllHeaderCheckboxes();
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

  // **Modified:** Updated to toggle between number and checkmark
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

      // Обновляем состояние чекбокса заголовка после изменения выделения
      const table = row.closest("table");
      if (table) {
        updateHeaderCheckboxState(table);
      }
    });
  }

  // **Modified:** Changed to display a checkmark with dark orange color
  function selectRow(row) {
    const numberCell = row.querySelector(".number-cell");
    numberCell.textContent = "✔";
    numberCell.style.color = "darkorange"; // Устанавливаем темно-оранжевый цвет
    row.classList.add("selected");
  }

  // **Modified:** Revert back to the original number from data-number and reset color
  function deselectRow(row) {
    const numberCell = row.querySelector(".number-cell");
    numberCell.textContent = numberCell.dataset.number;
    numberCell.style.color = ""; // Сбрасываем цвет на дефолтный
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

    // Обновляем состояние чекбокса заголовка
    updateHeaderCheckboxState(table);
  }

  function selectAllInTable(table, tbody) {
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row, index) => {
      if (!row.classList.contains("selected")) {
        selectRow(row);
      }
    });
  }

  function deselectAllInTable(table, tbody) {
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row, index) => {
      if (row.classList.contains("selected")) {
        deselectRow(row);
      }
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

    // Обновляем состояние всех чекбоксов заголовков
    updateAllHeaderCheckboxes();
  }

  function resetAllSelections() {
    const allTables = deliveryContainer.querySelectorAll("table");
    allTables.forEach((table) => {
      const tbody = table.querySelector("tbody");
      deselectAllInTable(table, tbody);
      table.classList.remove("all-selected");
    });
    deliveryContainer.classList.remove("all-selected");

    // Обновляем состояние всех чекбоксов заголовков
    updateAllHeaderCheckboxes();
  }

  function initializeAfterRender() {
    // initializeHeaderSelection(); // Удалено, так как per-table selection теперь через чекбоксы
    // initializeNumberCellClicks(); // Необходима функция для инициализации событий, но в текущем коде её нет
    // Добавим инициализацию чекбоксов заголовков
    initializeHeaderCheckboxes();
  }

  function initializeHeaderCheckboxes() {
    const allHeaders = deliveryContainer.querySelectorAll(
      ".delivery-section table thead"
    );
    allHeaders.forEach((thead) => {
      const selectAllCheckbox = thead.querySelector(".select-all-checkbox");
      if (selectAllCheckbox) {
        // Устанавливаем состояние чекбокса в соответствии с выделенными строками
        const table = selectAllCheckbox.closest("table");
        if (table) {
          updateHeaderCheckboxState(table);
        }
      }
    });
  }

  function updateHeaderCheckboxState(table) {
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

  function updateAllHeaderCheckboxes() {
    const allTables = deliveryContainer.querySelectorAll("table");
    allTables.forEach((table) => {
      updateHeaderCheckboxState(table);
    });
  }

  fetch("/data/data.json")
    .then((response) => response.json())
    .then((data) => {
      selectRandomProducts(data);
      renderDeliveryView();
      recalculateSubtotalAndTotal();
      updateValues();
    })
    .catch((error) => console.error("Ошибка загрузки данных:", error));

  const discountInput = document.getElementById("discount-input");
  const discountPercentInput = document.getElementById("discount-percent");

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

  function getCartDate() {
    const lastChangeText = document.querySelector(".last-change-text");
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

  // **Added:** Global click listener for Alt + Q
  document.addEventListener("click", (event) => {
    if (isAltQPressed) {
      const isInsideSection = event.target.closest(".delivery-section");
      if (!isInsideSection) {
        toggleSelectAll();
      }
    }
  });
});
