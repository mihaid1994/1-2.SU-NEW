// Скрипт для имитации набора текста в плейсхолдере
const placeholderTexts = [
  "Лампа светодиодная Ваше Сиятельство E27...",
  "Батарейка Тест на правду AAA...",
  "Мебель для кухни...",
  "Набор инструментов для ремонта...",
  "Умный дом...",
  "Офисное кресло с подставкой для ног...",
];

const inputElement = document.querySelector(".search-input");
let currentIndex = 0;
let currentText = "";
let charIndex = 0;
let showDefaultText = true;

function typePlaceholder() {
  if (!inputElement) return;

  // Если весь текст напечатан
  if (charIndex === currentText.length) {
    if (showDefaultText) {
      currentText = placeholderTexts[currentIndex];
      showDefaultText = false;
      charIndex = 0;
      setTimeout(typePlaceholder, 3000); //
    } else {
      currentIndex = (currentIndex + 1) % placeholderTexts.length;
      currentText = "Поиск товаров...";
      showDefaultText = true;
      charIndex = 0;
      setTimeout(typePlaceholder, 5000);
    }
    return;
  }

  // Напечатать следующую букву
  inputElement.setAttribute("placeholder", currentText.slice(0, charIndex + 1));
  charIndex++;

  // Ускоряем скорость набора для "Поиск товаров..."
  const typingSpeed = showDefaultText
    ? Math.random() * (30 - 15) + 40 // Быстрее для "Поиск товаров..."
    : Math.random() * (100 - 50) + 50; // Стандартная скорость для других текстов
  setTimeout(typePlaceholder, typingSpeed);
}

// Запускаем процесс после загрузки страницы
window.addEventListener("DOMContentLoaded", () => {
  currentText = "Поиск товаров..."; // Первым появляется текст "Поиск товаров..."
  typePlaceholder();
});
