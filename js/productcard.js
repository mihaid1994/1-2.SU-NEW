// script.js

// Новая утилита для ожидания загрузки всех изображений в указанном элементе
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

window.initProductcardTest = async function (shadowRoot) {
  console.log("initProductcardTest вызвана с shadowRoot:", shadowRoot);

  // Добавляем CSS для удаления outline при фокусе на хосте и устанавливаем scroll-margin-top
  const style = document.createElement("style");
  style.textContent = `
    :host(:focus) {
      outline: none;
    }
    .TabPanel {
      scroll-margin-top: 100px; /* Устанавливаем отступ 100px */
    }
    /* Стили для контейнера карусели */
    .carousel-container {
      position: relative;
      display: flex;
      align-items: center;
      overflow: hidden; /* Скрываем переполнение */
    }

    /* Стили для трека карусели */
    .carousel-track {
      display: flex;
      transition: transform 0.5s ease;
    }

    /* Стили для карточек товаров внутри карусели */
    .MiniHorizontalTiles > .SaleTileItem {
      flex: 0 0 auto;
    }

    .prev-button {
      left: 10px; /* Расположение кнопки слева с отступом */
    }

    .next-button {
      right: 10px; /* Расположение кнопки справа с отступом */
    }

    /* Скрываем стандартные стрелки браузера в MiniHorizontalTiles */
    .MiniHorizontalTiles::-webkit-scrollbar {
      display: none;
    }

    .MiniHorizontalTiles {
      -ms-overflow-style: none;  /* IE и Edge */
      scrollbar-width: none;  /* Firefox */
    }

    /* Обеспечиваем, чтобы карточки не переносились на новую строку */
    .MiniHorizontalTiles > .SaleTileItem {
      flex: 0 0 auto;
    }

    /* Плавный переход для изменения размеров .TabsContainer */
    .TabsContainer {
      transition: height 0.3s ease;
      height: auto;
    }
  `;
  shadowRoot.appendChild(style);

  // 1. Переключение вкладок
  const tabNavItems = shadowRoot.querySelectorAll(".TabsNav .TabItemNav");
  const tabPanels = shadowRoot.querySelectorAll(".TabsContainer .TabPanel");

  // Функция обновления высоты TabsContainer
  async function updateTabsContainerHeight() {
    const tabsContainer = shadowRoot.querySelector(".TabsContainer");
    const activePanel = shadowRoot.querySelector(".TabPanel.activePanel");
    if (tabsContainer && activePanel) {
      await waitForImagesInElement(activePanel); // Ждём загрузки изображений
      const panelHeight = activePanel.scrollHeight;
      tabsContainer.style.height = `${panelHeight + 55}px`; // Добавляем 55px
    }
  }

  // Устанавливаем слушатели на вкладки
  tabNavItems.forEach((tab, index) => {
    tab.addEventListener("click", async () => {
      // Снимаем активные классы
      tabNavItems.forEach((t) => t.classList.remove("activeTab"));
      tabPanels.forEach((p) => p.classList.remove("activePanel"));

      // Назначаем активную вкладку и панель
      tab.classList.add("activeTab");
      tabPanels[index].classList.add("activePanel");

      // Обновляем высоту контейнера
      await updateTabsContainerHeight();
    });
  });

  // Активируем первую вкладку по умолчанию (Описание) при загрузке
  if (tabNavItems.length > 0) {
    tabNavItems[0].classList.add("activeTab");
    tabPanels[0].classList.add("activePanel");
  }

  // 2. +/- количество
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

  // 3. Установка больших изображений при наведении миниатюр
  const thumbLinks = shadowRoot.querySelectorAll(".ThumbLink");
  const bigImage = shadowRoot.getElementById("BigImageID");

  // Список всех больших изображений (для оверлея)
  const imageSources = [];
  thumbLinks.forEach((link) => {
    const imgSrc = link.getAttribute("data-bigimg");
    imageSources.push(imgSrc);
  });

  let currentImageIndex = 0;

  thumbLinks.forEach((link, index) => {
    link.addEventListener("mouseover", () => {
      const newSrc = link.getAttribute("data-bigimg");
      if (bigImage && newSrc) {
        bigImage.src = newSrc;
      }
    });
    link.addEventListener("click", (e) => {
      e.preventDefault();
      currentImageIndex = index;
      openOverlay(imageSources[currentImageIndex]);
    });
  });

  // 4. Полноэкранный просмотр
  const overlay = shadowRoot.getElementById("ImageOverlay");
  const overlayBg = shadowRoot.getElementById("ImageOverlayBg");
  const overlayPic = shadowRoot.getElementById("ImageOverlayPic");
  const overlayThumbsContainer = shadowRoot.querySelector(".OverlayThumbs");

  if (bigImage) {
    bigImage.addEventListener("click", () => {
      currentImageIndex = imageSources.indexOf(bigImage.src);
      if (currentImageIndex < 0) currentImageIndex = 0;
      openOverlay(bigImage.src);
    });
  }

  const navLeft = shadowRoot.querySelector(".OverlayNavLeft");
  const navRight = shadowRoot.querySelector(".OverlayNavRight");

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

  function handleKeyDown(e) {
    if (!overlay.classList.contains("OverlayVisible")) return;
    if (e.key === "Escape") {
      closeOverlay();
    } else if (e.key === "ArrowLeft") {
      switchToPreviousImage();
    } else if (e.key === "ArrowRight") {
      switchToNextImage();
    }
  }
  document.addEventListener("keydown", handleKeyDown);

  function switchToPreviousImage() {
    currentImageIndex--;
    if (currentImageIndex < 0) {
      currentImageIndex = imageSources.length - 1;
    }
    if (overlayPic) {
      overlayPic.src = imageSources[currentImageIndex];
    }
    highlightSelectedThumb();
  }

  function switchToNextImage() {
    currentImageIndex++;
    if (currentImageIndex >= imageSources.length) {
      currentImageIndex = 0;
    }
    if (overlayPic) {
      overlayPic.src = imageSources[currentImageIndex];
    }
    highlightSelectedThumb();
  }

  function openOverlay(src) {
    if (!overlayPic) return;
    overlayPic.src = src;
    overlay.classList.remove("OverlayHidden");
    overlay.classList.add("OverlayVisible");
    populateOverlayThumbs();
    highlightSelectedThumb();
    const host = shadowRoot.host;
    host.setAttribute("tabindex", "-1");
    host.focus();
  }

  function closeOverlay() {
    overlay.classList.remove("OverlayVisible");
    overlay.classList.add("OverlayHidden");
    if (overlayPic) {
      overlayPic.src = "";
    }
    removeOverlayThumbsHighlight();
    const host = shadowRoot.host;
    host.blur();
  }

  if (overlayBg && overlayPic) {
    overlayBg.addEventListener("click", closeOverlay);
    overlayPic.addEventListener("click", closeOverlay);
  }

  // 5. Копирование кода
  const copyElements = shadowRoot.querySelectorAll(".copy-code, .copy-icon");
  copyElements.forEach((elem) => {
    elem.addEventListener("click", (e) => {
      e.stopPropagation();
      const code = elem.getAttribute("data-code");
      if (code) {
        navigator.clipboard
          .writeText(code)
          .then(() => {
            showNotification(`Скопировано: ${code}`, "success");
          })
          .catch(() => {
            showNotification("Ошибка при копировании", "error");
          });
      }
    });
  });

  // 6. Переход к полному описанию
  const goToFullDescBtn = shadowRoot.querySelector(".GoToFullDesc");
  if (goToFullDescBtn) {
    goToFullDescBtn.addEventListener("click", async () => {
      if (tabNavItems.length > 0) {
        // Активируем первую вкладку (Описание)
        tabNavItems.forEach((t) => t.classList.remove("activeTab"));
        tabPanels.forEach((p) => p.classList.remove("activePanel"));
        tabNavItems[0].classList.add("activeTab");
        tabPanels[0].classList.add("activePanel");

        await updateTabsContainerHeight();
        scrollToElementWithOffset(tabPanels[0], 50);
      }
    });
  }

  // 7. Клик по "Описание"
  const delLink = shadowRoot.querySelector(".delivery-link");
  if (delLink) {
    delLink.addEventListener("click", async () => {
      if (tabNavItems.length > 1 && tabPanels.length > 1) {
        tabNavItems.forEach((t) => t.classList.remove("activeTab"));
        tabPanels.forEach((p) => p.classList.remove("activePanel"));
        tabNavItems[1].classList.add("activeTab");
        tabPanels[1].classList.add("activePanel");

        await updateTabsContainerHeight();
        scrollToElementWithOffset(tabPanels[1], 50);
      }
    });
  }

  // 7. Клик по "Документация"
  const docLink = shadowRoot.querySelector(".documentation-link");
  if (docLink) {
    docLink.addEventListener("click", async () => {
      if (tabNavItems.length > 2 && tabPanels.length > 2) {
        tabNavItems.forEach((t) => t.classList.remove("activeTab"));
        tabPanels.forEach((p) => p.classList.remove("activePanel"));
        tabNavItems[2].classList.add("activeTab");
        tabPanels[2].classList.add("activePanel");

        await updateTabsContainerHeight();
        scrollToElementWithOffset(tabPanels[2], 50);
      }
    });
  }

  // 8. Заполнение миниатюр в оверлее
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
    highlightSelectedThumb();
  }

  // 9. Выделение выбранной миниатюры
  function highlightSelectedThumb() {
    if (!overlayThumbsContainer) return;
    const thumbs = overlayThumbsContainer.querySelectorAll(".OverlayThumb");
    thumbs.forEach((thumb, index) => {
      if (index === currentImageIndex) {
        thumb.classList.add("selected");
      } else {
        thumb.classList.remove("selected");
      }
    });
  }

  function removeOverlayThumbsHighlight() {
    if (!overlayThumbsContainer) return;
    const thumbs = overlayThumbsContainer.querySelectorAll(".OverlayThumb");
    thumbs.forEach((thumb) => {
      thumb.classList.remove("selected");
    });
  }

  // 10. Уведомления
  const notificationContainer = shadowRoot.getElementById(
    "NotificationContainer"
  );
  function showNotification(message, type = "info") {
    if (!notificationContainer) return;
    const notification = document.createElement("div");
    notification.classList.add("notification", type);
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("show");
      notification.addEventListener("transitionend", () => {
        notification.remove();
      });
    }, 2000);
  }

  // 11. Прокрутка с учётом отступа (50px)
  function scrollToElementWithOffset(element, offset = 50) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Переопределяем якорную прокрутку для всех ссылок внутри shadowRoot
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

  // 12. Инициализация каруселей
  await initializeCarousels(shadowRoot);

  // Следим за изменениями внутри вкладок и обновляем высоту
  const observer = new MutationObserver(async () => {
    await updateTabsContainerHeight();
  });
  tabPanels.forEach((panel) => {
    observer.observe(panel, { childList: true, subtree: true });
  });

  // !!! Принудительно повторно инициализируем первую вкладку после полной загрузки !!!
  // Это "обманный" трюк, чтобы заставить вкладку снова подогнать размер.
  // Сначала снимем "активность", а потом кликнем по ней ещё раз:
  if (tabNavItems.length > 0) {
    // Даём небольшой таймаут, чтобы контент точно прогрузился (просто 0 или 50мс).
    setTimeout(() => {
      tabNavItems[0].classList.remove("activeTab");
      tabPanels[0].classList.remove("activePanel");

      // "Кликаем" по первой вкладке, активируя её принудительно.
      tabNavItems[0].click();
    }, 50);
  }
};

// Функция для инициализации каруселей (код не меняем)
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
        cache[block].forEach((product) => {
          const card = createProductCard(product);
          container.appendChild(card);
        });
        cache[block].forEach((product) => {
          const card = createProductCard(product);
          container.appendChild(card);
        });
        setupCarousel(shadowRoot, block, cache[block].length);
      }
    });
  } catch (error) {
    console.error("Ошибка при инициализации каруселей:", error);
  }
}

// Функция для создания карточки товара
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
  imageLink.href = product.link;
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
  price.textContent = product.price;
  dataDiv.appendChild(price);

  const buyButton = document.createElement("button");
  buyButton.classList.add("SaleBuyButton");
  buyButton.textContent = "В корзину";
  dataDiv.appendChild(buyButton);

  card.appendChild(dataDiv);

  return card;
}

// Функция для настройки карусели
function setupCarousel(shadowRoot, block, originalLength) {
  const carouselContainer = shadowRoot.querySelector(
    `.${block} .carousel-container`
  );
  const track = carouselContainer.querySelector(".carousel-track");
  const prevButton = carouselContainer.querySelector(".prev-button");
  const nextButton = carouselContainer.querySelector(".next-button");
  const cards = Array.from(track.children);
  let cardWidth = 0;
  let gap = 0;
  let isTransitioning = false;
  let currentIndex = 1;

  function calculateDimensions() {
    if (cards.length === 0) return;
    const firstCard = cards[0];
    const computedStyle = getComputedStyle(firstCard);
    const marginRight = parseFloat(computedStyle.marginRight) || 0;
    cardWidth = firstCard.getBoundingClientRect().width;
    gap = marginRight;
  }

  function waitForImages() {
    const images = track.querySelectorAll("img");
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

  function jumpWithoutTransition(toIndex) {
    track.style.transition = "none";
    track.style.transform = `translateX(-${toIndex * (cardWidth + gap)}px)`;
    requestAnimationFrame(() => {
      track.style.transition = "transform 0.5s ease";
    });
  }

  waitForImages().then(() => {
    calculateDimensions();
    jumpWithoutTransition(currentIndex);

    nextButton.addEventListener("click", () => {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex++;
      track.style.transform = `translateX(-${
        currentIndex * (cardWidth + gap)
      }px)`;
    });

    prevButton.addEventListener("click", () => {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex--;
      track.style.transform = `translateX(-${
        currentIndex * (cardWidth + gap)
      }px)`;
    });

    track.addEventListener("transitionend", () => {
      isTransitioning = false;
      if (currentIndex === 0) {
        currentIndex = originalLength;
        jumpWithoutTransition(currentIndex);
      } else if (currentIndex === originalLength + 1) {
        currentIndex = 1;
        jumpWithoutTransition(currentIndex);
      }
    });

    window.addEventListener("resize", () => {
      const savedIndex = currentIndex;
      calculateDimensions();
      jumpWithoutTransition(savedIndex);
    });
  });

  carouselContainer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      prevButton.click();
    } else if (e.key === "ArrowRight") {
      nextButton.click();
    }
  });

  const firstClone = cards[0].cloneNode(true);
  const lastClone = cards[cards.length - 1].cloneNode(true);
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);
}
