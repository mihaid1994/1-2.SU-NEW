// --- Завёрнутый Скрипт: initInnInput.js ---
window.initInnInput = function (root = document) {
  // Получаем элементы формы внутри переданного корня
  const innInput = root.getElementById("query");
  const orgInput = root.getElementById("org");
  const managementInput = root.getElementById("management");
  const addressInput = root.getElementById("address");

  // Получаем блоки для подсказок
  const innSuggestionsBox = root.getElementById("suggestions-inn");
  const orgSuggestionsBox = root.getElementById("suggestions-org");
  const managementSuggestionsBox = root.getElementById(
    "suggestions-management"
  );

  let innDebounceTimeout, orgDebounceTimeout, managementDebounceTimeout;
  let organizations = [];
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
      const managementSet = new Set();
      data.forEach((org) => {
        if (org.management) managementSet.add(org.management);
      });
      managements = Array.from(managementSet);
      console.log("Данные организаций успешно загружены.");
    })
    .catch((error) => {
      console.error("Ошибка при загрузке данных организаций:", error);
    });

  function highlightMatch(query, text) {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getRandomSuggestions(data, count) {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function showSuggestions(query, suggestionsBox, data, type) {
    suggestionsBox.innerHTML = "";
    let filtered = [];
    if (query.length === 0) {
      filtered = getRandomSuggestions(data, 5);
    } else {
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
        filtered = getRandomSuggestions(data, 5);
      }
    }
    filtered = filtered.slice(0, 5);
    filtered.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("suggestion-item");
      if (type === "management") {
        div.innerHTML = `${highlightMatch(query, item)}`;
        div.addEventListener("click", () => {
          managementInput.value = item;
          addressInput.value = "";
          innInput.value = "";
          orgInput.value = "";
          suggestionsBox.innerHTML = "";
          suggestionsBox.style.display = "none";
        });
      } else {
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

  // Обработчики для ИНН
  if (innInput && innSuggestionsBox) {
    innInput.addEventListener("input", () => {
      const query = innInput.value.trim();
      clearTimeout(innDebounceTimeout);
      if (query.length === 0) {
        innSuggestionsBox.innerHTML = "";
        innSuggestionsBox.style.display = "none";
        orgInput.value = "";
        addressInput.value = "";
        managementInput.value = "";
        return;
      }
      if (!/^\d{0,13}$/.test(query)) {
        innSuggestionsBox.innerHTML =
          '<div class="suggestion-item">Введите только цифры (до 13 символов)</div>';
        innSuggestionsBox.style.display = "block";
        orgInput.value = "";
        addressInput.value = "";
        managementInput.value = "";
        return;
      }
      innDebounceTimeout = setTimeout(() => {
        showSuggestions(query, innSuggestionsBox, organizations, "inn");
      }, 300);
    });
    innInput.addEventListener("focus", () => {
      const query = innInput.value.trim();
      if (query.length === 0) {
        showSuggestions("", innSuggestionsBox, organizations, "inn");
      }
    });
  }

  // Обработчики для Названия организации
  if (orgInput && orgSuggestionsBox) {
    orgInput.addEventListener("input", () => {
      const query = orgInput.value.trim();
      clearTimeout(orgDebounceTimeout);
      orgDebounceTimeout = setTimeout(() => {
        showSuggestions(query, orgSuggestionsBox, organizations, "org");
      }, 300);
    });
    orgInput.addEventListener("focus", () => {
      const query = orgInput.value.trim();
      if (query.length === 0) {
        showSuggestions("", orgSuggestionsBox, organizations, "org");
      }
    });
  }

  // Обработчики для ФИО получателя
  if (managementInput && managementSuggestionsBox) {
    managementInput.addEventListener("input", () => {
      const query = managementInput.value.trim();
      clearTimeout(managementDebounceTimeout);
      managementDebounceTimeout = setTimeout(() => {
        showSuggestions(
          query,
          managementSuggestionsBox,
          managements,
          "management"
        );
      }, 300);
    });
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

  // Скрытие подсказок при клике вне
  if (root) {
    root.addEventListener("click", (e) => {
      const isInsideInputContainer =
        e.target.closest("#query") ||
        e.target.closest("#org") ||
        e.target.closest("#management") ||
        e.target.closest(".suggestions-box");
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

  // ----------------- [BASKET BUTTON HANDLERS] -----------------
  // Обработчик для кнопки активации корзины (иконка с классом ri-pushpin-line)
  const cartActivateBtn = root.querySelector(".ri-pushpin-line");
  if (cartActivateBtn) {
    cartActivateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const headerTitle = root.querySelector(".header-title");
      if (headerTitle) {
        if (!headerTitle.getAttribute("data-cart-id")) {
          const headerText = headerTitle.querySelector(".header-text");
          if (headerText) {
            headerTitle.setAttribute(
              "data-cart-id",
              headerText.textContent.trim()
            );
          }
        }
        const cartId = headerTitle.getAttribute("data-cart-id");
        if (cartId) {
          const event = new CustomEvent("cartActivated", {
            detail: { cartId: cartId },
            bubbles: true,
            composed: true,
          });
          window.dispatchEvent(event);
          console.log("Событие cartActivated отправлено с cartId:", cartId);
        }
      }
    });
  }

  // Обработчик для значка карандаша (ri-edit-2-line) – включает редактирование заголовка
  const pencilIcon = root.querySelector(".ri-edit-2-line");
  if (pencilIcon) {
    pencilIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      const headerTitle = root.querySelector(".header-title");
      if (headerTitle) {
        const headerText = headerTitle.querySelector(".header-text");
        if (headerText) {
          headerText.setAttribute("contenteditable", "true");
          headerText.classList.add("cart-editable");
          headerText.focus();
        }
      }
    });
  }

  // Обработчик для значка сохранения (ri-save-3-line) – завершает редактирование
  const saveIcon = root.querySelector(".ri-save-3-line");
  if (saveIcon) {
    saveIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      const headerTitle = root.querySelector(".header-title");
      if (headerTitle) {
        const headerText = headerTitle.querySelector(".header-text");
        if (
          headerText &&
          headerText.getAttribute("contenteditable") === "true"
        ) {
          headerText.removeAttribute("contenteditable");
          headerText.classList.remove("cart-editable");
          const cartId =
            headerTitle.getAttribute("data-cart-id") ||
            headerText.textContent.trim();
          const newTitle = headerText.textContent.trim();
          const event = new CustomEvent("cartTitleChanged", {
            detail: { cartId: cartId, newTitle: newTitle },
            bubbles: true,
            composed: true,
          });
          window.dispatchEvent(event);
          console.log(
            "Событие cartTitleChanged отправлено с cartId:",
            cartId,
            "и newTitle:",
            newTitle
          );
        }
      }
    });
  }

  // Также, если редактирование завершается методом blur
  const cartTitleEditable = root.querySelector(
    ".header-title .header-text.cart-editable"
  );
  if (cartTitleEditable) {
    cartTitleEditable.addEventListener("blur", () => {
      const cartId =
        cartTitleEditable.parentElement.getAttribute("data-cart-id") ||
        cartTitleEditable.textContent.trim();
      const newTitle = cartTitleEditable.textContent.trim();
      const event = new CustomEvent("cartTitleChanged", {
        detail: { cartId: cartId, newTitle: newTitle },
        bubbles: true,
        composed: true,
      });
      window.dispatchEvent(event);
      console.log(
        "Событие cartTitleChanged отправлено с cartId:",
        cartId,
        "и newTitle:",
        newTitle
      );
    });
  }
  // -------------------------------------------------------------
};

// Если новые контейнеры добавляются динамически, вызывайте initInnInput с нужным root.
// Например:
// const newRoot = document.querySelector('#new-container');
// window.initInnInput(newRoot);
