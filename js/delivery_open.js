// Обновленный JS (delivery_open.js)
document.addEventListener("DOMContentLoaded", () => {
  const hideSidebarButton = document.querySelector(".hide-right-sidebar");
  const showSidebarButton = document.querySelector(".show-right-sidebar");
  const orderSummary = document.querySelector(".order-summary");
  const mainContent = document.querySelector(".content");

  const sidebarVisibleByDefault = false;

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

  const toggleButton = document.querySelector(".toggle-button");
  toggleButton.addEventListener("click", toggleViewMode);

  function toggleViewMode() {
    if (currentViewMode === "deliveries") {
      currentViewMode = "list";
      toggleButton.textContent = "По доставкам";
      renderListView();
    } else {
      currentViewMode = "deliveries";
      toggleButton.textContent = "Списком";
      renderDeliveryView();
    }
  }

  function parseDeliveryDays(logisticString) {
    const match = logisticString.match(/до (\d+) дней/);
    return match ? parseInt(match[1], 10) : 1;
  }

  function calculateDeliveryDate(days) {
    const deliveryDate = new Date(currentDate);
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toLocaleDateString("ru-RU");
  }

  // Функция для перемешивания массива
  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function groupByDelivery(data) {
    const grouped = data.reduce((acc, item) => {
      const deliveryDays = parseDeliveryDays(item["Логистика"]);
      const deliveryDate = calculateDeliveryDate(deliveryDays);
      if (!acc[deliveryDate]) acc[deliveryDate] = [];
      acc[deliveryDate].push(item);
      return acc;
    }, {});

    const uniqueDates = Object.keys(grouped);
    const totalUniqueDates = uniqueDates.length;

    if (totalUniqueDates <= 7 && totalUniqueDates >= 3) {
      return grouped;
    }

    const minUniqueDates = 3;
    const maxUniqueDates = Math.min(7, totalUniqueDates);
    const randomCount =
      Math.floor(Math.random() * (maxUniqueDates - minUniqueDates + 1)) +
      minUniqueDates;

    const shuffledDates = shuffle(uniqueDates);
    const selectedDates = shuffledDates.slice(0, randomCount);

    const limitedGrouped = {};
    selectedDates.forEach((date) => {
      limitedGrouped[date] = grouped[date];
    });

    return limitedGrouped;
  }

  function renderDeliveryView() {
    deliveryContainer.innerHTML = "";
    const groupedData = groupByDelivery(window.data);
    renderDeliverySections(groupedData);
  }

  function renderListView() {
    deliveryContainer.innerHTML = "";
    renderListSection(window.data);
  }

  function renderDeliverySections(groupedData) {
    Object.keys(groupedData).forEach((deliveryDate) => {
      const section = createDeliverySection(
        deliveryDate,
        groupedData[deliveryDate]
      );
      const header = section.querySelector(".delivery-header");
      const content = section.querySelector(".delivery-content");

      // Свернуть каждую секцию доставки
      if (!content.classList.contains("collapsed")) {
        toggleSectionContent(header, content, groupedData[deliveryDate]);
      }

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
      if (
        event.target.closest(".collapsed-order-button") ||
        event.target.closest(".header-icon") ||
        event.target.closest(".product-image")
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

    const randomDeliveryId = `DST-${generateDeliveryId()}`;

    const headerText = document.createElement("h2");
    headerText.textContent = `${randomDeliveryId} на ${deliveryDate}`;

    const headerImagesContainer = document.createElement("div");
    headerImagesContainer.className = "header-images-container";
    headerImagesContainer.style.display = "none";

    const headerRight = createheaderRight(items);

    const arrowSpan = document.createElement("span");
    arrowSpan.className = "arrow";
    arrowSpan.textContent = "▼";

    header.append(headerText, headerImagesContainer, headerRight, arrowSpan);

    return header;
  }

  // Function to generate sequential delivery IDs
  let currentDeliveryId = 4568797;
  function generateDeliveryId() {
    return currentDeliveryId++;
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
    collapsedOrderButton.textContent = "Оформить отдельно";
    collapsedOrderButton.addEventListener("click", (event) => {
      event.stopPropagation();
      alert("Оформить отдельно");
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
          <th data-column="index" class="sortable"># <span class="sort-arrow"></span></th>
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
        <td>${index + 1}</td>
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

    initializeRowEvents(row, item);

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

    const downloadButton = document.createElement("button");
    downloadButton.className = "download-excel";
    downloadButton.textContent = "Скачать Excel";
    downloadButton.addEventListener("click", () => downloadExcel(items));

    const orderButton = document.createElement("button");
    orderButton.className = "order-button";
    orderButton.textContent = "Оформить отдельно";
    orderButton.addEventListener("click", (event) => {
      event.stopPropagation();
      alert("Оформить отдельно");
    });

    const deliverySum = document.createElement("div");
    deliverySum.className = "delivery-sum";
    deliverySum.textContent = `Сумма: ${calculateDeliverySum(items)} ₽`;

    actionsContainer.append(downloadButton, orderButton, deliverySum);
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
    headerText.textContent = `Список товаров:`;

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
    // Проверяем, существует ли уже всплывающее окно данного типа
    const existingPopup = document.querySelector(`.${type}-popup`);
    if (existingPopup) {
      return;
    }

    const popup = document.createElement("div");
    popup.classList.add(`${type}-popup`);
    popup.innerHTML =
      type === "restore" ? getRestorePopupContent() : getWaitingPopupContent();

    // Добавляем окно в DOM вне строки таблицы
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
        // Восстанавливаем строку
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
        // Удаляем товар из данных и обновляем отображение
        deleteProduct(row); // Убедитесь, что функция deleteProduct реализована
        popup.remove();
      });
    } else if (type === "waiting") {
      // Обработка waiting-popup
      expandWaitingPopup(popup, row);
    }
  }

  function positionPopup(row, popup) {
    const rowRect = row.getBoundingClientRect();
    const table = row.closest("table");

    popup.style.position = "absolute";
    popup.style.top = `${rowRect.bottom + window.scrollY - 60}px`;
    popup.style.left = `${rowRect.left + window.scrollX}px`;
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

  function expandWaitingPopup(popup, row) {
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
      // Восстанавливаем строку
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
      // Помечаем строку как удаленную
      row.classList.add("deleted-row");
      icon.src = "/images/svg/Icon/carted_ico.svg";
      if (quantityInput) {
        quantityInput.disabled = true;
      }
      createPopup(row, "restore");
    }
  }

  function initializeRowEvents(row, item) {
    const quantityInput = row.querySelector(".quantity-input");
    quantityInput.value = item.quantity || 0;
    quantityInput.addEventListener("input", () =>
      validateAndCorrectInput(quantityInput, true)
    );

    const productImage = row.querySelector(".product-image");
    initializeImageEvents(productImage);

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
        popupImage.style.zindex = "1000";
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
  }

  function calculateShippingCost() {
    return 1350;
  }

  function downloadExcel(items) {
    // Необходимо подключить библиотеку SheetJS
    // Добавлено в HTML:
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    if (typeof XLSX === "undefined") {
      alert("Библиотека SheetJS не подключена.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Доставка");
    XLSX.writeFile(workbook, "delivery.xlsx");
  }

  fetch("/data/data.json")
    .then((response) => response.json())
    .then((data) => {
      selectRandomProducts(data);
      renderDeliveryView();
      recalculateSubtotalAndTotal();
      updateValues();
      document.dispatchEvent(new Event("dataLoaded")); // Добавлено
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
});
