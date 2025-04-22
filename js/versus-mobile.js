window.initVersusMobileFunction = function (root = document) {
  // Определяем, является ли устройство мобильным
  const isMobile =
    window.innerWidth <= 768 ||
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/iPhone|iPad|iPod/i);

  if (!isMobile) {
    console.log(
      "Десктопное устройство определено, versus-mobile.js не инициализирован"
    );
    return;
  }

  // Скрываем элементы десктопного интерфейса на мобильных устройствах
  const mainContainer = document.querySelector(".main-container");
  const toggleFiltersBtn = document.querySelector("#toggleFilters");

  if (mainContainer) mainContainer.style.display = "none";
  if (toggleFiltersBtn) toggleFiltersBtn.style.display = "none";

  // Проверяем, является ли контекст shadow DOM
  const isShadowRoot = root.nodeType === Node.DOCUMENT_FRAGMENT_NODE;

  if (!isShadowRoot) {
    console.warn(
      "Мобильный вид для подбора аналогов должен инициализироваться только в shadow root"
    );
    return;
  }

  console.log("Инициализация мобильного вида подбора аналогов в shadow root");

  // Основные переменные
  let productsData = [];
  let sortConfig = { key: null, order: "asc" };
  let selectedCharacteristics = [];
  let globalMinPrice = 0;
  let globalMaxPrice = 100000;
  let currentFilters = {
    minPrice: 0,
    maxPrice: 100000,
    brands: [],
    cordless: false,
    reversible: false,
  };

  // 1. Загружаем стили для мобильного вида
  const loadStyles = () => {
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "/css/versus-mobile.css";
    root.appendChild(linkElement);

    // Добавляем инлайн-стили для скрытия десктопных элементов
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .main-container, #toggleFilters {
        display: none !important;
      }
    `;
    root.appendChild(styleElement);
  };

  // 2. Создаем основную структуру интерфейса
  const createMobileUI = () => {
    // Создаем основной контейнер
    const container = document.createElement("div");
    container.className = "mobile-container";
    container.style.zIndex = "1000"; // Устанавливаем высокий z-index

    // Добавляем заголовок страницы
    const title = document.createElement("h1");
    title.className = "page-title";
    title.textContent = "Подбор аналогов";
    container.appendChild(title);

    // Контейнер для товаров
    const productsContainer = document.createElement("div");
    productsContainer.className = "products-container";
    container.appendChild(productsContainer);

    // Создаем оверлей (затемнение)
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    container.appendChild(overlay);

    // Панель фильтров (off-canvas)
    const filtersPanel = document.createElement("div");
    filtersPanel.className = "filters-panel";

    // Заголовок панели фильтров
    const filtersHeader = document.createElement("div");
    filtersHeader.className = "filters-header";
    filtersHeader.innerHTML = `
      <h2>Фильтры</h2>
      <button class="close-filters">&times;</button>
    `;
    filtersPanel.appendChild(filtersHeader);

    // Контент фильтров
    const filtersContent = document.createElement("div");
    filtersContent.className = "filters-content";

    // Добавляем фильтр по цене
    const priceGroup = document.createElement("div");
    priceGroup.className = "filter-group";
    priceGroup.innerHTML = `
      <label>Цена:</label>
      <div class="price-inputs">
        <input type="number" id="priceInputFrom" placeholder="От" min="0">
        <input type="number" id="priceInputTo" placeholder="До" min="0">
      </div>
      <div id="priceSlider" class="dual-range"></div>
      <div class="price-values">
        <span id="priceMinVal">0 ₽</span> — <span id="priceMaxVal">0 ₽</span>
      </div>
    `;
    filtersContent.appendChild(priceGroup);

    // Добавляем фильтр по брендам
    const brandGroup = document.createElement("div");
    brandGroup.className = "filter-group";
    brandGroup.innerHTML = `
      <label>Бренды:</label>
      <div class="checkbox-list brand-filter">
        <label><input type="checkbox" name="brand" value="Bosch"> Bosch</label>
        <label><input type="checkbox" name="brand" value="DeWalt"> DeWalt</label>
        <label><input type="checkbox" name="brand" value="Makita"> Makita</label>
        <label><input type="checkbox" name="brand" value="Black & Decker"> Black & Decker</label>
        <label><input type="checkbox" name="brand" value="Craftsman"> Craftsman</label>
      </div>
    `;
    filtersContent.appendChild(brandGroup);

    // Добавляем переключатели (беспроводные, реверс)
    const togglesGroup = document.createElement("div");
    togglesGroup.className = "filter-group";
    togglesGroup.innerHTML = `
      <label>Особенности:</label>
      <div class="checkbox-list toggle-filter">
        <label><input type="checkbox" name="cordless"> Беспроводной</label>
        <label><input type="checkbox" name="reversible"> Реверсная</label>
      </div>
    `;
    filtersContent.appendChild(togglesGroup);

    // Добавляем фильтр по характеристикам
    const charGroup = document.createElement("div");
    charGroup.className = "filter-group";
    charGroup.innerHTML = `
      <label>Характеристики сравнения:</label>
      <div id="characteristics-filters" class="checkbox-list">
        <!-- Чекбоксы добавляются скриптом -->
      </div>
    `;
    filtersContent.appendChild(charGroup);

    filtersPanel.appendChild(filtersContent);

    // Кнопки действий фильтров
    const filterButtons = document.createElement("div");
    filterButtons.className = "filter-buttons";
    filterButtons.innerHTML = `
      <button id="resetFilters">Сбросить</button>
      <button id="applyFilters">Применить</button>
    `;
    filtersPanel.appendChild(filterButtons);

    container.appendChild(filtersPanel);

    // Плавающие кнопки
    const floatingBtns = document.createElement("div");
    floatingBtns.className = "floating-btns";

    // Кнопка сортировки
    const sortBtn = document.createElement("button");
    sortBtn.className = "float-btn sort-btn";
    sortBtn.innerHTML = '<i class="ri-sort-asc"></i>';
    floatingBtns.appendChild(sortBtn);

    // Кнопка фильтров
    const filterBtn = document.createElement("button");
    filterBtn.className = "float-btn filter-btn";
    filterBtn.innerHTML = '<i class="ri-filter-3-line"></i>';
    floatingBtns.appendChild(filterBtn);

    container.appendChild(floatingBtns);

    // Меню сортировки
    const sortMenu = document.createElement("div");
    sortMenu.className = "sort-menu";

    // Заголовок меню сортировки с кнопкой закрытия
    const sortMenuHeader = document.createElement("div");
    sortMenuHeader.className = "sort-menu-header";
    sortMenuHeader.innerHTML = `
      <span>Сортировка</span>
      <button class="close-sort">&times;</button>
    `;
    sortMenu.appendChild(sortMenuHeader);

    const sortOptions = document.createElement("div");
    sortOptions.className = "sort-options";
    sortMenu.appendChild(sortOptions);

    container.appendChild(sortMenu);

    // Добавляем весь контейнер в shadow DOM
    if (root.firstChild) {
      root.insertBefore(container, root.firstChild);
    } else {
      root.appendChild(container);
    }

    return {
      container,
      productsContainer,
      filtersPanel,
      overlay,
      sortMenu,
      sortOptions,
      filterBtn,
      sortBtn,
    };
  };

  // 3. Функция получения данных о товарах
  const fetchProducts = async () => {
    try {
      const response = await fetch("/data/versus.json");
      if (!response.ok) {
        throw new Error(`Ошибка загрузки данных: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка при загрузке товаров:", error);
      return [];
    }
  };

  // 4. Функция для определения случайной кратности (чаще 1, иногда 5, 3 или 6)
  const getRandomMultiplicity = () => {
    const options = [1, 1, 1, 5, 3, 6];
    return options[Math.floor(Math.random() * options.length)];
  };

  // 5. Функция для создания карточки товара
  const createProductCard = (product, uiComponents) => {
    // Проверяем, есть ли кратность, если нет - генерируем
    if (!product.кратность) {
      product.кратность = getRandomMultiplicity();
    }

    // Создаем строку с карточкой и характеристиками
    const productRow = document.createElement("div");
    productRow.className = "product-row";
    productRow.dataset.id = product.id;

    // Создаем карточку товара
    const card = document.createElement("div");
    card.className = "product-card";

    // Изображение товара
    const img = document.createElement("img");
    img.className = "product-image";
    img.src = product.изображение;
    img.alt = product.название;
    img.loading = "lazy";
    card.appendChild(img);

    // Название товара
    const name = document.createElement("div");
    name.className = "product-name";
    name.textContent = product.название;
    card.appendChild(name);

    // Цена товара
    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = `${product.стоимость} ₽`;
    card.appendChild(price);

    // Блок действий (кратность, количество, корзина, удаление)
    const actions = document.createElement("div");
    actions.className = "product-actions";

    // Кратность
    const multiplicity = document.createElement("div");
    multiplicity.className = "product-multiplicity";
    multiplicity.textContent = `Кратность: ${product.кратность}`;
    actions.appendChild(multiplicity);

    // Количество
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.className = "qty-input";
    qtyInput.placeholder = "Кол-во";
    qtyInput.min = product.кратность;
    qtyInput.addEventListener("blur", function () {
      let val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < product.кратность) {
        qtyInput.value = product.кратность;
      } else if (val % product.кратность !== 0) {
        qtyInput.value = Math.ceil(val / product.кратность) * product.кратность;
      }
    });
    actions.appendChild(qtyInput);

    // Кнопка добавления в корзину
    const cartBtn = document.createElement("button");
    cartBtn.className = "cart-btn";
    cartBtn.innerHTML = '<i class="ri-shopping-cart-line"></i>';
    cartBtn.addEventListener("click", function () {
      qtyInput.value = product.кратность;
      // Здесь можно добавить код для добавления в корзину
    });
    actions.appendChild(cartBtn);

    // Кнопка удаления
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = '<i class="ri-close-line"></i>';
    removeBtn.addEventListener("click", function () {
      // Функция удаления будет привязана позже
    });
    actions.appendChild(removeBtn);

    card.appendChild(actions);

    // Добавляем карточку в строку
    productRow.appendChild(card);

    // Создаем блок характеристик
    const specs = document.createElement("div");
    specs.className = "product-specs";

    // Добавляем выбранные характеристики
    if (selectedCharacteristics.length > 0) {
      selectedCharacteristics.forEach((char) => {
        const specRow = document.createElement("div");
        specRow.className = "spec-row";
        // Если это текущее поле сортировки, выделяем
        if (sortConfig.key === char.key) {
          specRow.classList.add("sorted");
        }

        const specName = document.createElement("div");
        specName.className = "spec-name";
        specName.textContent = char.label + ":";

        const specValue = document.createElement("div");
        specValue.className = "spec-value";

        // Преобразуем булевые значения в Да/Нет
        let displayValue = product[char.key];
        if (typeof displayValue === "boolean") {
          displayValue = displayValue ? "Да" : "Нет";
        }

        specValue.textContent = displayValue;

        specRow.appendChild(specName);
        specRow.appendChild(specValue);
        specs.appendChild(specRow);
      });
    } else {
      // Если характеристики не выбраны, показываем подсказку
      const hint = document.createElement("div");
      hint.style.textAlign = "center";
      hint.style.padding = "10px";
      hint.style.color = "#777";
      hint.innerHTML =
        '<i class="ri-menu-line" style="font-size: 24px; margin-bottom: 5px;"></i><br>Выберите характеристики для сравнения';
      specs.appendChild(hint);

      // Добавляем обработчик клика на подсказку
      if (uiComponents) {
        hint.style.cursor = "pointer";
        hint.addEventListener("click", () => {
          // Открываем панель фильтров
          uiComponents.filtersPanel.classList.add("active");
          uiComponents.overlay.classList.add("active");

          // Прокручиваем к разделу характеристик
          const charGroup = root.querySelector("#characteristics-filters");
          if (charGroup) {
            setTimeout(() => {
              const filtersContent = root.querySelector(".filters-content");
              if (filtersContent) {
                filtersContent.scrollTop = charGroup.offsetTop - 20;
              }
            }, 300);
          }
        });
      }
    }

    productRow.appendChild(specs);

    return productRow;
  };

  // 6. Функция для заполнения характеристик
  const populateCharacteristics = (product) => {
    const container = root.getElementById("characteristics-filters");
    if (!container) return;

    // Очищаем контейнер
    container.innerHTML = "";

    // Исключаем базовые поля
    const excludedKeys = [
      "id",
      "название",
      "изображение",
      "стоимость",
      "кратность",
    ];

    // Маппинг ключ => отображаемое название
    const mapping = {
      тип_сверла: "Тип сверла",
      реверсная: "Реверсная",
      беспроводной: "Беспроводной",
      вес: "Вес (кг)",
      высота: "Высота (см)",
      производительность: "Производительность (Вт)",
      напряжение: "Напряжение (В)",
      бесщеточный_двигатель: "Бесщеточный двигатель",
      максимальная_скорость_сверления: "Макс. скорость сверления (RPM)",
      различные_скорости: "Имеет различные скорости",
      сила_тока: "Сила тока (А)",
      диаметр_патрона: "Диаметр патрона (мм)",
      быстрозажимной_патрон: "Быстрозажимной патрон",
      контактный_патрон: "Контактный патрон",
      высокоточный_патрон: "Высокоточный патрон",
    };

    // Создаем чекбоксы для каждой характеристики
    for (let key in product) {
      if (excludedKeys.includes(key)) continue;

      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "characteristic";
      input.value = key;

      // Проверяем, выбрана ли характеристика
      const isSelected = selectedCharacteristics.some(
        (char) => char.key === key
      );
      input.checked = isSelected;

      label.appendChild(input);
      label.appendChild(document.createTextNode(mapping[key] || key));
      container.appendChild(label);
    }
  };

  // 7. Функция для обновления меню сортировки
  const updateSortMenu = (sortOptions) => {
    // Очищаем меню
    sortOptions.innerHTML = "";

    // Базовые поля для сортировки
    const defaultOptions = [
      { key: "название", label: "Название" },
      { key: "стоимость", label: "Цена" },
    ];

    // Добавляем базовые опции
    defaultOptions.forEach((option) => {
      const optionElement = document.createElement("div");
      optionElement.className = "sort-option";
      if (sortConfig.key === option.key) {
        optionElement.classList.add("active");
      }

      const icon = document.createElement("i");
      icon.className =
        sortConfig.order === "asc" ? "ri-sort-asc" : "ri-sort-desc";
      optionElement.appendChild(icon);

      const text = document.createTextNode(option.label);
      optionElement.appendChild(text);

      optionElement.addEventListener("click", () => {
        if (sortConfig.key === option.key) {
          // Если уже выбрана эта опция, меняем порядок
          sortConfig.order = sortConfig.order === "asc" ? "desc" : "asc";
        } else {
          // Иначе устанавливаем новый ключ и сбрасываем порядок
          sortConfig.key = option.key;
          sortConfig.order = "asc";
        }

        // Обновляем UI и сортируем
        updateSortMenu(sortOptions);
        sortAndRenderProducts();
      });

      sortOptions.appendChild(optionElement);
    });

    // Добавляем выбранные характеристики
    selectedCharacteristics.forEach((char) => {
      const optionElement = document.createElement("div");
      optionElement.className = "sort-option";
      if (sortConfig.key === char.key) {
        optionElement.classList.add("active");
      }

      const icon = document.createElement("i");
      icon.className =
        sortConfig.order === "asc" ? "ri-sort-asc" : "ri-sort-desc";
      optionElement.appendChild(icon);

      const text = document.createTextNode(char.label);
      optionElement.appendChild(text);

      optionElement.addEventListener("click", () => {
        if (sortConfig.key === char.key) {
          // Если уже выбрана эта опция, меняем порядок
          sortConfig.order = sortConfig.order === "asc" ? "desc" : "asc";
        } else {
          // Иначе устанавливаем новый ключ и сбрасываем порядок
          sortConfig.key = char.key;
          sortConfig.order = "asc";
        }

        // Обновляем UI и сортируем
        updateSortMenu(sortOptions);
        sortAndRenderProducts();
      });

      sortOptions.appendChild(optionElement);
    });
  };

  // 8. Функция для применения фильтров
  const applyFilters = (products) => {
    return products.filter((product) => {
      // Фильтр по цене
      if (
        product.стоимость < currentFilters.minPrice ||
        product.стоимость > currentFilters.maxPrice
      ) {
        return false;
      }

      // Фильтр по брендам
      if (currentFilters.brands.length > 0) {
        // Предполагаем, что бренд есть в названии
        const productBrand = currentFilters.brands.find((brand) =>
          product.название.includes(brand)
        );
        if (!productBrand) {
          return false;
        }
      }

      // Фильтр по беспроводным
      if (currentFilters.cordless && !product.беспроводной) {
        return false;
      }

      // Фильтр по реверсным
      if (currentFilters.reversible && !product.реверсная) {
        return false;
      }

      return true;
    });
  };

  // 9. Функция для сортировки товаров
  const sortProducts = (products) => {
    if (!sortConfig.key) return products;

    return products.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Преобразуем булевы значения для сортировки
      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }

      // Числовые значения
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.order === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Строковые значения
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (aVal < bVal) return sortConfig.order === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });
  };

  // 10. Функция для рендеринга списка товаров
  const renderProducts = (products, container, uiComponents) => {
    // Очищаем контейнер
    container.innerHTML = "";

    // Если нет товаров, показываем сообщение
    if (products.length === 0) {
      const noProducts = document.createElement("div");
      noProducts.className = "no-products";
      noProducts.innerHTML = `
        <i class="ri-error-warning-line" style="font-size: 40px; margin-bottom: 10px;"></i>
        <p>Товары не найдены. Попробуйте изменить фильтры.</p>
      `;
      container.appendChild(noProducts);
      return;
    }

    // Создаем и добавляем карточки товаров с анимацией
    products.forEach((product, index) => {
      const card = createProductCard(product, uiComponents);
      // Добавляем небольшую задержку для анимации
      setTimeout(() => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        container.appendChild(card);

        // Анимируем появление
        setTimeout(() => {
          card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, 50);
      }, index * 30); // Задержка для каждой карточки

      // Добавляем обработчик удаления
      const removeBtn = card.querySelector(".remove-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          // Анимация удаления
          card.style.opacity = "0";
          card.style.transform = "translateX(100px)";

          setTimeout(() => {
            productsData = productsData.filter((p) => p.id !== product.id);
            sortAndRenderProducts();
          }, 300);
        });
      }
    });
  };

  // 11. Функция для сортировки и рендеринга
  const sortAndRenderProducts = () => {
    // Применяем фильтры
    const filteredProducts = applyFilters(productsData);

    // Сортируем
    const sortedProducts = sortProducts(filteredProducts);

    // Рендерим
    renderProducts(sortedProducts, ui.productsContainer, ui);
  };

  // 12. Функция для инициализации noUiSlider
  const initPriceSlider = (min, max) => {
    const priceSlider = root.getElementById("priceSlider");
    if (!priceSlider) return;

    // Инициализируем noUiSlider
    noUiSlider.create(priceSlider, {
      start: [min, max],
      connect: true,
      step: 1,
      range: {
        min: min,
        max: max,
      },
      format: {
        to: function (value) {
          return Math.round(value) + " ₽";
        },
        from: function (value) {
          return Number(value.replace(" ₽", ""));
        },
      },
    });

    // Обновляем значения при изменении ползунка
    priceSlider.noUiSlider.on("update", function (values) {
      const minVal = Number(values[0].replace(" ₽", ""));
      const maxVal = Number(values[1].replace(" ₽", ""));

      const priceInputFrom = root.getElementById("priceInputFrom");
      const priceInputTo = root.getElementById("priceInputTo");
      const priceMinVal = root.getElementById("priceMinVal");
      const priceMaxVal = root.getElementById("priceMaxVal");

      if (priceInputFrom) priceInputFrom.value = minVal;
      if (priceInputTo) priceInputTo.value = maxVal;
      if (priceMinVal) priceMinVal.textContent = minVal + " ₽";
      if (priceMaxVal) priceMaxVal.textContent = maxVal + " ₽";
    });

    // Синхронизация полей ввода с ползунком
    const priceInputFrom = root.getElementById("priceInputFrom");
    const priceInputTo = root.getElementById("priceInputTo");

    if (priceInputFrom && priceInputTo) {
      priceInputFrom.addEventListener("change", updateSliderFromInputs);
      priceInputTo.addEventListener("change", updateSliderFromInputs);
    }

    function updateSliderFromInputs() {
      let fromVal = parseInt(priceInputFrom.value, 10) || globalMinPrice;
      let toVal = parseInt(priceInputTo.value, 10) || globalMaxPrice;

      if (fromVal < globalMinPrice) fromVal = globalMinPrice;
      if (toVal > globalMaxPrice) toVal = globalMaxPrice;
      if (fromVal > toVal) fromVal = toVal;

      priceSlider.noUiSlider.set([fromVal, toVal]);
    }
  };

  // 13. Функция для запуска всех инициализаций
  const init = async () => {
    // Загружаем стили
    loadStyles();

    // Создаем UI компоненты
    const ui = createMobileUI();

    // Загружаем данные
    productsData = await fetchProducts();

    if (productsData.length === 0) {
      ui.productsContainer.innerHTML = `
        <div class="empty-state">
          <i class="ri-error-warning-line"></i>
          <p>Ошибка загрузки данных. Пожалуйста, попробуйте позже.</p>
        </div>
      `;
      return ui;
    }

    // Получаем диапазон цен
    const prices = productsData.map((p) => p.стоимость);
    globalMinPrice = Math.min(...prices);
    globalMaxPrice = Math.max(...prices);

    // Устанавливаем начальные значения фильтров
    currentFilters.minPrice = globalMinPrice;
    currentFilters.maxPrice = globalMaxPrice;

    // Инициализируем ползунок цены
    initPriceSlider(globalMinPrice, globalMaxPrice);

    // Заполняем характеристики для фильтрации
    populateCharacteristics(productsData[0]);

    // Отображаем товары
    renderProducts(productsData, ui.productsContainer, ui);

    // Обработчики событий

    // Кнопка открытия фильтров
    ui.filterBtn.addEventListener("click", () => {
      ui.filtersPanel.classList.add("active");
      ui.overlay.classList.add("active");
    });

    // Кнопка закрытия фильтров
    const closeFiltersBtn = ui.filtersPanel.querySelector(".close-filters");
    if (closeFiltersBtn) {
      closeFiltersBtn.addEventListener("click", () => {
        ui.filtersPanel.classList.remove("active");
        ui.overlay.classList.remove("active");
      });
    }

    // Кнопка закрытия меню сортировки
    const closeSortBtn = ui.sortMenu.querySelector(".close-sort");
    if (closeSortBtn) {
      closeSortBtn.addEventListener("click", () => {
        ui.sortMenu.classList.remove("active");
      });
    }

    // Закрытие при клике на оверлей
    ui.overlay.addEventListener("click", () => {
      ui.filtersPanel.classList.remove("active");
      ui.overlay.classList.remove("active");
      ui.sortMenu.classList.remove("active");
    });

    // Кнопка сортировки
    ui.sortBtn.addEventListener("click", () => {
      ui.sortMenu.classList.toggle("active");
      updateSortMenu(ui.sortOptions);
    });

    // Кнопка сброса фильтров
    const resetFiltersBtn = root.getElementById("resetFilters");
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", () => {
        // Сбрасываем ползунок цены
        const priceSlider = root.getElementById("priceSlider");
        if (priceSlider && priceSlider.noUiSlider) {
          priceSlider.noUiSlider.set([globalMinPrice, globalMaxPrice]);
        }

        // Сбрасываем поля цены
        const priceInputFrom = root.getElementById("priceInputFrom");
        const priceInputTo = root.getElementById("priceInputTo");
        const priceMinVal = root.getElementById("priceMinVal");
        const priceMaxVal = root.getElementById("priceMaxVal");

        if (priceInputFrom) priceInputFrom.value = globalMinPrice;
        if (priceInputTo) priceInputTo.value = globalMaxPrice;
        if (priceMinVal) priceMinVal.textContent = globalMinPrice + " ₽";
        if (priceMaxVal) priceMaxVal.textContent = globalMaxPrice + " ₽";

        // Сбрасываем чекбоксы брендов
        root
          .querySelectorAll('.brand-filter input[type="checkbox"]')
          .forEach((chk) => (chk.checked = false));

        // Сбрасываем переключатели
        root
          .querySelectorAll('.toggle-filter input[type="checkbox"]')
          .forEach((chk) => (chk.checked = false));

        // Сбрасываем чекбоксы характеристик
        root
          .querySelectorAll(
            '#characteristics-filters input[name="characteristic"]'
          )
          .forEach((chk) => (chk.checked = false));

        // Сбрасываем сортировку
        sortConfig = { key: null, order: "asc" };

        // Сбрасываем характеристики
        selectedCharacteristics = [];

        // Обновляем UI
        renderProducts(productsData, ui.productsContainer, ui);
      });
    }

    // Кнопка применения фильтров
    const applyFiltersBtn = root.getElementById("applyFilters");
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => {
        // Получаем значения цены
        const priceInputFrom = root.getElementById("priceInputFrom");
        const priceInputTo = root.getElementById("priceInputTo");

        currentFilters.minPrice =
          parseInt(priceInputFrom.value, 10) || globalMinPrice;
        currentFilters.maxPrice =
          parseInt(priceInputTo.value, 10) || globalMaxPrice;

        // Получаем выбранные бренды
        currentFilters.brands = Array.from(
          root.querySelectorAll('.brand-filter input[type="checkbox"]:checked')
        ).map((chk) => chk.value);

        // Получаем значения переключателей
        currentFilters.cordless =
          root.querySelector('input[name="cordless"]')?.checked || false;
        currentFilters.reversible =
          root.querySelector('input[name="reversible"]')?.checked || false;

        // Получаем выбранные характеристики
        const charCheckboxes = root.querySelectorAll(
          '#characteristics-filters input[name="characteristic"]:checked'
        );

        // Маппинг для отображаемых названий
        const mapping = {
          тип_сверла: "Тип сверла",
          реверсная: "Реверсная",
          беспроводной: "Беспроводной",
          вес: "Вес (кг)",
          высота: "Высота (см)",
          производительность: "Производительность (Вт)",
          напряжение: "Напряжение (В)",
          бесщеточный_двигатель: "Бесщеточный двигатель",
          максимальная_скорость_сверления: "Макс. скорость сверления (RPM)",
          различные_скорости: "Имеет различные скорости",
          сила_тока: "Сила тока (А)",
          диаметр_патрона: "Диаметр патрона (мм)",
          быстрозажимной_патрон: "Быстрозажимной патрон",
          контактный_патрон: "Контактный патрон",
          высокоточный_патрон: "Высокоточный патрон",
        };

        selectedCharacteristics = Array.from(charCheckboxes).map((chk) => ({
          key: chk.value,
          label: mapping[chk.value] || chk.value,
        }));

        // Закрываем панель фильтров
        ui.filtersPanel.classList.remove("active");
        ui.overlay.classList.remove("active");

        // Обновляем UI
        sortAndRenderProducts();
      });
    }

    // Добавляем поддержку жестов для мобильных устройств
    let touchStartX = 0;
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      if (!touchStartX) return;

      const touchEndX = e.touches[0].clientX;
      const diff = touchStartX - touchEndX;

      // Свайп влево (открыть фильтры)
      if (diff < -50 && !ui.filtersPanel.classList.contains("active")) {
        ui.filtersPanel.classList.add("active");
        ui.overlay.classList.add("active");
      }

      // Свайп вправо (закрыть фильтры)
      if (diff > 50 && ui.filtersPanel.classList.contains("active")) {
        ui.filtersPanel.classList.remove("active");
        ui.overlay.classList.remove("active");
      }

      touchStartX = 0;
    };

    document.addEventListener("touchstart", handleTouchStart, false);
    document.addEventListener("touchmove", handleTouchMove, false);

    // Возвращаем UI компоненты для использования в других функциях
    return ui;
  };

  // Запускаем инициализацию
  const ui = init();
};
