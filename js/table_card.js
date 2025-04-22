window.initTableCardView = function (root = document) {
  // Mobile detection - exit early if on mobile
  const isMobile =
    window.innerWidth <= 768 ||
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/iPhone|iPad|iPod/i);

  if (isMobile) {
    console.log("Mobile device detected, table card view not initialized");
    return;
  }

  // Continue with the original functionality for desktop only
  let isCardView = false;
  let dataCache = null;
  let imageCache = {};

  // Вспомогательная функция для установки нескольких стилей одновременно
  function setStyles(element, styles) {
    for (let property in styles) {
      element.style[property] = styles[property];
    }
  }

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

      container.innerHTML = ""; // Очистка контейнера
      indicatorsContainer.innerHTML = ""; // Очистка индикаторов

      images.forEach((src, index) => {
        const img = root.createElement
          ? root.createElement("img")
          : document.createElement("img");
        img.src = src;
        img.loading = "lazy";
        img.classList.add("product-image");

        // Применение стилей inline для image-container img
        setStyles(img, {
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "auto",
          height: "calc(100% - 5px)",
          transform: "translate(-50%, -50%)",
          objectFit: "cover",
          display: index === 0 ? "block" : "none",
          borderRadius: "14px",
          marginTop: "5px",
        });

        img.setAttribute("data-fullsrc", src);
        img.setAttribute("data-tooltip", "Просмотреть изображение товара");
        container.appendChild(img);
      });

      images.forEach((_, index) => {
        const indicator = root.createElement
          ? root.createElement("div")
          : document.createElement("div");
        indicator.classList.add("indicator");

        // Применение стилей inline для индикаторов
        setStyles(indicator, {
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          boxShadow: "0 3px 4px rgba(0, 0, 0, 0.2)",
          cursor: "pointer",
          transition: "transform 0.3s ease, background-color 0.3s ease",
        });

        if (index === 0) {
          indicator.classList.add("active");
          setStyles(indicator, {
            transform: "scale(1.5)",
            backgroundColor: "#fe9c00",
          });
        }

        indicator.style.zIndex = "10";
        indicator.style.display = "flex";
        indicatorsContainer.appendChild(indicator);
      });

      // Делегирование событий на индикаторы
      indicatorsContainer.addEventListener("click", function (event) {
        if (event.target.classList.contains("indicator")) {
          const indicators = indicatorsContainer.querySelectorAll(".indicator");
          const imgs = container.querySelectorAll(".product-image");
          const idx = Array.from(indicators).indexOf(event.target);
          if (idx !== -1) {
            imgs.forEach((img) => (img.style.display = "none"));
            imgs[idx].style.display = "block";

            indicators.forEach((ind, index) => {
              if (index === idx) {
                ind.classList.add("active");
                setStyles(ind, {
                  transform: "scale(1.5)",
                  backgroundColor: "#fe9c00",
                });
              } else {
                ind.classList.remove("active");
                setStyles(ind, {
                  transform: "scale(1)",
                  backgroundColor: "#ffffff",
                });
              }
            });
          }
        }
      });

      // При движении мыши — «горизонтальное колесо»
      container.addEventListener("mousemove", function (e) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const segmentWidth = rect.width / images.length;
        const idx = Math.min(Math.floor(x / segmentWidth), images.length - 1);

        const imgs = container.querySelectorAll(".product-image");
        imgs.forEach((img, index) => {
          img.style.display = index === idx ? "block" : "none";
        });

        const indicators = indicatorsContainer.querySelectorAll(".indicator");
        indicators.forEach((ind, index) => {
          if (index === idx) {
            ind.classList.add("active");
            setStyles(ind, {
              transform: "scale(1.5)",
              backgroundColor: "#fe9c00",
            });
          } else {
            ind.classList.remove("active");
            setStyles(ind, {
              transform: "scale(1)",
              backgroundColor: "#ffffff",
            });
          }
        });
      });

      // При покидании зоны — сбрасываем на первое
      container.addEventListener("mouseleave", () => {
        const imgs = container.querySelectorAll(".product-image");
        imgs.forEach((img, index) => {
          img.style.display = index === 0 ? "block" : "none";
        });

        const indicators = indicatorsContainer.querySelectorAll(".indicator");
        indicators.forEach((ind, index) => {
          if (index === 0) {
            ind.classList.add("active");
            setStyles(ind, {
              transform: "scale(1.5)",
              backgroundColor: "#fe9c00",
            });
          } else {
            ind.classList.remove("active");
            setStyles(ind, {
              transform: "scale(1)",
              backgroundColor: "#ffffff",
            });
          }
        });
      });
    } catch (error) {
      console.error(
        `Ошибка при рендеринге изображений для артикула ${article}: ${error}`
      );
      container.innerHTML = "<p>Ошибка при загрузке изображений.</p>";
      indicatorsContainer.innerHTML = "";
    }
  }

  // Функция для рендера карточного вида
  function renderCardView(data) {
    const productContainer = root.getElementById("productContainer");
    if (!productContainer) {
      console.warn("Отсутствует контейнер #productContainer");
      return;
    }

    // Сброс стилей контейнера
    setStyles(productContainer, {
      display: "",
      gridTemplateColumns: "",
      gap: "",
      justifyContent: "",
      padding: "",
      margin: "",
      width: "",
      borderCollapse: "",
      borderSpacing: "",
    });

    // Применение стилей inline для productContainer (product-grid)
    setStyles(productContainer, {
      display: "grid",
      gap: "10px",
      justifyContent: "center",
      padding: "10px",
    });

    const maxRows = 7;
    let cardsPerRow = 5; // базовое значение для больших экранов, когда сайдбар открыт

    // Обновлённая функция для определения количества карточек в ряду с учётом состояния сайдбара
    function updateCardsPerRow() {
      const width = window.innerWidth;
      let defaultCardsPerRow;
      if (width <= 900) {
        defaultCardsPerRow = 2; // для небольших экранов — 2 карточки
      } else if (width <= 1200) {
        defaultCardsPerRow = 3; // для средних экранов — 3 карточки
      } else {
        defaultCardsPerRow = 5; // для больших экранов — 5 карточек (стандарт, когда сайдбар открыт)
      }
      // Проверяем состояние сайдбара
      const filtersPanel = root.getElementById("filters-panel");
      if (filtersPanel && filtersPanel.classList.contains("collapsed")) {
        cardsPerRow = defaultCardsPerRow + 1; // если сайдбар закрыт, добавляем одну карточку
      } else {
        cardsPerRow = defaultCardsPerRow;
      }
      // Обновляем количество колонок в сетке
      setStyles(productContainer, {
        gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)`,
      });
    }

    updateCardsPerRow();

    // Обработчик изменения размера окна для адаптивности
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
      );
      window.resizeHandlerAdded = true;
    }

    productContainer.innerHTML = "";
    renderCards(data, productContainer, maxRows * cardsPerRow);
  }

  // Функция для рендера карточек продуктов с изменениями для Card View
  function renderCards(data, container, maxCards) {
    const fragment = root.createDocumentFragment
      ? root.createDocumentFragment()
      : document.createDocumentFragment();

    data.slice(0, maxCards).forEach((item) => {
      const brandInfo = getBrandInfo(item["Наименование"]);

      const card = root.createElement
        ? root.createElement("div")
        : document.createElement("div");

      // Применение стилей inline для product-card-custom
      setStyles(card, {
        width: "100%",
        aspectRatio: "3 / 6",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.3s ease",
        display: "flex",
        flexDirection: "column",
        fontSize: "calc(16px * var(--card-scale))",
        position: "relative",
      });

      // Эффект hover для карточки
      card.addEventListener("mouseover", () => {
        card.style.transform = "translateY(-5px)";
      });
      card.addEventListener("mouseout", () => {
        card.style.transform = "translateY(0)";
      });

      // Блок с изображением
      const imageDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(imageDiv, {
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "300px",
      });

      const mainContainer = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(mainContainer, {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      });

      const imagesContainer = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(imagesContainer, {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      });
      mainContainer.appendChild(imagesContainer);

      const indicatorsContainer = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(indicatorsContainer, {
        position: "absolute",
        bottom: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "10px",
        zIndex: "4",
        opacity: "0",
        pointerEvents: "none",
        transition: "opacity 0.3s ease",
      });
      mainContainer.appendChild(indicatorsContainer);

      mainContainer.addEventListener("mouseover", () => {
        indicatorsContainer.style.opacity = "1";
        indicatorsContainer.style.pointerEvents = "all";
      });
      mainContainer.addEventListener("mouseout", () => {
        indicatorsContainer.style.opacity = "0";
        indicatorsContainer.style.pointerEvents = "none";
      });

      const article = item["Код"];
      if (article) {
        renderImages(imagesContainer, indicatorsContainer, article);
      } else {
        imagesContainer.innerHTML =
          "<p>Нет изображений для данного артикула.</p>";
      }

      imageDiv.appendChild(mainContainer);
      card.appendChild(imageDiv);

      // Информация о продукте
      const infoDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(infoDiv, {
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "8px",
      });

      const brandDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(brandDiv, {
        display: "flex",
        alignItems: "end",
        marginBottom: "0.5em",
      });

      const brandImg = root.createElement
        ? root.createElement("img")
        : document.createElement("img");
      brandImg.src = brandInfo.logo;
      brandImg.alt = brandInfo.name;
      setStyles(brandImg, {
        width: "2.5em",
        height: "auto",
        marginRight: "0.5em",
        borderRadius: "5px",
        transition: "transform 0.3s ease",
        cursor: "pointer",
      });
      brandImg.addEventListener("mouseover", () => {
        brandImg.style.transform = "scale(1.03)";
      });
      brandImg.addEventListener("mouseout", () => {
        brandImg.style.transform = "scale(1)";
      });

      const brandSpan = root.createElement
        ? root.createElement("span")
        : document.createElement("span");
      brandSpan.textContent = brandInfo.name;
      setStyles(brandSpan, {
        color: "#999",
        fontSize: "0.9em",
      });

      brandDiv.appendChild(brandImg);
      brandDiv.appendChild(brandSpan);

      const title = root.createElement
        ? root.createElement("h2")
        : document.createElement("h2");
      title.textContent = item["Наименование"];
      title.setAttribute(
        "data-tooltip",
        `Перейти к подробному описанию товара: ${item["Наименование"]}`
      );
      setStyles(title, {
        fontSize: "0.8rem",
        fontWeight: "600",
        color: "#333",
        marginBottom: "5px",
        lineHeight: "1.2",
        height: "3.6em",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        wordWrap: "break-word",
        whiteSpace: "normal",
      });

      const codeP = root.createElement
        ? root.createElement("p")
        : document.createElement("p");
      codeP.innerHTML = `Код товара: <span>${item["Код"]}</span>`;
      codeP.setAttribute("data-tooltip", `Код товара: ${item["Код"]}`);
      setStyles(codeP, {
        fontSize: "0.75em",
        color: "#666",
        margin: "0.125em 0",
      });
      setStyles(codeP.querySelector("span"), {
        color: "#333",
      });

      const articleP = root.createElement
        ? root.createElement("p")
        : document.createElement("p");
      articleP.innerHTML = `Артикул: <span>${
        item["Артикул"] || "Не указан"
      }</span>`;
      articleP.setAttribute(
        "data-tooltip",
        `Артикул товара: ${item["Артикул"] || "Не указан"}`
      );
      setStyles(articleP, {
        fontSize: "0.75em",
        color: "#666",
        margin: "0.125em 0",
      });
      setStyles(articleP.querySelector("span"), {
        color: "#333",
      });

      const packagingP = root.createElement
        ? root.createElement("p")
        : document.createElement("p");
      packagingP.innerHTML = `Упаковка: <a href="#">${
        item["Упаковка"] || "1 шт."
      }</a>`;
      packagingP.setAttribute(
        "data-tooltip",
        `Информация об упаковке: ${item["Упаковка"] || "1 шт."}`
      );
      setStyles(packagingP, {
        fontSize: "0.75em",
        color: "#666",
        margin: "0.125em 0",
      });
      const packagingLink = packagingP.querySelector("a");
      setStyles(packagingLink, {
        color: "#638a8e",
        textDecoration: "none",
        transition: "color 0.3s ease",
      });
      packagingLink.addEventListener("mouseover", () => {
        packagingLink.style.color = "#2ca6d2";
      });
      packagingLink.addEventListener("mouseout", () => {
        packagingLink.style.color = "#638a8e";
      });

      // Цены
      const priceDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(priceDiv, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "0.625em 0",
      });

      const currentPriceDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      currentPriceDiv.innerHTML = `<span>Ваша цена</span><strong>${item["Цена"]} ₽</strong>`;
      currentPriceDiv.setAttribute(
        "data-tooltip",
        `Цена для вас: ${item["Цена"]} ₽`
      );
      setStyles(currentPriceDiv, {
        fontSize: "0.6em",
      });
      setStyles(currentPriceDiv.querySelector("span"), {
        color: "#999",
      });
      const currentPriceStrong = currentPriceDiv.querySelector("strong");
      setStyles(currentPriceStrong, {
        display: "block",
        color: "#333",
        fontSize: "1.6em",
        fontWeight: "700",
        marginTop: "0.125em",
      });

      const retailPriceDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      retailPriceDiv.innerHTML = `<span>Розн. цена</span><strong>${item["Розничная цена"]} ₽</strong>`;
      retailPriceDiv.setAttribute(
        "data-tooltip",
        `Розничная цена: ${item["Розничная цена"]} ₽`
      );
      setStyles(retailPriceDiv, {
        fontSize: "0.75em",
      });
      setStyles(retailPriceDiv.querySelector("span"), {
        color: "#999",
      });
      const retailPriceStrong = retailPriceDiv.querySelector("strong");
      setStyles(retailPriceStrong, {
        display: "block",
        color: "#bbb",
        fontSize: "0.875em",
        fontWeight: "500",
        textDecoration: "line-through",
        marginTop: "0.125em",
      });

      priceDiv.appendChild(currentPriceDiv);
      priceDiv.appendChild(retailPriceDiv);

      // Действия
      const actionsDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(actionsDiv, {
        display: "flex",
        gap: "5px",
        width: "100%",
        boxSizing: "border-box",
        alignItems: "stretch",
        height: "25px",
        marginBottom: "7px",
      });

      const quantityInput = root.createElement
        ? root.createElement("input")
        : document.createElement("input");
      quantityInput.type = "number";
      quantityInput.value = "0";
      quantityInput.min = item["Мин. Кол."] || 1;
      quantityInput.step = item["Мин. Кол."] || 1;
      quantityInput.classList.add("product-quantity-custom");
      quantityInput.setAttribute(
        "data-tooltip",
        `Введите количество (Мин: ${item["Мин. Кол."] || 1})`
      );
      setStyles(quantityInput, {
        flex: "2",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "14px",
        textAlign: "left",
        width: "100px", // Фиксированная ширина
      });

      const addToCartButton = root.createElement
        ? root.createElement("button")
        : document.createElement("button");
      addToCartButton.textContent = "В корзину";
      addToCartButton.classList.add("add-to-cart-button");
      addToCartButton.setAttribute(
        "data-tooltip",
        "Добавить этот товар в корзину"
      );
      setStyles(addToCartButton, {
        flex: "1",
        padding: "2px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "12px",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
      });

      addToCartButton.addEventListener("mouseover", () => {
        addToCartButton.style.backgroundColor = "#45a049";
      });
      addToCartButton.addEventListener("mouseout", () => {
        addToCartButton.style.backgroundColor = "#4caf50";
      });

      actionsDiv.appendChild(quantityInput);
      actionsDiv.appendChild(addToCartButton);

      const availabilityDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      setStyles(availabilityDiv, {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.75em",
        color: "#666",
        borderTop: "1px solid #e0e0e0",
        paddingTop: "0.5em",
      });

      const availableTodayDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      availableTodayDiv.innerHTML = `<span>В наличии</span><strong>${
        item["Наличие"] || "0"
      } шт.</strong>`;
      availableTodayDiv.setAttribute(
        "data-tooltip",
        `Количество товара в наличии: ${item["Наличие"] || "0"}`
      );
      setStyles(availableTodayDiv, {
        textAlign: "center",
      });
      setStyles(availableTodayDiv.querySelector("span"), {
        display: "block",
        color: "#999",
        fontSize: "1em",
        marginBottom: "0.1em",
      });
      const availableTodayStrong = availableTodayDiv.querySelector("strong");
      setStyles(availableTodayStrong, {
        color: "#333",
        fontSize: "1.3em",
      });

      const availableFutureDiv = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      availableFutureDiv.innerHTML = `<span>${
        item["Дата поступления"] || "В пути"
      }</span><strong>${item["В пути"] || "0"} шт.</strong>`;
      availableFutureDiv.setAttribute(
        "data-tooltip",
        `Товар в пути: ${item["В пути"] || 0} (ожидается ${
          item["Дата поступления"] || "неизвестно"
        })`
      );
      setStyles(availableFutureDiv, {
        textAlign: "center",
      });
      setStyles(availableFutureDiv.querySelector("span"), {
        display: "block",
        color: "#999",
        fontSize: "1em",
        marginBottom: "0.1em",
      });
      const availableFutureStrong = availableFutureDiv.querySelector("strong");
      setStyles(availableFutureStrong, {
        color: "#333",
        fontSize: "1.3em",
      });

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

  // Функция для рендера табличного вида
  function renderTableView(data) {
    const productContainer = root.getElementById("productContainer");
    if (!productContainer) {
      console.warn("Отсутствует контейнер #productContainer");
      return;
    }

    // Очистка контейнера и сброс стилей
    productContainer.innerHTML = "";
    setStyles(productContainer, {
      display: "block", // Устанавливаем блок для таблицы
      margin: "0 auto", // Центрируем таблицу
      padding: "0",
      width: "calc(100%)", // Задаем ширину таблицы с отступами
    });

    const table = root.createElement
      ? root.createElement("table")
      : document.createElement("table");
    setStyles(table, {
      width: "100%",
      borderCollapse: "collapse",
      margin: "0 auto",
      padding: "0",
      borderSpacing: "0", // Убирает отступы между ячейками
    });

    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
      setStyles(row, {
        borderLeft: "none",
        borderRight: "none",
      });
    });

    table.classList.add("iksweb"); // Добавляем класс для функциональности, если необходимо

    const thead = root.createElement
      ? root.createElement("thead")
      : document.createElement("thead");
    const headerRow = root.createElement
      ? root.createElement("tr")
      : document.createElement("tr");

    const headers = [
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

    let currentSortColumn = "Цена";
    let currentSortOrder = "asc";

    headers.forEach((headerText) => {
      const th = root.createElement
        ? root.createElement("th")
        : document.createElement("th");
      th.textContent = headerText;

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
        th.setAttribute("data-column", headerText);
        th.setAttribute("data-order", "");
        th.innerHTML = `${headerText} <span style="position: absolute; right: 5px;"></span>`;
      }

      // Применение базовых стилей для заголовков
      setStyles(th, {
        padding: "8px",
        border: "1px solid #ddd",
        backgroundColor: "#f0f0f0",
        whiteSpace: "nowrap",
        cursor: "pointer",
        position: "relative",
        userSelect: "none",
      });

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = root.createElement
      ? root.createElement("tbody")
      : document.createElement("tbody");

    function updateTableRows(sortedData) {
      tbody.innerHTML = "";
      sortedData.forEach((row, index) => {
        const tr = root.createElement
          ? root.createElement("tr")
          : document.createElement("tr");
        setStyles(tr, {
          backgroundColor: "#ffffff",
        });

        tr.innerHTML = `
          <td style="padding: 8px; border: 1px solid #ddd;">${
            row["Изображение"]
              ? `<img src="${row["Изображение"]}" alt="image" class="product-image" 
                   data-fullsrc="${row["Изображение"]}" data-tooltip="Просмотреть изображение товара"
                   style="width: 50px; height: 50px; object-fit: cover; cursor: pointer; border-radius: 5px; transition: transform 0.3s ease;">`
              : ""
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${row["Код"]}</td>
          <td style="padding: 8px; border: 1px solid #ddd;" data-tooltip="Описание">${
            row["Наименование"]
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;" data-tooltip="Цена товара">${
            row["Прайс"] || ""
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;" data-tooltip="Входная цена">${
            row["Вход. Цена"] || ""
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;" data-tooltip="Процент отказа">${
            row["Отказ %"] || ""
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;" data-tooltip="Цена товара">${
            row["Цена"] || ""
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;" data-tooltip="Минимальное количество">${
            row["Мин. Кол."] || 1
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;" data-tooltip="Наличие">${
            row["Наличие"] || "0"
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;" data-tooltip="Логистика">${
            row["Логистика"] || ""
          }</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <div style="display: inline-flex; align-items: center; gap: 10px;">
              <input type="number" class="quantity-input" value="0" min="${
                row["Мин. Кол."] || 1
              }" step="${row["Мин. Кол."] || 1}"
                data-min-qty="${row["Мин. Кол."] || 1}"
                data-max-qty="${row["Наличие"] || 0}"
                data-tooltip="Введите количество"
                style="width: 120px; padding: 7px; border: 1px solid #ccc; border-radius: 5px; font-size: 14px; background-color: #f9f9f9; transition: border-color 0.2s, background-color 0.2s, text-align 0.2s; text-align: center;">
              <img src="/images/svg/Icon/cart_ico.svg" alt="Cart Icon"
                class="cart-icon" data-tooltip="Добавить этот товар в корзину"
                style="width: 24px; height: 24px; border-radius: 5px; cursor: pointer; transition: transform 0.1s ease-in-out;">
            </div>
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;" data-tooltip="Сумма">${
            row["Сумма"] || ""
          }</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Первоначальная отрисовка
    updateTableRows(data);
    table.appendChild(tbody);
    productContainer.appendChild(table);

    // Обработчик сортировки по клику на заголовок
    thead.addEventListener("click", (event) => {
      const target = event.target.closest("th");
      if (target && target.hasAttribute("data-column")) {
        const column = target.getAttribute("data-column");
        const newOrder =
          currentSortColumn === column && currentSortOrder === "asc"
            ? "desc"
            : "asc";
        currentSortColumn = column;
        currentSortOrder = newOrder;

        const sortedData = [...data].sort((a, b) => {
          const valueA = a[column] || "";
          const valueB = b[column] || "";
          if (newOrder === "asc") {
            return valueA > valueB ? 1 : -1;
          } else {
            return valueA < valueB ? 1 : -1;
          }
        });

        updateTableRows(sortedData);

        Array.from(thead.querySelectorAll("th")).forEach((th) => {
          const arrow = th.querySelector("span");
          if (th.getAttribute("data-column") === column) {
            arrow.textContent = newOrder === "asc" ? "▲" : "▼";
            arrow.style.color = "orange";
          } else {
            arrow.textContent = "";
            arrow.style.color = "";
          }
        });
      }
    });

    // Всплывающее увеличенное изображение
    const popupImage = root.createElement
      ? root.createElement("img")
      : document.createElement("img");
    setStyles(popupImage, {
      display: "none",
      position: "absolute",
      zIndex: "1000",
      borderRadius: "10px",
      width: "220px",
      height: "220px",
      border: "1px solid #ddd",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.16)",
    });
    popupImage.setAttribute("data-tooltip", "Увеличенное изображение товара");
    root.appendChild(popupImage);

    // Обработчики для всплывающего изображения
    tbody.addEventListener("mouseover", function (event) {
      if (event.target.classList.contains("product-image")) {
        const fullSrc = event.target.getAttribute("data-fullsrc");
        popupImage.src = fullSrc;
        popupImage.style.display = "block";
      }
    });

    tbody.addEventListener("mousemove", function (event) {
      if (popupImage.style.display === "block") {
        const imageWidth = 200;
        const imageHeight = 200;
        const padding = 20;
        const cushion = 0.2 * window.innerHeight; // запас 20% от высоты окна

        let leftPosition = event.pageX + padding;
        let topPosition = event.pageY + padding;

        if (leftPosition + imageWidth > window.innerWidth + window.scrollX) {
          leftPosition = event.pageX - imageWidth - padding;
        }
        if (
          topPosition + imageHeight >
          window.innerHeight + window.scrollY - cushion
        ) {
          topPosition = event.pageY - imageHeight - padding;
        }

        setStyles(popupImage, {
          left: `${leftPosition}px`,
          top: `${topPosition}px`,
        });
      }
    });

    tbody.addEventListener("mouseout", function (event) {
      if (event.target.classList.contains("product-image")) {
        popupImage.style.display = "none";
      }
    });

    // Обработчики для инпутов количества
    const quantityInputs = tbody.querySelectorAll(".quantity-input");
    quantityInputs.forEach((input) => {
      validateAndCorrectInput(input, false);
      input.addEventListener("blur", function () {
        validateAndCorrectInput(this, true);
      });
    });

    function validateAndCorrectInput(input, showPopup = true) {
      let value = parseInt(input.value, 10) || 0;
      const minQty = parseInt(input.getAttribute("data-min-qty"), 10) || 1;
      const maxQty = parseInt(input.getAttribute("data-max-qty"), 10) || 0;

      if (value < 0) {
        value = 0;
      }

      // Округление до ближайшего шага (минимальной партии)
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
      const priceCell = row.querySelector(".price-cell");
      if (!priceCell) return;
      const priceText = priceCell.textContent.replace(",", ".");
      const price = parseFloat(priceText) || 0;
      const quantity = parseInt(input.value, 10) || 0;
      const sumCell = row.querySelector(".sum-cell");
      if (sumCell) sumCell.textContent = (price * quantity).toFixed(2);
    }

    function showWaitingListPopup(input) {
      const row = input.closest("tr");
      if (row.querySelector(".waiting-list-popup")) {
        return;
      }

      const popup = root.createElement
        ? root.createElement("div")
        : document.createElement("div");
      popup.classList.add("waiting-list-popup");
      popup.innerHTML = `
        <p class="waiting-list-text" data-tooltip="Добавить товар в лист ожидания">
          Добавить в лист ожидания?
        </p>
        <button class="close-popup" data-tooltip="Закрыть">&times;</button>
      `;

      // Применение стилей inline для popup
      setStyles(popup, {
        position: "absolute",
        zIndex: "1000",
        left: "700px",
        top: "0px",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        width: "200px",
        transition: "opacity 0.3s ease",
        opacity: "1",
      });

      row.appendChild(popup);

      const rowRect = row.getBoundingClientRect();
      const table = row.closest("table");
      if (table) {
        const tableRect = table.getBoundingClientRect();
        popup.style.top = `${rowRect.bottom - tableRect.top}px`;
      } else {
        popup.style.top = `${rowRect.bottom}px`;
      }

      const closeButton = popup.querySelector(".close-popup");
      setStyles(closeButton, {
        cursor: "pointer",
        background: "none",
        border: "none",
        fontSize: "1.2em",
        lineHeight: "1em",
        color: "#333",
        position: "absolute",
        top: "5px",
        right: "10px",
      });

      closeButton.addEventListener("click", function () {
        popup.remove();
      });

      const waitingListText = popup.querySelector(".waiting-list-text");
      setStyles(waitingListText, {
        cursor: "pointer",
      });

      function handleClick() {
        popup.style.height = "auto";
        popup.innerHTML = `
          <div class="popup-form-content">
            <div class="form-group" style="margin-bottom: 10px;">
              <label>Количество:</label>
              <input type="number" class="waiting-quantity" placeholder="Сколько?"
                data-tooltip="Введите количество для листа ожидания"
                style="width: 100%; padding: 5px; margin-top: 5px;">
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
              <label>Комментарий:</label>
              <textarea class="waiting-comment" placeholder="Например: Прошу связаться со мной..."
                data-tooltip="Добавьте комментарий для листа ожидания"
                style="width: 100%; padding: 5px; margin-top: 5px;"></textarea>
            </div>
            <button class="add-to-waiting-list" data-tooltip="Добавить товар в лист ожидания"
              style="padding: 5px 10px; background-color: #638a8e; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
              Добавить
            </button>
          </div>
        `;

        const addToWaitingListButton = popup.querySelector(
          ".add-to-waiting-list"
        );
        addToWaitingListButton.addEventListener("click", () => {
          // Здесь логика "Добавлено в лист ожидания"
          console.log("Добавлено в лист ожидания");
          popup.remove();
        });

        waitingListText.removeEventListener("click", handleClick);
      }

      waitingListText.addEventListener("click", handleClick);
    }

    // Глобальный обработчик для кликов по иконке корзины
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
  }

  // Функция для очистки значений "0"
  function cleanQuantityInputs() {
    // ищем внутри root
    const inputs = root.querySelectorAll(".product-quantity-custom");
    inputs.forEach((input) => {
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

  // Загрузка данных из JSON
  fetch("/data/data.json")
    .then((response) => response.json())
    .then((data) => {
      dataCache = data.map((item) => {
        const retailPrice =
          parseFloat(item["Розничная цена"] || item["Цена"]) || 0;
        // Увеличиваем на 25%
        item["Розничная цена"] = (retailPrice * 1.25).toFixed(2);
        return item;
      });

      // Определяем стартовый вид (по умолчанию - табличный)
      const currentView = localStorage.getItem("currentView") || "table-view";
      // Здесь оставляем именно document.body,
      // т.к. хотим менять классы на весь документ
      document.body.classList.add(currentView);

      if (currentView === "card-view") {
        renderCardView(dataCache);
      } else {
        renderTableView(dataCache);
      }

      cleanQuantityInputs(); // Очистка значений "0" при загрузке

      const toggleButton = root.getElementById("toggleViewButton");
      if (!toggleButton) {
        console.warn("Кнопка переключения вида #toggleViewButton не найдена");
        return;
      }

      const toggleButtonImage = toggleButton.querySelector(
        ".toggle-button-image"
      );
      if (toggleButtonImage) {
        toggleButtonImage.src =
          currentView === "card-view"
            ? "/images/svg/Icon/table.svg"
            : "/images/svg/Icon/card.svg";
      }

      toggleButton.addEventListener("click", function () {
        const productContainer = root.getElementById("productContainer");
        if (!productContainer) {
          console.warn("#productContainer не найден");
          return;
        }
        productContainer.innerHTML = ""; // Очищаем контейнер

        if (document.body.classList.contains("table-view")) {
          // Переключаем на карточный вид
          document.body.classList.remove("table-view");
          document.body.classList.add("card-view");

          renderCardView(dataCache);
          if (toggleButtonImage)
            toggleButtonImage.src = "/images/svg/Icon/table.svg";
          localStorage.setItem("currentView", "card-view");
        } else if (document.body.classList.contains("card-view")) {
          // Переключаем на табличный вид
          document.body.classList.remove("card-view");
          document.body.classList.add("table-view");

          renderTableView(dataCache);
          if (toggleButtonImage)
            toggleButtonImage.src = "/images/svg/Icon/card.svg";
          localStorage.setItem("currentView", "table-view");
        }

        // Добавляем эффект анимации
        if (toggleButtonImage) {
          toggleButtonImage.classList.add("animate-toggle");
          setTimeout(() => {
            toggleButtonImage.classList.remove("animate-toggle");
          }, 200);
        }

        cleanQuantityInputs(); // Повторно чистим "0"
      });
    })
    .catch((error) => {
      console.error(`Ошибка при загрузке данных: ${error}`);
    });
};
