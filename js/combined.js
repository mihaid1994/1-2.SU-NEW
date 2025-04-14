document.addEventListener("DOMContentLoaded", () => {
  // ========================================================
  // Общие переменные для оверлея и шторок
  // ========================================================
  const overlay = document.getElementById("overlay");

  // Шторка категорий
  const categoryDrawer = document.getElementById("categoryDrawer");
  const openCategoriesButtons = document.querySelectorAll("#open-categories");

  // Шторка выбора города
  const cityDrawer = document.getElementById("cityDrawer");
  const cityButtons = document.querySelectorAll("#selectedCity");

  // Новая иконка поиска (мобильная версия)
  const searchIconButton = document.getElementById("searchIcon");

  // Кнопка-клон категорий (появится при прокрутке вместе с поисковой строкой)
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
    openCategoriesButtons.forEach((btn) => {
      btn.textContent = isCategoryOpen ? "Категории ✕" : "Категории ☰";
    });
    if (clonedCategoryButton) {
      clonedCategoryButton.textContent = isCategoryOpen ? "✕" : "☰";
    }
  }

  function openCategoryDrawer() {
    categoryDrawer.classList.add("open");
    isCategoryOpen = true;
    updateCategoryButtons();
    showOverlay();
  }

  function closeCategoryDrawer() {
    categoryDrawer.classList.remove("open");
    isCategoryOpen = false;
    updateCategoryButtons();
    if (!isCityOpen) hideOverlay();
  }

  function toggleCategoryDrawer(event) {
    event.preventDefault();
    event.stopPropagation(); // Предотвращаем всплытие, чтобы не сработал handleOutsideClick
    if (isCategoryOpen) {
      closeCategoryDrawer();
    } else {
      if (isCityOpen) closeCityDrawer();
      openCategoryDrawer();
    }
  }

  // Обработчик клика вне шторки
  function handleOutsideClick(event) {
    if (
      isCityOpen &&
      !cityDrawer.contains(event.target) &&
      !cityButtons[0].contains(event.target)
    ) {
      // Если клик был вне шторки и не по кнопке открытия шторки
      closeCityDrawer();
    }
  }

  function openCityDrawer() {
    cityDrawer.classList.add("show");
    isCityOpen = true;
    showOverlay();

    // Добавляем обработчик клика после открытия шторки
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 10);
  }

  function closeCityDrawer() {
    cityDrawer.classList.remove("show");
    isCityOpen = false;
    if (!isCategoryOpen) hideOverlay();

    // Удаляем обработчик клика после закрытия шторки
    document.removeEventListener("click", handleOutsideClick);
  }

  function toggleCityDrawer(event) {
    event.preventDefault();
    event.stopPropagation(); // Предотвращаем всплытие, чтобы не сработал handleOutsideClick

    if (isCityOpen) {
      closeCityDrawer();
    } else {
      if (isCategoryOpen) closeCategoryDrawer();
      openCityDrawer();
    }
  }

  overlay.addEventListener("click", () => {
    if (isCategoryOpen) closeCategoryDrawer();
    if (isCityOpen) closeCityDrawer();
  });

  openCategoriesButtons.forEach((btn) => {
    btn.addEventListener("click", toggleCategoryDrawer);
  });

  cityButtons.forEach((btn) => {
    btn.addEventListener("click", toggleCityDrawer);
  });

  // Предотвращаем закрытие при клике внутри шторки
  cityDrawer.addEventListener("click", (event) => {
    event.stopPropagation();
  });

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

  function removeClone() {
    if (!cloneBar) return;
    cloneBar.classList.remove("active");
    cloneBar.classList.add("inactive");
    setTimeout(() => {
      if (cloneBar) {
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

  function createClone() {
    if (cloneBar) return;
    cloneBar = searchBar.cloneNode(true);
    cloneBar.classList.add("search-bar-clone");
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
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("clone-buttons-container");
    const clonedCatBtn = document.createElement("button");
    clonedCatBtn.id = "cloned-open-categories";
    clonedCatBtn.classList.add("clone-category-button");
    clonedCatBtn.textContent = isCategoryOpen ? "✕" : "☰";
    clonedCategoryButton = clonedCatBtn;
    const chatBtn = document.createElement("button");
    chatBtn.id = "chat-button-clone";
    chatBtn.classList.add("chat-button", "clone-category-button");
    chatBtn.setAttribute("data-open-tab", "true");
    chatBtn.setAttribute("data-tab-title", "Чат");
    chatBtn.setAttribute("data-tab-url", "/pages/chat.html");
    chatBtn.innerHTML = '<i class="ri-chat-1-line"></i>';
    const scrollTopBtn = document.createElement("button");
    scrollTopBtn.id = "scroll-top-button";
    scrollTopBtn.classList.add("scroll-top-button");
    scrollTopBtn.innerHTML = '<i class="ri-arrow-up-double-line"></i>';
    buttonsContainer.appendChild(clonedCatBtn);
    buttonsContainer.appendChild(chatBtn);
    buttonsContainer.appendChild(scrollTopBtn);
    cloneBar.appendChild(buttonsContainer);
    document.body.appendChild(cloneBar);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cloneBar.classList.add("active");
      });
    });
    if (cloneInput) {
      cloneInput.addEventListener("input", syncInputs);
      cloneInput.addEventListener("focus", cloneFocus);
      cloneInput.addEventListener("blur", cloneBlur);
      cloneInput.addEventListener("input", () => {
        const textWidth = cloneInput.scrollWidth;
        if (
          textWidth > cloneInput.clientWidth &&
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
    if (cloneBtn) {
      cloneBtn.addEventListener("click", () => {
        searchButton.click();
      });
    }
    clonedCatBtn.addEventListener("click", toggleCategoryDrawer);
    scrollTopBtn.addEventListener("click", scrollToTop);
  }

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

  function cloneFocus() {
    isFocused = true;
    cloneBar.classList.add("focused");
    searchBar.classList.add("focused");
  }

  function cloneBlur() {
    isFocused = false;
    cloneBar.classList.remove("focused");
    searchBar.classList.remove("focused");
    if (window.scrollY === 0) {
      removeClone();
    }
  }

  function handleFocus() {
    if (isScrolled) {
      isFocused = true;
      searchBar.classList.add("focused");
      if (cloneBar) cloneBar.classList.add("focused");
    }
  }

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
  let superActiveTitle = null; // Текущая супер-активная категория
  let categories = [];

  const isMobile = window.matchMedia("(max-width: 800px)").matches;
  if (isMobile && subcategoriesContainer) {
    subcategoriesContainer.parentNode.removeChild(subcategoriesContainer);
  }

  // Вспомогательные функции для анимированного раскрытия/закрытия
  function expandSection(section) {
    // Устанавливаем max-height равным scrollHeight и после transition устанавливаем "none"
    section.style.maxHeight = section.scrollHeight + "px";
    section.addEventListener("transitionend", function handler(e) {
      if (e.propertyName === "max-height") {
        section.style.maxHeight = "none";
        section.removeEventListener("transitionend", handler);
      }
    });
  }

  function collapseSection(section) {
    // Устанавливаем текущую высоту, затем в следующем кадре устанавливаем 0
    section.style.maxHeight = section.scrollHeight + "px";
    section.offsetHeight; // принудительный reflow
    section.style.maxHeight = "0px";
  }

  // Функция закрытия соседних элементов (только один открытый на уровне)
  function closeSiblingSubcats(clickedTitle) {
    const parentContainer = clickedTitle.parentNode.parentNode; // контейнер с .accordion-subcat
    const siblingBlocks = parentContainer.querySelectorAll(".accordion-subcat");
    siblingBlocks.forEach((block) => {
      const title = block.querySelector(".accordion-subcat-title");
      if (
        title &&
        title !== clickedTitle &&
        title.classList.contains("expanded")
      ) {
        const content = title.nextElementSibling;
        if (content) {
          collapseSection(content);
        }
        title.classList.remove("expanded");
      }
    });
  }

  // Функция создания содержимого аккордеона с поддержкой вложенности (мобильная версия)
  function createAccordionContent(category, level = 0) {
    const accordionContent = document.createElement("div");
    accordionContent.className = "accordion-content";
    accordionContent.style.maxHeight = "0px";
    category.subcategories?.forEach((subcat) => {
      const subcatBlock = document.createElement("div");
      subcatBlock.className = "accordion-subcat";
      subcatBlock.dataset.level = level;
      const subcatTitle = document.createElement("div");
      subcatTitle.className = "accordion-subcat-title";
      subcatTitle.style.paddingLeft = `${30 * (level + 1)}px`;
      subcatTitle.textContent = subcat.title;
      if (
        (subcat.subcategories && subcat.subcategories.length) ||
        (subcat.subitems && subcat.subitems.length)
      ) {
        const arrow = document.createElement("span");
        arrow.className = "accordion-arrow";
        arrow.innerHTML = "&#9660;";
        subcatTitle.appendChild(arrow);
      }
      subcatBlock.appendChild(subcatTitle);
      if (subcat.subcategories && subcat.subcategories.length) {
        const nestedContent = createAccordionContent(subcat, level + 1);
        subcatBlock.appendChild(nestedContent);
      }
      if (subcat.subitems && subcat.subitems.length) {
        const subitemsContainer = document.createElement("div");
        subitemsContainer.className = "accordion-subitems";
        subitemsContainer.style.maxHeight = "0px";
        subcat.subitems.forEach((item) => {
          const itemEl = document.createElement("div");
          itemEl.className = "accordion-subitem";
          itemEl.style.paddingLeft = `${30 * (level + 2)}px`;
          itemEl.textContent = item;
          subitemsContainer.appendChild(itemEl);
        });
        subcatBlock.appendChild(subitemsContainer);
      }
      accordionContent.appendChild(subcatBlock);
    });
    return accordionContent;
  }

  // Функция переключения аккордеона для верхнего уровня (мобильная версия)
  function toggleAccordion(category, groupTitleEl) {
    let accordionContent = groupTitleEl.nextElementSibling;
    const parent = groupTitleEl.parentNode;
    if (parent) {
      parent.querySelectorAll(".group-title.active").forEach((title) => {
        if (title !== groupTitleEl) {
          title.classList.remove("active");
          const content = title.nextElementSibling;
          if (content?.classList.contains("accordion-content")) {
            collapseSection(content);
          }
        }
      });
    }
    if (
      accordionContent &&
      accordionContent.classList.contains("accordion-content")
    ) {
      if (groupTitleEl.classList.contains("active")) {
        collapseSection(accordionContent);
        groupTitleEl.classList.remove("active");
      } else {
        collapseAllSiblingsGroup(groupTitleEl);
        expandSection(accordionContent);
        groupTitleEl.classList.add("active");
      }
    } else {
      const newAccordion = createAccordionContent(category);
      groupTitleEl.insertAdjacentElement("afterend", newAccordion);
      newAccordion.offsetHeight;
      expandSection(newAccordion);
      groupTitleEl.classList.add("active");
    }
    updateParentAccordions(groupTitleEl);
  }

  // Закрывает открытые элементы на том же уровне для главных категорий (мобильная версия)
  function collapseAllSiblingsGroup(clickedGroup) {
    const parent = clickedGroup.parentNode;
    parent.querySelectorAll(".group-title.active").forEach((title) => {
      if (title !== clickedGroup) {
        title.classList.remove("active");
        const content = title.nextElementSibling;
        if (content?.classList.contains("accordion-content")) {
          collapseSection(content);
        }
      }
    });
  }

  // Универсальный обработчик для всех уровней вложенности подкатегорий (мобильная версия)
  function setupSubcategoryToggles() {
    document.body.addEventListener("click", function (e) {
      const subcatTitle = e.target.closest(".accordion-subcat-title");
      if (!subcatTitle) return;
      e.stopPropagation();
      // Закрываем все открытые соседние подкатегории на этом уровне
      closeSiblingSubcats(subcatTitle);
      const content = subcatTitle.nextElementSibling;
      if (!content) return;
      const computedMaxHeight = window.getComputedStyle(content).maxHeight;
      if (computedMaxHeight === "0px" || computedMaxHeight === "0") {
        expandSection(content);
        subcatTitle.classList.add("expanded");
      } else {
        collapseSection(content);
        subcatTitle.classList.remove("expanded");
      }
      updateParentAccordions(subcatTitle);
    });
  }

  function updateParentAccordions(element) {
    let parentAccordion = element.closest(".accordion-content");
    while (parentAccordion) {
      if (parentAccordion.style.maxHeight !== "none") {
        parentAccordion.style.maxHeight = parentAccordion.scrollHeight + "px";
      }
      parentAccordion =
        parentAccordion.parentNode.closest(".accordion-content");
    }
  }

  setupSubcategoryToggles();

  // Функция для десктопной версии: показываем подкатегории в виде колонок
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
      if (category) showSubcategories(category);
    }
  }

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
      categories.forEach((cat) => {
        let element;
        if (cat.isSeparator) {
          element = document.createElement("div");
          element.className = "sidebar-separator";
          if (cat.indent) {
            element.style.marginLeft = cat.indent + "px";
            element.style.marginRight = cat.indent + "px";
          }
          element.style.height = "1px";
          element.style.backgroundColor = "#ccc";
          element.style.pointerEvents = "none";
        } else {
          element = document.createElement("div");
          element.className = "group-title";
          element.setAttribute("data-slug", cat.slug);
          if (cat.icon) {
            const icon = document.createElement("i");
            icon.className = cat.icon;
            element.appendChild(icon);
          } else {
            const defaultIcon = document.createElement("i");
            defaultIcon.className = "ri-folder-line";
            element.appendChild(defaultIcon);
          }
          const text = document.createElement("span");
          text.textContent = cat.title;
          element.appendChild(text);
          if (
            isMobile &&
            ((cat.subcategories && cat.subcategories.length) ||
              (cat.subitems && cat.subitems.length))
          ) {
            const arrow = document.createElement("span");
            arrow.className = "accordion-arrow";
            arrow.innerHTML = "&#9660;";
            element.appendChild(arrow);
          }
          if (isMobile) {
            element.addEventListener("click", (e) => {
              e.stopPropagation();
              // Если элемент уже открыт – закрываем его, иначе открываем и закрываем другие ветки на этом уровне
              if (element.classList.contains("active")) {
                collapseSection(element.nextElementSibling);
                element.classList.remove("active");
              } else {
                collapseAllSiblingsGroup(element);
                toggleAccordion(cat, element);
              }
            });
          } else {
            element.addEventListener("mouseenter", () => {
              document
                .querySelectorAll(".group-title.active")
                .forEach((el) => el.classList.remove("active"));
              element.classList.add("active");
              showSubcategories(cat);
            });
            element.addEventListener("click", (e) => {
              e.stopPropagation();
              setSuperActive(element);
              showSubcategories(cat);
            });
          }
        }
        sidebar.appendChild(element);
      });
      if (!isMobile) {
        const firstTitle = sidebar.querySelector(".group-title");
        if (firstTitle) {
          setSuperActive(firstTitle);
          showSubcategories(categories[0]);
        }
      }
    })
    .catch((err) => {
      console.error("Ошибка при загрузке категорий:", err);
    });

  if (sidebar && !isMobile) {
    sidebar.addEventListener("mouseleave", () => {
      document
        .querySelectorAll(".group-title.active")
        .forEach((el) => el.classList.remove("active"));
      showSuperActiveSubcategories();
    });
  }

  // ========================================================
  // Логика выбора города (ранее city.js)
  // ========================================================
  const currentCityElements = document.querySelectorAll("#currentCity");
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

  function selectCity(name) {
    currentCityElements.forEach((el) => {
      el.innerHTML = `<span>${name}</span>`;
    });
    cityButtons.forEach((btn) => {
      btn.classList.remove("no-city-chosen");
    });
    closeCityDrawer();
    toggleButton.textContent = "Выбрать на карте";
  }

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
      if (clusterer.getGeoObjects().length) {
        mapSelection.setBounds(clusterer.getBounds(), { checkZoomRange: true });
      }
      window.selectOffice = function (name) {
        currentCityElements.forEach((el) => {
          el.innerHTML = `<span>${name}</span>`;
        });
        cityButtons.forEach((btn) => {
          btn.classList.remove("no-city-chosen");
        });
        closeCityDrawer();
        toggleButton.textContent = "Выбрать на карте";
      };
      mapLoading.remove();
    } catch (error) {
      console.error("Ошибка при инициализации карты выбора:", error);
      mapLoading.innerHTML = "<p>Не удалось загрузить карту.</p>";
    }
  }

  citySearchInput.addEventListener("input", (e) => {
    filterCities(e.target.value);
  });
  citySearchIcon.addEventListener("click", () => {
    filterCities(citySearchInput.value);
  });

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
