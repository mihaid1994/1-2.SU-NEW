// mobile-banner.js

/**
 * Глобальная функция, которая создаёт «информационную панель» в заданном root.
 * Загружает данные из /data/info.json и динамически генерирует баннеры.
 * Если ширина экрана ≥801px используется десктопная логика (без изменений),
 * иначе – мобильная логика с таб‑баром, при которой по умолчанию раскрытый оверлей скрыт,
 * а вкладки всегда видны. При нажатии на вкладку открывается оверлей (mobile-expanded-panel)
 * с контентом, занимающим почти весь экран (с отступом 30px от низа) и с крестиком для закрытия.
 */
window.initBanners = function (root = document) {
  const container = root.querySelector("#infoPanelContainer");
  if (!container) {
    console.warn("Не найден контейнер #infoPanelContainer!");
    return;
  }
  // Получаем infoPanel (для десктопной логики); в мобильной версии он скрыт
  const infoPanel = container.querySelector("#infoPanel");
  container.style.position = "relative";

  fetch("/data/info.json")
    .then((res) => res.json())
    .then((data) => {
      const banners = data.banners || [];
      if (window.matchMedia("(min-width: 801px)").matches) {
        // DESKTOP LOGIC – старая логика
        banners.forEach((bannerData, index) => {
          const bannerDiv = document.createElement("div");
          bannerDiv.classList.add("dynamic-banner");
          bannerDiv.style.left = `${60 * index}px`;
          bannerDiv.style.zIndex = index + 3;

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
          if (Array.isArray(bannerData.paragraphs)) {
            bannerData.paragraphs.forEach((paragraph) => {
              const p = document.createElement("p");
              p.classList.add("indented");
              p.innerHTML = paragraph;
              textBlock.appendChild(p);
            });
          }
          if (Array.isArray(bannerData.listItems)) {
            const ul = document.createElement("ul");
            bannerData.listItems.forEach((liText) => {
              const li = document.createElement("li");
              li.innerHTML = liText;
              ul.appendChild(li);
            });
            textBlock.appendChild(ul);
          }
          if (bannerData.closingParagraph) {
            const cp = document.createElement("p");
            cp.innerHTML = bannerData.closingParagraph;
            textBlock.appendChild(cp);
          }

          bannerDiv.appendChild(clickable);
          bannerDiv.appendChild(img);
          bannerDiv.appendChild(textBlock);

          infoPanel.appendChild(bannerDiv);
        });
        setupBannerClickLogic(infoPanel);
        setupCollapseToggle(container, infoPanel);
      } else {
        // MOBILE LOGIC – новая логика для мобильных устройств
        // Очищаем infoPanel (он скрыт через CSS) и не используем десктопную структуру
        // Создаем таб-бар, который всегда виден (вставляем в начало контейнера)
        const tabBar = document.createElement("div");
        tabBar.classList.add("mobile-tab-bar");
        banners.forEach((banner, index) => {
          const btn = document.createElement("button");
          let titleText = "Баннер " + (index + 1);
          if (banner.verticalTitle) {
            titleText = banner.verticalTitle;
          }
          btn.innerHTML = titleText;
          btn.addEventListener("click", () => {
            openMobilePanel(banner);
            Array.from(tabBar.children).forEach((child, idx) => {
              child.classList.toggle("active", idx === index);
            });
          });
          tabBar.appendChild(btn);
        });
        container.insertBefore(tabBar, infoPanel);

        // Создаем оверлей раскрывающегося меню
        const mobilePanel = document.createElement("div");
        mobilePanel.classList.add("mobile-expanded-panel");
        container.appendChild(mobilePanel);

        // Функция открытия мобильного меню для выбранного баннера
        function openMobilePanel(banner) {
          mobilePanel.innerHTML = "";
          // Добавляем кнопку закрытия (крестик)
          const closeBtn = document.createElement("span");
          closeBtn.classList.add("close-btn");
          closeBtn.innerHTML = "&times;";
          closeBtn.addEventListener("click", () => {
            closeMobilePanel();
          });
          mobilePanel.appendChild(closeBtn);
          // Создаем контейнер с контентом баннера (поддержка сложного HTML)
          const content = document.createElement("div");
          content.classList.add("banner-content");
          if (banner.verticalTitle) {
            const title = document.createElement("div");
            title.classList.add("banner-title");
            title.innerHTML = banner.verticalTitle;
            content.appendChild(title);
          }
          if (Array.isArray(banner.paragraphs)) {
            banner.paragraphs.forEach((paragraph) => {
              const p = document.createElement("p");
              p.innerHTML = paragraph;
              content.appendChild(p);
            });
          }
          if (Array.isArray(banner.listItems)) {
            const ul = document.createElement("ul");
            banner.listItems.forEach((liText) => {
              const li = document.createElement("li");
              li.innerHTML = liText;
              ul.appendChild(li);
            });
            content.appendChild(ul);
          }
          if (banner.closingParagraph) {
            const cp = document.createElement("p");
            cp.innerHTML = banner.closingParagraph;
            content.appendChild(cp);
          }
          mobilePanel.appendChild(content);
          // Открываем оверлей – добавляем класс expanded (через CSS он переводится в transform: translateY(0))
          mobilePanel.classList.add("expanded");
        }

        // Функция закрытия мобильного меню
        function closeMobilePanel() {
          mobilePanel.classList.remove("expanded");
        }
      }
    })
    .catch((error) => {
      console.error("Ошибка при загрузке /data/info.json:", error);
    });
};

// Десктопная логика (без изменений)
function setupBannerClickLogic(infoPanel) {
  const banners = infoPanel.querySelectorAll(".dynamic-banner");
  banners.forEach((bnr, i) => {
    if (i === 0) {
      bnr.style.transform = "translateX(0rem)";
    } else {
      bnr.style.transform = "translateX(66.875rem)";
    }
  });
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
 * Функция сворачивания/разворачивания панели для десктопа.
 * В мобильной версии используется новая логика (оверлей с таб‑баром).
 */
function setupCollapseToggle(container, infoPanel) {
  infoPanel.style.overflow = "hidden";
  infoPanel.style.transition = "height 0.25s ease-in-out";
  let isCollapsed = false;
  const toggleButton = document.createElement("div");
  toggleButton.classList.add("panel-toggle-button");
  toggleButton.style.position = "absolute";
  toggleButton.style.bottom = "-2rem";
  toggleButton.style.right = "1rem";
  toggleButton.style.cursor = "pointer";
  toggleButton.style.userSelect = "none";
  toggleButton.style.whiteSpace = "nowrap";
  toggleButton.style.zIndex = "2";
  toggleButton.style.padding = "0.5rem 1rem";
  toggleButton.style.color = "#383939";
  toggleButton.style.backgroundColor = "#ffc610";
  toggleButton.style.borderRadius = "4px";
  toggleButton.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";
  toggleButton.textContent = "Свернуть ▲";
  container.appendChild(toggleButton);

  window.addEventListener("load", () => {
    infoPanel.style.height = infoPanel.scrollHeight + "px";
  });

  const promptDiv = document.createElement("div");
  promptDiv.style.position = "absolute";
  promptDiv.style.bottom = "-2rem";
  promptDiv.style.right = "1rem";
  promptDiv.style.zIndex = "1";
  promptDiv.style.backgroundColor = "#f0f0f0";
  promptDiv.style.color = "#333";
  promptDiv.style.borderRadius = "4px";
  promptDiv.style.padding = "0.5rem 1rem";
  promptDiv.style.whiteSpace = "nowrap";
  promptDiv.style.fontSize = "0.9rem";
  promptDiv.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";
  promptDiv.style.transition = "transform 0.25s ease-in-out";
  promptDiv.style.transform = "translateX(200%)";

  const promptText = document.createElement("span");
  promptText.textContent = "Оставлять свернутым? ";
  promptDiv.appendChild(promptText);

  const yesBtn = document.createElement("span");
  yesBtn.textContent = "   ✔";
  yesBtn.style.cursor = "pointer";
  yesBtn.style.marginRight = "0.5rem";
  promptDiv.appendChild(yesBtn);

  const closeBtn = document.createElement("span");
  closeBtn.textContent = "✖";
  closeBtn.style.cursor = "pointer";
  promptDiv.appendChild(closeBtn);

  container.appendChild(promptDiv);

  function showPrompt() {
    promptDiv.style.transform = "translateX(-50%)";
  }
  function hidePrompt() {
    promptDiv.style.transform = "translateX(200%)";
  }

  yesBtn.addEventListener("click", hidePrompt);
  closeBtn.addEventListener("click", hidePrompt);

  infoPanel.addEventListener("transitionend", (e) => {
    if (e.propertyName === "height") {
      if (isCollapsed && parseInt(infoPanel.style.height) === 0) {
        showPrompt();
      } else {
        hidePrompt();
      }
    }
  });

  toggleButton.addEventListener("click", () => {
    if (!isCollapsed) {
      const currentHeight = infoPanel.scrollHeight + "px";
      infoPanel.style.height = currentHeight;
      requestAnimationFrame(() => {
        infoPanel.style.height = "0px";
      });
      toggleButton.textContent = "О нас ▼";
      isCollapsed = true;
    } else {
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

// Если требуется инициализировать при загрузке DOM, внешние скрипты могут вызывать initBanners(root).
// document.addEventListener("DOMContentLoaded", function () {
//   initBanners();
// });
