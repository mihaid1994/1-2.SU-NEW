/**
 * Полный модуль экспорта: генерация Excel, PDF (коммерческое предложение)
 * и презентации с адаптивными карточками.
 *
 * Требуемые библиотеки:
 *  - SheetJS (XLSX)
 *  - jsPDF (jspdf.min.js)
 *  - html2canvas
 *  - pdfMake (pdfmake.min.js и vfs_fonts.js)
 */
(function (root) {
  // Проверка наличия библиотек
  if (typeof XLSX === "undefined") {
    console.error(
      "Библиотека SheetJS (XLSX) не подключена. Пожалуйста, подключите её."
    );
  }
  if (
    typeof root.jspdf === "undefined" ||
    typeof root.jspdf.jsPDF !== "function"
  ) {
    console.error("Библиотека jsPDF не подключена. Пожалуйста, подключите её.");
  }
  if (typeof html2canvas === "undefined") {
    console.error(
      "Библиотека html2canvas не подключена. Пожалуйста, подключите её."
    );
  }
  if (typeof pdfMake === "undefined") {
    console.error(
      "Библиотека pdfMake не подключена. Пожалуйста, подключите её."
    );
  }

  // ============================================================
  // 1. Утилиты для расчёта дат доставки
  // ============================================================
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

  // Определяем, едина ли у всех дата доставки
  function isDeliveryMode(items) {
    const uniqueDates = getUniqueDeliveryDates(items);
    return uniqueDates.length === 1;
  }

  // ============================================================
  // 2. Подготовка данных и генерация Excel
  // ============================================================
  function prepareItemsForExport(items) {
    return items.map((item) => {
      let availability = parseInt(item["Наличие"], 10);
      if (!Number.isNaN(availability) && availability <= 0) {
        availability = Math.floor(Math.random() * 10) + 1;
      }
      return {
        ...item,
        Наличие: availability.toString(),
      };
    });
  }

  async function handleDownloadExcel(items, cartDate) {
    try {
      const preparedItems = prepareItemsForExport(items);
      preparedItems.forEach((item) => {
        item.discountPercent = 0;
      });

      // Применяем случайную скидку к максимум трём товарам
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

      const totalDiscountedSum = preparedItems.reduce((sum, item) => {
        const originalPrice = parseFloat(item["Цена"]) || 0;
        const discount = (parseFloat(item.discountPercent) || 0) / 100;
        const discountedPrice = originalPrice * (1 - discount);
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + discountedPrice * quantity;
      }, 0);

      const worksheetData = preparedItems.map((item, index) => {
        const availabilityValue = parseInt(item["Наличие"], 10) || 0;
        const availabilityDisplay =
          availabilityValue >= 100 ? ">100шт" : availabilityValue.toString();
        const quantity = parseInt(item.quantity, 10) || 0;
        const originalPrice = parseFloat(item["Цена"]) || 0;
        return {
          "#": index + 1,
          Код: item["Код"],
          Наименование: item["Наименование"],
          Цена: `${originalPrice.toFixed(2)} ₽\n- ${item.discountPercent}%`,
          Наличие: availabilityDisplay,
          Количество: quantity.toString(),
          Сумма: (
            originalPrice *
            (1 - (item.discountPercent || 0) / 100) *
            quantity
          ).toFixed(2),
          Изображение: item["Изображение"] || "N/A",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
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

      // Добавляем гиперссылку для ячеек с изображениями
      preparedItems.forEach((item, index) => {
        const row = index + 2;
        const cellAddress = `H${row}`;
        worksheet[cellAddress] = {
          t: "s",
          v: item["Изображение"],
          l: { Target: item["Изображение"] },
        };
      });

      const lastDataRow = worksheetData.length + 1;
      const totalRow = lastDataRow + 1;
      worksheet[`F${totalRow}`] = { t: "s", v: "Итого" };
      worksheet[`G${totalRow}`] = { t: "n", v: totalDiscountedSum };

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

  // ============================================================
  // 3. Генерация базового HTML-контейнера для PDF КП
  // ============================================================
  function generatePDFBaseTableHTML(fontSize) {
    return `
      <style>
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

  function generateTableRowsHTML(items, rowHeight, fontSize, offset = 0) {
    let rowsHTML = "";
    items.forEach((item, index) => {
      const numbering = offset + index + 1;
      const originalPrice = parseFloat(item["Цена"]) || 0;
      const discountPercent = parseFloat(item.discountPercent) || 0;
      const discount = discountPercent / 100;
      const discountedPrice = originalPrice * (1 - discount);
      const quantity = parseInt(item.quantity, 10) || 0;
      const availabilityValue = parseInt(item["Наличие"], 10) || 0;
      const availabilityDisplay =
        availabilityValue >= 100 ? ">100шт" : availabilityValue.toString();
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
          <td>${quantity}</td>
          <td>${sum} ₽</td>
        </tr>
      `;
    });
    return rowsHTML;
  }

  // ============================================================
  // 4. Генерация PDF КП с ручным вводом параметров (через модальное окно)
  // ============================================================
  async function handleDownloadPDFManual(
    preparedItems,
    cartDate,
    overallDiscountInput,
    additionalConditionsText
  ) {
    try {
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
      const totalDiscountedSum = preparedItems.reduce((sum, item) => {
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + item.discountedPrice * quantity;
      }, 0);
      const overallDiscount = parseFloat(overallDiscountInput) || 0;
      const overallDiscountAmount =
        totalDiscountedSum * (overallDiscount / 100);
      const finalTotal = totalDiscountedSum - overallDiscountAmount;
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
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = pdfConfig.margin;
      const imgWidthMM = pageWidth - margin * 2;
      const baseTableHTML = generatePDFBaseTableHTML(fontSize);

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

      const tempContainer = root.document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "800px";
      tempContainer.style.boxSizing = "border-box";
      root.document.body.appendChild(tempContainer);

      const pagesCount = Math.ceil(
        preparedItems.length / pdfConfig.itemsPerPage
      );
      const totalPages = pagesCount + 1;
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
        const paginationHTML = `
          <div style="width: 100%; margin-top: 10px;">
            <span style="float: right;">${pageIndex + 1}/${totalPages}</span>
          </div>
        `;
        tempContainer.insertAdjacentHTML("beforeend", paginationHTML);
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
      const headerHTMLFinal = generateHeaderHTML();
      const additionalAreaHTML = `
        <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; margin-top: 20px;">
          <tr style="height: ${pdfConfig.rowHeight * 3}px;">
            <td style="text-align: left; vertical-align: top; padding: 10px; font-size: ${
              fontSize * 1.2
            }px;">
              ${
                additionalConditionsText ||
                "Область для дополнительных условий..."
              }
            </td>
          </tr>
        </table>
      `;
      const paginationHTMLFinal = `
        <div style="width: 100%; margin-top: 10px;">
          <span style="float: right;">${totalPages}/${totalPages}</span>
        </div>
      `;
      tempContainer.innerHTML =
        headerHTMLFinal + additionalAreaHTML + paginationHTMLFinal;
      pdf.addPage();
      const finalCanvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        logging: false,
        allowTaint: false,
      });
      const finalRatio = finalCanvas.width / imgWidthMM;
      const finalImgHeightMM = finalCanvas.height / finalRatio;
      pdf.addImage(
        finalCanvas.toDataURL("image/jpeg", 0.8),
        "JPEG",
        margin,
        margin,
        imgWidthMM,
        finalImgHeightMM
      );
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

  // ============================================================
  // 5. Функции для работы с PDF-презентациями
  // ============================================================

  // Константы для пропорций карточек
  const CARD_RATIO = { width: 3, height: 4.5 }; // Пропорции карточки товара

  // Функция для получения base64 из URL изображения
  async function getBase64FromUrl(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Ошибка при получении base64 из URL:", error);
      return "";
    }
  }

  // Обновленная функция для генерации PDF-презентации с использованием pdfMake
  // и строгими пропорциями 3:4.5 для карточек
  async function handleDownloadPresentationStyledUsingPdfMake(
    items,
    cartDate,
    itemsPerPage,
    orientation = "portrait"
  ) {
    try {
      // Приводим ориентацию к корректному виду
      const pdfOrientation =
        orientation === "portrait" ? "portrait" : "landscape";

      // Получаем base64 для изображений каждого товара
      const processedItems = await Promise.all(
        items.map(async (item) => {
          try {
            item.imgBase64 = await getBase64FromUrl(item["Изображение"]);
          } catch (err) {
            console.error(
              "Ошибка получения изображения для:",
              item["Наименование"],
              err
            );
            item.imgBase64 = "";
          }
          return item;
        })
      );

      // Параметры страницы A4 в пунктах (pt)
      const PAGE_WIDTH = pdfOrientation === "portrait" ? 595 : 842;
      const PAGE_HEIGHT = pdfOrientation === "portrait" ? 842 : 595;
      const PAGE_MARGIN = 50; // Увеличенный отступ от края страницы

      // Доступное пространство для карточек
      const AVAILABLE_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
      const AVAILABLE_HEIGHT = PAGE_HEIGHT - PAGE_MARGIN * 2;

      // Соотношение сторон карточки (ширина:высота)
      const CARD_RATIO = { width: 3, height: 4.5 };

      // Увеличенное расстояние между карточками
      const GAP = 20; // Расстояние между карточками

      // Фиксированный вертикальный отступ между карточками
      const VERTICAL_GAP = GAP;

      // Определяем количество колонок и строк на странице
      let columnsPerRow, rowsPerPage;

      if (itemsPerPage === 1) {
        columnsPerRow = 1;
        rowsPerPage = 1;
      } else if (itemsPerPage === 2) {
        if (pdfOrientation === "portrait") {
          columnsPerRow = 1;
          rowsPerPage = 2;
        } else {
          columnsPerRow = 2;
          rowsPerPage = 1;
        }
      } else if (itemsPerPage === 6) {
        if (pdfOrientation === "portrait") {
          columnsPerRow = 2;
          rowsPerPage = 3;
        } else {
          columnsPerRow = 3;
          rowsPerPage = 2;
        }
      } else if (itemsPerPage === 12) {
        if (pdfOrientation === "portrait") {
          columnsPerRow = 3;
          rowsPerPage = 4;
        } else {
          columnsPerRow = 4;
          rowsPerPage = 3;
        }
      } else {
        // Значение по умолчанию
        columnsPerRow = pdfOrientation === "portrait" ? 2 : 3;
        rowsPerPage = Math.ceil(itemsPerPage / columnsPerRow);
      }

      // Расчет размеров карточки по доступному пространству
      // Учитываем фиксированный вертикальный отступ
      const totalGapsHeight = VERTICAL_GAP * (rowsPerPage - 1);
      const maxCardHeight = (AVAILABLE_HEIGHT - totalGapsHeight) / rowsPerPage;

      // Расчет по ширине
      let horizontalGap = GAP;
      const totalGapsWidth = horizontalGap * (columnsPerRow - 1);
      const maxCardWidth = (AVAILABLE_WIDTH - totalGapsWidth) / columnsPerRow;

      // Определение финальных размеров с учетом пропорций
      let cardWidth, cardHeight;

      // Проверяем, какое измерение ограничивает размер карточки, чтобы сохранить пропорцию 3:4.5
      const heightBasedOnWidth =
        maxCardWidth * (CARD_RATIO.height / CARD_RATIO.width);
      const widthBasedOnHeight =
        maxCardHeight * (CARD_RATIO.width / CARD_RATIO.height);

      if (heightBasedOnWidth <= maxCardHeight) {
        // Ограничение по ширине
        cardWidth = maxCardWidth;
        cardHeight = heightBasedOnWidth;
      } else {
        // Ограничение по высоте
        cardWidth = widthBasedOnHeight;
        cardHeight = maxCardHeight;
      }

      // Адаптивный расчет горизонтального отступа для заполнения доступного пространства
      if (columnsPerRow > 1) {
        horizontalGap =
          (AVAILABLE_WIDTH - cardWidth * columnsPerRow) / (columnsPerRow - 1);
      }

      // Соотношения внутренних элементов карточки
      const IMAGE_HEIGHT_RATIO = 0.65; // Доля высоты карточки для изображения
      const TITLE_HEIGHT_RATIO = 0.15; // Доля высоты карточки для названия
      const INFO_HEIGHT_RATIO = 0.2; // Доля высоты карточки для блока информации

      // Расчет размеров элементов карточки
      const imageSize = cardWidth; // Изображение квадратное, ширина = высота
      const titleHeight = cardHeight * TITLE_HEIGHT_RATIO;
      const infoHeight = cardHeight * INFO_HEIGHT_RATIO;

      // Расчет размеров шрифтов и отступов пропорционально размеру карточки
      const TITLE_FONT_SIZE = Math.max(8, cardWidth / 25);
      const INFO_FONT_SIZE = Math.max(7, cardWidth / 30);
      const PRICE_FONT_SIZE = Math.max(12, cardWidth / 15);

      // Ограничение количества строк в названии товара (максимум 2 строки)
      const MAX_TITLE_LINES = 2;

      // Служебная информация - логгируем расчетные значения для отладки
      console.log("Размеры страницы:", {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });
      console.log("Доступное пространство:", {
        width: AVAILABLE_WIDTH,
        height: AVAILABLE_HEIGHT,
      });
      console.log("Сетка:", { columns: columnsPerRow, rows: rowsPerPage });
      console.log("Отступы:", {
        vertical: VERTICAL_GAP,
        horizontal: horizontalGap,
      });
      console.log("Размеры карточки:", {
        width: cardWidth,
        height: cardHeight,
      });
      console.log("Размеры элементов:", {
        imageSize,
        titleHeight,
        infoHeight,
        titleFontSize: TITLE_FONT_SIZE,
        infoFontSize: INFO_FONT_SIZE,
        priceFontSize: PRICE_FONT_SIZE,
      });

      const totalPages = Math.ceil(processedItems.length / itemsPerPage);
      const contentPages = [];

      // Функция для ограничения текста определенным количеством строк с многоточием
      function truncateTitle(title, fontSize, maxWidth, maxLines) {
        // Примерное количество символов в строке (эмпирический расчет)
        const charsPerLine = Math.floor(maxWidth / (fontSize * 0.5));

        // Примерное максимальное количество символов для maxLines строк
        const maxChars = charsPerLine * maxLines;

        if (title.length <= maxChars) {
          return title;
        } else {
          return title.substring(0, maxChars - 3) + "...";
        }
      }

      // Разбиваем товары по страницам
      for (let p = 0; p < totalPages; p++) {
        let pageItems = processedItems.slice(
          p * itemsPerPage,
          (p + 1) * itemsPerPage
        );

        // Если товаров меньше, чем itemsPerPage – дополняем пустыми объектами
        while (pageItems.length < itemsPerPage) {
          pageItems.push({});
        }

        // Формирование таблицы карточек
        const tableBody = [];
        for (let r = 0; r < rowsPerPage; r++) {
          const row = [];
          for (let c = 0; c < columnsPerRow; c++) {
            const index = r * columnsPerRow + c;
            const item = pageItems[index];

            if (item && item["Наименование"]) {
              // Форматируем цену для отображения
              const price = parseFloat(item["Цена"]).toFixed(0);

              // Ограничиваем название товара двумя строками
              const truncatedTitle = truncateTitle(
                item["Наименование"],
                TITLE_FONT_SIZE,
                cardWidth - 10, // Учитываем отступы по бокам
                MAX_TITLE_LINES
              );

              row.push({
                stack: [
                  // Изображение товара (квадратное, занимает всю ширину)
                  {
                    stack: [
                      item.imgBase64
                        ? {
                            image: item.imgBase64,
                            width: imageSize,
                            height: imageSize,
                            fit: [imageSize, imageSize],
                          }
                        : {
                            text: "[Нет изображения]",
                            alignment: "center",
                            fontSize: TITLE_FONT_SIZE,
                            margin: [0, imageSize / 2 - 10, 0, 0],
                          },
                    ],
                    // Рамка для отладки вокруг изображения
                    border: [true, true, true, true],
                    borderColor: "#ff0000",
                  },

                  // Название товара
                  {
                    text: truncatedTitle,
                    fontSize: TITLE_FONT_SIZE,
                    alignment: "left",
                    margin: [0, 3, 0, 3],
                    height: titleHeight,
                    // Рамка для отладки вокруг названия
                    border: [true, true, true, true],
                    borderColor: "#00ff00",
                  },

                  // Блок информации: наличие/код слева, цена справа
                  {
                    columns: [
                      // Левая колонка: Наличие и Код
                      {
                        width: "60%",
                        stack: [
                          // Наличие
                          {
                            columns: [
                              {
                                text: "Наличие:",
                                fontSize: INFO_FONT_SIZE,
                                width: "auto",
                              },
                              {
                                text: item["Наличие"],
                                fontSize: INFO_FONT_SIZE,
                                bold: true,
                                width: "*",
                              },
                            ],
                            margin: [0, 0, 0, 2],
                          },
                          // Код
                          item["Код"]
                            ? {
                                columns: [
                                  {
                                    text: "Код:",
                                    fontSize: INFO_FONT_SIZE,
                                    width: "auto",
                                  },
                                  {
                                    text: item["Код"],
                                    fontSize: INFO_FONT_SIZE,
                                    bold: true,
                                    width: "*",
                                  },
                                ],
                              }
                            : {},
                        ],
                        // Рамка для отладки вокруг блока наличия/кода
                        border: [true, true, true, true],
                        borderColor: "#0000ff",
                      },
                      // Правая колонка: Цена (крупно)
                      {
                        width: "40%",
                        text: price + " ₽",
                        fontSize: PRICE_FONT_SIZE,
                        bold: true,
                        alignment: "right",
                        // Рамка для отладки вокруг цены
                        border: [true, true, true, true],
                        borderColor: "#ff00ff",
                      },
                    ],
                    height: infoHeight,
                  },
                ],
                // Общая рамка для отладки вокруг всей карточки
                border: [true, true, true, true],
                borderColor: "#000000",
                borderWidth: 2,
                width: cardWidth,
                height: cardHeight,
              });
            } else {
              // Пустая ячейка с рамкой для отладки
              row.push({
                stack: [],
                border: [true, true, true, true],
                borderColor: "#cccccc",
                borderStyle: "dashed",
                width: cardWidth,
                height: cardHeight,
              });
            }
          }
          tableBody.push(row);
        }

        // Настройка таблицы для размещения карточек с учетом разных отступов по вертикали и горизонтали
        const tableConfig = {
          table: {
            body: tableBody,
            widths: Array(columnsPerRow).fill(cardWidth),
            heights: Array(rowsPerPage).fill(cardHeight),
          },
          layout: {
            hLineWidth: function (i, node) {
              return 0; // Убираем горизонтальные линии таблицы
            },
            vLineWidth: function (i, node) {
              return 0; // Убираем вертикальные линии таблицы
            },
            paddingLeft: function (i, node) {
              return i === 0 ? 0 : horizontalGap / 2;
            },
            paddingRight: function (i, node) {
              return i === node.table.widths.length - 1 ? 0 : horizontalGap / 2;
            },
            paddingTop: function (i, node) {
              return i === 0 ? 0 : VERTICAL_GAP / 2;
            },
            paddingBottom: function (i, node) {
              return i === node.table.body.length - 1 ? 0 : VERTICAL_GAP / 2;
            },
          },
          // Центрирование таблицы на странице
          margin: [
            (PAGE_WIDTH -
              (cardWidth * columnsPerRow +
                horizontalGap * (columnsPerRow - 1))) /
              2 -
              PAGE_MARGIN,
            (PAGE_HEIGHT -
              (cardHeight * rowsPerPage + VERTICAL_GAP * (rowsPerPage - 1))) /
              2 -
              PAGE_MARGIN,
            0,
            0,
          ],
        };

        // Добавляем таблицу в контент
        contentPages.push(
          tableConfig,
          p < totalPages - 1 ? { text: "", pageBreak: "after" } : {}
        );
      }

      // Создаем конфигурацию pdfMake
      const docDefinition = {
        pageOrientation: pdfOrientation,
        pageSize: "A4",
        content: contentPages,
        pageMargins: [PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN],
        defaultStyle: {
          font: "Roboto",
        },
        footer: function (currentPage, pageCount) {
          return {
            text: "Страница " + currentPage + " из " + pageCount,
            alignment: "center",
            margin: [0, 10, 0, 0],
            fontSize: 9,
            color: "#666666",
          };
        },
      };

      // Создаем PDF и скачиваем
      pdfMake
        .createPdf(docDefinition)
        .download("Презентация от " + cartDate + ".pdf");
    } catch (error) {
      console.error("Ошибка при скачивании презентации:", error);
      alert("Не удалось скачать презентацию.");
    }
  }

  // ============================================================
  // 7. Модальное окно настроек презентации с live preview
  // ============================================================
  function showPresentationSettingsModal(items, cartDate) {
    // Создаем оверлей для модального окна
    const overlay = document.createElement("div");
    overlay.id = "presentation-settings-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(5px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    });

    // Создаем контейнер модального окна
    const modal = document.createElement("div");
    modal.id = "presentation-settings-modal";
    Object.assign(modal.style, {
      background: "#fff",
      borderRadius: "8px",
      padding: "20px",
      width: "90%",
      maxWidth: "900px",
      boxSizing: "border-box",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column",
    });

    // Заголовок модального окна
    const header = document.createElement("h2");
    header.innerHTML = `<i class="ri-slideshow-3-fill" style="vertical-align: middle; margin-right: 5px;"></i> Настройки PDF презентации`;
    header.style.margin = "0 0 20px 0";
    modal.appendChild(header);

    // Контейнер для содержимого
    const contentContainer = document.createElement("div");
    contentContainer.style.display = "flex";
    contentContainer.style.flexDirection = "row";
    contentContainer.style.gap = "20px";

    // Левая колонка с настройками
    const leftColumn = document.createElement("div");
    leftColumn.style.flex = "0 0 300px";

    // Название презентации
    const nameContainer = document.createElement("div");
    nameContainer.style.marginBottom = "20px";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Название презентации:";
    nameLabel.style.display = "block";
    nameLabel.style.marginBottom = "5px";
    nameLabel.style.fontWeight = "bold";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = `Презентация товаров от ${cartDate}`;
    nameInput.style.width = "100%";
    nameInput.style.padding = "8px";
    nameInput.style.borderRadius = "4px";
    nameInput.style.border = "1px solid #ddd";
    nameInput.style.boxSizing = "border-box";

    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);
    leftColumn.appendChild(nameContainer);

    // Количество товаров на странице
    const itemsContainer = document.createElement("div");
    itemsContainer.style.marginBottom = "20px";

    const itemsLabel = document.createElement("label");
    itemsLabel.textContent = "Товаров на странице:";
    itemsLabel.style.display = "block";
    itemsLabel.style.marginBottom = "5px";
    itemsLabel.style.fontWeight = "bold";

    const itemsSelect = document.createElement("select");
    itemsSelect.style.width = "100%";
    itemsSelect.style.padding = "8px";
    itemsSelect.style.borderRadius = "4px";
    itemsSelect.style.border = "1px solid #ddd";
    itemsSelect.style.boxSizing = "border-box";

    [1, 2, 6, 12].forEach((count) => {
      const option = document.createElement("option");
      option.value = count;
      option.textContent = `${count} ${getFormattedWord(count, [
        "товар",
        "товара",
        "товаров",
      ])}`;
      if (count === 12) option.selected = true;
      itemsSelect.appendChild(option);
    });

    itemsContainer.appendChild(itemsLabel);
    itemsContainer.appendChild(itemsSelect);
    leftColumn.appendChild(itemsContainer);

    // Ориентация листа
    const orientationContainer = document.createElement("div");
    orientationContainer.style.marginBottom = "20px";

    const orientationLabel = document.createElement("label");
    orientationLabel.textContent = "Ориентация листа:";
    orientationLabel.style.display = "block";
    orientationLabel.style.marginBottom = "5px";
    orientationLabel.style.fontWeight = "bold";

    const orientationButtonsContainer = document.createElement("div");
    orientationButtonsContainer.style.display = "flex";
    orientationButtonsContainer.style.gap = "10px";

    // Создаем кнопки ориентации
    const orientationOptions = [
      { value: "portrait", label: "Портрет", icon: "ri-file-text-line" },
      { value: "landscape", label: "Альбом", icon: "ri-file-text-line" },
    ];

    let selectedOrientation = "portrait";

    orientationOptions.forEach((option) => {
      const button = document.createElement("div");
      button.setAttribute("data-orientation", option.value);

      Object.assign(button.style, {
        flex: 1,
        padding: "10px",
        border: `2px solid ${
          option.value === selectedOrientation ? "#1a73e8" : "#ddd"
        }`,
        borderRadius: "4px",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor:
          option.value === selectedOrientation ? "#f0f7ff" : "#fff",
      });

      const icon = document.createElement("i");
      icon.className = option.icon;
      icon.style.fontSize = "24px";
      icon.style.marginBottom = "5px";
      icon.style.display = "block";
      icon.style.transform =
        option.value === "landscape" ? "rotate(90deg)" : "none";

      const text = document.createElement("span");
      text.textContent = option.label;

      button.appendChild(icon);
      button.appendChild(text);

      button.addEventListener("click", function () {
        // Обновляем выбранную ориентацию
        selectedOrientation = option.value;

        // Обновляем стили кнопок
        orientationButtonsContainer.querySelectorAll("div").forEach((btn) => {
          const isSelected =
            btn.getAttribute("data-orientation") === selectedOrientation;
          btn.style.border = `2px solid ${isSelected ? "#1a73e8" : "#ddd"}`;
          btn.style.backgroundColor = isSelected ? "#f0f7ff" : "#fff";
        });

        // Обновляем предпросмотр
        updatePreview();
      });

      orientationButtonsContainer.appendChild(button);
    });

    orientationContainer.appendChild(orientationLabel);
    orientationContainer.appendChild(orientationButtonsContainer);
    leftColumn.appendChild(orientationContainer);

    // Правая колонка с предпросмотром
    const rightColumn = document.createElement("div");
    rightColumn.style.flex = "1";

    const previewLabel = document.createElement("div");
    previewLabel.textContent = "Предпросмотр";
    previewLabel.style.fontWeight = "bold";
    previewLabel.style.marginBottom = "10px";
    rightColumn.appendChild(previewLabel);

    const previewContainer = document.createElement("div");
    previewContainer.id = "presentation-preview";
    previewContainer.style.border = "1px solid #ddd";
    previewContainer.style.borderRadius = "8px";
    previewContainer.style.padding = "5px";
    previewContainer.style.marginBottom = "20px";
    previewContainer.style.background = "#f9f9f9";
    previewContainer.style.display = "flex";
    previewContainer.style.justifyContent = "center";
    previewContainer.style.alignItems = "center";
    previewContainer.style.minHeight = "400px";
    previewContainer.style.overflow = "hidden";
    rightColumn.appendChild(previewContainer);

    // Добавляем колонки в контейнер
    contentContainer.appendChild(leftColumn);
    contentContainer.appendChild(rightColumn);
    modal.appendChild(contentContainer);

    // Кнопка для генерации презентации
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "20px";
    buttonContainer.style.textAlign = "center";

    const generateButton = document.createElement("button");
    generateButton.type = "button";
    generateButton.innerHTML = `<i class="ri-file-pdf-line" style="vertical-align: middle; margin-right: 5px;"></i> Сформировать презентацию`;
    Object.assign(generateButton.style, {
      padding: "10px 20px",
      background: "#1a73e8",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px",
    });

    buttonContainer.appendChild(generateButton);
    modal.appendChild(buttonContainer);

    // Добавляем модальное окно в DOM
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Функция для обновления предпросмотра
    function updatePreview() {
      const title = nameInput.value;
      const itemsPerPage = parseInt(itemsSelect.value, 10);
      const orientation = selectedOrientation;

      // Очищаем контейнер для предпросмотра
      previewContainer.innerHTML = "";

      // Создаем схематичное превью страницы PDF в выбранной ориентации
      const pagePreview = document.createElement("div");
      const isPortrait = orientation === "portrait";

      const pageWidth = isPortrait ? 210 : 297;
      const pageHeight = isPortrait ? 297 : 210;

      // Масштабирование для вывода превью
      const scale = 1.2;
      const previewWidth = pageWidth * scale;
      const previewHeight = pageHeight * scale;

      Object.assign(pagePreview.style, {
        width: previewWidth + "px",
        height: previewHeight + "px",
        background: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      });

      // Контейнер для карточек товаров
      const cardsContainer = document.createElement("div");

      // Определяем количество строк и столбцов
      let cols, rows;

      if (itemsPerPage === 1) {
        cols = 1;
        rows = 1;
      } else if (itemsPerPage === 2) {
        if (isPortrait) {
          cols = 1;
          rows = 2;
        } else {
          cols = 2;
          rows = 1;
        }
      } else if (itemsPerPage === 6) {
        if (isPortrait) {
          cols = 2;
          rows = 3;
        } else {
          cols = 3;
          rows = 2;
        }
      } else if (itemsPerPage === 12) {
        if (isPortrait) {
          cols = 3;
          rows = 4;
        } else {
          cols = 4;
          rows = 3;
        }
      }

      Object.assign(cardsContainer.style, {
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: "10px",
        flex: "1",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      });

      // Определяем размеры одной карточки
      const availableWidth = previewWidth - 40; // вычитаем отступы страницы
      const availableHeight = previewHeight - 40; // вычитаем отступы страницы

      // Вычисляем максимально доступную ширину карточки
      const cardMaxWidth = (availableWidth - (cols - 1) * 10) / cols; // учитываем gap

      // Вычисляем высоту на основе пропорций 3:4.5
      const cardHeight = cardMaxWidth * (CARD_RATIO.height / CARD_RATIO.width);

      // Проверяем, не выходят ли карточки за границы по высоте
      const totalCardHeight = cardHeight * rows + (rows - 1) * 10; // учитываем gap

      // Если высота превышает доступное пространство, пересчитываем размеры карточек
      if (totalCardHeight > availableHeight) {
        // Вычисляем максимально доступную высоту карточки
        const cardMaxHeight = (availableHeight - (rows - 1) * 10) / rows;
        // Пересчитываем ширину на основе пропорций 3:4.5
        const cardWidth =
          cardMaxHeight * (CARD_RATIO.width / CARD_RATIO.height);
        createCardPreviews(cardWidth, cardMaxHeight);
      } else {
        createCardPreviews(cardMaxWidth, cardHeight);
      }

      function createCardPreviews(cardWidth, cardHeight) {
        // Создаем карточки товаров в превью
        const maxItems = Math.min(items.length, itemsPerPage);

        for (let i = 0; i < itemsPerPage; i++) {
          const cardElement = document.createElement("div");

          if (i < maxItems) {
            // Используем данные товара
            const item = items[i];

            Object.assign(cardElement.style, {
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "white",
            });

            // Вычисляем размер изображения (квадратное, занимает всю ширину)
            const imgSize = cardWidth;
            const infoHeight = cardHeight - imgSize;

            // Изображение товара (квадратное)
            const imageContainer = document.createElement("div");
            Object.assign(imageContainer.style, {
              width: `${imgSize}px`,
              height: `${imgSize}px`,
              background: "#f5f5f5",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            });

            // Используем реальное изображение товара или заглушку
            if (item["Изображение"]) {
              const image = document.createElement("img");
              image.src = item["Изображение"];
              image.alt = item["Наименование"] || "Товар";
              Object.assign(image.style, {
                width: "100%",
                height: "100%",
                objectFit: "contain",
              });
              imageContainer.appendChild(image);
            } else {
              const placeholder = document.createElement("div");
              placeholder.textContent = "[Нет изображения]";
              placeholder.style.color = "#999";
              imageContainer.appendChild(placeholder);
            }

            cardElement.appendChild(imageContainer);

            // Контейнер для информации о товаре
            const infoContainer = document.createElement("div");
            Object.assign(infoContainer.style, {
              padding: "1px",
              display: "flex",
              flexDirection: "column",
              height: `${infoHeight}px`,
              boxSizing: "border-box",
            });

            // Название товара
            const titleElement = document.createElement("div");
            titleElement.textContent = item["Наименование"] || "Без названия";
            Object.assign(titleElement.style, {
              fontSize: `${Math.max(4, cardWidth / 40)}px`,
              marginBottom: "1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              "-webkit-line-clamp": "2",
              "-webkit-box-orient": "vertical",
            });
            infoContainer.appendChild(titleElement);

            // Контейнер для наличия и кода
            const detailsContainer = document.createElement("div");
            Object.assign(detailsContainer.style, {
              display: "flex",
              flexDirection: "column",
              marginTop: "auto",
              fontSize: `${Math.max(3, cardWidth / 45)}px`,
            });

            // Наличие
            const availabilityRow = document.createElement("div");
            availabilityRow.style.display = "flex";
            availabilityRow.style.justifyContent = "space-between";

            const availabilityLabel = document.createElement("span");
            availabilityLabel.textContent = "Наличие:";

            const availabilityValue = document.createElement("span");
            availabilityValue.textContent = item["Наличие"];
            availabilityValue.style.fontWeight = "bold";

            availabilityRow.appendChild(availabilityLabel);
            availabilityRow.appendChild(availabilityValue);
            detailsContainer.appendChild(availabilityRow);

            // Код (если есть)
            if (item["Код"]) {
              const codeRow = document.createElement("div");
              codeRow.style.display = "flex";
              codeRow.style.justifyContent = "space-between";
              codeRow.style.marginTop = "0px";

              const codeLabel = document.createElement("span");
              codeLabel.textContent = "Код:";

              const codeValue = document.createElement("span");
              codeValue.textContent = item["Код"];
              codeValue.style.fontWeight = "bold";

              codeRow.appendChild(codeLabel);
              codeRow.appendChild(codeValue);
              detailsContainer.appendChild(codeRow);
            }

            infoContainer.appendChild(detailsContainer);
            cardElement.appendChild(infoContainer);
          } else {
            // Пустая ячейка
            Object.assign(cardElement.style, {
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              background: "#f9f9f9",
            });
          }

          cardsContainer.appendChild(cardElement);
        }
      }

      pagePreview.appendChild(cardsContainer);

      // Добавляем номер страницы
      const pageNumberElement = document.createElement("div");
      pageNumberElement.textContent = "Страница 1";
      Object.assign(pageNumberElement.style, {
        fontSize: "8px",
        textAlign: "center",
        marginTop: "10px",
        color: "#999",
      });
      pagePreview.appendChild(pageNumberElement);

      // Добавляем готовый превью в контейнер
      previewContainer.appendChild(pagePreview);
    }

    // Получение правильного склонения слова в зависимости от числа
    function getFormattedWord(number, words) {
      const cases = [2, 0, 1, 1, 1, 2];
      return words[
        number % 100 > 4 && number % 100 < 20
          ? 2
          : cases[number % 10 < 5 ? number % 10 : 5]
      ];
    }

    // Инициализация предпросмотра
    updatePreview();

    // Обработчики событий для обновления предпросмотра при изменении настроек
    nameInput.addEventListener("input", updatePreview);
    itemsSelect.addEventListener("change", updatePreview);

    // Обработчик клика на кнопку генерации презентации
    generateButton.addEventListener("click", function () {
      // Получаем текущие значения из формы
      const title = nameInput.value;
      const itemsPerPage = parseInt(itemsSelect.value, 10);
      const orientation = selectedOrientation;

      // Закрываем модальное окно
      document.body.removeChild(overlay);

      // Генерируем презентацию
      handleDownloadPresentationStyledUsingPdfMake(
        items,
        cartDate,
        itemsPerPage,
        orientation
      );
    });

    // Закрытие модального окна при клике на оверлей
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  // ============================================================
  // 8. Модальное окно для ручного ввода параметров PDF КП
  // ============================================================
  function showPDFModal(items, cartDate) {
    const overlay = document.createElement("div");
    overlay.id = "pdf-modal-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(5px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    });

    const modal = document.createElement("div");
    modal.id = "pdf-modal";
    Object.assign(modal.style, {
      background: "#fff",
      borderRadius: "8px",
      padding: "20px",
      width: "90%",
      maxWidth: "900px",
      maxHeight: "90%",
      overflowY: "auto",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    });

    const modalHeader = document.createElement("h2");
    modalHeader.textContent = "Настройка параметров PDF";
    modalHeader.style.marginTop = "0";
    modal.appendChild(modalHeader);

    const form = document.createElement("form");
    form.id = "pdf-modal-form";

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
      item.discountPercent = 0;
      item.quantity = 1;
    });
    tableHTML += `
        </tbody>
      </table>
    `;
    form.innerHTML += tableHTML;

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

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.textContent = "Сформировать";
    Object.assign(submitButton.style, {
      padding: "10px 20px",
      border: "none",
      background: "#007bff",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
    });
    form.appendChild(submitButton);

    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

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

    submitButton.addEventListener("click", async function () {
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
      document.body.removeChild(overlay);
      await handleDownloadPDFManual(
        items,
        cartDate,
        overallDiscountVal,
        additionalConditionsVal
      );
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  // ============================================================
  // 9. Модальное окно первого выбора типа документа (Сохранить PDF)
  // ============================================================
  function showDocumentTypeModal(items, cartDate) {
    const overlay = document.createElement("div");
    overlay.id = "doc-type-modal-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(5px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    });

    const modal = document.createElement("div");
    modal.id = "doc-type-modal";
    Object.assign(modal.style, {
      background: "#fff",
      borderRadius: "8px",
      padding: "20px",
      width: "90%",
      maxWidth: "600px",
      boxSizing: "border-box",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      textAlign: "center",
    });

    const header = document.createElement("h2");
    header.innerHTML = `<i class="ri-save-fill" style="vertical-align: middle;"></i> Сохранить PDF`;
    header.style.marginBottom = "20px";
    modal.appendChild(header);

    const buttonContainer = document.createElement("div");
    Object.assign(buttonContainer.style, {
      display: "flex",
      justifyContent: "space-around",
      marginBottom: "10px",
    });

    const offerButton = document.createElement("button");
    offerButton.innerHTML = `<i class="ri-file-list-2-fill" style="vertical-align: middle; margin-right: 8px;"></i> Коммерческое предложение`;
    Object.assign(offerButton.style, {
      padding: "10px 20px",
      border: "none",
      background: "#28a745",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
      flex: "1",
      margin: "0 5px",
    });

    const presentationButton = document.createElement("button");
    presentationButton.innerHTML = `<i class="ri-slideshow-3-fill" style="vertical-align: middle; margin-right: 8px;"></i> Презентация`;
    Object.assign(presentationButton.style, {
      padding: "10px 20px",
      border: "none",
      background: "#17a2b8",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer",
      flex: "1",
      margin: "0 5px",
    });

    buttonContainer.appendChild(offerButton);
    buttonContainer.appendChild(presentationButton);
    modal.appendChild(buttonContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    offerButton.addEventListener("click", function () {
      document.body.removeChild(overlay);
      showPDFModal(items, cartDate);
    });

    presentationButton.addEventListener("click", function () {
      document.body.removeChild(overlay);
      showPresentationSettingsModal(items, cartDate);
    });
  }

  // ============================================================
  // 10. Экспорт функций в глобальную область
  // ============================================================
  root.handleDownloadExcel = handleDownloadExcel;
  root.handleDownloadPDF = function (items, cartDate) {
    showDocumentTypeModal(items, cartDate);
  };

  // Инициализация модуля
  root.initExcelPdf = function () {
    console.log("Модуль экспорта Excel и PDF инициализирован");
  };
})(window);

// Автоматический запуск при загрузке документа
document.addEventListener("DOMContentLoaded", () => {
  // Инициализация модуля
  if (typeof window.initExcelPdf === "function") {
    window.initExcelPdf();
  }
});
