// Определяем глобальную функцию для инициализации баннеров
window.initBanners = function (root = document) {
  // Получаем каждый баннер индивидуально
  const banner1 = root.querySelector(".banner1");
  const banner2 = root.querySelector(".banner2");
  const banner3 = root.querySelector(".banner3");
  const banner4 = root.querySelector(".banner4");
  const banner5 = root.querySelector(".banner5");

  // --- ИНИЦИАЛИЗАЦИЯ ---
  // Баннер 1 (самый нижний) остаётся без сдвига
  banner1.style.transform = "translateX(0px)";
  // Баннеры 2..5 изначально сдвигаются вправо
  banner2.style.transform = "translateX(1070px)";
  banner3.style.transform = "translateX(1070px)";
  banner4.style.transform = "translateX(1070px)";
  banner5.style.transform = "translateX(1070px)";

  // --- ЛОГИКА КЛИКОВ ---
  // Функция-утилита: активировать баннер N => все <= N без сдвига, остальные вправо
  function activateBanner(N) {
    if (N >= 1) {
      banner1.style.transform = "translateX(0px)";
    }
    if (N >= 2) {
      banner2.style.transform = "translateX(0px)";
    } else {
      banner2.style.transform = "translateX(1070px)";
    }
    if (N >= 3) {
      banner3.style.transform = "translateX(0px)";
    } else {
      banner3.style.transform = "translateX(1070px)";
    }
    if (N >= 4) {
      banner4.style.transform = "translateX(0px)";
    } else {
      banner4.style.transform = "translateX(1070px)";
    }
    if (N >= 5) {
      banner5.style.transform = "translateX(0px)";
    } else {
      banner5.style.transform = "translateX(1070px)";
    }
  }

  // Кликабельные области
  const area1 = banner1.querySelector(".clickable-area");
  const area2 = banner2.querySelector(".clickable-area");
  const area3 = banner3.querySelector(".clickable-area");
  const area4 = banner4.querySelector(".clickable-area");
  const area5 = banner5.querySelector(".clickable-area");

  // Клик по баннер1 => активен баннер1, выше (2..5) вправо
  area1.addEventListener("click", () => activateBanner(1));
  // Клик по баннер2 => активны баннеры 1..2, выше (3..5) вправо
  area2.addEventListener("click", () => activateBanner(2));
  // Клик по баннер3 => активны 1..3, выше 4..5 вправо
  area3.addEventListener("click", () => activateBanner(3));
  // Клик по баннер4 => активны 1..4, выше баннер5 вправо
  area4.addEventListener("click", () => activateBanner(4));
  // Клик по баннер5 => активны 1..5 (все на месте)
  area5.addEventListener("click", () => activateBanner(5));
};
