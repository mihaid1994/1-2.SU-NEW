document.addEventListener("DOMContentLoaded", function () {
  // Логика для кнопки "Свернуть/Развернуть" в меню поиска
  const searchMenu = document.querySelector(".search-menu");
  const toggleButton = document.querySelector(".toggle-button");

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      searchMenu.classList.toggle("collapsed");
      const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
      toggleButton.setAttribute("aria-expanded", !isExpanded);
      toggleButton.innerHTML = isExpanded ? "&#9660;" : "&#9650;"; // ▼ или ▲
    });
  }

  // Логика для фильтров: добавление прокрутки и ограничения высоты
  document.querySelectorAll(".filter-section-content").forEach((section) => {
    const childCount = section.querySelectorAll("label").length;

    // Проверяем количество элементов и применяем прокрутку, если элементов больше 5
    if (childCount > 5) {
      section.setAttribute("data-scroll-limit", "true");
      section.style.maxHeight = "10rem"; // Пример ограничения высоты
      section.style.overflowY = "auto";
    } else {
      section.setAttribute("data-scroll-limit", "false");
      section.style.maxHeight = "unset";
      section.style.overflowY = "unset";
    }
  });

  // Изначальное состояние фильтров: обновляем стрелочки и состояние разделов
  document.querySelectorAll(".filter-section").forEach((section) => {
    const header = section.querySelector("h3");
    const content = section.querySelector(".filter-section-content");

    // Проверяем изначальное состояние содержимого (свернуто или раскрыто)
    const isInitiallyExpanded =
      content.style.display === "block" || !content.style.display;

    // Логика для "Столбцы" (должен быть свернут)
    if (header.textContent.includes("Столбцы")) {
      content.style.display = "none";
      header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▼"); // Устанавливаем стрелочку вниз
    } else {
      // Для всех остальных секций
      if (isInitiallyExpanded) {
        content.style.display = "block"; // Разворачиваем
        header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▲"); // Устанавливаем стрелочку вверх
      } else {
        content.style.display = "none"; // Сворачиваем
        header.innerHTML = header.innerHTML.replace(/▲|▼/g, "▼"); // Устанавливаем стрелочку вниз
      }
    }
  });

  // Функция для обновления количества выбранных чекбоксов в заголовках
  function updateGroupheaders() {
    document.querySelectorAll(".filter-section").forEach((section) => {
      const header = section.querySelector("h3"); // Заголовок группы
      const checkboxes = section.querySelectorAll(
        ".filter-section-content input[type='checkbox']"
      );
      const checkedCount = section.querySelectorAll(
        ".filter-section-content input[type='checkbox']:checked"
      ).length; // Количество отмеченных чекбоксов

      // Извлекаем базовый заголовок без предыдущего количества в скобках
      const baseTitle = header.textContent.replace(/\s*\(\d+\)/, "");

      // Обновляем заголовок с новым количеством в скобках
      header.textContent = `${baseTitle} (${checkedCount})`;

      // Восстанавливаем стрелочку после изменения текста
      if (
        section.querySelector(".filter-section-content").style.display ===
        "block"
      ) {
        header.innerHTML = header.innerHTML.replace(/▼/g, "▲");
      } else {
        header.innerHTML = header.innerHTML.replace(/▲/g, "▼");
      }
    });
  }

  // Функция для правильного склонения (необязательно, можно использовать для локализации)
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

  // Функция для обновления общего количества выбранных условий рядом с иконкой настроек
  function updateSettingsCount() {
    let totalSelected = 0;
    document.querySelectorAll(".filter-section").forEach((section) => {
      const header = section.querySelector("h3");
      if (!header.textContent.includes("Столбцы")) {
        const count = section.querySelectorAll(
          ".filter-section-content input[type='checkbox']:checked"
        ).length;
        totalSelected += count;
      }
    });

    const settingsCount = document.getElementById("settings-count");
    if (settingsCount) {
      settingsCount.textContent = `(${getConditionText(totalSelected)})`;
      settingsCount.style.display = "inline"; // Текст всегда отображается
    }
  }

  // Функция для сброса всех чекбоксов (кроме "Столбцы")
  function resetAllFilters() {
    // Ищем все секции, кроме "Столбцы"
    const filterSections = Array.from(
      document.querySelectorAll(".filter-section")
    ).filter(
      (section) => !section.querySelector("h3").textContent.includes("Столбцы")
    );

    // Сбрасываем только чекбоксы в этих секциях
    filterSections.forEach((section) => {
      const checkboxes = section.querySelectorAll(
        ".filter-section-content input[type='checkbox']"
      );
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    });

    // Обновляем заголовки групп и счетчик настроек после сброса
    updateGroupheaders();
    updateSettingsCount();
  }

  // Привязка событий к чекбоксам
  document
    .querySelectorAll(".filter-section-content input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        updateGroupheaders(); // Обновляем заголовки групп
        updateSettingsCount(); // Обновляем текст рядом с иконкой настроек
      });
    });

  // Привязка функции сброса к кнопке "Сбросить все"
  const resetButton = document.querySelector(".filter-actions .reset");
  if (resetButton) {
    resetButton.addEventListener("click", function () {
      resetAllFilters();
    });
  }

  // Изначально сбрасываем все фильтры (кроме "Столбцы") и обновляем состояния
  resetAllFilters();
  updateSettingsCount();
});

// Функция для отображения или скрытия фильтра при нажатии на иконку настроек
function toggleFilterMenu() {
  const filterContainer = document.getElementById("unique-filter-container");
  const settingsIcon = document.querySelector(".settings-icon");
  const isActive = filterContainer.classList.contains("active");

  if (isActive) {
    filterContainer.classList.remove("active");
    filterContainer.style.display = "none"; // Скрываем фильтр
  } else {
    // Устанавливаем позицию фильтра ниже кнопки
    const rect = settingsIcon.getBoundingClientRect();
    filterContainer.style.top = `${rect.bottom + window.scrollY}px`;
    filterContainer.style.left = `${rect.left + window.scrollX}px`;
    filterContainer.style.display = "block"; // Показываем фильтр
    filterContainer.classList.add("active");
  }
}

// Функция для сворачивания и разворачивания отдельных секций фильтра при клике на заголовок
function toggleSection(header) {
  const content = header.nextElementSibling;
  const isExpanded = content.style.display === "block";
  content.style.display = isExpanded ? "none" : "block";
  header.innerHTML = header.innerHTML.replace(
    isExpanded ? "▲" : "▼",
    isExpanded ? "▼" : "▲"
  );
}
