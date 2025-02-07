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

  // 1. Добавляем CSS (для каруселей, плавного перехода вкладок и т.п.)
  const style = document.createElement("style");
  style.textContent = `
    :host(:focus) {
      outline: none;
    }
    .TabPanel {
      scroll-margin-top: 100px; /* Устанавливаем отступ 100px */
    }
    .carousel-container {
      position: relative;
      display: flex;
      align-items: center;
      overflow: hidden; /* Скрываем переполнение */
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
      -ms-overflow-style: none;  /* IE и Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .MiniHorizontalTiles > .SaleTileItem {
      flex: 0 0 auto;
    }
    .TabsContainer {
      transition: height 0.3s ease;
      height: auto;
    }
  `;
  shadowRoot.appendChild(style);

  // 2. Логика переключения вкладок
  const tabNavItems = shadowRoot.querySelectorAll(".TabsNav .TabItemNav");
  const tabPanels = shadowRoot.querySelectorAll(".TabsContainer .TabPanel");

  async function updateTabsContainerHeight() {
    const tabsContainer = shadowRoot.querySelector(".TabsContainer");
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
    });
  });

  if (tabNavItems.length > 0) {
    tabNavItems[0].classList.add("activeTab");
    tabPanels[0].classList.add("activePanel");
  }

  // 3. +/- количество
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

  // 4. Изображения (основное + оверлей)
  const thumbLinks = shadowRoot.querySelectorAll(".ThumbLink");
  const bigImage = shadowRoot.getElementById("BigImageID");
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

  // Оверлей
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

  function switchToPreviousImage() {
    currentImageIndex--;
    if (currentImageIndex < 0) currentImageIndex = imageSources.length - 1;
    if (overlayPic) {
      overlayPic.src = imageSources[currentImageIndex];
    }
    highlightSelectedThumb();
  }
  function switchToNextImage() {
    currentImageIndex++;
    if (currentImageIndex >= imageSources.length) currentImageIndex = 0;
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
    if (overlayPic) overlayPic.src = "";
    removeOverlayThumbsHighlight();
    const host = shadowRoot.host;
    host.blur();
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
  if (overlayBg && overlayPic) {
    overlayBg.addEventListener("click", closeOverlay);
    overlayPic.addEventListener("click", closeOverlay);
  }

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
  function removeOverlayThumbsHighlight() {
    if (!overlayThumbsContainer) return;
    const thumbs = overlayThumbsContainer.querySelectorAll(".OverlayThumb");
    thumbs.forEach((thumb) => {
      thumb.classList.remove("selected");
    });
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
        tabNavItems.forEach((t) => t.classList.remove("activeTab"));
        tabPanels.forEach((p) => p.classList.remove("activePanel"));
        tabNavItems[0].classList.add("activeTab");
        tabPanels[0].classList.add("activePanel");
        await updateTabsContainerHeight();
        scrollToElementWithOffset(tabPanels[0], 50);
      }
    });
  }

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

  // 7. Инициализация каруселей (данные из /data/carusel.json)
  await initializeCarousels(shadowRoot);

  // Следим за изменениями внутри вкладок и обновляем высоту
  const observer = new MutationObserver(async () => {
    await updateTabsContainerHeight();
  });
  tabPanels.forEach((panel) => {
    observer.observe(panel, { childList: true, subtree: true });
  });

  // Принудительно активируем первую вкладку
  if (tabNavItems.length > 0) {
    setTimeout(() => {
      tabNavItems[0].classList.remove("activeTab");
      tabPanels[0].classList.remove("activePanel");
      tabNavItems[0].click();
    }, 50);
  }

  // 8. Массив аналогов - с реальными ссылками на изображения
  // (Те же ссылки, что у вас в AnalogsScroller -> .AnalogItem)
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

  // Модальное окно для одного аналога
  const modalOverlay = shadowRoot.querySelector("#analogModalOverlay");
  const modalContent = shadowRoot.querySelector("#analogModalContent");
  const modalClose = shadowRoot.querySelector("#analogModalClose");
  const modalProductName = shadowRoot.querySelector("#modalProductName");
  const modalNewPrice = shadowRoot.querySelector("#modalNewPrice");
  const modalOldPrice = shadowRoot.querySelector("#modalOldPrice");
  const modalExtraInfo = shadowRoot.querySelector("#modalExtraInfo");

  function openAnalogModal(index) {
    const data = analogData[index];
    modalProductName.textContent = data.name;
    modalNewPrice.textContent = data.newPrice;
    modalOldPrice.textContent = data.oldPrice;
    modalExtraInfo.textContent = data.extra;
    modalOverlay.style.display = "block";
  }
  function closeAnalogModal() {
    modalOverlay.style.display = "none";
    // Убираем класс "широкого" окна (если был добавлен)
    modalContent.classList.remove("AnalogModalContentAll");
  }

  // При клике по одному из скроллящихся аналогов
  const analogItems = document.querySelectorAll(".AnalogItem");
  analogItems.forEach((item) => {
    item.addEventListener("click", () => {
      const index = item.getAttribute("data-index");
      openAnalogModal(index);
    });
  });
  modalClose.addEventListener("click", closeAnalogModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeAnalogModal();
    }
  });

  // Клик по "Показать все" -> открываем большую таблицу
  const showAllLink = shadowRoot.querySelector(".ShowAllAnalogs");
  if (showAllLink) {
    showAllLink.addEventListener("click", () => {
      openAllAnalogsModal();
    });
  }

  // Функция, которая покажет таблицу во всю ширину (70%)
  function openAllAnalogsModal() {
    modalContent.innerHTML = "";
    modalContent.classList.add("AnalogModalContentAll");

    // Кнопка закрытия
    const closeBtn = document.createElement("span");
    closeBtn.classList.add("AnalogModalClose");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closeAnalogModal);
    modalContent.appendChild(closeBtn);

    // Заголовок с полным названием товара
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
    modalOverlay.style.display = "block";

    // Добавляем кликабельность на изображение и наименование (открытие деталей аналога)
    modalContent.querySelectorAll(".analog-img, .name").forEach((element) => {
      element.addEventListener("click", (event) => {
        const index = event.target.getAttribute("data-index");
        openAnalogModal(index);
      });
    });
  }

  // Уведомления
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
};

// Инициализация каруселей (код не меняем)
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
        // Дублируем для "бесконечной" карусели
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

// Настройка карусели (бесконечной)
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
          if (img.complete) resolve();
          else {
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
    if (e.key === "ArrowLeft") prevButton.click();
    if (e.key === "ArrowRight") nextButton.click();
  });

  // Клонируем первый и последний слайд для "бесконечной" карусели
  const firstClone = cards[0].cloneNode(true);
  const lastClone = cards[cards.length - 1].cloneNode(true);
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);
}
