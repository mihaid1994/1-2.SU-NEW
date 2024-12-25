document.addEventListener("DOMContentLoaded", function () {
  let isCardView = true;
  let dataCache = null;
  let imageCache = {};

  // Справочник брендов
  const brandMapping = {
    Энергомера: "/images/svg//brand/energomera.svg",
    АГАТ: "/images/svg//brand/agat.svg",
    ЭРА: "/images/svg//brand/era.svg",
    "Bormioli Rocco": "/images/svg//brand/bormioli_rocco.svg",
    "EKF PROxima": "/images/svg//brand/ekf_proxima.svg",
    SmartBuy: "/images/svg//brand/smartbuy.svg",
    ASD: "/images/svg//brand/asd.svg",
    InHome: "/images/svg//brand/inhome.svg",
    APEYRON: "/images/svg//brand/apeyron.svg",
    ARTELAMP: "/images/svg//brand/artelamp.svg",
    "1-2.SALE": "/images/svg//brand/1-2.sale.svg",
    "Тест на правду": "/images/svg//brand/pravtest.svg",
    "ВАШЕ СИЯТЕЛЬСТВО": "/images/svg//brand/sijatelstvo.svg",
  };

  // Функция для определения бренда
  function getBrandInfo(productName) {
    for (let brand in brandMapping) {
      if (productName.includes(brand)) {
        return {
          name: brand,
          logo: brandMapping[brand],
        };
      }
    }
    return {
      name: "Производитель не указан",
      logo: "/images/svg/Icon/placeholder-logo.svg",
    };
  }

  // Функция debounce
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Оптимизированная функция для загрузки изображений без проверки существования
  async function loadImages(article, maxImages = 5) {
    if (imageCache[article]) {
      return imageCache[article];
    }

    const images = [];
    const imageNames = [];

    for (let i = 0; i < maxImages; i++) {
      const imageName = i === 0 ? `${article}.jpg` : `${article}_${i}.jpg`;
      const imagePath = `/images/jpg/Product/${imageName}`;
      imageNames.push(imagePath);
    }

    const loadPromises = imageNames.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
      });
    });

    const results = await Promise.all(loadPromises);
    const validImages = results.filter((src) => src !== null);

    imageCache[article] = validImages;
    return validImages;
  }

  // Функция для рендера изображений для карточек
  async function renderImages(container, indicatorsContainer, article) {
    try {
      const images = await loadImages(article, 5);

      if (images.length === 0) {
        container.innerHTML = "<p>Нет изображений для данного артикула.</p>";
        indicatorsContainer.innerHTML = "";
        return;
      }

      container.innerHTML = ""; // Очистка контейнера перед добавлением изображений
      indicatorsContainer.innerHTML = ""; // Очистка контейнера перед добавлением индикаторов

      images.forEach((src, index) => {
        const img = document.createElement("img");
        img.src = src;
        img.loading = "lazy"; // Ленивая загрузка
        img.classList.add("product-image");
        if (index === 0) img.classList.add("active");
        container.appendChild(img);
      });

      images.forEach((_, index) => {
        const indicator = document.createElement("div");
        indicator.classList.add("indicator");
        if (index === 0) indicator.classList.add("active");
        indicatorsContainer.appendChild(indicator);
      });

      // Обработчики событий через делегирование
      indicatorsContainer.addEventListener("click", function (event) {
        if (event.target.classList.contains("indicator")) {
          const indicators = indicatorsContainer.querySelectorAll(".indicator");
          const images = container.querySelectorAll(".product-image");
          const index = Array.from(indicators).indexOf(event.target);
          if (index !== -1) {
            images.forEach((img) => img.classList.remove("active"));
            images[index].classList.add("active");

            indicators.forEach((ind) => ind.classList.remove("active"));
            event.target.classList.add("active");
          }
        }
      });

      container.addEventListener("mousemove", function (e) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const segmentWidth = rect.width / images.length;
        const index = Math.min(Math.floor(x / segmentWidth), images.length - 1);

        const currentActive = container.querySelector("img.active");
        const targetImage = container.querySelectorAll("img")[index];
        if (currentActive !== targetImage) {
          container
            .querySelectorAll("img")
            .forEach((img) => img.classList.remove("active"));
          targetImage.classList.add("active");

          const indicators = indicatorsContainer.querySelectorAll(".indicator");
          indicators.forEach((ind) => ind.classList.remove("active"));
          indicators[index].classList.add("active");
        }
      });

      container.addEventListener("mouseleave", () => {
        // Сброс активного изображения к первому
        const images = container.querySelectorAll("img");
        if (images.length > 0) {
          images.forEach((img) => img.classList.remove("active"));
          images[0].classList.add("active");
        }

        // Сброс активного индикатора к первому
        const indicators = indicatorsContainer.querySelectorAll(".indicator");
        if (indicators.length > 0) {
          indicators.forEach((ind) => ind.classList.remove("active"));
          indicators[0].classList.add("active");
        }
      });

      // Удаляем управление видимостью индикаторов через JS
      // Это будет управляться через CSS
    } catch (error) {
      console.error(
        `Ошибка при рендеринге изображений для артикула ${article}: ${error}`
      );
      container.innerHTML = "<p>Ошибка при загрузке изображений.</p>";
      indicatorsContainer.innerHTML = "";
    }
  }

  // Загрузка данных из JSON
  fetch("/data/data.json")
    .then((response) => response.json())
    .then((data) => {
      dataCache = data.map((item) => {
        const retailPrice =
          parseFloat(item["Розничная цена"] || item["Цена"]) || 0;
        item["Розничная цена"] = (retailPrice * 1.25).toFixed(2); // Увеличиваем на 25%
        return item;
      });

      // Определяем стартовый вид (по умолчанию - табличный)
      const currentView = localStorage.getItem("currentView") || "table-view";
      document.body.classList.add(currentView);

      if (currentView === "card-view") {
        renderCardView(dataCache);
      } else {
        renderTableView(dataCache);
      }

      cleanQuantityInputs(); // Очистка значений "0" при загрузке страницы

      const toggleButton = document.getElementById("toggleViewButton");
      const toggleButtonImage = toggleButton.querySelector(
        ".toggle-button-image"
      );
      toggleButtonImage.src =
        currentView === "card-view"
          ? "/images/svg/Icon/table.svg"
          : "/images/svg/Icon/card.svg";

      toggleButton.addEventListener("click", function () {
        const productContainer = document.getElementById("productContainer");
        productContainer.innerHTML = ""; // Очищаем контейнер

        if (document.body.classList.contains("table-view")) {
          // Переключаем на карточный вид
          document.body.classList.remove("table-view");
          document.body.classList.add("card-view");
          renderCardView(dataCache);
          toggleButtonImage.src = "/images/svg/Icon/table.svg";
          localStorage.setItem("currentView", "card-view"); // Сохраняем состояние
        } else if (document.body.classList.contains("card-view")) {
          // Переключаем на табличный вид
          document.body.classList.remove("card-view");
          document.body.classList.add("table-view");
          renderTableView(dataCache);
          toggleButtonImage.src = "/images/svg/Icon/card.svg";
          localStorage.setItem("currentView", "table-view"); // Сохраняем состояние
        }

        // Добавляем эффект анимации на изображение кнопки
        toggleButtonImage.classList.add("animate-toggle");
        setTimeout(() => {
          toggleButtonImage.classList.remove("animate-toggle");
        }, 200);

        cleanQuantityInputs(); // Очистка значений "0" после переключения вида
      });
    })
    .catch((error) => {
      console.error(`Ошибка при загрузке данных: ${error}`);
    });

  // Функция для очистки значений "0"
  function cleanQuantityInputs() {
    document.querySelectorAll(".product-quantity-custom").forEach((input) => {
      if (input.value === "0") {
        input.value = "";
      }

      input.addEventListener("blur", function () {
        if (this.value === "0") {
          this.value = "";
        }
      });
    });
  }

  function renderCardView(data) {
    const productContainer = document.getElementById("productContainer");
    productContainer.className = "product-grid";

    const maxRows = 7;
    let cardsPerRow = 4;

    function updateCardsPerRow() {
      const width = window.innerWidth;
      if (width <= 900) {
        cardsPerRow = 2;
      } else if (width <= 1200) {
        cardsPerRow = 3;
      } else {
        cardsPerRow = 4;
      }
    }

    updateCardsPerRow();

    if (!window.resizeHandlerAdded) {
      window.addEventListener(
        "resize",
        debounce(function () {
          const previousCardsPerRow = cardsPerRow;
          updateCardsPerRow();
          if (previousCardsPerRow !== cardsPerRow) {
            productContainer.innerHTML = "";
            renderCards(data, productContainer, maxRows * cardsPerRow);
          }
        }, 200)
      ); // Задержка 200ms
      window.resizeHandlerAdded = true;
    }

    productContainer.innerHTML = "";
    renderCards(data, productContainer, maxRows * cardsPerRow);
  }

  function renderCards(data, container, maxCards) {
    const fragment = document.createDocumentFragment();

    data.slice(0, maxCards).forEach((item) => {
      const brandInfo = getBrandInfo(item["Наименование"]);

      const card = document.createElement("div");
      card.classList.add("product-card-custom");

      // Изображение продукта
      const imageDiv = document.createElement("div");
      imageDiv.classList.add("product-image-custom");

      const mainContainer = document.createElement("div");
      mainContainer.classList.add("main-container", "image-container");

      // Добавляем контейнер для изображений
      const imagesContainer = document.createElement("div");
      imagesContainer.classList.add("imagesContainer");
      mainContainer.appendChild(imagesContainer);

      // Добавляем overlay
      const overlay = document.createElement("div");
      overlay.classList.add("overlay");
      mainContainer.appendChild(overlay);

      // Добавляем индикаторы
      const indicatorsContainer = document.createElement("div");
      indicatorsContainer.classList.add("indicatorsContainer");
      mainContainer.appendChild(indicatorsContainer);

      // Добавляем индикаторы для изображений
      const article = item["Код"];
      if (article) {
        renderImages(imagesContainer, indicatorsContainer, article);
      } else {
        imagesContainer.innerHTML =
          "<p>Нет изображений для данного артикула.</p>";
      }

      // Вставляем все в основную карточку
      imageDiv.appendChild(mainContainer);
      card.appendChild(imageDiv);

      // Добавляем информацию о продукте
      const infoDiv = document.createElement("div");
      infoDiv.classList.add("product-info-custom");

      const brandDiv = document.createElement("div");
      brandDiv.classList.add("product-brand-custom");

      const brandImg = document.createElement("img");
      brandImg.src = brandInfo.logo;
      brandImg.alt = brandInfo.name;
      brandImg.setAttribute("data-tooltip", `Логотип бренда ${brandInfo.name}`);

      const brandSpan = document.createElement("span");
      brandSpan.textContent = brandInfo.name;

      brandDiv.appendChild(brandImg);
      brandDiv.appendChild(brandSpan);

      const title = document.createElement("h2");
      title.classList.add("product-title-custom");
      title.textContent = item["Наименование"];
      title.setAttribute(
        "data-tooltip",
        `Перейти к подробному описанию товара: ${item["Наименование"]}`
      );

      const codeP = document.createElement("p");
      codeP.classList.add("product-code-custom");
      codeP.innerHTML = `Код товара: <span>${item["Код"]}</span>`;
      codeP.setAttribute(
        "data-tooltip",
        `Уникальный код товара: ${item["Код"]}`
      );

      const articleP = document.createElement("p");
      articleP.classList.add("product-article-custom");
      articleP.innerHTML = `Артикул: <span>${
        item["Артикул"] || "Не указан"
      }</span>`;
      articleP.setAttribute(
        "data-tooltip",
        `Артикул товара для заказа: ${item["Артикул"] || "Не указан"}`
      );

      const packagingP = document.createElement("p");
      packagingP.classList.add("product-packaging-custom");
      packagingP.innerHTML = `Упаковка: <a href="#">${
        item["Упаковка"] || "1 шт."
      }</a>`;
      packagingP.setAttribute(
        "data-tooltip",
        `Информация об упаковке товара: ${item["Упаковка"] || "1 шт."}`
      );

      const priceDiv = document.createElement("div");
      priceDiv.classList.add("product-price-custom");

      const currentPriceDiv = document.createElement("div");
      currentPriceDiv.classList.add("price-current-custom");
      currentPriceDiv.innerHTML = `<span>Ваша цена</span><strong>${item["Цена"]} ₽</strong>`;
      currentPriceDiv.setAttribute(
        "data-tooltip",
        `Цена для вас: ${item["Цена"]} ₽`
      );

      const retailPriceDiv = document.createElement("div");
      retailPriceDiv.classList.add("price-retail-custom");
      retailPriceDiv.innerHTML = `<span>Розн. цена</span><strong>${item["Розничная цена"]} ₽</strong>`;
      retailPriceDiv.setAttribute(
        "data-tooltip",
        `Розничная цена товара: ${item["Розничная цена"]} ₽`
      );

      priceDiv.appendChild(currentPriceDiv);
      priceDiv.appendChild(retailPriceDiv);

      const actionsDiv = document.createElement("div");
      actionsDiv.classList.add("product-actions-custom");

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.value = "0";
      quantityInput.min = item["Мин. Кол."] || 1;
      quantityInput.step = item["Мин. Кол."] || 1;
      quantityInput.classList.add("product-quantity-custom");
      quantityInput.setAttribute(
        "data-tooltip",
        `Введите количество товара (Минимум: ${item["Мин. Кол."] || 1})`
      );

      const addToCartButton = document.createElement("button");
      addToCartButton.classList.add("add-to-cart-custom");
      addToCartButton.textContent = "В корзину";
      addToCartButton.setAttribute(
        "data-tooltip",
        "Добавить этот товар в корзину"
      );

      actionsDiv.appendChild(quantityInput);
      actionsDiv.appendChild(addToCartButton);

      const availabilityDiv = document.createElement("div");
      availabilityDiv.classList.add("product-availability-custom");

      const availableTodayDiv = document.createElement("div");
      availableTodayDiv.classList.add("available-today-custom");
      availableTodayDiv.innerHTML = `<span>В наличии</span><strong>${
        item["Наличие"] || "0"
      } шт.</strong>`;
      availableTodayDiv.setAttribute(
        "data-tooltip",
        `Количество товара в наличии: ${item["Наличие"] || "0"} шт.`
      );

      const availableFutureDiv = document.createElement("div");
      availableFutureDiv.classList.add("available-future-custom");
      availableFutureDiv.innerHTML = `<span>${
        item["Дата поступления"] || "В пути"
      }</span><strong>${item["В пути"] || "0"} шт.</strong>`;
      availableFutureDiv.setAttribute(
        "data-tooltip",
        `Количество товара в пути: ${item["В пути"] || "0"} шт. (${
          item["Дата поступления"] || "Дата неизвестна"
        })`
      );

      availabilityDiv.appendChild(availableTodayDiv);
      availabilityDiv.appendChild(availableFutureDiv);

      infoDiv.appendChild(brandDiv);
      infoDiv.appendChild(title);
      infoDiv.appendChild(codeP);
      infoDiv.appendChild(articleP);
      infoDiv.appendChild(packagingP);
      infoDiv.appendChild(priceDiv);
      infoDiv.appendChild(actionsDiv);
      infoDiv.appendChild(availabilityDiv);

      card.appendChild(infoDiv);

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  function renderTableView(data) {
    const productContainer = document.getElementById("productContainer");
    productContainer.className = "";
    productContainer.innerHTML = "";

    const table = document.createElement("table");
    table.className = "iksweb";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Заголовки таблицы
    const headers = [
      "",
      "",
      "Код",
      "Наименование",
      "Прайс",
      "Вход. Цена",
      "Отказ %",
      "Цена",
      "Мин. Кол.",
      "Наличие:",
      "",
      "Кол.",
      "Сумма",
    ];

    // Хранение текущего состояния сортировки
    let currentSortColumn = "Цена"; // По умолчанию сортировка по "Цена"
    let currentSortOrder = "asc"; // По умолчанию по возрастанию

    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;

      // Если колонка подлежит сортировке
      if (
        [
          "Код",
          "Наименование",
          "Прайс",
          "Вход. Цена",
          "Отказ %",
          "Цена",
          "Кол.",
          "Сумма",
        ].includes(headerText)
      ) {
        th.classList.add("sortable");
        th.dataset.column = headerText;
        th.dataset.order = ""; // Изначально не отсортировано
        th.innerHTML = `${headerText} <span class="sort-arrow"></span>`;
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Функция обновления строк таблицы
    function updateTableRows(sortedData) {
      tbody.innerHTML = ""; // Очищаем тело таблицы
      sortedData.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${
                      row["Изображение"]
                        ? `<img src="${row["Изображение"]}" alt="image" class="product-image" data-fullsrc="${row["Изображение"]}" data-tooltip="Просмотреть изображение товара">`
                        : ""
                    }</td>
                    <td>${row["Код"]}</td>
                    <td class="name-cell" data-tooltip="Перейти к подробному описанию товара">${
                      row["Наименование"]
                    }</td>
                    <td data-tooltip="Цена товара">${row["Прайс"] || ""}</td>
                    <td data-tooltip="Входная цена товара">${
                      row["Вход. Цена"] || ""
                    }</td>
                    <td data-tooltip="Процент отказа">${
                      row["Отказ %"] || ""
                    }</td>
                    <td class="price-cell" data-tooltip="Цена товара">${
                      row["Цена"] || ""
                    }</td>
                    <td class="min-col" data-tooltip="Минимальное количество для заказа">${
                      row["Мин. Кол."] || 1
                    }</td>
                    <td class="nalich" data-tooltip="Количество товара в наличии">${
                      row["Наличие"] || "0"
                    }</td>
                    <td data-tooltip="Информация о логистике">${
                      row["Логистика"] || ""
                    }</td>
                    <td class="name-cell">
                        <div class="name-cell-wrapper">
                            <input type="number" class="quantity-input" value="0" min="${
                              row["Мин. Кол."] || 1
                            }" step="${row["Мин. Кол."] || 1}"
                                data-min-qty="${
                                  row["Мин. Кол."] || 1
                                }" data-max-qty="${
          row["Наличие"] || 0
        }" data-tooltip="Введите количество товара (Минимум: ${
          row["Мин. Кол."] || 1
        })">
                            <img src="/images/svg/Icon/cart_ico.svg" alt="Cart Icon" class="cart-icon" data-tooltip="Добавить этот товар в корзину">
                        </div>
                    </td>
                    <td class="sum-cell" data-tooltip="Сумма заказа">${
                      row["Сумма"] || ""
                    }</td>
                `;
        tbody.appendChild(tr);
      });
    }

    updateTableRows(data); // Изначально заполняем строки таблицы

    table.appendChild(tbody);
    productContainer.appendChild(table);

    // Обработчик сортировки
    thead.addEventListener("click", (event) => {
      const target = event.target.closest("th");

      if (target && target.classList.contains("sortable")) {
        const column = target.dataset.column;

        // Определяем новый порядок сортировки
        const newOrder =
          currentSortColumn === column && currentSortOrder === "asc"
            ? "desc"
            : "asc";
        currentSortColumn = column;
        currentSortOrder = newOrder;

        // Сортируем данные
        const sortedData = [...data].sort((a, b) => {
          const valueA = a[column] || "";
          const valueB = b[column] || "";

          if (newOrder === "asc") {
            return valueA > valueB ? 1 : -1;
          } else {
            return valueA < valueB ? 1 : -1;
          }
        });

        // Обновляем строки таблицы
        updateTableRows(sortedData);

        // Обновляем заголовки
        Array.from(thead.querySelectorAll(".sortable")).forEach((th) => {
          const arrow = th.querySelector(".sort-arrow");
          if (th.dataset.column === column) {
            arrow.textContent = newOrder === "asc" ? "▲" : "▼";
            arrow.style.color = "orange";
          } else {
            arrow.textContent = "";
          }
        });
      }
    });

    const popupImage = document.createElement("img");
    popupImage.style.display = "none";
    popupImage.style.position = "absolute";
    popupImage.style.zIndex = "1000";
    popupImage.style.borderRadius = "10px";
    popupImage.setAttribute("data-tooltip", "Увеличенное изображение товара");
    document.body.appendChild(popupImage);

    const quantityInputs = tbody.querySelectorAll(".quantity-input");

    quantityInputs.forEach(function (input) {
      validateAndCorrectInput(input, false);

      input.addEventListener("blur", function () {
        validateAndCorrectInput(this, true);
      });
    });

    function validateAndCorrectInput(input, showPopup = true) {
      let value = parseInt(input.value, 10) || 0;
      const minQty = parseInt(input.dataset.minQty, 10) || 1;
      const maxQty = parseInt(input.dataset.maxQty, 10) || 0;

      if (value < 0) {
        value = 0;
      }

      value = Math.ceil(value / minQty) * minQty;

      if (value > maxQty) {
        value = maxQty;

        if (showPopup) {
          showWaitingListPopup(input);
        }
      }

      if (value === 0) {
        input.value = "";
      } else {
        input.value = value;
      }

      updateSum(input);
    }

    function updateSum(input) {
      const row = input.closest("tr");
      const priceText = row
        .querySelector("td.price-cell")
        .textContent.replace(",", ".");
      const price = parseFloat(priceText) || 0;
      const quantity = parseInt(input.value, 10) || 0;
      const sumCell = row.querySelector("td.sum-cell");
      sumCell.textContent = (price * quantity).toFixed(2);
    }

    function showWaitingListPopup(input) {
      const row = input.closest("tr");

      if (row.querySelector(".waiting-list-popup")) {
        return;
      }

      const popup = document.createElement("div");
      popup.classList.add("waiting-list-popup");
      popup.innerHTML = `
                <p class="waiting-list-text" data-tooltip="Добавить товар в лист ожидания">Добавить в лист ожидания?</p>
                <button class="close-popup" data-tooltip="Закрыть всплывающее окно">&times;</button>
            `;

      popup.style.position = "absolute";
      popup.style.zIndex = "1000";
      popup.style.left = "700px";

      row.appendChild(popup);

      const rowRect = row.getBoundingClientRect();
      const table = row.closest("table");
      if (table) {
        const tableRect = table.getBoundingClientRect();
        popup.style.top = rowRect.bottom - tableRect.top + "px";
      } else {
        popup.style.top = `${rowRect.bottom}px`;
      }

      popup.classList.add("animate-popup");

      popup
        .querySelector(".close-popup")
        .addEventListener("click", function () {
          popup.remove();
        });

      const waitingListText = popup.querySelector(".waiting-list-text");
      waitingListText.style.cursor = "pointer";

      waitingListText.addEventListener("click", function handleClick() {
        popup.classList.add("expand-popup");

        const formContent = document.createElement("div");
        formContent.classList.add("popup-form-content");

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

        const inputs = formContent.querySelectorAll("input, textarea");
        inputs.forEach(function (input) {
          input.style.opacity = "0.7";
          input.addEventListener("focus", function () {
            this.style.opacity = "1";
          });
          input.addEventListener("blur", function () {
            if (!this.value) {
              this.style.opacity = "0.7";
            }
          });
        });

        popup
          .querySelector(".add-to-waiting-list")
          .addEventListener("click", function () {
            // Логика добавления в лист ожидания

            popup.remove();
          });

        waitingListText.removeEventListener("click", handleClick);
      });
    }

    tbody.addEventListener("mouseover", function (event) {
      const target = event.target;
      if (target.classList.contains("product-image")) {
        const fullSrc = target.getAttribute("data-fullsrc");
        popupImage.src = fullSrc;
        popupImage.style.display = "block";
      }
    });

    tbody.addEventListener("mousemove", function (event) {
      if (popupImage.style.display === "block") {
        const imageWidth = 300;
        const imageHeight = 300;
        const padding = 20;

        let leftPosition = event.pageX + padding;
        let topPosition = event.pageY + padding;

        if (leftPosition + imageWidth > window.innerWidth + window.scrollX) {
          leftPosition = event.pageX - imageWidth - padding;
        }

        if (topPosition + imageHeight > window.innerHeight + window.scrollY) {
          topPosition = event.pageY - imageHeight - padding;
        }

        popupImage.style.left = leftPosition + "px";
        popupImage.style.top = topPosition + "px";
        popupImage.style.width = imageWidth + "px";
        popupImage.style.height = imageHeight + "px";
      }
    });

    tbody.addEventListener("mouseout", function (event) {
      if (event.target.classList.contains("product-image")) {
        popupImage.style.display = "none";
      }
    });
  }

  // Обработчик для иконок корзины
  document.body.addEventListener("click", function (event) {
    if (event.target.classList.contains("cart-icon")) {
      const icon = event.target;
      if (icon.src.includes("/images/svg/Icon/cart_ico.svg")) {
        icon.src = "/images/svg/Icon/carted_ico.svg";
      } else {
        icon.src = "/images/svg/Icon/cart_ico.svg";
      }
    }
  });
});
