/**
 * Глобальная функция, которая создаёт «информационную панель» в заданном root
 * (document или shadowRoot). Подтягивает данные из /data/info.json
 * и динамически генерирует плашки (баннеры).
 */
window.initBanners = function (root = document) {
  const container = root.querySelector("#infoPanelContainer");
  if (!container) {
    console.warn("Не найден контейнер #infoPanelContainer!");
    return;
  }
  const infoPanel = container.querySelector("#infoPanel");
  if (!infoPanel) {
    console.warn("Не найден контейнер #infoPanel!");
    return;
  }

  // Зададим container позицию relative,
  // чтобы размещать в нём шильдик (ярлык) по absolute-координатам.
  container.style.position = "relative";

  // 1) Загружаем данные и генерируем баннеры
  fetch("/data/info.json")
    .then((res) => res.json())
    .then((data) => {
      const banners = data.banners || [];
      banners.forEach((bannerData, index) => {
        const bannerDiv = document.createElement("div");
        bannerDiv.classList.add("dynamic-banner");

        // "Лесенка" (каждый следующий баннер сдвинут чуть вправо)
        bannerDiv.style.left = `${60 * index}px`; // 60px = 3.75rem
        bannerDiv.style.zIndex = index + 1;

        // Картинка
        const img = document.createElement("img");
        img.src = bannerData.imageUrl || "";

        // Кликабельная зона (вертикальный текст)
        const clickable = document.createElement("div");
        clickable.classList.add("banner-clickable");

        const vt = document.createElement("span");
        vt.classList.add("vertical-title");
        vt.textContent = bannerData.verticalTitle || "";
        clickable.appendChild(vt);

        // Текстовый блок
        const textBlock = document.createElement("div");
        textBlock.classList.add("banner-text");

        // paragraphs
        if (Array.isArray(bannerData.paragraphs)) {
          bannerData.paragraphs.forEach((paragraph) => {
            const p = document.createElement("p");
            p.classList.add("indented");
            p.innerHTML = paragraph;
            textBlock.appendChild(p);
          });
        }

        // listItems
        if (Array.isArray(bannerData.listItems)) {
          const ul = document.createElement("ul");
          bannerData.listItems.forEach((liText) => {
            const li = document.createElement("li");
            li.innerHTML = liText;
            ul.appendChild(li);
          });
          textBlock.appendChild(ul);
        }

        // closingParagraph
        if (bannerData.closingParagraph) {
          const cp = document.createElement("p");
          cp.innerHTML = bannerData.closingParagraph;
          textBlock.appendChild(cp);
        }

        // Добавляем всё внутрь .dynamic-banner
        bannerDiv.appendChild(clickable);
        bannerDiv.appendChild(img);
        bannerDiv.appendChild(textBlock);

        // Вставляем баннер в #infoPanel
        infoPanel.appendChild(bannerDiv);
      });

      // 2) Логика «перелистывания» баннеров
      setupBannerClickLogic(infoPanel);

      // 3) Логика «сворачивания/разворачивания» всей панели
      setupCollapseToggle(container, infoPanel);
    })
    .catch((error) => {
      console.error("Ошибка при загрузке /data/info.json:", error);
    });
};

/**
 * Настраивает перелистывание баннеров:
 * - При клике на вертикальную надпись «выдвигает» текущий баннер и все предыдущие
 * - Остальные «уезжают» вправо
 */
function setupBannerClickLogic(infoPanel) {
  const banners = infoPanel.querySelectorAll(".dynamic-banner");

  // Изначально показываем только первый баннер, остальные сдвигаем
  banners.forEach((bnr, i) => {
    if (i === 0) {
      bnr.style.transform = "translateX(0rem)";
    } else {
      // ~1070px ≈ 66.875rem
      bnr.style.transform = "translateX(66.875rem)";
    }
  });

  // При клике — показываем все до текущего включительно
  banners.forEach((bnr, i) => {
    const clickable = bnr.querySelector(".banner-clickable");
    if (clickable) {
      clickable.addEventListener("click", () => {
        activateBannerIndex(banners, i);
      });
    }
  });
}

function activateBannerIndex(banners, index) {
  banners.forEach((bnr, i) => {
    if (i <= index) {
      bnr.style.transform = "translateX(0rem)";
    } else {
      bnr.style.transform = "translateX(66.875rem)";
    }
  });
}

/**
 * Добавляет отдельный «шильдик» (ярлык) к контейнеру #infoPanelContainer,
 * который торчит за пределы справа-снизу. При клике панель (#infoPanel)
 * сворачивается (становится высотой 0), шильдик меняет текст на «О нас ▼»
 * и остаётся видимым. При повторном клике панель разворачивается.
 *
 * После полного сворачивания (transitionend, высота 0), слева выезжает
 * мини-подсказка: «Оставлять свернутым?  Да | ×».
 * Оба клика ("Да" / "×") закрывают подсказку, не влияя ни на что ещё.
 */
function setupCollapseToggle(container, infoPanel) {
  // Делаем саму панель (#infoPanel) анимированной по высоте
  infoPanel.style.overflow = "hidden";
  infoPanel.style.transition = "height 0.25s ease-in-out";

  // Изначально панель развернута
  let isCollapsed = false;

  // Создаём «шильдик»
  const toggleButton = document.createElement("div");
  toggleButton.classList.add("panel-toggle-button");

  // Стили, чтобы он «выглядывал» из правого нижнего угла
  toggleButton.style.position = "absolute";
  toggleButton.style.bottom = "-2rem";
  toggleButton.style.right = "1rem";
  toggleButton.style.cursor = "pointer";
  toggleButton.style.userSelect = "none";
  toggleButton.style.whiteSpace = "nowrap";
  toggleButton.style.zIndex = "2"; // Чуть выше панели, но меньше, чем окна подсказок
  toggleButton.style.padding = "0.5rem 1rem";

  // Цвета и небольшая стилизация
  toggleButton.style.color = "#383939";
  toggleButton.style.backgroundColor = "#ffc610";
  toggleButton.style.borderRadius = "4px";
  toggleButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.15)";

  // Текст в развернутом состоянии
  toggleButton.textContent = "Свернуть ▲";

  // Добавляем «шильдик» в контейнер (не в infoPanel!)
  container.appendChild(toggleButton);

  // Ждём полной загрузки страницы (включая картинки):
  window.addEventListener("load", () => {
    // Когда всё загружено, задаём исходную (полную) высоту панели
    infoPanel.style.height = infoPanel.scrollHeight + "px";
  });

  // --- Создадим "подсказку" (prompt), которая выезжает при полном сворачивании
  const promptDiv = document.createElement("div");
  promptDiv.style.position = "absolute";
  promptDiv.style.bottom = "-2rem";
  promptDiv.style.right = "1rem";
  promptDiv.style.zIndex = "1"; // Чтобы "залезала" под жёлтый ярлык
  promptDiv.style.backgroundColor = "#f0f0f0";
  promptDiv.style.color = "#333";
  promptDiv.style.borderRadius = "4px";
  promptDiv.style.padding = "0.5rem 1rem";
  promptDiv.style.whiteSpace = "nowrap";
  promptDiv.style.fontSize = "0.9rem";
  promptDiv.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";

  // Для анимации "выезда" слева направо используем transform
  promptDiv.style.transition = "transform 0.25s ease-in-out";
  promptDiv.style.transform = "translateX(200%)"; // изначально спрятано за «ярлыком»

  // Текст «Оставлять свернутым?»
  const promptText = document.createElement("span");
  promptText.textContent = "Оставлять свернутым? ";
  promptDiv.appendChild(promptText);

  // Кнопка «Да»
  const yesBtn = document.createElement("span");
  yesBtn.textContent = "   ✔";
  yesBtn.style.cursor = "pointer";
  yesBtn.style.marginRight = "0.5rem";
  promptDiv.appendChild(yesBtn);

  // Кнопка «×»
  const closeBtn = document.createElement("span");
  closeBtn.textContent = "✖";
  closeBtn.style.cursor = "pointer";
  promptDiv.appendChild(closeBtn);

  // Добавим подсказку (пока скрыта)
  container.appendChild(promptDiv);

  // Функция показать / спрятать подсказку
  function showPrompt() {
    promptDiv.style.transform = "translateX(-50%)"; // выехала влево
  }
  function hidePrompt() {
    promptDiv.style.transform = "translateX(200%)"; // уехала обратно вправо
  }

  // При клике на «Да» или «×» – просто спрятать
  yesBtn.addEventListener("click", hidePrompt);
  closeBtn.addEventListener("click", hidePrompt);

  // Когда завершился transition (height) у infoPanel – проверяем, не стал ли он 0
  infoPanel.addEventListener("transitionend", (e) => {
    // Убедимся, что анимация именно "height"
    if (e.propertyName === "height") {
      if (isCollapsed && parseInt(infoPanel.style.height) === 0) {
        // Панель полностью свернулась — показываем подсказку
        showPrompt();
      } else {
        // Либо панель не свернута, либо что-то другое
        hidePrompt();
      }
    }
  });

  // Логика сворачивания/разворачивания панели при клике на жёлтый ярлык
  toggleButton.addEventListener("click", () => {
    if (!isCollapsed) {
      // Сворачиваем панель
      const currentHeight = infoPanel.scrollHeight + "px";
      infoPanel.style.height = currentHeight; // фиксируем высоту
      requestAnimationFrame(() => {
        infoPanel.style.height = "0px";
      });

      toggleButton.textContent = "О нас ▼";
      isCollapsed = true;
    } else {
      // Разворачиваем панель
      // Прячем подсказку, если она вдруг была видна
      hidePrompt();

      infoPanel.style.height = "0px";
      requestAnimationFrame(() => {
        infoPanel.style.height = infoPanel.scrollHeight + "px";
      });

      toggleButton.textContent = "Свернуть ▲";
      isCollapsed = false;
    }
  });
}
