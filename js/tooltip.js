// --- Завёрнутый Скрипт: initTooltips (примерно так же) ---
window.initTooltips = function (root = document) {
  let tooltipsEnabled = false;

  // Добавляем кнопку «Включить подсказки» рядом с .filter-header
  const filterHeader = root.querySelector(".filter-header");
  if (filterHeader) {
    const tooltipToggleButton = root.createElement
      ? root.createElement("button")
      : document.createElement("button");
    tooltipToggleButton.textContent = "Включить подсказки";
    tooltipToggleButton.id = "toggle-tooltips";
    tooltipToggleButton.setAttribute("aria-pressed", "false");
    tooltipToggleButton.setAttribute("data-tooltip", "Включить подсказки");

    // Примеры инлайн-стилей (можно вынести в CSS)
    Object.assign(tooltipToggleButton.style, {
      fontSize: "12px",
      padding: "6px 12px",
      marginLeft: "30px",
      background: "#eee",
      border: "1px solid #ccc",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "background 0.3s, color 0.3s",
    });

    tooltipToggleButton.addEventListener("mouseover", () => {
      tooltipToggleButton.style.background = "#ddd";
    });

    tooltipToggleButton.addEventListener("mouseout", () => {
      tooltipToggleButton.style.background = tooltipsEnabled
        ? "#FFA500"
        : "#eee";
      tooltipToggleButton.style.color = tooltipsEnabled ? "#fff" : "#000";
    });

    tooltipToggleButton.addEventListener("click", () => {
      tooltipsEnabled = !tooltipsEnabled;
      tooltipToggleButton.textContent = tooltipsEnabled
        ? "Отключить подсказки"
        : "Включить подсказки";
      tooltipToggleButton.setAttribute(
        "aria-pressed",
        tooltipsEnabled.toString()
      );
      tooltipToggleButton.setAttribute(
        "data-tooltip",
        tooltipsEnabled ? "Отключить подсказки" : "Включить подсказки"
      );
      tooltipToggleButton.style.background = tooltipsEnabled
        ? "#FFA500"
        : "#eee";
      tooltipToggleButton.style.color = tooltipsEnabled ? "#fff" : "#000";
    });

    filterHeader.appendChild(tooltipToggleButton);
  }

  // Локальные функции для отображения/скрытия подсказки
  function showTooltip(element) {
    if (!tooltipsEnabled) return;
    const tooltipText = element.getAttribute("data-tooltip");
    if (!tooltipText) return;

    const tooltip = document.createElement("div");
    tooltip.textContent = tooltipText;

    // Стили для подсказки
    Object.assign(tooltip.style, {
      position: "absolute",
      background: "rgba(37, 78, 88, 0.9)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "6px",
      fontSize: "14px",
      whiteSpace: "nowrap",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: "1000",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 0.3s, transform 0.3s",
      transform: "translateY(10px)",
      top: "0",
      left: "0",
    });

    document.body.appendChild(tooltip); // Если нужно строго в root, замените на root

    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 10;

    let top = rect.top - tooltipRect.height - padding + scrollY;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2 + scrollX;

    // Если подсказка не влезает сверху — показываем снизу
    if (top < scrollY + padding) {
      top = rect.bottom + padding + scrollY;
      tooltip.style.transform = "translateY(-10px)";
    }

    // Если не влезает слева/справа — корректируем
    if (left < scrollX + padding) {
      left = scrollX + padding;
    }
    if (left + tooltipRect.width > window.innerWidth + scrollX) {
      left = window.innerWidth - tooltipRect.width - padding + scrollX;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Анимация появления
    setTimeout(() => {
      tooltip.style.opacity = "1";
      tooltip.style.transform = "translateY(0)";
    }, 0);

    element._tooltip = tooltip;
  }

  function hideTooltip(element) {
    if (!element._tooltip) return;
    const tooltip = element._tooltip;
    tooltip.style.opacity = "0";
    // Сдвигаем подсказку обратно (вниз или вверх)
    tooltip.style.transform = tooltip.style.top.includes("-")
      ? "translateY(10px)"
      : "translateY(-10px)";

    setTimeout(() => {
      tooltip.remove();
    }, 300);

    delete element._tooltip;
  }

  // Делегирование событий внутри root (или document.body, если хотим глобально)
  root.addEventListener("mouseover", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target) {
      showTooltip(target);
    }
  });
  root.addEventListener("mouseout", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target) {
      hideTooltip(target);
    }
  });
};
