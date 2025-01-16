// contacts.js
window.initContactsopenFunction = function (root = document) {
  const toggles = root.querySelectorAll(".city .toggle");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const parentCity = toggle.parentElement;

      // Переключение класса 'active' для текущего города
      parentCity.classList.toggle("active");
    });
  });
};
