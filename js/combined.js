document.addEventListener("DOMContentLoaded", () => {
  // ========================================================
  // Общие переменные для оверлея и шторок
  // ========================================================
  const overlay = document.getElementById("overlay");

  // Шторка категорий
  const categoryDrawer = document.getElementById("categoryDrawer");
  const openCategoriesButton = document.getElementById("open-categories");

  // Шторка выбора города
  const cityDrawer = document.getElementById("cityDrawer");
  const cityButton = document.getElementById("selectedCity");

  // Кнопка-клон категорий (появится при прокрутке вместе с поисковой строкой)
  // Она создаётся динамически, поэтому объявим тут переменную, заполним позже.
  let clonedCategoryButton = null;

  // Флаги открытия/закрытия
  let isCategoryOpen = false;
  let isCityOpen = false;

  // ========================================================
  // Функции управления оверлеем и шторками
  // ========================================================
  function showOverlay() {
    overlay.style.display = "block";
  }

  function hideOverlay() {
    overlay.style.display = "none";
  }

  function updateCategoryButtons() {
    // При открытии шторки категорий — "Категории ✕", при закрытии — "Категории ☰"
    if (isCategoryOpen) {
      openCategoriesButton.textContent = "Категории ✕";
      if (clonedCategoryButton) clonedCategoryButton.textContent = "✕";
    } else {
      openCategoriesButton.textContent = "Категории ☰";
      if (clonedCategoryButton) clonedCategoryButton.textContent = "☰";
    }
  }

  // Открыть категории
  function openCategoryDrawer() {
    categoryDrawer.classList.add("open");
    isCategoryOpen = true;
    updateCategoryButtons();
    showOverlay();
  }

  // Закрыть категории
  function closeCategoryDrawer() {
    categoryDrawer.classList.remove("open");
    isCategoryOpen = false;
    updateCategoryButtons();
    if (!isCityOpen) {
      hideOverlay();
    }
  }

  // Переключение категорий
  function toggleCategoryDrawer(event) {
    event.preventDefault();
    if (isCategoryOpen) {
      closeCategoryDrawer();
    } else {
      // Если город открыт, сперва закрываем
      if (isCityOpen) {
        closeCityDrawer();
      }
      openCategoryDrawer();
    }
  }

  // Открыть город
  function openCityDrawer() {
    cityDrawer.classList.add("show");
    isCityOpen = true;
    showOverlay();
  }

  // Закрыть город
  function closeCityDrawer() {
    cityDrawer.classList.remove("show");
    isCityOpen = false;
    if (!isCategoryOpen) {
      hideOverlay();
    }
  }

  // Переключение города
  function toggleCityDrawer(event) {
    event.preventDefault();
    if (isCityOpen) {
      closeCityDrawer();
    } else {
      // Если категории открыты, сперва закрываем
      if (isCategoryOpen) {
        closeCategoryDrawer();
      }
      openCityDrawer();
    }
  }

  // Клик по оверлею закрывает всё
  overlay.addEventListener("click", () => {
    if (isCategoryOpen) {
      closeCategoryDrawer();
    }
    if (isCityOpen) {
      closeCityDrawer();
    }
  });

  // Навешиваем обработчики на кнопки
  if (openCategoriesButton) {
    openCategoriesButton.addEventListener("click", toggleCategoryDrawer);
  }
  if (cityButton) {
    cityButton.addEventListener("click", toggleCityDrawer);
  }

  // ========================================================
  // Логика поиска + клон-шапка при скролле (общая)
  // ========================================================
  const searchBar = document.querySelector(".search-bar");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  let cloneBar = null;
  let isScrolled = false;
  let isFocused = false;
  let isSyncing = false;

  // Функция синхронизации текста между оригинальным input и клоном
  function syncInputs(e) {
    if (isSyncing) return;
    isSyncing = true;

    if (cloneBar) {
      const cloneInput = cloneBar.querySelector("#searchInputClone");
      const originalInput = document.getElementById("searchInput");
      if (!cloneInput || !originalInput) return;

      if (e.target.id === "searchInput") {
        cloneInput.value = originalInput.value;
      } else if (e.target.id === "searchInputClone") {
        originalInput.value = cloneInput.value;
      }
    }

    isSyncing = false;
  }

  // Удаляем клон при условии
  function removeClone() {
    if (!cloneBar) return;

    cloneBar.classList.remove("active");
    cloneBar.classList.add("inactive");

    setTimeout(() => {
      if (cloneBar) {
        // Удаляем все обработчики
        const cloneInput = cloneBar.querySelector("#searchInputClone");
        const cloneBtn = cloneBar.querySelector("#searchButtonClone");
        const catBtn = cloneBar.querySelector("#cloned-open-categories");
        const scrollTopBtn = cloneBar.querySelector("#scroll-top-button");

        if (cloneInput) {
          cloneInput.removeEventListener("input", syncInputs);
          cloneInput.removeEventListener("focus", cloneFocus);
          cloneInput.removeEventListener("blur", cloneBlur);
        }
        if (cloneBtn) {
          cloneBtn.removeEventListener("click", () => {
            searchButton.click();
          });
        }
        if (catBtn) {
          catBtn.removeEventListener("click", toggleCategoryDrawer);
        }
        if (scrollTopBtn) {
          scrollTopBtn.removeEventListener("click", scrollToTop);
        }

        cloneBar.remove();
        cloneBar = null;
      }
    }, 300);
  }

  // Создать клон search-bar при скролле
  function createClone() {
    if (cloneBar) return;

    cloneBar = searchBar.cloneNode(true);
    cloneBar.classList.add("search-bar-clone");

    // Меняем id на клоновых элементах
    const cloneInput = cloneBar.querySelector("#searchInput");
    const cloneBtn = cloneBar.querySelector("#searchButton");

    if (cloneInput) {
      cloneInput.id = "searchInputClone";
      cloneInput.value = searchInput.value;
      cloneInput.placeholder = "Поиск товаров...";
    }
    if (cloneBtn) {
      cloneBtn.id = "searchButtonClone";
    }

    // Блок для кнопок в клоне
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("clone-buttons-container");

    // 1) Кнопка категорий (клон)
    const clonedCatBtn = document.createElement("button");
    clonedCatBtn.id = "cloned-open-categories";
    clonedCatBtn.classList.add("clone-category-button");
    clonedCatBtn.textContent = isCategoryOpen ? "✕" : "☰"; // изначальное состояние
    clonedCategoryButton = clonedCatBtn; // Запоминаем, чтобы обновлять текст

    // 2) Кнопка прокрутки вверх
    const scrollTopBtn = document.createElement("button");
    scrollTopBtn.id = "scroll-top-button";
    scrollTopBtn.classList.add("scroll-top-button");
    scrollTopBtn.innerHTML = '<i class="ri-arrow-up-double-line"></i>';

    // Добавляем обе кнопки в контейнер
    buttonsContainer.appendChild(clonedCatBtn);
    buttonsContainer.appendChild(scrollTopBtn);

    cloneBar.appendChild(buttonsContainer);
    document.body.appendChild(cloneBar);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cloneBar.classList.add("active");
      });
    });

    // Обработчики для поискового поля в клоне
    const cloneSearchInput = cloneBar.querySelector("#searchInputClone");
    if (cloneSearchInput) {
      cloneSearchInput.addEventListener("input", syncInputs);

      cloneSearchInput.addEventListener("focus", cloneFocus);
      cloneSearchInput.addEventListener("blur", cloneBlur);

      cloneSearchInput.addEventListener("input", () => {
        const textWidth = cloneSearchInput.scrollWidth;
        if (
          textWidth > cloneSearchInput.clientWidth &&
          cloneBar.classList.contains("focused") &&
          cloneBar.offsetWidth < 500
        ) {
          cloneBar.classList.add("expanded");
          buttonsContainer.classList.add("fixed-buttons");
        } else {
          cloneBar.classList.remove("expanded");
          buttonsContainer.classList.remove("fixed-buttons");
        }
      });
    }

    // Обработчик для кнопки поиска в клоне
    if (cloneBtn) {
      cloneBtn.addEventListener("click", () => {
        searchButton.click();
      });
    }

    // Обработчик для кнопки категорий в клоне
    clonedCatBtn.addEventListener("click", toggleCategoryDrawer);

    // Обработчик для кнопки "Прокрутить вверх"
    scrollTopBtn.addEventListener("click", scrollToTop);
  }

  // Прокрутить страницу вверх
  function scrollToTop() {
    const scrollDuration = 100;
    const scrollStep = window.scrollY / (scrollDuration / 16);

    function step() {
      if (window.scrollY > 0) {
        window.scrollTo(0, window.scrollY - scrollStep);
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // Фокус на клоновом инпуте
  function cloneFocus() {
    isFocused = true;
    cloneBar.classList.add("focused");
    searchBar.classList.add("focused");
  }

  // Потеря фокуса на клоновом инпуте
  function cloneBlur() {
    isFocused = false;
    cloneBar.classList.remove("focused");
    searchBar.classList.remove("focused");
    if (window.scrollY === 0) {
      removeClone();
    }
  }

  // Фокус на исходном input
  function handleFocus() {
    if (isScrolled) {
      isFocused = true;
      searchBar.classList.add("focused");
      if (cloneBar) cloneBar.classList.add("focused");
    }
  }

  // Потеря фокуса исходного input
  function handleBlur() {
    if (isScrolled) {
      isFocused = false;
      searchBar.classList.remove("focused");
      if (cloneBar) cloneBar.classList.remove("focused");
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInsideClone = cloneBar && cloneBar.contains(activeElement);
        if (!isInsideClone && window.scrollY === 0) {
          removeClone();
        }
      }, 0);
    }
  }

  // Реакция на скролл
  function handleScroll() {
    if (window.scrollY > 0 && !isScrolled) {
      isScrolled = true;
      searchBar.classList.add("scrolled");
      createClone();
    } else if (window.scrollY === 0 && isScrolled && !isFocused) {
      isScrolled = false;
      searchBar.classList.remove("scrolled", "focused");
      removeClone();
    }
  }

  // Подписываемся на события скролла, фокуса
  window.addEventListener("scroll", handleScroll);
  if (searchInput) {
    searchInput.addEventListener("input", syncInputs);
    searchInput.addEventListener("focus", handleFocus);
    searchInput.addEventListener("blur", handleBlur);
  }

  // ========================================================
  // Логика загрузки и отображения категорий (ранее categories.js)
  // ========================================================
  const sidebar = document.querySelector("#category-module .sidebar");
  const subcategoriesContainer = document.querySelector(
    "#category-module .subcategories-container"
  );
  let superActiveTitle = null; // Текущая super-active категория
  let categories = [];

  // Показываем подкатегории
  function showSubcategories(category) {
    subcategoriesContainer.innerHTML = "";
    subcategoriesContainer.classList.add("active");

    const columnsContainer = document.createElement("div");
    columnsContainer.className = "columns-container";

    const numColumns = 3;
    const columns = [];

    for (let i = 0; i < numColumns; i++) {
      const col = document.createElement("div");
      col.className = "subcategory-column";
      columnsContainer.appendChild(col);
      columns.push(col);
    }

    category.subcategories.forEach((subcat, index) => {
      const colIndex = index % numColumns;
      const column = columns[colIndex];

      const block = document.createElement("div");
      block.className = "subcategory-block";

      const titleEl = document.createElement("div");
      titleEl.className = "subcategory-title";
      titleEl.textContent = subcat.title;

      block.appendChild(titleEl);

      // Если есть subitems
      if (Array.isArray(subcat.subitems) && subcat.subitems.length > 0) {
        const itemsEl = document.createElement("div");
        itemsEl.className = "subcategory-items active";

        const maxVisibleItems = 17;
        const hasMore = subcat.subitems.length > maxVisibleItems;
        const itemsToShow = hasMore
          ? subcat.subitems.slice(0, maxVisibleItems)
          : subcat.subitems;

        itemsToShow.forEach((item) => {
          const itemEl = document.createElement("div");
          itemEl.className = "subcategory-item";
          itemEl.textContent = item;
          itemsEl.appendChild(itemEl);
        });

        if (hasMore) {
          const showMoreEl = document.createElement("div");
          showMoreEl.className = "show-more";
          showMoreEl.textContent = "Показать ещё";
          showMoreEl.addEventListener("click", () => {
            if (subcat.subitems.length > itemsEl.children.length) {
              const remainingItems = subcat.subitems.slice(
                itemsEl.children.length
              );
              remainingItems.forEach((itm) => {
                const itemEl = document.createElement("div");
                itemEl.className = "subcategory-item";
                itemEl.textContent = itm;
                itemsEl.insertBefore(itemEl, showMoreEl);
              });
            }
            showMoreEl.style.display = "none";
          });
          itemsEl.appendChild(showMoreEl);
        }

        block.appendChild(itemsEl);
      }

      column.appendChild(block);
    });

    subcategoriesContainer.appendChild(columnsContainer);
  }

  // Устанавливаем super-active (закреплённую) категорию
  function setSuperActive(titleElement) {
    if (superActiveTitle) {
      superActiveTitle.classList.remove("super-active");
    }
    superActiveTitle = titleElement;
    superActiveTitle.classList.add("super-active");
  }

  function showSuperActiveSubcategories() {
    if (superActiveTitle) {
      const slug = superActiveTitle.getAttribute("data-slug");
      const category = categories.find((cat) => cat.slug === slug);
      if (category) {
        showSubcategories(category);
      }
    }
  }

  // Загружаем JSON с категориями
  fetch("/data/category.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      categories = data.categories || [];
      if (!categories.length) {
        console.warn("Категории отсутствуют в JSON.");
        return;
      }

      // Рендерим категории в sidebar
      categories.forEach((cat) => {
        const groupTitle = document.createElement("div");
        groupTitle.className = "group-title";
        groupTitle.setAttribute("data-slug", cat.slug);

        // Иконка (если есть)
        if (cat.icon) {
          const icon = document.createElement("i");
          icon.className = cat.icon;
          groupTitle.appendChild(icon);
        } else {
          // Стандартная иконка
          const defaultIcon = document.createElement("i");
          defaultIcon.className = "ri-folder-line";
          groupTitle.appendChild(defaultIcon);
        }

        const text = document.createElement("span");
        text.textContent = cat.title;
        groupTitle.appendChild(text);

        // Hover
        groupTitle.addEventListener("mouseenter", () => {
          groupTitle.classList.add("active");
          showSubcategories(cat);
        });
        groupTitle.addEventListener("mouseleave", () => {
          groupTitle.classList.remove("active");
        });

        // Клик -> делаем super-active
        groupTitle.addEventListener("click", (e) => {
          e.stopPropagation();
          setSuperActive(groupTitle);
          showSubcategories(cat);
        });

        sidebar.appendChild(groupTitle);
      });

      // По умолчанию супер-активная — первая категория
      const firstTitle = sidebar.querySelector(".group-title");
      if (firstTitle) {
        setSuperActive(firstTitle);
        showSubcategories(categories[0]);
      }
    })
    .catch((err) => {
      console.error("Ошибка при загрузке категорий:", err);
    });

  // Если уходим с сайдбара курсором, показываем супер-активную
  if (sidebar) {
    sidebar.addEventListener("mouseleave", () => {
      showSuperActiveSubcategories();
    });
  }

  // ========================================================
  // Логика выбора города (ранее city.js)
  // ========================================================
  const currentCity = document.getElementById("currentCity");
  const cityListContainer = document.getElementById("cityListContainer");
  const citySearchInput = document.getElementById("citySearchInput");
  const citySearchIcon = document.getElementById("citySearchIcon");
  const toggleButton = document.getElementById("toggleSelectionMode");
  const mapSelectionContainer = document.getElementById(
    "mapSelectionContainer"
  );
  const selectionModeContainer = document.querySelector(
    ".selection-mode-container"
  );

  let contactsData = {};
  let mapInitialized = false;

  // Фильтрация
  function filterCities(searchTerm) {
    if (!searchTerm.trim()) {
      renderCities(contactsData);
      return;
    }
    const filtered = {};
    for (const letter of Object.keys(contactsData)) {
      const matchingCities = contactsData[letter].filter((cityItem) =>
        cityItem.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingCities.length > 0) {
        filtered[letter] = matchingCities;
      }
    }
    renderCities(filtered);
  }

  // Рендер городов
  function renderCities(data) {
    cityListContainer.innerHTML = "";
    const sortedLetters = Object.keys(data).sort();

    for (const letter of sortedLetters) {
      const letterGroup = document.createElement("div");
      letterGroup.classList.add("letter-group");

      const h3 = document.createElement("h3");
      h3.textContent = letter;
      letterGroup.appendChild(h3);

      const ul = document.createElement("ul");
      ul.classList.add("city-list");

      data[letter].forEach((cityItem) => {
        const li = document.createElement("li");
        li.classList.add("city");

        const toggleBtn = document.createElement("button");
        toggleBtn.classList.add("toggle");
        toggleBtn.textContent = cityItem.name;

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("details");

        if (cityItem.address) {
          const addressP = document.createElement("p");
          addressP.textContent = "Адрес: " + cityItem.address;
          detailsDiv.appendChild(addressP);
        }
        if (cityItem.phones && cityItem.phones.length) {
          cityItem.phones.forEach((phone) => {
            const phoneP = document.createElement("p");
            phoneP.textContent = "Тел: " + phone;
            detailsDiv.appendChild(phoneP);
          });
        }
        if (cityItem.emails && cityItem.emails.length) {
          cityItem.emails.forEach((email) => {
            const emailP = document.createElement("p");
            emailP.textContent = "Email: " + email;
            detailsDiv.appendChild(emailP);
          });
        }

        const chooseBtn = document.createElement("button");
        chooseBtn.classList.add("choose-office-button");
        chooseBtn.textContent = "Выбрать представительство";
        chooseBtn.addEventListener("click", () => selectCity(cityItem.name));
        detailsDiv.appendChild(chooseBtn);

        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          li.classList.toggle("active");
        });

        li.appendChild(toggleBtn);
        li.appendChild(detailsDiv);
        ul.appendChild(li);
      });

      letterGroup.appendChild(ul);
      cityListContainer.appendChild(letterGroup);
    }
  }

  // Выбор города
  function selectCity(name) {
    currentCity.innerHTML = `<span>${name}</span>`;
    cityButton.classList.remove("no-city-chosen");
    closeCityDrawer(); // Закрыть
    toggleButton.textContent = "Выбрать на карте";
  }

  // Инициализация карты
  async function initMapSelection() {
    const mapLoading = document.createElement("div");
    mapLoading.id = "mapLoading";
    mapLoading.style.display = "block";
    mapLoading.style.textAlign = "center";
    mapLoading.style.marginTop = "20px";
    mapSelectionContainer.appendChild(mapLoading);

    try {
      const response = await fetch("/data/contacts_with_coordinates.json");
      if (!response.ok) {
        throw new Error(`Ошибка загрузки JSON: ${response.status}`);
      }
      const contacts = await response.json();

      const groupedContacts = {};
      for (const cities of Object.values(contacts)) {
        for (const city of cities) {
          if (city.coordinates) {
            const key = `${city.coordinates.latitude},${city.coordinates.longitude}`;
            if (!groupedContacts[key]) {
              groupedContacts[key] = city;
            }
          }
        }
      }

      function createGeoObjects() {
        const geoObjects = [];
        for (const [coords, office] of Object.entries(groupedContacts)) {
          const [lat, lng] = coords.split(",").map(Number);
          const placemark = new ymaps.Placemark(
            [lat, lng],
            {
              balloonContent: `
                  <strong>${office.name}</strong><br>
                  ${office.address ? `Адрес: ${office.address}<br>` : ""}
                  ${
                    office.phones && office.phones.length
                      ? `Телефоны: ${office.phones.join(", ")}<br>`
                      : ""
                  }
                  ${
                    office.emails && office.emails.length
                      ? `Email: ${office.emails.join(", ")}<br>`
                      : ""
                  }
                  <button class="choose-office-button" onclick="selectOffice('${
                    office.name
                  }')">
                    Выбрать представительство
                  </button>
                `,
            },
            { preset: "islands#blueIcon" }
          );
          geoObjects.push(placemark);
        }
        return geoObjects;
      }

      const clusterer = new ymaps.Clusterer({
        preset: "islands#invertedVioletClusterIcons",
        groupByCoordinates: false,
        clusterDisableClickZoom: false,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
      });
      clusterer.add(createGeoObjects());

      const mapSelection = new ymaps.Map("mapSelection", {
        center: [55.76, 37.64],
        zoom: 4,
        controls: ["zoomControl", "fullscreenControl"],
      });

      mapSelection.geoObjects.add(clusterer);

      // Масштабируем карту по всем меткам
      if (clusterer.getGeoObjects().length) {
        mapSelection.setBounds(clusterer.getBounds(), { checkZoomRange: true });
      }

      // Глобальная функция (через window), чтобы вызывать из balloonContent
      window.selectOffice = function (name) {
        currentCity.innerHTML = `<span>${name}</span>`;
        cityButton.classList.remove("no-city-chosen");
        closeCityDrawer();
        toggleButton.textContent = "Выбрать на карте";
      };

      mapLoading.remove();
    } catch (error) {
      console.error("Ошибка при инициализации карты выбора:", error);
      mapLoading.innerHTML = "<p>Не удалось загрузить карту.</p>";
    }
  }

  // События ввода / клика для поиска города
  citySearchInput.addEventListener("input", (e) => {
    filterCities(e.target.value);
  });
  citySearchIcon.addEventListener("click", () => {
    filterCities(citySearchInput.value);
  });

  // Переключение режима списка/карты
  toggleButton.addEventListener("click", () => {
    const isMapVisible = selectionModeContainer.classList.contains("map-mode");

    if (isMapVisible) {
      selectionModeContainer.classList.remove("map-mode");
      toggleButton.textContent = "Выбрать на карте";
    } else {
      selectionModeContainer.classList.add("map-mode");
      toggleButton.textContent = "Выбрать из списка";
      if (!mapInitialized) {
        ymaps.ready(initMapSelection);
        mapInitialized = true;
      }
      mapSelectionContainer.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Загрузка contacts.json
  fetch("/data/contacts.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ошибка при загрузке contacts.json");
      }
      return response.json();
    })
    .then((data) => {
      contactsData = data;
      renderCities(contactsData);
    })
    .catch((error) => {
      console.error("Ошибка загрузки JSON:", error);
    });
});
