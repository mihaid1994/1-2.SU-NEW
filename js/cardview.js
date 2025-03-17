// Единая универсальная функция initCardView
window.initCardView = async function ({
  containerId = "hitsGrid",
  maxItems = 6, // Загружаем ровно 6 карточек
  filter = () => true,
  randomize = true,
  // Настройки для мобильной и десктопной версии:
  // В мобильной версии (ширина окна ≤ 800px) — 2 карточки в строку,
  // в десктопной — 6 карточек в строку.
  mobileSettings = {
    maxWidth: 800,
    cardsPerRow: 2,
    gap: 10, // px между карточками
    aspectRatio: 2, // Высота = 2 * ширина
  },
  desktopSettings = {
    cardsPerRow: 6,
    gap: 16,
    aspectRatio: 2,
  },
  // Коэффициенты масштабирования для карточек для мобильной и десктопной версии
  mobileScale = 0.945,
  desktopScale = 1,
  root = document, // для работы внутри Shadow DOM, если требуется
  customStyles = {}, // дополнительные стили для контейнера
} = {}) {
  // Определяем контейнер для карточек
  const productContainer =
    root.getElementById(containerId) || root.querySelector(`#${containerId}`);
  if (!productContainer) {
    console.warn(`Контейнер с ID "#${containerId}" не найден`);
    return;
  }

  // Загружаемые данные сохраняем для пересчёта при resize
  let loadedData = [];

  // ──────────────────────────────────────────────
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ──────────────────────────────────────────────
  function setStyles(element, styles) {
    for (let property in styles) {
      element.style[property] = styles[property];
    }
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function isMobile() {
    return window.innerWidth <= mobileSettings.maxWidth;
  }

  function getResponsiveSettings() {
    return isMobile() ? mobileSettings : desktopSettings;
  }

  // Вычисляем размеры карточки так, чтобы карточки вместе с промежутками занимали всю доступную ширину.
  // Если мобильная версия – берётся ширина всего экрана, иначе – ширина контейнера.
  // Все размеры умножаются на соответствующий коэффициент (mobileScale или desktopScale).
  function calculateCardStyles() {
    const { cardsPerRow, gap, aspectRatio } = getResponsiveSettings();
    const containerWidth = isMobile()
      ? window.innerWidth
      : productContainer.offsetWidth || window.innerWidth;
    const totalGaps = (cardsPerRow - 1) * gap;
    const scale = isMobile() ? mobileScale : desktopScale;
    const cardWidth = ((containerWidth - totalGaps) / cardsPerRow) * scale;
    const cardHeight = cardWidth * aspectRatio;
    return {
      cardWidth,
      cardHeight,
      gap,
      cardsPerRow,
      aspectRatio,
    };
  }

  // Функция масштабирования внутренних значений по отношению к вычисленной ширине карточки.
  // Базовые значения считаются при эталонной ширине 200px.
  function scaleValue(baseValue, cardWidth) {
    const baseWidth = 200;
    const scaleFactor = cardWidth / baseWidth;
    return baseValue * scaleFactor;
  }

  // ──────────────────────────────────────────────
  // Справочник брендов
  // ──────────────────────────────────────────────
  const brandMapping = {
    Энергомера: "images/svg/brand/energomera.svg",
    АГАТ: "images/svg/brand/agat.svg",
    ЭРА: "images/svg/brand/era.svg",
    "Bormioli Rocco": "images/svg/brand/bormioli_rocco.svg",
    "EKF PROxima": "images/svg/brand/ekf_proxima.svg",
    SmartBuy: "images/svg/brand/smartbuy.svg",
    ASD: "images/svg/brand/asd.svg",
    InHome: "images/svg/brand/inhome.svg",
    APEYRON: "images/svg/brand/apeyron.svg",
    ARTELAMP: "images/svg/brand/artelamp.svg",
    "1-2.SALE": "images/svg/brand/1-2.sale.svg",
    "Тест на правду": "images/svg/brand/pravtest.svg",
    "ВАШЕ СИЯТЕЛЬСТВО": "images/svg/brand/sijatelstvo.svg",
  };

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
      logo: "images/svg/Icon/placeholder-logo.svg",
    };
  }

  // ──────────────────────────────────────────────
  // Загрузка изображений по артикулу
  // ──────────────────────────────────────────────
  async function loadImages(article, maxImages = 5) {
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
        const response = await fetch(src, { method: "GET" });
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

  // ──────────────────────────────────────────────
  // Создание одной карточки (со всей структурой)
  // ──────────────────────────────────────────────
  async function createCard(item) {
    const { cardWidth, cardHeight, gap } = calculateCardStyles();
    const s = (val) => scaleValue(val, cardWidth);
    const brandInfo = getBrandInfo(item["Наименование"]);

    // Корневой элемент карточки
    const card = document.createElement("div");
    card.classList.add("product-card");
    setStyles(card, {
      backgroundColor: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      position: "relative",
      cursor: "pointer",
      width: cardWidth + "px",
      height: cardHeight + "px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
    });
    card.addEventListener("mouseover", () => {
      card.style.transform = "scale(1.01)";
    });
    card.addEventListener("mouseout", () => {
      card.style.transform = "scale(1)";
    });

    // Верхняя часть – изображения (примерно 40% высоты карточки)
    const imageDivHeight = cardHeight * 0.4;
    const imageDiv = document.createElement("div");
    setStyles(imageDiv, {
      position: "relative",
      width: "100%",
      height: imageDivHeight + "px",
      overflow: "hidden",
      marginTop: "3px", // добавлен марджин сверху 3px
    });

    const imagesContainer = document.createElement("div");
    setStyles(imagesContainer, {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
    });
    imageDiv.appendChild(imagesContainer);

    const indicatorsContainer = document.createElement("div");
    setStyles(indicatorsContainer, {
      position: "absolute",
      bottom: s(10) + "px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      gap: s(8) + "px",
      zIndex: "1", // z-index уменьшен, чтобы не перекрывать другие элементы
      transition: "opacity 0.3s ease",
      // По умолчанию скрыты – дальнейшая логика задаст нужное состояние
      opacity: "0",
      pointerEvents: "none",
    });
    imageDiv.appendChild(indicatorsContainer);

    try {
      const images = await loadImages(item["Код"], 5);
      if (images.length > 0) {
        images.forEach((src, idx) => {
          const img = document.createElement("img");
          img.src = src;
          img.loading = "lazy";
          setStyles(img, {
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "auto",
            height: "100%",
            transform: "translate(-50%, -50%)",
            objectFit: "cover",
            display: idx === 0 ? "block" : "none",
            borderRadius: s(14) + "px",
          });
          imagesContainer.appendChild(img);
        });
        images.forEach((_, idx) => {
          const indicator = document.createElement("div");
          setStyles(indicator, {
            width: s(10) + "px",
            height: s(10) + "px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            cursor: "pointer",
            transition: "transform 0.3s ease, background-color 0.3s ease",
          });
          if (idx === 0) {
            setStyles(indicator, {
              transform: "scale(1.5)",
              backgroundColor: "#fe9c00",
            });
          }
          indicatorsContainer.appendChild(indicator);
        });

        // Если загружено более одной фотографии, индикаторы всегда видны,
        // иначе – отображение по наведению мыши.
        if (images.length > 1) {
          indicatorsContainer.style.opacity = "1";
          indicatorsContainer.style.pointerEvents = "auto";
        } else {
          imageDiv.addEventListener("mouseover", () => {
            indicatorsContainer.style.opacity = "1";
            indicatorsContainer.style.pointerEvents = "auto";
          });
          imageDiv.addEventListener("mouseout", () => {
            indicatorsContainer.style.opacity = "0";
            indicatorsContainer.style.pointerEvents = "none";
          });
        }

        function updateImage(idx) {
          const imgs = imagesContainer.querySelectorAll("img");
          imgs.forEach((img, i) => {
            img.style.display = i === idx ? "block" : "none";
          });
          const inds = indicatorsContainer.querySelectorAll("div");
          inds.forEach((ind, i) => {
            if (i === idx) {
              setStyles(ind, {
                transform: "scale(1.5)",
                backgroundColor: "#fe9c00",
              });
            } else {
              setStyles(ind, {
                transform: "scale(1)",
                backgroundColor: "#ffffff",
              });
            }
          });
        }

        indicatorsContainer.addEventListener("click", (e) => {
          const allInds = Array.from(
            indicatorsContainer.querySelectorAll("div")
          );
          const idx = allInds.indexOf(e.target);
          if (idx >= 0) updateImage(idx);
        });

        // Обработчик для мыши – добавлено ограничение индекса по нижней и верхней границе
        imagesContainer.addEventListener("mousemove", (e) => {
          const rect = imagesContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const seg = rect.width / images.length;
          const idx = Math.max(
            0,
            Math.min(Math.floor(x / seg), images.length - 1)
          );
          updateImage(idx);
        });

        // Обработчик для touch – аналогичное ограничение
        let touchStartX = null;
        imagesContainer.addEventListener("touchstart", (ev) => {
          touchStartX = ev.touches[0].clientX;
        });
        imagesContainer.addEventListener("touchmove", (ev) => {
          if (touchStartX === null) return;
          const rect = imagesContainer.getBoundingClientRect();
          const touchX = ev.touches[0].clientX - rect.left;
          const seg = rect.width / images.length;
          const idx = Math.max(
            0,
            Math.min(Math.floor(touchX / seg), images.length - 1)
          );
          updateImage(idx);
        });
        imagesContainer.addEventListener("touchend", () => {
          touchStartX = null;
        });
      }
    } catch (error) {
      console.error(
        `Ошибка при загрузке изображений для артикула ${item["Код"]}: ${error}`
      );
      imagesContainer.innerHTML = "<p>Ошибка загрузки изображений.</p>";
      indicatorsContainer.innerHTML = "";
    }

    // Нижняя часть – информационный блок, занимает оставшуюся высоту
    const infoDivHeight = cardHeight - imageDivHeight;
    const infoDiv = document.createElement("div");
    setStyles(infoDiv, {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      height: infoDivHeight + "px",
      boxSizing: "border-box",
      padding: s(8) + "px",
    });

    // Блок бренда
    const brandDiv = document.createElement("div");
    setStyles(brandDiv, {
      display: "flex",
      alignItems: "center",
      marginBottom: s(4) + "px",
    });
    const brandImg = document.createElement("img");
    brandImg.src = brandInfo.logo;
    brandImg.alt = brandInfo.name;
    setStyles(brandImg, {
      width: s(30) + "px",
      height: "auto",
      marginRight: s(6) + "px",
      borderRadius: s(5) + "px",
      transition: "transform 0.3s ease",
      cursor: "pointer",
    });
    brandImg.addEventListener("mouseover", () => {
      brandImg.style.transform = "scale(1.1)";
    });
    brandImg.addEventListener("mouseout", () => {
      brandImg.style.transform = "scale(1)";
    });
    const brandSpan = document.createElement("span");
    brandSpan.textContent = brandInfo.name;
    setStyles(brandSpan, {
      color: "#555",
      fontSize: s(11) + "px",
      fontWeight: "500",
    });
    brandDiv.appendChild(brandImg);
    brandDiv.appendChild(brandSpan);

    // Название товара
    const titleElem = document.createElement("h3");
    titleElem.textContent = item["Наименование"];
    titleElem.setAttribute(
      "data-tooltip",
      `Перейти к подробному описанию: ${item["Наименование"]}`
    );
    setStyles(titleElem, {
      fontSize: s(12) + "px",
      fontWeight: "600",
      color: "#333",
      margin: `0 0 ${s(4)}px 0`,
      lineHeight: "1.2",
      height: s(43) + "px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      whiteSpace: "normal",
    });

    // Код товара
    const codeP = document.createElement("p");
    codeP.innerHTML = `Код товара: <span>${item["Код"]}</span>`;
    codeP.setAttribute("data-tooltip", `Код товара: ${item["Код"]}`);
    setStyles(codeP, {
      fontSize: s(11) + "px",
      color: "#666",
      margin: `0 0 ${s(4)}px 0`,
    });
    setStyles(codeP.querySelector("span"), {
      color: "#333",
      fontWeight: "500",
    });

    // Цены
    const priceDiv = document.createElement("div");
    setStyles(priceDiv, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: s(6) + "px",
    });

    const currentPriceDiv = document.createElement("div");
    currentPriceDiv.innerHTML = `<span>Ваша цена</span><strong>${item["Цена"]} ₽</strong>`;
    currentPriceDiv.setAttribute(
      "data-tooltip",
      `Цена для вас: ${item["Цена"]} ₽`
    );
    setStyles(currentPriceDiv, {
      fontSize: s(10) + "px",
    });
    setStyles(currentPriceDiv.querySelector("span"), {
      color: "#999",
      display: "block",
    });
    setStyles(currentPriceDiv.querySelector("strong"), {
      display: "block",
      color: "#333",
      fontSize: s(14) + "px",
      fontWeight: "700",
      marginTop: s(2) + "px",
    });

    const retailPrice = (item["Цена"] * 1.3).toFixed(2);
    const retailPriceDiv = document.createElement("div");
    retailPriceDiv.innerHTML = `<span>Розн. цена</span><strong>${retailPrice} ₽</strong>`;
    retailPriceDiv.setAttribute(
      "data-tooltip",
      `Розничная цена: ${retailPrice} ₽`
    );
    setStyles(retailPriceDiv, {
      fontSize: s(10) + "px",
    });
    setStyles(retailPriceDiv.querySelector("span"), {
      color: "#999",
      display: "block",
    });
    setStyles(retailPriceDiv.querySelector("strong"), {
      display: "block",
      color: "#bbb",
      fontSize: s(11) + "px",
      fontWeight: "500",
      textDecoration: "line-through",
      marginTop: s(2) + "px",
    });

    priceDiv.appendChild(currentPriceDiv);
    priceDiv.appendChild(retailPriceDiv);

    // Блок с количеством и кнопкой "В корзину"
    const actionsDiv = document.createElement("div");
    setStyles(actionsDiv, {
      display: "flex",
      width: "100%",
      alignItems: "center",
      marginBottom: s(6) + "px",
      gap: s(4) + "px", // gap между элементами
    });

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = ""; // не показываем 0 при первичной загрузке
    quantityInput.min = item["Мин. Кол."] || 1;
    quantityInput.step = item["Мин. Кол."] || 1;
    quantityInput.classList.add("product-quantity");
    quantityInput.setAttribute(
      "data-tooltip",
      `Введите количество (Мин: ${item["Мин. Кол."] || 1})`
    );
    // Задаём ширину инпута как оставшуюся часть карточки:
    // Ширина инпута = calc(100% - (фиксированная ширина кнопки + gap))
    setStyles(quantityInput, {
      width: `calc(100% - ${s(70) + s(4)}px)`,
      padding: s(6) + "px",
      border: "1px solid #ddd",
      borderRadius: s(3) + "px",
      fontSize: s(12) + "px",
      textAlign: "center",
    });

    const addToCartButton = document.createElement("button");
    addToCartButton.textContent = "В корзину";
    addToCartButton.classList.add("add-to-cart-button");
    addToCartButton.setAttribute("data-tooltip", "Добавить товар в корзину");
    // Вычисляем минимальную высоту кнопки для двух строк текста
    const buttonMinHeight = s(10) * 2 + s(4) * 2;
    // Фиксированная ширина кнопки через s(60)
    setStyles(addToCartButton, {
      width: s(70) + "px",
      padding: s(3) + "px",
      backgroundColor: "#fe9c00",
      color: "white",
      border: "none",
      borderRadius: s(3) + "px",
      fontSize: s(10) + "px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      whiteSpace: "normal",
      textAlign: "center",
      minHeight: buttonMinHeight + "px",
    });
    addToCartButton.addEventListener("mouseover", () => {
      addToCartButton.style.backgroundColor = "#e08c00";
    });
    addToCartButton.addEventListener("mouseout", () => {
      addToCartButton.style.backgroundColor = "#fe9c00";
    });
    actionsDiv.appendChild(quantityInput);
    actionsDiv.appendChild(addToCartButton);

    // Блок наличия товара
    const availabilityDiv = document.createElement("div");
    setStyles(availabilityDiv, {
      display: "flex",
      justifyContent: "space-between",
      fontSize: s(10) + "px",
      color: "#666",
      borderTop: "1px solid #e0e0e0",
      paddingTop: s(4) + "px",
    });

    const availableTodayDiv = document.createElement("div");
    availableTodayDiv.innerHTML = `<span>В наличии</span><strong>${
      item["Наличие"] || 0
    } шт.</strong>`;
    availableTodayDiv.setAttribute(
      "data-tooltip",
      `В наличии: ${item["Наличие"] || 0} шт.`
    );
    setStyles(availableTodayDiv, { textAlign: "center" });
    setStyles(availableTodayDiv.querySelector("span"), {
      display: "block",
      color: "#999",
      fontSize: s(10) + "px",
      marginBottom: s(2) + "px",
    });
    setStyles(availableTodayDiv.querySelector("strong"), {
      color: "#333",
      fontSize: s(11) + "px",
      fontWeight: "600",
    });

    const availableFutureDiv = document.createElement("div");
    availableFutureDiv.innerHTML = `<span>${
      item["Дата поступления"] || "В пути"
    }</span><strong>${item["В пути"] || 0} шт.</strong>`;
    availableFutureDiv.setAttribute(
      "data-tooltip",
      `В пути: ${item["В пути"] || 0} (ожидается ${
        item["Дата поступления"] || "неизвестно"
      })`
    );
    setStyles(availableFutureDiv, { textAlign: "center" });
    setStyles(availableFutureDiv.querySelector("span"), {
      display: "block",
      color: "#999",
      fontSize: s(10) + "px",
      marginBottom: s(2) + "px",
    });
    setStyles(availableFutureDiv.querySelector("strong"), {
      color: "#333",
      fontSize: s(11) + "px",
      fontWeight: "600",
    });

    availabilityDiv.appendChild(availableTodayDiv);
    availabilityDiv.appendChild(availableFutureDiv);

    // Сборка информационной части карточки
    infoDiv.appendChild(brandDiv);
    infoDiv.appendChild(titleElem);
    infoDiv.appendChild(codeP);
    infoDiv.appendChild(priceDiv);
    infoDiv.appendChild(actionsDiv);
    infoDiv.appendChild(availabilityDiv);

    card.appendChild(imageDiv);
    card.appendChild(infoDiv);

    // Обработчик клика по карточке (если не нажаты кнопка или инпут)
    card.addEventListener("click", (e) => {
      if (
        e.target.closest(".add-to-cart-button") ||
        e.target.closest(".product-quantity")
      ) {
        return;
      }
      console.log(`Открываем товар с кодом: ${item["Код"]}`);
    });

    // Обработчик кнопки "В корзину"
    addToCartButton.addEventListener("click", () => {
      const quantity = parseInt(quantityInput.value, 10) || 0;
      if (quantity > 0) {
        addToCartButton.textContent = "✔ В корзине";
        setStyles(addToCartButton, { backgroundColor: "#ff9218" });
        console.log(
          `Добавлен товар (код ${item["Код"]}), количество: ${quantity}`
        );
      } else {
        alert("Укажите количество товара перед добавлением в корзину.");
      }
    });

    quantityInput.addEventListener("blur", function () {
      if (this.value === "0") this.value = "";
    });

    return card;
  }

  // ──────────────────────────────────────────────
  // РЕНДЕР ВСЕХ КАРТОЧЕК
  // ──────────────────────────────────────────────
  async function renderCards() {
    // Вычисляем текущие настройки
    const { cardsPerRow, gap, cardWidth } = calculateCardStyles();

    // Рассчитываем итоговую ширину контейнера:
    // containerWidth = (cardWidth * cardsPerRow) + (gap * (cardsPerRow - 1)) + extra (например, 2px)
    const computedWidth = cardWidth * cardsPerRow + gap * (cardsPerRow - 1) + 2;

    // Задаём контейнеру стили с использованием CSS Grid,
    // чтобы всегда было ровно cardsPerRow карточек в каждом ряду.
    // Контейнеру устанавливаем вычисленную ширину, и убираем прокрутки.
    setStyles(
      productContainer,
      Object.assign(
        {
          display: "grid",
          gridTemplateColumns: `repeat(${cardsPerRow}, ${cardWidth}px)`,
          gap: gap + "px",
          boxSizing: "border-box",
          width: computedWidth + "px",
          overflowX: "hidden",
          overflowY: "hidden",
        },
        customStyles
      )
    );

    const fragment = document.createDocumentFragment();
    for (const item of loadedData) {
      const card = await createCard(item);
      if (card) {
        fragment.appendChild(card);
      }
    }
    productContainer.innerHTML = "";
    productContainer.appendChild(fragment);
  }

  // ──────────────────────────────────────────────
  // ЗАГРУЗКА ДАННЫХ
  // ──────────────────────────────────────────────
  async function loadData() {
    try {
      const resp = await fetch("/data/data.json");
      if (!resp.ok) {
        throw new Error(`Ошибка загрузки данных: ${resp.statusText}`);
      }
      let data = await resp.json();
      data = data.filter(filter);
      if (randomize) shuffle(data);
      // Если maxItems !== null, ограничиваем количество карточек,
      // иначе загружаем все элементы.
      if (maxItems !== null && typeof maxItems === "number" && maxItems > 0) {
        data = data.slice(0, maxItems);
      }
      loadedData = data;
    } catch (err) {
      console.error(`Ошибка при загрузке данных: ${err}`);
      productContainer.innerHTML = "<p>Не удалось загрузить товары.</p>";
    }
  }

  // ──────────────────────────────────────────────
  // Обработчик изменения размеров окна
  // ──────────────────────────────────────────────
  function handleResize() {
    renderCards();
  }

  // ──────────────────────────────────────────────
  // ИНИЦИАЛИЗАЦИЯ
  // ──────────────────────────────────────────────
  async function initialize() {
    await loadData();
    await renderCards();
    window.addEventListener("resize", handleResize);
  }

  initialize();
};

// Для работы внутри Shadow DOM (если требуется)
window.initCardViewShadow = async function (shadowRoot) {
  await window.initCardView({
    root: shadowRoot,
    containerId: "hitsGrid",
    maxItems: 6,
    randomize: true,
    mobileSettings: {
      maxWidth: 800,
      cardsPerRow: 2,
      gap: 10,
      aspectRatio: 1.82,
    },
    desktopSettings: {
      cardsPerRow: 6,
      gap: 16,
      aspectRatio: 1.8,
    },
  });
};
