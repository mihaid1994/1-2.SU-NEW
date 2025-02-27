window.initFilterMenu = function (root = document) {
  // Логика работы с секциями фильтров: если в секции больше 5 элементов, включаем вертикальную прокрутку
  const filterSectionContents = root.querySelectorAll(
    ".filter-section-content"
  );
  filterSectionContents.forEach((section) => {
    const childCount = section.querySelectorAll("label").length;
    if (childCount > 5) {
      section.setAttribute("data-scroll-limit", "true");
      section.style.maxHeight = "10rem";
      section.style.overflowY = "auto";
    } else {
      section.setAttribute("data-scroll-limit", "false");
      section.style.maxHeight = "unset";
      section.style.overflowY = "unset";
    }
  });

  // Изначальное состояние фильтров: обновляем стрелочки и состояние секций
  const filterSections = root.querySelectorAll(".filter-section");
  filterSections.forEach((section) => {
    const header = section.querySelector("h3");
    const content = section.querySelector(".filter-section-content");
    if (!header || !content) return;

    const isInitiallyExpanded =
      content.style.display === "block" || !content.style.display;

    // Особое правило: «Столбцы» всегда должны быть свернуты
    if (header.textContent.includes("Столбцы")) {
      content.style.display = "none";
      header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▼");
    } else {
      if (isInitiallyExpanded) {
        content.style.display = "block";
        header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▲");
      } else {
        content.style.display = "none";
        header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▼");
      }
    }
  });

  // Функция обновления количества выбранных чекбоксов в заголовках секций
  function updateGroupheaders() {
    root.querySelectorAll(".filter-section").forEach((section) => {
      const header = section.querySelector("h3");
      const content = section.querySelector(".filter-section-content");
      if (!header || !content) return;

      const checkboxes = content.querySelectorAll("input[type='checkbox']");
      const checkedCount = content.querySelectorAll(
        "input[type='checkbox']:checked"
      ).length;

      // Убираем из заголовка старое число (если оно есть)
      const baseTitle = header.textContent.replace(/\s*\(\d+\)/, "");

      // Записываем новый заголовок с количеством выбранных элементов
      header.textContent = `${baseTitle} (${checkedCount})`;

      // Восстанавливаем стрелочку: если секция развернута – показываем ▲, иначе ▼
      if (content.style.display === "block") {
        header.innerHTML = header.innerHTML.replace(/▼/g, "▲");
      } else {
        header.innerHTML = header.innerHTML.replace(/▲/g, "▼");
      }
    });
  }

  // Обработчики изменения чекбоксов
  root
    .querySelectorAll(".filter-section-content input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        updateGroupheaders();
      });
    });

  // Обработчик для кнопки "Сбросить все"
  const resetButton = root.querySelector(".filter-actions .reset");
  if (resetButton) {
    resetButton.addEventListener("click", function () {
      const sections = root.querySelectorAll(".filter-section");
      sections.forEach((section) => {
        const checkboxes = section.querySelectorAll("input[type='checkbox']");
        checkboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });
      });
      updateGroupheaders();

      // Сбрасываем слайдер в диапазон [50, 30000]
      const sliderElement = root.getElementById("priceSlider");
      if (sliderElement && sliderElement.noUiSlider) {
        sliderElement.noUiSlider.set([50, 30000]);
      }

      // Обнулим также поля ввода "От" / "До", если нужно:
      const priceInputFrom = root.getElementById("priceInputFrom");
      const priceInputTo = root.getElementById("priceInputTo");
      if (priceInputFrom) priceInputFrom.value = "";
      if (priceInputTo) priceInputTo.value = "";
    });
  }

  // Функция для переключения состояния отдельной секции
  function toggleSection(header) {
    const content = header.nextElementSibling;
    if (!content) return;
    const isExpanded = content.style.display === "block";
    content.style.display = isExpanded ? "none" : "block";
    header.innerHTML = header.innerHTML.replace(
      isExpanded ? "▲" : "▼",
      isExpanded ? "▼" : "▲"
    );
  }

  // Навешиваем обработчики на заголовки секций
  const sectionHeaders = root.querySelectorAll(".filter-section h3");
  sectionHeaders.forEach((header) => {
    header.style.cursor = "pointer";
    header.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleSection(header);
      updateGroupheaders();
    });
  });

  // Логика для сворачивания/разворачивания всего сайдбара
  const toggleFiltersBtn = root.getElementById("toggleFilters");
  const filtersPanel = root.getElementById("filters-panel");
  const contentArea = root.querySelector(".content-area");

  if (toggleFiltersBtn && filtersPanel) {
    toggleFiltersBtn.addEventListener("click", function () {
      if (filtersPanel.classList.contains("collapsed")) {
        filtersPanel.classList.remove("collapsed");
        toggleFiltersBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
        if (contentArea) {
          contentArea.style.width = "";
        }
      } else {
        filtersPanel.classList.add("collapsed");
        toggleFiltersBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
        if (contentArea) {
          contentArea.style.width = "100%";
        }
      }
      // Если активен карточный вид, обновляем его через событие resize
      if (document.body.classList.contains("card-view")) {
        window.dispatchEvent(new Event("resize"));
      }
    });
  }

  // *** noUiSlider: инициализация слайдера цены ***
  const sliderElement = root.getElementById("priceSlider");
  if (sliderElement && typeof noUiSlider !== "undefined") {
    noUiSlider.create(sliderElement, {
      start: [500, 10000], // Пример начального значения
      connect: true,
      step: 50, // шаг прокрутки
      range: {
        min: 50,
        max: 30000,
      },
    });

    // Поля ввода
    const priceInputFrom = root.getElementById("priceInputFrom");
    const priceInputTo = root.getElementById("priceInputTo");

    // При движении ползунков — обновляем инпуты
    sliderElement.noUiSlider.on("update", function (values, handle) {
      const value = Math.round(values[handle]);
      if (handle === 0 && priceInputFrom) {
        priceInputFrom.value = value;
      } else if (handle === 1 && priceInputTo) {
        priceInputTo.value = value;
      }
    });

    // При изменении инпутов — обновляем ползунки
    if (priceInputFrom) {
      priceInputFrom.addEventListener("change", function () {
        sliderElement.noUiSlider.set([this.value, null]);
      });
    }
    if (priceInputTo) {
      priceInputTo.addEventListener("change", function () {
        sliderElement.noUiSlider.set([null, this.value]);
      });
    }
  }
  // *** конец блока noUiSlider ***

  return { toggleFilterMenu: undefined, toggleSection };
};

document.addEventListener("DOMContentLoaded", function () {
  window.initFilterMenu(document);
});
