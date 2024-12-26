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
});
