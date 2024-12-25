document.addEventListener("DOMContentLoaded", () => {
  const banners = document.querySelectorAll(".banner");

  // Установить первый баннер активным
  banners.forEach((banner, index) => {
    banner.style.transform =
      index === 0 ? "translateX(0px)" : "translateX(1500px)";
  });

  // Обработчики для кликабельных областей
  document.querySelectorAll(".clickable-area").forEach((area, index) => {
    area.addEventListener("click", () => {
      banners.forEach((banner, i) => {
        if (i <= index) {
          banner.style.transform = "translateX(0px)";
        } else {
          banner.style.transform = "translateX(1500px)";
        }
      });
    });
  });

  // Сделать все ссылки кликабельными и открыть в новой вкладке
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); // Предотвращает переход
      window.open(link.href, "_blank"); // Открывает ссылку в новой вкладке
      console.log(`Ссылка нажата: ${link.href}`); // Логируем URL ссылки
    });
  });
});
