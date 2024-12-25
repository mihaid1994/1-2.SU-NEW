document.addEventListener("DOMContentLoaded", function () {
  const catalog = document.getElementById("icon-catalog");
  const searchInput = document.getElementById("icon-search");

  // Массив для хранения названий неотображённых иконок
  const missingIcons = [];

  // Создание подсказки для копирования
  const tooltip = document.createElement("div");
  tooltip.id = "copy-tooltip";
  tooltip.classList.add("copy-tooltip");
  tooltip.textContent = "Скопировано";
  document.body.appendChild(tooltip);

  // Функция для копирования текста в буфер обмена
  function copyText(text) {
    navigator.clipboard.writeText(text).then(
      () => {
        // Копирование успешно
      },
      (err) => {
        console.error("Ошибка копирования: ", err);
      }
    );
  }

  // Функция для отображения подсказки
  function showTooltip(x, y) {
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
    tooltip.style.opacity = "1";

    // Скрыть подсказку через 1.5 секунды
    setTimeout(() => {
      tooltip.style.opacity = "0";
    }, 1500);
  }

  // Функция для создания блока категории
  const createCategory = (categoryName, icons) => {
    // Создание элемента категории
    const category = document.createElement("div");
    category.classList.add("category", "collapsed"); // Добавляем класс 'collapsed' по умолчанию

    // Создание заголовка категории
    const categoryHeader = document.createElement("div");
    categoryHeader.classList.add("category-header");
    categoryHeader.innerHTML = `
      <span>${categoryName}</span>
      <button class="toggle-btn">Развернуть</button>
    `;
    category.appendChild(categoryHeader);

    // Создание контейнера иконок
    const iconsWrapper = document.createElement("div");
    iconsWrapper.classList.add("icons-wrapper");

    // Добавление иконок
    icons.forEach((iconClass) => {
      const iconBlock = document.createElement("div");
      iconBlock.classList.add("icon-block");
      iconBlock.innerHTML = `
        <i class="${iconClass}"></i>
        <div>${iconClass}</div>
      `;
      iconsWrapper.appendChild(iconBlock);
    });

    category.appendChild(iconsWrapper);
    catalog.appendChild(category);
  };

  // Функция для проверки загрузки иконки
  const checkIcon = (iconBlock, iconElement) => {
    // Для шрифтовых иконок проверка через ::before может не работать
    // Вместо этого проверим, имеет ли элемент ширину и высоту
    const rect = iconElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      iconBlock.classList.add("hidden");
      const iconName = iconBlock.querySelector("div").textContent;
      missingIcons.push(iconName);
    }
  };

  // Функция для инициализации обработчиков событий и проверки иконок
  const initializeCategories = () => {
    const categories = document.querySelectorAll(".category");

    categories.forEach((category) => {
      const categoryHeader = category.querySelector(".category-header");
      const toggleBtn = category.querySelector(".toggle-btn");
      const iconsWrapper = category.querySelector(".icons-wrapper");
      const iconBlocks = category.querySelectorAll(".icon-block");

      // Функция для переключения состояния
      const toggleCategory = () => {
        category.classList.toggle("collapsed");
        category.classList.toggle("expanded");
        if (category.classList.contains("collapsed")) {
          toggleBtn.textContent = "Развернуть";
        } else {
          toggleBtn.textContent = "Свернуть";
        }
      };

      // Клик по кнопке
      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation(); // Предотвращаем всплытие события
        toggleCategory();
      });

      // Клик по заголовку категории
      categoryHeader.addEventListener("click", function (e) {
        // Если клик был по кнопке, ничего не делаем
        if (e.target === toggleBtn) return;
        toggleCategory();
      });

      // Проверка каждой иконки в категории
      iconBlocks.forEach((iconBlock) => {
        const iconElement = iconBlock.querySelector("i");

        // Проверка через небольшой таймаут после рендеринга
        setTimeout(() => {
          checkIcon(iconBlock, iconElement);
        }, 100);
      });
    });
  };

  // Справочник релевантных запросов
  let relevantQueries = {};
  let synonymToMain = {};

  // Функция для загрузки релевантных запросов из JSON
  const loadRelevantQueries = async () => {
    try {
      const response = await fetch("/data/relevant.json");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      relevantQueries = await response.json();

      // Построение обратного словаря: синоним -> основной термин
      for (const [mainTerm, synonyms] of Object.entries(relevantQueries)) {
        synonyms.forEach((syn) => {
          if (!synonymToMain[syn]) {
            synonymToMain[syn] = [];
          }
          synonymToMain[syn].push(mainTerm);
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки релевантных запросов:", error);
    }
  };

  // Функция для загрузки данных из JSON и создания категорий
  const loadIconData = async () => {
    try {
      const response = await fetch("/data/icon_data.json");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const iconData = await response.json();

      // Генерация всех категорий и иконок
      for (const [categoryName, icons] of Object.entries(iconData)) {
        createCategory(categoryName, icons);
      }

      // Инициализация категорий после их создания и проверки иконок
      initializeCategories();
    } catch (error) {
      console.error("Ошибка загрузки данных иконок:", error);
    }
  };

  // Обработчик кликов на иконках для копирования текста и отображения подсказки
  catalog.addEventListener("click", function (event) {
    const iconBlock = event.target.closest(".icon-block");
    if (iconBlock && !iconBlock.classList.contains("hidden")) {
      const textElement = iconBlock.querySelector("div");
      if (textElement) {
        const text = textElement.textContent.trim();
        copyText(text);

        // Получить координаты клика
        const x = event.pageX + 10; // Сдвиг на 10px вправо
        const y = event.pageY + 10; // Сдвиг на 10px вниз

        showTooltip(x, y);
      }
    }
  });

  // Доработанный обработчик ввода в поле поиска
  searchInput.addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    const allIcons = document.querySelectorAll(".icon-block");
    const categories = document.querySelectorAll(".category");

    if (query === "") {
      // Если поле поиска пусто, показать все иконки и категории
      allIcons.forEach((icon) => icon.classList.remove("hidden"));
      categories.forEach((category) => (category.style.display = "block"));
      return;
    }

    // Собираем все возможные поисковые термины, включая основные и синонимы
    let searchTerms = new Set();

    // Проверяем вхождение части текста в основные термины и синонимы
    for (const [mainTerm, synonyms] of Object.entries(relevantQueries)) {
      if (mainTerm.includes(query)) {
        searchTerms.add(mainTerm);
        synonyms.forEach((syn) => searchTerms.add(syn));
      } else {
        synonyms.forEach((syn) => {
          if (syn.includes(query)) {
            searchTerms.add(mainTerm);
            searchTerms.add(syn);
          }
        });
      }
    }

    // Дополнительно добавляем сам запрос для прямого поиска по названиям иконок
    searchTerms.add(query);

    // Конвертируем Set обратно в массив
    searchTerms = Array.from(searchTerms);

    allIcons.forEach((icon) => {
      const iconName = icon.textContent.toLowerCase();
      // Проверяем вхождение любой части поисковых терминов
      const isMatch = searchTerms.some((term) => iconName.includes(term));
      if (isMatch) {
        icon.classList.remove("hidden");
      } else {
        icon.classList.add("hidden");
      }
    });

    // Показывать/скрывать категории в зависимости от наличия видимых иконок
    categories.forEach((category) => {
      const visibleIcons = category.querySelectorAll(
        ".icon-block:not(.hidden)"
      );
      if (visibleIcons.length > 0) {
        category.style.display = "block";
      } else {
        category.style.display = "none";
      }
    });
  });

  // Инициализация: загрузка релевантных запросов и данных иконок
  (async () => {
    await loadRelevantQueries();
    loadIconData();
  })();
});
