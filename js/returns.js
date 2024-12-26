document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("returns-table");
  const tableheader = document.getElementById("table-header");
  const tableBody = document.getElementById("table-body");
  const columnSelector = document.getElementById("column-selector");

  let data = []; // Данные из JSON
  let columns = []; // Доступные колонки

  // Загружаем данные из JSON
  fetch("/data/returns.json")
    .then((response) => response.json())
    .then((jsonData) => {
      data = jsonData;
      columns = Object.keys(data[0]);
      initTable();
      populateColumnSelector();
    });

  // Инициализация таблицы
  function initTable() {
    tableheader.innerHTML = "";
    columns.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col;
      th.addEventListener("click", () => sortTable(col));
      tableheader.appendChild(th);
    });
    populateTableBody();
  }

  // Заполнение данных таблицы
  function populateTableBody() {
    tableBody.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      columns.forEach((col) => {
        const td = document.createElement("td");
        td.textContent = row[col];
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  // Заполнение выпадающего списка
  function populateColumnSelector() {
    columns.forEach((col) => {
      const option = document.createElement("option");
      option.value = col;
      option.textContent = col;
      option.selected = true; // Все колонки включены по умолчанию
      columnSelector.appendChild(option);
    });

    // Обновление видимых колонок при изменении
    columnSelector.addEventListener("change", () => {
      const selectedColumns = Array.from(columnSelector.selectedOptions).map(
        (opt) => opt.value
      );
      columns = selectedColumns;
      initTable();
    });
  }

  // Сортировка таблицы
  function sortTable(column) {
    data.sort((a, b) => (a[column] > b[column] ? 1 : -1));
    populateTableBody();
  }
});
