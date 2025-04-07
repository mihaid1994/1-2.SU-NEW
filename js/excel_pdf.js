window.initExcelPdf = function (root = window) {
  // Проверяем наличие библиотек
  if (typeof XLSX === "undefined") {
    console.error("Библиотека SheetJS не подключена.");
  }
  if (
    typeof window.jspdf === "undefined" ||
    typeof window.jspdf.jsPDF !== "function"
  ) {
    console.error("Библиотека jsPDF не подключена.");
  }
  if (typeof html2canvas === "undefined") {
    console.error("Библиотека html2canvas не подключена.");
  }

  //---------------------------------------------------------
  // 1. Утилиты для расчета данных доставки
  //---------------------------------------------------------
  function parseDeliveryDays(logisticString) {
    const match = logisticString.match(/до (\d+) дней/);
    return match ? parseInt(match[1], 10) : 1;
  }

  function calculateDeliveryDate(days) {
    const currentDate = new Date();
    const deliveryDate = new Date(currentDate);
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toLocaleDateString("ru-RU");
  }

  function calculateDeliveryDateForItem(item) {
    const deliveryDays = parseDeliveryDays(item["Логистика"]);
    return calculateDeliveryDate(deliveryDays);
  }

  function getUniqueDeliveryDates(items) {
    const deliveryDates = items.map((item) =>
      calculateDeliveryDateForItem(item)
    );
    return [...new Set(deliveryDates)];
  }

  // Определяем, единая ли у всех дата доставки
  function isDeliveryMode(items) {
    const uniqueDates = getUniqueDeliveryDates(items);
    return uniqueDates.length === 1;
  }

  //---------------------------------------------------------
  // 2. Подготовка данных и генерация Excel
  //---------------------------------------------------------
  function prepareItemsForExport(items) {
    // Копия массива, чтобы не мутировать оригинал
    return items.map((item) => {
      // Преобразуем наличие
      let availability = parseInt(item["Наличие"], 10);
      if (!Number.isNaN(availability) && availability <= 0) {
        // Если 0 или меньше - меняем на случайное значение [1..10]
        availability = Math.floor(Math.random() * 10) + 1;
      }
      return {
        ...item,
        // Записываем обратно в виде строки
        Наличие: availability.toString(),
      };
    });
  }

  async function handleDownloadExcel(items, cartDate) {
    try {
      // Подготавливаем товары (для Excel можно оставить автоматическую обработку)
      const preparedItems = prepareItemsForExport(items);

      // Применяем скидку: для всех товаров скидка 0, для трёх случайных – от 7 до 25%
      preparedItems.forEach((item) => {
        item.discountPercent = 0;
      });
      const countDiscount = Math.min(3, preparedItems.length);
      const indices = [];
      while (indices.length < countDiscount) {
        const r = Math.floor(Math.random() * preparedItems.length);
        if (!indices.includes(r)) indices.push(r);
      }
      indices.forEach((i) => {
        const discount = Math.floor(Math.random() * (25 - 7 + 1)) + 7;
        preparedItems[i].discountPercent = discount;
      });

      const deliveryMode = isDeliveryMode(preparedItems);
      let deliveryDate = "N/A";
      if (deliveryMode) {
        deliveryDate = calculateDeliveryDateForItem(preparedItems[0]);
      }

      // Вычисляем итоговую сумму с учетом цены со скидкой
      const totalDiscountedSum = preparedItems.reduce((sum, item) => {
        const originalPrice = parseFloat(item["Цена"]) || 0;
        const discount = item.discountPercent ? item.discountPercent / 100 : 0;
        const discountedPrice = originalPrice * (1 - discount);
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + discountedPrice * quantity;
      }, 0);

      // Формируем данные для листа Excel
      const worksheetData = preparedItems.map((item, index) => {
        // Для "Наличие": если значение больше или равно 100, округляем до ">100шт" (только для конечного PDF)
        const availabilityValue = parseInt(item["Наличие"], 10) || 0;
        const availabilityDisplay =
          availabilityValue >= 100 ? ">100шт" : availabilityValue.toString();

        // Для "Количество": правило не применяется, выводим точное число
        const quantity = parseInt(item.quantity, 10) || 0;
        const quantityDisplay = quantity.toString();

        const originalPrice = parseFloat(item["Цена"]) || 0;
        return {
          "#": index + 1,
          Код: item["Код"],
          Наименование: item["Наименование"],
          // Обычную цену записываем с переводом строки: первая строка – цена, вторая – скидка
          Цена: `${originalPrice.toFixed(2)} ₽\n- ${item.discountPercent}%`,
          Наличие: availabilityDisplay,
          Количество: quantityDisplay,
          Сумма: (
            originalPrice *
            (1 - (item.discountPercent || 0) / 100) *
            quantity
          ).toFixed(2),
          Изображение: item["Изображение"] || "N/A",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Устанавливаем ширину столбцов
      worksheet["!cols"] = [
        { width: 5 },
        { width: 10 },
        { width: 80 },
        { width: 15 },
        { width: 10 },
        { width: 10 },
        { width: 15 },
        { width: 30 },
      ];

      // Добавляем гиперссылки на изображения (если нужно)
      preparedItems.forEach((item, index) => {
        const row = index + 2;
        const cellAddress = `H${row}`; // 8-й столбец (H) для ссылок на картинки
        worksheet[cellAddress] = {
          t: "s",
          v: item["Изображение"],
          l: { Target: item["Изображение"] },
        };
      });

      // Добавляем итоговую сумму
      const lastDataRow = worksheetData.length + 1; // +1 учитывает заголовок
      const totalRow = lastDataRow + 1;
      worksheet[`F${totalRow}`] = { t: "s", v: "Итого" };
      worksheet[`G${totalRow}`] = { t: "n", v: totalDiscountedSum };

      // Формируем книгу и сохраняем
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Товары");

      let filename = `Коммерческое предложение от ${cartDate}`;
      if (deliveryMode) {
        filename += ` - Доставка на ${deliveryDate}`;
      }
      filename += ".xlsx";

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Ошибка при скачивании Excel:", error);
      alert("Не удалось скачать Excel файл.");
    }
  }

  //---------------------------------------------------------
  // 3. Генерация HTML-контейнера для PDF (базовые стили)
  //---------------------------------------------------------
  function generatePDFBaseTableHTML(fontSize) {
    return `
      <style>
        /* Универсальные стили таблицы для PDF */
        table#pdf-table {
          border-collapse: collapse;
          width: 100%;
          background: transparent;
          text-align: center;
          font-family: Arial, sans-serif;
          font-size: ${fontSize}px;
        }
        table#pdf-table th,
        table#pdf-table td {
          border: 1px solid #ccc;
          padding: 3px;
          vertical-align: middle;
        }
      </style>
  
      <table id="pdf-table">
        <thead>
          <tr>
            <th style="width: 3%;">#</th>
            <th style="width: 8%;">Изображение</th>
            <th style="width: 8%;">Код</th>
            <th style="width: auto;">Наименование</th>
            <th style="width: 15%;">Цена</th>
            <th style="width: 10%;">Наличие</th>
            <th style="width: 8%;">Кол.</th>
            <th style="width: 15%;">Сумма</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
  }

  // Генерация HTML-строк (тело таблицы) для каждой позиции
  // offset для непрерывной нумерации
  function generateTableRowsHTML(items, rowHeight, fontSize, offset = 0) {
    let rowsHTML = "";
    items.forEach((item, index) => {
      const numbering = offset + index + 1;
      const originalPrice = parseFloat(item["Цена"]) || 0;
      const discountPercent = parseFloat(item.discountPercent) || 0;
      const discount = discountPercent ? discountPercent / 100 : 0;
      const discountedPrice = originalPrice * (1 - discount);
      const quantity = parseInt(item.quantity, 10) || 0;
      // Для "Наличие": если значение больше или равно 100, округляем до ">100шт"
      const availabilityValue = parseInt(item["Наличие"], 10) || 0;
      const availabilityDisplay =
        availabilityValue >= 100 ? ">100шт" : availabilityValue.toString();
      const quantityDisplay = quantity.toString();
      const sum = (discountedPrice * quantity).toFixed(2);

      let priceHTML = "";
      if (discountPercent !== 0) {
        priceHTML = `
          <div style="text-decoration: line-through;">${originalPrice.toFixed(
            2
          )} ₽</div>
          <div>- ${discountPercent}%</div>
          <div>${discountedPrice.toFixed(2)} ₽</div>
        `;
      } else {
        priceHTML = `${originalPrice.toFixed(2)} ₽`;
      }

      rowsHTML += `
        <tr style="height: ${rowHeight}px;">
          <td>${numbering}</td>
          <td>
            <img src="${item["Изображение"]}" alt="Изображение" 
                 style="width: ${rowHeight}px; height: ${rowHeight}px; object-fit: cover;">
          </td>
          <td>${item["Код"]}</td>
          <td>${item["Наименование"]}</td>
          <td>${priceHTML}</td>
          <td>${availabilityDisplay}</td>
          <td>${quantityDisplay}</td>
          <td>${sum} ₽</td>
        </tr>
      `;
    });
    return rowsHTML;
  }

  //---------------------------------------------------------
  // 4. Генерация PDF c учётом ручного ввода из модального окна
  //    Здесь используются значения, введённые пользователем:
  //      - Для каждой позиции: количество и скидка
  //      - Общая скидка (процент)
  //      - Область для доп. условий (текст)
  //    Автоматическая генерация скидок и количества отключена.
  //---------------------------------------------------------
  async function handleDownloadPDFManual(
    preparedItems,
    cartDate,
    overallDiscountInput,
    additionalConditionsText
  ) {
    try {
      // Добавляем вычисление цены со скидкой для каждого товара на основе ручного ввода
      preparedItems.forEach((item) => {
        const originalPrice = parseFloat(item["Цена"]) || 0;
        const discount = parseFloat(item.discountPercent)
          ? parseFloat(item.discountPercent) / 100
          : 0;
        item.discountedPrice = originalPrice * (1 - discount);
      });

      const deliveryMode = isDeliveryMode(preparedItems);
      let deliveryDate = "N/A";
      if (deliveryMode) {
        deliveryDate = calculateDeliveryDateForItem(preparedItems[0]);
      }

      // Итоговая сумма с учетом цены со скидкой
      const totalDiscountedSum = preparedItems.reduce((sum, item) => {
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + item.discountedPrice * quantity;
      }, 0);

      // Применяем общую скидку, введённую пользователем
      const overallDiscount = parseFloat(overallDiscountInput) || 0;
      const overallDiscountAmount =
        totalDiscountedSum * (overallDiscount / 100);
      const finalTotal = totalDiscountedSum - overallDiscountAmount;

      // Параметры PDF
      const pdfConfig = {
        margin: 15,
        baseFontSize: 9,
        fontScale: 1.3,
        rowHeight: 100,
        itemsPerPage: 8,
      };

      const fontSize = pdfConfig.baseFontSize * pdfConfig.fontScale;
      const { jsPDF } = root.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");

      // Размеры страницы
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = pdfConfig.margin;
      const imgWidthMM = pageWidth - margin * 2;

      // Базовая структура таблицы (стили + заголовок таблицы)
      const baseTableHTML = generatePDFBaseTableHTML(fontSize);

      // Функция для формирования шапки страницы
      function generateHeaderHTML() {
        return `
          <div style="position: relative; font-family: Arial, sans-serif; font-size: ${fontSize}px; color: #000; padding: 10px; width: 800px; min-height: 120px;">
            <img src="/images/svg/logo/energomixlogo.svg" 
                 alt="Логотип" 
                 style="position: absolute; right: 0px; top: 10px; width: 35%; height: auto;">
            <div style="margin-left: 0;">
              <h2 style="margin: 10px 0 0 0; position: relative;">Коммерческое предложение</h2>
              <div style="margin-top: 10px;">
                <p><strong>От:</strong> ООО "СБ Логистик"</p>
                <p>
                  <strong>Торговый представитель:</strong> Шуравин Михаил Александрович 
                  &nbsp;&nbsp; <strong>Телефон:</strong> +7 (992) 017 5024
                </p>
                <p><strong>Для:</strong> ПАО Сбербанк Москва</p>
                <p style="font-size: ${fontSize * 0.9}px;">
                  Настоящее КП является официальным предложением и соответствует условиям договора
                </p>
                <p><strong>${cartDate}${
          deliveryMode ? ` – Доставка на ${deliveryDate}` : ""
        }</strong></p>
              </div>
            </div>
          </div>
        `;
      }

      // Создадим временный контейнер для рендера PDF
      const tempContainer = root.document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "800px"; // фиксированная ширина под скриншот
      tempContainer.style.boxSizing = "border-box";

      root.document.body.appendChild(tempContainer);

      // Всегда добавляем дополнительную страницу для области дополнительных условий.
      // Итоговое количество страниц = pagesCount (рассчитанное по товарам) + 1.
      const pagesCount = Math.ceil(
        preparedItems.length / pdfConfig.itemsPerPage
      );
      const totalPages = pagesCount + 1;

      // Перебираем страницы с товарами и рендерим их
      for (let pageIndex = 0; pageIndex < pagesCount; pageIndex++) {
        const startIndex = pageIndex * pdfConfig.itemsPerPage;
        const endIndex = startIndex + pdfConfig.itemsPerPage;
        const pageItems = preparedItems.slice(startIndex, endIndex);

        const headerHTML = generateHeaderHTML();
        tempContainer.innerHTML = headerHTML + baseTableHTML;
        const table = tempContainer.querySelector("#pdf-table");
        const tbody = table.querySelector("tbody");

        tbody.innerHTML = generateTableRowsHTML(
          pageItems,
          pdfConfig.rowHeight,
          fontSize,
          startIndex
        );

        // Если это последняя страница списка товаров, добавляем итоговые три строки
        if (pageIndex === pagesCount - 1) {
          const totalsHTML = `
            <tr>
              <td colspan="6" style="text-align: right;"><strong>Сумма</strong></td>
              <td colspan="2">${totalDiscountedSum.toFixed(2)} ₽</td>
            </tr>
            <tr>
              <td colspan="6" style="text-align: right;"><strong>Общая скидка (${overallDiscount}% )</strong></td>
              <td colspan="2">- ${overallDiscountAmount.toFixed(2)} ₽</td>
            </tr>
            <tr>
              <td colspan="6" style="text-align: right;"><strong>Итог</strong></td>
              <td colspan="2">${finalTotal.toFixed(2)} ₽</td>
            </tr>
          `;
          tbody.insertAdjacentHTML("beforeend", totalsHTML);
        }

        // Нумерация страниц для каждого листа товаров
        const paginationHTML = `<div style="width: 100%; margin-top: 10px;">
          <span style="float: right;">${pageIndex + 1}/${totalPages}</span>
        </div>`;
        tempContainer.insertAdjacentHTML("beforeend", paginationHTML);

        // Рендерим содержимое во временный canvas
        const pageCanvas = await html2canvas(tempContainer, {
          scale: 3,
          useCORS: true,
          logging: false,
          allowTaint: false,
        });

        if (pageIndex > 0) {
          pdf.addPage();
        }
        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.8);
        const ratio = pageCanvas.width / imgWidthMM;
        const imgHeightMM = pageCanvas.height / ratio;
        pdf.addImage(
          pageImgData,
          "JPEG",
          margin,
          margin,
          imgWidthMM,
          imgHeightMM
        );
      }

      // Рендерим отдельную страницу для области дополнительных условий
      const headerHTML = generateHeaderHTML();
      const additionalAreaHTML = `
        <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; margin-top: 20px;">
          <tr style="height: ${pdfConfig.rowHeight * 3}px;">
            <td style="text-align: left; vertical-align: top; padding: 10px; font-size: ${
              fontSize * 1.5
            }px;">
              ${
                additionalConditionsText ||
                "Область для дополнительных условий..."
              }
            </td>
          </tr>
        </table>
      `;
      const paginationHTML = `<div style="width: 100%; margin-top: 10px;">
        <span style="float: right;">${totalPages}/${totalPages}</span>
      </div>`;
      tempContainer.innerHTML =
        headerHTML + additionalAreaHTML + paginationHTML;
      pdf.addPage();
      const pageCanvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        logging: false,
        allowTaint: false,
      });
      const ratio = pageCanvas.width / imgWidthMM;
      const imgHeightMM = pageCanvas.height / ratio;
      pdf.addImage(
        pageCanvas.toDataURL("image/jpeg", 0.8),
        "JPEG",
        margin,
        margin,
        imgWidthMM,
        imgHeightMM
      );

      // Формируем имя PDF-файла
      let filename = `Коммерческое предложение от ${cartDate}`;
      if (deliveryMode) {
        filename += ` - Доставка на ${deliveryDate}`;
      }
      filename += ".pdf";

      pdf.save(filename);
      root.document.body.removeChild(tempContainer);
    } catch (error) {
      console.error("Ошибка при скачивании PDF:", error);
      alert("Не удалось скачать PDF файл.");
    }
  }

  //---------------------------------------------------------
  // 5. Модальное окно для ручного ввода параметров PDF
  //---------------------------------------------------------
  function showPDFModal(items, cartDate) {
    // Создаем оверлей с блюром и центруем модальное окно
    const overlay = document.createElement("div");
    overlay.id = "pdf-modal-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.backdropFilter = "blur(5px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 9999;

    // Модальное окно
    const modal = document.createElement("div");
    modal.id = "pdf-modal";
    modal.style.background = "#fff";
    modal.style.borderRadius = "8px";
    modal.style.padding = "20px";
    modal.style.width = "90%";
    modal.style.maxWidth = "900px";
    modal.style.maxHeight = "90%";
    modal.style.overflowY = "auto";
    modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";

    // Заголовок модального окна
    const modalHeader = document.createElement("h2");
    modalHeader.textContent = "Настройка параметров PDF";
    modalHeader.style.marginTop = "0";
    modal.appendChild(modalHeader);

    // Форма для редактирования данных позиций
    const form = document.createElement("form");
    form.id = "pdf-modal-form";

    // Создаем таблицу с позициями
    let tableHTML = `
      <style>
        #pdf-modal-form table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        #pdf-modal-form th, #pdf-modal-form td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: center;
        }
        #pdf-modal-form input[type="number"] {
          width: 60px;
          padding: 4px;
          text-align: center;
        }
        #pdf-modal-form input[type="text"] {
          width: 100%;
          padding: 4px;
        }
        #pdf-modal-form img {
          width: 50px;
          height: 50px;
          object-fit: cover;
        }
      </style>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Изображение</th>
            <th>Код</th>
            <th>Наименование</th>
            <th>Цена (₽)</th>
            <th>Наличие</th>
            <th>Скидка (%)</th>
            <th>Количество</th>
          </tr>
        </thead>
        <tbody>
    `;
    items.forEach((item, index) => {
      // В конструкторе столбец "Наличие" выводится как есть, без округления,
      // а инпуты для скидки и количества по умолчанию равны 0 и 1.
      tableHTML += `
        <tr data-index="${index}" data-availability="${parseInt(
        item["Наличие"],
        10
      )}">
          <td>${index + 1}</td>
          <td><img src="${item["Изображение"]}" alt="Изображение"></td>
          <td>${item["Код"]}</td>
          <td>${item["Наименование"]}</td>
          <td>${parseFloat(item["Цена"]).toFixed(2)}</td>
          <td>${item["Наличие"]}</td>
          <td>
            <input type="number" name="discount_${index}" value="0" min="0" max="100">
          </td>
          <td>
            <input type="number" name="quantity_${index}" value="1" min="1">
          </td>
        </tr>
      `;
      // Записываем в item первоначальные значения
      item.discountPercent = 0;
      item.quantity = 1;
    });
    tableHTML += `
        </tbody>
      </table>
    `;
    form.innerHTML += tableHTML;

    // Общая скидка по документу (в процентах)
    const overallDiscountLabel = document.createElement("label");
    overallDiscountLabel.textContent = "Общая скидка (%) : ";
    overallDiscountLabel.style.display = "block";
    overallDiscountLabel.style.marginBottom = "10px";
    const overallDiscountInput = document.createElement("input");
    overallDiscountInput.type = "number";
    overallDiscountInput.name = "overallDiscount";
    overallDiscountInput.value = "0";
    overallDiscountInput.min = "0";
    overallDiscountInput.max = "100";
    overallDiscountInput.style.marginLeft = "10px";
    overallDiscountLabel.appendChild(overallDiscountInput);
    form.appendChild(overallDiscountLabel);

    // Область для дополнительных условий
    const additionalCondLabel = document.createElement("label");
    additionalCondLabel.textContent = "Дополнительные условия: ";
    additionalCondLabel.style.display = "block";
    additionalCondLabel.style.marginBottom = "10px";
    const additionalCondInput = document.createElement("input");
    additionalCondInput.type = "text";
    additionalCondInput.name = "additionalConditions";
    additionalCondInput.placeholder = "Введите дополнительные условия...";
    additionalCondInput.style.marginLeft = "10px";
    additionalCondInput.style.width = "100%";
    additionalCondLabel.appendChild(additionalCondInput);
    form.appendChild(additionalCondLabel);

    // Кнопка для запуска формирования PDF
    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.textContent = "Сформировать";
    submitButton.style.padding = "10px 20px";
    submitButton.style.border = "none";
    submitButton.style.background = "#007bff";
    submitButton.style.color = "#fff";
    submitButton.style.borderRadius = "4px";
    submitButton.style.cursor = "pointer";
    form.appendChild(submitButton);

    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // При потере фокуса в инпуте количества проверяем, чтобы введенное значение не превышало значение "Наличие"
    form.querySelectorAll('input[name^="quantity_"]').forEach((input) => {
      input.addEventListener("blur", function () {
        const row = input.closest("tr");
        const available = parseInt(row.getAttribute("data-availability"), 10);
        let value = parseInt(input.value, 10);
        if (value > available) {
          input.value = available;
        }
      });
    });

    // Обработчик на кнопку "Сформировать"
    submitButton.addEventListener("click", async function () {
      // Обновляем данные для каждой позиции из формы
      items.forEach((item, index) => {
        const discountVal = form.querySelector(
          `input[name="discount_${index}"]`
        ).value;
        const quantityVal = form.querySelector(
          `input[name="quantity_${index}"]`
        ).value;
        item.discountPercent = parseFloat(discountVal) || 0;
        item.quantity = parseInt(quantityVal, 10) || 1;
      });
      const overallDiscountVal = overallDiscountInput.value;
      const additionalConditionsVal = additionalCondInput.value;

      // Закрываем модальное окно
      document.body.removeChild(overlay);

      // Запускаем рендер PDF с ручными данными
      await handleDownloadPDFManual(
        items,
        cartDate,
        overallDiscountVal,
        additionalConditionsVal
      );
    });

    // Закрытие модального окна при клике вне области
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  //---------------------------------------------------------
  // 6. Экспорт функций в глобальную область
  //---------------------------------------------------------
  // Функции для скачивания Excel и PDF (для PDF – открывается модальное окно для ручного ввода)
  root.handleDownloadExcel = handleDownloadExcel;
  root.handleDownloadPDF = function (items, cartDate) {
    // Открываем модальное окно для ручного редактирования параметров PDF
    showPDFModal(items, cartDate);
  };
};

// Автоматический вызов при загрузке
document.addEventListener("DOMContentLoaded", () => {
  window.initExcelPdf(window);
});
