/**
 * Глобальная функция, которая создаёт «информационную панель» в заданном root
 * (document или shadowRoot). Подтягивает данные из /data/info.json
 * и динамически генерирует плашки (баннеры).
 */
window.initBanners = function (root = document) {
  const infoPanel = root.querySelector("#infoPanel");
  if (!infoPanel) {
    console.warn("Не найден контейнер #infoPanel в переданном root!");
    return;
  }

  fetch("/data/info.json")
    .then((res) => res.json())
    .then((data) => {
      const banners = data.banners || [];
      // Создаём плашки на основе массива banners
      banners.forEach((bannerData, index) => {
        const bannerDiv = document.createElement("div");
        bannerDiv.classList.add("dynamic-banner");

        // "Лесенка" (каждый следующий баннер сдвинут чуть вправо)
        // 60px = 3.75rem. Можно менять как нужно.
        bannerDiv.style.left = `${60 * index}px`;
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
            // Для отступа делаем класс .indented (как в исходном примере)
            p.classList.add("indented");
            p.innerHTML = paragraph;
            textBlock.appendChild(p);
          });
        }

        // listItems
        if (
          Array.isArray(bannerData.listItems) &&
          bannerData.listItems.length
        ) {
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

        // Вставляем в #infoPanel
        infoPanel.appendChild(bannerDiv);
      });

      // После генерации баннеров включаем логику перелистывания
      setupBannerClickLogic(root);
    })
    .catch((error) => {
      console.error("Ошибка при загрузке /data/info.json:", error);
    });
};

/**
 * Настраивает перелистывание плашек:
 * - При клике на вертикальную надпись «выдвигает» текущий баннер и все предыдущие
 * - Остальные «уезжают» вправо
 */
function setupBannerClickLogic(root) {
  const banners = root.querySelectorAll(".dynamic-banner");

  // Изначально показываем только первый баннер, остальные сдвигаем
  banners.forEach((bnr, i) => {
    if (i === 0) {
      bnr.style.transform = "translateX(0rem)";
    } else {
      // ~1070px → 66.875rem
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
