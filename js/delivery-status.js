document.addEventListener("DOMContentLoaded", () => {
  // Функция для получения всех уникальных дат доставки
  function getUniqueDeliveryDates() {
    const groupedData = groupByDelivery(window.data);
    return Object.keys(groupedData);
  }

  // Функция для группировки данных по дате доставки
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

  function groupByDelivery(data) {
    return data.reduce((acc, item) => {
      const deliveryDays = parseDeliveryDays(item["Логистика"]);
      const deliveryDate = calculateDeliveryDate(deliveryDays);
      if (!acc[deliveryDate]) acc[deliveryDate] = [];
      acc[deliveryDate].push(item);
      return acc;
    }, {});
  }

  // Функция для обновления данных в первом столбце таблицы статусов доставок
  function updateStatusRows() {
    const statusTable = document.querySelector(".delivery-status-table tbody");
    if (!statusTable) return;

    const deliverySections = document.querySelectorAll(".delivery-section");

    const rows = Array.from(statusTable.rows);

    deliverySections.forEach((section, index) => {
      const header = section.querySelector(".delivery-header h2");
      if (!header) return;

      const headerText = header.textContent.trim();

      let row = rows[index];
      if (!row) {
        row = statusTable.insertRow();
      }

      let deliveryCell = row.cells[0];
      if (!deliveryCell) {
        deliveryCell = row.insertCell(0);
      }

      deliveryCell.textContent = headerText;
      deliveryCell.style.cursor = "pointer";
      deliveryCell.style.color = "#377271";
      deliveryCell.style.textDecoration = "underline";
      deliveryCell.addEventListener("click", () => navigateToDelivery(index));
    });

    for (let i = deliverySections.length; i < rows.length; i++) {
      rows[i].style.display = "none";
    }
  }

  // Функция для навигации к определенной доставке
  function navigateToDelivery(index) {
    const deliverySections = document.querySelectorAll(".delivery-section");
    if (index < 0 || index >= deliverySections.length) return;

    deliverySections.forEach((section, i) => {
      const header = section.querySelector(".delivery-header");
      const content = section.querySelector(".delivery-content");
      const headerImageContainer = section.querySelector(
        ".header-images-container"
      );
      const headerRight = section.querySelector(".header-right");

      if (i === index) {
        content.classList.remove("collapsed");
        header.classList.remove("collapsed");
        section.style.transition =
          "box-shadow 0.07s ease-in, box-shadow 0.5s ease-out";
        section.style.boxShadow = "0 0 20px 5px rgb(255, 170, 0)";
        document.body.style.transition =
          "background-color 0.1s ease-in, background-color 1.2s ease-out";
        document.body.style.backgroundColor = "rgba(0, 0, 0, 0)";

        if (headerImageContainer) {
          headerImageContainer.style.display = "none";
          headerImageContainer.classList.add("collapsed");
        }
        if (headerRight) {
          headerRight.style.display = "none";
          headerRight.classList.add("collapsed");
        }

        header.scrollIntoView({ behavior: "smooth", block: "start" });

        setTimeout(() => {
          section.style.boxShadow = "0 0 0 0 rgba(255, 140, 0, 0)";
          document.body.style.backgroundColor = "";
        }, 1200);
      } else {
        content.classList.add("collapsed");
        header.classList.add("collapsed");
        section.style.boxShadow = "none";

        if (headerImageContainer) {
          headerImageContainer.style.display = "flex";
          headerImageContainer.classList.remove("collapsed");
        }
        if (headerRight) {
          headerRight.style.display = "flex";
          headerRight.classList.remove("collapsed");
        }
      }
    });
  }

  // Функция для сворачивания/разворачивания секций доставки
  function toggleSectionContent(
    header,
    content,
    headerImageContainer,
    headerRight
  ) {
    const isCollapsed = content.classList.contains("collapsed");

    if (isCollapsed) {
      content.classList.remove("collapsed");
      header.classList.remove("collapsed");

      if (headerImageContainer) headerImageContainer.style.display = "none";
      if (headerRight) headerRight.style.display = "none";
    } else {
      content.classList.add("collapsed");
      header.classList.add("collapsed");

      if (headerImageContainer) headerImageContainer.style.display = "flex";
      if (headerRight) headerRight.style.display = "flex";
    }
  }

  function initializeStatusTable() {
    if (window.data) {
      updateStatusRows();
    } else {
      document.addEventListener("dataLoaded", () => {
        updateStatusRows();
      });
    }
  }

  initializeStatusTable();
});
