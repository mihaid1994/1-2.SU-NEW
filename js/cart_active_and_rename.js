(function () {
  // Глобальный массив для хранения объектов с информацией о корзинах
  var cartControls = []; // Каждый элемент: { cartId, headerTitle, root }

  /**
   * Инициализирует функционал корзины в указанном root (document или shadowRoot)
   */
  function initCartControlsInRoot(root) {
    var headerTitles = root.querySelectorAll(".header-title");
    Array.prototype.forEach.call(headerTitles, function (headerTitle) {
      // Если уже инициализировано – пропускаем
      if (headerTitle.dataset.cartInitialized) return;
      headerTitle.dataset.cartInitialized = "true";

      // Если не задан уникальный идентификатор, генерируем его
      if (!headerTitle.dataset.cartId) {
        headerTitle.dataset.cartId =
          "cart-" + Math.random().toString(36).substr(2, 9);
      }
      var cartId = headerTitle.dataset.cartId;

      // Сохраняем объект для последующих обновлений
      cartControls.push({
        cartId: cartId,
        headerTitle: headerTitle,
        root: root,
      });
      console.log("Инициализирована корзина с ID:", cartId);

      // ===== Инициализация кнопки активации =====
      var activateBtn = headerTitle.querySelector(".cart-activate-btn");
      if (!activateBtn) {
        // Если кнопка отсутствует, создаём её и вставляем после текста заголовка
        activateBtn = document.createElement("i");
        activateBtn.classList.add(
          "ri-checkbox-multiple-blank-line",
          "cart-activate-btn"
        );
        activateBtn.style.cursor = "pointer";
        activateBtn.title = "Сделать активной корзину";
        // Вставляем сразу после первого текстового узла (если он есть)
        if (headerTitle.firstElementChild) {
          headerTitle.insertBefore(
            activateBtn,
            headerTitle.firstElementChild.nextSibling
          );
        } else {
          headerTitle.appendChild(activateBtn);
        }
      }

      // ===== Инициализация переименования =====
      // Получаем ссылки на иконки редактирования
      var pencilIcon = headerTitle.querySelector(".ri-edit-2-line");
      var saveIcon = headerTitle.querySelector(".ri-save-3-line");

      // Оборачиваем текст заголовка в span для редактирования
      var titleSpan = headerTitle.querySelector(".cart-title-text");
      if (!titleSpan) {
        titleSpan = document.createElement("span");
        titleSpan.classList.add("cart-title-text");
        // Переносим все текстовые узлы, если они есть, в созданный span
        while (
          headerTitle.firstChild &&
          headerTitle.firstChild.nodeType === Node.TEXT_NODE &&
          headerTitle.firstChild.textContent.trim() !== ""
        ) {
          titleSpan.appendChild(headerTitle.firstChild);
        }
        // Вставляем span в начало заголовка
        headerTitle.insertBefore(titleSpan, headerTitle.firstElementChild);
      }

      // При клике на карандашик включаем режим редактирования
      if (pencilIcon) {
        pencilIcon.addEventListener("click", function (e) {
          e.stopPropagation();
          console.log("Нажат карандашик для корзины", cartId);
          titleSpan.contentEditable = "true";
          titleSpan.focus();
        });
      }

      // По событию blur завершаем редактирование и отправляем новое название
      titleSpan.addEventListener("blur", function (e) {
        titleSpan.contentEditable = "false";
        var newTitle = titleSpan.textContent.trim();
        console.log("Изменено название корзины", cartId, "на", newTitle);
        // Генерируем событие изменения названия корзины (с флагами bubbles и composed)
        var titleChangeEvent = new CustomEvent("cartTitleChanged", {
          detail: { cartId: cartId, newTitle: newTitle },
          bubbles: true,
          composed: true,
        });
        window.dispatchEvent(titleChangeEvent);
        updateTabTitle(cartId, newTitle);
      });

      // Если есть иконка сохранения – завершаем редактирование по её клику
      if (saveIcon) {
        saveIcon.addEventListener("click", function (e) {
          e.stopPropagation();
          titleSpan.blur();
        });
      }

      // При клике на кнопку активации корзины генерируем событие об активации
      activateBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        console.log("Нажата кнопка активации для корзины", cartId);
        var activateEvent = new CustomEvent("cartActivated", {
          detail: { cartId: cartId },
          bubbles: true,
          composed: true,
        });
        window.dispatchEvent(activateEvent);
      });
    });
  }

  /**
   * Обновляет визуальное состояние всех элементов (иконок) в зависимости от активной корзины
   */
  function updateActivationStatus(activeCartId) {
    cartControls.forEach(function (item) {
      var cartId = item.cartId;
      var headerTitle = item.headerTitle;
      var activateBtn = headerTitle.querySelector(".cart-activate-btn");
      if (!activateBtn) return;
      if (cartId === activeCartId) {
        activateBtn.classList.remove("ri-checkbox-multiple-blank-line");
        activateBtn.classList.add("ri-checkbox-multiple-fill");
      } else {
        activateBtn.classList.remove("ri-checkbox-multiple-fill");
        activateBtn.classList.add("ri-checkbox-multiple-blank-line");
      }
    });
    updateTabsActivation(activeCartId);
  }

  /**
   * Обновляет индикатор активности во вкладках глобального таб-менеджера
   */
  function updateTabsActivation(activeCartId) {
    var tabsContainer = document.querySelector(".tabs");
    if (tabsContainer) {
      var cartTabs = tabsContainer.querySelectorAll("[data-cart-id]");
      Array.prototype.forEach.call(cartTabs, function (tab) {
        var tabCartId = tab.getAttribute("data-cart-id");
        var icon = tab.querySelector(".tab-cart-activate-icon");
        if (!icon) {
          icon = document.createElement("i");
          icon.classList.add("tab-cart-activate-icon");
          tab.appendChild(icon);
        }
        if (tabCartId === activeCartId) {
          icon.classList.remove("ri-checkbox-multiple-blank-line");
          icon.classList.add("ri-checkbox-multiple-fill");
        } else {
          icon.classList.remove("ri-checkbox-multiple-fill");
          icon.classList.add("ri-checkbox-multiple-blank-line");
        }
      });
    }
  }

  /**
   * Обновляет текст заголовка во вкладке с корзиной
   */
  function updateTabTitle(cartId, newTitle) {
    var tabsContainer = document.querySelector(".tabs");
    if (tabsContainer) {
      var cartTab = tabsContainer.querySelector(
        '[data-cart-id="' + cartId + '"]'
      );
      if (cartTab) {
        var tabTitleElem = cartTab.querySelector(".tab-title");
        if (tabTitleElem) {
          tabTitleElem.textContent = newTitle;
        }
      }
    }
  }

  // Глобальные обработчики событий
  window.addEventListener("cartActivated", function (e) {
    var activeCartId = e.detail.cartId;
    console.log("Событие cartActivated получено для", activeCartId);
    updateActivationStatus(activeCartId);
  });

  window.addEventListener("cartTitleChanged", function (e) {
    var cartId = e.detail.cartId;
    var newTitle = e.detail.newTitle;
    console.log(
      "Событие cartTitleChanged для",
      cartId,
      "новый заголовок:",
      newTitle
    );
    updateTabTitle(cartId, newTitle);
  });

  // Инициализация при загрузке документа
  document.addEventListener("DOMContentLoaded", function () {
    // Инициализируем для основного документа
    initCartControlsInRoot(document);
    console.log("Инициализация элементов в основном документе завершена.");

    // Если глобальный таб-менеджер уже создан и содержит shadowRoot, инициализируем и для них
    if (window.GComm_TabManager && window.GComm_TabManager.tabShadowRoots) {
      Object.values(window.GComm_TabManager.tabShadowRoots).forEach(function (
        shadowRoot
      ) {
        initCartControlsInRoot(shadowRoot);
        console.log("Инициализировано в shadowRoot:", shadowRoot);
      });
    }

    // Наблюдатель за изменениями в контейнере вкладок для динамического обнаружения новых элементов
    var tabContent = document.querySelector(".tab-content");
    if (tabContent) {
      var observer = new MutationObserver(function (mutationsList) {
        mutationsList.forEach(function (mutation) {
          Array.prototype.forEach.call(mutation.addedNodes, function (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Если у элемента есть shadowRoot – инициализируем в нём (с задержкой)
              if (node.shadowRoot) {
                setTimeout(function () {
                  initCartControlsInRoot(node.shadowRoot);
                }, 0);
              }
              // Если добавленный элемент содержит .header-title, инициализируем его
              if (
                node.querySelectorAll &&
                node.querySelectorAll(".header-title").length > 0
              ) {
                initCartControlsInRoot(node);
              }
            }
          });
        });
      });
      observer.observe(tabContent, { childList: true, subtree: true });
    }
  });
})();
