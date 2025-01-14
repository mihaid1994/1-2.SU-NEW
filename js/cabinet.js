function initializeDashboard(root) {
  const tabLinks = root.querySelectorAll(
    ".tab-link, .nav-button, .summary-button"
  );

  // При клике на ссылку в боковом меню или кнопку "Перейти" —
  // показываем соответствующую вкладку и прячем остальные.
  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = link.getAttribute("data-tab");
      setActiveTab(link, tab);
    });
  });

  // Функция, которая "активирует" вкладку и скрывает все остальные
  function setActiveTab(activeLink, tabId) {
    // Убираем класс active со всех ссылок
    tabLinks.forEach((l) => l.classList.remove("active"));
    // Навешиваем класс active на текущую
    activeLink.classList.add("active");

    // Скрываем все .tab-content
    const allTabs = root.querySelectorAll(".tab-content");
    allTabs.forEach((content) => {
      content.classList.remove("show");
    });

    // Показываем нужную вкладку
    const currentTab = root.querySelector(`#${tabId}`);
    if (currentTab) {
      currentTab.classList.add("show");
      // Сохраняем выбранную вкладку в localStorage (опционально)
      localStorage.setItem("activeTab", tabId);
    }
  }

  // Логика загрузки активной вкладки из localStorage (опционально)
  const savedTab = localStorage.getItem("activeTab") || "client";
  const defaultLink = root.querySelector(`[data-tab="${savedTab}"]`);
  if (defaultLink) {
    setActiveTab(defaultLink, savedTab);
  }

  // Пример: Кнопка выхода
  const logoutBtn = root.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("Выход из системы");
      // Доп. логика выхода
    });
  }

  // Пример инициализации некоторых кнопок, модалок и т.д.
  // --- Здесь можно разместить логику открытия/закрытия модальных окон и прочее ---

  // Закрытие модалок по клику на .close
  const modals = root.querySelectorAll(".modal");
  modals.forEach((modal) => {
    const closeBtn = modal.querySelector(".close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  });
}
