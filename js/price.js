// Базовый путь к ресурсам
const BASE_URL = "http://processing.sbat.ru/prices/";

// Данные о регионах
const regionsData = [
  {
    name: "Приволжский ФО",
    files: [
      {
        name: "Ульяновский склад",
        file: "Ulianovsk.zip",
        photo: "Ulianovsk_s.zip",
      },
      {
        name: 'Товары бренда "ASD" под Заказ',
        file: "ASD_u.zip",
        photo: "ASD_us.zip",
      },
      {
        name: 'Товары бренда "EKF" под Заказ',
        file: "EKFcentr.zip",
        photo: "EKFcentr_s.zip",
      },
    ],
  },
  {
    name: "Северо-Западный ФО",
    files: [
      {
        name: "Склад Санкт-Петербурга",
        file: "piter.zip",
        photo: "piter_s.zip",
      },
      {
        name: "Склад РАСПРОДАЖА Санкт-Петербурга",
        file: "Sale_piter.zip",
        photo: "Sale_piter_s.zip",
      },
      {
        name: 'Товары бренда "Feron" под Заказ',
        file: "Feron.zip",
        photo: "Feron_s.zip",
      },
    ],
  },
  // Добавьте дополнительные регионы по необходимости
];

/**
 * Функция для создания элемента региона с таблицей
 * @param {Object} region - Объект с данными региона
 * @returns {HTMLElement} - Элемент региона
 */
function createRegionElement(region) {
  // Создаем контейнер для региона
  const regionContainer = document.createElement("div");
  regionContainer.classList.add("region-container");

  // Создаем заголовок региона
  const header = document.createElement("div");
  header.classList.add("region-header");

  // Название региона
  const title = document.createElement("span");
  title.textContent = region.name;

  // Стрелочка для индикации состояния
  const arrow = document.createElement("span");
  arrow.classList.add("arrow");
  arrow.textContent = "▼";

  // Добавляем название и стрелочку в заголовок
  header.appendChild(title);
  header.appendChild(arrow);

  // Создаем таблицу
  const table = document.createElement("table");
  table.classList.add("region-table");

  // Создаем заголовок таблицы
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const thPrice = document.createElement("th");
  thPrice.textContent = "Прайс";

  const thPhoto = document.createElement("th");
  thPhoto.textContent = "Прайс со ссылками на фотографии товаров";

  headerRow.appendChild(thPrice);
  headerRow.appendChild(thPhoto);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Создаем тело таблицы
  const tbody = document.createElement("tbody");

  // Заполняем таблицу данными
  region.files.forEach((file) => {
    const row = document.createElement("tr");

    // Ячейка с прайсом
    const tdPrice = document.createElement("td");
    const linkPrice = document.createElement("a");
    linkPrice.href = `${BASE_URL}${file.file}`;
    linkPrice.textContent = file.name;
    linkPrice.target = "_blank";
    tdPrice.appendChild(linkPrice);

    // Ячейка с прайсом и фото
    const tdPhoto = document.createElement("td");
    const linkPhoto = document.createElement("a");
    linkPhoto.href = `${BASE_URL}${file.photo}`;
    linkPhoto.textContent = `${file.name} фото`;
    linkPhoto.target = "_blank";
    tdPhoto.appendChild(linkPhoto);

    row.appendChild(tdPrice);
    row.appendChild(tdPhoto);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  // Добавляем обработчик клика для сворачивания/разворачивания таблицы
  header.addEventListener("click", () => {
    const isExpanded = table.classList.contains("expanded");
    if (isExpanded) {
      table.classList.remove("expanded");
      arrow.textContent = "▼";
    } else {
      table.classList.add("expanded");
      arrow.textContent = "▲";
    }
  });

  // Добавляем заголовок и таблицу в контейнер региона
  regionContainer.appendChild(header);
  regionContainer.appendChild(table);

  return regionContainer;
}

/**
 * Инициализация страницы: создание и добавление регионов
 */
function init() {
  const regionsContainer = document.getElementById("regions-container");

  regionsData.forEach((region) => {
    const regionElement = createRegionElement(region);
    regionsContainer.appendChild(regionElement);
  });
}

// Запускаем инициализацию после загрузки DOM
document.addEventListener("DOMContentLoaded", init);
