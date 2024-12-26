document.addEventListener("DOMContentLoaded", () => {
  // ============================
  // Функционал категорий (categories.js)
  // ============================

  const openCategoriesButton = document.getElementById("open-categories");
  const categoryDrawer = document.getElementById("categoryDrawer");
  const overlay = document.getElementById("overlay");

  // Функция для обновления текста кнопок категорий
  const updateCategoryButtons = () => {
    const isOpen = categoryDrawer.classList.contains("open");

    // Текст для оригинальной кнопки
    const newTextOriginal = isOpen ? "Категории ✕" : "Категории ☰";

    // Текст для клонированной кнопки (только символы)
    const newTextClone = isOpen ? "✕" : "☰";

    // Обновляем оригинальную кнопку
    if (openCategoriesButton) {
      openCategoriesButton.textContent = newTextOriginal;
    }

    // Обновляем клонированную кнопку, если она существует
    if (cloneBar) {
      const clonedCategoryButton = cloneBar.querySelector(
        "#cloned-open-categories"
      );
      if (clonedCategoryButton) {
        clonedCategoryButton.textContent = newTextClone;
      }
    }
  };

  // Функция для открытия/закрытия шторки категорий
  const toggleCategoryDrawer = (event) => {
    event.preventDefault();
    categoryDrawer.classList.toggle("open");
    overlay.style.display = categoryDrawer.classList.contains("open")
      ? "block"
      : "none";
    updateCategoryButtons();
  };

  if (openCategoriesButton && categoryDrawer && overlay) {
    // Обработчик для открытия/закрытия шторки
    openCategoriesButton.addEventListener("click", toggleCategoryDrawer);

    // Обработчик для закрытия шторки при клике на overlay
    overlay.addEventListener("click", () => {
      categoryDrawer.classList.remove("open");
      overlay.style.display = "none";
      updateCategoryButtons();
    });
  } else {
    console.error("Элементы для категорий не найдены в DOM.");
  }

  // ============================
  // Виджет поиска и еще пары кнопок (script.js)
  // ============================

  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const searchBar = document.querySelector(".search-bar");

  if (!searchInput || !searchButton || !searchBar) {
    console.error("Элементы поиска не найдены в DOM.");
    return;
  }

  let cloneBar = null;
  let isScrolled = false;
  let isFocused = false;
  let isSyncing = false;

  const syncInputs = (e) => {
    if (isSyncing) return;
    isSyncing = true;
    if (cloneBar) {
      const cloneInput = cloneBar.querySelector("#searchInputClone");
      const originalInput = document.getElementById("searchInput");

      if (e.target.id === "searchInput") {
        if (cloneInput) cloneInput.value = originalInput.value;
      } else if (e.target.id === "searchInputClone") {
        originalInput.value = cloneInput.value;
      }
    }
    isSyncing = false;
  };

  const createClone = () => {
    if (cloneBar) return;

    cloneBar = searchBar.cloneNode(true);
    cloneBar.classList.add("search-bar-clone");

    // Обновляем ID для клонированных элементов
    const cloneInput = cloneBar.querySelector("#searchInput");
    const cloneButton = cloneBar.querySelector("#searchButton");

    if (cloneInput) {
      cloneInput.id = "searchInputClone";
      cloneInput.value = searchInput.value;
      cloneInput.placeholder = "Поиск товаров..."; // Устанавливаем фиксированный плейсхолдер
    }

    if (cloneButton) {
      cloneButton.id = "searchButtonClone";
    }

    // Добавляем контейнер для дополнительных кнопок
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("clone-buttons-container");

    // Создаём кнопку категории в клоне
    const clonedCategoryButton = document.createElement("button");
    clonedCategoryButton.id = "cloned-open-categories";
    clonedCategoryButton.classList.add("clone-category-button");
    clonedCategoryButton.textContent = categoryDrawer.classList.contains("open")
      ? "✕"
      : "☰"; // Только символы

    // Создаём кнопку прокрутки вверх
    const scrollTopButton = document.createElement("button");
    scrollTopButton.id = "scroll-top-button";
    scrollTopButton.classList.add("scroll-top-button");

    // Добавляем иконку с классом ri-arrow-up-double-line
    scrollTopButton.innerHTML = '<i class="ri-arrow-up-double-line"></i>';

    // Добавляем кнопки в контейнер
    buttonsContainer.appendChild(clonedCategoryButton);
    buttonsContainer.appendChild(scrollTopButton);

    // Добавляем контейнер в cloneBar
    cloneBar.appendChild(buttonsContainer);

    document.body.appendChild(cloneBar);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cloneBar.classList.add("active");
      });
    });

    const cloneSearchInput = cloneBar.querySelector(".search-input");
    const cloneSearchButton = cloneBar.querySelector(".search-button");

    if (cloneSearchInput) {
      cloneSearchInput.addEventListener("input", syncInputs);
      cloneSearchInput.addEventListener("input", () => {
        const textWidth = cloneSearchInput.scrollWidth;
        if (
          textWidth > cloneSearchInput.clientWidth &&
          cloneBar.classList.contains("focused") &&
          cloneBar.offsetWidth < 500
        ) {
          cloneBar.classList.add("expanded");
          // Добавляем класс для кнопок, чтобы они оставались на месте
          buttonsContainer.classList.add("fixed-buttons");
        } else {
          cloneBar.classList.remove("expanded");
          buttonsContainer.classList.remove("fixed-buttons");
        }
      });
      cloneSearchInput.addEventListener("focus", () => {
        isFocused = true;
        cloneBar.classList.add("focused");
        searchBar.classList.add("focused");
        // Добавляем класс для смещения кнопки
        cloneBar.classList.add("button-shifted");
      });
      cloneSearchInput.addEventListener("blur", () => {
        isFocused = false;
        cloneBar.classList.remove("focused");
        searchBar.classList.remove("focused");
        // Удаляем класс смещения кнопки
        cloneBar.classList.remove("button-shifted");
        if (window.scrollY === 0) {
          removeClone();
        }
      });
    }

    if (cloneSearchButton) {
      cloneSearchButton.addEventListener("click", () => {
        searchButton.click();
      });
    }

    // Обработчики для новых кнопок
    if (clonedCategoryButton) {
      clonedCategoryButton.addEventListener("click", toggleCategoryDrawer);
    }

    if (scrollTopButton) {
      scrollTopButton.addEventListener("click", () => {
        const scrollDuration = 100; // Длительность в миллисекундах
        const scrollStep = window.scrollY / (scrollDuration / 16); // Рассчитываем шаг (FPS ~ 60)

        const scrollToTop = () => {
          if (window.scrollY > 0) {
            window.scrollTo(0, window.scrollY - scrollStep);
            requestAnimationFrame(scrollToTop); // Повторяем до достижения верха
          }
        };

        requestAnimationFrame(scrollToTop); // Запускаем анимацию
      });
    }
  };

  const removeClone = () => {
    if (!cloneBar) return;

    cloneBar.classList.remove("active");
    cloneBar.classList.add("inactive");

    setTimeout(() => {
      if (cloneBar) {
        const cloneInput = cloneBar.querySelector("#searchInputClone");
        const cloneButton = cloneBar.querySelector("#searchButtonClone");
        const clonedCategoryButton = cloneBar.querySelector(
          "#cloned-open-categories"
        );
        const scrollTopButton = cloneBar.querySelector("#scroll-top-button");

        if (cloneInput) {
          cloneInput.removeEventListener("input", syncInputs);
          cloneInput.removeEventListener("input", () => {
            const textWidth = cloneInput.scrollWidth;
            if (
              textWidth > cloneInput.clientWidth &&
              cloneBar.classList.contains("focused") &&
              cloneBar.offsetWidth < 500
            ) {
              cloneBar.classList.add("expanded");
            } else {
              cloneBar.classList.remove("expanded");
            }
          });
          cloneInput.removeEventListener("focus", () => {
            isFocused = true;
            cloneBar.classList.add("focused");
            searchBar.classList.add("focused");
          });
          cloneInput.removeEventListener("blur", () => {
            isFocused = false;
            cloneBar.classList.remove("focused");
            searchBar.classList.remove("focused");
            if (window.scrollY === 0) {
              removeClone();
            }
          });
        }

        if (cloneButton) {
          cloneButton.removeEventListener("click", () => {
            searchButton.click();
          });
        }

        if (clonedCategoryButton) {
          clonedCategoryButton.removeEventListener(
            "click",
            toggleCategoryDrawer
          );
        }

        if (scrollTopButton) {
          scrollTopButton.removeEventListener("click", () => {
            // Изменено с addEventListener на removeEventListener
            const scrollDuration = 100; // Длительность в миллисекундах
            const scrollStep = window.scrollY / (scrollDuration / 16); // Рассчитываем шаг (FPS ~ 60)

            const scrollToTop = () => {
              if (window.scrollY > 0) {
                window.scrollTo(0, window.scrollY - scrollStep);
                requestAnimationFrame(scrollToTop); // Повторяем до достижения верха
              }
            };

            requestAnimationFrame(scrollToTop); // Запускаем анимацию
          });
        }

        cloneBar.remove();
        cloneBar = null;
      }
    }, 300); // Соответствует transition-duration: 0.3s
  };

  const applyScrolledClasses = () => {
    isScrolled = true;
    searchBar.classList.add("scrolled");
    createClone();
  };

  const resetToInitial = () => {
    isScrolled = false;
    searchBar.classList.remove("scrolled", "focused");
    removeClone();
  };

  const handleScroll = () => {
    if (window.scrollY > 0 && !isScrolled) {
      applyScrolledClasses();
    } else if (window.scrollY === 0 && isScrolled && !isFocused) {
      resetToInitial();
    }
  };

  const handleFocus = () => {
    if (isScrolled) {
      isFocused = true;
      searchBar.classList.add("focused");
      if (cloneBar) {
        cloneBar.classList.add("focused");
      }
    }
  };

  const handleBlur = (event) => {
    if (isScrolled) {
      isFocused = false;
      searchBar.classList.remove("focused");
      if (cloneBar) {
        cloneBar.classList.remove("focused");
      }

      // Проверяем, произошел ли клик внутри cloneBar
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInsideCloneBar = cloneBar && cloneBar.contains(activeElement);

        if (!isInsideCloneBar && window.scrollY === 0) {
          resetToInitial();
        }
      }, 0);
    }
  };

  window.addEventListener("scroll", handleScroll);
  searchInput.addEventListener("input", syncInputs);
  searchInput.addEventListener("focus", handleFocus);
  searchInput.addEventListener("blur", handleBlur);
});

// ============================
// Функционал разделеления и подгрузки категорий (categorymodule.js)
// ============================

const sidebar = document.querySelector("#category-module .sidebar");
const subcategoriesContainer = document.querySelector(
  "#category-module .subcategories-container"
);

let superActiveTitle = null; // Текущая супер активная категория

// Функция отображения подкатегорий
function showSubcategories(category) {
  // Очищаем контейнер
  subcategoriesContainer.innerHTML = "";
  subcategoriesContainer.classList.add("active");

  // Создаем контейнер для колонок
  const columnsContainer = document.createElement("div");
  columnsContainer.className = "columns-container";

  // Определяем количество колонок
  const numColumns = 3;
  const columns = [];

  // Создаем колонки
  for (let i = 0; i < numColumns; i++) {
    const col = document.createElement("div");
    col.className = "subcategory-column";
    columnsContainer.appendChild(col);
    columns.push(col);
  }

  // Распределяем подкатегории по колонкам
  category.subcategories.forEach((subcat, index) => {
    const colindex = index % numColumns;
    const column = columns[colindex];

    const block = document.createElement("div");
    block.className = "subcategory-block";

    const titleEl = document.createElement("div");
    titleEl.className = "subcategory-title";
    titleEl.textContent = subcat.title;

    block.appendChild(titleEl);

    // Проверяем наличие subitems
    if (Array.isArray(subcat.subitems) && subcat.subitems.length > 0) {
      const itemsEl = document.createElement("div");
      itemsEl.className = "subcategory-items active";

      // Ограничение на количество отображаемых элементов
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

      // Если есть больше элементов, добавляем кнопку "Показать ещё"
      if (hasMore) {
        const showMoreEl = document.createElement("div");
        showMoreEl.className = "show-more";
        showMoreEl.textContent = "Показать ещё";
        showMoreEl.addEventListener("click", () => {
          // Проверяем, не добавлены ли уже все элементы
          if (subcat.subitems.length > itemsEl.children.length) {
            const remainingItems = subcat.subitems.slice(
              itemsEl.children.length
            );
            remainingItems.forEach((item) => {
              const itemEl = document.createElement("div");
              itemEl.className = "subcategory-item";
              itemEl.textContent = item;
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

// Функция для установки супер активного состояния
function setSuperActive(titleElement) {
  if (superActiveTitle) {
    superActiveTitle.classList.remove("super-active");
  }
  superActiveTitle = titleElement;
  superActiveTitle.classList.add("super-active");
}

// Функция для отображения подкатегорий super-active категории
function showSuperActiveSubcategories() {
  if (superActiveTitle) {
    const slug = superActiveTitle.getAttribute("data-slug");
    const category = categories.find((cat) => cat.slug === slug);
    if (category) {
      showSubcategories(category);
    }
  }
}

let categories = []; // Хранение категорий из JSON

// Загружаем данные из JSON
fetch("/data/category.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.statusText}`);
    }
    return response.json();
  })
  .then((data) => {
    categories = data.categories || [];

    if (categories.length === 0) {
      console.warn("Категории отсутствуют в JSON.");
      return;
    }

    // Создаем список категорий в сайдбаре
    categories.forEach((cat) => {
      const groupTitle = document.createElement("div");
      groupTitle.className = "group-title";
      groupTitle.setAttribute("data-slug", cat.slug);

      // Добавляем иконку к категории из JSON
      if (cat.icon) {
        const icon = document.createElement("i");
        icon.className = cat.icon;
        groupTitle.appendChild(icon);
      } else {
        // Если иконка не указана, используем стандартную
        const defaultIcon = document.createElement("i");
        defaultIcon.className = "ri-folder-line";
        groupTitle.appendChild(defaultIcon);
      }

      const text = document.createElement("span");
      text.textContent = cat.title;
      groupTitle.appendChild(text);

      // Обработчик наведения мыши (mouseenter)
      groupTitle.addEventListener("mouseenter", () => {
        groupTitle.classList.add("active");
        showSubcategories(cat);
      });

      // Обработчик ухода мыши (mouseleave)
      groupTitle.addEventListener("mouseleave", () => {
        groupTitle.classList.remove("active");
        // Проверяем, находится ли курсор над сайдбаром
        // Если нет, покажем super-active подкатегории
        // Это будет обработано глобальным обработчиком
      });

      // Обработчик клика для установки super-active
      groupTitle.addEventListener("click", (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события

        // Устанавливаем супер активный заголовок
        setSuperActive(groupTitle);

        // Отображаем подкатегории для супер активного заголовка
        showSubcategories(cat);
      });

      sidebar.appendChild(groupTitle);
    });

    // Автоматически устанавливаем первую категорию как super-active
    const firstTitle = sidebar.querySelector(".group-title");
    if (firstTitle) {
      setSuperActive(firstTitle);
      const firstCategory = categories[0];
      showSubcategories(firstCategory);
    }
  })
  .catch((err) => {
    console.error("Ошибка при загрузке категорий:", err);
  });

// Обработчик ухода курсора с сайдбара (mouseleave)
if (sidebar) {
  // Обработчик ухода курсора с сайдбара (mouseleave)
  sidebar.addEventListener("mouseleave", () => {
    showSuperActiveSubcategories();
  });

  // Обработчик наведения курсора на сайдбар (mouseenter)
  sidebar.addEventListener("mouseenter", () => {
    // Можно добавить дополнительные действия при наведении на сайдбар
  });
}
