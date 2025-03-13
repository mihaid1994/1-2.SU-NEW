// Единая универсальная функция initCardView
window.initCardView = async function ({
  containerId = "hitsGrid",
  maxItems = 6,
  filter = () => true,
  customStyles = {},
  randomize = true,
  root = document, // Параметр root для работы внутри Shadow DOM
} = {}) {
  // Определяем, мобильный ли экран (max-width: 800px)
  const isMobile = window.matchMedia("(max-width: 800px)").matches;

  // Определяем контейнер, куда будут складываться карточки
  const productContainer =
    root.getElementById(containerId) || root.querySelector(`#${containerId}`);
  if (!productContainer) {
    console.warn(`Контейнер с ID "#${containerId}" не найден`);
    return;
  }

  // ================================
  // Утилиты
  // ================================
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

  // ================================
  // Справочник брендов
  // ================================
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

  // ================================
  // Загрузка изображений
  // ================================
  async function loadImages(article, maxImages = 5) {
    // Кэширование, чтобы не дёргать fetch повторно
    if (window.imageCache && window.imageCache[article]) {
      return window.imageCache[article];
    }

    const imagePaths = [];
    for (let i = 0; i < maxImages; i++) {
      // Первый файл: article.jpg, остальные: article_i.jpg
      const imageName = i === 0 ? `${article}.jpg` : `${article}_${i}.jpg`;
      const path = `images/jpg/Product/${imageName}`;
      imagePaths.push(path);
    }

    // Проверяем доступность изображений
    const loadPromises = imagePaths.map(async (src) => {
      try {
        // Используем GET, чтобы не получать 404-ошибки в консоли
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

  // ================================
  // Создание одной карточки
  // ================================
  async function createCard(item) {
    // Бренд
    const brandInfo = getBrandInfo(item["Наименование"]);

    // Карточка
    const card = document.createElement("div");
    card.classList.add("product-card");
    setStyles(card, {
      backgroundColor: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      cursor: "pointer",
      // И мобильная, и десктопная версии используют aspectRatio = "1 / 2"
      aspectRatio: "1 / 2",
    });

    card.addEventListener("mouseover", () => {
      card.style.transform = "scale(1.01)";
    });
    card.addEventListener("mouseout", () => {
      card.style.transform = "scale(1)";
    });

    // ================================
    // ВЕРХНЯЯ ЧАСТЬ КАРТОЧКИ (изображение)
    // ================================
    const imageDiv = document.createElement("div");
    setStyles(imageDiv, {
      position: "relative",
      width: "100%",
      // Для мобильной версии можно делать "40% высоты",
      // но обычно aspectRatio уже регулирует высоту.
      // Если хотите жёстко ограничить высоту в десктопе, проверяйте isMobile:
      height: isMobile ? "40%" : "200px",
      overflow: "hidden",
    });

    const imagesContainer = document.createElement("div");
    setStyles(imagesContainer, {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
    });
    imageDiv.appendChild(imagesContainer);

    // Индикаторы
    const indicatorsContainer = document.createElement("div");
    setStyles(indicatorsContainer, {
      position: "absolute",
      bottom: "10px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      gap: "8px",
      zIndex: "2",
      opacity: "0",
      pointerEvents: "none",
      transition: "opacity 0.3s ease",
    });
    imageDiv.appendChild(indicatorsContainer);

    // При наведении на изображение (десктоп) показываем индикаторы
    imageDiv.addEventListener("mouseover", () => {
      indicatorsContainer.style.opacity = "1";
      indicatorsContainer.style.pointerEvents = "auto";
    });
    imageDiv.addEventListener("mouseout", () => {
      indicatorsContainer.style.opacity = "0";
      indicatorsContainer.style.pointerEvents = "none";
    });

    // Загрузка изображений
    try {
      const images = await loadImages(item["Код"], 5);

      if (images.length > 0) {
        // Генерируем <img> для каждого доступного изображения
        images.forEach((src, index) => {
          const img = document.createElement("img");
          img.src = src;
          img.loading = "lazy";
          img.classList.add("product-image");
          setStyles(img, {
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "auto",
            height: "100%",
            transform: "translate(-50%, -50%)",
            objectFit: "cover",
            display: index === 0 ? "block" : "none",
            borderRadius: "14px",
            marginTop: "5px",
          });
          imagesContainer.appendChild(img);
        });

        // Индикаторы
        images.forEach((_, index) => {
          const indicator = document.createElement("div");
          indicator.classList.add("indicator");
          setStyles(indicator, {
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            cursor: "pointer",
            transition: "transform 0.3s ease, backgroundColor 0.3s ease",
          });
          if (index === 0) {
            indicator.classList.add("active");
            setStyles(indicator, {
              transform: "scale(1.5)",
              backgroundColor: "#fe9c00",
            });
          }
          indicatorsContainer.appendChild(indicator);
        });

        // Универсальная функция переключения изображения
        function updateImage(idx) {
          const imgs = imagesContainer.querySelectorAll(".product-image");
          imgs.forEach((img, i) => {
            img.style.display = i === idx ? "block" : "none";
          });
          const indicators = indicatorsContainer.querySelectorAll(".indicator");
          indicators.forEach((ind, i) => {
            if (i === idx) {
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

        // Клик по индикаторам
        indicatorsContainer.addEventListener("click", (e) => {
          if (e.target.classList.contains("indicator")) {
            const indicators =
              indicatorsContainer.querySelectorAll(".indicator");
            const idx = Array.from(indicators).indexOf(e.target);
            if (idx !== -1) {
              updateImage(idx);
            }
          }
        });

        // Изменение изображений при движении мыши (десктоп)
        imagesContainer.addEventListener("mousemove", (e) => {
          const rect = imagesContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const segmentWidth = rect.width / images.length;
          const idx = Math.min(Math.floor(x / segmentWidth), images.length - 1);
          updateImage(idx);
        });

        // Для мобильных устройств – тач-события (простейший вариант)
        let touchStartX = null;
        imagesContainer.addEventListener("touchstart", (e) => {
          touchStartX = e.touches[0].clientX;
        });
        imagesContainer.addEventListener("touchmove", (e) => {
          if (touchStartX === null) return;
          const touchX = e.touches[0].clientX;
          const rect = imagesContainer.getBoundingClientRect();
          const relativeX = touchX - rect.left;
          const segmentWidth = rect.width / images.length;
          const idx = Math.min(
            Math.floor(relativeX / segmentWidth),
            images.length - 1
          );
          updateImage(idx);
        });
        imagesContainer.addEventListener("touchend", () => {
          touchStartX = null;
        });
      }
    } catch (error) {
      console.error(
        `Ошибка при рендеринге изображений для артикула ${item["Код"]}: ${error}`
      );
      imagesContainer.innerHTML = "<p>Ошибка при загрузке изображений.</p>";
      indicatorsContainer.innerHTML = "";
    }

    // ================================
    // НИЖНЯЯ ЧАСТЬ КАРТОЧКИ (текст и кнопки)
    // ================================
    const infoDiv = document.createElement("div");
    setStyles(infoDiv, {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      // В мобильной версии padding обычно меньше, в десктопе больше
      padding: isMobile ? "8px" : "12px",
      flexGrow: "1",
    });

    // Блок бренда
    const brandDiv = document.createElement("div");
    setStyles(brandDiv, {
      display: "flex",
      alignItems: "center",
      // в мобильной меньше, в десктопе чуть больше
      marginBottom: isMobile ? "4px" : "8px",
    });

    const brandImg = document.createElement("img");
    brandImg.src = brandInfo.logo;
    brandImg.alt = brandInfo.name;
    setStyles(brandImg, {
      // в мобильной 30px, в десктопе 35px
      width: isMobile ? "30px" : "35px",
      height: "auto",
      marginRight: "6px",
      borderRadius: "5px",
      transition: "transform 0.3s ease",
      cursor: "pointer",
    });
    brandImg.addEventListener("mouseover", () => {
      brandImg.style.transform = "scale(1.05)";
    });
    brandImg.addEventListener("mouseout", () => {
      brandImg.style.transform = "scale(1)";
    });

    const brandSpan = document.createElement("span");
    brandSpan.textContent = brandInfo.name;
    setStyles(brandSpan, {
      color: "#555",
      fontSize: isMobile ? "0.8em" : "0.7em",
      fontWeight: "500",
    });

    brandDiv.appendChild(brandImg);
    brandDiv.appendChild(brandSpan);

    // Название товара (title)
    const title = document.createElement("h3");
    title.textContent = item["Наименование"];
    title.setAttribute(
      "data-tooltip",
      `Перейти к подробному описанию товара: ${item["Наименование"]}`
    );
    setStyles(title, {
      fontSize: isMobile ? "0.65em" : "0.7em",
      fontWeight: "600",
      color: "#333",
      margin: "0 0 4px 0",
      lineHeight: "1.2",
      // Высота в "строках" – подбирайте по вкусу
      height: isMobile ? "3.5em" : "3.6em",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      wordWrap: "break-word",
      whiteSpace: "normal",
    });

    // Код товара
    const codeP = document.createElement("p");
    codeP.innerHTML = `Код товара: <span>${item["Код"]}</span>`;
    codeP.setAttribute("data-tooltip", `Код товара: ${item["Код"]}`);
    setStyles(codeP, {
      fontSize: isMobile ? "0.65em" : "0.7em",
      color: "#666",
      margin: "0 0 4px 0",
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
      marginBottom: isMobile ? "4px" : "8px",
    });

    // Текущая цена
    const currentPriceDiv = document.createElement("div");
    currentPriceDiv.innerHTML = `<span>Ваша цена</span><strong>${item["Цена"]} ₽</strong>`;
    currentPriceDiv.setAttribute(
      "data-tooltip",
      `Цена для вас: ${item["Цена"]} ₽`
    );
    setStyles(currentPriceDiv, {
      fontSize: isMobile ? "0.65em" : "0.7em",
    });
    setStyles(currentPriceDiv.querySelector("span"), {
      color: "#999",
      display: "block",
    });
    const currentPriceStrong = currentPriceDiv.querySelector("strong");
    setStyles(currentPriceStrong, {
      display: "block",
      color: "#333",
      fontSize: isMobile ? "1.2em" : "1.4em",
      fontWeight: "700",
      marginTop: "2px",
    });

    // Розничная цена (1.3 от текущей)
    const retailPrice = (item["Цена"] * 1.3).toFixed(2);
    const retailPriceDiv = document.createElement("div");
    retailPriceDiv.innerHTML = `<span>Розн. цена</span><strong>${retailPrice} ₽</strong>`;
    retailPriceDiv.setAttribute(
      "data-tooltip",
      `Розничная цена: ${retailPrice} ₽`
    );
    setStyles(retailPriceDiv, {
      fontSize: isMobile ? "0.65em" : "0.7em",
    });
    setStyles(retailPriceDiv.querySelector("span"), {
      color: "#999",
      display: "block",
    });
    const retailPriceStrong = retailPriceDiv.querySelector("strong");
    setStyles(retailPriceStrong, {
      display: "block",
      color: "#bbb",
      fontSize: isMobile ? "0.9em" : "1em",
      fontWeight: "500",
      textDecoration: "line-through",
      marginTop: "2px",
    });

    priceDiv.appendChild(currentPriceDiv);
    priceDiv.appendChild(retailPriceDiv);

    // Блок действий: количество + кнопка
    const actionsDiv = document.createElement("div");
    setStyles(actionsDiv, {
      display: "flex",
      gap: "6px",
      width: "100%",
      alignItems: "center",
      marginBottom: isMobile ? "4px" : "12px",
    });

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = "0";
    quantityInput.min = item["Мин. Кол."] || 1;
    quantityInput.step = item["Мин. Кол."] || 1;
    quantityInput.classList.add("product-quantity");
    quantityInput.setAttribute(
      "data-tooltip",
      `Введите количество (Мин: ${item["Мин. Кол."] || 1})`
    );
    setStyles(quantityInput, {
      flex: "2",
      minWidth: "50px",
      maxWidth: isMobile ? "100px" : "120px",
      padding: isMobile ? "6px" : "8px",
      border: "1px solid #ddd",
      borderRadius: "3px",
      fontSize: isMobile ? "13px" : "14px",
      textAlign: "center",
      transition: "border-color 0.2s, background-color 0.2s",
    });

    const addToCartButton = document.createElement("button");
    addToCartButton.textContent = "В корзину";
    addToCartButton.classList.add("add-to-cart-button");
    addToCartButton.setAttribute(
      "data-tooltip",
      "Добавить этот товар в корзину"
    );
    setStyles(addToCartButton, {
      flex: "none",
      width: isMobile ? "50px" : "60px",
      padding: "2px",
      backgroundColor: "#4caf50",
      color: "white",
      border: "none",
      borderRadius: "3px",
      fontSize: isMobile ? "11px" : "10px",
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

    // Блок наличия
    const availabilityDiv = document.createElement("div");
    setStyles(availabilityDiv, {
      display: "flex",
      justifyContent: "space-between",
      fontSize: isMobile ? "0.65em" : "0.7em",
      color: "#666",
      borderTop: "1px solid #e0e0e0",
      paddingTop: "4px",
    });

    const availableTodayDiv = document.createElement("div");
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
      marginBottom: "2px",
    });
    setStyles(availableTodayDiv.querySelector("strong"), {
      color: "#333",
      fontSize: "1em",
      fontWeight: "600",
    });

    const availableFutureDiv = document.createElement("div");
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
      marginBottom: "2px",
    });
    setStyles(availableFutureDiv.querySelector("strong"), {
      color: "#333",
      fontSize: "1em",
      fontWeight: "600",
    });

    availabilityDiv.appendChild(availableTodayDiv);
    availabilityDiv.appendChild(availableFutureDiv);

    // Собираем все части
    infoDiv.appendChild(brandDiv);
    infoDiv.appendChild(title);
    infoDiv.appendChild(codeP);
    infoDiv.appendChild(priceDiv);
    infoDiv.appendChild(actionsDiv);
    infoDiv.appendChild(availabilityDiv);

    card.appendChild(imageDiv);
    card.appendChild(infoDiv);

    // Клик по карточке (но не по кнопкам/инпутам)
    card.addEventListener("click", (e) => {
      if (
        e.target.closest(".add-to-cart-button") ||
        e.target.closest(".product-quantity")
      ) {
        return;
      }
      // Здесь можно открыть страницу товара или сделать что угодно
    });

    return card;
  }

  // ================================
  // Рендер карточек
  // ================================
  async function renderCardView() {
    // Если пользователь не передал customStyles — зададим умолчания
    const defaultMobileStyles = {
      gridTemplateColumns: "repeat(2, minmax(165px, 1fr))",
      gap: "10px",
      padding: "1px",
    };
    const defaultDesktopStyles = {
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "16px",
      padding: "16px",
    };

    // Подбираем стили для контейнера
    const appliedStyles = {
      ...(!isMobile ? defaultDesktopStyles : defaultMobileStyles),
      ...customStyles, // пользовательские стили перекрывают наши
    };

    setStyles(productContainer, {
      display: "grid",
      gridTemplateColumns: appliedStyles.gridTemplateColumns,
      gap: appliedStyles.gap,
      justifyContent: "center",
      padding: appliedStyles.padding || "0",
      boxSizing: "border-box",
    });

    // Загружаем данные
    try {
      const response = await fetch("/data/data.json");
      if (!response.ok) {
        throw new Error(`Ошибка загрузки данных: ${response.statusText}`);
      }
      let data = await response.json();

      // Применяем фильтр
      data = data.filter(filter);

      // Перемешиваем
      if (randomize) {
        shuffle(data);
      }

      // Ограничиваем количество
      if (maxItems !== null) {
        data = data.slice(0, maxItems);
      }

      // Создаём карточки
      const fragment = document.createDocumentFragment();
      for (const item of data) {
        const card = await createCard(item);
        if (card) {
          fragment.appendChild(card);
        }
      }

      // Очищаем контейнер и добавляем новые карточки
      productContainer.innerHTML = "";
      productContainer.appendChild(fragment);
    } catch (error) {
      console.error(`Ошибка при загрузке данных: ${error}`);
      productContainer.innerHTML = "<p>Не удалось загрузить товары.</p>";
    }
  }

  // ================================
  // Доп. функции: очистка инпутов и обработчики
  // ================================
  function cleanQuantityInputs() {
    const inputs = root.querySelectorAll(".product-quantity");
    inputs.forEach((input) => {
      if (input.value === "0") input.value = "";
      input.addEventListener("blur", function () {
        if (this.value === "0") this.value = "";
      });
    });
  }

  function setupActions() {
    // Поля с количеством
    const quantityInputs = root.querySelectorAll(".product-quantity");
    quantityInputs.forEach((input) => {
      input.addEventListener("change", function () {
        const minQty = parseInt(this.min, 10) || 1;
        const maxQty = parseInt(this.getAttribute("data-max-qty"), 10) || 0;
        let value = parseInt(this.value, 10) || 0;
        if (value < minQty) value = minQty;
        if (value > maxQty && maxQty !== 0) {
          value = maxQty;
          alert(`Максимальное доступное количество: ${maxQty}`);
        }
        this.value = value > 0 ? value : "";
      });
    });

    // Кнопки "В корзину"
    const addToCartButtons = root.querySelectorAll(".add-to-cart-button");
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const card = this.closest(".product-card");
        const articleElement = Array.from(card.querySelectorAll("p")).find(
          (p) => p.textContent.includes("Код товара:")
        );
        const article = articleElement
          ? articleElement.querySelector("span").textContent
          : "Не указан";
        const quantityInput = card.querySelector(".product-quantity");
        const quantity = parseInt(quantityInput.value, 10) || 0;
        if (quantity > 0) {
          console.log(
            `Добавлено в корзину: Артикул ${article}, Количество ${quantity}`
          );
          this.textContent = "✔ В корзине";
          setStyles(this, { backgroundColor: "#45a049" });
        } else {
          alert("Пожалуйста, введите количество для добавления в корзину.");
        }
      });
    });
  }

  // ================================
  // Инициализация
  // ================================
  async function initialize() {
    await renderCardView();
    cleanQuantityInputs();
    setupActions();
  }

  initialize();
};

// Обёрточная функция для работы через Shadow DOM, если надо
window.initCardViewShadow = async function (shadowRoot) {
  await window.initCardView({
    root: shadowRoot,
    containerId: "hitsGrid",
    maxItems: 6,
    filter: () => true,
    // Здесь — любые ваши стили для контейнера
    customStyles: {},
    randomize: true,
  });
};
