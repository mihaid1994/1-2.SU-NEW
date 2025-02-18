window.initversusFunction = function (root = document) {
  const d = root;

  // Функция, которая будет выполнена сразу, если DOM уже готов или если это не document
  const run = () => {
    let productsData = [];
    let sortConfig = { key: null, order: "asc" };

    // DOM-элементы для цены
    const priceSlider = d.getElementById("priceSlider");
    const priceMinVal = d.getElementById("priceMinVal");
    const priceMaxVal = d.getElementById("priceMaxVal");
    const priceInputFrom = d.getElementById("priceInputFrom");
    const priceInputTo = d.getElementById("priceInputTo");

    let globalMinPrice = 0;
    let globalMaxPrice = 100;
    let sliderInitialized = false;

    // Инициализация noUiSlider
    function initSlider(min, max) {
      noUiSlider.create(priceSlider, {
        start: [min, max],
        connect: true,
        step: 1,
        range: {
          min: min,
          max: max,
        },
        tooltips: [true, true],
        format: {
          to: function (value) {
            return Math.round(value) + " ₽";
          },
          from: function (value) {
            return Number(value.replace(" ₽", ""));
          },
        },
      });
      priceSlider.noUiSlider.on("update", function (values) {
        const minVal = Number(values[0].replace(" ₽", ""));
        const maxVal = Number(values[1].replace(" ₽", ""));
        priceInputFrom.value = minVal;
        priceInputTo.value = maxVal;
        priceMinVal.textContent = minVal + " ₽";
        priceMaxVal.textContent = maxVal + " ₽";
      });
      sliderInitialized = true;
    }

    // Синхронизация числовых полей с ползунком
    function updateSliderFromInputs() {
      let fromVal = parseInt(priceInputFrom.value, 10) || globalMinPrice;
      let toVal = parseInt(priceInputTo.value, 10) || globalMaxPrice;
      if (fromVal < globalMinPrice) fromVal = globalMinPrice;
      if (toVal > globalMaxPrice) toVal = globalMaxPrice;
      if (fromVal > toVal) fromVal = toVal;
      if (sliderInitialized) {
        priceSlider.noUiSlider.set([fromVal, toVal]);
      }
    }
    priceInputFrom.addEventListener("change", updateSliderFromInputs);
    priceInputTo.addEventListener("change", updateSliderFromInputs);

    // Кнопки "Сброс" и "Применить фильтры"
    const resetFiltersBtn = d.getElementById("resetFilters");
    const applyFiltersBtn = d.getElementById("applyFilters");

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", function () {
        if (sliderInitialized) {
          priceSlider.noUiSlider.set([globalMinPrice, globalMaxPrice]);
        }
        priceInputFrom.value = globalMinPrice;
        priceInputTo.value = globalMaxPrice;
        priceMinVal.textContent = globalMinPrice + " ₽";
        priceMaxVal.textContent = globalMaxPrice + " ₽";
        d.querySelectorAll('.brand-filter input[type="checkbox"]').forEach(
          (chk) => (chk.checked = false)
        );
        d.querySelectorAll('.toggle-filter input[type="checkbox"]').forEach(
          (chk) => (chk.checked = false)
        );
        d.querySelectorAll(
          '#characteristics-filters input[name="characteristic"]'
        ).forEach((chk) => (chk.checked = false));
        sortConfig = { key: null, order: "asc" };
        buildTable();
      });
    }
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", function () {
        buildTable();
      });
    }

    // Сворачивание/разворачивание сайдбара
    const toggleFiltersBtn = d.getElementById("toggleFilters");
    const filtersPanel = d.querySelector(".filters-panel");

    toggleFiltersBtn.addEventListener("click", function () {
      if (filtersPanel.classList.contains("collapsed")) {
        filtersPanel.classList.remove("collapsed");
        toggleFiltersBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
      } else {
        filtersPanel.classList.add("collapsed");
        toggleFiltersBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
      }
    });

    // Создание чекбоксов характеристик
    function populateCharacteristicFilters(product) {
      const container = d.getElementById("characteristics-filters");
      if (!container) return;
      const labelHTML = container.querySelector("label")?.outerHTML || "";
      container.innerHTML = labelHTML;
      const excludedKeys = ["id", "название", "изображение", "стоимость"];
      const mapping = {
        тип_сверла: "Тип сверла",
        реверсная: "Реверсная",
        беспроводной: "Беспроводной",
        вес: "Вес (кг)",
        высота: "Высота (см)",
        производительность: "Производительность (Вт)",
        напряжение: "Напряжение (В)",
        бесщеточный_двигатель: "Бесщеточный двигатель",
        максимальная_скорость_сверления: "Макс. скорость сверления (RPM)",
        различные_скорости: "Имеет различные скорости",
        сила_тока: "Сила тока (А)",
        диаметр_патрона: "Диаметр патрона (мм)",
        быстрозажимной_патрон: "Быстрозажимной патрон",
        контактный_патрон: "Контактный патрон",
        высокоточный_патрон: "Высокоточный патрон",
      };
      for (let key in product) {
        if (excludedKeys.includes(key)) continue;
        const div = document.createElement("div");
        div.classList.add("toggle-filter");
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = "characteristic";
        input.value = key;
        input.checked = false;
        input.addEventListener("change", buildTable);
        label.appendChild(input);
        label.appendChild(document.createTextNode(" " + (mapping[key] || key)));
        div.appendChild(label);
        container.appendChild(div);
      }
    }

    // Сортировка товаров
    function sortProducts(products, key) {
      if (!key) return products;
      return products.sort((a, b) => {
        let aVal = a[key],
          bVal = b[key];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.order === "asc" ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        if (aVal < bVal) return sortConfig.order === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.order === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Применение фильтров (цена, чекбоксы)
    function applyAllFilters(products) {
      let fromV = parseInt(priceInputFrom.value, 10) || globalMinPrice;
      let toV = parseInt(priceInputTo.value, 10) || globalMaxPrice;
      return products.filter((p) => {
        if (p.стоимость < fromV || p.стоимость > toV) return false;
        let selectedBrands = Array.from(
          d.querySelectorAll('.brand-filter input[type="checkbox"]:checked')
        ).map((chk) => chk.value);
        let cordlessChecked = d.querySelector('input[name="cordless"]:checked');
        if (cordlessChecked && p.беспроводной !== true) return false;
        let reversibleChecked = d.querySelector(
          'input[name="reversible"]:checked'
        );
        if (reversibleChecked && p.реверсная !== true) return false;
        return true;
      });
    }

    // Функция для получения случайной кратности (чаще 1, иногда 5, 3 или 6)
    function getRandomMultiplicity() {
      const options = [1, 1, 1, 5, 3, 6];
      return options[Math.floor(Math.random() * options.length)];
    }

    // Построение таблицы
    function buildTable() {
      const tableView = d.querySelector(".table-view");
      if (!tableView) return;
      if (productsData.length === 0) {
        fetch("/data/versus.json")
          .then((res) => res.json())
          .then((products) => {
            productsData = products;
            const prices = products.map((p) => p.стоимость);
            globalMinPrice = Math.min(...prices);
            globalMaxPrice = Math.max(...prices);
            if (!sliderInitialized) {
              initSlider(globalMinPrice, globalMaxPrice);
            } else {
              priceSlider.noUiSlider.updateOptions({
                range: { min: globalMinPrice, max: globalMaxPrice },
              });
              priceSlider.noUiSlider.set([globalMinPrice, globalMaxPrice]);
            }
            priceInputFrom.value = globalMinPrice;
            priceInputTo.value = globalMaxPrice;
            priceMinVal.textContent = globalMinPrice + " ₽";
            priceMaxVal.textContent = globalMaxPrice + " ₽";
            populateCharacteristicFilters(productsData[0]);
            renderTable(productsData);
          })
          .catch((err) => console.error("Ошибка загрузки продуктов:", err));
      } else {
        renderTable(productsData);
      }

      function renderTable(products) {
        let displayedProducts = applyAllFilters(products);
        if (sortConfig.key) {
          displayedProducts = sortProducts(displayedProducts, sortConfig.key);
        }
        const charCheckboxes = d.querySelectorAll(
          '#characteristics-filters input[name="characteristic"]:checked'
        );
        const mapping = {
          тип_сверла: "Тип сверла",
          реверсная: "Реверсная",
          беспроводной: "Беспроводной",
          вес: "Вес (кг)",
          высота: "Высота (см)",
          производительность: "Производительность (Вт)",
          напряжение: "Напряжение (В)",
          бесщеточный_двигатель: "Бесщеточный двигатель",
          максимальная_скорость_сверления: "Макс. скорость сверления (RPM)",
          различные_скорости: "Имеет различные скорости",
          сила_тока: "Сила тока (А)",
          диаметр_патрона: "Диаметр патрона (мм)",
          быстрозажимной_патрон: "Быстрозажимной патрон",
          контактный_патрон: "Контактный патрон",
          высокоточный_патрон: "Высокоточный патрон",
        };
        const selectedCharacteristics = Array.from(charCheckboxes).map(
          (chk) => ({
            key: chk.value,
            label: mapping[chk.value] || chk.value,
          })
        );

        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        // Базовые столбцы: Изображение, Название, Стоимость
        const imageHeader = document.createElement("th");
        imageHeader.textContent = "Изображение";
        imageHeader.classList.add("no-sort");
        imageHeader.style.width = "70px";
        headerRow.appendChild(imageHeader);

        const nameHeader = document.createElement("th");
        nameHeader.textContent = "Название";
        nameHeader.dataset.sortKey = "название";
        nameHeader.addEventListener("click", headerSortHandler);
        headerRow.appendChild(nameHeader);

        const priceHeader = document.createElement("th");
        priceHeader.textContent = "Стоимость";
        priceHeader.dataset.sortKey = "стоимость";
        priceHeader.addEventListener("click", headerSortHandler);
        headerRow.appendChild(priceHeader);

        // Дополнительный столбец присутствует только если характеристики не выбраны
        if (selectedCharacteristics.length === 0) {
          const extraHeader = document.createElement("th");
          extraHeader.textContent = "Добавьте характеристики";
          headerRow.appendChild(extraHeader);
        } else {
          selectedCharacteristics.forEach((char) => {
            const th = document.createElement("th");
            th.textContent = char.label;
            th.dataset.sortKey = char.key;
            th.addEventListener("click", headerSortHandler);
            headerRow.appendChild(th);
          });
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        if (selectedCharacteristics.length === 0) {
          // Если не выбраны характеристики, создаём строки с базовыми столбцами
          // и в первой строке в четвёртом столбце создаём объединённый контейнер
          displayedProducts.forEach((product, index) => {
            const row = document.createElement("tr");

            // Столбец с изображением
            const imageCell = document.createElement("td");
            imageCell.style.width = "70px";
            const img = document.createElement("img");
            img.src = product.изображение;
            img.alt = product.название;
            imageCell.appendChild(img);
            row.appendChild(imageCell);

            // Столбец с названием и управлением заказа
            const nameCell = document.createElement("td");
            const nameContainer = document.createElement("div");
            nameContainer.className = "name-container";
            nameContainer.textContent = product.название;
            nameCell.appendChild(nameContainer);
            if (!product.кратность) {
              product.кратность = getRandomMultiplicity();
            }
            const orderContainer = document.createElement("div");
            orderContainer.className = "order-container";
            const orderMultiplicity = document.createElement("div");
            orderMultiplicity.className = "order-multiplicity";
            orderMultiplicity.textContent = "Кратность: " + product.кратность;
            const orderControls = document.createElement("div");
            orderControls.className = "order-controls";
            const qtyInput = document.createElement("input");
            qtyInput.type = "number";
            qtyInput.className = "qty-input";
            qtyInput.placeholder = "Кол-во";
            qtyInput.min = product.кратность;
            qtyInput.addEventListener("blur", function () {
              let val = parseInt(qtyInput.value, 10);
              if (isNaN(val) || val < product.кратность) {
                qtyInput.value = product.кратность;
              } else if (val % product.кратность !== 0) {
                qtyInput.value =
                  Math.ceil(val / product.кратность) * product.кратность;
              }
            });
            orderControls.appendChild(qtyInput);
            const cartBtn = document.createElement("button");
            cartBtn.className = "cart-btn";
            cartBtn.title = "Добавить минимальное количество";
            cartBtn.innerHTML = '<i class="ri-shopping-cart-line"></i>';
            cartBtn.addEventListener("click", function () {
              qtyInput.value = product.кратность;
            });
            orderControls.appendChild(cartBtn);
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-btn";
            removeBtn.title = "Удалить позицию";
            removeBtn.innerHTML = '<i class="ri-close-line"></i>';
            removeBtn.addEventListener("click", function () {
              productsData = productsData.filter((p) => p.id !== product.id);
              buildTable();
            });
            orderControls.appendChild(removeBtn);
            orderContainer.appendChild(orderMultiplicity);
            orderContainer.appendChild(orderControls);
            nameCell.appendChild(orderContainer);
            row.appendChild(nameCell);

            // Столбец с ценой
            const priceCell = document.createElement("td");
            priceCell.textContent = product.стоимость + " ₽";
            row.appendChild(priceCell);

            // Если это первая строка, создаём четвертый столбец с объединённым контейнером
            if (index === 0) {
              const extraCell = document.createElement("td");
              extraCell.rowSpan = displayedProducts.length;
              extraCell.style.verticalAlign = "top";

              // Создаем внутренний контейнер и применяем стили
              const extraContainer = document.createElement("div");
              extraContainer.style.height = "80vh";
              extraContainer.style.padding = "15px";
              extraContainer.style.border = "1px solid #ddd";
              extraContainer.style.borderRadius = "15px";
              extraContainer.style.textAlign = "center";
              extraContainer.style.display = "flex";
              extraContainer.style.flexDirection = "column";
              extraContainer.style.alignItems = "center";
              extraContainer.style.justifyContent = "center";
              extraContainer.style.margin = "0";
              extraContainer.style.width = "100%";

              // Добавляем иконку над текстом
              const icon = document.createElement("i");
              icon.className = "ri-exchange-line";
              icon.style.fontSize = "150px";
              icon.style.color = "#c7c7c7";
              icon.style.marginBottom = "15px";
              extraContainer.appendChild(icon);

              // Добавляем текстовый блок
              const textDiv = document.createElement("div");
              textDiv.textContent =
                "Для сравнения товаров вы можете выбирать характеристики и производить сортировку по любому столбцу нажатием на заголовок";

              extraContainer.appendChild(textDiv);
              textDiv.style.marginBottom = "50px";
              textDiv.style.color = "#848482";
              extraCell.appendChild(extraContainer);
              row.appendChild(extraCell);
            }
            tbody.appendChild(row);
          });
        } else {
          // Если выбраны характеристики, выводим строки с базовыми столбцами и столбцами характеристик
          displayedProducts.forEach((product) => {
            const row = document.createElement("tr");

            // Столбец с изображением
            const imageCell = document.createElement("td");
            imageCell.style.width = "70px";
            const img = document.createElement("img");
            img.src = product.изображение;
            img.alt = product.название;
            imageCell.appendChild(img);
            row.appendChild(imageCell);

            // Столбец с названием и управлением заказа
            const nameCell = document.createElement("td");
            const nameContainer = document.createElement("div");
            nameContainer.className = "name-container";
            nameContainer.textContent = product.название;
            nameCell.appendChild(nameContainer);
            if (!product.кратность) {
              product.кратность = getRandomMultiplicity();
            }
            const orderContainer = document.createElement("div");
            orderContainer.className = "order-container";
            const orderMultiplicity = document.createElement("div");
            orderMultiplicity.className = "order-multiplicity";
            orderMultiplicity.textContent = "Кратность: " + product.кратность;
            const orderControls = document.createElement("div");
            orderControls.className = "order-controls";
            const qtyInput = document.createElement("input");
            qtyInput.type = "number";
            qtyInput.className = "qty-input";
            qtyInput.placeholder = "Кол-во";
            qtyInput.min = product.кратность;
            qtyInput.addEventListener("blur", function () {
              let val = parseInt(qtyInput.value, 10);
              if (isNaN(val) || val < product.кратность) {
                qtyInput.value = product.кратность;
              } else if (val % product.кратность !== 0) {
                qtyInput.value =
                  Math.ceil(val / product.кратность) * product.кратность;
              }
            });
            orderControls.appendChild(qtyInput);
            const cartBtn = document.createElement("button");
            cartBtn.className = "cart-btn";
            cartBtn.title = "Добавить минимальное количество";
            cartBtn.innerHTML = '<i class="ri-shopping-cart-line"></i>';
            cartBtn.addEventListener("click", function () {
              qtyInput.value = product.кратность;
            });
            orderControls.appendChild(cartBtn);
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-btn";
            removeBtn.title = "Удалить позицию";
            removeBtn.innerHTML = '<i class="ri-close-line"></i>';
            removeBtn.addEventListener("click", function () {
              productsData = productsData.filter((p) => p.id !== product.id);
              buildTable();
            });
            orderControls.appendChild(removeBtn);
            orderContainer.appendChild(orderMultiplicity);
            orderContainer.appendChild(orderControls);
            nameCell.appendChild(orderContainer);
            row.appendChild(nameCell);

            // Столбец с ценой
            const priceCell = document.createElement("td");
            priceCell.textContent = product.стоимость + " ₽";
            row.appendChild(priceCell);

            // Добавляем ячейки для каждой выбранной характеристики
            selectedCharacteristics.forEach((char) => {
              const cell = document.createElement("td");
              let value = product[char.key];
              if (typeof value === "boolean") {
                value = value ? "Да" : "Нет";
              }
              cell.textContent = value;
              row.appendChild(cell);
            });
            tbody.appendChild(row);
          });
        }
        table.appendChild(tbody);
        tableView.innerHTML = "";
        tableView.appendChild(table);
        attachImagePopup();
      }
    }

    function headerSortHandler(e) {
      const sortKey = e.currentTarget.dataset.sortKey;
      if (!sortKey) return;
      if (sortConfig.key === sortKey) {
        sortConfig.order = sortConfig.order === "asc" ? "desc" : "asc";
      } else {
        sortConfig.key = sortKey;
        sortConfig.order = "asc";
      }
      buildTable();
    }

    // Функция для реализации всплывающего клона изображения
    function attachImagePopup() {
      const images = d.querySelectorAll(".table-view img");
      images.forEach((img) => {
        img.addEventListener("mouseenter", function () {
          const rect = img.getBoundingClientRect();
          const popup = img.cloneNode(true);
          popup.classList.add("img-popup");
          // Применяем стили для всплывающего изображения:
          popup.style.pointerEvents = "none";
          popup.style.transition = "opacity 0.3s ease, transform 0.2s ease";
          popup.style.borderRadius = "10px";
          popup.style.boxShadow = "0px 10px 20px rgba(0, 0, 0, 0.2)";
          popup.style.padding = "5px";
          popup.style.background = "white";

          // Остальные стили:
          popup.style.position = "absolute";
          popup.style.width = "300px";
          popup.style.height = "auto";
          popup.style.zIndex = "1000";
          popup.style.left = rect.right + 10 + "px";
          popup.style.top = rect.top + "px";
          document.body.appendChild(popup);
          const popupRect = popup.getBoundingClientRect();
          if (popupRect.bottom > window.innerHeight) {
            popup.style.top = window.innerHeight - popupRect.height - 10 + "px";
          }
          if (popupRect.top < 0) {
            popup.style.top = "10px";
          }
        });
        img.addEventListener("mouseleave", function () {
          const popup = document.querySelector(".img-popup");
          if (popup) {
            popup.remove();
          }
        });
      });
    }

    buildTable();
  };

  if (root instanceof Document) {
    if (root.readyState === "loading") {
      root.addEventListener("DOMContentLoaded", run);
    } else {
      run();
    }
  } else {
    run();
  }
};
