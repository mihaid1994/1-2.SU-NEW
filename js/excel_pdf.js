// --- Завёрнутый Скрипт: initExcelPdf ---

window.initExcelPdf = function (root = window) {
  // Проверяем наличие библиотек
  if (typeof XLSX === "undefined") {
    console.error("Библиотека SheetJS не подключена.");
  }

  if (typeof window.jspdf === "undefined" && typeof window.jspdf !== "object") {
    console.error("Библиотека jsPDF не подключена.");
  }

  if (typeof html2canvas === "undefined") {
    console.error("Библиотека html2canvas не подключена.");
  }

  // Утилиты для расчета данных доставки
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

  // Функция определения режима генерации документа
  function isDeliveryMode(items) {
    const uniqueDates = getUniqueDeliveryDates(items);
    return uniqueDates.length === 1;
  }

  // Генерация данных таблицы Excel
  async function handleDownloadExcel(items, cartDate) {
    try {
      const deliveryMode = isDeliveryMode(items);
      let deliveryDate = "N/A";

      if (deliveryMode) {
        deliveryDate = calculateDeliveryDateForItem(items[0]);
      }

      const worksheetData = items.map((item, index) => ({
        "#": index + 1,
        Код: item["Код"],
        Наименование: item["Наименование"],
        Цена: item["Цена"],
        Наличие: item["Наличие"],
        "Мин. Кол.": item["Мин. Кол."],
        Количество: item.quantity || 0,
        Сумма: (
          (parseFloat(item["Цена"]) || 0) * (parseInt(item.quantity, 10) || 0)
        ).toFixed(2),
        Изображение: item["Изображение"] || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      worksheet["!cols"] = [
        { width: 5 },
        { width: 10 },
        { width: 80 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 15 },
        { width: 30 },
      ];

      items.forEach((item, index) => {
        const row = index + 2;
        const cellAddress = `I${row}`; // Исправлено на строковый шаблон
        worksheet[cellAddress] = {
          t: "s",
          v: item["Изображение"],
          l: { Target: item["Изображение"] },
        };
      });

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Товары");

      // Формирование имени файла в зависимости от режима
      let filename = `Корзина от ${cartDate}`;
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

  // Генерация данных таблицы PDF
  async function handleDownloadPDF(items, cartDate) {
    try {
      const deliveryMode = isDeliveryMode(items);
      let deliveryDate = "N/A";

      if (deliveryMode) {
        deliveryDate = calculateDeliveryDateForItem(items[0]);
      }

      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "100%";
      tempContainer.style.boxSizing = "border-box";

      tempContainer.innerHTML = generatePDFHTML(
        items,
        cartDate,
        deliveryMode ? deliveryDate : null
      );
      root.document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: true,
        allowTaint: false,
      });

      const imgData = canvas.toDataURL("image/png");

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

      // Формирование имени файла в зависимости от режима
      let filename = `Корзина от ${cartDate}`;
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

  // Генерация HTML для PDF
  function generatePDFHTML(items, cartDate, deliveryDate = null) {
    let html = `
      <h2>Корзина от ${cartDate}</h2>
    `;

    if (deliveryDate) {
      html += `<h3 style="margin-bottom: 20px;">Доставка на: ${deliveryDate}</h3>`;
    }

    const imageCellWidth = 100; // Ширина изображения

    html += `
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; background-color: white;">
        <thead>
          <tr>
            <th>#</th>
            <th>Изображение</th>
            <th>Код</th>
            <th>Наименование</th>
            <th>Цена</th>
            <th>Наличие</th>
            <th>Мин. Кол.</th>
            <th>Кол.</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
    `;

    items.forEach((item, index) => {
      html += `
        <tr style="height: ${imageCellWidth}px; background-color: white;">
          <td style="padding-left: 10px; vertical-align: middle;">${
            index + 1
          }</td>
          <td style="width: ${imageCellWidth}px; height: ${imageCellWidth}px; text-align: center; vertical-align: middle; background-color: white; padding: 0 10px;">
            <img src="${
              item["Изображение"]
            }" alt="Изображение" style="width: ${imageCellWidth}px; height: ${imageCellWidth}px; object-fit: cover;">
          </td>
          <td style="padding-left: 10px; vertical-align: middle;">${
            item["Код"]
          }</td>
          <td style="padding-left: 10px; vertical-align: middle;">${
            item["Наименование"]
          }</td>
          <td style="padding-left: 10px; vertical-align: middle;">${
            item["Цена"]
          } ₽</td>
          <td style="padding-left: 10px; vertical-align: middle;">${
            item["Наличие"]
          }</td>
          <td style="padding-left: 10px; vertical-align: middle;">${
            item["Мин. Кол."]
          }</td>
          <td style="padding-left: 10px; vertical-align: middle;">${
            item.quantity || 0
          }</td>
          <td style="padding-left: 10px; vertical-align: middle;">${(
            (parseFloat(item["Цена"]) || 0) * (parseInt(item.quantity, 10) || 0)
          ).toFixed(2)} ₽</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    return html;
  }

  // Экспортируем функции для внешнего использования
  root.handleDownloadExcel = handleDownloadExcel;
  root.handleDownloadPDF = handleDownloadPDF;
};

// Инициализация скрипта при загрузке родительской страницы
document.addEventListener("DOMContentLoaded", () => {
  window.initExcelPdf(window); // Инициализируем Excel/PDF функционал с глобальным корнем
});
