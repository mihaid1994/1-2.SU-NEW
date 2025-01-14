// --- Завёрнутый Скрипт: initReasApi ---

window.initReasApi = function (root = document) {
  // Получаем элементы внутри переданного корня
  const methodTitles = root.querySelectorAll(".api-method-title");
  const themeToggle = root.getElementById("theme-toggle");

  // Функция для переключения видимости описания методов API
  methodTitles.forEach((title) => {
    title.addEventListener("click", () => {
      const description = title.nextElementSibling;
      const isVisible = description.classList.contains("visible");

      // Закрыть все описания внутри корня
      root.querySelectorAll(".api-method .description").forEach((desc) => {
        desc.classList.remove("visible");
        desc.previousElementSibling.classList.remove("active");
      });

      // Если описание не было открыто, открыть его
      if (!isVisible) {
        description.classList.add("visible");
        title.classList.add("active");
      }
    });
  });

  // Анимации при скролле с использованием Intersection Observer
  const observerOptions = {
    threshold: 0.1,
  };

  const elementsToAnimate = root.querySelectorAll(
    ".section-title, .api-method, .code-snippet, .response-example"
  );

  const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observerInstance.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elementsToAnimate.forEach((element) => {
    observer.observe(element);
  });

  // Функция для переключения темы
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      // Переключаем классы темы на основном документе
      document.body.classList.toggle("dark-theme");
      document.body.classList.toggle("light-theme");

      // Переключаем классы темы на контейнерах внутри корня
      const containers = root.querySelectorAll(".container");
      containers.forEach((container) => {
        container.classList.toggle("dark-theme");
        container.classList.toggle("light-theme");
      });

      // Переключаем классы темы на заголовках внутри корня
      const headers = root.querySelectorAll(".header");
      headers.forEach((header) => {
        header.classList.toggle("dark-theme");
        header.classList.toggle("light-theme");
      });

      // Переключаем классы темы на заголовках секций внутри корня
      const sectionTitles = root.querySelectorAll(".section-title");
      sectionTitles.forEach((title) => {
        title.classList.toggle("dark-theme");
        title.classList.toggle("light-theme");
      });

      // Переключаем классы темы на кодовых фрагментах внутри корня
      const codeSnippets = root.querySelectorAll(".code-snippet");
      codeSnippets.forEach((snippet) => {
        snippet.classList.toggle("dark-theme");
        snippet.classList.toggle("light-theme");
      });

      // Переключаем классы темы на примерах ответов внутри корня
      const responseExamples = root.querySelectorAll(".response-example");
      responseExamples.forEach((example) => {
        example.classList.toggle("dark-theme");
        example.classList.toggle("light-theme");
      });

      // Изменение иконки переключателя
      if (document.body.classList.contains("dark-theme")) {
        themeToggle.textContent = "☀️";
        themeToggle.setAttribute("aria-label", "Переключить на светлую тему");
      } else {
        themeToggle.textContent = "🌙";
        themeToggle.setAttribute("aria-label", "Переключить на тёмную тему");
      }
    });
  } else {
    console.error(
      "Элемент с ID 'theme-toggle' не найден внутри переданного корня."
    );
  }

  // Скрытие предложений при клике вне полей ввода (если применимо)
  if (root) {
    root.addEventListener("click", (e) => {
      // Проверяем, содержит ли кликнутый элемент контейнеры с полями ввода
      const isInsideInputContainer =
        e.target.closest(".api-method-title") ||
        e.target.closest(".description") ||
        e.target.closest(".theme-toggle"); // Предполагается, что классы или ID у элементов соответствуют

      if (!isInsideInputContainer) {
        // Закрываем все описания, если клик вне определённых элементов
        root.querySelectorAll(".api-method .description").forEach((desc) => {
          desc.classList.remove("visible");
          const titleEl = desc.previousElementSibling;
          if (titleEl) {
            titleEl.classList.remove("active");
          }
        });
      }
    });
  }
};
