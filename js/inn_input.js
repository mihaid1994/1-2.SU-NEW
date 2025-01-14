// --- Завёрнутый Скрипт: initInnInput ---

window.initInnInput = function (root = document) {
  // Получаем элементы формы внутри переданного корня
  const innInput = root.getElementById("query"); // Поле ввода ИНН
  const orgInput = root.getElementById("org"); // Поле названия организации
  const managementInput = root.getElementById("management"); // Поле ФИО получателя
  const addressInput = root.getElementById("address"); // Поле адреса доставки

  // Получаем блоки для предложений внутри переданного корня
  const innSuggestionsBox = root.getElementById("suggestions-inn");
  const orgSuggestionsBox = root.getElementById("suggestions-org");
  const managementSuggestionsBox = root.getElementById(
    "suggestions-management"
  );

  // Таймеры для дебаунсинга
  let innDebounceTimeout;
  let orgDebounceTimeout;
  let managementDebounceTimeout;

  // Массив для хранения организаций
  let organizations = [];

  // Массив для хранения ФИО руководителей
  let managements = [];

  // Загрузка данных из JSON-файла
  fetch("/data/inn_org.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Статус: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      organizations = data;
      // Извлекаем уникальные ФИО руководителей
      const managementSet = new Set();
      data.forEach((org) => {
        if (org.management) {
          managementSet.add(org.management);
        }
      });
      managements = Array.from(managementSet);
      console.log("Данные организаций успешно загружены.");
    })
    .catch((error) => {
      console.error("Ошибка при загрузке данных организаций:", error);
    });

  // Функция для подсветки совпадающих частей
  function highlightMatch(query, text) {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  // Функция для экранирования специальных символов в регулярных выражениях
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Функция для получения случайных предложений
  function getRandomSuggestions(data, count) {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Функция для отображения предложений
  function showSuggestions(query, suggestionsBox, data, type) {
    suggestionsBox.innerHTML = "";

    let filtered = [];

    if (query.length === 0) {
      // Показываем 5 случайных предложений
      filtered = getRandomSuggestions(data, 5);
    } else {
      // Фильтруем по совпадению
      if (type === "inn") {
        filtered = data.filter(
          (org) =>
            org.inn.includes(query) ||
            org.name.toLowerCase().includes(query.toLowerCase())
        );
      } else if (type === "org") {
        filtered = data.filter(
          (org) =>
            org.name.toLowerCase().includes(query.toLowerCase()) ||
            org.inn.includes(query)
        );
      } else if (type === "management") {
        filtered = data.filter((name) =>
          name.toLowerCase().includes(query.toLowerCase())
        );
      }

      if (filtered.length === 0) {
        // Если совпадений нет, показываем 5 случайных
        filtered = getRandomSuggestions(data, 5);
      }
    }

    // Ограничиваем до 5 предложений
    filtered = filtered.slice(0, 5);

    // Отображаем предложения
    filtered.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("suggestion-item");

      if (type === "management") {
        div.innerHTML = `${highlightMatch(query, item)}`;
        div.addEventListener("click", () => {
          managementInput.value = item;
          addressInput.value = ""; // Можно добавить логику заполнения адреса, если необходимо
          innInput.value = ""; // Можно добавить логику заполнения ИНН, если необходимо
          orgInput.value = "";
          suggestionsBox.innerHTML = "";
          suggestionsBox.style.display = "none";
        });
      } else {
        // Для ИНН и Названия организации
        if (type === "inn") {
          div.innerHTML = `${highlightMatch(
            query,
            item.inn
          )} - ${highlightMatch(query, item.name)}`;
        } else if (type === "org") {
          div.innerHTML = `${highlightMatch(
            query,
            item.name
          )} - ${highlightMatch(query, item.inn)}`;
        }
        div.addEventListener("click", () => {
          if (type === "inn") {
            innInput.value = item.inn;
            orgInput.value = item.name;
            managementInput.value = item.management || "";
            addressInput.value = item.address || "";
          } else if (type === "org") {
            orgInput.value = item.name;
            innInput.value = item.inn;
            managementInput.value = item.management || "";
            addressInput.value = item.address || "";
          }
          suggestionsBox.innerHTML = "";
          suggestionsBox.style.display = "none";
        });
      }

      suggestionsBox.appendChild(div);
    });

    suggestionsBox.style.display = "block";
  }

  // Обработчики событий для ИНН
  if (innInput && innSuggestionsBox) {
    innInput.addEventListener("input", () => {
      const query = innInput.value.trim();

      // Очистка предыдущих таймаутов
      clearTimeout(innDebounceTimeout);

      // Если поле пустое, скрыть предложения и очистить связанные поля
      if (query.length === 0) {
        innSuggestionsBox.innerHTML = "";
        innSuggestionsBox.style.display = "none";
        orgInput.value = "";
        addressInput.value = "";
        managementInput.value = "";
        return;
      }

      // Валидация ввода (только цифры, до 13 символов)
      if (!/^\d{0,13}$/.test(query)) {
        innSuggestionsBox.innerHTML =
          '<div class="suggestion-item">Введите только цифры (до 13 символов)</div>';
        innSuggestionsBox.style.display = "block";
        orgInput.value = "";
        addressInput.value = "";
        managementInput.value = "";
        return;
      }

      // Дебаунсинг (задержка перед отображением предложений)
      innDebounceTimeout = setTimeout(() => {
        showSuggestions(query, innSuggestionsBox, organizations, "inn");
      }, 300); // Задержка 300 мс
    });

    // Обработчик фокуса для ИНН
    innInput.addEventListener("focus", () => {
      const query = innInput.value.trim();
      if (query.length === 0) {
        showSuggestions("", innSuggestionsBox, organizations, "inn");
      }
    });
  }

  // Обработчики событий для Названия организации
  if (orgInput && orgSuggestionsBox) {
    orgInput.addEventListener("input", () => {
      const query = orgInput.value.trim();

      // Очистка предыдущих таймаутов
      clearTimeout(orgDebounceTimeout);

      // Дебаунсинг (задержка перед отображением предложений)
      orgDebounceTimeout = setTimeout(() => {
        showSuggestions(query, orgSuggestionsBox, organizations, "org");
      }, 300); // Задержка 300 мс
    });

    // Обработчик фокуса для Названия организации
    orgInput.addEventListener("focus", () => {
      const query = orgInput.value.trim();
      if (query.length === 0) {
        showSuggestions("", orgSuggestionsBox, organizations, "org");
      }
    });
  }

  // Обработчики событий для ФИО получателя
  if (managementInput && managementSuggestionsBox) {
    managementInput.addEventListener("input", () => {
      const query = managementInput.value.trim();

      // Очистка предыдущих таймаутов
      clearTimeout(managementDebounceTimeout);

      // Дебаунсинг (задержка перед отображением предложений)
      managementDebounceTimeout = setTimeout(() => {
        showSuggestions(
          query,
          managementSuggestionsBox,
          managements,
          "management"
        );
      }, 300); // Задержка 300 мс
    });

    // Обработчик фокуса для ФИО получателя
    managementInput.addEventListener("focus", () => {
      const query = managementInput.value.trim();
      if (query.length === 0) {
        showSuggestions(
          "",
          managementSuggestionsBox,
          managements,
          "management"
        );
      }
    });
  }

  // Скрытие предложений при клике вне полей ввода
  if (root) {
    root.addEventListener("click", (e) => {
      // Проверяем, содержит ли кликнутый элемент контейнеры с полями ввода
      const isInsideInputContainer =
        e.target.closest("#query") ||
        e.target.closest("#org") ||
        e.target.closest("#management") ||
        e.target.closest(".suggestions-box"); // Предполагается, что классы или ID у boxes соответствуют

      if (!isInsideInputContainer) {
        if (innSuggestionsBox) {
          innSuggestionsBox.innerHTML = "";
          innSuggestionsBox.style.display = "none";
        }
        if (orgSuggestionsBox) {
          orgSuggestionsBox.innerHTML = "";
          orgSuggestionsBox.style.display = "none";
        }
        if (managementSuggestionsBox) {
          managementSuggestionsBox.innerHTML = "";
          managementSuggestionsBox.style.display = "none";
        }
      }
    });
  }
};

// Если вы динамически добавляете новые контейнеры, вызывайте initInnInput с соответствующим root
// Например:
// const newRoot = document.querySelector('#new-container');
// window.initInnInput(newRoot);
