// chat.js - Финальная версия с оптимизацией для мобильных устройств

/**
 * Инициализация чата.
 * @param {HTMLElement} container - Контейнер, внутри которого расположен чат (например, ShadowRoot).
 */
function initChat(container) {
  // Получаем необходимые элементы из контейнера
  const chatMessages = container.querySelector("#chatMessages");
  const chatInput = container.querySelector("#chatInput");
  const chatTopics = container.querySelectorAll(".chat-topic");
  const chatList = container.querySelector("#chatList");
  const quickQuestionsContainer = container.querySelector("#quickQuestions");
  const chatContainer = container.querySelector(".chat-container");
  const chatSidebar = container.querySelector(".chat-sidebar");
  const chatContent = container.querySelector(".chat-content");
  const chatHeader = container.querySelector(".chat-header");

  // Определяем, является ли устройство мобильным
  let isMobile = window.innerWidth <= 800;

  // Новые элементы для загрузки файлов и смайлов
  const attachmentIcon = container.querySelector("#attachmentIcon");
  const smileyIcon = container.querySelector("#smileyIcon");
  const fileUploadPopup = container.querySelector("#fileUploadPopup");
  const fileInput = container.querySelector("#fileInput");
  const emojiPicker = container.querySelector("#emojiPicker");

  // Элементы только для мобильной версии
  let backButton, searchIcon, headerSearchContainer, searchResults;
  let sidebarSearchContainer, sidebarSearchInput;
  let sendButtonOrigText;

  // Сохраняем оригинальное содержимое всплывающего окна загрузки файлов
  let originalFileUploadContent = null;
  if (fileUploadPopup) {
    originalFileUploadContent = fileUploadPopup.innerHTML;
  }

  // Переменные для хранения данных чатов и вопросов
  let currentChat = null; // Будет хранить уникальный id текущего чата
  let currentTopic = null; // Будет хранить тему текущего чата
  const chats = {}; // Объект для хранения чатов по уникальным id
  let currentSearchQuery = ""; // Текущий поисковый запрос
  let headerSearchContainerOriginal = null; // Сохраняем оригинальный поиск десктопной версии

  // Объект с быстрыми вопросами для каждой темы
  const quickQuestionsPerTopic = {
    orders: [
      "Как проверить статус заказа?",
      "Как изменить адрес доставки?",
      "Как отменить заказ?",
      "Когда будет доставлен мой заказ?",
      "Как получить товарный чек?",
      "Можно ли изменить детали заказа?",
      "Что делать, если заказ задерживается?",
    ],
    returns: [
      "Как оформить возврат товара?",
      "Какова политика возвратов?",
      "Как начать процесс возврата?",
      "Куда отправить товар для возврата?",
      "Сколько времени занимает возврат?",
      "Можно ли обменять товар?",
      "Какие документы нужны для возврата?",
    ],
    support: [
      "Приложение вылетает, что делать?",
      "Как сбросить пароль?",
      "Не могу войти в аккаунт, помогите.",
      "Платеж не проходит, что делать?",
      "Как обновить профиль?",
      "Как сообщить об ошибке?",
      "Как связаться с поддержкой клиентов?",
    ],
  };

  // Объект с иконками для каждой темы
  const chatIcons = {
    orders: "📦",
    returns: "🔄",
    support: "⚙️",
    general: "💬",
  };

  // Объект с начальными сообщениями для каждой темы
  const initialMessagesPerTheme = {
    orders: [
      {
        sender: "bot",
        text: "Здравствуйте! Как я могу помочь вам с вашим заказом?",
      },
    ],
    returns: [
      {
        sender: "bot",
        text: "Здравствуйте! Как я могу помочь вам с возвратом товара?",
      },
    ],
    support: [
      {
        sender: "bot",
        text: "Здравствуйте! Как я могу помочь вам в технических вопросах?",
      },
    ],
    general: [
      {
        sender: "bot",
        text: "Здравствуйте! Чем я могу вам помочь?",
      },
    ],
  };

  // Загрузка интентов и диалогов
  let intents = []; // Переменная для хранения загруженного JSON-справочника
  let dialogues = []; // Переменная для хранения загруженных диалогов
  let nextChatId = 1; // Переменная для отслеживания следующего уникального id чата

  // Функция для сохранения исходного поиска десктопной версии
  function saveDesktopSearch() {
    // Сохраняем оригинальный поиск для десктопной версии
    headerSearchContainerOriginal = container.querySelector(
      "#headerSearchContainer"
    );
  }

  // Функция для создания мобильных элементов интерфейса
  function createMobileElements() {
    // Сохраняем исходный поиск для десктопной версии, если еще не сохранен
    if (!headerSearchContainerOriginal) {
      saveDesktopSearch();
    }

    // Скрываем оригинальный поиск
    if (headerSearchContainerOriginal) {
      headerSearchContainerOriginal.style.display = "none";
    }

    // Создаем кнопку "Назад" для мобильной версии
    backButton = document.createElement("span");
    backButton.classList.add("back-button", "ri-arrow-left-line");
    backButton.style.display = "none"; // Скрыта по умолчанию
    backButton.title = "Вернуться к списку чатов";

    // Добавляем кнопку в заголовок
    const headerTitle = chatHeader.querySelector("h2");
    if (headerTitle) {
      headerTitle.insertBefore(backButton, headerTitle.firstChild);
    }

    // Создаем иконку поиска в заголовке
    searchIcon = document.createElement("span");
    searchIcon.classList.add("search-icon", "ri-search-line");
    chatHeader.appendChild(searchIcon);

    // Создаем контейнер для поиска в заголовке
    headerSearchContainer = document.createElement("div");
    headerSearchContainer.classList.add("header-search-container");

    const searchCloseBtn = document.createElement("span");
    searchCloseBtn.classList.add("search-close", "ri-arrow-left-line");

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Поиск...";

    headerSearchContainer.appendChild(searchCloseBtn);
    headerSearchContainer.appendChild(searchInput);
    chatHeader.appendChild(headerSearchContainer);

    // Создаем контейнер для результатов поиска
    searchResults = document.createElement("div");
    searchResults.classList.add("header-search-results");
    headerSearchContainer.appendChild(searchResults);

    // Добавляем поиск в сайдбар
    sidebarSearchContainer = document.createElement("div");
    sidebarSearchContainer.classList.add("sidebar-search-container");

    sidebarSearchInput = document.createElement("input");
    sidebarSearchInput.type = "text";
    sidebarSearchInput.placeholder = "Поиск по чатам...";

    sidebarSearchContainer.appendChild(sidebarSearchInput);

    // Вставляем поиск после заголовка "Мои чаты"
    if (chatSidebar.querySelector("h3")) {
      chatSidebar.insertBefore(
        sidebarSearchContainer,
        chatSidebar.querySelector("h3").nextSibling
      );
    } else {
      const sidebarTitle = document.createElement("h3");
      sidebarTitle.textContent = "Мои чаты";
      chatSidebar.insertBefore(sidebarTitle, chatSidebar.firstChild);
      chatSidebar.insertBefore(
        sidebarSearchContainer,
        sidebarTitle.nextSibling
      );
    }

    // Заменяем текстовую кнопку "Отправить" на иконку конверта
    const sendButton = container.querySelector(".send-button");
    if (sendButton) {
      sendButtonOrigText = sendButton.textContent;
      sendButton.innerHTML = '<i class="ri-send-plane-fill"></i>';
      sendButton.style.width = "40px";
      sendButton.style.height = "40px";
      sendButton.style.padding = "0";
      sendButton.style.display = "flex";
      sendButton.style.alignItems = "center";
      sendButton.style.justifyContent = "center";
    }

    // Делаем иконки эмодзи и прикрепления компактнее
    if (smileyIcon) {
      smileyIcon.style.fontSize = "22px";
      smileyIcon.style.margin = "0 5px";
      smileyIcon.style.padding = "5px";
    }

    if (attachmentIcon) {
      attachmentIcon.style.fontSize = "22px";
      attachmentIcon.style.margin = "0 5px";
      attachmentIcon.style.padding = "5px";
    }

    // Модифицируем всплывающее окно загрузки файлов для мобильной версии
    if (fileUploadPopup) {
      // Сохраняем оригинальное содержимое, если еще не сохранено
      if (!originalFileUploadContent) {
        originalFileUploadContent = fileUploadPopup.innerHTML;
      }

      // Заменяем на упрощенную версию без перетаскивания
      const simplifiedContent = `
        <div class="popup-content">
          <h3>Загрузите файл</h3>
          <label for="fileInput" class="file-button">Выбрать файл</label>
          <input type="file" id="fileInput" multiple style="display:none;">
        </div>
      `;
      fileUploadPopup.innerHTML = simplifiedContent;

      // Обновляем ссылку на input после изменения HTML
      const newFileInput = fileUploadPopup.querySelector("#fileInput");
      if (newFileInput) {
        newFileInput.addEventListener("change", (e) => {
          const files = e.target.files;
          handleFiles(files);
          newFileInput.value = "";
          toggleFileUploadPopup(false);
        });
      }
    }

    // Добавляем прокрутку для эмодзи-пикера
    if (emojiPicker) {
      emojiPicker.style.maxHeight = "250px";
      emojiPicker.style.overflowY = "auto";
    }

    // Добавляем обработчики для мобильных элементов
    backButton.addEventListener("click", function (e) {
      e.stopPropagation();
      showMobileChatList();
    });

    searchIcon.addEventListener("click", function () {
      headerSearchContainer.classList.add("active");
      searchInput.focus();
    });

    searchCloseBtn.addEventListener("click", function () {
      headerSearchContainer.classList.remove("active");
      searchInput.value = "";
      searchResults.classList.remove("active");
    });

    searchInput.addEventListener("input", function () {
      const query = this.value.trim();
      if (query.length > 0) {
        performMobileSearch(query);
        searchResults.classList.add("active");
      } else {
        searchResults.classList.remove("active");
      }
    });

    // Поиск в сайдбаре
    sidebarSearchInput.addEventListener("input", function () {
      const query = this.value.trim().toLowerCase();
      const chatItems = container.querySelectorAll(".chat-list-item");

      chatItems.forEach((item) => {
        const chatTitle = item
          .querySelector(".chat-info h4")
          .textContent.toLowerCase();
        if (chatTitle.includes(query) || query === "") {
          item.style.display = "flex";
        } else {
          item.style.display = "none";
        }
      });
    });
  }

  // Функция для удаления мобильных элементов и возврата к десктопу
  function removeMobileElements() {
    // Удаляем мобильные элементы
    if (backButton) backButton.remove();
    if (searchIcon) searchIcon.remove();
    if (headerSearchContainer) headerSearchContainer.remove();
    if (sidebarSearchContainer) sidebarSearchContainer.remove();

    // Восстанавливаем оригинальную кнопку отправки
    const sendButton = container.querySelector(".send-button");
    if (sendButton && sendButtonOrigText) {
      sendButton.innerHTML = sendButtonOrigText;
      sendButton.style.width = "";
      sendButton.style.height = "";
      sendButton.style.padding = "";
      sendButton.style.display = "";
      sendButton.style.alignItems = "";
      sendButton.style.justifyContent = "";
    }

    // Восстанавливаем иконки
    if (smileyIcon) {
      smileyIcon.style.fontSize = "";
      smileyIcon.style.margin = "";
      smileyIcon.style.padding = "";
    }

    if (attachmentIcon) {
      attachmentIcon.style.fontSize = "";
      attachmentIcon.style.margin = "";
      attachmentIcon.style.padding = "";
    }

    // Восстанавливаем оригинальное содержимое окна загрузки файлов
    if (fileUploadPopup && originalFileUploadContent) {
      fileUploadPopup.innerHTML = originalFileUploadContent;

      // Восстанавливаем обработчики событий для drag and drop
      const dropArea = fileUploadPopup.querySelector(".drop-area");
      const fileInput = fileUploadPopup.querySelector("#fileInput");

      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const files = e.target.files;
          handleFiles(files);
          fileInput.value = "";
          toggleFileUploadPopup(false);
        });
      }

      if (dropArea) {
        dropArea.addEventListener("dragover", (e) => {
          e.preventDefault();
          dropArea.classList.add("dragover");
        });

        dropArea.addEventListener("dragleave", (e) => {
          e.preventDefault();
          dropArea.classList.remove("dragover");
        });

        dropArea.addEventListener("drop", (e) => {
          e.preventDefault();
          dropArea.classList.remove("dragover");
          const files = e.dataTransfer.files;
          handleFiles(files);
          toggleFileUploadPopup(false);
        });
      }
    }

    // Восстанавливаем оригинальный поиск десктопной версии
    if (headerSearchContainerOriginal) {
      headerSearchContainerOriginal.style.display = "";
    }

    // Сбрасываем стили эмодзи-пикера
    if (emojiPicker) {
      emojiPicker.style.maxHeight = "";
      emojiPicker.style.overflowY = "";
    }
  }

  // Функция для обработки изменения размера окна
  function handleResize() {
    const newIsMobile = window.innerWidth <= 800;
    if (isMobile !== newIsMobile) {
      isMobile = newIsMobile;

      if (isMobile) {
        createMobileElements();
        adjustForMobile();
      } else {
        removeMobileElements();
        resetToDesktopView();
      }
    }
  }

  // Функция для настройки вида в зависимости от устройства
  function adjustForMobile() {
    if (!isMobile) return;

    // Показываем список чатов по умолчанию
    if (currentChat === null) {
      showMobileChatList();
    } else {
      showMobileChat();
    }

    // Обновляем позиционирование всплывающих окон
    updatePopupPositions();
  }

  // Функция для отображения списка чатов на мобильном устройстве
  function showMobileChatList() {
    if (!isMobile) return;

    chatSidebar.classList.remove("hidden");
    chatContent.classList.remove("active");

    if (backButton) backButton.style.display = "none";

    // Обновляем заголовок
    const headerTitle = chatHeader.querySelector("h2");
    if (headerTitle) {
      headerTitle.textContent = "Чат 1-2.SU";
      if (backButton)
        headerTitle.insertBefore(backButton, headerTitle.firstChild);
    }
  }

  // Функция для отображения активного чата на мобильном устройстве
  function showMobileChat() {
    if (!isMobile) return;

    chatSidebar.classList.add("hidden");
    chatContent.classList.add("active");

    if (backButton) backButton.style.display = "inline-block";

    // Обновляем заголовок с темой активного чата
    const headerTitle = chatHeader.querySelector("h2");
    if (headerTitle && currentChat !== null) {
      const chatTheme = chats[currentChat].theme;
      headerTitle.textContent = getThemeTitle(chatTheme);
      if (backButton)
        headerTitle.insertBefore(backButton, headerTitle.firstChild);
    }
  }

  // Функция для возврата к десктопному виду
  function resetToDesktopView() {
    chatSidebar.classList.remove("hidden");
    chatContent.classList.remove("active");

    if (backButton) backButton.style.display = "none";
  }

  // Функция для обновления позиционирования всплывающих окон
  function updatePopupPositions() {
    if (isMobile) {
      // Для мобильных устройств позиционируем окна над нижней строкой чата
      const inputHeight = container.querySelector(".chat-input").offsetHeight;

      if (emojiPicker) {
        emojiPicker.style.position = "absolute";
        emojiPicker.style.bottom = `${inputHeight}px`;
        emojiPicker.style.left = "0";
        emojiPicker.style.right = "0";
        emojiPicker.style.width = "100%";
        emojiPicker.style.zIndex = "1000";
        emojiPicker.style.borderTop = "1px solid #ddd";
        emojiPicker.style.borderBottom = "1px solid #ddd";
      }

      if (fileUploadPopup) {
        fileUploadPopup.style.position = "absolute";
        fileUploadPopup.style.bottom = `${inputHeight}px`;
        fileUploadPopup.style.left = "0";
        fileUploadPopup.style.right = "0";
        fileUploadPopup.style.width = "100%";
        fileUploadPopup.style.zIndex = "1000";
        fileUploadPopup.style.borderTop = "1px solid #ddd";
        fileUploadPopup.style.borderBottom = "1px solid #ddd";
      }
    } else {
      // Для десктопа возвращаем стандартное позиционирование
      if (emojiPicker) {
        emojiPicker.style.position = "absolute";
        emojiPicker.style.bottom = "60px";
        emojiPicker.style.left = "20px";
        emojiPicker.style.right = "auto";
        emojiPicker.style.width = "auto";
        emojiPicker.style.borderTop = "";
        emojiPicker.style.borderBottom = "";
      }

      if (fileUploadPopup) {
        fileUploadPopup.style.position = "absolute";
        fileUploadPopup.style.bottom = "60px";
        fileUploadPopup.style.left = "300px";
        fileUploadPopup.style.right = "auto";
        fileUploadPopup.style.width = "auto";
        fileUploadPopup.style.borderTop = "";
        fileUploadPopup.style.borderBottom = "";
      }
    }
  }

  // Функция для выполнения поиска в мобильной версии
  function performMobileSearch(query) {
    if (!searchResults) return;

    searchResults.innerHTML = "";
    const lowerQuery = query.toLowerCase();

    if (currentChat === null) return;

    const messages = chats[currentChat].messages;
    let matchCount = 0;
    const matchResults = [];

    messages.forEach((msg, index) => {
      if (msg.text && msg.text.toLowerCase().includes(lowerQuery)) {
        matchCount++;
        matchResults.push({
          text: msg.text,
          index: index,
        });
      }
    });

    if (matchCount > 0) {
      // Показываем максимум 5 результатов
      const showResults = matchResults.slice(0, 5);

      showResults.forEach((result) => {
        const item = document.createElement("div");
        item.classList.add("header-search-result-item");

        // Выделяем часть текста с найденным запросом
        const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
        const highlightedText = result.text.replace(
          regex,
          '<span class="header-highlight">$1</span>'
        );

        item.innerHTML = highlightedText;

        // Добавляем обработчик для перехода к сообщению
        item.addEventListener("click", () => {
          navigateToMessage(result.index, query);
          if (searchResults) searchResults.classList.remove("active");
          if (headerSearchContainer)
            headerSearchContainer.classList.remove("active");
        });

        searchResults.appendChild(item);
      });
    } else {
      const noResults = document.createElement("div");
      noResults.classList.add("header-search-result-item");
      noResults.textContent = "Ничего не найдено";
      searchResults.appendChild(noResults);
    }
  }

  // Функция для навигации к сообщению
  function navigateToMessage(messageIndex, query) {
    // Перерисовываем сообщения с выделением
    renderMessages(query);

    // Скроллим к нужному сообщению
    setTimeout(() => {
      const messageDivs = chatMessages.querySelectorAll(".message-content");
      if (messageDivs[messageIndex]) {
        messageDivs[messageIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Добавляем анимацию выделения
        messageDivs[messageIndex].classList.add("highlight");
        setTimeout(() => {
          messageDivs[messageIndex].classList.remove("highlight");
        }, 2000);
      }
    }, 100);
  }

  // Функция для загрузки JSON-файлов
  async function loadData() {
    try {
      // Загрузка intents
      const intentsResponse = await fetch("/data/responses.json");
      if (!intentsResponse.ok)
        throw new Error("Не удалось загрузить справочник ответов.");
      const intentsData = await intentsResponse.json();
      intents = intentsData.intents;

      // Загрузка диалогов
      const dialoguesResponse = await fetch("/data/chat.json");
      if (!dialoguesResponse.ok)
        throw new Error("Не удалось загрузить диалоги.");
      const dialoguesData = await dialoguesResponse.json();
      dialogues = dialoguesData.dialogues;

      // Инициализация чатов с загруженными диалогами
      initializeChats();
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
  }

  // Функция для инициализации чатов с загруженными диалогами
  function initializeChats() {
    dialogues.forEach((dialogue) => {
      createNewChat(dialogue.theme, dialogue.messages, dialogue.date);
    });

    // В мобильной версии начинаем со списка чатов
    if (isMobile) {
      // Сбрасываем текущий чат, чтобы показать список
      currentChat = null;
      showMobileChatList();
    }
  }

  // Функция создания поискового интерфейса в заголовке (десктопная версия)
  function createheaderSearchBar() {
    const chatheader = container.querySelector(".chat-header");

    const searchContainer = document.createElement("div");
    searchContainer.id = "headerSearchContainer";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "headerSearchInput";
    searchInput.placeholder = "Поиск по чатам...";

    const searchIcon = document.createElement("span");
    searchIcon.id = "headerSearchIcon";
    searchIcon.classList.add("ri-menu-search-line");

    // Добавляем инпут и иконку в контейнер
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchIcon);

    // Создаем контейнер для результатов поиска
    const searchResults = document.createElement("div");
    searchResults.id = "headerSearchResults";

    searchContainer.appendChild(searchResults);

    // Вставляем поисковый контейнер в заголовок
    chatheader.appendChild(searchContainer);

    // Обработчик ввода в поисковый инпут
    searchInput.addEventListener("input", handleSearchInput);

    // Обработчик клика на иконку поиска
    searchIcon.addEventListener("click", () => {
      const query = searchInput.value.trim();
      if (query !== "") {
        performSearch(query);
      }
    });

    // Сохраняем оригинальный поиск для последующего восстановления
    headerSearchContainerOriginal = searchContainer;
  }

  // Функция для обработки ввода в поисковый инпут (десктопная версия)
  function handleSearchInput(e) {
    const query = e.target.value.trim();
    currentSearchQuery = query;

    if (query === "") {
      toggleheaderSearchResults(false);
      updateHighlightedMessages();
      updateMatchCounts([]);
      return;
    }

    performSearch(query);
    updateHighlightedMessages();
  }

  // Функция для выполнения поиска (десктопная версия)
  function performSearch(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    // Сброс предыдущих совпадений
    Object.keys(chats).forEach((chatId) => {
      const chat = chats[chatId];
      let matchCount = 0;
      chat.messages.forEach((msg) => {
        if (msg.text && msg.text.toLowerCase().includes(lowerQuery)) {
          matchCount++;
        }
      });
      chat.matchCount = matchCount;
      if (matchCount > 0) {
        results.push({ chatId, matchCount });
      }
    });

    // Обновляем количество совпадений рядом с чатами
    updateMatchCounts(results);

    // Ищем топ-5 совпадений для выпадающего списка
    const topResults = [];

    Object.keys(chats).forEach((chatId) => {
      const chat = chats[chatId];
      chat.messages.forEach((msg, index) => {
        if (msg.text && msg.text.toLowerCase().includes(lowerQuery)) {
          topResults.push({
            chatId,
            theme: chat.theme,
            message: msg.text,
            messageIndex: index,
            fullMessage: msg.text,
          });
        }
      });
    });

    // Ограничиваем до 5 результатов
    const limitedResults = topResults.slice(0, 5);

    // Отображаем результаты
    displaySearchResults(limitedResults, query);
  }

  // Функция для обновления количества совпадений рядом с чатом (десктопная версия)
  function updateMatchCounts(results) {
    // Удаляем предыдущие счетчики
    const existingCounts = container.querySelectorAll(".match-count");
    existingCounts.forEach((count) => count.remove());

    // Добавляем новые счетчики
    results.forEach((result) => {
      const chatListItem = container.querySelector(
        `.chat-list-item[data-chat="${result.chatId}"]`
      );
      if (chatListItem) {
        const chatInfo = chatListItem.querySelector(".chat-info");
        const chatTitle = chatInfo.querySelector("h4");
        const existingMatch = chatTitle.querySelector(".match-count");
        if (existingMatch) {
          existingMatch.textContent = `(${result.matchCount})`;
        } else {
          const matchSpan = document.createElement("span");
          matchSpan.classList.add("match-count");
          matchSpan.textContent = `(${result.matchCount})`;
          chatTitle.appendChild(matchSpan);
        }
      }
    });
  }

  // Функция для отображения результатов поиска в выпадающем списке (десктопная версия)
  function displaySearchResults(results, query) {
    const searchResults = container.querySelector("#headerSearchResults");
    if (!searchResults) return;

    searchResults.innerHTML = "";

    if (results.length === 0) {
      toggleheaderSearchResults(false);
      renderMessages();
      return;
    }

    results.forEach((result) => {
      const item = document.createElement("div");
      item.classList.add("header-search-result-item");
      // Выделяем совпадения
      const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
      const highlightedText = result.message.replace(
        regex,
        '<span class="header-highlight">$1</span>'
      );
      item.innerHTML = `<strong>${getThemeTitle(
        getThemeKey(result.theme)
      )}</strong>: ${highlightedText}`;
      item.addEventListener("click", () => {
        navigateToMatch(result.chatId, result.messageIndex, query);
        toggleheaderSearchResults(false);
      });
      searchResults.appendChild(item);
    });

    toggleheaderSearchResults(true);
  }

  // Функция для отображения или скрытия результатов поиска в заголовке (десктопная версия)
  function toggleheaderSearchResults(show = true) {
    const searchResults = container.querySelector("#headerSearchResults");
    if (!searchResults) return;

    if (show) {
      searchResults.style.display = "block";
    } else {
      searchResults.style.display = "none";
    }
  }

  // Функция для навигации к конкретному совпадению (десктопная версия)
  function navigateToMatch(chatId, messageIndex, query) {
    // Переключаемся на нужный чат
    switchChat(chatId);

    // Если мы на мобильном устройстве, показываем экран чата
    if (isMobile) {
      showMobileChat();
    }

    // Ждём рендеринга сообщений
    setTimeout(() => {
      const messageDivs = chatMessages.querySelectorAll(".message-content");
      if (messageDivs[messageIndex]) {
        const messageText = messageDivs[messageIndex].innerText.toLowerCase();
        const queryLower = query.toLowerCase();
        const position = messageText.indexOf(queryLower);
        if (position !== -1) {
          messageDivs[messageIndex].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          // Добавляем временное выделение с анимацией
          messageDivs[messageIndex].classList.add("highlight");
          setTimeout(() => {
            messageDivs[messageIndex].classList.remove("highlight");
          }, 2000);
        }
      }
    }, 100);
  }

  function updateHighlightedMessages() {
    // Очищаем текущую область сообщений
    chatMessages.innerHTML = "";

    // Проверяем, выбран ли чат
    if (currentChat === null) return;

    const messages = chats[currentChat].messages;
    lastAppendedDate = null; // Сбрасываем последнюю дату

    // Перерисовываем каждое сообщение
    messages.forEach((messageObj) => {
      if (messageObj.imageUrl) {
        appendImageMessage(messageObj);
      } else if (messageObj.fileName) {
        appendFileMessage(messageObj);
      } else {
        appendMessage(messageObj, false); // Перерисовываем текстовые сообщения
      }
    });

    // Прокручиваем чат вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Функция инициализации чата
  function initializeChat() {
    // Добавляем обработчики событий для тем чата
    chatTopics.forEach((topic) => {
      topic.addEventListener("click", () => {
        const theme = topic.getAttribute("data-theme");
        createNewChat(theme);
      });
    });

    // Создаем поиск для десктопной версии
    createheaderSearchBar();

    // Обработчик для кнопки "Отправить"
    const sendButton = container.querySelector(".send-button");

    // Отправка сообщения по нажатию Enter или кнопки
    chatInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    // Добавляем обработчик для клика по кнопке
    sendButton.addEventListener("click", function () {
      sendMessage();
    });

    // Добавляем обработчики для иконок с остановкой распространения события
    if (attachmentIcon) {
      attachmentIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileUploadPopup(true);
      });
    }

    if (smileyIcon) {
      smileyIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleEmojiPicker(true);
      });
    }

    // Закрытие всплывающих окон при клике вне их
    container.ownerDocument.addEventListener("click", (e) => {
      if (
        emojiPicker &&
        !emojiPicker.contains(e.target) &&
        e.target !== smileyIcon &&
        !smileyIcon.contains(e.target)
      ) {
        toggleEmojiPicker(false);
      }
      if (
        fileUploadPopup &&
        !fileUploadPopup.contains(e.target) &&
        e.target !== attachmentIcon &&
        !attachmentIcon.contains(e.target)
      ) {
        toggleFileUploadPopup(false);
      }

      // Закрытие поиска в десктопной версии
      const headerSearchContainer = container.querySelector(
        "#headerSearchContainer"
      );
      const headerSearchIcon = container.querySelector("#headerSearchIcon");
      const headerSearchInput = container.querySelector("#headerSearchInput");
      if (
        headerSearchContainer &&
        !headerSearchContainer.contains(e.target) &&
        e.target !== headerSearchIcon &&
        e.target !== headerSearchInput
      ) {
        toggleheaderSearchResults(false);
      }
    });

    // Обработчик для выбора файлов через input
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const files = e.target.files;
        handleFiles(files);
        fileInput.value = "";
        toggleFileUploadPopup(false);
      });
    }

    // Добавляем обработчик изменения размера окна
    window.addEventListener("resize", handleResize);

    // Если это мобильная версия, создаем мобильные элементы
    if (isMobile) {
      createMobileElements();
      // Начинаем с экрана списка чатов на мобильном
      showMobileChatList();
    }

    // Добавляем обработчики прокрутки для быстрых вопросов на мобильных
    if (quickQuestionsContainer && isMobile) {
      // Для сенсорных устройств
      let isScrolling = false;
      let startX, scrollLeft;

      quickQuestionsContainer.addEventListener(
        "touchstart",
        function (e) {
          isScrolling = true;
          startX = e.touches[0].pageX - quickQuestionsContainer.offsetLeft;
          scrollLeft = quickQuestionsContainer.scrollLeft;
        },
        { passive: false }
      );

      quickQuestionsContainer.addEventListener(
        "touchmove",
        function (e) {
          if (!isScrolling) return;
          const x = e.touches[0].pageX - quickQuestionsContainer.offsetLeft;
          const walk = (x - startX) * 2;
          quickQuestionsContainer.scrollLeft = scrollLeft - walk;
        },
        { passive: false }
      );

      quickQuestionsContainer.addEventListener("touchend", function () {
        isScrolling = false;
      });
    }
  }

  // Функция для экранирования специальных символов в регулярных выражениях
  function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
  }

  // Функция для создания нового чата с начальными сообщениями
  function createNewChat(theme, initialMessages = [], date = null) {
    const themeKey = getThemeKey(theme);

    // Проверяем, существует ли уже чат с данной темой
    const existingChatId = Object.keys(chats).find(
      (chatId) => chats[chatId].theme === themeKey
    );

    if (existingChatId) {
      // Чат с данной темой уже существует, переключаемся на него
      switchChat(existingChatId);
      // Добавляем новые сообщения с датой
      addMessagesToChat(existingChatId, initialMessages, date);
    } else {
      // Создаем новый чат
      const newChatId = nextChatId++;

      addChat(
        newChatId,
        themeKey,
        initialMessages.length > 0
          ? initialMessages
          : initialMessagesPerTheme[themeKey] ||
              initialMessagesPerTheme["general"],
        true,
        date
      );

      switchChat(newChatId);
    }
  }

  // Функция замены существующего чата новым
  function replaceChat(oldChatId, newChatId, themeKey) {
    // Удаляем старый чат из объекта chats
    delete chats[oldChatId];

    // Находим элемент списка чатов и удаляем его
    const oldChatListItem = container.querySelector(
      `.chat-list-item[data-chat="${oldChatId}"]`
    );
    if (oldChatListItem) {
      chatList.removeChild(oldChatListItem);
    }

    // Создаем новый чат с новым ID
    addChat(
      newChatId,
      themeKey,
      initialMessagesPerTheme[themeKey] || initialMessagesPerTheme["general"],
      false
    );
  }

  // Функция добавления чата в объект chats и в левое меню
  function addChat(chatId, themeKey, messages, prepend = false, date = null) {
    chats[chatId] = {
      theme: themeKey,
      messages: [],
    };

    const formattedDate = date
      ? /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? formatToReadableDate(date)
        : date
      : getCurrentDate();

    // Добавляем начальные сообщения в чат
    messages.forEach((msg) => {
      const messageObj = {
        text: msg.text,
        sender:
          msg.sender === "Пользователь" || msg.sender === "Я" ? "user" : "bot",
        time: msg.time || getCurrentTime(),
        date: formattedDate,
      };
      chats[chatId].messages.push(messageObj);
    });

    // Создаем элемент списка чатов
    const chatListItem = document.createElement("li");
    chatListItem.classList.add("chat-list-item");
    chatListItem.setAttribute("data-chat", chatId);

    // Выбираем иконку в зависимости от темы
    const chatIcon = chatIcons[themeKey] || chatIcons["general"];

    const chatIconSpan = document.createElement("span");
    chatIconSpan.classList.add("chat-icon");
    chatIconSpan.textContent = chatIcon;

    const chatInfoDiv = document.createElement("div");
    chatInfoDiv.classList.add("chat-info");

    const chatTitle = document.createElement("h4");
    chatTitle.textContent = getThemeTitle(themeKey);

    const chatStatus = document.createElement("p");
    chatStatus.textContent = "На связи";

    chatInfoDiv.appendChild(chatTitle);
    chatInfoDiv.appendChild(chatStatus);

    chatListItem.appendChild(chatIconSpan);
    chatListItem.appendChild(chatInfoDiv);

    // Добавляем обработчик клика на чат
    chatListItem.addEventListener("click", () => {
      switchChat(chatId);
    });

    // Добавляем чат в список
    if (prepend) {
      chatList.prepend(chatListItem);
    } else {
      chatList.appendChild(chatListItem);
    }

    // Если чат только что создан, добавить его сообщения в чат
    if (currentChat === chatId) {
      renderMessages();
      initializeQuickQuestions();
    }
  }

  // Функция для добавления новых сообщений в существующий чат
  function addMessagesToChat(chatId, newMessages, date) {
    const formattedDate = date
      ? /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? formatToReadableDate(date)
        : date
      : getCurrentDate();

    newMessages.forEach((msg) => {
      const messageObj = {
        text: msg.text,
        sender:
          msg.sender === "Пользователь" || msg.sender === "Я" ? "user" : "bot",
        time: msg.time || getCurrentTime(),
        date: formattedDate,
      };
      chats[chatId].messages.push(messageObj);
    });

    if (currentChat === chatId) {
      renderMessages();
    }
  }

  // Функция переключения чата
  function switchChat(chatId) {
    if (currentChat === chatId) return;

    // Удаляем класс active у предыдущего чата
    if (currentChat !== null) {
      const previousActiveItem = container.querySelector(
        `.chat-list-item[data-chat="${currentChat}"]`
      );
      if (previousActiveItem) {
        previousActiveItem.classList.remove("active");
      }
    }

    currentChat = chatId;
    currentTopic = chats[chatId].theme;

    // Добавляем класс active к новому чату
    const newActiveItem = container.querySelector(
      `.chat-list-item[data-chat="${chatId}"]`
    );
    if (newActiveItem) {
      newActiveItem.classList.add("active");
    }

    // Отображение сообщений для нового чата
    renderMessages();

    // Скролл вниз при переключении чата
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Инициализация быстрых вопросов для новой темы
    initializeQuickQuestions();

    // В мобильной версии показываем контент чата
    if (isMobile) {
      showMobileChat();
    }
  }

  // Функция для получения ключа темы
  function getThemeKey(theme) {
    switch (theme) {
      case "Поддержка заказов":
      case "Вопросы по заказам":
        return "orders";
      case "Претензии и возвраты":
        return "returns";
      case "Техподдержка":
        return "support";
      default:
        return "general";
    }
  }

  // Функция для получения заголовка темы по ключу
  function getThemeTitle(themeKey) {
    switch (themeKey) {
      case "orders":
        return "Поддержка заказов";
      case "returns":
        return "Претензии и возвраты";
      case "support":
        return "Техподдержка";
      default:
        return "Общие вопросы";
    }
  }

  // Функция для добавления быстрых вопросов в поле ввода
  function addQuickQuestion(question) {
    chatInput.value = question;
    chatInput.focus();
  }

  // Функция для отправки сообщения
  async function sendMessage() {
    if (currentChat === null) return;

    const message = chatInput.value.trim();
    if (message === "") return;

    // Добавляем сообщение пользователя в текущий чат
    const userMessage = {
      text: message,
      sender: "user",
      time: getCurrentTime(),
      date: getCurrentDate(),
    };
    chats[currentChat].messages.push(userMessage);
    appendMessage(userMessage);

    chatInput.value = "";

    // Получаем ответ от бота
    const botResponse = await getBotResponse(message);
    const botMessage = {
      text: botResponse,
      sender: "bot",
      time: getCurrentTime(),
      date: getCurrentDate(),
    };
    chats[currentChat].messages.push(botMessage);
    appendMessage(botMessage);
  }

  // Функция для получения текущего времени в формате HH:MM
  function getCurrentTime() {
    const now = new Date();
    return (
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0")
    );
  }

  // Функция для получения текущей даты в формате: 17 декабря 2024
  function getCurrentDate() {
    const now = new Date();
    const options = { day: "numeric", month: "long", year: "numeric" };
    return now.toLocaleDateString("ru-RU", options).replace(" г.", "");
  }

  // Функция для получения ответа от бота
  async function getBotResponse(userMessage) {
    try {
      // Попытка отправить сообщение на сервер Flask (если есть)
      const response = await fetch("http://127.0.0.1:5000/send_message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Ошибка сети");
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      // Если сервер недоступен, используем локальные интенты
      return getLocalResponse(userMessage);
    }
  }

  // Функция для поиска ответа в локальных интентах
  function getLocalResponse(userMessage) {
    // Проверяем, что интенты загружены
    if (!intents || intents.length === 0) {
      return "Справочник ответов временно недоступен. Попробуйте позже.";
    }

    const lowerCaseMessage = userMessage.toLowerCase();
    let matchedResponses = [];

    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        if (lowerCaseMessage.includes(pattern.toLowerCase())) {
          matchedResponses = matchedResponses.concat(intent.responses);
          break;
        }
      }
    }

    if (matchedResponses.length > 0) {
      // Выбираем случайный ответ из совпавших интентов
      const randomIndex = Math.floor(Math.random() * matchedResponses.length);
      return matchedResponses[randomIndex];
    }

    return "Извините, я не смог понять ваш запрос. Пожалуйста, переформулируйте вопрос.";
  }

  let lastAppendedDate = null; // Глобальная переменная для отслеживания последней добавленной даты

  // Универсальная функция для отображения сообщений
  function appendMessage(messageObj, scrollToBottom = true) {
    const currentDate = messageObj.date || getCurrentDate();

    // Проверяем, изменилась ли дата, и добавляем разделитель при необходимости
    if (lastAppendedDate !== currentDate) {
      appendDateDivider(currentDate);
      lastAppendedDate = currentDate;
    }

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", messageObj.sender);

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar");

    const messageContentWrapper = document.createElement("div");
    messageContentWrapper.classList.add("message-wrapper");

    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");

    // Если есть текущий поисковый запрос и сообщение содержит его, выделяем совпадения
    if (
      currentSearchQuery &&
      messageObj.text.toLowerCase().includes(currentSearchQuery.toLowerCase())
    ) {
      const regex = new RegExp(`(${escapeRegExp(currentSearchQuery)})`, "gi");
      const highlightedText = messageObj.text.replace(
        regex,
        '<span class="header-highlight">$1</span>'
      );
      messageContent.innerHTML = highlightedText;
    } else {
      messageContent.textContent = messageObj.text;
    }

    const messageTime = document.createElement("div");
    messageTime.classList.add("message-time");
    messageTime.textContent = messageObj.time;

    messageContentWrapper.appendChild(messageContent);
    messageContentWrapper.appendChild(messageTime);

    if (messageObj.sender === "user") {
      messageDiv.appendChild(messageContentWrapper);
      messageDiv.appendChild(avatarDiv);
    } else {
      messageDiv.appendChild(avatarDiv);
      messageDiv.appendChild(messageContentWrapper);
    }

    chatMessages.appendChild(messageDiv);

    // Прокручиваем вниз только если это явно указано
    if (scrollToBottom) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Функция для конвертации даты в читаемый формат: "17 декабря 2024"
  function formatToReadableDate(dateString) {
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    const [year, month, day] = dateString.split("-");
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
  }

  // Функция для отображения сообщений
  function renderMessages(searchQuery = "") {
    chatMessages.innerHTML = "";
    currentSearchQuery = searchQuery;

    if (currentChat === null) return;

    const messages = chats[currentChat].messages;
    lastAppendedDate = null; // Сбрасываем последнюю дату при рендере

    messages.forEach((messageObj) => {
      if (messageObj.imageUrl) {
        appendImageMessage(messageObj);
      } else if (messageObj.fileName) {
        appendFileMessage(messageObj);
      } else {
        appendMessage(messageObj, false);
      }
    });

    // Скролл вниз после рендеринга всех сообщений
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Функция для добавления разделителя с датой
  function appendDateDivider(date) {
    const dateDivider = document.createElement("div");
    dateDivider.classList.add("date-divider");
    dateDivider.textContent = date;

    chatMessages.appendChild(dateDivider);
  }

  // Функция для инициализации быстрых вопросов
  function initializeQuickQuestions() {
    const questions = quickQuestionsPerTopic[currentTopic] || [];

    quickQuestionsContainer.innerHTML = "";

    questions.forEach((question) => {
      const quickQuestionDiv = document.createElement("div");
      quickQuestionDiv.classList.add("quick-question");
      quickQuestionDiv.textContent = question;
      quickQuestionDiv.addEventListener("click", () => {
        addQuickQuestion(question);
      });
      quickQuestionsContainer.appendChild(quickQuestionDiv);
    });
  }

  // Функция для загрузки и отображения эмодзи в emojiPicker
  function populateEmojiPicker() {
    let emojiGrid = container.querySelector(".emoji-grid");
    if (!emojiGrid) {
      emojiGrid = document.createElement("div");
      emojiGrid.classList.add("emoji-grid");
      emojiPicker.appendChild(emojiGrid);
    } else {
      emojiGrid.innerHTML = "";
    }

    const emojisList = [
      "😀",
      "😂",
      "😍",
      "👍",
      "🙏",
      "🎉",
      "😢",
      "🤔",
      "😎",
      "😡",
      "😭",
      "😊",
      "😴",
      "💪",
      "😇",
      "😜",
      "🤗",
      "😏",
      "🙄",
      "😋",
      "😌",
    ];

    emojisList.forEach((emoji) => {
      const emojiSpan = document.createElement("span");
      emojiSpan.classList.add("emoji");
      emojiSpan.textContent = emoji;
      emojiGrid.appendChild(emojiSpan);
    });
  }

  // Инициализация emojiPicker
  function initializeEmojiPicker() {
    populateEmojiPicker();
    // Добавляем обработчики клика на эмодзи
    emojiPicker.addEventListener("click", (e) => {
      if (e.target.classList.contains("emoji")) {
        insertEmoji(e.target.textContent);
        toggleEmojiPicker(false);
      }
    });
  }

  // Функция переключения всплывающего окна загрузки файлов
  function toggleFileUploadPopup(show = true) {
    updatePopupPositions();
    if (show) {
      fileUploadPopup.classList.add("active");
    } else {
      fileUploadPopup.classList.remove("active");
    }
  }

  // Функция переключения плашки с эмодзи
  function toggleEmojiPicker(show = true) {
    updatePopupPositions();
    if (show) {
      emojiPicker.classList.add("active");
    } else {
      emojiPicker.classList.remove("active");
    }
  }

  // Функция вставки смайла в поле ввода
  function insertEmoji(emoji) {
    const cursorPosition = chatInput.selectionStart;
    const textBefore = chatInput.value.substring(0, cursorPosition);
    const textAfter = chatInput.value.substring(cursorPosition);
    chatInput.value = textBefore + emoji + textAfter;
    chatInput.focus();
    chatInput.selectionStart = cursorPosition + emoji.length;
    chatInput.selectionEnd = cursorPosition + emoji.length;
  }

  // Функция обработки выбранных или перетащенных файлов
  function handleFiles(files) {
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        // Обработка изображений
        const reader = new FileReader();
        reader.onload = function (e) {
          const imageMessage = {
            text: "",
            sender: "user",
            time: getCurrentTime(),
            date: getCurrentDate(),
            imageUrl: e.target.result,
          };
          chats[currentChat].messages.push(imageMessage);
          appendImageMessage(imageMessage);
        };
        reader.readAsDataURL(file);
      } else {
        // Обработка других файлов
        const fileMessage = {
          text: "",
          sender: "user",
          time: getCurrentTime(),
          date: getCurrentDate(),
          fileName: file.name,
          fileSize: formatFileSize(file.size),
        };
        chats[currentChat].messages.push(fileMessage);
        appendFileMessage(fileMessage);
      }
    }
  }

  // Функция для форматирования размера файла
  function formatFileSize(bytes) {
    const sizes = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
    if (bytes === 0) return "0 Б";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
  }

  // Функция для отображения изображения в чате
  function appendImageMessage(messageObj) {
    const currentDate = messageObj.date || getCurrentDate();

    // Проверяем, изменилась ли дата, и добавляем разделитель при необходимости
    if (lastAppendedDate !== currentDate) {
      appendDateDivider(currentDate);
      lastAppendedDate = currentDate;
    }

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", messageObj.sender);

    // Контейнер для изображения и времени
    const messageContentWrapper = document.createElement("div");
    messageContentWrapper.classList.add("message-wrapper");

    // Контейнер для изображения
    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");

    const img = document.createElement("img");
    img.src = messageObj.imageUrl;
    img.alt = "Изображение";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "10px";

    messageContent.appendChild(img);

    // Временная метка
    const messageTime = document.createElement("div");
    messageTime.classList.add("message-time");
    messageTime.textContent = messageObj.time;

    messageContentWrapper.appendChild(messageContent);
    messageContentWrapper.appendChild(messageTime);

    // Создаем аватар
    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar");

    // Собираем элементы сообщения
    if (messageObj.sender === "user") {
      messageDiv.appendChild(messageContentWrapper);
      messageDiv.appendChild(avatarDiv);
    } else {
      messageDiv.appendChild(avatarDiv);
      messageDiv.appendChild(messageContentWrapper);
    }

    chatMessages.appendChild(messageDiv);

    // Прокручиваем чат вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Функция для отображения файла в чате
  function appendFileMessage(messageObj) {
    const currentDate = messageObj.date || getCurrentDate();

    // Проверяем, изменилась ли дата, и добавляем разделитель при необходимости
    if (lastAppendedDate !== currentDate) {
      appendDateDivider(currentDate);
      lastAppendedDate = currentDate;
    }

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", messageObj.sender);

    // Контейнер для файла и времени
    const messageContentWrapper = document.createElement("div");
    messageContentWrapper.classList.add("message-wrapper");

    // Контейнер для файла
    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");

    const fileIcon = document.createElement("span");
    fileIcon.textContent = "📄";
    fileIcon.style.marginRight = "10px";

    const fileInfo = document.createElement("span");
    fileInfo.textContent = `${messageObj.fileName} (${messageObj.fileSize})`;

    messageContent.appendChild(fileIcon);
    messageContent.appendChild(fileInfo);

    // Временная метка
    const messageTime = document.createElement("div");
    messageTime.classList.add("message-time");
    messageTime.textContent = messageObj.time;

    messageContentWrapper.appendChild(messageContent);
    messageContentWrapper.appendChild(messageTime);

    // Создаем аватар
    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar");

    // Собираем элементы сообщения
    if (messageObj.sender === "user") {
      messageDiv.appendChild(messageContentWrapper);
      messageDiv.appendChild(avatarDiv);
    } else {
      messageDiv.appendChild(avatarDiv);
      messageDiv.appendChild(messageContentWrapper);
    }

    chatMessages.appendChild(messageDiv);

    // Прокручиваем чат вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Вызов функций при инициализации
  loadData().then(() => {
    initializeChat();
    initializeEmojiPicker();

    // Начинаем с экрана выбора чатов на мобильном
    if (isMobile) {
      // Установка начального состояния для мобильной версии
      currentChat = null;
      showMobileChatList();
    }
  });
}

// Экспортируем функцию глобально, если необходимо
window.initChat = initChat;
