document.addEventListener("DOMContentLoaded", () => {
  // Элементы для выбора города
  const cityButton = document.getElementById("selectedCity");
  const cityDrawer = document.getElementById("cityDrawer");
  const cityOverlay = document.getElementById("cityOverlay"); // Новый оверлей для города
  const currentCity = document.getElementById("currentCity");
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

  // Элементы для категорий
  const categoryButton = document.getElementById("open-categories");
  const categoryDrawer = document.getElementById("categoryDrawer");
  const categoryOverlay = document.getElementById("categoryOverlay"); // Оверлей для категорий

  let contactsData = {}; // Храним загруженные данные
  let mapInitialized = false; // Флаг инициализации карты

  // Функция закрытия шторки города
  function closeCityDrawer() {
    cityDrawer.classList.remove("show");
    cityOverlay.classList.remove("active");
    resetToListMode(); // Сброс режимов при закрытии
  }

  // Функция закрытия шторки категорий
  function closeCategoryDrawer() {
    categoryDrawer.classList.remove("open");
    categoryOverlay.classList.remove("active");
  }

  // Функция сброса к режиму списка
  function resetToListMode() {
    selectionModeContainer.classList.remove("map-mode");
    toggleButton.textContent = "Выбрать на карте";
  }

  // Функция закрытия всех шторок
  function closeAllDrawers() {
    // Закрываем шторку города
    closeCityDrawer();
    // Закрываем шторку категорий
    closeCategoryDrawer();
  }

  // Открытие шторки выбора города
  cityButton.addEventListener("click", (e) => {
    e.preventDefault();

    if (!cityDrawer.classList.contains("show")) {
      // При открытии шторки устанавливаем режим списка
      resetToListMode();
      // Закрываем шторку категорий, если она открыта
      closeCategoryDrawer();
    }
    cityDrawer.classList.toggle("show");
    cityOverlay.classList.toggle("active");
  });

  // Открытие шторки категорий
  categoryButton.addEventListener("click", (e) => {
    e.preventDefault();

    if (!categoryDrawer.classList.contains("open")) {
      // Закрываем шторку города, если она открыта
      closeCityDrawer();
    }
    categoryDrawer.classList.toggle("open");
    categoryOverlay.classList.toggle("active");
  });

  // Закрытие шторок при клике на соответствующий оверлей
  cityOverlay.addEventListener("click", (e) => {
    if (e.target === cityOverlay) {
      closeCityDrawer();
    }
  });

  categoryOverlay.addEventListener("click", (e) => {
    if (e.target === categoryOverlay) {
      closeCategoryDrawer();
    }
  });

  // Закрытие всех шторок при клике на любой оверлей (если нужно)
  // Например, можно добавить общий оверлей для всех шторок, но в данном случае у каждой шторки свой оверлей

  // Загрузка JSON с городами
  fetch("/data/contacts.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ошибка при загрузке contacts.json");
      }
      return response.json();
    })
    .then((data) => {
      contactsData = data;
      // Отображаем все города при первом рендере
      renderCities(contactsData);
    })
    .catch((error) => {
      console.error("Ошибка загрузки JSON:", error);
    });

  // Функция рендеринга списка городов
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

        // Кнопка-тогглер без иконки
        const toggleBtn = document.createElement("button");
        toggleBtn.classList.add("toggle");
        toggleBtn.textContent = cityItem.name;

        // Детальный блок
        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("details");

        // Адрес
        if (cityItem.address) {
          const addressP = document.createElement("p");
          addressP.textContent = "Адрес: " + cityItem.address;
          detailsDiv.appendChild(addressP);
        }
        // Телефоны
        if (cityItem.phones && cityItem.phones.length > 0) {
          cityItem.phones.forEach((phone) => {
            const phoneP = document.createElement("p");
            phoneP.textContent = "Тел: " + phone;
            detailsDiv.appendChild(phoneP);
          });
        }
        // Emails
        if (cityItem.emails && cityItem.emails.length > 0) {
          cityItem.emails.forEach((email) => {
            const emailP = document.createElement("p");
            emailP.textContent = "Email: " + email;
            detailsDiv.appendChild(emailP);
          });
        }

        // Кнопка выбора представительства
        const chooseBtn = document.createElement("button");
        chooseBtn.classList.add("choose-office-button");
        chooseBtn.textContent = "Выбрать представительство";
        chooseBtn.addEventListener("click", () => {
          selectCity(cityItem.name);
        });

        detailsDiv.appendChild(chooseBtn);

        // Обработчик клика на кнопке города
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

  // Функция фильтрации городов
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

  // Обработчик ввода в поле поиска
  citySearchInput.addEventListener("input", (e) => {
    filterCities(e.target.value);
  });

  // Обработчик клика на иконке поиска
  citySearchIcon.addEventListener("click", () => {
    filterCities(citySearchInput.value);
  });

  // Обработчик переключения режимов
  toggleButton.addEventListener("click", () => {
    const isMapVisible = selectionModeContainer.classList.contains("map-mode");

    if (isMapVisible) {
      // Переключаемся на режим "Выбрать из списка"
      selectionModeContainer.classList.remove("map-mode");
      toggleButton.textContent = "Выбрать на карте";
    } else {
      // Переключаемся на режим "Выбрать на карте"
      selectionModeContainer.classList.add("map-mode");
      toggleButton.textContent = "Выбрать из списка";

      // Инициализируем карту только один раз
      if (!mapInitialized) {
        ymaps.ready(initMapSelection);
        mapInitialized = true;
      }
    }

    // Прокручиваем шторку к началу
    mapSelectionContainer.scrollIntoView({ behavior: "smooth" });
  });

  // Функция выбора города
  function selectCity(name) {
    // Обновить выбранное представительство
    currentCity.innerHTML = `<span>${name}</span>`;
    // Убрать класс "no-city-chosen"
    cityButton.classList.remove("no-city-chosen");

    // Закрыть шторку
    closeCityDrawer();

    // Переключить кнопку обратно на "Выбрать на карте"
    toggleButton.textContent = "Выбрать на карте";
  }

  // Функция инициализации карты
  async function initMapSelection() {
    const mapLoading = document.createElement("div");
    mapLoading.id = "mapLoading";
    mapLoading.style.display = "block";
    mapLoading.style.textAlign = "center";
    mapLoading.style.marginTop = "20px";
    mapSelectionContainer.appendChild(mapLoading);

    try {
      // Загрузка обновлённого JSON файла с координатами
      const response = await fetch("/data/contacts_with_coordinates.json");
      if (!response.ok) {
        throw new Error(`Ошибка загрузки JSON: ${response.status}`);
      }
      const contacts = await response.json();

      // Группировка представительств по координатам (только одно представительство на координаты)
      const groupedContacts = {};
      for (const cities of Object.values(contacts)) {
        for (const city of cities) {
          if (city.coordinates) {
            const key = `${city.coordinates.latitude},${city.coordinates.longitude}`;
            if (!groupedContacts[key]) {
              groupedContacts[key] = city; // Храним только одно представительство
            }
          }
        }
      }

      // Функция для создания меток
      function createGeoObjects() {
        const geoObjects = [];

        for (const [coords, office] of Object.entries(groupedContacts)) {
          const [latitude, longitude] = coords.split(",").map(Number);

          // Обычная метка
          const placemark = new ymaps.Placemark(
            [latitude, longitude],
            {
              balloonContent: `
                <strong>${office.name}</strong><br>
                ${office.address ? `Адрес: ${office.address}<br>` : ""}
                ${
                  office.phones && office.phones.length > 0
                    ? `Телефоны: ${office.phones.join(", ")}<br>`
                    : ""
                }
                ${
                  office.emails && office.emails.length > 0
                    ? `Email: ${office.emails.join(", ")}<br>`
                    : ""
                }
                <button class="choose-office-button" onclick="selectOffice('${
                  office.name
                }')">Выбрать представительство</button>
              `,
            },
            {
              preset: "islands#blueIcon",
            }
          );
          geoObjects.push(placemark);
        }

        return geoObjects;
      }

      // Создание кластеризатора
      const clusterer = new ymaps.Clusterer({
        preset: "islands#invertedVioletClusterIcons",
        groupByCoordinates: false,
        clusterDisableClickZoom: false,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
      });

      clusterer.add(createGeoObjects());

      // Инициализация карты выбора с ограниченными контролами
      const mapSelection = new ymaps.Map("mapSelection", {
        center: [55.76, 37.64], // Начальная позиция (Москва)
        zoom: 4,
        controls: ["zoomControl", "fullscreenControl"], // Только зум и полноэкранный режим
      });

      mapSelection.geoObjects.add(clusterer);

      // Масштабирование карты под все метки
      if (clusterer.getGeoObjects().length > 0) {
        mapSelection.setBounds(clusterer.getBounds(), {
          checkZoomRange: true,
        });
      }

      // Функция для выбора представительства из балуна карты
      window.selectOffice = function (name) {
        // Обновить выбранное представительство
        currentCity.innerHTML = `<span>${name}</span>`;
        // Убрать класс "no-city-chosen"
        cityButton.classList.remove("no-city-chosen");

        // Закрыть шторку
        closeCityDrawer();

        // Переключить кнопку обратно на "Выбрать на карте"
        toggleButton.textContent = "Выбрать на карте";
      };

      mapLoading.remove(); // Удаляем индикатор загрузки после инициализации
    } catch (error) {
      console.error("Ошибка при инициализации карты выбора:", error);
      const mapLoading = document.getElementById("mapLoading");
      mapLoading.innerHTML = "<p>Не удалось загрузить карту.</p>";
    }
  }
});
