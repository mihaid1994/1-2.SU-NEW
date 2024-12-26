// categorymodule.js

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector("#category-module .sidebar");
  const subcategoriesContainer = document.querySelector(
    "#category-module .subcategories-container"
  );

  let superActiveTitle = null; // Текущая супер активная категория

  // Функция отображения подкатегорий
  function showSubcategories(category) {
    // Очищаем контейнер
    subcategoriesContainer.innerHTML = "";
    subcategoriesContainer.classList.add("active");

    // Создаем контейнер для колонок
    const columnsContainer = document.createElement("div");
    columnsContainer.className = "columns-container";

    // Определяем количество колонок
    const numColumns = 3;
    const columns = [];

    // Создаем колонки
    for (let i = 0; i < numColumns; i++) {
      const col = document.createElement("div");
      col.className = "subcategory-column";
      columnsContainer.appendChild(col);
      columns.push(col);
    }

    // Распределяем подкатегории по колонкам
    category.subcategories.forEach((subcat, index) => {
      const colindex = index % numColumns;
      const column = columns[colindex];

      const block = document.createElement("div");
      block.className = "subcategory-block";

      const titleEl = document.createElement("div");
      titleEl.className = "subcategory-title";
      titleEl.textContent = subcat.title;

      const itemsEl = document.createElement("div");
      itemsEl.className = "subcategory-items active";

      // Ограничение на количество отображаемых элементов
      const maxVisibleItems = 7;
      const hasMore = subcat.subitems.length > maxVisibleItems;
      const itemsToShow = hasMore
        ? subcat.subitems.slice(0, maxVisibleItems)
        : subcat.subitems;

      itemsToShow.forEach((item) => {
        const itemEl = document.createElement("div");
        itemEl.className = "subcategory-item";
        itemEl.textContent = item;
        itemsEl.appendChild(itemEl);
      });

      // Если есть больше элементов, добавляем кнопку "Показать ещё"
      if (hasMore) {
        const showMoreEl = document.createElement("div");
        showMoreEl.className = "show-more";
        showMoreEl.textContent = "Показать ещё";
        showMoreEl.addEventListener("click", () => {
          // Проверяем, не добавлены ли уже все элементы
          if (subcat.subitems.length > itemsEl.children.length) {
            const remainingItems = subcat.subitems.slice(
              itemsEl.children.length
            );
            remainingItems.forEach((item) => {
              const itemEl = document.createElement("div");
              itemEl.className = "subcategory-item";
              itemEl.textContent = item;
              itemsEl.insertBefore(itemEl, showMoreEl);
            });
          }
          showMoreEl.style.display = "none";
        });
        itemsEl.appendChild(showMoreEl);
      }

      block.appendChild(titleEl);
      block.appendChild(itemsEl);
      column.appendChild(block);
    });

    subcategoriesContainer.appendChild(columnsContainer);
  }

  // Функция для установки супер активного состояния
  function setSuperActive(titleElement) {
    if (superActiveTitle) {
      superActiveTitle.classList.remove("super-active");
    }
    superActiveTitle = titleElement;
    superActiveTitle.classList.add("super-active");
  }

  // Функция для отображения подкатегорий super-active категории
  function showSuperActiveSubcategories() {
    if (superActiveTitle) {
      const slug = superActiveTitle.getAttribute("data-slug");
      const category = categories.find((cat) => cat.slug === slug);
      if (category) {
        showSubcategories(category);
      }
    }
  }

  let categories = []; // Хранение категорий из JSON

  // Загружаем данные из JSON
  fetch("/data/category.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      categories = data.categories || [];

      if (categories.length === 0) {
        console.warn("Категории отсутствуют в JSON.");
        return;
      }

      // Создаем список категорий в сайдбаре
      categories.forEach((cat) => {
        const groupTitle = document.createElement("div");
        groupTitle.className = "group-title";
        groupTitle.setAttribute("data-slug", cat.slug);

        // Добавляем иконку к категории из JSON
        if (cat.icon) {
          const icon = document.createElement("i");
          icon.className = cat.icon;
          groupTitle.appendChild(icon);
        } else {
          // Если иконка не указана, используем стандартную
          const defaultIcon = document.createElement("i");
          defaultIcon.className = "ri-folder-line";
          groupTitle.appendChild(defaultIcon);
        }

        const text = document.createElement("span");
        text.textContent = cat.title;
        groupTitle.appendChild(text);

        // Обработчик наведения мыши (mouseenter)
        groupTitle.addEventListener("mouseenter", () => {
          groupTitle.classList.add("active");
          showSubcategories(cat);
        });

        // Обработчик ухода мыши (mouseleave)
        groupTitle.addEventListener("mouseleave", () => {
          groupTitle.classList.remove("active");
          // Проверяем, находится ли курсор над сайдбаром
          // Если нет, покажем super-active подкатегории
          // Это будет обработано глобальным обработчиком
        });

        // Обработчик клика для установки super-active
        groupTitle.addEventListener("click", (e) => {
          e.stopPropagation(); // Предотвращаем всплытие события

          // Устанавливаем супер активный заголовок
          setSuperActive(groupTitle);

          // Отображаем подкатегории для супер активного заголовка
          showSubcategories(cat);
        });

        sidebar.appendChild(groupTitle);
      });

      // Автоматически устанавливаем первую категорию как super-active
      const firstTitle = sidebar.querySelector(".group-title");
      if (firstTitle) {
        setSuperActive(firstTitle);
        const firstCategory = categories[0];
        showSubcategories(firstCategory);
      }
    })
    .catch((err) => {
      console.error("Ошибка при загрузке категорий:", err);
    });

  // Обработчик ухода курсора с сайдбара (mouseleave)
  sidebar.addEventListener("mouseleave", () => {
    // Отображаем подкатегории super-active категории
    showSuperActiveSubcategories();
  });

  // Обработчик наведения курсора на сайдбар (mouseenter)
  // Для обеспечения корректного поведения при наведении на сайдбар
  sidebar.addEventListener("mouseenter", () => {
    // Можно добавить дополнительные действия при наведении на сайдбар, если необходимо
  });
});
