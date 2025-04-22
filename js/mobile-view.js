window.initMobileView = function (root) {
  // 1. Проверяем, является ли контекст shadow DOM и находимся ли мы на мобильном устройстве
  const isShadowRoot = root.nodeType === Node.DOCUMENT_FRAGMENT_NODE;

  if (!isShadowRoot) {
    console.warn("Mobile view должен инициализироваться только в shadow root");
    return;
  }

  const isMobile =
    window.innerWidth <= 768 ||
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/iPhone|iPad|iPod/i);

  if (!isMobile) {
    console.log("Desktop device detected, mobile view not initialized");
    return;
  }

  console.log("Mobile view initializing in shadow root");

  // 2. Инжектируем необходимые стили только в текущий shadow root
  const injectStyles = () => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
          /* Глобальные переменные и сброс для мобильного вида */
          :host {
            --mobile-primary-color: #638a8e;
            --mobile-text-color: #333;
            --mobile-light-gray: #e0e0e0;
            --mobile-card-radius: 8px;
            --mobile-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            --mobile-accent-color: #fe9c00;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            overflow-x: hidden !important;
          }
          
          /* Скрываем кнопку переключения видов в мобильной версии */
          #toggleViewButton {
            display: none !important;
          }
          .applied-filters-container {
            display: none !important;
          }      
          /* Стили для контейнера страницы */
          .content-wrapper {
            height: 93vh !important;
            width: 100% !important;
            margin-left: 0 !important;
            padding: 0 !important;
          }
          
          /* Стили для панели поиска - убраны лишние отступы */
          .search-menu {
            padding: 5px !important;
            margin: 0 !important;
          }
          
          .search-menu-content {
            flex-direction: column !important;
            gap: 5px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .search-menu-title {
            font-size: 14px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Скрываем лишнее в хлебных крошках */
          .search-menu-title .catalog-link:not(:last-child),
          .search-menu-title > *:not(:last-child):not(:first-child) {
            display: none !important;
          }
          
          /* Стили для панели фильтров */
          .filters-panel {
            position: fixed !important;
            top: 0 !important;
            left: -100% !important;
            width: 85% !important;
            height: 100vh !important;
            z-index: 1000 !important;
            background: #fff !important;
            transition: left 0.3s ease !important;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1) !important;
            overflow-y: auto !important;
            padding: 0 !important;
          }
          
          /* Фильтры в активном состоянии */
          .filters-panel.active {
            left: 0 !important;
          }
          
          /* Затемняющий фон при открытых фильтрах */
          .filters-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.5) !important;
            z-index: 999 !important;
            display: none !important;
          }
          
          .filters-overlay.active {
            display: block !important;
          }
          
          /* Заголовок панели фильтров */
          .filter-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 15px !important;
            border-bottom: 1px solid var(--mobile-light-gray) !important;
            background-color: var(--mobile-primary-color) !important;
            color: white !important;
          }
          
          .filter-header h2 {
            margin: 0 !important;
            font-size: 18px !important;
            font-weight: 500 !important;
          }
          
          .close-filters {
            background: none !important;
            border: none !important;
            font-size: 24px !important;
            color: white !important;
            cursor: pointer !important;
            padding: 0 !important;
            line-height: 1 !important;
          }
          
          /* Плавающая кнопка фильтров - поднята на 100px */
          .mobile-filter-button {
            position: fixed !important;
            bottom: 120px !important; /* Поднята на 100px */
            right: 20px !important;
            width: 50px !important;
            height: 50px !important;
            border-radius: 50% !important;
            background: var(--mobile-primary-color) !important;
            color: white !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
            z-index: 900 !important;
            border: none !important;
            font-size: 24px !important;
            cursor: pointer !important;
          }
          
          /* Контейнер товаров в виде сетки */
          #productContainer {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 8px !important;
            margin: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          
          /* Стили для пагинации - убраны лишние отступы */
          .pagination-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 5px !important;
            padding: 5px !important;
            margin: 0 !important;
          }
          
          .pagination {
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 5px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .pagination a, 
          .pagination span {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 32px !important;
            height: 32px !important;
            padding: 0 8px !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            margin: 0 !important;
          }
          
          .pagination span:first-child {
            background-color: var(--mobile-primary-color) !important;
            color: white !important;
          }
          
          .pagination a {
            background-color: #f0f0f0 !important;
            color: #333 !important;
            text-decoration: none !important;
          }
          
          .pagination input[type="number"] {
            width: 50px !important;
            height: 32px !important;
            padding: 0 8px !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            font-size: 13px !important;
          }
          
          .display-option {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            font-size: 13px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .display-option select {
            height: 32px !important;
            padding: 0 8px !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            font-size: 13px !important;
          }
          
          /* Популярные бренды */
          .popular-brands {
            padding: 10px !important;
            margin: 0 !important;
          }
          
          .popular-brands h3 {
            font-size: 14px !important;
            margin: 0 0 8px 0 !important;
          }
          
          .popular-brands .brands {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .popular-brands a {
            font-size: 12px !important;
            color: var(--mobile-primary-color) !important;
            text-decoration: none !important;
            background-color: #f0f0f0 !important;
            padding: 5px 10px !important;
            border-radius: 4px !important;
            margin: 0 !important;
          }
          
          /* Футер */
          .footer {
            padding: 10px !important;
            margin-top: 10px !important;
            border-top: 1px solid #eee !important;
          }
          
          .footer-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 5px !important;
            font-size: 12px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Обработка свайпов и тач-ивентов */
          .swipe-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 20px !important;
            height: 100vh !important;
            z-index: 200 !important;
            background: transparent !important;
          }
          
          /* Скрываем элементы, не нужные в мобильной версии */
          #toggleViewButton,
          #toggleFilters,
          .go-to {
            display: none !important;
          }
          
          /* Стили для инпута количества */
          .product-quantity {
            height: 36px !important;
            box-sizing: border-box !important;
            text-align: center !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
          }
          
          .product-quantity::placeholder {
            color: #999 !important;
            opacity: 1 !important;
          }
          
          /* Стили для кнопки корзины */
          .add-to-cart-button {
            height: 36px !important;
            box-sizing: border-box !important;
            background-color: #fe9c00 !important;
            border: none !important;
            border-radius: 4px !important;
            color: white !important;
            font-size: 18px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          /* Стили для таблиц в полноэкранном слайдере */
          .fullscreen-slider-overlay table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          .fullscreen-slider-overlay table td,
          .fullscreen-slider-overlay table th {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          .fullscreen-slider-overlay table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .fullscreen-slider-overlay h2 {
            font-size: 18px;
            margin-top: 0;
            margin-bottom: 10px;
          }
          
          .fullscreen-slider-overlay h3 {
            font-size: 16px;
            margin-top: 15px;
            margin-bottom: 8px;
          }
          
          .fullscreen-slider-overlay p {
            margin-bottom: 10px;
            line-height: 1.4;
          }
          
          .fullscreen-slider-overlay ul {
            padding-left: 20px;
            margin-bottom: 10px;
          }
        `;

    // Добавляем стили в shadow root
    root.appendChild(styleElement);
  };

  // 3. Функция для создания необходимых элементов мобильного интерфейса
  const createMobileElements = () => {
    // Создаем оверлей для затемнения при открытых фильтрах
    const filtersOverlay = document.createElement("div");
    filtersOverlay.className = "filters-overlay";
    root.appendChild(filtersOverlay);

    // Создаем область для распознавания свайпа справа
    const swipeArea = document.createElement("div");
    swipeArea.className = "swipe-area";
    root.appendChild(swipeArea);

    // Проверяем наличие панели фильтров
    const filtersPanel = root.querySelector(".filters-panel");
    if (filtersPanel) {
      // Добавляем заголовок в панель фильтров, если его нет
      if (!filtersPanel.querySelector(".filter-header")) {
        const filterHeader = document.createElement("div");
        filterHeader.className = "filter-header";
        filterHeader.innerHTML = `
              <h2>Фильтры</h2>
              <button class="close-filters">&times;</button>
            `;

        // Вставляем в начало панели
        if (filtersPanel.firstChild) {
          filtersPanel.insertBefore(filterHeader, filtersPanel.firstChild);
        } else {
          filtersPanel.appendChild(filterHeader);
        }
      }

      // Добавляем плавающую кнопку фильтров
      const filterButton = document.createElement("button");
      filterButton.className = "mobile-filter-button";
      filterButton.innerHTML = '<i class="ri-filter-3-line"></i>';
      root.appendChild(filterButton);

      // Обработчик для открытия фильтров
      filterButton.addEventListener("click", () => {
        filtersPanel.classList.add("active");
        filtersOverlay.classList.add("active");
      });

      // Обработчик для закрытия фильтров
      const closeFiltersBtn = filtersPanel.querySelector(".close-filters");
      if (closeFiltersBtn) {
        closeFiltersBtn.addEventListener("click", () => {
          filtersPanel.classList.remove("active");
          filtersOverlay.classList.remove("active");
        });
      }

      // Закрытие фильтров при клике на оверлей
      filtersOverlay.addEventListener("click", () => {
        filtersPanel.classList.remove("active");
        filtersOverlay.classList.remove("active");
      });
    }
  };

  // 4. Функция для полноэкранного слайдера с информацией о товаре
  function showFullScreenSlider(images, article) {
    const sliderWidth = Math.min(window.innerWidth * 0.9, 600);
    const slideGap = 10;
    const overlay = document.createElement("div");
    overlay.className = "fullscreen-slider-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.48)",
      backdropFilter: "blur(2px)",
      display: "flex",
      flexDirection: "column",
      zIndex: "9999",
      overflowY: "auto",
      overflowX: "hidden",
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const upperContainer = document.createElement("div");
    Object.assign(upperContainer.style, {
      flex: "0 0 66.66vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
    overlay.appendChild(upperContainer);

    const lowerContainer = document.createElement("div");
    Object.assign(lowerContainer.style, {
      width: "100%",
      padding: "16px",
      backgroundColor: "#fff",
      color: "#000",
      boxSizing: "border-box",
    });
    overlay.appendChild(lowerContainer);

    const sliderWrapper = document.createElement("div");
    sliderWrapper.style.position = "relative";
    sliderWrapper.style.width = sliderWidth + "px";
    sliderWrapper.style.height = sliderWidth + "px";
    sliderWrapper.style.overflow = "visible";
    upperContainer.appendChild(sliderWrapper);

    const sliderContainer = document.createElement("div");
    Object.assign(sliderContainer.style, {
      display: "flex",
      height: sliderWidth + "px",
      width: (sliderWidth + slideGap) * images.length - slideGap + "px",
      transition: "transform 0.3s ease-out",
    });
    sliderWrapper.appendChild(sliderContainer);

    images.forEach((src, idx) => {
      const slide = document.createElement("div");
      slide.style.flex = "0 0 " + sliderWidth + "px";
      slide.style.width = sliderWidth + "px";
      slide.style.height = sliderWidth + "px";
      if (idx < images.length - 1) {
        slide.style.marginRight = slideGap + "px";
      }
      slide.style.display = "flex";
      slide.style.justifyContent = "center";
      slide.style.alignItems = "center";

      const img = document.createElement("img");
      img.src = src;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.borderRadius = "8px";

      slide.appendChild(img);
      sliderContainer.appendChild(slide);
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    Object.assign(closeBtn.style, {
      position: "absolute",
      top: "-60px",
      right: "0",
      fontSize: "28px",
      fontWeight: "bold",
      backgroundColor: "#fe9c00",
      color: "#fff",
      border: "none",
      padding: "5px 10px",
      borderRadius: "4px",
      cursor: "pointer",
      zIndex: "10000",
    });
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.remove();
    });
    sliderWrapper.appendChild(closeBtn);

    let currentSlide = 0;

    // Если всего 1 изображение => не показываем стрелки и индикаторы, а низ заполняем расширенным описанием:
    if (images.length < 2) {
      lowerContainer.innerHTML = `
          <div class="description-section" style="margin-bottom: 20px;">
            <h2>Фотореле EKF PS-5 15А 3300Вт IP66 PROxima</h2>
            <p>
              Фотореле PS-5 применяется для управления освещением или другой нагрузкой
              в зависимости от уровня освещенности. Обычно фотореле применяется в системах
              управления уличным освещением и включает/выключает нагрузку в момент захода/восхода солнца.
              Допускается прямое подключение нагрузки с током не более 15А. Нагрузка большей мощности
              может быть подключена при помощи контактора. Порог срабатывания по освещенности настраивается
              в диапазоне 5-50 лк. Фотореле имеет степень защиты IP66, что позволяет устанавливать его
              в условиях сильного воздействия пыли и влаги.
            </p>
          </div>
          <div class="description-section" style="margin-bottom: 20px;">
            <h3>Характеристики</h3>
            <div class="table-wrapper" style="overflow-x: auto; border: 1px solid #ccc;">
              <table>
                <tr><td>Статус</td><td>Регулярная</td></tr>
                <tr><td>Макс. ток коммутируем. резистивной нагрузки, А</td><td>15</td></tr>
                <tr><td>Макс. коммутационная мощность (подключ. нагрузка), Вт</td><td>3 300</td></tr>
                <tr><td>Установка сумеречного порога, лк</td><td>5...50</td></tr>
                <tr><td>Подходит для степени защиты (IP)</td><td>IP66</td></tr>
                <tr><td>Номин. напряжение, В</td><td>230</td></tr>
                <tr><td>Задержка включения, с</td><td>5</td></tr>
                <tr><td>Задержка отключения, с</td><td>540</td></tr>
                <tr><td>Цвет по RAL</td><td>9 010</td></tr>
                <tr><td>Освещённость, при которой происходит отключение, лк</td><td>5...50</td></tr>
                <tr><td>Рабочая температура, °C</td><td>-25...40</td></tr>
                <tr><td>Цвет</td><td>Белый</td></tr>
                <tr><td>Гарантийный срок эксплуатации</td><td>7 лет</td></tr>
              </table>
            </div>
          </div>
          <div class="description-section" style="margin-bottom: 20px;">
            <h3>Логистические параметры</h3>
            <div class="table-wrapper" style="overflow-x: auto; border: 1px solid #ccc;">
              <table>
                <tr>
                  <th>Вид параметра</th>
                  <th>Индивидуальная</th>
                  <th>Групповая</th>
                  <th>Транспортная</th>
                </tr>
                <tr>
                  <td>Количество в упаковке</td>
                  <td>1</td>
                  <td>1</td>
                  <td>100</td>
                </tr>
                <tr>
                  <td>Единица хранения</td>
                  <td>Штука</td>
                  <td>Штука</td>
                  <td>Коробка</td>
                </tr>
                <tr>
                  <td>Штрих-код</td>
                  <td>4690216240947</td>
                  <td>4690216240947</td>
                  <td>14690216240944</td>
                </tr>
                <tr>
                  <td>Вес брутто, кг</td>
                  <td>0.1390</td>
                  <td>0.1390</td>
                  <td>14.2000</td>
                </tr>
                <tr>
                  <td>Объем, м³</td>
                  <td>0.00090000</td>
                  <td>0.00090000</td>
                  <td>0.07792300</td>
                </tr>
                <tr>
                  <td>Длина, м</td>
                  <td>0.0900</td>
                  <td>0.0900</td>
                  <td>0.4500</td>
                </tr>
                <tr>
                  <td>Ширина, м</td>
                  <td>0.1190</td>
                  <td>0.1190</td>
                  <td>0.4630</td>
                </tr>
                <tr>
                  <td>Высота, м</td>
                  <td>0.0840</td>
                  <td>0.0840</td>
                  <td>0.3740</td>
                </tr>
              </table>
            </div>
          </div>
          <div class="description-section" style="margin-bottom: 20px;">
            <h3>Комплектация:</h3>
            <ul>
              <li>Фотореле</li>
              <li>Паспорт</li>
              <li>Крепежный уголок</li>
              <li>Крепеж</li>
              <li>Упаковка</li>
            </ul>
          </div>
          <div style="height: 100px;"></div>
          `;
      root.appendChild(overlay);
      return;
    }

    // Если 2+ изображений => показываем индикаторы, стрелки и чуть более короткое описание
    const indicatorsContainer = document.createElement("div");
    Object.assign(indicatorsContainer.style, {
      position: "absolute",
      bottom: "-50px",
      left: "0",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      gap: "16px",
      alignItems: "center",
    });
    images.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.style.width = "16px";
      dot.style.height = "16px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = i === 0 ? "#fe9c00" : "#ddd";
      dot.style.transition = "transform 0.3s ease, background-color 0.3s ease";
      indicatorsContainer.appendChild(dot);
    });
    sliderWrapper.appendChild(indicatorsContainer);

    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "◀";
    prevBtn.title = "Предыдущее";
    Object.assign(prevBtn.style, {
      position: "absolute",
      bottom: "-70px",
      left: "calc(50% - 190px)",
      fontSize: "24px",
      backgroundColor: "#fe9c00",
      border: "none",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      zIndex: "10000",
    });

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "▶";
    nextBtn.title = "Следующее";
    Object.assign(nextBtn.style, {
      position: "absolute",
      bottom: "-70px",
      left: "calc(50% + 140px)",
      fontSize: "24px",
      backgroundColor: "#fe9c00",
      border: "none",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      zIndex: "10000",
    });
    sliderWrapper.appendChild(prevBtn);
    sliderWrapper.appendChild(nextBtn);

    function updateSlidePosition() {
      prevTranslate = -((sliderWidth + slideGap) * currentSlide);
      sliderContainer.style.transition = "transform 0.3s ease-out";
      sliderContainer.style.transform = `translateX(${prevTranslate}px)`;
      updateIndicators();
    }

    function updateIndicators() {
      const dots = indicatorsContainer.querySelectorAll("div");
      dots.forEach((dot, i) => {
        if (i === currentSlide) {
          dot.style.transform = "scale(1.4)";
          dot.style.backgroundColor = "#fe9c00";
        } else {
          dot.style.transform = "scale(1)";
          dot.style.backgroundColor = "#ddd";
        }
      });
    }

    prevBtn.addEventListener("click", () => {
      currentSlide = (currentSlide - 1 + images.length) % images.length;
      updateSlidePosition();
    });
    nextBtn.addEventListener("click", () => {
      currentSlide = (currentSlide + 1) % images.length;
      updateSlidePosition();
    });

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    sliderContainer.addEventListener("touchstart", onTouchStart);
    sliderContainer.addEventListener("touchmove", onTouchMove);
    sliderContainer.addEventListener("touchend", onTouchEnd);

    function onTouchStart(e) {
      isDragging = true;
      startX = e.touches[0].clientX;
      sliderContainer.style.transition = "none";
    }
    function onTouchMove(e) {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - startX;
      currentTranslate = prevTranslate + deltaX;
      sliderContainer.style.transform = `translateX(${currentTranslate}px)`;
    }
    function onTouchEnd() {
      isDragging = false;
      const movedBy = currentTranslate - prevTranslate;
      if (movedBy < -50) {
        currentSlide = (currentSlide + 1) % images.length;
      } else if (movedBy > 50) {
        currentSlide = (currentSlide - 1 + images.length) % images.length;
      }
      sliderContainer.style.transition = "transform 0.3s ease-out";
      updateSlidePosition();
    }
    updateSlidePosition();

    // Короткое описание (если нужно – правьте его под свои нужды):
    lowerContainer.innerHTML = `
        <div class="description-section" style="margin-bottom: 20px;">
          <h2>Фотореле EKF PS-5 15А 3300Вт IP66 PROxima</h2>
          <p>
            Фотореле PS-5 применяется для управления освещением или другой нагрузкой.
            Допускается прямое подключение нагрузки с током не более 15А.
          </p>
        </div>
        <div class="description-section" style="margin-bottom: 20px;">
          <h3>Характеристики</h3>
          <div class="table-wrapper" style="overflow-x: auto; border: 1px solid #ccc;">
            <table>
              <tr><td>Статус</td><td>Регулярная</td></tr>
              <tr><td>Макс. ток резистивной нагрузки, А</td><td>15</td></tr>
              <tr><td>Мощность, Вт</td><td>3 300</td></tr>
              <tr><td>Порог, лк</td><td>5...50</td></tr>
              <tr><td>Защита (IP)</td><td>IP66</td></tr>
              <tr><td>Номин. напряжение, В</td><td>230</td></tr>
              <tr><td>Задержка включения, с</td><td>5</td></tr>
              <tr><td>Задержка отключения, с</td><td>540</td></tr>
              <tr><td>Цвет по RAL</td><td>9 010</td></tr>
              <tr><td>Рабочая температура, °C</td><td>-25...40</td></tr>
              <tr><td>Цвет</td><td>Белый</td></tr>
              <tr><td>Гарантия</td><td>7 лет</td></tr>
            </table>
          </div>
        </div>
        <div class="description-section" style="margin-bottom: 20px;">
          <h3>Логистические параметры</h3>
          <div class="table-wrapper" style="overflow-x: auto; border: 1px solid #ccc;">
            <table>
              <tr>
                <th>Параметр</th>
                <th>Индивидуальная</th>
                <th>Групповая</th>
                <th>Транспортная</th>
              </tr>
              <tr>
                <td>Кол-во в упаковке</td>
                <td>1</td>
                <td>1</td>
                <td>100</td>
              </tr>
              <tr>
                <td>Единица хранения</td>
                <td>Штука</td>
                <td>Штука</td>
                <td>Коробка</td>
              </tr>
              <tr>
                <td>Штрих-код</td>
                <td>4690216240947</td>
                <td>4690216240947</td>
                <td>14690216240944</td>
              </tr>
              <tr>
                <td>Вес, кг</td>
                <td>0.1390</td>
                <td>0.1390</td>
                <td>14.2000</td>
              </tr>
              <tr>
                <td>Объем, м³</td>
                <td>0.00090000</td>
                <td>0.00090000</td>
                <td>0.07792300</td>
              </tr>
              <tr>
                <td>Длина, м</td>
                <td>0.0900</td>
                <td>0.0900</td>
                <td>0.4500</td>
              </tr>
              <tr>
                <td>Ширина, м</td>
                <td>0.1190</td>
                <td>0.1190</td>
                <td>0.4630</td>
              </tr>
              <tr>
                <td>Высота, м</td>
                <td>0.0840</td>
                <td>0.0840</td>
                <td>0.3740</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="description-section" style="margin-bottom: 20px;">
          <h3>Комплектация:</h3>
          <ul>
            <li>Фотореле</li>
            <li>Паспорт</li>
            <li>Крепежный уголок</li>
            <li>Крепеж</li>
            <li>Упаковка</li>
          </ul>
        </div>
        <div style="height: 100px;"></div>
        `;
    root.appendChild(overlay);
  }

  // 5. Вспомогательные функции для работы с карточками
  // Функция для установки нескольких стилей одновременно
  function setStyles(element, styles) {
    for (let property in styles) {
      element.style[property] = styles[property];
    }
  }

  // Функция масштабирования значений относительно базовой ширины карточки
  // Увеличивающий коэффициент для шрифтов (1.3 = на 30% больше)
  const fontScaleFactor = 1.3;
  function scaleValue(baseValue, cardWidth, isFont = false) {
    const baseWidth = 200;
    const scaleFactor = cardWidth / baseWidth;
    // Для шрифтов применяем дополнительный коэффициент увеличения
    return baseValue * scaleFactor * (isFont ? fontScaleFactor : 1);
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

  // Функция для определения бренда товара
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

  // Загрузка изображений по артикулу
  async function loadImages(article, maxImages = 5) {
    if (window.imageCache && window.imageCache[article]) {
      return window.imageCache[article];
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

    window.imageCache = window.imageCache || {};
    window.imageCache[article] = validImages;
    return validImages;
  }

  // 6. Функция для создания карточки товара
  const createCard = async (item) => {
    // Расчет стилей для карточки
    const cardWidth = (window.innerWidth - 24) / 2; // 2 карточки в ряд с учетом отступов
    const cardHeight = cardWidth * 1.75; // Соотношение сторон как в initCardView
    // Функция масштабирования с учётом типа значения (шрифт или нет)
    const s = (val, isFont = false) => scaleValue(val, cardWidth, isFont);

    // Определение бренда
    const brandInfo = getBrandInfo(item["Наименование"]);

    // Создаем корневой элемент карточки
    const card = document.createElement("div");
    card.classList.add("product-card-new");
    setStyles(card, {
      backgroundColor: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      position: "relative",
      cursor: "pointer",
      width: "100%",
      height: cardHeight + "px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
    });

    // Эффект при наведении
    card.addEventListener("mouseover", () => {
      card.style.transform = "scale(1.01)";
    });
    card.addEventListener("mouseout", () => {
      card.style.transform = "scale(1)";
    });

    // Загружаем изображения заранее для использования в слайдере
    const loadedImages = await loadImages(item["Код"], 5);

    // Верхняя часть – изображения (примерно 40% высоты карточки)
    const imageDivHeight = cardHeight * 0.45;
    const imageDiv = document.createElement("div");
    setStyles(imageDiv, {
      position: "relative",
      width: "100%",
      height: imageDivHeight + "px",
      overflow: "hidden",
      marginTop: "0", // Уменьшаем отступ сверху
      padding: "0",
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
      zIndex: "1",
      transition: "opacity 0.3s ease",
      opacity: "0",
      pointerEvents: "none",
    });
    imageDiv.appendChild(indicatorsContainer);

    // Загрузка изображений
    try {
      if (loadedImages.length > 0) {
        loadedImages.forEach((src, idx) => {
          const img = document.createElement("img");
          img.src = src;
          img.loading = "lazy";
          img.classList.add("product-image");
          setStyles(img, {
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%", // Ширина на всю карточку
            height: "auto", // Автоматическая высота
            transform: "translate(-50%, -50%)",
            objectFit: "cover", // Заполнение всей области
            display: idx === 0 ? "block" : "none",
            borderRadius: "4px", // Скругленные углы
          });
          imagesContainer.appendChild(img);
        });

        // Создаем индикаторы для изображений
        loadedImages.forEach((_, idx) => {
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

        // Если загружено более одной фотографии, индикаторы всегда видны
        if (loadedImages.length > 1) {
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

        // Функция обновления активного изображения
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

        // Клик по индикаторам
        indicatorsContainer.addEventListener("click", (e) => {
          e.stopPropagation(); // Предотвращаем всплытие события
          const allInds = Array.from(
            indicatorsContainer.querySelectorAll("div")
          );
          const idx = allInds.indexOf(e.target);
          if (idx >= 0) updateImage(idx);
        });

        // Обработчик движения мыши для переключения изображений
        imagesContainer.addEventListener("mousemove", (e) => {
          const rect = imagesContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const seg = rect.width / loadedImages.length;
          const idx = Math.max(
            0,
            Math.min(Math.floor(x / seg), loadedImages.length - 1)
          );
          updateImage(idx);
        });

        // Обработчик для сенсорных экранов
        let touchStartX = null;
        imagesContainer.addEventListener("touchstart", (ev) => {
          touchStartX = ev.touches[0].clientX;
        });
        imagesContainer.addEventListener("touchmove", (ev) => {
          if (touchStartX === null) return;
          const rect = imagesContainer.getBoundingClientRect();
          const touchX = ev.touches[0].clientX - rect.left;
          const seg = rect.width / loadedImages.length;
          const idx = Math.max(
            0,
            Math.min(Math.floor(touchX / seg), loadedImages.length - 1)
          );
          updateImage(idx);
        });
        imagesContainer.addEventListener("touchend", () => {
          touchStartX = null;
        });

        // Добавляем обработчик клика для открытия полноэкранного слайдера
        imagesContainer.addEventListener("click", (e) => {
          e.stopPropagation();
          showFullScreenSlider(loadedImages, item["Код"]);
        });
      }
    } catch (error) {
      console.error(
        `Ошибка при загрузке изображений для артикула ${item["Код"]}: ${error}`
      );
      imagesContainer.innerHTML = "<p>Ошибка загрузки изображений.</p>";
    }

    // Нижняя часть – информационный блок
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

    // Название товара
    const titleElem = document.createElement("h3");
    titleElem.textContent = item["Наименование"];
    titleElem.setAttribute(
      "data-tooltip",
      `Перейти к подробному описанию: ${item["Наименование"]}`
    );
    setStyles(titleElem, {
      fontSize: s(10, true) + "px", // Уменьшенный шрифт
      fontWeight: "600",
      color: "#333",
      margin: `0 0 ${s(4)}px 0`,
      lineHeight: "1.3",
      height: s(50) + "px", // Уменьшаем высоту
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: "2",
      whiteSpace: "normal",
    });

    // Код товара с логотипом бренда справа
    const codeBrandDiv = document.createElement("div");
    setStyles(codeBrandDiv, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: s(4) + "px",
    });

    const codeP = document.createElement("p");
    codeP.innerHTML = `Код: <span>${item["Код"]}</span>`;
    codeP.setAttribute("data-tooltip", `Код товара: ${item["Код"]}`);
    setStyles(codeP, {
      fontSize: s(12, true) + "px",
      color: "#666",
      margin: "0",
    });
    const codeSpan = codeP.querySelector("span");
    if (codeSpan) {
      setStyles(codeSpan, {
        color: "#333",
        fontWeight: "500",
      });
    }

    const brandImg = document.createElement("img");
    brandImg.src = brandInfo.logo;
    brandImg.alt = brandInfo.name;
    setStyles(brandImg, {
      width: s(24) + "px",
      height: "auto",
      borderRadius: s(4) + "px",
      transition: "transform 0.3s ease",
      cursor: "pointer",
    });

    brandImg.addEventListener("mouseover", () => {
      brandImg.style.transform = "scale(1.1)";
    });
    brandImg.addEventListener("mouseout", () => {
      brandImg.style.transform = "scale(1)";
    });

    codeBrandDiv.appendChild(codeP);
    codeBrandDiv.appendChild(brandImg);

    // Цены
    const priceDiv = document.createElement("div");
    setStyles(priceDiv, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: s(8) + "px", // Увеличиваем отступ снизу после удаления блока наличия
      marginTop: s(4) + "px",
    });

    const currentPriceDiv = document.createElement("div");
    currentPriceDiv.innerHTML = `<span>Ваша цена</span><strong>${item["Цена"]} ₽</strong>`;
    currentPriceDiv.setAttribute(
      "data-tooltip",
      `Цена для вас: ${item["Цена"]} ₽`
    );
    setStyles(currentPriceDiv, {
      fontSize: s(11, true) + "px",
    });

    const currentPriceLabel = currentPriceDiv.querySelector("span");
    if (currentPriceLabel) {
      setStyles(currentPriceLabel, {
        color: "#999",
        display: "block",
      });
    }

    const currentPriceValue = currentPriceDiv.querySelector("strong");
    if (currentPriceValue) {
      setStyles(currentPriceValue, {
        display: "block",
        color: "#333",
        fontSize: s(14, true) + "px", // Уменьшенный шрифт для цены
        fontWeight: "700",
        marginTop: s(2) + "px",
      });
    }

    // Розничная цена (вычисляем как 130% от обычной)
    const retailPrice = (parseFloat(item["Цена"]) * 1.3).toFixed(2);
    const retailPriceDiv = document.createElement("div");
    retailPriceDiv.innerHTML = `<span>Розн. цена</span><strong>${retailPrice} ₽</strong>`;
    retailPriceDiv.setAttribute(
      "data-tooltip",
      `Розничная цена: ${retailPrice} ₽`
    );
    setStyles(retailPriceDiv, {
      fontSize: s(11, true) + "px",
    });

    const retailPriceLabel = retailPriceDiv.querySelector("span");
    if (retailPriceLabel) {
      setStyles(retailPriceLabel, {
        color: "#999",
        display: "block",
      });
    }

    const retailPriceValue = retailPriceDiv.querySelector("strong");
    if (retailPriceValue) {
      setStyles(retailPriceValue, {
        display: "block",
        color: "#bbb",
        fontSize: s(12, true) + "px",
        fontWeight: "500",
        textDecoration: "line-through",
        marginTop: s(2) + "px",
      });
    }

    priceDiv.appendChild(currentPriceDiv);
    priceDiv.appendChild(retailPriceDiv);

    // Блок с количеством и кнопкой "В корзину" - переработан
    const actionsDiv = document.createElement("div");
    setStyles(actionsDiv, {
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: s(4) + "px",
      marginTop: "auto", // Сдвигаем блок в самый низ карточки
      marginBottom: s(4) + "px",
    });

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.value = ""; // Пустое значение вместо 0
    quantityInput.placeholder = "Кол-во."; // Плейсхолдер
    quantityInput.min = item["Мин. Кол."] || 1;
    quantityInput.step = item["Мин. Кол."] || 1;
    quantityInput.classList.add("product-quantity");
    quantityInput.setAttribute(
      "data-tooltip",
      `Введите количество (Мин: ${item["Мин. Кол."] || 1})`
    );

    setStyles(quantityInput, {
      width: `calc(100% - ${s(65) + s(4)}px)`,
      height: "36px",
      padding: "0 8px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: s(14, true) + "px",
      textAlign: "center",
      color: "#333",
      boxSizing: "border-box",
    });

    const addToCartButton = document.createElement("button");
    // Используем иконку вместо текста
    addToCartButton.innerHTML = '<i class="ri-shopping-cart-line"></i>';
    addToCartButton.classList.add("add-to-cart-button");
    addToCartButton.setAttribute("data-tooltip", "Добавить товар в корзину");

    setStyles(addToCartButton, {
      width: s(65) + "px",
      height: "36px",
      padding: "0",
      backgroundColor: "#fe9c00",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: s(18, true) + "px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
    });

    addToCartButton.addEventListener("mouseover", () => {
      addToCartButton.style.backgroundColor = "#e08c00";
    });
    addToCartButton.addEventListener("mouseout", () => {
      addToCartButton.style.backgroundColor = "#fe9c00";
    });

    actionsDiv.appendChild(quantityInput);
    actionsDiv.appendChild(addToCartButton);

    // Собираем все вместе
    infoDiv.appendChild(titleElem);
    infoDiv.appendChild(codeBrandDiv);
    infoDiv.appendChild(priceDiv);
    infoDiv.appendChild(actionsDiv);
    // Блок наличия удален

    card.appendChild(imageDiv);
    card.appendChild(infoDiv);

    // Обработчик клика по карточке
    card.addEventListener("click", (e) => {
      // Игнорируем клик, если нажаты кнопки или поля ввода
      if (
        e.target.closest(".add-to-cart-button") ||
        e.target.closest(".product-quantity") ||
        e.target.tagName === "IMG" ||
        e.target.closest("img")
      ) {
        return;
      }
      console.log(`Открываем товар с кодом: ${item["Код"]}`);
    });

    // Обработчик кнопки "В корзину"
    addToCartButton.addEventListener("click", () => {
      const quantity = parseInt(quantityInput.value, 10) || 0;
      if (quantity > 0) {
        // Меняем иконку на галочку при добавлении в корзину
        addToCartButton.innerHTML = '<i class="ri-check-line"></i>';
        setStyles(addToCartButton, { backgroundColor: "#ff9218" });
        console.log(
          `Добавлен товар (код ${item["Код"]}), количество: ${quantity}`
        );
      } else {
        alert("Укажите количество товара перед добавлением в корзину.");
      }
    });

    // Обработчик для поля количества
    quantityInput.addEventListener("blur", function () {
      if (this.value === "0") this.value = "";
    });

    return card;
  };

  // 7. Функция обработки и отображения товаров
  const processProductCards = async () => {
    const productContainer = root.querySelector("#productContainer");
    if (!productContainer) {
      console.warn("Product container not found");
      return;
    }

    // Всегда переключаем вид на карточки в мобильной версии
    const targetElement = root.querySelector("#toggleViewButton");
    if (
      targetElement &&
      window.getComputedStyle(targetElement).display !== "none"
    ) {
      const toggleButtonImage = targetElement.querySelector(
        ".toggle-button-image"
      );
      if (toggleButtonImage && toggleButtonImage.src.includes("/table.svg")) {
        // Если текущий вид - таблица, переключаем на карточки
        targetElement.click();
      }
    }

    // Очищаем контейнер
    productContainer.innerHTML = "";

    try {
      // Загружаем данные из JSON
      const response = await fetch("/data/data.json");
      if (!response.ok) {
        throw new Error(`Ошибка загрузки данных: ${response.statusText}`);
      }

      const data = await response.json();

      // Создаем фрагмент для всех карточек
      const fragment = document.createDocumentFragment();

      // Обрабатываем первые 10 элементов
      const itemsToShow = data.slice(0, 10);

      // Создаем карточки
      for (const item of itemsToShow) {
        const card = await createCard(item);
        fragment.appendChild(card);
      }

      // Добавляем все карточки в контейнер
      productContainer.appendChild(fragment);
    } catch (error) {
      console.error("Ошибка при загрузке или обработке данных:", error);
      productContainer.innerHTML = "<p>Не удалось загрузить товары.</p>";
    }
  };

  // 8. Функция для улучшения пагинации
  const enhancePagination = () => {
    const paginationContainers = root.querySelectorAll(".pagination-container");
    if (paginationContainers.length === 0) return;

    paginationContainers.forEach((container) => {
      // Ограничиваем видимые страницы
      const pagination = container.querySelector(".pagination");
      if (!pagination) return;

      // Находим все ссылки и спаны
      const items = pagination.querySelectorAll("a, span");

      // Скрываем лишние страницы
      let visibleItems = 0;
      items.forEach((item) => {
        // Всегда показываем первую и последнюю страницу и многоточие
        const isFirstPage = visibleItems === 0;
        const isSpecial =
          item.textContent.includes("...") || item.classList.contains("go-to");

        // Скрываем лишние ссылки, оставляя только первые 3-4
        if (!isFirstPage && !isSpecial && visibleItems >= 3) {
          // Последний элемент не скрываем
          if (item !== items[items.length - 1]) {
            item.style.display = "none";
          }
        }

        visibleItems++;
      });

      // Скрываем кнопку "перейти на" в мобильном виде
      const goToBtn = pagination.querySelector(".go-to");
      if (goToBtn) {
        goToBtn.style.display = "none";
      }
    });
  };

  // 9. Функция для настройки жестов свайпа
  const setupSwipeGestures = () => {
    let startX, startY;

    // Находим элементы, для которых нужен свайп
    const filtersPanel = root.querySelector(".filters-panel");
    const filtersOverlay = root.querySelector(".filters-overlay");
    const swipeArea = root.querySelector(".swipe-area");

    if (!filtersPanel || !filtersOverlay) return;

    // Обработчик начала касания
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    // Обработчик окончания касания
    const handleTouchEnd = (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = endX - startX;
      const diffY = endY - startY;

      // Если горизонтальное движение больше вертикального
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        // Свайп вправо - открыть фильтры
        if (diffX > 50 && !filtersPanel.classList.contains("active")) {
          filtersPanel.classList.add("active");
          filtersOverlay.classList.add("active");
        }
        // Свайп влево - закрыть фильтры
        else if (diffX < -50 && filtersPanel.classList.contains("active")) {
          filtersPanel.classList.remove("active");
          filtersOverlay.classList.remove("active");
        }
      }

      startX = null;
      startY = null;
    };

    // Добавляем обработчики для свайпа в области у левого края
    if (swipeArea) {
      swipeArea.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      swipeArea.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    // Добавляем обработчики для свайпа в панели фильтров
    filtersPanel.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    filtersPanel.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });
  };

  // 10. Функция для адаптации поиска и меню категорий
  const enhanceSearchMenu = () => {
    const searchMenu = root.querySelector(".search-menu");
    if (!searchMenu) return;

    // Упрощаем хлебные крошки
    const title = searchMenu.querySelector(".search-menu-title");
    if (title) {
      // Находим все ссылки в хлебных крошках
      const links = title.querySelectorAll(".catalog-link");

      // Если есть несколько ссылок, оставляем только последнюю
      if (links.length > 1) {
        for (let i = 0; i < links.length - 1; i++) {
          links[i].style.display = "none";
        }

        // Скрываем разделители
        const separators = Array.from(title.childNodes).filter(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent.includes("›")
        );

        separators.forEach((sep) => {
          sep.textContent = "";
        });
      }
    }
  };

  // 11. Инициализация мобильного вида
  const initMobileView = () => {
    console.log("Initializing mobile view in shadow DOM");

    // Инжектируем стили
    injectStyles();

    // Создаем мобильные элементы
    createMobileElements();

    // Обрабатываем товары
    processProductCards();

    // Улучшаем пагинацию
    enhancePagination();

    // Настраиваем жесты свайпа
    setupSwipeGestures();

    // Адаптируем поиск и меню
    enhanceSearchMenu();

    console.log("Mobile view initialized successfully");
  };

  // Запускаем инициализацию
  initMobileView();

  // Возвращаем API для взаимодействия
  return {
    // Метод для ручного обновления содержимого
    refresh: () => {
      processProductCards();
      enhancePagination();
    },

    // Метод для открытия/закрытия фильтров
    toggleFilters: () => {
      const filtersPanel = root.querySelector(".filters-panel");
      const filtersOverlay = root.querySelector(".filters-overlay");

      if (filtersPanel && filtersOverlay) {
        if (filtersPanel.classList.contains("active")) {
          filtersPanel.classList.remove("active");
          filtersOverlay.classList.remove("active");
        } else {
          filtersPanel.classList.add("active");
          filtersOverlay.classList.add("active");
        }
      }
    },
  };
};

// Не добавляем автоматическую инициализацию, так как скрипт должен запускаться
// только внутри shadow DOM каждой вкладки через TabManager
