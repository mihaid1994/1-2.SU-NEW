document.addEventListener("DOMContentLoaded", () => {
  const methodTitles = document.querySelectorAll(".api-method-title");
  const themeToggle = document.getElementById("theme-toggle");

  // Функция для переключения видимости описания методов API
  methodTitles.forEach((title) => {
    title.addEventListener("click", () => {
      const description = title.nextElementSibling;
      const isVisible = description.classList.contains("visible");

      // Закрыть все описания
      document.querySelectorAll(".api-method .description").forEach((desc) => {
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

  const elementsToAnimate = document.querySelectorAll(
    ".section-title, .api-method, .code-snippet, .response-example"
  );

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elementsToAnimate.forEach((element) => {
    observer.observe(element);
  });

  // Функция для переключения темы
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");

    const containers = document.querySelectorAll(".container");
    containers.forEach((container) => {
      container.classList.toggle("dark-theme");
      container.classList.toggle("light-theme");
    });

    const headers = document.querySelectorAll(".header");
    headers.forEach((header) => {
      header.classList.toggle("dark-theme");
      header.classList.toggle("light-theme");
    });

    const sectionTitles = document.querySelectorAll(".section-title");
    sectionTitles.forEach((title) => {
      title.classList.toggle("dark-theme");
      title.classList.toggle("light-theme");
    });

    const codeSnippets = document.querySelectorAll(".code-snippet");
    codeSnippets.forEach((snippet) => {
      snippet.classList.toggle("dark-theme");
      snippet.classList.toggle("light-theme");
    });

    const responseExamples = document.querySelectorAll(".response-example");
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
});
