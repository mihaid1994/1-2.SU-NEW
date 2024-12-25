let lastMouseX = 0;
let lastMouseY = 0;

document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.querySelector(".tabs");
  if (!tabsContainer) {
    console.error("Контейнер вкладок не найден.");
    return;
  }

  let draggedTab = null;
  let placeholder = null;
  let isDragging = false;

  let currentHoveredTab = null;
  let ctrlPressed = false;
  let altPressed = false;
  let dragStartTimeout = null;

  let startX, startY;

  const DRAG_THRESHOLD = 5;

  function createPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.classList.add("tab-placeholder");
    placeholder.style.width = "100px";
    placeholder.style.height = "100%";
    placeholder.style.border = "2px dashed #ccc";
    placeholder.style.margin = "0 5px";
    placeholder.style.boxSizing = "border-box";
    return placeholder;
  }

  function isDraggableTab(element) {
    return (
      element &&
      element.classList.contains("tab") &&
      element.id !== "create-cart-button"
    );
  }

  function startDragTimer() {
    if (dragStartTimeout || isDragging) return;

    dragStartTimeout = setTimeout(() => {
      if (ctrlPressed && isDraggableTab(currentHoveredTab)) {
        startDragging(currentHoveredTab);
      } else {
        cancelDragTimer();
      }
    }, 1000);
  }

  function cancelDragTimer() {
    if (dragStartTimeout) {
      clearTimeout(dragStartTimeout);
      dragStartTimeout = null;
    }
  }

  function startDragging(tab) {
    draggedTab = tab;
    isDragging = true;
    dragStartTimeout = null;

    const titleElement = draggedTab.querySelector(".tab-title");
    if (titleElement) {
      titleElement.setAttribute("contenteditable", "false");
    }

    placeholder = createPlaceholder();
    tabsContainer.insertBefore(placeholder, draggedTab.nextSibling);

    draggedTab.classList.add("dragging");
    draggedTab.style.position = "absolute";
    draggedTab.style.zIndex = "1000";
    draggedTab.style.pointerEvents = "none";
    document.body.appendChild(draggedTab);

    const tabRect = draggedTab.getBoundingClientRect();
    startX = tabRect.width / 2;
    startY = tabRect.height / 2;

    // Добавляем эту строку, чтобы вкладка сразу появилась под курсором
    moveAt(lastMouseX, lastMouseY);
  }

  function drag(e) {
    if (!isDragging || !draggedTab) return;
    moveAt(e.pageX, e.pageY);

    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    const tabBelow = elemBelow ? elemBelow.closest(".tab") : null;

    if (tabBelow && tabBelow !== draggedTab && tabBelow !== placeholder) {
      const rect = tabBelow.getBoundingClientRect();
      const middleX = rect.left + rect.width / 2;
      if (e.clientX < middleX) {
        tabsContainer.insertBefore(placeholder, tabBelow);
      } else {
        tabsContainer.insertBefore(placeholder, tabBelow.nextSibling);
      }
    }
  }

  function moveAt(pageX, pageY) {
    draggedTab.style.left = pageX - startX + "px";
    draggedTab.style.top = pageY - startY + "px";
  }

  function finishDragging() {
    if (!isDragging || !draggedTab) return;

    tabsContainer.insertBefore(draggedTab, placeholder);
    draggedTab.style.position = "";
    draggedTab.style.left = "";
    draggedTab.style.top = "";
    draggedTab.style.zIndex = "";
    draggedTab.style.pointerEvents = "";
    draggedTab.classList.remove("dragging");

    const isActive = draggedTab.classList.contains("active");
    if (
      isActive &&
      draggedTab.dataset.name &&
      draggedTab.dataset.name.startsWith("Корзина")
    ) {
      const titleElement = draggedTab.querySelector(".tab-title");
      if (titleElement) {
        titleElement.setAttribute("contenteditable", "true");
      }
    }

    if (placeholder) {
      placeholder.remove();
      placeholder = null;
    }

    isDragging = false;
    draggedTab = null;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Control") {
      ctrlPressed = true;
    }
    if (e.key === "Alt") {
      altPressed = true;
    }

    // Запускаем таймер перетаскивания только если обе клавиши нажаты
    if (ctrlPressed && altPressed && isDraggableTab(currentHoveredTab)) {
      startDragTimer();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Control") {
      ctrlPressed = false;
    }
    if (e.key === "Alt") {
      altPressed = false;
    }

    // Останавливаем таймер и завершаем перетаскивание, если хотя бы одна клавиша отпущена
    if (!ctrlPressed || !altPressed) {
      cancelDragTimer();
      if (isDragging) {
        finishDragging();
      }
    }
  });

  document.addEventListener("mousemove", (e) => {
    lastMouseX = e.pageX;
    lastMouseY = e.pageY;

    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    const hoveredTab = elemBelow ? elemBelow.closest(".tab") : null;
    currentHoveredTab =
      hoveredTab && isDraggableTab(hoveredTab) ? hoveredTab : null;

    // Перетаскивание только если нажаты обе клавиши: Ctrl и Alt
    if (isDragging && ctrlPressed && altPressed) {
      drag(e);
    } else {
      if (ctrlPressed && altPressed && !isDragging) {
        if (currentHoveredTab) {
          if (!dragStartTimeout) startDragTimer();
        } else {
          cancelDragTimer();
        }
      }
    }
  });

  const style = document.createElement("style");
  style.textContent = `
    .tab.dragging {
      opacity: 0.8;
      cursor: grabbing;
      user-select: none;
    }

    .tab-placeholder {
      display: inline-block;
      background: transparent;
    }

    .tabs {
      position: relative;
    }

    .tabs.dragging, .tab.dragging * {
      user-select: none;
    }
  `;
  document.head.appendChild(style);
});
