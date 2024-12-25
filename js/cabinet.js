document.addEventListener("DOMContentLoaded", () => {
  // Структура для разных вкладок
  const structure = {
    // Блок для покупателя
    client: {
      title: "Личный кабинет покупателя",
      content: `
            <div class="dashboard">
              <section class="overview">
                <h3>Краткий обзор возможностей</h3>
                <p>Добро пожаловать в ваш личный кабинет! Здесь вы можете управлять своими заказами, балансом, адресами и многое другое.</p>
              </section>

              <section class="quick-summary">
                <div class="summary-cards">
                  <div class="card">
                    <h4>Мои Заказы</h4>
                    <p>Просмотр и управление вашими заказами.</p>
                    <button class="summary-button" data-tab="myOrders">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Баланс и система лояльности</h4>
                    <p>Управление финансами и бонусными программами.</p>
                    <button class="summary-button" data-tab="balanceLoyalty">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Мои Адреса</h4>
                    <p>Управление адресами доставки.</p>
                    <button class="summary-button" data-tab="addresses">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Мои организации и адреса</h4>
                    <p>Управление юридическими лицами.</p>
                    <button class="summary-button" data-tab="organizations">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Лист ожидания</h4>
                    <p>Отслеживание ожидаемых товаров.</p>
                    <button class="summary-button" data-tab="waitlist">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Аналитика для покупателя</h4>
                    <p>Анализ вашей покупательской активности.</p>
                    <button class="summary-button" data-tab="clientAnalytics">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Претензии</h4>
                    <p>Создание и управление претензиями.</p>
                    <button class="summary-button" data-tab="claims">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Возвраты</h4>
                    <p>Создание заявок на возврат товаров.</p>
                    <button class="summary-button" data-tab="returns">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Дополнительно</h4>
                    <p>Дополнительные настройки и функции.</p>
                    <button class="summary-button" data-tab="additionalClient">Перейти</button>
                  </div>
                </div>
              </section>
            </div>
          `,
    },
    myOrders: {
      title: "Мои Заказы",
      content: `
            <div class="my-orders">
              <p>Откроется страница в новом табе</p>
            </div>
          `,
    },
    balanceLoyalty: {
      title: "Баланс и система лояльности",
      content: `
            <div class="balance-loyalty">
              <section class="current-balance">
                <h3>Текущий баланс</h3>
                <p>Остаток средств: <span id="balance">10,500 ₽</span></p>
                <p>Переплаты: <span id="overpayments">500 ₽</span></p>
                <p>Задолженности: <span id="debts">0 ₽</span></p>
              </section>

              <section class="financial-operations">
                <h3>Финансовые операции</h3>
                <button id="downloadStatements">Скачать выписку</button>
                <table class="financial-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Тип операции</th>
                      <th>Сумма</th>
                      <th>Описание</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2024-12-01</td>
                      <td>Пополнение</td>
                      <td>5,000 ₽</td>
                      <td>Пополнение счета</td>
                    </tr>
                    <tr>
                      <td>2024-11-20</td>
                      <td>Списание</td>
                      <td>2,500 ₽</td>
                      <td>Оплата заказа #12345</td>
                    </tr>
                    <!-- Дополнительные операции -->
                  </tbody>
                </table>
              </section>

              <section class="loyalty-program">
                <h3>Программа лояльности</h3>
                <p>Бонусные баллы: <span id="bonusPoints">1,200</span></p>
                <p>Кэшбэк: <span id="cashback">300 ₽</span></p>
                <button id="redeemBonuses">Использовать бонусы</button>
                <button id="viewDiscounts">Просмотреть скидки</button>
              </section>
            </div>
          `,
    },
    addresses: {
      title: "",
      content: `
            <div class="my-addresses">

            <h3>Мои адреса:</h3>
              <button id="addAddressBtn">Добавить новый адрес</button>
              <table class="addresses-table">
                <thead>
                  <tr>
                    <th>Адрес</th>
                    <th>Контактное лицо</th>
                    <th>Телефон</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>г. Москва, ул. Пушкина, д. 10</td>
                    <td>Иван Иванов</td>
                    <td>+7 999 123-45-67</td>
                    <td>
                      <button class="edit-address">Редактировать</button>
                      <button class="delete-address">Удалить</button>
                      <button class="set-default">Установить по умолчанию</button>
                    </td>
                  </tr>
                  <tr>
                    <td>г. Санкт-Петербург, Невский проспект, д. 20</td>
                    <td>Мария Петрова</td>
                    <td>+7 999 765-43-21</td>
                    <td>
                      <button class="edit-address">Редактировать</button>
                      <button class="delete-address">Удалить</button>
                      <button class="set-default">Установить по умолчанию</button>
                    </td>
                  </tr>
                  <!-- Дополнительные адреса -->
                </tbody>
              </table>

              <h3>Мои организации:</h3>
                            <button id="addOrganizationBtn">Добавить организацию</button>
              <table class="organizations-table">
                <thead>
                  <tr>
                    <th>Название организации</th>
                    <th>ИНН</th>
                    <th>КПП</th>
                    <th>Юридический адрес</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ООО "Ромашка"</td>
                    <td>7701234567</td>
                    <td>770101001</td>
                    <td>г. Москва, ул. Ленина, д. 5</td>
                    <td>
                      <button class="edit-organization">Редактировать</button>
                      <button class="delete-organization">Удалить</button>
                    </td>
                  </tr>
                  <tr>
                    <td>АО "Тюльпан"</td>
                    <td>7807654321</td>
                    <td>780102002</td>
                    <td>г. Санкт-Петербург, Невский проспект, д. 15</td>
                    <td>
                      <button class="edit-organization">Редактировать</button>
                      <button class="delete-organization">Удалить</button>
                    </td>
                  </tr>
                  <!-- Дополнительные организации -->
                </tbody>
              </table>
            </div>
          `,
    },

    waitlist: {
      title: "Лист Ожидания",
      content: `
            <div class="waitlist">
              <table class="waitlist-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Дата добавления</th>
                    <th>Приоритет</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Смартфон XYZ</td>
                    <td>2024-12-10</td>
                    <td>
                      <select class="priority-select">
                        <option value="low">Низкий</option>
                        <option value="medium" selected>Средний</option>
                        <option value="high">Высокий</option>
                      </select>
                    </td>
                    <td>
                      <button class="remove-wait">Удалить</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Ноутбук ABC</td>
                    <td>2024-11-25</td>
                    <td>
                      <select class="priority-select">
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high" selected>Высокий</option>
                      </select>
                    </td>
                    <td>
                      <button class="remove-wait">Удалить</button>
                    </td>
                  </tr>
                  <!-- Дополнительные товары -->
                </tbody>
              </table>
              <button id="notifyMeBtn">Настроить уведомления</button>
            </div>
          `,
    },
    clientAnalytics: {
      title: "Аналитика для покупателя",
      content: `
            <div class="client-analytics">
              <section class="purchase-reports">
                <h3>Отчеты о покупках</h3>
                <form id="reportFilters">
                  <label for="reportPeriod">Период:</label>
                  <select id="reportPeriod" name="reportPeriod">
                    <option value="lastMonth">Последний месяц</option>
                    <option value="last3Months">Последние 3 месяца</option>
                    <option value="last6Months">Последние 6 месяцев</option>
                    <option value="custom">Произвольный период</option>
                  </select>

                  <div id="customPeriod" style="display: none;">
                    <label for="startDate">С:</label>
                    <input type="date" id="startDate" name="startDate">
                    <label for="endDate">По:</label>
                    <input type="date" id="endDate" name="endDate">
                  </div>

                  <label for="categoryFilter">Категория:</label>
                  <select id="categoryFilter" name="categoryFilter">
                    <option value="all">Все категории</option>
                    <option value="electronics">Электроника</option>
                    <option value="fashion">Мода</option>
                    <option value="home">Дом и сад</option>
                    <!-- Дополнительные категории -->
                  </select>

                  <button type="submit">Применить фильтры</button>
                </form>

                <div id="purchaseChart" class="chart-container">
                  <!-- График покупок будет отображаться здесь -->
                  <canvas id="purchaseGraph"></canvas>
                </div>
              </section>

              <section class="trends-recommendations">
                <h3>Тренды и рекомендации</h3>
                <div class="trends">
                  <h4>Популярные категории:</h4>
                  <ul>
                    <li>Электроника</li>
                    <li>Мода</li>
                    <li>Дом и сад</li>
                    <!-- Дополнительные тренды -->
                  </ul>
                </div>
                <div class="recommendations">
                  <h4>Рекомендованные товары:</h4>
                  <div class="recommendation-items">
                    <div class="item">
                      <img src="path_to_image1.jpg" alt="Товар 1">
                      <p>Товар 1</p>
                      <p>Цена: 1,500 ₽</p>
                      <button>Купить</button>
                    </div>
                    <div class="item">
                      <img src="path_to_image2.jpg" alt="Товар 2">
                      <p>Товар 2</p>
                      <p>Цена: 2,300 ₽</p>
                      <button>Купить</button>
                    </div>
                    <!-- Дополнительные рекомендованные товары -->
                  </div>
                </div>
              </section>

              <section class="personal-statistics">
                <h3>Персональная статистика</h3>
                <p>Общее количество заказов: <span id="totalOrders">15</span></p>
                <p>Общая сумма покупок: <span id="totalSpent">75,000 ₽</span></p>
                <p>Средний чек: <span id="averageCheck">5,000 ₽</span></p>
                <button id="downloadStats">Скачать статистику</button>
              </section>
            </div>
          `,
    },
    claims: {
      title: "Претензии",
      content: `
            <div class="claims">
              <button id="createClaimBtn">Создать новую претензию</button>
              <table class="claims-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Заказ</th>
                    <th>Категория</th>
                    <th>Описание</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>#12345</td>
                    <td>Брак</td>
                    <td>Получен товар с дефектом экрана.</td>
                    <td>В рассмотрении</td>
                    <td>
                      <button class="view-claim">Просмотреть</button>
                      <button class="update-claim">Обновить</button>
                    </td>
                  </tr>
                  <!-- Дополнительные претензии -->
                </tbody>
              </table>
              
<ol>
<h2>Ключевые требования:</h2>
  <li>
    <span>Создание претензии</span>
    <ul>
      <li>Выбор заказа (или конкретной позиции из заказа).</li>
      <li>Категория претензии: Расхождение по количеству, Брак, Прочее.</li>
      <li>Поля для подробного описания проблемы.</li>
      <li>Возможность прикрепить фото/видео (особенно для брака).</li>
    </ul>
  </li>
  <li>
    <span>Сроки подачи и автоматические проверки</span>
    <ul>
      <li>Ограничения (например, не позднее 3 дней для расхождений по количеству, 7 дней для брака и т. д.).</li>
      <li>Отображение информационного сообщения, если срок пропущен.</li>
    </ul>
  </li>
  <li>
    <span>Статусы и процесс рассмотрения</span>
    <ul>
      <li>Рассматривается, Закрыта, Доп. информация (если клиент загрузил новые фото и т. п.).</li>
      <li>Отслеживание хода рассмотрения, чат с ответственным отделом склада/логистики.</li>
    </ul>
  </li>
  <li>
    <span>Интеграция с 1С</span>
    <ul>
      <li>Автоматическая выгрузка данных претензии в систему 1С (формирование “АктПретензииКСкладу”).</li>
      <li>Для комбинированных случаев (и количество, и качество) создание двух документов.</li>
    </ul>
  </li>
  <li>
    <span>Результат рассмотрения</span>
    <ul>
      <li>Замена товара, доукомплектация, возврат денег.</li>
      <li>Отклонение претензии (с указанием причины).</li>
      <li>Возможность продолжить диалог и отправить новые материалы, если претензия была отклонена.</li>
    </ul>
  </li>
</ol>



            </div>
          `,
    },
    returns: {
      title: "Возвраты",
      content: `
            <div class="returns">
              <button id="createReturnBtn">Создать заявку на возврат</button>
              <table class="returns-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Заказ</th>
                    <th>Товары</th>
                    <th>Категория</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>#12345</td>
                    <td>Смартфон XYZ</td>
                    <td>Брак</td>
                    <td>Ожидание</td>
                    <td>
                      <button class="view-return">Просмотреть</button>
                      <button class="update-return">Обновить</button>
                    </td>
                  </tr>
                  <!-- Дополнительные возвраты -->
                </tbody>
              </table>
              <ol>
  <h2>Ключевые требования:</h2>
  <li>
    <span>Создание заявки на возврат</span>
    <ul>
      <li>Выбор заказа и позиций для возврата.</li>
      <li>Категория: Качественный товар, Брак.</li>
      <li>Прикрепление фото/видео, если есть повреждения.</li>
    </ul>
  </li>
  <li>
    <span>Автоматическая проверка условий</span>
    <ul>
      <li>Сроки (6 мес. для качественного товара, 12 мес. для брака без гарантии и т. д.).</li>
      <li>Исключения (товары, не подлежащие возврату).</li>
    </ul>
  </li>
  <li>
    <span>Интеграция с 1С</span>
    <ul>
      <li>Формирование кредитного документа.</li>
      <li>Поиск УПД по номеру, чтобы привязать его к возврату и избежать дублирования.</li>
    </ul>
  </li>
  <li>
    <span>Статусы возврата</span>
    <ul>
      <li>Черновик, Ожидание получения товара, Возврат принят на складе, Закрыт, Отклонён.</li>
      <li>Дата, до которой клиент должен передать товар на склад.</li>
    </ul>
  </li>
  <li>
    <span>Проверка на складе</span>
    <ul>
      <li>Возможность указать выявленные расхождения (излишки, другая комплектация).</li>
      <li>Если склад не принимает товар (несоответствие упаковки и т. п.) — статус Отклонён.</li>
    </ul>
  </li>
  <li>
    <span>Завершение возврата</span>
    <ul>
      <li>Уведомление клиента о закрытии, возможность скачать УКД, накладную.</li>
      <li>Формирование отчётов для логистов (по складом/регионам/описаниям брака).</li>
    </ul>
  </li>
</ol>

            </div>
          `,
    },
    additionalClient: {
      title: "Дополнительные функции",
      content: `
            
            </div>
          `,
    },

    // Блок для поставщика
    supplier: {
      title: "Личный кабинет поставщика",
      content: `
            <div class="supplier-dashboard">
              <section class="overview">
                <h3>Краткий обзор возможностей</h3>
                <p>Добро пожаловать в личный кабинет поставщика! Здесь вы можете управлять своими товарами, складскими остатками, акциями и анализировать продажи.</p>
              </section>

              <section class="quick-summary">
                <div class="summary-cards2">
                  <div class="card">
                    <h4>Управление продуктами</h4>
                    <p>Добавление и редактирование товаров в каталоге.</p>
                    <button class="summary-button" data-tab="products">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Складские остатки</h4>
                    <p>Контроль и анализ запасов на складах.</p>
                    <button class="summary-button" data-tab="inventory">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Акции и промо</h4>
                    <p>Создание и управление акционными кампаниями.</p>
                    <button class="summary-button" data-tab="promotions">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Аналитика для поставщика</h4>
                    <p>Детализированные отчеты и анализ продаж.</p>
                    <button class="summary-button" data-tab="supplierAnalytics">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Претензии и Возвраты</h4>
                    <p>Управление претензиями и возвратами от клиентов.</p>
                    <button class="summary-button" data-tab="supplierClaimsReturns">Перейти</button>
                  </div>
                  <div class="card">
                    <h4>Дополнительно</h4>
                    <p>Дополнительные настройки и функции.</p>
                    <button class="summary-button" data-tab="additionalSupplier">Перейти</button>
                  </div>
                </div>
              </section>
            </div>
          `,
    },
    products: {
      title: "Управление продуктами",
      content: `
            <div class="manage-products">
              <button id="addProductBtn">Добавить новый товар</button>
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Фото</th>
                    <th>Наименование</th>
                    <th>Артикул</th>
                    <th>Бренд</th>
                    <th>Цена</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><img src="path_to_image1.jpg" alt="Товар 1" width="50"></td>
                    <td>Смартфон XYZ</td>
                    <td>XYZ123</td>
                    <td>TechBrand</td>
                    <td>15,000 ₽</td>
                    <td>Активен</td>
                    <td>
                      <button class="edit-product">Редактировать</button>
                      <button class="delete-product">Удалить</button>
                      <button class="view-analytics">Аналитика</button>
                    </td>
                  </tr>
                  <tr>
                    <td><img src="path_to_image2.jpg" alt="Товар 2" width="50"></td>
                    <td>Ноутбук ABC</td>
                    <td>ABC456</td>
                    <td>ComputeX</td>
                    <td>45,000 ₽</td>
                    <td>Активен</td>
                    <td>
                      <button class="edit-product">Редактировать</button>
                      <button class="delete-product">Удалить</button>
                      <button class="view-analytics">Аналитика</button>
                    </td>
                  </tr>
                  <!-- Дополнительные товары -->
                </tbody>
              </table>

              <!-- Модальное окно для добавления/редактирования товара -->
              <!-- Используем существующее модальное окно из HTML, поэтому этот блок можно удалить -->
            </div>
          `,
    },
    inventory: {
      title: "Складские остатки",
      content: `
            <div class="inventory">
              <button id="exportInventoryBtn">Экспортировать данные</button>
              <table class="inventory-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>SKU</th>
                    <th>Склад</th>
                    <th>Количество</th>
                    <th>Товар в пути</th>
                    <th>Неликвид</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Смартфон XYZ</td>
                    <td>XYZ123</td>
                    <td>Склад 1</td>
                    <td>150</td>
                    <td>20</td>
                    <td>5</td>
                    <td>
                      <button class="view-details">Просмотр</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Ноутбук ABC</td>
                    <td>ABC456</td>
                    <td>Склад 2</td>
                    <td>80</td>
                    <td>10</td>
                    <td>2</td>
                    <td>
                      <button class="view-details">Просмотр</button>
                    </td>
                  </tr>
                  <!-- Дополнительные товары -->
                </tbody>
              </table>

              <section class="inventory-analytics">
                <h3>Аналитика движения товаров</h3>
                <canvas id="inventoryGraph"></canvas>
              </section>
            </div>
          `,
    },
    promotions: {
      title: "Акции и промо",
      content: `
            <div class="promotions">
              <button id="createPromotionBtn">Создать новую акцию</button>
              <table class="promotions-table">
                <thead>
                  <tr>
                    <th>Название акции</th>
                    <th>Условия</th>
                    <th>Сроки</th>
                    <th>Товары-участники</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Скидка 10% на электронику</td>
                    <td>Скидка 10% на все товары категории электроника</td>
                    <td>2024-12-01 до 2024-12-31</td>
                    <td>Смартфоны, Ноутбуки</td>
                    <td>Активна</td>
                    <td>
                      <button class="edit-promotion">Редактировать</button>
                      <button class="delete-promotion">Удалить</button>
                      <button class="view-results">Результаты</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Промо 20% на аксессуары</td>
                    <td>Скидка 20% на все аксессуары</td>
                    <td>2024-11-15 до 2024-12-15</td>
                    <td>Чехлы, Зарядные устройства</td>
                    <td>Завершена</td>
                    <td>
                      <button class="edit-promotion">Редактировать</button>
                      <button class="delete-promotion">Удалить</button>
                      <button class="view-results">Результаты</button>
                    </td>
                  </tr>
                  <!-- Дополнительные акции -->
                </tbody>
              </table>

              <!-- Модальное окно для создания/редактирования акции -->
              <!-- Используем существующее модальное окно из HTML, поэтому этот блок можно удалить -->
            </div>
          `,
    },
    supplierAnalytics: {
      title: "Аналитика для поставщика",
      content: `
            <div class="supplier-analytics">
              <section class="sales-reports">
                <h3>Отчеты по продажам</h3>
                <form id="salesReportFilters">
                  <label for="salesPeriod">Период:</label>
                  <select id="salesPeriod" name="salesPeriod">
                    <option value="lastMonth">Последний месяц</option>
                    <option value="last3Months">Последние 3 месяца</option>
                    <option value="last6Months">Последние 6 месяцев</option>
                    <option value="custom">Произвольный период</option>
                  </select>

                  <div id="customSalesPeriod" style="display: none;">
                    <label for="salesStartDate">С:</label>
                    <input type="date" id="salesStartDate" name="salesStartDate">
                    <label for="salesEndDate">По:</label>
                    <input type="date" id="salesEndDate" name="salesEndDate">
                  </div>

                  <label for="salesCategory">Категория товара:</label>
                  <select id="salesCategory" name="salesCategory">
                    <option value="all">Все категории</option>
                    <option value="electronics">Электроника</option>
                    <option value="fashion">Мода</option>
                    <option value="home">Дом и сад</option>
                    <!-- Дополнительные категории -->
                  </select>

                  <button type="submit">Сгенерировать отчет</button>
                </form>

                <div id="salesChart" class="chart-container">
                  <!-- График продаж будет отображаться здесь -->
                  <canvas id="salesGraph"></canvas>
                </div>
              </section>

              <section class="inventory-reports">
                <h3>Отчеты по складам</h3>
                <button id="exportInventoryReportsBtn">Экспортировать отчеты по складам</button>
                <table class="inventory-reports-table">
                  <thead>
                    <tr>
                      <th>Склад</th>
                      <th>Товар</th>
                      <th>Количество</th>
                      <th>Товар в пути</th>
                      <th>Неликвид</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Склад 1</td>
                      <td>Смартфон XYZ</td>
                      <td>150</td>
                      <td>20</td>
                      <td>5</td>
                    </tr>
                    <tr>
                      <td>Склад 2</td>
                      <td>Ноутбук ABC</td>
                      <td>80</td>
                      <td>10</td>
                      <td>2</td>
                    </tr>
                    <!-- Дополнительные записи -->
                  </tbody>
                </table>
              </section>

              <section class="promotion-results">
                <h3>Результаты акций</h3>
                <table class="promotion-results-table">
                  <thead>
                    <tr>
                      <th>Название акции</th>
                      <th>Товары-участники</th>
                      <th>Дата проведения</th>
                      <th>Количество продаж</th>
                      <th>Доход</th>
                      <th>Эффективность</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Скидка 10% на электронику</td>
                      <td>XYZ123, ABC456</td>
                      <td>2024-12-01 до 2024-12-31</td>
                      <td>200</td>
                      <td>3,000,000 ₽</td>
                      <td>Высокая</td>
                    </tr>
                    <tr>
                      <td>Промо 20% на аксессуары</td>
                      <td>ACC789, ACC101</td>
                      <td>2024-11-15 до 2024-12-15</td>
                      <td>150</td>
                      <td>1,500,000 ₽</td>
                      <td>Средняя</td>
                    </tr>
                    <!-- Дополнительные результаты акций -->
                  </tbody>
                </table>
              </section>
            </div>
          `,
    },
    supplierClaimsReturns: {
      title: "Претензии и Возвраты",
      content: `
            <div class="supplier-claims-returns">
              <table class="supplier-claims-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Товар</th>
                    <th>Тип</th>
                    <th>Описание</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Смартфон XYZ</td>
                    <td>Брак</td>
                    <td>Батарея не держит заряд.</td>
                    <td>Ожидание</td>
                    <td>
                      <button class="view-supplier-claim">Просмотреть</button>
                      <button class="respond-claim">Ответить</button>
                    </td>
                  </tr>
                  <!-- Дополнительные претензии и возвраты -->
                </tbody>
              </table>
            </div>
          `,
    },
    additionalSupplier: {
      title: "Дополнительные функции",
      content: `
            <div class="additional-supplier">
             
            </div>
          `,
    },
    contacts: {
      title: "Контакты",
      content: `
            <div class="contacts">
              <section class="contact-info">
                <h3>Контактные данные</h3>
                <ul>
                  <li><strong>Офис в Москве:</strong> г. Москва, ул. Ленина, д. 1</li>
                  <li><strong>Склад в Санкт-Петербурге:</strong> г. Санкт-Петербург, Невский проспект, д. 20</li>
                  <li><strong>Представительство в Новосибирске:</strong> г. Новосибирск, ул. Советская, д. 5</li>
                  <!-- Дополнительные контакты -->
                </ul>
              </section>

              <section class="feedback-form">
                <h3>Форма обратной связи</h3>
                <form id="feedbackForm">
                  <label for="feedbackName">Ваше имя:</label>
                  <input type="text" id="feedbackName" name="feedbackName" required>

                  <label for="feedbackEmail">Ваш email:</label>
                  <input type="email" id="feedbackEmail" name="feedbackEmail" required>

                  <label for="feedbackMessage">Сообщение:</label>
                  <textarea id="feedbackMessage" name="feedbackMessage" required></textarea>

                  <button type="submit">Отправить</button>
                </form>
              </section>
            </div>
          `,
    },
    templates: {
      title: "Настройки (1-2.SU)",
      content: `
<div class="settings">

      <h3>Настройки профиля и безопасности</h3>
      <form id="profileSettingsForm">
        <label for="profileName">Владелец аккаунта:</label>
        <input type="text" id="profileName" name="profileName" value="Имя" disabled>
              <label for="companyPhone">Телефон:</label>
      <input type="tel" id="companyPhone" name="companyPhone" value="+7 999 123-45-67" required>

        <label for="profileEmail">Email:</label>
        <input type="email" id="profileEmail" name="profileEmail" value="user@example.com" required>

        <label for="profilePassword">Смена пароля:</label>
        <input type="password" id="profilePasswordOld" name="profilePasswordOld" placeholder="Старый пароль">
        <input type="password" id="profilePasswordNew" name="profilePasswordNew" placeholder="Новый пароль">

      </form>
          <section class="notification-settings">
      <h3>Уведомления</h3>
      <form id="notificationSettingsForm">
        <label><input type="checkbox" name="emailNotifications" checked> Уведомления по email</label>
        <label><input type="checkbox" name="smsNotifications"> Уведомления по SMS</label>
        <label><input type="checkbox" name="pushNotifications" checked> Push-уведомления</label>

      </form>
    </section>
  <section class="company-profile">
    <form id="companyProfileForm">




    </form>
  </section>

  <!-- Управление пользователями и ролями -->
  <section class="user-management">
    <h3>Управление пользователями</h3>
    <table class="users-table">
      <thead>
        <tr>
          <th>Имя</th>
          <th>Роль</th>
          <th>Доступы</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Алексей Смирнов</td>
          <td>Менеджер</td>
          <td>Управление заказами, Просмотр аналитики</td>
          <td>
            <button class="edit-user">Редактировать</button>
            <button class="remove-user">Удалить</button>
          </td>
        </tr>
        <tr>
          <td>Мария Иванова</td>
          <td>Торговый представитель</td>
          <td>Все доступы</td>
          <td>
            <button class="edit-user">Редактировать</button>
            <button class="remove-user">Удалить</button>
          </td>
        </tr>
        <!-- Дополнительные пользователи -->
      </tbody>
    </table>
    <button id="addRoleBtn">Добавить пользователя</button>
  </section>

  <!-- Документооборот -->
  <section class="document-management">
    <h3>Документооборот</h3>
    <table class="documents-table">
      <thead>
        <tr>
          <th>Документ</th>
          <th>Дата</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Договор с площадкой</td>
          <td>2024-01-15</td>
          <td>
            <button class="view-document">Просмотреть</button>
            <button class="download-document">Скачать</button>
          </td>
        </tr>
        <!-- Дополнительные документы -->
      </tbody>
    </table>

    
  </section>
      <section class="document-upload">
      <h3>Загрузка документов и сертификатов</h3>
      <form id="documentUploadForm">
        <label for="documents">Загрузить документы:</label>
        <input type="file" id="documents" name="documents" accept=".pdf, .doc, .docx" multiple />

        <button type="submit">Загрузить</button>
      </form>
    </section>

  <!-- Интеграции -->
  <section class="integrations">
    <h3>Интеграции</h3>
    <form id="integrationForm">
      <label for="externalService">Внешний сервис:</label>
      <select id="externalService" name="externalService">
        <option value="edo">ЭДО</option>
        <option value="api">API</option>
        <option value="excel">Excel-шаблоны</option>
        <!-- Дополнительные сервисы -->
      </select>

      <label for="integrationKey">Ключ интеграции:</label>
      <input type="text" id="integrationKey" name="integrationKey" required>

      <button type="submit">Добавить интеграцию</button>
    </form>

    <table class="integrations-table">
      <thead>
        <tr>
          <th>Сервис</th>
          <th>Ключ</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ЭДО</td>
          <td>ABC123XYZ</td>
          <td>Активна</td>
          <td>
            <button class="remove-integration">Удалить</button>
          </td>
        </tr>
        <!-- Дополнительные интеграции -->
      </tbody>
    </table>
  </section>



  <!-- Дополнительные настройки клиента -->
  <div class="additional-client">
    

    <!-- Персональные настройки -->
    <section class="personal-settings">
      <h3>Персональные настройки</h3>
      <form id="personalSettingsForm">
        

        <label for="theme">Тема:</label>
        <select id="theme" name="theme">
          <option value="light">Светлая</option>
          <option value="dark">Темная</option>
        </select>

        <label for="language">Язык:</label>
        <select id="language" name="language">
          <option value="ru">Русский</option>
          <option value="en">English</option>
          <!-- Дополнительные языки -->
        </select>

      </form>
    </section>

 



    <!-- История изменений -->
    <section class="change-history">
      <h3>История изменений</h3>
      <table class="change-history-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Действие</th>
            <th>Описание</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024-12-01</td>
            <td>Изменение профиля</td>
            <td>Обновлен email</td>
          </tr>
          <!-- Дополнительные записи -->
        </tbody>
      </table>
    </section>



    <!-- Управление уведомлениями -->
    <section class="notification-settings">
 
      <form id="notificationSettingsForm">
  

        <button type="submit">Сохранить изменения</button>
      </form>
    </section>

  </div>
  
</div>

          `,
    },
  };

  function createMainContent() {
    let mainContent = document.getElementById("mainContent");
    if (!mainContent) {
      mainContent = document.createElement("div");
      mainContent.classList.add("main-content");
      mainContent.id = "mainContent";
      document.querySelector(".container").appendChild(mainContent);
    }
    return mainContent;
  }

  function setActiveTab(activeLink) {
    const allLinks = document.querySelectorAll(
      ".tab-link, .nav-button, .summary-button"
    );
    allLinks.forEach((link) => {
      if (link === activeLink) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  function showStructure(tab) {
    const mainContent = createMainContent();
    mainContent.classList.remove("show");
    setTimeout(() => {
      if (structure[tab]) {
        mainContent.innerHTML = `
              <h2>${structure[tab].title}</h2>
              ${structure[tab].content}
            `;
        localStorage.setItem("activeTab", tab);
        initializeTabFeatures(tab);
      } else {
        mainContent.innerHTML = `
              <h2>Структура</h2>
              <p>Для данной вкладки структура не определена.</p>
            `;
      }
      mainContent.classList.add("show");
    }, 300);
  }

  function initializeTabFeatures(tab) {
    switch (tab) {
      case "myOrders":
        initializeMyOrders();
        break;
      case "balanceLoyalty":
        initializeBalanceLoyalty();
        break;
      case "addresses":
        initializeAddresses();
        break;
      case "organizations":
        initializeOrganizations();
        break;
      case "waitlist":
        initializeWaitlist();
        break;
      case "clientAnalytics":
        initializeClientAnalytics();
        break;
      case "claims":
        initializeClaims();
        break;
      case "returns":
        initializeReturns();
        break;
      case "additionalClient":
        initializeAdditionalClient();
        break;
      case "supplier":
        initializeSupplier();
        break;
      case "products":
        initializeProducts();
        break;
      case "inventory":
        initializeInventory();
        break;
      case "promotions":
        initializePromotions();
        break;
      case "supplierAnalytics":
        initializeSupplierAnalytics();
        break;
      case "supplierClaimsReturns":
        initializeSupplierClaimsReturns();
        break;
      case "additionalSupplier":
        initializeAdditionalSupplier();
        break;
      case "contacts":
        initializeContacts();
        break;
      case "templates":
        initializeTemplates();
        break;
      default:
        break;
    }
  }

  // Инициализация функций для различных вкладок
  function initializeMyOrders() {
    // В вашей текущей реализации вкладка "Мои Заказы" содержит только текст.
    // Если позже добавите кнопки или элементы, их можно инициализировать здесь.
    console.log("Инициализация вкладки 'Мои Заказы' выполнена.");
  }

  function initializeBalanceLoyalty() {
    const redeemBtn = document.getElementById("redeemBonuses");
    if (redeemBtn) {
      redeemBtn.addEventListener("click", () => {
        alert("Использование бонусов");
      });
    }

    const viewDiscountsBtn = document.getElementById("viewDiscounts");
    if (viewDiscountsBtn) {
      viewDiscountsBtn.addEventListener("click", () => {
        alert("Просмотр доступных скидок");
      });
    }

    const downloadStatementsBtn = document.getElementById("downloadStatements");
    if (downloadStatementsBtn) {
      downloadStatementsBtn.addEventListener("click", () => {
        alert("Скачивание выписки");
      });
    }

    // Удалены обращения к несуществующим элементам:
    // - purchaseGraph
    // - reportPeriod
    // - customPeriod
    // - reportFilters
  }

  function initializeAddresses() {
    // Используем существующее модальное окно из HTML (id="addressModal")
    const addAddressBtn = document.getElementById("addAddressBtn");
    const addressModal = document.getElementById("addressModal");

    if (addAddressBtn && addressModal) {
      addAddressBtn.addEventListener("click", () => {
        addressModal.style.display = "block";
      });

      addressModal.querySelector(".close").addEventListener("click", () => {
        addressModal.style.display = "none";
      });

      window.addEventListener("click", (event) => {
        if (event.target === addressModal) {
          addressModal.style.display = "none";
        }
      });

      // Обработка добавления адреса
      const addAddressForm = addressModal.querySelector("#addAddressForm");
      if (addAddressForm) {
        addAddressForm.addEventListener("submit", (e) => {
          e.preventDefault();
          alert("Новый адрес добавлен");
          // Здесь можно добавить логику добавления адреса в таблицу
          addressModal.style.display = "none";
        });
      }
    }

    // Логика для кнопок редактирования и удаления
    const editButtons = document.querySelectorAll(".edit-address");
    const deleteButtons = document.querySelectorAll(".delete-address");
    const setDefaultButtons = document.querySelectorAll(".set-default");

    editButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Редактирование адреса");
        // Здесь можно открыть модальное окно для редактирования адреса
      });
    });

    deleteButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Адрес удален");
        // Здесь можно реализовать удаление адреса из таблицы
      });
    });

    setDefaultButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Адрес установлен по умолчанию");
        // Здесь можно реализовать установку адреса по умолчанию
      });
    });
  }

  function initializeOrganizations() {
    // Используем существующее модальное окно из HTML (id="organizationModal")
    const addOrganizationBtn = document.getElementById("addOrganizationBtn");
    const organizationModal = document.getElementById("organizationModal");

    if (addOrganizationBtn && organizationModal) {
      addOrganizationBtn.addEventListener("click", () => {
        organizationModal.style.display = "block";
      });

      organizationModal
        .querySelector(".close")
        .addEventListener("click", () => {
          organizationModal.style.display = "none";
        });

      window.addEventListener("click", (event) => {
        if (event.target === organizationModal) {
          organizationModal.style.display = "none";
        }
      });

      // Обработка добавления организации
      const addOrganizationForm = organizationModal.querySelector(
        "#addOrganizationForm"
      );
      if (addOrganizationForm) {
        addOrganizationForm.addEventListener("submit", (e) => {
          e.preventDefault();
          alert("Новая организация добавлена");
          // Здесь можно добавить логику добавления организации в таблицу
          organizationModal.style.display = "none";
        });
      }
    }

    // Логика для кнопок редактирования и удаления
    const editOrgButtons = document.querySelectorAll(".edit-organization");
    const deleteOrgButtons = document.querySelectorAll(".delete-organization");

    editOrgButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Редактирование организации");
        // Здесь можно открыть модальное окно для редактирования организации
      });
    });

    deleteOrgButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Организация удалена");
        // Здесь можно реализовать удаление организации из таблицы
      });
    });
  }

  function initializeWaitlist() {
    // Логика для настройки уведомлений
    const notifyMeBtn = document.getElementById("notifyMeBtn");
    if (notifyMeBtn) {
      notifyMeBtn.addEventListener("click", () => {
        alert("Настройка уведомлений");
        // Здесь можно открыть форму для настройки уведомлений
      });
    }

    // Логика для удаления товаров из листа ожидания
    const removeWaitButtons = document.querySelectorAll(".remove-wait");
    removeWaitButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Товар удален из листа ожидания");
        // Здесь можно реализовать удаление товара из таблицы
      });
    });

    // Логика для изменения приоритета
    const prioritySelects = document.querySelectorAll(".priority-select");
    prioritySelects.forEach((select) => {
      select.addEventListener("change", () => {
        alert("Приоритет изменен");
        // Здесь можно сохранить новый приоритет
      });
    });
  }

  function initializeClientAnalytics() {
    // Инициализация графика покупок (например, с использованием Chart.js)
    if (document.getElementById("purchaseGraph")) {
      const ctx = document.getElementById("purchaseGraph").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Январь", "Февраль", "Март", "Апрель", "Май"],
          datasets: [
            {
              label: "Сумма покупок (₽)",
              data: [5000, 7000, 8000, 6000, 9000],
              borderColor: "rgba(75, 192, 192, 1)",
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    // Логика для отправки фильтров отчета
    const reportForm = document.getElementById("reportFilters");
    if (reportForm) {
      const reportPeriod = document.getElementById("reportPeriod");
      const customPeriod = document.getElementById("customPeriod");

      if (reportPeriod && customPeriod) {
        reportPeriod.addEventListener("change", () => {
          if (reportPeriod.value === "custom") {
            customPeriod.style.display = "block";
          } else {
            customPeriod.style.display = "none";
          }
        });
      }

      reportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Применение фильтров отчета");
        // Здесь можно обновить данные графика на основе выбранных фильтров
      });
    }

    // Логика для экспорта статистики
    const downloadStatsBtn = document.getElementById("downloadStats");
    if (downloadStatsBtn) {
      downloadStatsBtn.addEventListener("click", () => {
        alert("Скачивание персональной статистики");
        // Здесь можно реализовать скачивание статистических данных
      });
    }
  }

  function initializeClaims() {
    const createClaimBtn = document.getElementById("createClaimBtn");
    const claimsModal = document.getElementById("claimsModal");

    if (createClaimBtn && claimsModal) {
      createClaimBtn.addEventListener("click", () => {
        claimsModal.style.display = "block";
        // Здесь можно заполнить список заказов динамически
      });

      claimsModal.querySelector(".close").addEventListener("click", () => {
        claimsModal.style.display = "none";
      });

      window.addEventListener("click", (event) => {
        if (event.target === claimsModal) {
          claimsModal.style.display = "none";
        }
      });

      // Обработка создания претензии
      const claimsForm = claimsModal.querySelector("#claimsForm");
      if (claimsForm) {
        claimsForm.addEventListener("submit", (e) => {
          e.preventDefault();
          alert("Претензия отправлена");
          // Здесь можно добавить логику отправки претензии
          claimsModal.style.display = "none";
        });
      }
    }

    // Логика для кнопок просмотра и обновления претензий
    const viewClaimButtons = document.querySelectorAll(".view-claim");
    const updateClaimButtons = document.querySelectorAll(".update-claim");

    viewClaimButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Просмотр претензии");
        // Здесь можно открыть модальное окно с деталями претензии
      });
    });

    updateClaimButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Обновление претензии");
        // Здесь можно добавить логику обновления претензии
      });
    });
  }

  function initializeReturns() {
    const createReturnBtn = document.getElementById("createReturnBtn");
    const returnsModal = document.getElementById("returnsModal");

    if (createReturnBtn && returnsModal) {
      createReturnBtn.addEventListener("click", () => {
        returnsModal.style.display = "block";
        // Здесь можно заполнить список заказов динамически
      });

      returnsModal.querySelector(".close").addEventListener("click", () => {
        returnsModal.style.display = "none";
      });

      window.addEventListener("click", (event) => {
        if (event.target === returnsModal) {
          returnsModal.style.display = "none";
        }
      });

      // Обработка создания заявки на возврат
      const returnsForm = returnsModal.querySelector("#returnsForm");
      if (returnsForm) {
        returnsForm.addEventListener("submit", (e) => {
          e.preventDefault();
          alert("Заявка на возврат отправлена");
          // Здесь можно добавить логику отправки заявки на возврат
          returnsModal.style.display = "none";
        });
      }
    }

    // Логика для кнопок просмотра и обновления возвратов
    const viewReturnButtons = document.querySelectorAll(".view-return");
    const updateReturnButtons = document.querySelectorAll(".update-return");

    viewReturnButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Просмотр возврата");
        // Здесь можно открыть модальное окно с деталями возврата
      });
    });

    updateReturnButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Обновление возврата");
        // Здесь можно добавить логику обновления возврата
      });
    });
  }

  function initializeAdditionalClient() {
    const profileSettingsForm = document.getElementById("profileSettingsForm");
    if (profileSettingsForm) {
      profileSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Персональные настройки сохранены");
        // Здесь можно реализовать сохранение настроек пользователя
      });
    }

    const notificationsForm = document.getElementById("notificationsForm");
    if (notificationsForm) {
      notificationsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Настройки уведомлений сохранены");
        // Здесь можно реализовать сохранение настроек уведомлений
      });
    }

    const documentUploadForm = document.getElementById("documentUploadForm");
    if (documentUploadForm) {
      documentUploadForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Документы загружены");
        // Здесь можно реализовать загрузку документов на сервер
        documentUploadForm.reset();
      });
    }

    const openChatBtn = document.getElementById("openChatBtn");
    if (openChatBtn) {
      openChatBtn.addEventListener("click", () => {
        alert("Открытие чата");
        // Здесь можно интегрировать чат-систему
      });
    }

    const changeHistoryTable = document.querySelector(".change-history-table");
    if (changeHistoryTable) {
      // Возможна динамическая загрузка истории изменений
      console.log("История изменений загружена.");
    }
  }

  function initializeSupplier() {
    // Логика инициализации поставщика, если требуется
    console.log("Инициализация вкладки 'Поставщик' выполнена.");
  }

  function initializeProducts() {
    // Используем существующее модальное окно из HTML (id="productModal")
    const addProductBtn = document.getElementById("addProductBtn");
    const productModal = document.getElementById("productModal");

    if (addProductBtn && productModal) {
      const closeModal = productModal.querySelector(".close");
      if (closeModal) {
        closeModal.addEventListener("click", () => {
          productModal.style.display = "none";
        });
      }

      addProductBtn.addEventListener("click", () => {
        document.getElementById("modalTitle").innerText =
          "Добавить новый товар";
        document.getElementById("productForm").reset();
        productModal.style.display = "block";
      });

      window.addEventListener("click", (event) => {
        if (event.target === productModal) {
          productModal.style.display = "none";
        }
      });

      // Обработка формы добавления/редактирования товара
      const productForm = productModal.querySelector("#productForm");
      if (productForm) {
        productForm.addEventListener("submit", (e) => {
          e.preventDefault();
          alert("Товар сохранен");
          // Здесь можно добавить логику сохранения товара в таблицу
          productModal.style.display = "none";
        });
      }
    }

    // Логика для редактирования и удаления товаров
    const editProductButtons = document.querySelectorAll(".edit-product");
    const deleteProductButtons = document.querySelectorAll(".delete-product");
    const viewAnalyticsButtons = document.querySelectorAll(".view-analytics");

    editProductButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Редактирование товара");
        // Здесь можно загрузить данные товара в форму и открыть модальное окно
      });
    });

    deleteProductButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Товар удален");
        // Здесь можно реализовать удаление товара из таблицы
      });
    });

    viewAnalyticsButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Просмотр аналитики товара");
        // Здесь можно открыть страницу или модальное окно с аналитикой по товару
      });
    });
  }

  function initializeInventory() {
    // Логика для экспорта данных
    const exportInventoryBtn = document.getElementById("exportInventoryBtn");
    if (exportInventoryBtn) {
      exportInventoryBtn.addEventListener("click", () => {
        alert("Экспортирование данных о складских остатках");
        // Здесь можно реализовать экспорт таблицы в Excel или CSV
      });
    }

    // Инициализация графика движения товаров
    if (document.getElementById("inventoryGraph")) {
      const ctx = document.getElementById("inventoryGraph").getContext("2d");
      new Chart(ctx, {
        type: "pie",
        data: {
          labels: ["Продажи", "Поступления", "Неликвид"],
          datasets: [
            {
              label: "Движение товаров",
              data: [60, 30, 10],
              backgroundColor: [
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
              ],
            },
          ],
        },
        options: {
          responsive: true,
        },
      });
    }

    // Логика для просмотра деталей
    const viewDetailsButtons = document.querySelectorAll(".view-details");
    viewDetailsButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Просмотр деталей склада");
        // Здесь можно открыть модальное окно с деталями склада
      });
    });
  }

  function initializePromotions() {
    // Используем существующее модальное окно из HTML (id="promotionModal")
    const createPromotionBtn = document.getElementById("createPromotionBtn");
    const promotionModal = document.getElementById("promotionModal");

    if (createPromotionBtn && promotionModal) {
      const closeModal = promotionModal.querySelector(".close");
      if (closeModal) {
        closeModal.addEventListener("click", () => {
          promotionModal.style.display = "none";
        });
      }

      createPromotionBtn.addEventListener("click", () => {
        document.getElementById("promotionModalTitle").innerText =
          "Создать новую акцию";
        document.getElementById("promotionForm").reset();
        promotionModal.style.display = "block";
      });

      window.addEventListener("click", (event) => {
        if (event.target === promotionModal) {
          promotionModal.style.display = "none";
        }
      });

      // Обработка формы создания/редактирования акции
      const promotionForm = promotionModal.querySelector("#promotionForm");
      if (promotionForm) {
        promotionForm.addEventListener("submit", (e) => {
          e.preventDefault();
          alert("Акция сохранена");
          // Здесь можно добавить логику сохранения акции в таблицу
          promotionModal.style.display = "none";
        });
      }
    }

    // Логика для редактирования, удаления и просмотра результатов акций
    const editPromotionButtons = document.querySelectorAll(".edit-promotion");
    const deletePromotionButtons =
      document.querySelectorAll(".delete-promotion");
    const viewResultsButtons = document.querySelectorAll(".view-results");

    editPromotionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Редактирование акции");
        // Здесь можно загрузить данные акции в форму и открыть модальное окно
      });
    });

    deletePromotionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Акция удалена");
        // Здесь можно реализовать удаление акции из таблицы
      });
    });

    viewResultsButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Просмотр результатов акции");
        // Здесь можно открыть страницу или модальное окно с результатами акции
      });
    });
  }

  function initializeSupplierAnalytics() {
    // Инициализация графиков (например, с использованием Chart.js)
    if (document.getElementById("salesGraph")) {
      const ctx = document.getElementById("salesGraph").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Январь", "Февраль", "Март", "Апрель", "Май"],
          datasets: [
            {
              label: "Продажи (₽)",
              data: [200000, 250000, 300000, 280000, 350000],
              borderColor: "rgba(255, 99, 132, 1)",
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    if (document.getElementById("inventoryGraph")) {
      const ctx = document.getElementById("inventoryGraph").getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Склад 1", "Склад 2", "Склад 3"],
          datasets: [
            {
              label: "Остатки (шт.)",
              data: [150, 80, 60],
              backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    // Логика для генерации отчетов по динамике продаж
    const salesReportForm = document.getElementById("salesReportFilters");
    if (salesReportForm) {
      const salesPeriod = document.getElementById("salesPeriod");
      const customSalesPeriod = document.getElementById("customSalesPeriod");

      if (salesPeriod && customSalesPeriod) {
        salesPeriod.addEventListener("change", () => {
          if (salesPeriod.value === "custom") {
            customSalesPeriod.style.display = "block";
          } else {
            customSalesPeriod.style.display = "none";
          }
        });
      }

      salesReportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Генерация отчета по продажам");
        // Здесь можно реализовать обновление графиков на основе выбранных фильтров
      });
    }

    // Логика для экспорта отчетов
    const exportInventoryReportsBtn = document.getElementById(
      "exportInventoryReportsBtn"
    );
    if (exportInventoryReportsBtn) {
      exportInventoryReportsBtn.addEventListener("click", () => {
        alert("Экспортирование отчетов по складам");
        // Здесь можно реализовать экспорт таблицы в Excel или CSV
      });
    }

    // Логика для просмотра проводимых акций
    // В содержимом вкладки нет кнопок с классом "view-promotion", поэтому данный блок удален
    // Если планируется добавить такие кнопки, можно добавить обработчики здесь
    // const viewPromotionButtons = document.querySelectorAll(".view-promotion");
    // viewPromotionButtons.forEach((button) => {
    //   button.addEventListener("click", () => {
    //     alert("Просмотр проводимых акций");
    //     // Здесь можно открыть страницу или модальное окно с акциями
    //   });
    // });
  }

  function initializeSupplierClaimsReturns() {
    const viewClaimButtons = document.querySelectorAll(".view-supplier-claim");
    const respondClaimButtons = document.querySelectorAll(".respond-claim");

    viewClaimButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Просмотр претензии");
        // Здесь можно открыть модальное окно с деталями претензии
      });
    });

    respondClaimButtons.forEach((button) => {
      button.addEventListener("click", () => {
        alert("Ответ на претензию");
        // Здесь можно реализовать ответ на претензию
      });
    });
  }

  function initializeAdditionalSupplier() {
    const companyProfileForm = document.getElementById("companyProfileForm");
    if (companyProfileForm) {
      companyProfileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Профиль компании обновлен");
        // Здесь можно реализовать сохранение профиля компании
      });
    }

    const addUserBtn = document.getElementById("addUserBtn");
    const usersTable = document.querySelector(".users-table tbody");
    if (addUserBtn && usersTable) {
      addUserBtn.addEventListener("click", () => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
              <td><input type="text" placeholder="Имя сотрудника" required></td>
              <td>
                <select>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Торговый представитель</option>
                  <!-- Дополнительные роли -->
                </select>
              </td>
              <td>
                <input type="text" placeholder="Доступы" required>
              </td>
              <td>
                <button class="edit-user">Редактировать</button>
                <button class="remove-user">Удалить</button>
              </td>
            `;
        usersTable.appendChild(newRow);
      });
    }

    // Логика для редактирования и удаления пользователей
    if (usersTable) {
      usersTable.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-user")) {
          const row = e.target.closest("tr");
          row.remove();
          alert("Сотрудник удален");
        }

        if (e.target.classList.contains("edit-user")) {
          const row = e.target.closest("tr");
          const inputs = row.querySelectorAll("input, select");
          inputs.forEach((input) => {
            input.disabled = !input.disabled;
          });
          alert("Редактирование сотрудника");
        }
      });
    }

    const openSupplierChatBtn = document.getElementById("openSupplierChatBtn");
    if (openSupplierChatBtn) {
      openSupplierChatBtn.addEventListener("click", () => {
        alert("Открытие чата");
        // Здесь можно интегрировать чат-систему
      });
    }

    const documentManagementTable = document.querySelector(
      ".documents-table tbody"
    );
    if (documentManagementTable) {
      // Возможна динамическая загрузка документов
      console.log("Документы загружены.");
    }

    const integrationSupplierForm = document.getElementById(
      "integrationSupplierForm"
    );
    if (integrationSupplierForm) {
      integrationSupplierForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Интеграция добавлена");
        // Здесь можно реализовать добавление интеграции в таблицу
        integrationSupplierForm.reset();
      });
    }

    const supplierIntegrationsTable = document.querySelector(
      ".supplier-integrations-table tbody"
    );
    if (supplierIntegrationsTable) {
      supplierIntegrationsTable.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-supplier-integration")) {
          const row = e.target.closest("tr");
          row.remove();
          alert("Интеграция удалена");
        }
      });
    }
  }

  function initializeClaims() {
    // Модальные окна для создания претензии уже добавлены
    // Дополнительная логика может быть реализована здесь
    console.log("Инициализация претензий завершена.");
  }

  function initializeReturns() {
    // Модальные окна для создания возврата уже добавлены
    // Дополнительная логика может быть реализована здесь
    console.log("Инициализация возвратов завершена.");
  }

  function initializeContacts() {
    // Логика для формы обратной связи
    const feedbackForm = document.getElementById("feedbackForm");
    if (feedbackForm) {
      feedbackForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Сообщение отправлено");
        // Здесь можно реализовать отправку сообщения на сервер
        feedbackForm.reset();
      });
    }
  }

  function initializeTemplates() {
    // Логика для формы персональных настроек
    const personalSettingsForm = document.getElementById(
      "personalSettingsForm"
    );
    if (personalSettingsForm) {
      personalSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Персональные настройки сохранены");
        // Здесь можно реализовать сохранение настроек пользователя
      });
    }

    // Логика для формы управления уведомлениями
    const notificationSettingsForm = document.getElementById(
      "notificationSettingsForm"
    );
    if (notificationSettingsForm) {
      notificationSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Настройки уведомлений сохранены");
        // Здесь можно реализовать сохранение настроек уведомлений
      });
    }

    // Логика для добавления и удаления сотрудников
    const addRoleBtn = document.getElementById("addRoleBtn");
    const rolesTable = document.querySelector(".roles-table tbody");
    if (addRoleBtn && rolesTable) {
      addRoleBtn.addEventListener("click", () => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
              <td><input type="text" placeholder="Имя сотрудника" required></td>
              <td>
                <select>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Торговый представитель</option>
                  <!-- Дополнительные роли -->
                </select>
              </td>
              <td>
                <input type="text" placeholder="Доступы" required>
              </td>
              <td>
                <button class="edit-role">Редактировать</button>
                <button class="remove-role">Удалить</button>
              </td>
            `;
        rolesTable.appendChild(newRow);
      });
    }

    // Логика для редактирования и удаления ролей
    if (rolesTable) {
      rolesTable.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-role")) {
          const row = e.target.closest("tr");
          row.remove();
          alert("Сотрудник удален");
        }

        if (e.target.classList.contains("edit-role")) {
          const row = e.target.closest("tr");
          const inputs = row.querySelectorAll("input, select");
          inputs.forEach((input) => {
            input.disabled = !input.disabled;
          });
          alert("Редактирование сотрудника");
        }
      });
    }

    // Логика для добавления интеграции
    const integrationForm = document.getElementById("integrationForm");
    if (integrationForm) {
      integrationForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Интеграция добавлена");
        // Здесь можно реализовать добавление интеграции в таблицу
        integrationForm.reset();
      });
    }

    // Логика для удаления интеграций
    const integrationsTable = document.querySelector(
      ".integrations-table tbody"
    );
    if (integrationsTable) {
      integrationsTable.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-integration")) {
          const row = e.target.closest("tr");
          row.remove();
          alert("Интеграция удалена");
        }
      });
    }
  }

  function initializeAdditionalSupplier() {
    // Дополнительная инициализация для поставщика
    console.log("Инициализация дополнительных функций поставщика завершена.");
  }

  const tabLinks = document.querySelectorAll(
    ".tab-link, .nav-button, .summary-button"
  );

  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = link.getAttribute("data-tab");
      if (structure[tab]) {
        showStructure(tab);
      } else {
        showStructure(null);
      }
      setActiveTab(link);
    });
  });

  const savedTab = localStorage.getItem("activeTab");
  let defaultTab = document.querySelector('.tab-link[data-tab="client"]');
  if (savedTab) {
    const savedTabLink = document.querySelector(
      `.tab-link[data-tab="${savedTab}"], .nav-button[data-tab="${savedTab}"], .summary-button[data-tab="${savedTab}"]`
    );
    if (savedTabLink) {
      defaultTab = savedTabLink;
    }
  }
  if (defaultTab) {
    defaultTab.click();
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("Выход из системы");
      // Логика выхода (редирект или очистка сессии) может быть добавлена здесь
    });
  }

  // Инициализация модальных окон для дополнительных функций
  const additionalClientModal = document.getElementById(
    "additionalClientModal"
  );
  if (additionalClientModal) {
    additionalClientModal
      .querySelector(".close")
      .addEventListener("click", () => {
        additionalClientModal.style.display = "none";
      });

    window.addEventListener("click", (event) => {
      if (event.target === additionalClientModal) {
        additionalClientModal.style.display = "none";
      }
    });
  }

  const additionalSupplierModal = document.getElementById(
    "additionalSupplierModal"
  );
  if (additionalSupplierModal) {
    additionalSupplierModal
      .querySelector(".close")
      .addEventListener("click", () => {
        additionalSupplierModal.style.display = "none";
      });

    window.addEventListener("click", (event) => {
      if (event.target === additionalSupplierModal) {
        additionalSupplierModal.style.display = "none";
      }
    });
  }
});
