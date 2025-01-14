window.initPrice = async function (shadowRoot) {
  console.log("initPrice вызвана с shadowRoot:", shadowRoot);

  const rootElement = shadowRoot.getElementById("price-container");
  if (!rootElement) {
    console.error("Контейнер для прайсов не найден.");
    return;
  }

  // Добавляем стили (опционально)
  const style = document.createElement("style");
  style.textContent = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        background-color: #f5f5f7;
        color: #333;
        overflow: hidden;
        line-height: 1.6;
      }

      .container {
        display: flex;
        flex-direction: column;
        box-sizing: content-box;
        padding-bottom: 15px;
      }

      h1 {
        font-size: 1.8em;
        padding: 0 30px;
        color: #333333; /* Темно-темно серый цвет */
        transition: color 0.3s ease, border-color 0.3s ease;
      }

      h1 a {
        text-decoration: none;
        color: inherit;
      }

      .centered-text {
        padding: 0 30px;
        padding-bottom: 8px;
        width: 100%;
        max-width: 1200px;
        font-size: 1.1em;
        line-height: 1.6;
        color: #333;
        border-bottom: 1px solid #ddd; /* Тонкая линия под заголовком */
      }

      /* Таблицы */
      table {
        width: 70%;
        margin: 15px auto;
        border-collapse: collapse;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
      }

      th,
      td {
        padding: 12px;
        text-align: center;
        border-bottom: 1px solid #e1e1e1;
      }

      th {
        background-color: #f0f0f5;
        font-weight: bold;
        color: #555;
      }

      tr:last-child td {
        border-bottom: none;
      }

      /* Стили ссылок */
      a {
        color: #828282;
        text-decoration: none;
        transition: color 0.3s ease;
      }

      a:hover {
        color: #207076;
        text-decoration: underline; /* Добавлено подчеркивание текста при наведении */
      }

      /* Стили футера */
      .footer {
        background-color: rgb(213, 213, 213);
        color: #fff;
        padding: 12px 0;
        text-align: center;
        width: 100%;
        margin-top: auto;
      }

      .footer-container {
        max-width: 73%;
        margin: 0 auto;
      }

      .footer-link {
        color: #28383d;
        text-decoration: none;
      }

      .footer-link:hover {
        text-decoration: underline;
      }

      /* Кодовые блоки */
      pre {
        background-color: #f0f0f5;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 15px auto;
        width: 80%;
        box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.05);
        transition: background-color 0.3s ease;
      }

      code {
        font-family: "Courier New", Courier, monospace;
        color: #d14;
      }

      /* Анимация */
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes zoomIn {
        from {
          transform: scale(0.7);
        }
        to {
          transform: scale(1);
        }
      }

      /* Адаптивность */
      @media (max-width: 768px) {
        table {
          width: 90%;
        }

        pre {
          width: 95%;
        }
      }
  `;
  shadowRoot.appendChild(style);

  // Добавляем контейнер для данных
  const container = document.createElement("div");
  container.id = "regions-container";
  shadowRoot.appendChild(container);

  // Инициализируем функционал
  await window.initPriceShadow(shadowRoot);
};

window.initPriceShadow = async function (shadowRoot) {
  const BASE_URL = "http://processing.sbat.ru/prices/";

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
        {
          name: 'Товары бренда "Электростандарт" под Заказ',
          file: "ES.zip",
          photo: "ES_s.zip",
        },
        {
          name: 'Товары бренда "Uniel" под Заказ',
          file: "Uniel.zip",
          photo: "Uniel_s.zip",
        },
        {
          name: 'Товары бренда "Rexant" под Заказ',
          file: "Rexant.zip",
          photo: "Rexant_s.zip",
        },
        {
          name: 'Товары бренда "Feron" под Заказ',
          file: "Feron.zip",
          photo: "Feron_s.zip",
        },
        {
          name: 'Товары бренда "General" под Заказ',
          file: "General.zip",
          photo: "General_s.zip",
        },
        {
          name: 'Товары бренда "TDM" под Заказ',
          file: "TDM.zip",
          photo: "TDM_s.zip",
        },
        {
          name: "Фототовары под Заказ",
          file: "FotoKr.zip",
          photo: "FotoKr_s.zip",
        },
        {
          name: 'Товары бренда "IEK" под Заказ',
          file: "IEKcentral.zip",
          photo: "IEKcentral_s.zip",
        },
        {
          name: 'Товары бренда "Эра" под Заказ',
          file: "S3_u.zip",
          photo: "S3_us.zip",
        },
        {
          name: "Товары бренда “Camelion” под Заказ",
          file: "Camelion.zip",
          photo: "Camelion_s.zip",
        },
        {
          name: "Товары бренда “Robiton” под Заказ",
          file: "Robiton.zip",
          photo: "Robiton_s.zip",
        },
        {
          name: 'Товары бренда "Smartbuy" под Заказ',
          file: "Smartbuy_u.zip",
          photo: "Smartbuy_us.zip",
        },
        {
          name: 'Товары бренда "Navigator" под Заказ',
          file: "Navigator.zip",
          photo: "Navigator_s.zip",
        },
        {
          name: 'Товары бренда "Jazzway" под Заказ',
          file: "Jazzway.zip",
          photo: "Jazzway_s.zip",
        },
        {
          name: 'Товары бренда "HOROZ" под Заказ',
          file: "HOROZ.zip",
          photo: "HOROZ_s.zip",
        },
        {
          name: 'Товары "Скрап" под Заказ',
          file: "Scrap_m.zip",
          photo: "Scrap_ms.zip",
        },
        {
          name: 'Товары бренда "Wolta" под Заказ',
          file: "Wolta.zip",
          photo: "Wolta_s.zip",
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
        {
          name: 'Товары бренда "Эра" под Заказ',
          file: "S3_p.zip",
          photo: "S3_ps.zip",
        },
        {
          name: 'Товары бренда "Navigator" под Заказ',
          file: "Navigator_p.zip",
          photo: "Navigator_ps.zip",
        },
        {
          name: 'Товары "Скрап" под Заказ',
          file: "Scrap_p.zip",
          photo: "Scrap_ps.zip",
        },
      ],
    },
    {
      name: "Сибирский ФО (Восток)",
      files: [
        { name: "Склад Иркутска", file: "Irkutsk.zip", photo: "Irkutsk_s.zip" },
        {
          name: 'Товары бренда "Электростандарт" под Заказ',
          file: "ES.zip",
          photo: "ES_s.zip",
        },
        {
          name: 'Товары бренда "Feron" под Заказ',
          file: "Feron_n.zip",
          photo: "Feron_ns.zip",
        },
        {
          name: 'Товары бренда "General" под Заказ',
          file: "General.zip",
          photo: "General_s.zip",
        },
        {
          name: 'Товары бренда "Smartbuy" под Заказ',
          file: "Smartbuy_i.zip",
          photo: "Smartbuy_is.zip",
        },
        {
          name: 'Товары бренда "HOROZ" под Заказ',
          file: "HOROZ_i.zip",
          photo: "HOROZ_is.zip",
        },
        {
          name: 'Товары бренда "Эра" под Заказ',
          file: "S3_i.zip",
          photo: "S3_is.zip",
        },
        {
          name: 'Товары бренда "Jazzway" под Заказ',
          file: "Jazzway.zip",
          photo: "Jazzway_s.zip",
        },
      ],
    },
    {
      name: "Сибирский ФО (Запад)",
      files: [
        {
          name: "Склад Новосибирска",
          file: "Novosib.zip",
          photo: "Novosib_s.zip",
        },
        {
          name: 'Товары бренда "ASD" под Заказ',
          file: "ASD_n.zip",
          photo: "ASD_ns.zip",
        },
        {
          name: 'Товары бренда "EKF" под Заказ',
          file: "EKFsib.zip",
          photo: "EKFsib_s.zip",
        },
        {
          name: 'Товары бренда "Rexant" под Заказ',
          file: "Rexant.zip",
          photo: "Rexant_s.zip",
        },
        {
          name: 'Товары бренда "Feron" под Заказ',
          file: "Feron_n.zip",
          photo: "Feron_ns.zip",
        },
        {
          name: 'Товары бренда "General" под Заказ',
          file: "General.zip",
          photo: "General_s.zip",
        },
        {
          name: "Товары бренда “Зубр” под Заказ",
          file: "ZubrR.zip",
          photo: "ZubrR_s.zip",
        },
        {
          name: 'Товары бренда "Электростандарт" под Заказ',
          file: "ES.zip",
          photo: "ES_s.zip",
        },
        {
          name: "Канцелярия под Заказ",
          file: "KanzR.zip",
          photo: "KanzR_s.zip",
        },
        { name: "Замки под Заказ", file: "ZamkiR.zip", photo: "ZamkiR_s.zip" },
        {
          name: 'Товары бренда "IEK" под Заказ',
          file: "IEKural.zip",
          photo: "IEKural_s.zip",
        },
        {
          name: 'Товары бренда "Smartbuy" под Заказ',
          file: "Smartbuy_n.zip",
          photo: "Smartbuy_ns.zip",
        },
      ],
    },
    {
      name: "Уральский ФО",
      files: [
        {
          name: "Склад Екатеринбурга",
          file: "Revda.zip",
          photo: "Revda_s.zip",
        },
        {
          name: "Электротехника под Заказ",
          file: "ElectroR.zip",
          photo: "ElectroR_s.zip",
        },
        {
          name: 'Товары бренда "ASD" под Заказ',
          file: "ASD_r.zip",
          photo: "ASD_rs.zip",
        },
        {
          name: "Канцелярия под Заказ",
          file: "KanzR.zip",
          photo: "KanzR_s.zip",
        },
        { name: "Замки под Заказ", file: "ZamkiR.zip", photo: "ZamkiR_s.zip" },
        {
          name: 'Товары бренда "Электростандарт" под Заказ',
          file: "ES.zip",
          photo: "ES_s.zip",
        },
        {
          name: "Товары бренда “Зубр” под Заказ",
          file: "ZubrR.zip",
          photo: "ZubrR_s.zip",
        },
        {
          name: "Товары бренда “Camelion” под Заказ",
          file: "Camelion.zip",
          photo: "Camelion_s.zip",
        },
        {
          name: 'Товары бренда "EKF" под Заказ',
          file: "EKFural.zip",
          photo: "EKFural_s.zip",
        },
        {
          name: 'Товары бренда "IEK" под Заказ',
          file: "IEKural.zip",
          photo: "IEKural_s.zip",
        },
        {
          name: 'Товары бренда "Uniel" под Заказ',
          file: "Uniel.zip",
          photo: "Uniel_s.zip",
        },
        {
          name: 'Товары бренда "Mirey" под Заказ',
          file: "Mirey.zip",
          photo: "Mirey_s.zip",
        },
        {
          name: 'Товары бренда "Rexant" под Заказ',
          file: "Rexant.zip",
          photo: "Rexant_s.zip",
        },
        {
          name: 'Товары бренда "General" под Заказ',
          file: "General.zip",
          photo: "General_s.zip",
        },
        {
          name: 'Товары бренда "Feron" под Заказ',
          file: "Feron.zip",
          photo: "Feron_s.zip",
        },
        {
          name: 'Товары бренда "TDM" под Заказ',
          file: "TDM.zip",
          photo: "TDM_s.zip",
        },
        {
          name: "Фототовары под Заказ",
          file: "FotoKr.zip",
          photo: "FotoKr_s.zip",
        },
        {
          name: 'Товары бренда "Vegas" под Заказ',
          file: "Vegas.zip",
          photo: "Vegas_s.zip",
        },
        {
          name: 'Товары бренда "Smartbuy" под Заказ',
          file: "Smartbuy_r.zip",
          photo: "Smartbuy_rs.zip",
        },
        {
          name: "Товары бренда “Robiton” под Заказ",
          file: "Robiton.zip",
          photo: "Robiton_s.zip",
        },
        {
          name: 'Товары бренда "Navigator" под Заказ',
          file: "Navigator.zip",
          photo: "Navigator_s.zip",
        },
        {
          name: 'Товары бренда "HOROZ" под Заказ',
          file: "HOROZ.zip",
          photo: "HOROZ_s.zip",
        },
        {
          name: 'Товары бренда "Эра" под Заказ',
          file: "S3.zip",
          photo: "S3_s.zip",
        },
        {
          name: 'Товары "Скрап" под Заказ',
          file: "Scrap_r.zip",
          photo: "Scrap_rs.zip",
        },
        {
          name: 'Товары бренда "Jazzway" под Заказ',
          file: "Jazzway.zip",
          photo: "Jazzway_s.zip",
        },
      ],
    },
    {
      name: "Центральный ФО",
      files: [
        {
          name: "Склад Москвы",
          file: "Krasnoarm.zip",
          photo: "Krasnoarm_s.zip",
        },
        {
          name: "Фототовары под Заказ",
          file: "FotoKr.zip",
          photo: "FotoKr_s.zip",
        },
        {
          name: 'Товары бренда "ASD" под Заказ',
          file: "ASD_m.zip",
          photo: "ASD_ms.zip",
        },
        {
          name: "Товары бренда “Camelion” под Заказ",
          file: "Camelion.zip",
          photo: "Camelion_s.zip",
        },
        {
          name: 'Товары бренда "EKF" под Заказ',
          file: "EKFcentr.zip",
          photo: "EKFcentr_s.zip",
        },
        {
          name: 'Товары бренда "Электростандарт" под Заказ',
          file: "ES.zip",
          photo: "ES_s.zip",
        },
        {
          name: 'Товары бренда "Uniel" под Заказ',
          file: "Uniel.zip",
          photo: "Uniel_s.zip",
        },
        {
          name: 'Товары бренда "Rexant" под Заказ',
          file: "Rexant.zip",
          photo: "Rexant_s.zip",
        },
        {
          name: 'Товары бренда "General" под Заказ',
          file: "General.zip",
          photo: "General_s.zip",
        },
        {
          name: 'Товары бренда "Feron" под Заказ',
          file: "Feron.zip",
          photo: "Feron_s.zip",
        },
        {
          name: 'Товары бренда "TDM" под Заказ',
          file: "TDM.zip",
          photo: "TDM_s.zip",
        },
        {
          name: 'Товары бренда "IEK" под Заказ',
          file: "IEKcentral.zip",
          photo: "IEKcentral_s.zip",
        },
        {
          name: 'Товары бренда "Vegas" под Заказ',
          file: "Vegas.zip",
          photo: "Vegas_s.zip",
        },
        {
          name: 'Товары бренда "Wolta" под Заказ',
          file: "Wolta.zip",
          photo: "Wolta_s.zip",
        },
        {
          name: 'Товары бренда "Smartbuy" под Заказ',
          file: "Smartbuy_m.zip",
          photo: "Smartbuy_ms.zip",
        },
        {
          name: "Товары бренда “Robiton” под Заказ",
          file: "Robiton.zip",
          photo: "Robiton_s.zip",
        },
        {
          name: "Товары Канцелярские под Заказ",
          file: "Kanz_m.zip",
          photo: "Kanz_ms.zip",
        },
        {
          name: 'Товары бренда "Navigator" под Заказ',
          file: "Navigator.zip",
          photo: "Navigator_s.zip",
        },
        {
          name: 'Товары бренда "HOROZ" под Заказ',
          file: "HOROZ.zip",
          photo: "HOROZ_s.zip",
        },
        {
          name: 'Товары бренда "Эра" под Заказ',
          file: "S3.zip",
          photo: "S3_s.zip",
        },
        {
          name: 'Товары "Скрап" под Заказ',
          file: "Scrap_m.zip",
          photo: "Scrap_ms.zip",
        },
        {
          name: 'Товары бренда "Jazzway" под Заказ',
          file: "Jazzway.zip",
          photo: "Jazzway_s.zip",
        },
      ],
    },
    {
      name: "Южный ФО",
      files: [
        {
          name: "Склад Краснодара",
          file: "Krasnodar.zip",
          photo: "Krasnodar_s.zip",
        },
        {
          name: "Склад РАСПРОДАЖА Краснодара",
          file: "Sale_Krasnodar.zip",
          photo: "Sale_Krasnodar_s.zip",
        },
        {
          name: 'Товары бренда "Feron" под Заказ',
          file: "Feron.zip",
          photo: "Feron_s.zip",
        },
        {
          name: 'Товары бренда "Эра" под Заказ',
          file: "S3_p.zip",
          photo: "S3_ps.zip",
        },
        {
          name: 'Товары бренда "Navigator" под Заказ',
          file: "Navigator_p.zip",
          photo: "Navigator_ps.zip",
        },
        {
          name: 'Товары "Скрап" под Заказ',
          file: "Scrap_p.zip",
          photo: "Scrap_ps.zip",
        },
      ],
    },
  ];

  async function createRegionTable(region) {
    const container = shadowRoot.getElementById("regions-container");

    // Проверка на существование контейнера
    if (!container) {
      console.error("Контейнер для регионов не найден в shadowRoot");
      return;
    }

    // Создание заголовка региона
    const regionHeader = document.createElement("h2");
    regionHeader.innerHTML = `<a id="${region.name.replace(
      /\s+/g,
      "_"
    )}"></a><div align="center">${region.name}</div>`;
    container.appendChild(regionHeader);

    // Создание таблицы
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Прайс</th>
          <th>Прайс со ссылками на фотографии товаров</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    container.appendChild(table);

    const tbody = table.querySelector("tbody");

    // Заполнение таблицы
    for (const file of region.files) {
      const tr = document.createElement("tr");

      // Прайс
      const tdPrice = document.createElement("td");
      const linkPrice = document.createElement("a");
      linkPrice.href = BASE_URL + file.file;
      linkPrice.textContent = file.name;
      linkPrice.target = "_blank"; // Открывать в новой вкладке
      tdPrice.appendChild(linkPrice);
      tr.appendChild(tdPrice);

      // Прайс со ссылками на фотографии товаров
      const tdPhoto = document.createElement("td");
      const linkPhoto = document.createElement("a");
      linkPhoto.href = BASE_URL + file.photo;
      linkPhoto.textContent = `${file.name} фото`;
      linkPhoto.target = "_blank"; // Открывать в новой вкладке
      tdPhoto.appendChild(linkPhoto);
      tr.appendChild(tdPhoto);

      tbody.appendChild(tr);
    }
  }

  async function init() {
    for (const region of regionsData) {
      await createRegionTable(region);
    }
  }

  // Запуск инициализации
  init();
};
