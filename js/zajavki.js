window.initZajavkiTable = function (root = document) {
  // Массив с настройками для каждого статуса
  const statusMappings = {
    Создан: { iconClass: "ri-file-line", color: "#53a4d7", priority: 1 },
    Проверен: { iconClass: "ri-checkbox-line", color: "#53a4d7", priority: 2 },
    Упакован: { iconClass: "ri-box-3-line", color: "#ffc525", priority: 3 },
    "В пути": { iconClass: "ri-truck-line", color: "#ffc525", priority: 4 },
    Доставлен: { iconClass: "ri-map-pin-line", color: "#ffc525", priority: 5 },
    Подтвержден: { iconClass: "ri-check-line", color: "#4ac374", priority: 6 },
    Отменен: { iconClass: "ri-close-line", color: "#ff4c4c", priority: 7 },
    default: { iconClass: "ri-question-line", color: "#cccccc", priority: 8 }, // Для отсутствующих статусов
  };

  // Элементы таблицы
  const table = root.querySelector("#zajavki-table");
  const tableheader = root.querySelector("#table-header");
  const tableBody = root.querySelector("#table-body");

  // Элементы расширенного поиска
  const expandSearchButton = root.querySelector(".expand-search");
  const searchFilters = root.querySelector("#search-filters-unique");

  // Элементы выпадающего меню
  const columnSelector = root.querySelector("#column-selector");
  const dropdown = root.querySelector(".filters .dropdown");
  const blurOverlay = root.querySelector("#blur-overlay");

  // Элементы iframe
  const iframeContainer = root.querySelector("#iframe-container");
  const iframeContent = root.querySelector("#iframe-content");
  const iframeClose = root.querySelector("#iframe-close");

  // Кнопка поиска
  const searchButton = root.querySelector(".search-header-button-unique");

  // Кнопка переключения режима
  const zkzSwitchButton = root.querySelector(".zkz-switch");

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

  // Подключение Remix Icon (если не подключено в HTML)
  if (!root.ownerDocument.querySelector('link[href*="remixicon"]')) {
    const remixLink = document.createElement("link");
    remixLink.rel = "stylesheet";
    remixLink.href =
      "https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css";
    document.head.appendChild(remixLink);
  }

  // Градация статусов для режима "Показать по заказам"
  const statusPriority = Object.keys(statusMappings).reduce((acc, key) => {
    acc[key] = statusMappings[key].priority;
    return acc;
  }, {});

  // Переменные для хранения данных
  let data = [];
  let originalData = [];

  // Переменная для текущего режима
  let isOrdersMode = false;

  // Загружаем данные из JSON
  fetch("/data/zajavki.json")
    .then((response) => response.json())
    .then((jsonData) => {
      data = jsonData;
      originalData = [...jsonData]; // Сохраняем оригинальные данные

      // Устанавливаем начальный режим на основе текста кнопки
      if (zkzSwitchButton) {
        const initialButtonText = zkzSwitchButton.textContent.trim();
        isOrdersMode = initialButtonText === "Показать по заказам";
      }

      initTable();
      populateColumnSelector();
    })
    .catch((error) => {
      console.error("Ошибка при загрузке данных JSON:", error);
    });

  // Инициализация таблицы
  function initTable() {
    if (!tableheader) {
      console.warn("Элемент с id 'table-header' не найден внутри корня:", root);
      return;
    }

    tableheader.innerHTML = "";

    // Добавляем колонку "№"
    const thNumber = root.ownerDocument.createElement("th");
    thNumber.textContent = "№";
    tableheader.appendChild(thNumber);

    // Добавляем заголовки колонок на основе userVisibleColumns
    userVisibleColumns.forEach((col) => {
      const th = root.ownerDocument.createElement("th");
      th.classList.add("sortable");

      let displayCol = getDisplayColumnName(col);

      th.innerHTML = `${displayCol}<span class="sort-arrow">&#9660;</span>`;
      th.addEventListener("click", () => sortTable(col, th));
      tableheader.appendChild(th);
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
    if (!tableBody) {
      console.warn("Элемент с id 'table-body' не найден внутри корня:", root);
      return;
    }

    tableBody.innerHTML = "";
    data.forEach((row, index) => {
      const tr = root.ownerDocument.createElement("tr");

      // Визуальная нумерация
      const tdNumber = root.ownerDocument.createElement("td");
      tdNumber.textContent = index + 1;
      tr.appendChild(tdNumber);

      userVisibleColumns.forEach((col) => {
        const td = root.ownerDocument.createElement("td");
        if (col === "Статус") {
          // Обработка колонки "Статус" с добавлением иконки
          const statusText = row[col].trim();
          const iconInfo =
            statusMappings[statusText] || statusMappings["default"];

          // Создание элемента иконки
          const icon = root.ownerDocument.createElement("i");
          icon.classList.add(iconInfo.iconClass, "status-icon");
          icon.style.width = "25px";
          icon.style.height = "25px";
          icon.style.display = "inline-flex";
          icon.style.alignItems = "center";
          icon.style.justifyContent = "center";
          icon.style.fontSize = "16px"; // Можно отрегулировать размер по необходимости
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

          if (["Доставка", "Заказ", "Номер док."].includes(col)) {
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
    if (!dropdown) {
      console.warn(
        "Элемент с классом 'dropdown' не найден внутри корня:",
        root
      );
      return;
    }

    dropdown.innerHTML = "";

    allColumns.forEach((col) => {
      // В режиме "Показать по заказам" не включаем "Доставка" и "Склад"
      if (isOrdersMode && (col === "Доставка" || col === "Склад")) {
        return; // Пропускаем эти колонки
      }

      const label = root.ownerDocument.createElement("label");

      // Остановить распространение события при клике на метку
      label.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      const checkbox = root.ownerDocument.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = col;
      checkbox.checked = userVisibleColumns.includes(col);
      checkbox.id = `checkbox-${col}`;

      // Остановить распространение события при изменении состояния чекбокса
      checkbox.addEventListener("change", (e) => {
        e.stopPropagation(); // Предотвращаем закрытие плашки при клике на чекбокс

        if (e.target.checked) {
          showColumn(col);
          // Вставляем колонку в userVisibleColumns в правильном порядке
          const originalIndex = allColumns.indexOf(col);
          if (!userVisibleColumns.includes(col)) {
            userVisibleColumns.splice(originalIndex, 0, col);
            initTable();
          }
        } else {
          hideColumn(col);
          userVisibleColumns = userVisibleColumns.filter((c) => c !== col);
          initTable();
        }
      });

      // Устанавливаем отображаемое название
      const displayName = getDisplayColumnName(col);

      // Добавляем отображаемое название в метку
      const labelText = root.ownerDocument.createElement("span");
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

    const allTh = tableheader.querySelectorAll("th");
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
    if (!iframeContent || !iframeContainer) {
      console.warn("Элементы iframe не найдены внутри корня:", root);
      return;
    }

    iframeContent.src = `/pages/zajavka_open.html?doc=${docNumber}`;
    iframeContainer.style.display = "block";
    if (blurOverlay) blurOverlay.classList.add("active");

    if (iframeContent._resizeObserver) {
      iframeContent._resizeObserver.disconnect();
    }

    iframeContent.onload = () => {
      // Корректировка высоты iframe отключена
      // adjustIframeHeight();
      // setupResizeObserver();
    };
  }

  // Закрытие iframe
  if (iframeClose && iframeContainer && iframeContent) {
    iframeClose.addEventListener("click", () => {
      iframeContainer.style.display = "none";
      iframeContent.src = "";
      if (blurOverlay) blurOverlay.classList.remove("active");

      if (iframeContent._resizeObserver) {
        iframeContent._resizeObserver.disconnect();
      }
    });
  }

  // Логика для открытия/закрытия меню
  if (columnSelector && dropdown) {
    columnSelector.addEventListener("click", (e) => {
      e.stopPropagation(); // Предотвращаем закрытие меню при клике на кнопку выбора колонок
      dropdown.classList.toggle("open");
    });

    // Закрытие меню при клике вне области
    root.ownerDocument.addEventListener("click", (event) => {
      if (!event.target.closest(".filters")) {
        dropdown.classList.remove("open");
      }
    });

    // Остановить распространение события при клике внутри выпадающего меню
    dropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Расширенный поиск
  if (expandSearchButton && searchFilters) {
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
  }

  // Применение расширенного поиска
  if (searchButton) {
    searchButton.addEventListener("click", () => {
      const criteria = [];

      // Получаем значения из первого фильтра
      const filter1Column = root.querySelector("#filter1-select1")
        ? root.querySelector("#filter1-select1").value
        : null;
      const filter1Condition = root.querySelector("#filter1-select2")
        ? root.querySelector("#filter1-select2").value
        : null;
      const filter1Value = root.querySelector("#filter1-input")
        ? root.querySelector("#filter1-input").value
        : "";

      if (filter1Value && filter1Column && filter1Condition) {
        criteria.push({
          column: filter1Column,
          condition: filter1Condition,
          value: filter1Value,
        });
      }

      // Получаем значения из второго фильтра
      const filter2Column = root.querySelector("#filter2-select1")
        ? root.querySelector("#filter2-select1").value
        : null;
      const filter2Condition = root.querySelector("#filter2-select2")
        ? root.querySelector("#filter2-select2").value
        : null;
      const filter2Value = root.querySelector("#filter2-input")
        ? root.querySelector("#filter2-input").value
        : "";

      if (filter2Value && filter2Column && filter2Condition) {
        criteria.push({
          column: filter2Column,
          condition: filter2Condition,
          value: filter2Value,
        });
      }

      // Получаем значения даты
      const dateStart = root.querySelector("#filter-date-start")
        ? root.querySelector("#filter-date-start").value
        : null;
      const dateEnd = root.querySelector("#filter-date-end")
        ? root.querySelector("#filter-date-end").value
        : null;

      if (dateStart || dateEnd) {
        criteria.push({
          column: "Дата",
          condition: "dateRange",
          startDate: dateStart,
          endDate: dateEnd,
        });
      }

      // Обработка чекбоксов
      const excludeConfirmed = root.querySelector("#filters-confirmed")
        ? root.querySelector("#filters-confirmed").checked
        : false;
      const excludeDeletion = root.querySelector("#filters-deletion")
        ? root.querySelector("#filters-deletion").checked
        : false;

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

    populateTableBody();
  }

  // Функция переключения режима отображения
  function toggleDisplayMode() {
    if (isOrdersMode) {
      // Переключение в режим "Показать по заказам"
      const uniqueOrders = getUniqueOrdersWithLowestStatus(originalData);
      data = uniqueOrders;

      // Удаляем "Доставка" и "Склад" из userVisibleColumns, если они присутствуют
      ["Доставка", "Склад"].forEach((col) => {
        const index = userVisibleColumns.indexOf(col);
        if (index !== -1) {
          userVisibleColumns.splice(index, 1);
        }
      });

      initTable();
      populateColumnSelector();
    } else {
      // Возврат к режиму "Показать по доставкам"
      data = [...originalData];

      // Восстанавливаем "Доставка" и "Склад" в userVisibleColumns на их исходные позиции
      ["Доставка", "Склад"].forEach((col) => {
        if (!userVisibleColumns.includes(col)) {
          const originalIndex = allColumns.indexOf(col);
          userVisibleColumns.splice(originalIndex, 0, col);
        }
      });

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
    const ths = tableheader.querySelectorAll("th");
    const displayName = getDisplayColumnName(columnName);
    const columnindex = Array.from(ths).findIndex(
      (th) =>
        th.textContent.trim() === columnName ||
        th.textContent.trim() === "Сумма общ." ||
        th.textContent.trim() === "Дата оформления"
    );
    if (columnindex !== -1) {
      ths[columnindex].style.display = "none";
      const rows = tableBody.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells[columnindex + 1]) {
          cells[columnindex + 1].style.display = "none";
        }
      });
    }
  }

  // Функция показа колонки
  function showColumn(columnName) {
    const ths = tableheader.querySelectorAll("th");
    // Проверяем оба варианта заголовка для сумм и дат
    const columnindex = Array.from(ths).findIndex(
      (th) =>
        th.textContent.trim() === columnName ||
        (columnName === "Сумма" && th.textContent.trim() === "Сумма общ.") ||
        (columnName === "Дата доставки" &&
          th.textContent.trim() === "Дата оформления")
    );
    if (columnindex !== -1) {
      ths[columnindex].style.display = "";
      const rows = tableBody.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells[columnindex + 1]) {
          cells[columnindex + 1].style.display = "";
        }
      });
    }
  }

  // Назначение обработчика переключения режима после инициализации
  if (zkzSwitchButton) {
    zkzSwitchButton.addEventListener("click", () => {
      isOrdersMode = !isOrdersMode;
      zkzSwitchButton.textContent = isOrdersMode
        ? "Показать по доставкам"
        : "Показать по заказам";
      toggleDisplayMode();
    });
  }
};
