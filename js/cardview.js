// Обновлённая функция initCardView с поддержкой дополнительных параметров и параметром root
window.initCardView = async function ({
  containerId = "hitsGrid",
  maxItems = 6,
  filter = () => true,
  customStyles = {
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", // Стили для сетки
    gap: "16px", // Расстояние между карточками
  },
  randomize = true,
  root = document, // Параметр root
} = {}) {
  const productContainer =
    root.getElementById(containerId) || root.querySelector(`#${containerId}`);
  if (!productContainer) {
    console.warn(`Контейнер с ID #${containerId} не найден`);
    return;
  }

  // Вспомогательная функция для установки нескольких стилей одновременно
  function setStyles(element, styles) {
    for (let property in styles) {
      element.style[property] = styles[property];
    }
  }

  // Функция перемешивания массива (алгоритм Фишера-Йейтса)
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Справочник брендов
  const brandMapping = {
    Энергомера: "/images/svg/brand/energomera.svg",
    АГАТ: "/images/svg/brand/agat.svg",
    ЭРА: "/images/svg/brand/era.svg",
    "Bormioli Rocco": "/images/svg/brand/bormioli_rocco.svg",
    "EKF PROxima": "/images/svg/brand/ekf_proxima.svg",
    SmartBuy: "/images/svg/brand/smartbuy.svg",
    ASD: "/images/svg/brand/asd.svg",
    InHome: "/images/svg/brand/inhome.svg",
    APEYRON: "/images/svg/brand/apeyron.svg",
    ARTELAMP: "/images/svg/brand/artelamp.svg",
    "1-2.SALE": "/images/svg/brand/1-2.sale.svg",
    "Тест на правду": "/images/svg/brand/pravtest.svg",
    "ВАШЕ СИЯТЕЛЬСТВО": "/images/svg/brand/sijatelstvo.svg",
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

  // Функция для загрузки изображений с использованием fetch, чтобы избежать ошибок 404 в консоли
  async function loadImages(article, maxImages = 5) {
    if (window.imageCache && window.imageCache[article]) {
      return window.imageCache[article];
    }

    const imageNames = [];
    for (let i = 0; i < maxImages; i++) {
      const imageName = i === 0 ? `${article}.jpg` : `${article}_${i}.jpg`;
      const imagePath = `/images/jpg/Product/${imageName}`;
      imageNames.push(imagePath);
    }

    const loadPromises = imageNames.map(async (src) => {
      try {
        const response = await fetch(src, { method: "HEAD" });
        if (response.ok) {
          return src;
        } else {
          return null;
        }
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(loadPromises);
    const validImages = results.filter((src) => src !== null);

    if (!window.imageCache) {
      window.imageCache = {};
    }
    window.imageCache[article] = validImages;
    return validImages;
  }

  // Функция для создания карточки товара
  async function createCard(item) {
    const brandInfo = getBrandInfo(item["Наименование"]);

    const card = document.createElement("div"); // Изменено здесь
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
      aspectRatio: "1 / 2", // Добавлено фиксированное соотношение сторон
    });

    card.addEventListener("mouseover", () => {
      setStyles(card, {
        transform: "scale(1.01)", // Масштабирование при наведении
      });
    });
    card.addEventListener("mouseout", () => {
      setStyles(card, {
        transform: "scale(1)", // Возврат к исходному масштабу
      });
    });

    // Блок с изображением
    const imageDiv = document.createElement("div"); // Изменено здесь
    setStyles(imageDiv, {
      position: "relative",
      width: "100%",
      height: "200px",
      overflow: "hidden",
    });

    const imagesContainer = document.createElement("div"); // Изменено здесь
    setStyles(imagesContainer, {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
    });
    imageDiv.appendChild(imagesContainer);

    const indicatorsContainer = document.createElement("div"); // Изменено здесь
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

    // Добавление событий для отображения индикаторов при наведении
    imageDiv.addEventListener("mouseover", () => {
      indicatorsContainer.style.opacity = "1";
      indicatorsContainer.style.pointerEvents = "auto";
    });
    imageDiv.addEventListener("mouseout", () => {
      indicatorsContainer.style.opacity = "0";
      indicatorsContainer.style.pointerEvents = "none";
    });

    try {
      // Загрузка и отображение изображений
      const images = await loadImages(item["Код"], 5);
      if (images.length > 0) {
        images.forEach((src, index) => {
          const img = document.createElement("img"); // Изменено здесь
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
          img.setAttribute("data-fullsrc", src);
          img.setAttribute("data-tooltip", "Просмотреть изображение товара");
          imagesContainer.appendChild(img);
        });

        images.forEach((_, index) => {
          const indicator = document.createElement("div"); // Изменено здесь
          indicator.classList.add("indicator");
          setStyles(indicator, {
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
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

          indicatorsContainer.appendChild(indicator);
        });

        // Обработчик клика по индикаторам
        indicatorsContainer.addEventListener("click", function (event) {
          if (event.target.classList.contains("indicator")) {
            const indicators =
              indicatorsContainer.querySelectorAll(".indicator");
            const imgs = imagesContainer.querySelectorAll(".product-image");
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

        // Обработчик движения мыши для изменения изображений
        imagesContainer.addEventListener("mousemove", function (e) {
          const rect = imagesContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const segmentWidth = rect.width / images.length;
          const idx = Math.min(Math.floor(x / segmentWidth), images.length - 1);

          const imgs = imagesContainer.querySelectorAll(".product-image");
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

        // Обработчик ухода мыши для сброса на первое изображение
        imagesContainer.addEventListener("mouseleave", () => {
          const imgs = imagesContainer.querySelectorAll(".product-image");
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
      }
    } catch (error) {
      console.error(
        `Ошибка при рендеринге изображений для артикула ${item["Код"]}: ${error}`
      );
      imagesContainer.innerHTML = "<p>Ошибка при загрузке изображений.</p>";
      indicatorsContainer.innerHTML = "";
    }

    // Информация о продукте
    const infoDiv = document.createElement("div"); // Изменено здесь
    setStyles(infoDiv, {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      padding: "12px",
      flexGrow: "1",
    });

    // Бренд
    const brandDiv = document.createElement("div"); // Изменено здесь
    setStyles(brandDiv, {
      display: "flex",
      alignItems: "center",
      marginBottom: "8px",
    });

    const brandImg = document.createElement("img"); // Изменено здесь
    brandImg.src = brandInfo.logo;
    brandImg.alt = brandInfo.name;
    setStyles(brandImg, {
      width: "35px",
      height: "auto",
      marginRight: "8px",
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

    const brandSpan = document.createElement("span"); // Изменено здесь
    brandSpan.textContent = brandInfo.name;
    setStyles(brandSpan, {
      color: "#555",
      fontSize: "0.7em",
      fontWeight: "500",
    });

    brandDiv.appendChild(brandImg);
    brandDiv.appendChild(brandSpan);

    // Название товара
    const title = document.createElement("h3"); // Изменено здесь
    title.textContent = item["Наименование"];
    title.setAttribute(
      "data-tooltip",
      `Перейти к подробному описанию товара: ${item["Наименование"]}`
    );
    setStyles(title, {
      fontSize: "0.7em",
      fontWeight: "600",
      color: "#333",
      margin: "0 0 8px 0",
      lineHeight: "1.2",
      height: "3.6em",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      wordWrap: "break-word",
      whiteSpace: "normal",
    });

    // Код товара
    const codeP = document.createElement("p"); // Изменено здесь
    codeP.innerHTML = `Код товара: <span>${item["Код"]}</span>`;
    codeP.setAttribute("data-tooltip", `Код товара: ${item["Код"]}`);
    setStyles(codeP, {
      fontSize: "0.7em",
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
      marginBottom: "8px",
    });

    // Текущая цена
    const currentPriceDiv = document.createElement("div");
    currentPriceDiv.innerHTML = `<span>Ваша цена</span><strong>${item["Цена"]} ₽</strong>`;
    currentPriceDiv.setAttribute(
      "data-tooltip",
      `Цена для вас: ${item["Цена"]} ₽`
    );
    setStyles(currentPriceDiv, {
      fontSize: "0.7em",
    });
    setStyles(currentPriceDiv.querySelector("span"), {
      color: "#999",
      display: "block",
    });
    const currentPriceStrong = currentPriceDiv.querySelector("strong");
    setStyles(currentPriceStrong, {
      display: "block",
      color: "#333",
      fontSize: "1.4em",
      fontWeight: "700",
      marginTop: "4px",
    });

    // Розничная цена (1.3 от текущей цены)
    const retailPrice = (item["Цена"] * 1.3).toFixed(2); // Рассчёт розничной цены
    const retailPriceDiv = document.createElement("div");
    retailPriceDiv.innerHTML = `<span>Розн. цена</span><strong>${retailPrice} ₽</strong>`;
    retailPriceDiv.setAttribute(
      "data-tooltip",
      `Розничная цена: ${retailPrice} ₽`
    );
    setStyles(retailPriceDiv, {
      fontSize: "0.7em",
    });
    setStyles(retailPriceDiv.querySelector("span"), {
      color: "#999",
      display: "block",
    });
    const retailPriceStrong = retailPriceDiv.querySelector("strong");
    setStyles(retailPriceStrong, {
      display: "block",
      color: "#bbb",
      fontSize: "1em",
      fontWeight: "500",
      textDecoration: "line-through",
      marginTop: "4px",
    });

    // Добавление элементов в контейнер
    priceDiv.appendChild(currentPriceDiv);
    priceDiv.appendChild(retailPriceDiv);

    // Действия: количество и кнопка "В корзину"
    const actionsDiv = document.createElement("div"); // Изменено здесь
    setStyles(actionsDiv, {
      display: "flex",
      gap: "8px",
      width: "100%",
      alignItems: "center",
      marginBottom: "12px",
    });

    const quantityInput = document.createElement("input"); // Изменено здесь
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
      padding: "8px",
      border: "1px solid #ddd",
      borderRadius: "3px",
      fontSize: "14px",
      textAlign: "center",
      width: "100px",
      transition: "border-color 0.2s, background-color 0.2s",
      height: "10px",
    });

    const addToCartButton = document.createElement("button"); // Изменено здесь
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
      borderRadius: "3px",
      fontSize: "10px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      height: "25px",
    });

    addToCartButton.addEventListener("mouseover", () => {
      addToCartButton.style.backgroundColor = "#45a049";
    });
    addToCartButton.addEventListener("mouseout", () => {
      addToCartButton.style.backgroundColor = "#4caf50";
    });

    actionsDiv.appendChild(quantityInput);
    actionsDiv.appendChild(addToCartButton);

    // Информация о наличии
    const availabilityDiv = document.createElement("div"); // Изменено здесь
    setStyles(availabilityDiv, {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "0.7em",
      color: "#666",
      borderTop: "1px solid #e0e0e0",
      paddingTop: "8px",
    });

    const availableTodayDiv = document.createElement("div"); // Изменено здесь
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
      fontSize: "0.9em",
      marginBottom: "4px",
    });
    const availableTodayStrong = availableTodayDiv.querySelector("strong");
    setStyles(availableTodayStrong, {
      color: "#333",
      fontSize: "1em",
      fontWeight: "600",
    });

    const availableFutureDiv = document.createElement("div"); // Изменено здесь
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
      fontSize: "0.9em",
      marginBottom: "4px",
    });
    const availableFutureStrong = availableFutureDiv.querySelector("strong");
    setStyles(availableFutureStrong, {
      color: "#333",
      fontSize: "1em",
      fontWeight: "600",
    });

    availabilityDiv.appendChild(availableTodayDiv);
    availabilityDiv.appendChild(availableFutureDiv);

    // Сборка информации о товаре
    infoDiv.appendChild(brandDiv);
    infoDiv.appendChild(title);
    infoDiv.appendChild(codeP);
    infoDiv.appendChild(priceDiv);
    infoDiv.appendChild(actionsDiv);
    infoDiv.appendChild(availabilityDiv);

    // Добавление информации к карточке
    card.appendChild(imageDiv);
    card.appendChild(infoDiv);

    // Обработчик клика по карточке (можно добавить переход или модальное окно)
    card.addEventListener("click", (e) => {
      // Предотвращаем срабатывание клика при нажатии на кнопки внутри карточки
      if (
        e.target.closest(".add-to-cart-button") ||
        e.target.closest(".product-quantity")
      ) {
        return;
      }
      // Логика перехода к деталям товара
      console.log(`Клик на товар: ${item["Наименование"]}`);
      // Пример: window.location.href = `/product/${item["Артикул"]}`;
    });

    return card;
  }

  // Функция для рендеринга карточного вида
  async function renderCardView() {
    // Применение стилей для контейнера карточек
    setStyles(productContainer, {
      display: "grid",
      gridTemplateColumns: customStyles.gridTemplateColumns,
      gap: customStyles.gap,
      justifyContent: "center",
      padding: customStyles.padding,
      boxSizing: "border-box",
    });

    // Загрузка данных
    try {
      const response = await fetch("/data/data.json");
      if (!response.ok) {
        throw new Error(`Ошибка загрузки данных: ${response.statusText}`);
      }
      let data = await response.json();

      // Применение фильтрации
      data = data.filter(filter);

      // Случайная выборка, если требуется
      if (randomize) {
        shuffle(data);
      }

      // Ограничение количества товаров
      if (maxItems !== null) {
        data = data.slice(0, maxItems);
      }

      // Создание карточек
      const fragment = document.createDocumentFragment(); // Изменено здесь
      for (let item of data) {
        const card = await createCard(item);
        if (card) {
          fragment.appendChild(card);
        }
      }

      // Очистка контейнера перед добавлением
      productContainer.innerHTML = "";
      productContainer.appendChild(fragment);
    } catch (error) {
      console.error(`Ошибка при загрузке данных: ${error}`);
      productContainer.innerHTML = "<p>Не удалось загрузить товары.</p>";
    }
  }

  // Функция для очистки значений "0" в полях количества
  function cleanQuantityInputs() {
    const inputs = root.querySelectorAll(".product-quantity");
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

  // Обработчики для инпутов количества и кнопок "В корзину"
  function setupActions() {
    // Обработчики для полей ввода количества
    const quantityInputs = root.querySelectorAll(".product-quantity");
    quantityInputs.forEach((input) => {
      input.addEventListener("change", function () {
        const minQty = parseInt(this.min, 10) || 1;
        const maxQty = parseInt(this.getAttribute("data-max-qty"), 10) || 0;
        let value = parseInt(this.value, 10) || 0;

        if (value < minQty) {
          value = minQty;
        }
        if (value > maxQty && maxQty !== 0) {
          value = maxQty;
          // Уведомление пользователя о превышении доступного количества
          alert(`Максимальное доступное количество: ${maxQty}`);
        }
        this.value = value > 0 ? value : "";
      });
    });

    // Обработчики для кнопок "В корзину"
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
          // Логика добавления в корзину
          console.log(
            `Добавлено в корзину: Артикул ${article}, Количество ${quantity}`
          );
          // Пример изменения текста кнопки
          this.textContent = "✔ В корзине";
          setStyles(this, {
            backgroundColor: "#45a049",
          });
        } else {
          // Уведомление пользователя о необходимости ввода количества
          alert("Пожалуйста, введите количество для добавления в корзину.");
        }
      });
    });
  }

  // Инициализация
  async function initialize() {
    await renderCardView();
    cleanQuantityInputs();
    setupActions();
  }

  initialize();
};

/**
 * Обёрточная функция, которую вызовет GComm_TabManager.
 * Она просто пробрасывает shadowRoot и нужные вам настройки
 * внутрь уже существующей initCardView.
 */
window.initCardViewShadow = async function (shadowRoot) {
  // Здесь вы задаёте параметры для initCardView.
  // Параметр root заменяем на shadowRoot.
  await window.initCardView({
    root: shadowRoot,
    containerId: "hitsGrid",
    maxItems: 6,
    filter: () => true,
    customStyles: {
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "10px",
    },
    randomize: true,
  });
};
