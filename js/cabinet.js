function initializeDashboard(root) {
  const tabLinks = root.querySelectorAll(
    ".tab-link, .nav-button, .summary-button"
  );

  // При клике на ссылку в боковом меню или кнопку "Перейти" —
  // показываем соответствующую вкладку и прячем остальные.
  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = link.getAttribute("data-tab");
      setActiveTab(link, tab);
    });
  });

  // Функция, которая "активирует" вкладку и скрывает все остальные
  function setActiveTab(activeLink, tabId) {
    // Убираем класс active со всех ссылок
    tabLinks.forEach((l) => l.classList.remove("active"));
    // Навешиваем класс active на текущую
    activeLink.classList.add("active");

    // Скрываем все .tab-content
    const allTabs = root.querySelectorAll(".tab-content");
    allTabs.forEach((content) => {
      content.classList.remove("show");
    });

    // Показываем нужную вкладку
    const currentTab = root.querySelector(`#${tabId}`);
    if (currentTab) {
      currentTab.classList.add("show");
      // Сохраняем выбранную вкладку в localStorage (опционально)
      localStorage.setItem("activeTab", tabId);
    }
  }

  // Логика загрузки активной вкладки из localStorage (опционально)
  const savedTab = localStorage.getItem("activeTab") || "client";
  const defaultLink = root.querySelector(`[data-tab="${savedTab}"]`);
  if (defaultLink) {
    setActiveTab(defaultLink, savedTab);
  }

  // Пример: Кнопка выхода
  const logoutBtn = root.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("Выход из системы");
      // Доп. логика выхода
    });
  }

  // Пример инициализации некоторых кнопок, модалок и т.д.
  // --- Здесь можно разместить логику открытия/закрытия модальных окон и прочее ---

  // Закрытие модалок по клику на .close
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

  // Функция для загрузки дополнительных продуктов из JSON
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

  // Функция для настройки обработчиков событий для кнопок действий
  function setupActionButtons() {
    const productsTable = root.querySelector(".products-table");

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

  // Обработчик кнопки "Добавить новый товар"
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

  // Вызов функций для загрузки продуктов и настройки кнопок
  loadAdditionalProducts();
  setupActionButtons();
}
