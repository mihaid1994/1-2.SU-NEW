// --- Завёрнутый Скрипт: initFilterMenu ---
window.initFilterMenu = function (root = document) {
  // 1) ЛОГИКА «СВЕРНУТЬ/РАЗВЕРНУТЬ» В МЕНЮ ПОИСКА
  const searchMenu = root.querySelector(".search-menu");
  const toggleButton = root.querySelector(".toggle-button");

  if (toggleButton && searchMenu) {
    toggleButton.addEventListener("click", function () {
      searchMenu.classList.toggle("collapsed");
      const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
      toggleButton.setAttribute("aria-expanded", !isExpanded);
      toggleButton.innerHTML = isExpanded ? "&#9660;" : "&#9650;"; // ▼ или ▲
    });
  }

  // 2) ЛОГИКА ДЛЯ ФИЛЬТРОВ
  // Добавляем прокрутку при большом числе элементов
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

    // Проверяем изначальное состояние (свернуто/раскрыто)
    const isInitiallyExpanded =
      content.style.display === "block" || !content.style.display;

    // Особое правило: «Столбцы» должны быть свернуты
    if (header.textContent.includes("Столбцы")) {
      content.style.display = "none";
      // Устанавливаем стрелочку вниз
      header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▼");
    } else {
      // Для остальных секций
      if (isInitiallyExpanded) {
        content.style.display = "block";
        header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▲");
      } else {
        content.style.display = "none";
        header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▼");
      }
    }
  });

  // Функция для обновления количества выбранных чекбоксов в заголовках
  function updateGroupheaders() {
    root.querySelectorAll(".filter-section").forEach((section) => {
      const header = section.querySelector("h3");
      const content = section.querySelector(".filter-section-content");
      if (!header || !content) return;

      const checkboxes = content.querySelectorAll("input[type='checkbox']");
      const checkedCount = content.querySelectorAll(
        "input[type='checkbox']:checked"
      ).length;

      // Убираем из заголовка старые «(число)»
      const baseTitle = header.textContent.replace(/\s*\(\d+\)/, "");

      // Добавляем новое число
      header.textContent = `${baseTitle} (${checkedCount})`;

      // Возвращаем стрелочку
      if (content.style.display === "block") {
        header.innerHTML = header.innerHTML.replace(/▼/g, "▲");
      } else {
        header.innerHTML = header.innerHTML.replace(/▲/g, "▼");
      }
    });
  }

  // Функция для правильного склонения слова «условие»
  function getConditionText(count) {
    const conditionDeclension = {
      1: "условие",
      2: "условия",
      3: "условия",
      4: "условия",
      5: "условий",
      default: "условий",
    };

    const remainder100 = count % 100;
    if (remainder100 >= 11 && remainder100 <= 19) {
      return `${count} ${conditionDeclension.default}`;
    }
    const remainder10 = count % 10;
    if (remainder10 === 1) {
      return `${count} ${conditionDeclension[1]}`;
    } else if (remainder10 >= 2 && remainder10 <= 4) {
      return `${count} ${conditionDeclension[2]}`;
    } else {
      return `${count} ${conditionDeclension.default}`;
    }
  }

  // Функция для общего количества выбранных условий рядом с иконкой настроек
  function updateSettingsCount() {
    let totalSelected = 0;
    root.querySelectorAll(".filter-section").forEach((section) => {
      const header = section.querySelector("h3");
      if (!header) return;
      // Пропускаем секцию «Столбцы»
      if (header.textContent.includes("Столбцы")) return;

      const checkedCount = section.querySelectorAll(
        ".filter-section-content input[type='checkbox']:checked"
      ).length;
      totalSelected += checkedCount;
    });

    const settingsCount = root.getElementById("settings-count");
    if (settingsCount) {
      settingsCount.textContent = `(${getConditionText(totalSelected)})`;
      settingsCount.style.display = "inline";
    }
  }

  // Сброс всех чекбоксов (кроме «Столбцы»)
  function resetAllFilters() {
    const filterSections = Array.from(
      root.querySelectorAll(".filter-section")
    ).filter(
      (section) => !section.querySelector("h3")?.textContent.includes("Столбцы")
    );

    filterSections.forEach((section) => {
      const checkboxes = section.querySelectorAll("input[type='checkbox']");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    });

    updateGroupheaders();
    updateSettingsCount();
  }

  // Вешаем обработчики на чекбоксы (динамическое обновление заголовков и счётчика)
  root
    .querySelectorAll(".filter-section-content input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        updateGroupheaders();
        updateSettingsCount();
      });
    });

  // Привязка функции сброса к кнопке «Сбросить все»
  const resetButton = root.querySelector(".filter-actions .reset");
  if (resetButton) {
    resetButton.addEventListener("click", function () {
      resetAllFilters();
    });
  }

  // Изначально сбрасываем все фильтры (кроме «Столбцы») и обновляем состояние
  resetAllFilters();
  updateSettingsCount();

  // 3) ФУНКЦИЯ ДЛЯ ОТОБРАЖЕНИЯ/СКРЫТИЯ ФИЛЬТРА ПРИ НАЖАТИИ НА ИКОНКУ НАСТРОЕК
  // (Если хотите оставить её глобальной, вынесите из функции)
  function toggleFilterMenu() {
    const filterContainer = root.getElementById("unique-filter-container");
    const settingsIcon = root.querySelector(".settings-icon");
    if (!filterContainer || !settingsIcon) return;

    const isActive = filterContainer.classList.contains("active");
    if (isActive) {
      filterContainer.classList.remove("active");
      filterContainer.style.display = "none";
    } else {
      const rect = settingsIcon.getBoundingClientRect();
      filterContainer.style.top = `${rect.bottom + window.scrollY}px`;
      filterContainer.style.left = `${rect.left + window.scrollX}px`;
      filterContainer.style.display = "block";
      filterContainer.classList.add("active");
    }
  }

  // Привязка функции toggleFilterMenu к иконке настроек
  const settingsIcon = root.querySelector(".settings-icon");
  if (settingsIcon) {
    settingsIcon.addEventListener("click", toggleFilterMenu);
  }

  // 4) ФУНКЦИЯ ДЛЯ СВЕРНУТЬ/РАЗВЕРНУТЬ ОТДЕЛЬНЫЕ СЕКЦИИ
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

  // Если вам нужно обращаться к toggleFilterMenu и toggleSection извне —
  // можете вернуть их, например, как методы:
  return { toggleFilterMenu, toggleSection };
};
