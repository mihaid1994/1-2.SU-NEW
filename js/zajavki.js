document.addEventListener("DOMContentLoaded", () => {
  // Массив с настройками для каждого статуса
  const statusMappings = {
    Создан: { iconClass: "fa-file", color: "#53a4d7", priority: 1 },
    Проверен: { iconClass: "fa-tasks", color: "#53a4d7", priority: 2 },
    Упакован: { iconClass: "fa-box", color: "#ffc525", priority: 3 },
    "В пути": { iconClass: "fa-route", color: "#ffc525", priority: 4 },
    Доставлен: {
      iconClass: "fa-map-marker-alt",
      color: "#ffc525",
      priority: 5,
    },
    Подтвержден: { iconClass: "fa-check", color: "#4ac374", priority: 6 },
    Отменен: { iconClass: "fa-times", color: "#ff4c4c", priority: 7 },
    default: { iconClass: "fa-circle", color: "#cccccc", priority: 8 }, // Для отсутствующих статусов
  };

  // Элементы таблицы
  const table = document.getElementById("zajavki-table");
  const tableHeader = document.getElementById("table-header");
  const tableBody = document.getElementById("table-body");

  // Элементы расширенного поиска
  const expandSearchButton = document.querySelector(".expand-search");
  const searchFilters = document.getElementById("search-filters-unique");

  // Элементы выпадающего меню
  const columnSelector = document.getElementById("column-selector");
  const dropdown = document.querySelector(".filters .dropdown");
  const blurOverlay = document.getElementById("blur-overlay");

  // Элементы iframe
  const iframeContainer = document.getElementById("iframe-container");
  const iframeContent = document.getElementById("iframe-content");
  const iframeClose = document.getElementById("iframe-close");

  // Кнопка поиска
  const searchButton = document.querySelector(".search-header-button-unique");

  // Кнопка переключения режима
  const zkzSwitchButton = document.querySelector(".zkz-switch");

  // Полный список колонок (в исходном порядке)
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

  // Список видимых колонок, который будет изменяться
  let userVisibleColumns = [...allColumns];

  // Объект для отслеживания текущего состояния сортировки по колонкам
  const sortState = {};

  // Максимальная высота iframe (например, 90vh)
  let MAX_IFRAME_HEIGHT = window.innerHeight * 0.9;

  // Подключение FontAwesome (если не подключено в HTML)
  const faLink = document.createElement("link");
  faLink.rel = "stylesheet";
  faLink.href =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
  document.head.appendChild(faLink);

  // Градация статусов для режима "Показать по заказам"
  const statusPriority = Object.keys(statusMappings).reduce((acc, key) => {
    acc[key] = statusMappings[key].priority;
    return acc;
  }, {});

  // Загружаем данные из JSON
  fetch("/data/zajavki.json")
    .then((response) => response.json())
    .then((jsonData) => {
      data = jsonData;
      originalData = [...jsonData]; // Сохраняем оригинальные данные

      // Устанавливаем начальный режим на основе текста кнопки
      const initialButtonText = zkzSwitchButton.textContent.trim();
      isOrdersMode = initialButtonText === "Показать по заказам";

      initTable();
      populateColumnSelector();
    })
    .catch((error) => {
      console.error("Ошибка при загрузке данных JSON:", error);
    });

  // Инициализация таблицы
  function initTable() {
    tableHeader.innerHTML = "";

    // Добавляем колонку "№"
    const thNumber = document.createElement("th");
    thNumber.textContent = "№";
    tableHeader.appendChild(thNumber);

    // Добавляем заголовки колонок на основе userVisibleColumns
    userVisibleColumns.forEach((col) => {
      const th = document.createElement("th");
      th.classList.add("sortable");

      let displayCol = getDisplayColumnName(col);

      th.innerHTML = `${displayCol}<span class="sort-arrow">&#9660;</span>`;
      th.addEventListener("click", () => sortTable(col, th));
      tableHeader.appendChild(th);
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
    tableBody.innerHTML = "";
    data.forEach((row, index) => {
      const tr = document.createElement("tr");

      // Визуальная нумерация
      const tdNumber = document.createElement("td");
      tdNumber.textContent = index + 1;
      tr.appendChild(tdNumber);

      userVisibleColumns.forEach((col) => {
        const td = document.createElement("td");
        if (col === "Статус") {
          // Обработка колонки "Статус" с добавлением иконки
          const statusText = row[col].trim();
          const iconInfo =
            statusMappings[statusText] || statusMappings["default"];

          // Создание элемента иконки
          const icon = document.createElement("i");
          icon.classList.add("fas", iconInfo.iconClass, "status-icon");
          icon.style.width = "25px";
          icon.style.height = "25px";
          icon.style.display = "inline-flex";
          icon.style.alignItems = "center";
          icon.style.justifyContent = "center";
          icon.style.fontSize = "12px";
          icon.style.marginRight = "5px";
          icon.style.color = "#ffffff";
          icon.style.backgroundColor = iconInfo.color;
          icon.style.borderRadius = "50%";
          icon.style.flexShrink = "0";

          td.appendChild(icon);

          const statusSpan = document.createElement("span");
          statusSpan.textContent = statusText;
          td.appendChild(statusSpan);
        } else {
          // Обработка даты
          if (col === "Дата доставки") {
            const dateValue = row["Дата доставки"] || "";
            if (isOrdersMode) {
              // В режиме "Показать по заказам" - полная дата/время
              td.textContent = dateValue;
            } else {
              // В стандартном режиме - только дата
              td.textContent = dateValue.split(",")[0].trim();
            }
          } else {
            td.textContent = row[col];
          }

          if (col === "Доставка" || col === "Заказ" || col === "Номер док.") {
            td.classList.add("clickable");
            td.addEventListener("click", () => openIframe(row[col]));
          }
        }

        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  // Заполнение выпадающего списка выбора колонок
  function populateColumnSelector() {
    dropdown.innerHTML = "";

    userVisibleColumns.forEach((col) => {
      // В режиме "Показать по заказам" не включаем "Доставка"
      if (isOrdersMode && col === "Доставка") {
        return; // Пропускаем колонку "Доставка"
      }

      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = col;
      checkbox.checked = true;
      checkbox.id = `checkbox-${col}`;

      // Устанавливаем отображаемое название
      const displayName = getDisplayColumnName(col);

      // Обработчик изменения состояния чекбокса
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          showColumn(col);
          // Вставляем колонку в userVisibleColumns в правильном порядке
          const originalIndex = allColumns.indexOf(col);
          const currentIndex = userVisibleColumns.indexOf(col);
          if (currentIndex === -1) {
            let insertAtIndex = allColumns.indexOf(col);
            userVisibleColumns.splice(insertAtIndex, 0, col);
            initTable();
          }
        } else {
          hideColumn(col);
          userVisibleColumns = userVisibleColumns.filter((c) => c !== col);
          initTable();
        }
      });

      // Добавляем отображаемое название в метку
      const labelText = document.createElement("span");
      labelText.textContent = displayName;

      label.appendChild(checkbox);
      label.appendChild(labelText);
      dropdown.appendChild(label);
    });
  }

  // Сортировка таблицы
  function sortTable(column, thElement) {
    let order = sortState[column] || "asc";
    order = order === "asc" ? "desc" : "asc";
    sortState[column] = order;

    data.sort((a, b) => {
      const numA = parseFloat(a[column].replace(/[^0-9.]/g, ""));
      const numB = parseFloat(b[column].replace(/[^0-9.]/g, ""));
      if (!isNaN(numA) && !isNaN(numB)) {
        return order === "asc" ? numA - numB : numB - numA;
      }
      return order === "asc"
        ? a[column].localeCompare(b[column], undefined, { sensitivity: "base" })
        : b[column].localeCompare(a[column], undefined, {
            sensitivity: "base",
          });
    });

    const allTh = tableHeader.querySelectorAll("th");
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

  // Открытие iframe
  function openIframe(docNumber) {
    iframeContent.src = `/pages/zajavka_open.html?doc=${docNumber}`;
    iframeContainer.style.display = "block";
    blurOverlay.classList.add("active");

    if (iframeContent._resizeObserver) {
      iframeContent._resizeObserver.disconnect();
    }

    iframeContent.onload = () => {
      adjustIframeHeight();
      setupResizeObserver();
    };
  }

  // Закрытие iframe
  iframeClose.addEventListener("click", () => {
    iframeContainer.style.display = "none";
    iframeContent.src = "";
    blurOverlay.classList.remove("active");

    if (iframeContent._resizeObserver) {
      iframeContent._resizeObserver.disconnect();
    }
  });

  // Логика для открытия/закрытия меню
  columnSelector.addEventListener("click", () => {
    dropdown.classList.toggle("open");
  });

  // Закрытие меню при клике вне области
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".filters")) {
      dropdown.classList.remove("open");
    }
  });

  // Функция для корректировки высоты iframe
  function adjustIframeHeight() {
    try {
      const iframeDocument =
        iframeContent.contentDocument || iframeContent.contentWindow.document;
      const body = iframeDocument.body;
      const html = iframeDocument.documentElement;

      const contentHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );

      let currentHeight = parseInt(iframeContent.style.height, 10) || 300;
      let newHeight = currentHeight;
      let attempts = 0;

      const MAX_ATTEMPTS = 10;

      const hasScroll = () => {
        return contentHeight > newHeight;
      };

      while (
        hasScroll() &&
        newHeight + 50 <= MAX_IFRAME_HEIGHT &&
        attempts < MAX_ATTEMPTS
      ) {
        newHeight += 50;
        attempts++;
      }

      iframeContent.style.height = `${newHeight}px`;
      iframeContainer.style.height = `${newHeight + 40}px`;

      if (contentHeight > newHeight && newHeight < MAX_IFRAME_HEIGHT) {
        console.warn("Не удалось полностью устранить прокрутку iframe.");
      }
    } catch (error) {
      console.error("Ошибка при корректировке высоты iframe:", error);
    }
  }

  // Функция для установки ResizeObserver
  function setupResizeObserver() {
    try {
      const iframeDocument =
        iframeContent.contentDocument || iframeContent.contentWindow.document;
      const body = iframeDocument.body;

      if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(() => {
          adjustIframeHeight();
        });

        resizeObserver.observe(body);
        iframeContent._resizeObserver = resizeObserver;
      } else {
        setInterval(adjustIframeHeight, 500);
      }
    } catch (error) {
      console.error("Ошибка при установке ResizeObserver:", error);
    }
  }

  // Обработка изменения размеров окна браузера
  window.addEventListener("resize", () => {
    const newMaxHeight = window.innerHeight * 0.9;
    if (newMaxHeight !== MAX_IFRAME_HEIGHT) {
      MAX_IFRAME_HEIGHT = newMaxHeight;
      const currentHeight = parseInt(iframeContent.style.height, 10);
      if (currentHeight > MAX_IFRAME_HEIGHT) {
        iframeContent.style.height = `${MAX_IFRAME_HEIGHT}px`;
        iframeContainer.style.height = `${MAX_IFRAME_HEIGHT + 40}px`;
      }
    }
  });

  // Расширенный поиск
  expandSearchButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Предотвращаем закрытие при клике на кнопку
    const isHidden = searchFilters.hasAttribute("hidden");
    if (isHidden) {
      searchFilters.removeAttribute("hidden");
      expandSearchButton.setAttribute("aria-expanded", "true");
    } else {
      searchFilters.setAttribute("hidden", "");
      expandSearchButton.setAttribute("aria-expanded", "false");
    }
  });

  // Применение расширенного поиска
  searchButton.addEventListener("click", () => {
    const criteria = [];

    // Получаем значения из первого фильтра
    const filter1Column = document.getElementById("filter1-select1").value;
    const filter1Condition = document.getElementById("filter1-select2").value;
    const filter1Value = document.getElementById("filter1-input").value;

    if (filter1Value.trim() !== "") {
      criteria.push({
        column: filter1Column,
        condition: filter1Condition,
        value: filter1Value,
      });
    }

    // Получаем значения из второго фильтра
    const filter2Column = document.getElementById("filter2-select1").value;
    const filter2Condition = document.getElementById("filter2-select2").value;
    const filter2Value = document.getElementById("filter2-input").value;

    if (filter2Value.trim() !== "") {
      criteria.push({
        column: filter2Column,
        condition: filter2Condition,
        value: filter2Value,
      });
    }

    // Получаем значения даты
    const dateStart = document.getElementById("filter-date-start").value;
    const dateEnd = document.getElementById("filter-date-end").value;

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
      document.getElementById("filters-confirmed").checked;
    const excludeDeletion = document.getElementById("filters-deletion").checked;

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

    populateTableBody();
  }

  // Переменная для текущего режима
  let isOrdersMode = false;

  // Функция переключения режима отображения
  zkzSwitchButton.addEventListener("click", () => {
    isOrdersMode = !isOrdersMode;
    zkzSwitchButton.textContent = isOrdersMode
      ? "Показать по доставкам"
      : "Показать по заказам";
    toggleDisplayMode();
  });

  // Функция переключения между режимами
  function toggleDisplayMode() {
    if (isOrdersMode) {
      // Переключение в режим "Показать по заказам"
      const uniqueOrders = getUniqueOrdersWithLowestStatus(originalData);
      data = uniqueOrders;

      // Удаляем "Доставка" из userVisibleColumns, если она присутствует
      const deliveryIndex = userVisibleColumns.indexOf("Доставка");
      if (deliveryIndex !== -1) {
        userVisibleColumns.splice(deliveryIndex, 1);
      }

      // Удаляем "Склад" из userVisibleColumns, если она присутствует
      const stockIndex = userVisibleColumns.indexOf("Склад");
      if (stockIndex !== -1) {
        userVisibleColumns.splice(stockIndex, 1);
      }

      initTable();
      populateColumnSelector();
    } else {
      // Возврат к режиму "Показать по доставкам"
      data = [...originalData];

      // Восстанавливаем "Доставка" в userVisibleColumns на её исходную позицию
      const originalDeliveryIndex = allColumns.indexOf("Доставка");
      const currentDeliveryIndex = userVisibleColumns.indexOf("Доставка");
      if (currentDeliveryIndex === -1) {
        userVisibleColumns.splice(originalDeliveryIndex, 0, "Доставка");
      }

      // Восстанавливаем "Склад" в userVisibleColumns на её исходную позицию
      const originalStockIndex = allColumns.indexOf("Склад");
      const currentStockIndex = userVisibleColumns.indexOf("Склад");
      if (currentStockIndex === -1) {
        userVisibleColumns.splice(originalStockIndex, 0, "Склад");
      }

      initTable();
      populateColumnSelector();
    }
  }

  // Функция для получения уникальных заказов с наименьшим статусом
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

  // Функция скрытия колонки
  function hideColumn(columnName) {
    const ths = tableHeader.querySelectorAll("th");
    const displayName = getDisplayColumnName(columnName);
    const columnIndex = Array.from(ths).findIndex(
      (th) =>
        th.textContent.trim() === columnName ||
        th.textContent.trim() === "Сумма общ." ||
        th.textContent.trim() === "Дата оформления"
    );
    if (columnIndex !== -1) {
      ths[columnIndex].style.display = "none";
      const rows = tableBody.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells[columnIndex + 1]) {
          cells[columnIndex + 1].style.display = "none";
        }
      });
    }
  }

  // Функция показа колонки
  function showColumn(columnName) {
    const ths = tableHeader.querySelectorAll("th");
    // Проверяем оба варианта заголовка для сумм и дат
    const columnIndex = Array.from(ths).findIndex(
      (th) =>
        th.textContent.trim() === columnName ||
        (columnName === "Сумма" && th.textContent.trim() === "Сумма общ.") ||
        (columnName === "Дата доставки" &&
          th.textContent.trim() === "Дата оформления")
    );
    if (columnIndex !== -1) {
      ths[columnIndex].style.display = "";
      const rows = tableBody.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells[columnIndex + 1]) {
          cells[columnIndex + 1].style.display = "";
        }
      });
    }
  }
});
