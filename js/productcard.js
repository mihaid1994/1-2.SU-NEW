// Утилита для ожидания загрузки всех изображений в указанном элементе
function waitForImagesInElement(element) {
  if (!element) return Promise.resolve();
  const images = element.querySelectorAll("img");
  const promises = Array.from(images).map(
    (img) =>
      new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      })
  );
  return Promise.all(promises);
}

// Определяем, является ли устройство мобильным (граница 800px)
function isMobileDevice() {
  return window.innerWidth <= 800;
}

// Основная функция инициализации карточки товара
window.initProductcardTest = async function (shadowRoot) {
  console.log("initProductcardTest вызвана с shadowRoot:", shadowRoot);

  // Защитная проверка на существование shadowRoot
  if (!shadowRoot) {
    console.error("shadowRoot не определён в initProductcardTest");
    return;
  }

  try {
    // Добавляем стили с поддержкой адаптивности
    addStyles(shadowRoot);

    // Инициализация UI компонентов
    setupUIComponents(shadowRoot);

    // Инициализация вкладок
    setupTabs(shadowRoot);

    // Инициализация панели количества товара
    setupQuantityControl(shadowRoot);

    // Инициализация просмотра изображений и оверлея
    setupImagesAndOverlay(shadowRoot);

    // Инициализация копирования кода
    setupCodeCopy(shadowRoot);

    // Инициализация быстрых переходов
    setupQuickLinks(shadowRoot);

    // Инициализация каруселей
    await initializeCarousels(shadowRoot);

    // Инициализация аналогов товара
    setupAnalogs(shadowRoot);

    // Инициализация уведомлений
    setupNotifications(shadowRoot);

    // Инициализация адаптивного поведения
    setupResponsiveBehavior(shadowRoot);

    // Скрываем оверлей изображений на мобильных устройствах
    if (isMobileDevice()) {
      const overlay = shadowRoot.getElementById("ImageOverlay");
      if (overlay) {
        overlay.style.display = "none";
        overlay.style.visibility = "hidden";
      }
    }
  } catch (error) {
    console.error("Ошибка при инициализации карточки товара:", error);
  }
};

// Добавление стилей для карточки товара
function addStyles(shadowRoot) {
  const style = document.createElement("style");
  style.textContent = `
    :host(:focus) {
      outline: none;
    }
    .TabPanel {
      scroll-margin-top: 100px;
    }
    .carousel-container {
      position: relative;
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    .carousel-track {
      display: flex;
      transition: transform 0.5s ease;
    }
    .MiniHorizontalTiles > .SaleTileItem {
      flex: 0 0 auto;
    }
    .prev-button {
      left: 10px;
    }
    .next-button {
      right: 10px;
    }
    .MiniHorizontalTiles::-webkit-scrollbar {
      display: none;
    }
    .MiniHorizontalTiles {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .MiniHorizontalTiles > .SaleTileItem {
      flex: 0 0 auto;
    }
    .TabsContainer {
      transition: height 0.3s ease;
      height: auto;
    }

    /* Галерея изображений с поддержкой свайпа для мобильных устройств */
    .ProductImageBig {
      position: relative;
      overflow: hidden;
      width: 100%;
    }
    
    .ImageGalleryContainer {
      display: flex;
      transition: transform 0.3s ease;
      width: 100%;
    }
    
    .ImageGallerySlide {
      flex: 0 0 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .ImageCounter {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 14px;
      z-index: 5;
      display: none;
    }
    
    /* Явно определяем стили для скрытого и видимого оверлея */
    .OverlayHidden {
      display: none !important;
    }
    
    .OverlayVisible {
      display: block !important;
    }

    /* Стили для активной миниатюры */
    .ThumbSlide.active .ThumbLink {
      border: 2px solid #ff6b00;
      border-radius: 4px;
    }

    /* Стили для фиксированной кнопки покупки */
    .StickyBuyBar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      background: white;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      display: none;
    }
    .StickyBuyBar.visible {
      transform: translateY(0);
    }
    .StickyBuyBar .PriceValue {
      font-size: 1.2rem;
    }
    .StickyBuyBar .BuyButton {
      width: auto;
    }

    /* Стили для раскрывающегося блока характеристик */
    .ShortPropsBlock {
      position: relative;
    }
    .ShortPropsBlock.expanded {
      max-height: none !important;
    }
    
    /* Медиа-запросы для мобильных устройств */
    @media (max-width: 800px) {
      .ShortPropsBlock {
        max-height: 300px;
        overflow: hidden;
        width: 100%;
      }
      .ShortPropsBlock:not(.expanded)::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 50px;
        background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1));
      }
      
      .StickyBuyBar {
        display: flex;
      }
      
      .ImageCounter {
        display: block;
      }
      
      /* Полностью скрываем все элементы оверлея на мобильных устройствах */
      #ImageOverlay, 
      #ImageOverlayBg, 
      .MobileOverlayClose, 
      .MobileOverlayThumbs,
      .MobileImageCounter,
      .OverlayThumbs,
      .OverlayNavLeft,
      .OverlayNavRight {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Стили для миниатюр в мобильной версии */
      .ProductThumbs {
        display: flex;
        gap: 5px;
        overflow-x: auto;
        padding-bottom: 5px;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      
      .ProductThumbs::-webkit-scrollbar {
        display: none;
      }
      
      /* Адаптация таблиц */
      .table-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        width: 100%;
      }
    }

    /* Стили для режимов отображения мобильный/десктоп */
    .mobile-view-styles {
      --view-mode: mobile;
    }
    
    .desktop-view-styles {
      --view-mode: desktop;
    }
  `;
  shadowRoot.appendChild(style);
}

// Настройка основных компонентов интерфейса
function setupUIComponents(shadowRoot) {
  // Создаем фиксированную панель покупки для мобильных устройств
  const stickyBuyBar = document.createElement("div");
  stickyBuyBar.classList.add("StickyBuyBar");
  stickyBuyBar.innerHTML = `
    <div class="PriceValue"></div>
    <button class="BuyButton">В корзину</button>
  `;
  shadowRoot.appendChild(stickyBuyBar);

  // Копируем актуальную цену
  const originalPrice = shadowRoot.querySelector(".PriceValue");
  const stickyPrice = stickyBuyBar.querySelector(".PriceValue");
  if (originalPrice && stickyPrice) {
    stickyPrice.textContent = originalPrice.textContent;
  }

  // Обработчик нажатия на фиксированную кнопку
  const stickyBuyButton = stickyBuyBar.querySelector(".BuyButton");
  if (stickyBuyButton) {
    stickyBuyButton.addEventListener("click", () => {
      const originalBuyButton = shadowRoot.querySelector(
        ".ProductOffer .BuyButton"
      );
      if (originalBuyButton) {
        originalBuyButton.click();
      }
    });
  }

  // Оптимизация таблиц для мобильной версии
  const tables = shadowRoot.querySelectorAll("table");
  tables.forEach((table) => {
    if (table.scrollWidth > table.clientWidth) {
      const parent = table.parentNode;
      if (parent && !parent.classList.contains("table-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";
        parent.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    }
  });
}

// Настройка вкладок
function setupTabs(shadowRoot) {
  const tabNavItems = shadowRoot.querySelectorAll(".TabsNav .TabItemNav");
  const tabPanels = shadowRoot.querySelectorAll(".TabsContainer .TabPanel");
  const tabsContainer = shadowRoot.querySelector(".TabsContainer");

  async function updateTabsContainerHeight() {
    const activePanel = shadowRoot.querySelector(".TabPanel.activePanel");
    if (tabsContainer && activePanel) {
      await waitForImagesInElement(activePanel);
      const panelHeight = activePanel.scrollHeight;
      tabsContainer.style.height = `${panelHeight + 55}px`;
    }
  }

  tabNavItems.forEach((tab, index) => {
    tab.addEventListener("click", async () => {
      tabNavItems.forEach((t) => t.classList.remove("activeTab"));
      tabPanels.forEach((p) => p.classList.remove("activePanel"));
      tab.classList.add("activeTab");
      tabPanels[index].classList.add("activePanel");
      await updateTabsContainerHeight();

      // Прокрутка таба к центру на мобильных устройствах
      if (isMobileDevice()) {
        const tabsNav = shadowRoot.querySelector(".TabsNav");
        if (tabsNav) {
          const tabRect = tab.getBoundingClientRect();
          const navRect = tabsNav.getBoundingClientRect();
          const centerOffset = navRect.width / 2 - tabRect.width / 2;
          const scrollTo = tab.offsetLeft - centerOffset;

          tabsNav.scrollTo({
            left: scrollTo,
            behavior: "smooth",
          });
        }
      }
    });
  });

  if (tabNavItems.length > 0) {
    tabNavItems[0].classList.add("activeTab");
    tabPanels[0].classList.add("activePanel");

    // Принудительно активируем первую вкладку после короткой задержки
    setTimeout(async () => {
      tabNavItems[0].classList.remove("activeTab");
      tabPanels[0].classList.remove("activePanel");
      tabNavItems[0].classList.add("activeTab");
      tabPanels[0].classList.add("activePanel");
      await updateTabsContainerHeight();
    }, 50);
  }

  // Наблюдаем за изменениями в панелях для обновления высоты
  const observer = new MutationObserver(async () => {
    await updateTabsContainerHeight();
  });

  tabPanels.forEach((panel) => {
    observer.observe(panel, { childList: true, subtree: true });
  });

  // Адаптируем высоту контейнера вкладок при загрузке
  updateTabsContainerHeight();

  // Сохраняем ссылку на функцию обновления высоты для вызова при изменении размера окна
  shadowRoot.updateTabsHeight = updateTabsContainerHeight;
}

// Настройка элементов управления количеством товара
function setupQuantityControl(shadowRoot) {
  const minusBtns = shadowRoot.querySelectorAll(".NumMinus");
  const plusBtns = shadowRoot.querySelectorAll(".NumPlus");

  minusBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const input = btn.parentNode.querySelector(".NumInput");
      let val = parseInt(input.value, 10) || 1;
      if (val > 1) val--;
      input.value = val;
    });
  });

  plusBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const input = btn.parentNode.querySelector(".NumInput");
      let val = parseInt(input.value, 10) || 1;
      val++;
      input.value = val;
    });
  });
}

// Настройка изображений и оверлея
function setupImagesAndOverlay(shadowRoot) {
  const thumbLinks = shadowRoot.querySelectorAll(".ThumbLink");
  const bigImage = shadowRoot.getElementById("BigImageID");
  const productImageBig = shadowRoot.querySelector(".ProductImageBig");
  const overlay = shadowRoot.getElementById("ImageOverlay");
  const overlayBg = shadowRoot.getElementById("ImageOverlayBg");
  const overlayPic = shadowRoot.getElementById("ImageOverlayPic");
  const overlayThumbsContainer = shadowRoot.querySelector(".OverlayThumbs");
  const navLeft = shadowRoot.querySelector(".OverlayNavLeft");
  const navRight = shadowRoot.querySelector(".OverlayNavRight");

  // Подготовка данных изображений
  const imageSources = [];
  thumbLinks.forEach((link) => {
    const imgSrc = link.getAttribute("data-bigimg");
    imageSources.push(imgSrc);
  });

  let currentImageIndex = 0;

  // Для мобильных устройств создаем галерею со свайпом
  if (isMobileDevice()) {
    setupMobileImageGallery(shadowRoot, imageSources);
  } else {
    // Для десктопной версии настраиваем стандартное поведение с оверлеем
    setupDesktopImageOverlay(shadowRoot, imageSources);
  }

  // Настройка изображений для мобильных устройств
  function setupMobileImageGallery(shadowRoot, imageSources) {
    if (!productImageBig || !bigImage || imageSources.length === 0) return;

    // Удаляем существующее большое изображение
    if (bigImage.parentNode) {
      bigImage.remove();
    }

    // Создаем контейнер для галереи
    const galleryContainer = document.createElement("div");
    galleryContainer.classList.add("ImageGalleryContainer");

    // Создаем слайды для всех изображений
    imageSources.forEach((src) => {
      const slide = document.createElement("div");
      slide.classList.add("ImageGallerySlide");

      const img = document.createElement("img");
      img.src = src;
      img.alt = "Изображение товара";
      img.style.maxWidth = "100%";

      slide.appendChild(img);
      galleryContainer.appendChild(slide);
    });

    // Создаем счетчик изображений
    const imageCounter = document.createElement("div");
    imageCounter.classList.add("ImageCounter");
    imageCounter.textContent = `1 / ${imageSources.length}`;

    // Добавляем элементы в DOM
    productImageBig.appendChild(galleryContainer);
    productImageBig.appendChild(imageCounter);

    // Настраиваем свайп
    let touchStartX = 0;
    let touchEndX = 0;

    function handleTouchStart(e) {
      touchStartX = e.changedTouches[0].screenX;
    }

    function handleTouchEnd(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchEndX - touchStartX;

      if (diff > swipeThreshold && currentImageIndex > 0) {
        // Свайп вправо - предыдущее изображение
        currentImageIndex--;
        updateGallery();
      } else if (
        diff < -swipeThreshold &&
        currentImageIndex < imageSources.length - 1
      ) {
        // Свайп влево - следующее изображение
        currentImageIndex++;
        updateGallery();
      }
    }

    function updateGallery() {
      // Обновляем позицию галереи
      galleryContainer.style.transform = `translateX(-${
        currentImageIndex * 100
      }%)`;

      // Обновляем счетчик
      imageCounter.textContent = `${currentImageIndex + 1} / ${
        imageSources.length
      }`;

      // Обновляем активную миниатюру
      const thumbSlides = shadowRoot.querySelectorAll(".ThumbSlide");
      thumbSlides.forEach((slide, index) => {
        if (index === currentImageIndex) {
          slide.classList.add("active");

          // Прокручиваем контейнер миниатюр к активной
          const thumbsContainer = shadowRoot.querySelector(".ProductThumbs");
          if (thumbsContainer) {
            const slideRect = slide.getBoundingClientRect();
            const containerRect = thumbsContainer.getBoundingClientRect();

            if (
              slideRect.left < containerRect.left ||
              slideRect.right > containerRect.right
            ) {
              const scrollLeft =
                slide.offsetLeft -
                thumbsContainer.offsetWidth / 2 +
                slide.offsetWidth / 2;
              thumbsContainer.scrollTo({
                left: scrollLeft,
                behavior: "smooth",
              });
            }
          }
        } else {
          slide.classList.remove("active");
        }
      });
    }

    // Инициализация обработчиков событий
    productImageBig.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    productImageBig.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    // Инициализация клика на миниатюры
    const thumbSlides = shadowRoot.querySelectorAll(".ThumbSlide");
    thumbSlides.forEach((slide, index) => {
      slide.addEventListener("click", (e) => {
        e.preventDefault(); // Предотвращаем стандартное поведение
        currentImageIndex = index;
        updateGallery();
      });

      // Помечаем первую миниатюру как активную
      if (index === 0) {
        slide.classList.add("active");
      }
    });
  }

  // Настройка изображений для десктопных устройств
  function setupDesktopImageOverlay(shadowRoot, imageSources) {
    // Добавляем обработчики для миниатюр
    thumbLinks.forEach((link, index) => {
      link.addEventListener("mouseover", () => {
        const newSrc = link.getAttribute("data-bigimg");
        if (bigImage && newSrc) {
          bigImage.src = newSrc;
        }
      });

      link.addEventListener("click", (e) => {
        e.preventDefault();

        // На десктопе просто меняем изображение без открытия оверлея
        if (!isMobileDevice()) {
          const newSrc = link.getAttribute("data-bigimg");
          if (bigImage && newSrc) {
            bigImage.src = newSrc;
            currentImageIndex = index;
          }
        }
      });
    });

    // Добавляем обработчик для большого изображения
    if (bigImage) {
      bigImage.addEventListener("click", (e) => {
        // Предотвращаем открытие на мобильных устройствах
        if (isMobileDevice()) {
          e.preventDefault();
          return;
        }

        currentImageIndex = imageSources.indexOf(bigImage.src);
        if (currentImageIndex < 0) currentImageIndex = 0;
        openOverlay(imageSources[currentImageIndex]);
      });
    }

    // Функции для навигации по изображениям
    function switchToPreviousImage() {
      currentImageIndex--;
      if (currentImageIndex < 0) currentImageIndex = imageSources.length - 1;
      if (overlayPic) {
        overlayPic.src = imageSources[currentImageIndex];
      }
      highlightSelectedThumb();
      updateMobileImageCounter();
    }

    function switchToNextImage() {
      currentImageIndex++;
      if (currentImageIndex >= imageSources.length) currentImageIndex = 0;
      if (overlayPic) {
        overlayPic.src = imageSources[currentImageIndex];
      }
      highlightSelectedThumb();
      updateMobileImageCounter();
    }

    // Функция открытия оверлея
    function openOverlay(src) {
      if (!overlayPic || !overlay) return;

      // Не открываем оверлей на мобильных устройствах
      if (isMobileDevice()) return;

      overlayPic.src = src;
      overlay.classList.remove("OverlayHidden");
      overlay.classList.add("OverlayVisible");

      populateOverlayThumbs();
      updateMobileImageCounter();
      highlightSelectedThumb();

      const host = shadowRoot.host;
      if (host) {
        host.setAttribute("tabindex", "-1");
        host.focus();
      }
    }

    // Функция закрытия оверлея
    function closeOverlay() {
      if (!overlay) return;

      overlay.classList.remove("OverlayVisible");
      overlay.classList.add("OverlayHidden");

      if (overlayPic) overlayPic.src = "";
      removeOverlayThumbsHighlight();

      const host = shadowRoot.host;
      if (host) {
        host.blur();
      }
    }

    // Обработчик нажатия клавиш для оверлея
    function handleKeyDown(e) {
      if (!overlay || !overlay.classList.contains("OverlayVisible")) return;

      if (e.key === "Escape") {
        closeOverlay();
      } else if (e.key === "ArrowLeft") {
        switchToPreviousImage();
      } else if (e.key === "ArrowRight") {
        switchToNextImage();
      }
    }

    // Добавляем обработчик клавиш при инициализации
    let keyDownListener = null;

    // Удаляем предыдущий обработчик если он существует
    if (shadowRoot.keyDownListener) {
      document.removeEventListener("keydown", shadowRoot.keyDownListener);
    }

    // Создаем и сохраняем новый обработчик
    keyDownListener = handleKeyDown;
    document.addEventListener("keydown", keyDownListener);
    shadowRoot.keyDownListener = keyDownListener;

    // Настройка навигационных кнопок оверлея
    if (navLeft) {
      navLeft.addEventListener("click", (e) => {
        e.stopPropagation();
        switchToPreviousImage();
      });
    }

    if (navRight) {
      navRight.addEventListener("click", (e) => {
        e.stopPropagation();
        switchToNextImage();
      });
    }

    // Закрытие оверлея по клику на фон
    if (overlayBg) {
      overlayBg.addEventListener("click", closeOverlay);
    }

    // Добавляем кнопку закрытия для мобильной версии (хотя она не будет видима)
    if (overlay) {
      const mobileClose = document.createElement("div");
      mobileClose.classList.add("MobileOverlayClose");
      mobileClose.addEventListener("click", closeOverlay);
      overlay.appendChild(mobileClose);
    }

    // Заполнение миниатюр для оверлея
    function populateOverlayThumbs() {
      if (!overlayThumbsContainer) return;

      overlayThumbsContainer.innerHTML = "";

      imageSources.forEach((src, index) => {
        const thumbDiv = document.createElement("div");
        thumbDiv.classList.add("OverlayThumb");

        const img = document.createElement("img");
        img.src = src;
        img.alt = `Изображение ${index + 1}`;

        img.addEventListener("click", () => {
          if (overlayPic) {
            overlayPic.src = src;
          }
          currentImageIndex = index;
          highlightSelectedThumb();
        });

        thumbDiv.appendChild(img);
        overlayThumbsContainer.appendChild(thumbDiv);
      });
    }

    // Обновление счетчика изображений для мобильной версии
    function updateMobileImageCounter() {
      const mobileCounter = shadowRoot.querySelector(".MobileImageCounter");
      if (!mobileCounter) return;

      mobileCounter.textContent = `${currentImageIndex + 1} / ${
        imageSources.length
      }`;
    }

    // Подсветка выбранной миниатюры
    function highlightSelectedThumb() {
      if (!overlayThumbsContainer) return;

      const thumbs = overlayThumbsContainer.querySelectorAll(".OverlayThumb");
      thumbs.forEach((thumb, i) => {
        if (i === currentImageIndex) {
          thumb.classList.add("selected");
        } else {
          thumb.classList.remove("selected");
        }
      });
    }

    // Удаление подсветки с миниатюр
    function removeOverlayThumbsHighlight() {
      if (!overlayThumbsContainer) return;

      const thumbs = overlayThumbsContainer.querySelectorAll(".OverlayThumb");
      thumbs.forEach((thumb) => {
        thumb.classList.remove("selected");
      });
    }

    // Сохраняем функции для использования в других частях кода
    shadowRoot.imageControl = {
      openOverlay,
      closeOverlay,
      switchToPreviousImage,
      switchToNextImage,
    };
  }
}

// Настройка копирования кода
function setupCodeCopy(shadowRoot) {
  const copyElements = shadowRoot.querySelectorAll(".copy-code, .copy-icon");

  copyElements.forEach((elem) => {
    elem.addEventListener("click", (e) => {
      e.stopPropagation();
      const code = elem.getAttribute("data-code");

      if (code) {
        navigator.clipboard
          .writeText(code)
          .then(() => {
            showNotification(shadowRoot, `Скопировано: ${code}`, "success");
          })
          .catch(() => {
            showNotification(shadowRoot, "Ошибка при копировании", "error");
          });
      }
    });
  });
}

// Настройка быстрых переходов
function setupQuickLinks(shadowRoot) {
  // Переход к полному описанию
  const goToFullDescBtn = shadowRoot.querySelector(".GoToFullDesc");
  if (goToFullDescBtn) {
    goToFullDescBtn.addEventListener("click", async (e) => {
      // Для мобильной версии - раскрытие блока характеристик
      if (isMobileDevice()) {
        const shortPropsBlock = shadowRoot.querySelector(".ShortPropsBlock");
        if (shortPropsBlock) {
          e.preventDefault();
          if (shortPropsBlock.classList.contains("expanded")) {
            shortPropsBlock.classList.remove("expanded");
            goToFullDescBtn.textContent = "Показать все характеристики";
          } else {
            shortPropsBlock.classList.add("expanded");
            goToFullDescBtn.textContent = "Свернуть характеристики";
          }
          return;
        }
      }

      // Для десктопной версии - переход к вкладке с описанием
      const tabNavItems = shadowRoot.querySelectorAll(".TabsNav .TabItemNav");
      const tabPanels = shadowRoot.querySelectorAll(".TabsContainer .TabPanel");

      if (tabNavItems.length > 0) {
        tabNavItems.forEach((t) => t.classList.remove("activeTab"));
        tabPanels.forEach((p) => p.classList.remove("activePanel"));
        tabNavItems[0].classList.add("activeTab");
        tabPanels[0].classList.add("activePanel");

        if (shadowRoot.updateTabsHeight) {
          await shadowRoot.updateTabsHeight();
        }
        scrollToElementWithOffset(tabPanels[0], 50);
      }
    });
  }

  // Переход к доставке
  const delLink = shadowRoot.querySelector(".delivery-link");
  if (delLink) {
    delLink.addEventListener("click", async () => {
      const tabNavItems = shadowRoot.querySelectorAll(".TabsNav .TabItemNav");
      const tabPanels = shadowRoot.querySelectorAll(".TabsContainer .TabPanel");

      if (tabNavItems.length > 1 && tabPanels.length > 1) {
        tabNavItems.forEach((t) => t.classList.remove("activeTab"));
        tabPanels.forEach((p) => p.classList.remove("activePanel"));
        tabNavItems[1].classList.add("activeTab");
        tabPanels[1].classList.add("activePanel");

        if (shadowRoot.updateTabsHeight) {
          await shadowRoot.updateTabsHeight();
        }
        scrollToElementWithOffset(tabPanels[1], 50);
      }
    });
  }

  // Переход к документации
  const docLink = shadowRoot.querySelector(".documentation-link");
  if (docLink) {
    docLink.addEventListener("click", async () => {
      const tabNavItems = shadowRoot.querySelectorAll(".TabsNav .TabItemNav");
      const tabPanels = shadowRoot.querySelectorAll(".TabsContainer .TabPanel");

      if (tabNavItems.length > 2 && tabPanels.length > 2) {
        tabNavItems.forEach((t) => t.classList.remove("activeTab"));
        tabPanels.forEach((p) => p.classList.remove("activePanel"));
        tabNavItems[2].classList.add("activeTab");
        tabPanels[2].classList.add("activePanel");

        if (shadowRoot.updateTabsHeight) {
          await shadowRoot.updateTabsHeight();
        }
        scrollToElementWithOffset(tabPanels[2], 50);
      }
    });
  }

  // Настройка якорных ссылок
  const anchorLinks = shadowRoot.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href").substring(1);
      const targetElement = shadowRoot.getElementById(targetId);

      if (targetElement) {
        e.preventDefault();
        scrollToElementWithOffset(targetElement, 50);
      }
    });
  });

  // Функция плавной прокрутки
  function scrollToElementWithOffset(element, offset = 50) {
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

// Инициализация каруселей
async function initializeCarousels(shadowRoot) {
  try {
    if (!window.fetch) {
      console.error("Fetch API не поддерживается этим браузером.");
      return;
    }

    const response = await fetch("/data/carusel.json");
    if (!response.ok) {
      throw new Error(`Ошибка загрузки данных: ${response.statusText}`);
    }

    const caruselData = await response.json();
    const cache = {
      AlsoLeftWidth: caruselData.AlsoLeftWidth || [],
      RecentViewsBlock: caruselData.RecentViewsBlock || [],
    };

    ["AlsoLeftWidth", "RecentViewsBlock"].forEach((block) => {
      const container = shadowRoot.querySelector(`.${block} .carousel-track`);

      if (container && cache[block].length > 0) {
        // Очищаем контейнер перед добавлением элементов
        container.innerHTML = "";

        // Добавляем карточки товаров
        cache[block].forEach((product) => {
          const card = createProductCard(product);
          container.appendChild(card);
        });

        // Дублируем для "бесконечной" карусели
        cache[block].forEach((product) => {
          const card = createProductCard(product);
          container.appendChild(card);
        });

        // Настраиваем карусель
        setupCarousel(shadowRoot, block, cache[block].length);
      }
    });
  } catch (error) {
    console.error("Ошибка при инициализации каруселей:", error);
  }
}

// Создание карточки для карусели
function createProductCard(product) {
  const card = document.createElement("div");
  card.classList.add("SaleTileItem");

  const topButtons = document.createElement("span");
  topButtons.classList.add("topbuttons");

  const compareIcon = document.createElement("i");
  compareIcon.classList.add("ri-arrow-left-right-fill");

  const bookmarkIcon = document.createElement("i");
  bookmarkIcon.classList.add("ri-bookmark-line");

  topButtons.appendChild(compareIcon);
  topButtons.appendChild(bookmarkIcon);
  card.appendChild(topButtons);

  const imageLink = document.createElement("a");
  imageLink.href = product.link || "#";
  imageLink.classList.add("SaleImageLink");

  const img = document.createElement("img");
  img.src = product.image;
  img.alt = product.name;

  imageLink.appendChild(img);
  card.appendChild(imageLink);

  const name = document.createElement("div");
  name.classList.add("SaleName");
  name.textContent = product.name;
  card.appendChild(name);

  const dataDiv = document.createElement("div");
  dataDiv.classList.add("SaleData");

  const price = document.createElement("div");
  price.classList.add("SalePrice");
  price.textContent = product.price || "";
  dataDiv.appendChild(price);

  const buyButton = document.createElement("button");
  buyButton.classList.add("SaleBuyButton");
  buyButton.textContent = "В корзину";
  dataDiv.appendChild(buyButton);

  card.appendChild(dataDiv);

  return card;
}

// Настройка карусели
function setupCarousel(shadowRoot, block, originalLength) {
  const carouselContainer = shadowRoot.querySelector(
    `.${block} .carousel-container`
  );
  if (!carouselContainer) return;

  const track = carouselContainer.querySelector(".carousel-track");
  const prevButton = carouselContainer.querySelector(".prev-button");
  const nextButton = carouselContainer.querySelector(".next-button");

  if (!track || !prevButton || !nextButton) return;

  const cards = Array.from(track.children);
  let cardWidth = 0;
  let gap = 0;
  let isTransitioning = false;
  let currentIndex = 1;

  // Расчет размеров элементов
  function calculateDimensions() {
    if (cards.length === 0) return;

    const firstCard = cards[0];
    const computedStyle = getComputedStyle(firstCard);
    const marginRight = parseFloat(computedStyle.marginRight) || 0;

    cardWidth = firstCard.getBoundingClientRect().width;
    gap = marginRight;
  }

  // Ожидание загрузки всех изображений
  function waitForImages() {
    const images = track.querySelectorAll("img");

    const promises = Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        })
    );

    return Promise.all(promises);
  }

  // Мгновенное перемещение без анимации
  function jumpWithoutTransition(toIndex) {
    track.style.transition = "none";
    track.style.transform = `translateX(-${toIndex * (cardWidth + gap)}px)`;

    // Форсируем перерисовку перед включением анимации
    requestAnimationFrame(() => {
      track.style.transition = "transform 0.5s ease";
    });
  }

  // Инициализация карусели после загрузки изображений
  waitForImages().then(() => {
    calculateDimensions();
    jumpWithoutTransition(currentIndex);

    // Обработчик кнопки "Вперед"
    nextButton.addEventListener("click", () => {
      if (isTransitioning) return;

      isTransitioning = true;
      currentIndex++;
      track.style.transform = `translateX(-${
        currentIndex * (cardWidth + gap)
      }px)`;
    });

    // Обработчик кнопки "Назад"
    prevButton.addEventListener("click", () => {
      if (isTransitioning) return;

      isTransitioning = true;
      currentIndex--;
      track.style.transform = `translateX(-${
        currentIndex * (cardWidth + gap)
      }px)`;
    });

    // Обработчик завершения анимации
    track.addEventListener("transitionend", () => {
      isTransitioning = false;

      // Бесконечная прокрутка - перепрыгиваем в начало/конец
      if (currentIndex === 0) {
        currentIndex = originalLength;
        jumpWithoutTransition(currentIndex);
      } else if (currentIndex === originalLength + 1) {
        currentIndex = 1;
        jumpWithoutTransition(currentIndex);
      }
    });

    // Пересчет размеров при изменении размера окна
    window.addEventListener("resize", () => {
      const savedIndex = currentIndex;
      calculateDimensions();
      jumpWithoutTransition(savedIndex);
    });
  });

  // Клавиатурная навигация
  carouselContainer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevButton.click();
    if (e.key === "ArrowRight") nextButton.click();
  });

  // Сенсорная поддержка для мобильных
  if (isMobileDevice()) {
    let startX, scrollLeft;
    let isDown = false;

    const touchStartHandler = (e) => {
      isDown = true;
      track.classList.add("active");
      startX = e.touches[0].pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    };

    const touchEndHandler = () => {
      isDown = false;
      track.classList.remove("active");
    };

    const touchMoveHandler = (e) => {
      if (!isDown) return;
      e.preventDefault();

      const x = e.touches[0].pageX - track.offsetLeft;
      const walk = (x - startX) * 2; // Скорость прокрутки

      if (walk > 50) {
        prevButton.click();
        isDown = false;
      } else if (walk < -50) {
        nextButton.click();
        isDown = false;
      }
    };

    track.addEventListener("touchstart", touchStartHandler, { passive: true });
    track.addEventListener("touchend", touchEndHandler, { passive: true });
    track.addEventListener("touchcancel", touchEndHandler, { passive: true });
    track.addEventListener("touchmove", touchMoveHandler, { passive: false });
  }
}

// Настройка аналогов товара
function setupAnalogs(shadowRoot) {
  // Массив аналогов
  const analogData = [
    {
      name: "EKF PS-5 15А 3300Вт IP66 PROxima",
      newPrice: "850 ₽",
      oldPrice: "1270 ₽",
      extra: "Гарантия: 7 лет",
      image:
        "/images/jpg/product/datchik_dvizheniya_era_md_015_e27_60vt_360grad._6m_ip20_501600_belyy_b0043792_2378613_1.jpg",
    },
    {
      name: "TDM DDS-01 10А 220В IP44",
      newPrice: "750 ₽",
      oldPrice: "1100 ₽",
      extra: "Гарантия: 5 лет",
      image:
        "/images/jpg/product/fotorele_ekf_ps_1_fr_6a_1400vt_ip44_fr_ps_1_6_2036945_1.jpg",
    },
    {
      name: "IEK ФР-601 6А 1400Вт IP44",
      newPrice: "650 ₽",
      oldPrice: "900 ₽",
      extra: "Гарантия: 3 года",
      image:
        "/images/jpg/product/tdm_electric_dds_01_1100vt_5_480s_2_12m_5_lk_180gr._ip44_1833317_1.jpg",
    },
    {
      name: "Schneider Electric Acti9 iPRF 16А",
      newPrice: "950 ₽",
      oldPrice: "1300 ₽",
      extra: "Гарантия: 10 лет",
      image:
        "/images/jpg/product/ik_datchik_dvizheniya_nast._1200vt_180gr._do_12m_ip44_ms_16c_ekf_proxima_1576628_1.jpg",
    },
    {
      name: "Legrand 49100 10А IP55",
      newPrice: "820 ₽",
      oldPrice: "1050 ₽",
      extra: "Гарантия: 8 лет",
      image: "/images/jpg/product/125345_222.jpg",
    },
    {
      name: "ABB NightWatcher NW-230",
      newPrice: "890 ₽",
      oldPrice: "1150 ₽",
      extra: "Гарантия: 6 лет",
      image: "/images/jpg/product/345345_222.jpg",
    },
    {
      name: "DEKraft FR-101 10А 220В",
      newPrice: "770 ₽",
      oldPrice: "980 ₽",
      extra: "Гарантия: 4 года",
      image: "/images/jpg/product/1030000.jpg",
    },
    {
      name: "SmartLight SL-PH-12 12А 250В",
      newPrice: "810 ₽",
      oldPrice: "1040 ₽",
      extra: "Гарантия: 5 лет",
      image: "/images/jpg/product/1472250x0.jpg",
    },
    {
      name: "IEK ФР-602 12А 2500Вт IP65",
      newPrice: "920 ₽",
      oldPrice: "1250 ₽",
      extra: "Гарантия: 9 лет",
      image: "/images/jpg/product/34532245_222.jpg",
    },
    {
      name: "Navigator NPF-20 20А 4000Вт IP67",
      newPrice: "980 ₽",
      oldPrice: "1400 ₽",
      extra: "Гарантия: 12 лет",
      image: "/images/jpg/product/376791900.jpg",
    },
  ];

  // Инициализация данных для аналогов в карточках
  const analogItems = shadowRoot.querySelectorAll(".AnalogItem");
  analogItems.forEach((item, index) => {
    item.setAttribute("data-index", index);

    // Добавляем обработчик клика для каждого элемента
    item.addEventListener("click", () => {
      openAnalogModal(shadowRoot, index, analogData);
    });
  });

  // Подготовка модального окна
  setupAnalogModal(shadowRoot, analogData);

  // Обработка кнопки "Показать все"
  const showAllLinks = shadowRoot.querySelectorAll(".ShowAllAnalogs");
  showAllLinks.forEach((showAllLink) => {
    if (showAllLink) {
      showAllLink.addEventListener("click", () => {
        openAllAnalogsModal(shadowRoot, analogData);
      });
    }
  });
}

// Настройка модального окна аналогов
function setupAnalogModal(shadowRoot, analogData) {
  const modalOverlay = shadowRoot.querySelector("#analogModalOverlay");
  const modalContent = shadowRoot.querySelector("#analogModalContent");
  const modalClose = shadowRoot.querySelector("#analogModalClose");

  // Если модального окна нет, создаем его
  if (!modalOverlay) {
    const overlay = document.createElement("div");
    overlay.id = "analogModalOverlay";
    overlay.style.display = "none";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.zIndex = "999";

    const content = document.createElement("div");
    content.id = "analogModalContent";
    content.style.position = "relative";
    content.style.backgroundColor = "white";
    content.style.margin = "10% auto";
    content.style.padding = "20px";
    content.style.width = "80%";
    content.style.maxWidth = "600px";
    content.style.borderRadius = "5px";

    const closeBtn = document.createElement("span");
    closeBtn.id = "analogModalClose";
    closeBtn.textContent = "×";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "10px";
    closeBtn.style.right = "10px";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.cursor = "pointer";

    const productName = document.createElement("h3");
    productName.id = "modalProductName";

    const newPrice = document.createElement("div");
    newPrice.id = "modalNewPrice";
    newPrice.style.fontWeight = "bold";

    const oldPrice = document.createElement("div");
    oldPrice.id = "modalOldPrice";
    oldPrice.style.textDecoration = "line-through";
    oldPrice.style.color = "#999";

    const extraInfo = document.createElement("div");
    extraInfo.id = "modalExtraInfo";

    content.appendChild(closeBtn);
    content.appendChild(productName);
    content.appendChild(newPrice);
    content.appendChild(oldPrice);
    content.appendChild(extraInfo);

    overlay.appendChild(content);
    shadowRoot.appendChild(overlay);

    closeBtn.addEventListener("click", () => {
      overlay.style.display = "none";
      content.classList.remove("AnalogModalContentAll");
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.style.display = "none";
        content.classList.remove("AnalogModalContentAll");
      }
    });
  }
}

// Открытие модального окна для одного аналога
function openAnalogModal(shadowRoot, index, analogData) {
  const modalOverlay = shadowRoot.querySelector("#analogModalOverlay");
  const modalContent = shadowRoot.querySelector("#analogModalContent");
  const modalProductName = shadowRoot.querySelector("#modalProductName");
  const modalNewPrice = shadowRoot.querySelector("#modalNewPrice");
  const modalOldPrice = shadowRoot.querySelector("#modalOldPrice");
  const modalExtraInfo = shadowRoot.querySelector("#modalExtraInfo");

  if (!modalOverlay || !modalContent) return;

  // Сбрасываем класс "широкого" окна
  modalContent.classList.remove("AnalogModalContentAll");

  // Заполняем данными
  const data = analogData[index];
  modalProductName.textContent = data.name;
  modalNewPrice.textContent = data.newPrice;
  modalOldPrice.textContent = data.oldPrice;
  modalExtraInfo.textContent = data.extra;

  // Отображаем модальное окно
  modalOverlay.style.display = "block";
}

// Открытие модального окна для всех аналогов
function openAllAnalogsModal(shadowRoot, analogData) {
  const modalOverlay = shadowRoot.querySelector("#analogModalOverlay");
  const modalContent = shadowRoot.querySelector("#analogModalContent");

  if (!modalOverlay || !modalContent) return;

  // Очищаем содержимое
  modalContent.innerHTML = "";

  // Добавляем класс для "широкого" окна
  modalContent.classList.add("AnalogModalContentAll");

  // Кнопка закрытия
  const closeBtn = document.createElement("span");
  closeBtn.classList.add("AnalogModalClose");
  closeBtn.textContent = "×";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "10px";
  closeBtn.style.fontSize = "24px";
  closeBtn.style.cursor = "pointer";

  closeBtn.addEventListener("click", () => {
    modalOverlay.style.display = "none";
    modalContent.classList.remove("AnalogModalContentAll");
  });

  modalContent.appendChild(closeBtn);

  // Заголовок
  const heading = document.createElement("h3");
  heading.textContent =
    "Аналоги для Фотореле EKF PS-5 15А 3300Вт IP66 PROxima, fr-ps-5-15";
  modalContent.appendChild(heading);

  // Создаем таблицу
  const table = document.createElement("table");
  table.style.width = "100%";

  // Заголовки таблицы
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  `;
  table.appendChild(thead);

  // Тело таблицы
  const tbody = document.createElement("tbody");

  analogData.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td style="text-align:center;">
        <img src="${item.image}" alt="${item.name}" class="analog-img" data-index="${index}" style="width:60px;"/>
      </td>
      <td class="name" data-index="${index}">${item.name}</td>
      <td>${item.newPrice}</td>
      <td class="old-price">${item.oldPrice}</td>
      <td><button class="AddToCartButton">В корзину</button></td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  modalContent.appendChild(table);

  // Отображаем модальное окно
  modalOverlay.style.display = "block";

  // Добавляем кликабельность на изображение и наименование
  modalContent.querySelectorAll(".analog-img, .name").forEach((element) => {
    element.addEventListener("click", (event) => {
      const index = event.target.getAttribute("data-index");
      openAnalogModal(shadowRoot, index, analogData);
    });
  });
}

// Настройка уведомлений
function setupNotifications(shadowRoot) {
  // Создаем контейнер для уведомлений, если его нет
  let notificationContainer = shadowRoot.getElementById(
    "NotificationContainer"
  );

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "NotificationContainer";
    notificationContainer.style.position = "fixed";
    notificationContainer.style.top = "20px";
    notificationContainer.style.right = "20px";
    notificationContainer.style.zIndex = "1000";

    shadowRoot.appendChild(notificationContainer);
  }

  // Добавляем стили для уведомлений
  const notificationStyle = document.createElement("style");
  notificationStyle.textContent = `
    .notification {
      padding: 10px 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .notification.show {
      opacity: 1;
    }
    
    .notification.success {
      background-color: #4CAF50;
    }
    
    .notification.error {
      background-color: #F44336;
    }
    
    .notification.info {
      background-color: #2196F3;
    }
  `;

  shadowRoot.appendChild(notificationStyle);
}

// Функция отображения уведомления
function showNotification(shadowRoot, message, type = "info") {
  const notificationContainer = shadowRoot.getElementById(
    "NotificationContainer"
  );

  if (!notificationContainer) return;

  const notification = document.createElement("div");
  notification.classList.add("notification", type);
  notification.textContent = message;

  notificationContainer.appendChild(notification);

  // Задержка перед анимацией появления
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Удаление уведомления через 2 секунды
  setTimeout(() => {
    notification.classList.remove("show");

    // Удаление из DOM после окончания анимации
    notification.addEventListener("transitionend", () => {
      notification.remove();
    });
  }, 2000);
}

// Настройка адаптивного поведения
function setupResponsiveBehavior(shadowRoot) {
  // Обработчик прокрутки для фиксированной кнопки покупки
  const handleScroll = () => {
    const offerElement = shadowRoot.querySelector(".ProductOffer");
    const stickyBuyBar = shadowRoot.querySelector(".StickyBuyBar");

    if (!offerElement || !stickyBuyBar || !isMobileDevice()) return;

    const offerRect = offerElement.getBoundingClientRect();
    const isOfferVisible =
      offerRect.top > 0 && offerRect.bottom <= window.innerHeight;

    if (!isOfferVisible) {
      stickyBuyBar.classList.add("visible");
    } else {
      stickyBuyBar.classList.remove("visible");
    }
  };

  // Удаляем существующий обработчик прокрутки, если он есть
  if (shadowRoot.scrollHandler) {
    window.removeEventListener("scroll", shadowRoot.scrollHandler);
  }

  // Добавляем новый обработчик и сохраняем ссылку на него
  window.addEventListener("scroll", handleScroll);
  shadowRoot.scrollHandler = handleScroll;

  // Обработчик изменения размера окна
  const handleResize = () => {
    // Проверка существования shadowRoot
    if (!shadowRoot) {
      console.warn("shadowRoot не определен в handleResize");
      return;
    }

    // Скрываем оверлей изображений на мобильных устройствах
    const overlay = shadowRoot.getElementById("ImageOverlay");
    if (overlay) {
      if (isMobileDevice()) {
        overlay.style.display = "none";
        overlay.style.visibility = "hidden";
      } else {
        overlay.style.visibility = "visible";
      }
    }

    // Переинициализация обработки изображений при изменении размера окна
    setupImagesAndOverlay(shadowRoot);

    // Безопасное добавление/удаление классов
    const addMobileStyles = () => {
      const mobileStyleElem = document.createElement("style");
      mobileStyleElem.textContent = `
        :host { 
          --view-mode: mobile;
        }
      `;
      shadowRoot.appendChild(mobileStyleElem);
      shadowRoot._mobileStyleElement = mobileStyleElem;

      if (shadowRoot._desktopStyleElement) {
        shadowRoot._desktopStyleElement.remove();
        shadowRoot._desktopStyleElement = null;
      }

      // Обновляем текст кнопки для мобильной версии
      const goToFullDesc = shadowRoot.querySelector(".GoToFullDesc");
      if (goToFullDesc) {
        if (!shadowRoot.querySelector(".ShortPropsBlock.expanded")) {
          goToFullDesc.textContent = "Показать все характеристики";
        } else {
          goToFullDesc.textContent = "Свернуть характеристики";
        }
      }
    };

    const addDesktopStyles = () => {
      const desktopStyleElem = document.createElement("style");
      desktopStyleElem.textContent = `
        :host { 
          --view-mode: desktop;
        }
      `;
      shadowRoot.appendChild(desktopStyleElem);
      shadowRoot._desktopStyleElement = desktopStyleElem;

      if (shadowRoot._mobileStyleElement) {
        shadowRoot._mobileStyleElement.remove();
        shadowRoot._mobileStyleElement = null;
      }

      // Восстанавливаем текст кнопки для десктопной версии
      const goToFullDesc = shadowRoot.querySelector(".GoToFullDesc");
      if (goToFullDesc) {
        goToFullDesc.textContent = "Полное описание и характеристики";
      }
    };

    // Применяем стили в зависимости от устройства
    if (isMobileDevice()) {
      addMobileStyles();
    } else {
      addDesktopStyles();
    }

    // Обновляем высоту контейнера вкладок
    if (shadowRoot.updateTabsHeight) {
      shadowRoot.updateTabsHeight();
    }
  };

  // Удаляем существующий обработчик изменения размера окна, если он есть
  if (shadowRoot.resizeHandler) {
    window.removeEventListener("resize", shadowRoot.resizeHandler);
  }

  // Добавляем новый обработчик с задержкой и сохраняем ссылку на него
  const debouncedResize = () => {
    clearTimeout(shadowRoot.resizeTimer);
    shadowRoot.resizeTimer = setTimeout(() => {
      handleResize();
    }, 200);
  };

  window.addEventListener("resize", debouncedResize);
  shadowRoot.resizeHandler = debouncedResize;

  // Вызываем обработчик сразу при инициализации
  handleResize();
  handleScroll();
}

// Очистка при уничтожении компонента (должна вызываться при удалении компонента из DOM)
window.cleanupProductcardTest = function (shadowRoot) {
  if (!shadowRoot) return;

  // Удаляем обработчики событий
  if (shadowRoot.keyDownListener) {
    document.removeEventListener("keydown", shadowRoot.keyDownListener);
  }

  if (shadowRoot.scrollHandler) {
    window.removeEventListener("scroll", shadowRoot.scrollHandler);
  }

  if (shadowRoot.resizeHandler) {
    window.removeEventListener("resize", shadowRoot.resizeHandler);
  }

  // Очищаем таймеры
  if (shadowRoot.resizeTimer) {
    clearTimeout(shadowRoot.resizeTimer);
  }

  console.log("Очистка компонента карточки товара выполнена");
};
