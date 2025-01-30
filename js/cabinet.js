// /js/main.js

// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
document.addEventListener("DOMContentLoaded", function () {
  // Предполагается, что в вашем HTML есть элемент <div id="mainContent"></div>
  const root = document.getElementById("mainContent");
  initializeDashboard(root);
});

/**
 * Главная функция инициализации личного кабинета (с вкладками, в т.ч. "Мои клиенты").
 * @param {HTMLElement} root - Корневой элемент (контейнер), внутри которого рендерится контент вкладок.
 */
function initializeDashboard(root) {
  // Находим ссылки (или кнопки), переключающие вкладки
  const tabLinks = root.querySelectorAll(
    ".tab-link, .nav-button, .summary-button"
  );

  // При клике на ссылку/кнопку показываем соответствующую вкладку и прячем остальные.
  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = link.getAttribute("data-tab");
      setActiveTab(link, tab);
    });
  });

  // --------------------------------------------------
  // ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК
  // --------------------------------------------------
  async function setActiveTab(activeLink, tabId) {
    // Снимаем класс .active со всех ссылок
    tabLinks.forEach((l) => l.classList.remove("active"));
    // Назначаем класс .active текущей ссылке
    activeLink.classList.add("active");

    // Скрываем всё содержимое вкладок
    const allTabs = root.querySelectorAll(".tab-content");
    allTabs.forEach((content) => {
      content.classList.remove("show");
    });

    // Определяем контейнер для текущей вкладки
    let currentTab = root.querySelector(`#${tabId}`);
    if (tabId === "myClients") {
      // Если переходим на вкладку "Мои клиенты" — динамически загружаем её содержимое
      if (!currentTab) {
        currentTab = document.createElement("div");
        currentTab.id = tabId;
        currentTab.classList.add("tab-content");
        root.appendChild(currentTab);
      }

      // Показываем контейнер
      currentTab.classList.add("show");

      try {
        // Загружаем HTML из /pages/myclients.html
        const response = await fetch("/pages/myclients.html");
        if (!response.ok) {
          throw new Error(
            "Ошибка при загрузке содержимого вкладки 'Мои клиенты'"
          );
        }
        currentTab.innerHTML = await response.text();

        // Инициализируем функционал "Мои клиенты" внутри загруженного контейнера
        initializeMyClients(currentTab);
      } catch (error) {
        currentTab.innerHTML = "<p>Ошибка загрузки содержимого.</p>";
        console.error(error);
      }
    } else {
      // Для других вкладок — просто показываем их содержимое
      if (!currentTab) {
        // Если вкладка не существует в DOM, создаём её
        currentTab = document.createElement("div");
        currentTab.id = tabId;
        currentTab.classList.add("tab-content");
        currentTab.innerHTML = `<p>Вкладка "${tabId}" в разработке.</p>`;
        root.appendChild(currentTab);
      }
      currentTab.classList.add("show");
    }

    // Сохраняем активную вкладку в localStorage (при желании)
    localStorage.setItem("activeTab", tabId);
  }

  // --------------------------------------------------
  // ЛОГИКА ВОССТАНОВЛЕНИЯ АКТИВНОЙ ВКЛАДКИ ИЗ localStorage
  // --------------------------------------------------
  const savedTab = localStorage.getItem("activeTab") || "client";
  const defaultLink = root.querySelector(`[data-tab="${savedTab}"]`);
  if (defaultLink) {
    setActiveTab(defaultLink, savedTab);
  }

  // --------------------------------------------------
  // Пример: Кнопка "Выход из системы"
  // --------------------------------------------------
  const logoutBtn = root.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("Выход из системы");
      // Дополнительная логика выхода, если требуется
    });
  }

  // --------------------------------------------------
  // ЛОГИКА ЗАКРЫТИЯ МОДАЛОК ПРИ КЛИКЕ НА .close ИЛИ ВНЕ МОДАЛКИ
  // --------------------------------------------------
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

  // --------------------------------------------------
  // ЗАГРУЗКА ДОПОЛНИТЕЛЬНЫХ ПРОДУКТОВ ИЗ JSON (пример)
  // --------------------------------------------------
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
        if (!tableBody) return; // Если на странице нет таблицы, выходим

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

          // Кнопка редактирования
          const editBtn = document.createElement("button");
          editBtn.classList.add("edit-product");
          const editIcon = document.createElement("i");
          editIcon.classList.add("ri-edit-2-line");
          editBtn.appendChild(editIcon);
          actionsCell.appendChild(editBtn);

          // Кнопка удаления
          const deleteBtn = document.createElement("button");
          deleteBtn.classList.add("delete-product");
          const deleteIcon = document.createElement("i");
          deleteIcon.classList.add("ri-delete-bin-line");
          deleteBtn.appendChild(deleteIcon);
          actionsCell.appendChild(deleteBtn);

          // Кнопка аналитики
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

  // --------------------------------------------------
  // НАСТРОЙКА ОБРАБОТЧИКОВ ДЛЯ КНОПОК ДЕЙСТВИЙ (редактировать/удалить/аналитика)
  // --------------------------------------------------
  function setupActionButtons() {
    const productsTable = root.querySelector(".products-table");
    if (!productsTable) return; // Если таблицы нет, выходим

    productsTable.addEventListener("click", function (event) {
      const target = event.target;

      // Обработка кнопки редактирования
      if (target.closest(".edit-product")) {
        const row = target.closest("tr");
        const productName = row.querySelector("td:nth-child(2)").textContent;
        alert(`Редактировать продукт: ${productName}`);
        // Здесь можно открыть модальное окно для редактирования
      }

      // Обработка кнопки удаления
      if (target.closest(".delete-product")) {
        const row = target.closest("tr");
        const productName = row.querySelector("td:nth-child(2)").textContent;
        if (
          confirm(`Вы уверены, что хотите удалить продукт "${productName}"?`)
        ) {
          row.remove();
          // Здесь можно добавить дополнительную логику удаления из базы данных
        }
      }

      // Обработка кнопки аналитики
      if (target.closest(".view-analytics")) {
        const row = target.closest("tr");
        const productName = row.querySelector("td:nth-child(2)").textContent;
        alert(`Просмотр аналитики для продукта: ${productName}`);
        // Здесь можно открыть модальное окно с аналитикой
      }
    });
  }

  // --------------------------------------------------
  // "Добавить новый товар"
  // --------------------------------------------------
  const addProductBtn = root.getElementById("addProductBtn");
  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      // Логика открытия модального окна для добавления нового товара
      alert("Открыть форму добавления нового товара");
      // Например, показать модальное окно:
      // const addModal = root.querySelector('.add-product-modal');
      // addModal.style.display = 'block';
    });
  }

  // Вызываем функции для загрузки продуктов и настройки кнопок
  loadAdditionalProducts();
  setupActionButtons();

  // --------------------------------------------------
  // ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ "МОИ КЛИЕНТЫ"
  // --------------------------------------------------
  function initializeMyClients(container) {
    // Находим все аккордеоны внутри контейнера для вкладки "Мои клиенты"
    const accordionItems = container.querySelectorAll(".accordion-item");

    // Фиксированная высота свернутого состояния (5.5rem = 88px)
    const collapsedHeight = "5.5rem";

    // Закрыть все аккордеоны
    function closeAllAccordions() {
      accordionItems.forEach((item) => {
        const contents = item.querySelectorAll(".accordion-content");
        const buttons = item.querySelectorAll(".btn");

        // Убираем активные классы с кнопок
        buttons.forEach((btn) => btn.classList.remove("active"));

        // Закрываем все секции контента
        contents.forEach((content) => {
          content.classList.remove("open");
          content.style.maxHeight = null;
        });

        // Устанавливаем фиксированную высоту для свернутого состояния
        item.style.height = collapsedHeight;
      });
    }

    // Инициализируем каждый аккордеон
    accordionItems.forEach((item, index) => {
      const header = item.querySelector(".accordion-header");
      const ordersBtn = item.querySelector(".btn-orders");
      const analyticsBtn = item.querySelector(".btn-analytics");
      const chatBtn = item.querySelector(".btn-chat");
      const ordersContent = item.querySelector(".orders-content");
      const analyticsContent = item.querySelector(".analytics-content");
      const chartCanvas = item.querySelector("canvas");
      const orderNames = item.querySelectorAll(".order-name");

      // Создаём второй canvas для второго графика (распределение по категориям)
      const categoriesCanvas = document.createElement("canvas");
      const categoriesCanvasId = `chart-client-${index + 1}-categories`;
      categoriesCanvas.id = categoriesCanvasId;
      analyticsContent.appendChild(categoriesCanvas);

      // Устанавливаем фиксированную высоту для свернутого состояния
      item.style.height = collapsedHeight;

      // ------------------------
      // График 1 (Покупки по месяцам)
      // ------------------------
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
          animation: { duration: 0 }, // Отключение анимации
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return value.toLocaleString() + " руб";
                },
              },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `Сумма: ${context.parsed.y.toLocaleString()} руб`;
                },
              },
            },
          },
        },
      });

      // ------------------------
      // Генерация категорий и График 2 (Распределение по категориям)
      // ------------------------
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
                label: function (context) {
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

      // ------------------------
      // Функции для генерации данных
      // ------------------------
      function generateMonthlyData(item, index) {
        const financials = item.querySelector(".client-financials").innerHTML;
        const regex = /Оборот за год:\s*([0-9,]+) руб/i;
        const match = financials.match(regex);
        const annualTurnover = match ? parseInt(match[1].replace(/,/g, "")) : 0;
        const averageMonthly = Math.floor(annualTurnover / 12);

        let monthlyData = [];

        // Первый клиент — более активный
        if (index === 0) {
          for (let i = 0; i < 12; i++) {
            monthlyData.push(
              averageMonthly + Math.floor(Math.random() * 50000)
            );
          }
        } else {
          for (let i = 0; i < 12; i++) {
            // С вероятностью 70% покупка в месяц
            if (Math.random() < 0.7) {
              monthlyData.push(Math.floor(Math.random() * averageMonthly));
            } else {
              monthlyData.push(0);
            }
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

        // Выбираем от 3 до 8 случайных уникальных категорий
        let categories = [];
        const numberOfCategories = Math.floor(Math.random() * 6) + 3; // 3..8

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
            // Всё, что осталось, идёт в последнюю категорию
            spending.push(remaining);
          } else {
            // Разделяем оставшиеся средства с учётом минимального порога (5%)
            let max =
              remaining -
              Math.floor(annualTurnover * 0.05 * (categories.length - i - 1));
            let min = Math.floor(annualTurnover * 0.05);
            if (max < min) max = min; // На случай, если рассчёт "уходит в минус"
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
        // Перемешиваем массив цветов
        for (let i = colors.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        // Возвращаем нужное количество цветов
        return colors.slice(0, numCategories);
      }

      // ------------------------
      // Переключение секций внутри аккордеона (Заказы/Аналитика)
      // ------------------------
      function toggleSection(section) {
        const isOrders = section === "orders";
        const contentToOpen = isOrders ? ordersContent : analyticsContent;
        const contentToClose = isOrders ? analyticsContent : ordersContent;
        const btnToActivate = isOrders ? ordersBtn : analyticsBtn;
        const btnToDeactivate = isOrders ? analyticsBtn : ordersBtn;

        const isOpen = contentToOpen.classList.contains("open");

        if (!isOpen) {
          // Закрываем все аккордеоны перед открытием нового
          closeAllAccordions();
          // Открываем нужный контент
          contentToOpen.classList.add("open");
          contentToOpen.style.maxHeight =
            contentToOpen.scrollHeight + 100 + "px";
          btnToActivate.classList.add("active");

          // Ставим высоту "auto", чтобы вся инфа поместилась
          item.style.height = "auto";
        } else {
          // Если секция уже открыта, сворачиваем всё
          closeAllAccordions();
        }
      }

      // ------------------------
      // События для хедера и кнопок
      // ------------------------
      header.addEventListener("click", () => {
        toggleSection("orders");
      });

      ordersBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // чтобы не сработал клик по header
        toggleSection("orders");
      });

      analyticsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSection("analytics");
      });

      chatBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Здесь может быть логика для чата, пока заглушка
        alert("Чат будет доступен в ближайшее время.");
      });

      // Клик по "заказам" внутри списка
      orderNames.forEach((order) => {
        order.addEventListener("click", () => {
          // Если секция "Заказы" не открыта, открываем её
          if (!ordersContent.classList.contains("open")) {
            closeAllAccordions();
            toggleSection("orders");
          }
          // Здесь можно добавить логику для просмотра деталей заказа
          alert(`Детали заказа: ${order.textContent}`);
        });
      });
    });

    // ------------------------
    // Поиск (пример)
    // ------------------------
    const searchInput = container.querySelector("#searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const query = this.value.toLowerCase();
        const allAccordionItems = container.querySelectorAll(".accordion-item");
        allAccordionItems.forEach((item) => {
          const name =
            item.querySelector(".client-name")?.textContent?.toLowerCase() ||
            "";
          const contact =
            item.querySelector(".client-contact")?.textContent?.toLowerCase() ||
            "";
          const financials =
            item
              .querySelector(".client-financials")
              ?.textContent?.toLowerCase() || "";
          if (
            name.includes(query) ||
            contact.includes(query) ||
            financials.includes(query)
          ) {
            item.style.display = "block";
          } else {
            item.style.display = "none";
          }
        });
      });
    }

    // ------------------------
    // Кнопка "Наверх"
    // ------------------------
    const scrollTopBtn = container.querySelector("#scrollTopBtn");
    if (scrollTopBtn) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
          scrollTopBtn.style.display = "flex";
        } else {
          scrollTopBtn.style.display = "none";
        }
      });

      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    }
  }
}
