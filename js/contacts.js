// contacts.js

// Функция инициализации: загружает JSON, строит список, вешает обработчики.
window.initContactsFunction = async function (root = document) {
  try {
    console.log("Начало инициализации контактов");

    // 1. Загрузка JSON с контактами
    const response = await fetch("/data/contacts.json");
    if (!response.ok) {
      throw new Error(`Ошибка загрузки JSON: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Файл contacts.json успешно загружен:", data);

    // 2. Ищем контейнер .contacts (либо в Shadow DOM, либо в основном DOM)
    const contactsContainer = root.querySelector(".contacts");

    if (!contactsContainer) {
      console.error("Контейнер .contacts не найден.");
      return;
    }

    // Очищаем контейнер перед загрузкой новых данных (можно убрать, если не нужно)
    contactsContainer.innerHTML = "";

    // 3. Сортируем буквы в русском алфавите
    const sortedLetters = Object.keys(data).sort((a, b) =>
      a.localeCompare(b, "ru")
    );

    // 4. Для каждой буквы создаём карточку (letter-group)
    for (const letter of sortedLetters) {
      const cities = data[letter];
      // Пропускаем, если по букве нет городов
      if (!Array.isArray(cities) || cities.length === 0) {
        continue;
      }

      // Блок для буквы
      const letterGroup = document.createElement("div");
      letterGroup.classList.add("letter-group");

      // Заголовок с буквой
      const h3 = document.createElement("h3");
      h3.textContent = letter;
      letterGroup.appendChild(h3);

      // Список городов
      const cityList = document.createElement("ul");
      cityList.classList.add("city-list");

      // Заполняем каждый город
      cities.forEach((city) => {
        const cityItem = document.createElement("li");
        cityItem.classList.add("city");

        // Кнопка с названием города
        const cityButton = document.createElement("button");
        cityButton.classList.add("toggle");
        cityButton.textContent = city.name;
        cityItem.appendChild(cityButton);

        // Блок с деталями
        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("details");

        // Адрес (если указан)
        if (city.address && city.address.trim() !== "") {
          const addressP = document.createElement("p");
          addressP.textContent = city.address;
          detailsDiv.appendChild(addressP);
        }

        // Телефоны
        if (
          city.phones &&
          Array.isArray(city.phones) &&
          city.phones.length > 0
        ) {
          const phonesP = document.createElement("p");
          phonesP.textContent = `Телефон: ${city.phones.join(", ")}`;
          detailsDiv.appendChild(phonesP);
        }

        // E-mail
        if (
          city.emails &&
          Array.isArray(city.emails) &&
          city.emails.length > 0
        ) {
          const emailsP = document.createElement("p");
          emailsP.textContent = `e-mail: ${city.emails.join(", ")}`;
          detailsDiv.appendChild(emailsP);
        }

        cityItem.appendChild(detailsDiv);
        cityList.appendChild(cityItem);
      });

      letterGroup.appendChild(cityList);
      contactsContainer.appendChild(letterGroup);
    }

    // 5. Навешиваем событие клика на кнопки .toggle для раскрытия/скрытия
    const toggles = contactsContainer.querySelectorAll(".city .toggle");
    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const parentCity = toggle.parentElement;
        parentCity.classList.toggle("active");
      });
    });

    console.log("Контакты успешно инициализированы");
  } catch (error) {
    console.error("Ошибка при загрузке контактов:", error);
    // Опционально: показать сообщение об ошибке
    const contactsContainer = root.querySelector(".contacts");
    if (contactsContainer) {
      const errorMessage = document.createElement("p");
      errorMessage.textContent =
        "Не удалось загрузить контакты. Попробуйте позже.";
      contactsContainer.appendChild(errorMessage);
    }
  }
};

// Кастомный элемент <contacts-component>, использующий Shadow DOM
class ContactsComponent extends HTMLElement {
  constructor() {
    super();
    // Включаем Shadow DOM
    this.attachShadow({ mode: "open" });

    // Локальные стили внутри Shadow DOM (опционально можно вынести)
    const style = document.createElement("style");
    style.textContent = `
      /* Сброс базовых стилей внутри Shadow DOM (если нужно) */
      h3, ul, li, button, p {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .contacts {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        padding: 20px;
      }

      .letter-group {
        background-color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        transition: box-shadow 0.3s ease;
      }
      .letter-group:hover {
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      }
      .letter-group h3 {
        color: #555555;
        font-size: 24pt;
        text-align: center;
        margin-bottom: 15px;
        font-weight: 600;
      }
      .city-list {
        list-style: none;
      }
      .city {
        margin-bottom: 12px;
      }
      .toggle {
        background: none;
        border: none;
        color: #555555;
        font-size: 14pt;
        cursor: pointer;
        text-align: left;
        width: 100%;
        padding: 8px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 4px;
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      .toggle:hover {
        background-color: #e0e0e0;
      }
      .city.active .toggle {
        color: #ff6600;
      }
      .toggle::after {
        content: "▼";
        font-size: 10pt;
        transition: transform 0.3s ease;
      }
      .city.active .toggle::after {
        transform: rotate(180deg);
      }
      .details {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.5s ease, padding 0.5s ease;
        background-color: #f9f9f9;
        padding: 0 10px;
        border-left: 4px solid #ff6600;
        margin-top: 5px;
        border-radius: 4px;
      }
      .city.active .details {
        max-height: 500px;
        padding: 10px;
      }
      .details p {
        margin-bottom: 6px;
        font-size: 10pt;
        color: #333333;
        line-height: 1.4;
      }

      @media (max-width: 1200px) {
        .letter-group {
          grid-column: span 1;
        }
      }
      @media (max-width: 800px) {
        .letter-group {
          grid-column: span 2;
        }
      }
      @media (max-width: 500px) {
        .letter-group {
          grid-column: span 4;
        }
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  connectedCallback() {
    // Создаём контейнер .contacts внутри Shadow DOM
    const container = document.createElement("div");
    container.classList.add("contacts");
    this.shadowRoot.appendChild(container);

    // Инициируем загрузку и отрисовку данных, используя Shadow Root
    window.initContactsFunction(this.shadowRoot);
  }
}

// Регистрация кастомного элемента
customElements.define("contacts-component", ContactsComponent);

// Инициализация для обычного DOM-контейнера (если он есть)
document.addEventListener("DOMContentLoaded", () => {
  const contactsContainer = document.querySelector(".contacts");
  if (contactsContainer) {
    window.initContactsFunction(document);
  }
});
