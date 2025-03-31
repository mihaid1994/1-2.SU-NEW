// ==================== 1. ИНИЦИАЛИЗАЦИЯ И ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================

// Массив заголовков, для которых мы НЕ показываем label (только для мобильных карточек)
const IGNORED_HEADERS = [
  "Наименование",
  // Добавляйте любые нужные заголовки
];

/**
 * Инжектирует CSS-правило для мобильной версии, чтобы все <label> отображались как блочные.
 */
function injectMobileLabelStyle() {
  let mobileStyle = document.getElementById("mobile-label-style");
  if (!mobileStyle) {
    mobileStyle = document.createElement("style");
    mobileStyle.id = "mobile-label-style";
    mobileStyle.textContent = `
      label {
        display: block;
        margin-bottom: 5px;
        display: block;
        margin-top: 10px;
      }
    `;
    document.head.appendChild(mobileStyle);
  }
}

/**
 * Удаляет ранее инжектированное CSS-правило для мобильной версии.
 */
function removeMobileLabelStyle() {
  const mobileStyle = document.getElementById("mobile-label-style");
  if (mobileStyle) {
    mobileStyle.remove();
  }
}

/**
 * Обновляет правило для <label> в зависимости от мобильного режима.
 */
function handleMobileLabelStyle() {
  if (isMobile()) {
    injectMobileLabelStyle();
  } else {
    removeMobileLabelStyle();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Применяем мобильное правило сразу после загрузки страницы
  handleMobileLabelStyle();

  // Элемент-корень для личного кабинета (ожидается, что в HTML есть <div id="mainContent"></div>)
  const root = document.getElementById("mainContent");
  initializeDashboard(root);
  initializeCabinetButtonHandler(); // <-- Обработка .Cabinet-button
  window.addEventListener("resize", handleResize);
});

/**
 * Определяет, находится ли устройство в мобильном режиме (max-width: 800px)
 * @returns {boolean}
 */
function isMobile() {
  return window.matchMedia("(max-width: 800px)").matches;
}

/**
 * Преобразует все таблицы внутри указанного контейнера в карточки с горизонтальной компоновкой
 * только если мы находимся в мобильном режиме.
 * Для каждой строки (кроме первой, которая является заголовком) создаётся карточка, в которой:
 * - Если обнаружено изображение (по ключевым словам или тегу img), слева выделяется 25% ширины.
 * - Если обнаружены кнопки, справа выделяется 15% ширины, куда вертикально располагаются только иконки
 *   (текст заменяется согласно справочнику).
 * - Остальные данные размещаются в центральном блоке, который занимает оставшиеся 60% (или гибко – если
 *   одного блока нет).
 *
 * @param {HTMLElement} root - Контейнер, внутри которого нужно преобразовать таблицы (только в мобильной версии).
 */
function convertTableToCards(root) {
  // Если не мобильное устройство – не преобразуем
  if (!isMobile()) return;

  const tables = root.querySelectorAll("table");
  tables.forEach((table) => {
    // Создаем контейнер для карточек с минимальным вертикальным gap 3px
    const cardsContainer = document.createElement("div");
    cardsContainer.classList.add("cards-container");
    cardsContainer.style.display = "flex";
    cardsContainer.style.flexDirection = "column";
    cardsContainer.style.marginTop = "10px";
    cardsContainer.style.marginBottom = "10px";
    cardsContainer.style.gap = "3px";

    // Определяем заголовки: берем либо из <thead>, либо из первой строки
    let headers = [];
    const thead = table.querySelector("thead");
    if (thead) {
      headers = Array.from(thead.querySelectorAll("th")).map((th) =>
        th.textContent.trim()
      );
    } else {
      const firstRow = table.querySelector("tr");
      if (firstRow) {
        headers = Array.from(firstRow.querySelectorAll("td, th")).map((cell) =>
          cell.textContent.trim()
        );
      }
    }

    // Определяем строки; пропускаем первую строку, так как это заголовок
    const rows = table.querySelectorAll("tr");
    if (rows.length < 2) return; // если строк меньше двух – карточки создавать не нужно
    const startIndex = 1;

    // Обработка каждой строки
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      const cells = Array.from(row.querySelectorAll("td, th"));

      // Создаем карточку – всегда горизонтальный flex-контейнер
      const card = document.createElement("div");
      card.classList.add("mobile-card");
      card.style.width = "95%";
      card.style.margin = "0 auto"; // Центрирование по горизонтали
      card.style.border = "1px solid #ddd";
      card.style.borderRadius = "8px";
      card.style.padding = "10px";
      card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      card.style.display = "flex";
      card.style.flexDirection = "row";
      card.style.gap = "10px";

      // Создаем три контейнера: для медиа, деталей и кнопок
      let mediaContent = null; // если будет найдено изображение
      const mediaContainer = document.createElement("div");
      const detailsContainer = document.createElement("div");
      const buttonContainer = document.createElement("div");

      // Инициализируем стили для деталей
      detailsContainer.style.flex = "1";
      detailsContainer.style.display = "flex";
      detailsContainer.style.flexDirection = "column";
      detailsContainer.style.justifyContent = "flex-start";
      detailsContainer.style.gap = "5px";

      // Инициализируем стили для кнопок: вертикально, 15% от ширины
      buttonContainer.style.display = "flex";
      buttonContainer.style.flexDirection = "column";
      buttonContainer.style.justifyContent = "flex-start";
      buttonContainer.style.gap = "5px";
      buttonContainer.style.flex = "0 0 15%";

      // Обрабатываем каждую ячейку строки
      cells.forEach((cell, index) => {
        const headerText = headers[index] ? headers[index].toLowerCase() : "";
        const cellHasImg = cell.querySelector("img");
        const isMedia =
          headerText.includes("изображение") ||
          headerText.includes("фото") ||
          cellHasImg;
        const hasButtons = cell.querySelectorAll("button").length > 0;

        if (isMedia && !mediaContent) {
          // Создаем блок для изображения, если он ещё не создан
          mediaContent = document.createElement("div");
          mediaContent.style.flex = "0 0 25%";
          mediaContent.style.display = "flex";
          mediaContent.style.alignItems = "center";
          mediaContent.style.justifyContent = "center";
          mediaContent.style.overflow = "hidden";
          mediaContent.style.borderRadius = "8px";
          mediaContent.style.backgroundColor = "#fff";
          if (cellHasImg) {
            const img = cellHasImg.cloneNode(true);
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.objectFit = "contain";
            mediaContent.innerHTML = "";
            mediaContent.appendChild(img);
          } else {
            mediaContent.textContent = cell.textContent.trim();
          }
        } else if (hasButtons) {
          // Обрабатываем кнопки: удаляем заголовки и текст, оставляем только иконки
          const btns = cell.querySelectorAll("button");
          btns.forEach((btn) => {
            const clonedBtn = btn.cloneNode(true);
            // Если внутри клонированной кнопки отсутствует тег <i>, то заменяем текст на иконку согласно справочнику
            if (!clonedBtn.querySelector("i")) {
              const mapping = {
                // Уже используемые
                Редактировать: "ri-edit-2-line",
                Удалить: "ri-delete-bin-line",
                Аналитика: "ri-bar-chart-2-line",

                // Добавляем отсутствующие:
                "Установить по умолчанию": "ri-pushpin-line",
                "Настроить уведомления": "ri-notification-3-line",
                Просмотреть: "ri-eye-line",
                Обновить: "ri-refresh-line",
                Результаты: "ri-bar-chart-line",
                Ответить: "ri-send-plane-line",
                Скачать: "ri-download-2-line",
                // Если где-то кнопка именно "Просмотр" повторяется, можно оставить одно значение
              };
              let btnText = btn.textContent.trim();
              if (mapping[btnText]) {
                clonedBtn.innerHTML = `<i class="${mapping[btnText]}"></i>`;
              }
            }
            clonedBtn.style.margin = "0";
            buttonContainer.appendChild(clonedBtn);
          });
        } else {
          // Остальные ячейки – данные для деталей
          const detailItem = document.createElement("div");
          detailItem.style.display = "flex";
          detailItem.style.flexDirection = "row";
          detailItem.style.gap = "5px";
          detailItem.style.alignItems = "center";

          // Проверяем, игнорируем ли этот заголовок (без учета регистра и лишних пробелов)
          const originalHeader = headers[index] || "";
          if (originalHeader && !IGNORED_HEADERS.includes(originalHeader)) {
            // Если не игнорируем, тогда добавляем label
            const label = document.createElement("span");
            label.style.fontWeight = "bold";
            label.textContent = originalHeader + ": ";
            detailItem.appendChild(label);
          }

          const contentSpan = document.createElement("span");
          contentSpan.innerHTML = cell.innerHTML;
          detailItem.appendChild(contentSpan);

          detailsContainer.appendChild(detailItem);
        }
      });

      // Собираем карточку: всегда горизонтально
      if (mediaContent) {
        card.appendChild(mediaContent);
      }
      card.appendChild(detailsContainer);
      if (buttonContainer.children.length > 0) {
        card.appendChild(buttonContainer);
      }
      cardsContainer.appendChild(card);
    }
    // Заменяем исходную таблицу нашим блоком карточек
    table.parentNode.replaceChild(cardsContainer, table);
  });
}

/**
 * Инициализирует обработку кликов по элементам, связанным с кабинетом.
 * В мобильной версии клик по .Cabinet-button открывает (тоглит) сайдбар,
 * а в остальных случаях – стандартное поведение.
 */
function initializeCabinetButtonHandler() {
  const elements = document.querySelectorAll(".label, .value, .Cabinet-button");
  elements.forEach((element) => {
    element.addEventListener("click", async (e) => {
      e.preventDefault();
      if (
        window.innerWidth <= 800 &&
        element.classList.contains("Cabinet-button")
      ) {
        const sidebar = document.querySelector(".sidebar");
        if (sidebar) {
          sidebar.classList.toggle("open");
        }
        return;
      }
      const title = "Личный кабинет";
      const url = "/pages/cabinet_postavshika.html";
      if (
        typeof openPageAsTab === "function" &&
        typeof activateInnerTab === "function"
      ) {
        const parentTabId = await openPageAsTab(title, url);
        const innerDataTab = "balanceLoyalty";
        activateInnerTab(parentTabId, innerDataTab);
      }
    });
  });
}

// ==================== 3. ИНИЦИАЛИЗАЦИЯ ЛИЧНОГО КАБИНЕТА ====================
function initializeDashboard(root) {
  const tabLinks = root.querySelectorAll(
    ".tab-link, .nav-button, .summary-button"
  );
  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = link.getAttribute("data-tab");
      setActiveTab(link, tabId);
    });
  });

  async function setActiveTab(activeLink, tabId) {
    tabLinks.forEach((l) => l.classList.remove("active"));
    activeLink.classList.add("active");

    if (isMobile()) {
      await setActiveTabMobile(tabId);
      localStorage.setItem("activeTab", tabId);
      return;
    }
    const allTabs = root.querySelectorAll(".tab-content");
    allTabs.forEach((content) => content.classList.remove("show"));
    let currentTab = root.querySelector(`#${tabId}`);
    if (tabId === "myClients") {
      if (!currentTab) {
        currentTab = document.createElement("div");
        currentTab.id = tabId;
        currentTab.classList.add("tab-content");
        root.appendChild(currentTab);
      }
      currentTab.classList.add("show");
      try {
        const response = await fetch("/pages/myclients.html");
        if (!response.ok) {
          throw new Error(
            "Ошибка при загрузке содержимого вкладки 'Мои клиенты'"
          );
        }
        currentTab.innerHTML = await response.text();
        initializeMyClients(currentTab);
      } catch (error) {
        currentTab.innerHTML = "<p>Ошибка загрузки содержимого.</p>";
        console.error(error);
      }
    } else {
      if (!currentTab) {
        currentTab = document.createElement("div");
        currentTab.id = tabId;
        currentTab.classList.add("tab-content");
        currentTab.innerHTML = `<p>Вкладка "${tabId}" в разработке.</p>`;
        root.appendChild(currentTab);
      }
      currentTab.classList.add("show");
    }
    localStorage.setItem("activeTab", tabId);
  }

  async function setActiveTabMobile(tabId) {
    let contentClone;
    const contentHost = document.querySelector(
      `.content[data-content="${tabId}"]`
    );
    if (contentHost && contentHost.shadowRoot) {
      contentClone = document.createElement("div");
      contentClone.innerHTML = contentHost.shadowRoot.innerHTML;
    } else {
      let currentTab = root.querySelector(`#${tabId}`);
      if (!currentTab) {
        currentTab = document.createElement("div");
        currentTab.id = tabId;
        currentTab.classList.add("tab-content");
        currentTab.innerHTML = `<p>Вкладка "${tabId}" в разработке.</p>`;
      }
      contentClone = currentTab.cloneNode(true);
    }
    if (tabId === "myClients") {
      try {
        const response = await fetch("/pages/myclients.html");
        if (!response.ok) {
          throw new Error("Ошибка загрузки содержимого вкладки 'Мои клиенты'");
        }
        contentClone.innerHTML = await response.text();
        initializeMyClients(contentClone);
      } catch (err) {
        contentClone.innerHTML = "<p>Ошибка загрузки содержимого.</p>";
        console.error(err);
      }
    }
    // Сдвигаем подгруженный контент вниз, чтобы кнопка возврата не перекрывала текст
    contentClone.style.marginTop = "50px";

    let modal = document.getElementById("mobileModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "mobileModal";
      const shadow = modal.attachShadow({ mode: "open" });
      // Подключаем RemixIcon
      const iconLink = document.createElement("link");
      iconLink.setAttribute("rel", "stylesheet");
      iconLink.setAttribute(
        "href",
        "https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css"
      );
      shadow.appendChild(iconLink);
      const styleEl = document.createElement("style");
      styleEl.textContent = `
        .modal-container {
          position: fixed;
          top: 40px;
          left: 0;
          width: 100vw;
          height: calc(100vh - 80px);
          background: rgba(0, 0, 0, 0.29);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 20;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .modal-content {
          background: #fff;
          width: 100%;
          height: 100%;
          border-radius: 0;
          position: relative;
          padding: 20px;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
        }
          
        .close {
          position: absolute;
          top: 10px;
          left: 15px;
          width: 67px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 28px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border-radius: 5px;
          color: orange;
          cursor: pointer;
        }
        .close i {
          font-size: 28px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 30px;
        }
        table th, table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        table th {
          background-color: #f2f2f2;
          color: #34495e;
        }
        input, select, textarea {
          font-family: inherit;
          font-size: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px;
          margin: 5px 0;
          box-sizing: border-box;
        }
        button {
          padding: 10px;
          background-color: #1abc9c;
          border: none;
          color: #fff;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #16a085;
        }
        a {
          color: #1abc9c;
          text-decoration: none;
        }
        p {
          line-height: 1.6;
          color: #555;
          margin: 0;
        }
      `;
      shadow.appendChild(styleEl);
      const container = document.createElement("div");
      container.className = "modal-container";
      container.innerHTML = `
        <div class="modal-content">
          <span class="close"><i class="ri-align-justify"></i><i class="ri-arrow-left-line"></i></span>
          <div id="modalBody"></div>
        </div>
      `;
      shadow.appendChild(container);
      document.body.appendChild(modal);
      const closeBtn = shadow.querySelector(".close");
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
      container.addEventListener("click", (e) => {
        if (e.target === container) modal.style.display = "none";
      });
    }
    const modalBody = modal.shadowRoot.getElementById("modalBody");
    modalBody.innerHTML = "";
    modalBody.appendChild(contentClone);

    // ТОЛЬКО в мобильном режиме преобразуем таблицы в карточки
    if (isMobile()) {
      convertTableToCards(modalBody);
    }
    modal.style.display = "block";
  }

  // ==================== 4. ДОПОЛНИТЕЛЬНЫЙ ФУНКЦИОНАЛ (ЗАГРУЗКА ПРОДУКТОВ, КНОПКИ) ====================
  function loadAdditionalProducts() {
    fetch("/data/lk-data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка при загрузке данных");
        }
        return response.json();
      })
      .then((data) => {
        const products = data.products;
        const tableBody = root.querySelector(".products-table tbody");
        if (!tableBody) return;
        products.forEach((product) => {
          const row = document.createElement("tr");

          // Фото
          const photoCell = document.createElement("td");
          const img = document.createElement("img");
          img.src = `/images/jpg/Product/${product.photo}`;
          img.alt = product.name;
          img.width = 50;
          photoCell.appendChild(img);
          row.appendChild(photoCell);

          // Наименование
          const nameCell = document.createElement("td");
          nameCell.textContent = product.name;
          row.appendChild(nameCell);

          // Артикул
          const skuCell = document.createElement("td");
          skuCell.textContent = product.sku;
          row.appendChild(skuCell);

          // Бренд
          const brandCell = document.createElement("td");
          brandCell.textContent = product.brand;
          row.appendChild(brandCell);

          // Цена
          const priceCell = document.createElement("td");
          priceCell.textContent = product.price;
          row.appendChild(priceCell);

          // Статус
          const statusCell = document.createElement("td");
          statusCell.textContent = product.status;
          row.appendChild(statusCell);

          // Действия
          const actionsCell = document.createElement("td");
          const editBtn = document.createElement("button");
          editBtn.classList.add("edit-product");
          const editIcon = document.createElement("i");
          editIcon.classList.add("ri-edit-2-line");
          editBtn.appendChild(editIcon);
          actionsCell.appendChild(editBtn);

          const deleteBtn = document.createElement("button");
          deleteBtn.classList.add("delete-product");
          const deleteIcon = document.createElement("i");
          deleteIcon.classList.add("ri-delete-bin-line");
          deleteBtn.appendChild(deleteIcon);
          actionsCell.appendChild(deleteBtn);

          const analyticsBtn = document.createElement("button");
          analyticsBtn.classList.add("view-analytics");
          analyticsBtn.textContent = "Аналитика";
          actionsCell.appendChild(analyticsBtn);

          row.appendChild(actionsCell);
          tableBody.appendChild(row);
        });
      })
      .catch((error) => {
        console.error("Ошибка:", error);
      });
  }

  function setupActionButtons() {
    const productsTable = root.querySelector(".products-table");
    if (!productsTable) return;
    productsTable.addEventListener("click", function (event) {
      const target = event.target;
      if (target.closest(".edit-product")) {
        const row = target.closest("tr");
        const productName = row.querySelector("td:nth-child(2)").textContent;
        alert(`Редактировать продукт: ${productName}`);
      }
      if (target.closest(".delete-product")) {
        const row = target.closest("tr");
        const productName = row.querySelector("td:nth-child(2)").textContent;
        if (
          confirm(`Вы уверены, что хотите удалить продукт "${productName}"?`)
        ) {
          row.remove();
        }
      }
      if (target.closest(".view-analytics")) {
        const row = target.closest("tr");
        const productName = row.querySelector("td:nth-child(2)").textContent;
        alert(`Просмотр аналитики для продукта: ${productName}`);
      }
    });
  }

  const addProductBtn = root.getElementById("addProductBtn");
  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      alert("Открыть форму добавления нового товара");
    });
  }
  loadAdditionalProducts();
  setupActionButtons();

  // ==================== 5. ИНИЦИАЛИЗАЦИЯ АККОРДЕОНОВ (MY CLIENTS) ====================
  function initializeMyClients(container) {
    const accordionItems = container.querySelectorAll(".accordion-item");
    const collapsedHeight = "5.5rem";
    function closeAllAccordions() {
      accordionItems.forEach((item) => {
        const contents = item.querySelectorAll(".accordion-content");
        const buttons = item.querySelectorAll(".btn");
        buttons.forEach((btn) => btn.classList.remove("active"));
        contents.forEach((content) => {
          content.classList.remove("open");
          content.style.maxHeight = null;
        });
        item.style.height = collapsedHeight;
      });
    }
    accordionItems.forEach((item, index) => {
      const header = item.querySelector(".accordion-header");
      const ordersBtn = item.querySelector(".btn-orders");
      const analyticsBtn = item.querySelector(".btn-analytics");
      const chatBtn = item.querySelector(".btn-chat");
      const settingsBtn = item.querySelector(".btn-set");
      const settingsContent = item.querySelector(".settings-content");
      const ordersContent = item.querySelector(".orders-content");
      const analyticsContent = item.querySelector(".analytics-content");
      const chartCanvas = item.querySelector("canvas");
      const orderNames = item.querySelectorAll(".order-name");

      const categoriesCanvas = document.createElement("canvas");
      const categoriesCanvasId = `chart-client-${index + 1}-categories`;
      categoriesCanvas.id = categoriesCanvasId;
      analyticsContent.appendChild(categoriesCanvas);

      item.style.height = collapsedHeight;

      const chart1 = new Chart(chartCanvas.getContext("2d"), {
        type: "line",
        data: {
          labels: [
            "Январь",
            "Февраль",
            "Март",
            "Апрель",
            "Май",
            "Июнь",
            "Июль",
            "Август",
            "Сентябрь",
            "Октябрь",
            "Ноябрь",
            "Декабрь",
          ],
          datasets: [
            {
              label: "Сумма покупок (руб)",
              data: generateMonthlyData(item, index),
              backgroundColor: "rgba(33, 150, 243, 0.4)",
              borderColor: "rgba(33, 150, 243, 1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          animation: { duration: 0 },
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (value) => value.toLocaleString() + " руб" },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `Сумма: ${context.parsed.y.toLocaleString()} руб`,
              },
            },
          },
        },
      });

      const categories = generateCategories();
      const chart2 = new Chart(categoriesCanvas.getContext("2d"), {
        type: "pie",
        data: {
          labels: categories,
          datasets: [
            {
              data: generateCategorySpending(item, index),
              backgroundColor: generateColors(categories.length),
              borderWidth: 1,
            },
          ],
        },
        options: {
          animation: { duration: 0 },
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || "";
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total
                    ? ((value / total) * 100).toFixed(2)
                    : 0;
                  return `${label}: ${value.toLocaleString()} руб (${percentage}%)`;
                },
              },
            },
          },
        },
      });

      function generateMonthlyData(item, index) {
        const financials = item.querySelector(".client-financials").innerHTML;
        const regex = /Оборот за год:\s*([0-9,]+) руб/i;
        const match = financials.match(regex);
        const annualTurnover = match ? parseInt(match[1].replace(/,/g, "")) : 0;
        const averageMonthly = Math.floor(annualTurnover / 12);
        let monthlyData = [];
        if (index === 0) {
          for (let i = 0; i < 12; i++) {
            monthlyData.push(
              averageMonthly + Math.floor(Math.random() * 50000)
            );
          }
        } else {
          for (let i = 0; i < 12; i++) {
            monthlyData.push(
              Math.random() < 0.7
                ? Math.floor(Math.random() * averageMonthly)
                : 0
            );
          }
        }
        return monthlyData;
      }
      function generateCategories() {
        const possibleCategories = [
          "Электротехника",
          "Оборудование",
          "Компьютерные системы",
          "Мебель",
          "Программное обеспечение",
          "Маркетинг",
          "Обучение",
          "Логистика",
          "Автомобильные запчасти",
          "Строительные материалы",
          "Канцелярия",
          "Безопасность",
          "Энергетика",
          "Связь",
          "Транспорт",
        ];
        let categories = [];
        const numberOfCategories = Math.floor(Math.random() * 6) + 3;
        while (categories.length < numberOfCategories) {
          const randomCategory =
            possibleCategories[
              Math.floor(Math.random() * possibleCategories.length)
            ];
          if (!categories.includes(randomCategory)) {
            categories.push(randomCategory);
          }
        }
        return categories;
      }
      function generateCategorySpending(item, index) {
        const financials = item.querySelector(".client-financials").innerHTML;
        const regex = /Оборот за год:\s*([0-9,]+) руб/i;
        const match = financials.match(regex);
        const annualTurnover = match ? parseInt(match[1].replace(/,/g, "")) : 0;
        const categories = generateCategories();
        let spending = [];
        let remaining = annualTurnover;
        for (let i = 0; i < categories.length; i++) {
          if (i === categories.length - 1) {
            spending.push(remaining);
          } else {
            let max =
              remaining -
              Math.floor(annualTurnover * 0.05 * (categories.length - i - 1));
            let min = Math.floor(annualTurnover * 0.05);
            if (max < min) max = min;
            let value = Math.floor(Math.random() * (max - min + 1)) + min;
            spending.push(value);
            remaining -= value;
          }
        }
        return spending;
      }
      function generateColors(numCategories) {
        const colors = [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#C9CBCF",
          "#FFCD56",
          "#8BC34A",
          "#E91E63",
          "#00BCD4",
          "#FF5722",
          "#9C27B0",
          "#3F51B5",
          "#009688",
        ];
        for (let i = colors.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        return colors.slice(0, numCategories);
      }
      function toggleSection(section) {
        const isOrders = section === "orders";
        const contentToOpen = isOrders ? ordersContent : analyticsContent;
        const btnToActivate = isOrders ? ordersBtn : analyticsBtn;
        const isOpen = contentToOpen.classList.contains("open");
        if (!isOpen) {
          closeAllAccordions();
          contentToOpen.classList.add("open");
          contentToOpen.style.maxHeight =
            contentToOpen.scrollHeight + 100 + "px";
          btnToActivate.classList.add("active");
          item.style.height = "auto";
        } else {
          closeAllAccordions();
        }
      }
      header.addEventListener("click", () => {
        toggleSection("orders");
      });
      ordersBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSection("orders");
      });
      analyticsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSection("analytics");
      });
      chatBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        alert("Откроется чат с клиентом.");
      });
      function toggleSettings() {
        if (!settingsContent.classList.contains("open")) {
          closeAllAccordions();
          settingsContent.classList.add("open");
          settingsContent.style.maxHeight = settingsContent.scrollHeight + "px";
          item.style.height = "auto";
        }
      }
      if (settingsBtn) {
        settingsBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleSettings();
        });
      }
      orderNames.forEach((order) => {
        order.addEventListener("click", () => {
          if (!ordersContent.classList.contains("open")) {
            closeAllAccordions();
            toggleSection("orders");
          }
          alert(`Детали заказа: ${order.textContent}`);
        });
      });
    });
  }

  // ==================== 6. ОБРАБОТКА ИЗМЕНЕНИЯ РАЗМЕРА ОКНА ====================
  function handleResize() {
    // Обновляем правило для мобильных <label>
    handleMobileLabelStyle();

    if (!isMobile()) {
      const modal = document.getElementById("mobileModal");
      if (modal && modal.style.display === "block") {
        modal.style.display = "none";
      }
    }
  }

  // ==================== 7. ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ И ОБРАБОТКА КНОПОК ВНЕ МОДАЛА ====================
  const savedTab = localStorage.getItem("activeTab") || "client";
  if (savedTab !== "client") {
    const defaultLink = root.querySelector(`[data-tab="${savedTab}"]`);
    if (defaultLink) {
      setActiveTab(defaultLink, savedTab);
    }
  }
  const logoutBtn = root.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("Выход из системы");
    });
  }
  const modals = root.querySelectorAll(".modal");
  modals.forEach((modal) => {
    const closeBtn = modal.querySelector(".close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  });
}
