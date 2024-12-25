// chat.js

// Получаем необходимые элементы из DOM
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatTopics = document.querySelectorAll(".chat-topic");
const chatList = document.getElementById("chatList");
const quickQuestionsContainer = document.getElementById("quickQuestions");

// Новые элементы для загрузки файлов и смайлов
const attachmentIcon = document.getElementById("attachmentIcon");
const smileyIcon = document.getElementById("smileyIcon");
const fileUploadPopup = document.getElementById("fileUploadPopup");
const closePopup = document.getElementById("closePopup");
const fileInput = document.getElementById("fileInput");
const emojiPicker = document.getElementById("emojiPicker");

// Переменные для хранения данных чатов и вопросов
let currentChat = null; // Будет хранить уникальный id текущего чата
let currentTopic = null; // Будет хранить тему текущего чата
const chats = {}; // Объект для хранения чатов по уникальным id
let currentSearchQuery = ""; // Текущий поисковый запрос

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

// Функция для загрузки JSON-файлов
async function loadData() {
  try {
    // Загрузка intents
    const intentsResponse = await fetch("/data/responses.json"); // Замените путь при необходимости
    if (!intentsResponse.ok)
      throw new Error("Не удалось загрузить справочник ответов.");
    const intentsData = await intentsResponse.json();
    intents = intentsData.intents;

    // Загрузка диалогов
    const dialoguesResponse = await fetch("/data/chat.json"); // Замените путь при необходимости
    if (!dialoguesResponse.ok) throw new Error("Не удалось загрузить диалоги.");
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

  // Обработчик для кнопки "Отправить"
  const sendButton = document.querySelector(".send-button");

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

  // Добавляем обработчики для иконок
  attachmentIcon.addEventListener("click", () => {
    toggleFileUploadPopup(true);
  });

  smileyIcon.addEventListener("click", () => {
    toggleEmojiPicker(true);
  });

  // Закрытие всплывающих окон при клике вне их
  document.addEventListener("click", (e) => {
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
    const headerSearchContainer = document.getElementById(
      "headerSearchContainer"
    );
    const headerSearchIcon = document.getElementById("headerSearchIcon");
    const headerSearchInput = document.getElementById("headerSearchInput");
    if (
      headerSearchContainer &&
      !headerSearchContainer.contains(e.target) &&
      e.target !== headerSearchIcon &&
      e.target !== headerSearchInput
    ) {
      toggleHeaderSearchResults(false);
    }
  });

  // Обработчик для выбора файлов через input
  fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    handleFiles(files);
    fileInput.value = ""; // Очистить input после выбора
    toggleFileUploadPopup(false);
  });

  // Обработчики drag and drop
  const dropArea = document.querySelector(".drop-area");
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

  // Создаем поисковый инпут и иконку в заголовке
  createHeaderSearchBar();
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

// Функция замены существующего чата новым (не требуется при объединении чатов по теме)
// Оставлена без изменений, но может быть удалена, если не используется
function replaceChat(oldChatId, newChatId, themeKey) {
  // Удаляем старый чат из объекта chats
  delete chats[oldChatId];

  // Находим элемент списка чатов и удаляем его
  const oldChatListItem = document.querySelector(
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
      date: formattedDate, // Используем отформатированную дату
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
      date: formattedDate, // Используем отформатированную дату
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
    const previousActiveItem = document.querySelector(
      `.chat-list-item[data-chat="${currentChat}"]`
    );
    if (previousActiveItem) {
      previousActiveItem.classList.remove("active");
    }
  }

  currentChat = chatId;
  currentTopic = chats[chatId].theme;

  // Добавляем класс active к новому чату
  const newActiveItem = document.querySelector(
    `.chat-list-item[data-chat="${chatId}"]`
  );
  if (newActiveItem) {
    newActiveItem.classList.add("active");
  }

  // Отображение сообщений для нового чата
  renderMessages();

  // **Изменено: Скролл вниз при переключении чата**
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom of the chat

  // Инициализация быстрых вопросов для новой темы
  initializeQuickQuestions();
}

// Функция для получения ключа темы (соответствует ключам в quickQuestionsPerTopic)
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
  if (currentChat === null) return; // Если чат не выбран, ничего не делать

  const message = chatInput.value.trim();
  if (message === "") return;

  // Добавляем сообщение пользователя в текущий чат
  const userMessage = {
    text: message,
    sender: "user",
    time: getCurrentTime(),
    date: getCurrentDate(), // Добавляем текущую дату
  };
  chats[currentChat].messages.push(userMessage);
  appendMessage(userMessage); // **Изменено: scrollToBottom по умолчанию = true**

  chatInput.value = "";

  // Получаем ответ от бота
  const botResponse = await getBotResponse(message);
  const botMessage = {
    text: botResponse,
    sender: "bot",
    time: getCurrentTime(),
    date: getCurrentDate(), // Добавляем текущую дату
  };
  chats[currentChat].messages.push(botMessage);
  appendMessage(botMessage); // **Изменено: scrollToBottom по умолчанию = true**
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

// Универсальная функция для отображения сообщений
function appendMessage(messageObj, scrollToBottom = true) {
  // **Изменено: scrollToBottom по умолчанию = true**
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
      '<span class="message-highlight">$1</span>'
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
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(messageContentWrapper);
  } else {
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(messageContentWrapper);
  }

  chatMessages.appendChild(messageDiv);

  // Прокручиваем вниз только если это явно указано
  if (scrollToBottom) {
    // **Изменено: всегда прокручиваем вниз**
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

let lastAppendedDate = null; // Глобальная переменная для отслеживания последней добавленной даты

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
function renderMessages() {
  chatMessages.innerHTML = "";

  if (currentChat === null) return;

  const messages = chats[currentChat].messages;
  lastAppendedDate = null; // Сбрасываем последнюю дату при рендере

  messages.forEach((messageObj) => {
    if (messageObj.imageUrl) {
      appendImageMessage(messageObj);
    } else if (messageObj.fileName) {
      appendFileMessage(messageObj);
    } else {
      appendMessage(messageObj);
    }
  });

  // **Изменено: Скролл вниз после рендеринга всех сообщений**
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom of the chat
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
  const emojiGrid = document.createElement("div");
  emojiGrid.classList.add("emoji-grid");
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
    "🤐",
    "😶",
    "😑",
    "😱",
    "😈",
    "👻",
    "💀",
    "🤖",
    "🎃",
    "👽",
    "👾",
    "🦄",
    "🐱",
    "🐶",
    "🐸",
    "🐵",
    "🐼",
    "🦁",
    "🐯",
  ];
  emojisList.forEach((emoji) => {
    const emojiSpan = document.createElement("span");
    emojiSpan.classList.add("emoji");
    emojiSpan.textContent = emoji;
    emojiGrid.appendChild(emojiSpan);
  });
  emojiPicker.appendChild(emojiGrid);
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
  if (show) {
    fileUploadPopup.classList.add("active");
  } else {
    fileUploadPopup.classList.remove("active");
  }
}

// Функция переключения плашки с эмодзи
function toggleEmojiPicker(show = true) {
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

function updateHighlightedMessages() {
  // Очищаем текущую область сообщений
  chatMessages.innerHTML = "";

  // Проверяем, выбран ли чат
  if (currentChat === null) return;

  const messages = chats[currentChat].messages;

  // Перерисовываем каждое сообщение
  messages.forEach((messageObj) => {
    if (messageObj.imageUrl) {
      appendImageMessage(messageObj);
    } else if (messageObj.fileName) {
      appendFileMessage(messageObj);
    } else {
      appendMessage(messageObj); // Перерисовываем текстовые сообщения
    }
  });
}

// Функция обработки выбранных или перетащенных файлов
function handleFiles(files) {
  for (const file of files) {
    if (file.type.startsWith("image/")) {
      // Обработка изображений
      const reader = new FileReader();
      reader.onload = function (e) {
        const imageMessage = {
          text: "", // Не требуется текст
          sender: "user",
          time: getCurrentTime(),
          date: getCurrentDate(), // Добавляем текущую дату
          imageUrl: e.target.result,
        };
        chats[currentChat].messages.push(imageMessage);
        appendImageMessage(imageMessage);
      };
      reader.readAsDataURL(file);
    } else {
      // Обработка других файлов (симуляция)
      const fileMessage = {
        text: "", // Не требуется текст
        sender: "user",
        time: getCurrentTime(),
        date: getCurrentDate(), // Добавляем текущую дату
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

// Функция для создания и добавления поискового инпута и иконки в заголовок
function createHeaderSearchBar() {
  const chatHeader = document.querySelector(".chat-header");

  const searchContainer = document.createElement("div");
  searchContainer.id = "headerSearchContainer";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "headerSearchInput";
  searchInput.placeholder = "Поиск по чатам...";

  const searchIcon = document.createElement("span");
  searchIcon.id = "headerSearchIcon";
  searchIcon.classList.add("ri-menu-search-line"); // Добавляем класс для CSS-иконки

  // Добавляем инпут и иконку в контейнер
  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchIcon);

  // Создаем контейнер для результатов поиска
  const searchResults = document.createElement("div");
  searchResults.id = "headerSearchResults";

  searchContainer.appendChild(searchResults);

  // Вставляем поисковый контейнер в заголовок
  chatHeader.appendChild(searchContainer);

  // Обработчик ввода в поисковый инпут
  searchInput.addEventListener("input", handleSearchInput);

  // Обработчик клика на иконку поиска
  searchIcon.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query !== "") {
      performSearch(query);
    }
  });
}

// Функция для отображения или скрытия результатов поиска в заголовке
function toggleHeaderSearchResults(show = true) {
  const searchResults = document.getElementById("headerSearchResults");
  if (show) {
    searchResults.style.display = "block";
  } else {
    searchResults.style.display = "none";
  }
}

// Функция для обработки ввода в поисковый инпут
function handleSearchInput(e) {
  const query = e.target.value.trim();
  currentSearchQuery = query; // Обновляем текущий поисковый запрос

  if (query === "") {
    toggleHeaderSearchResults(false); // Скрываем результаты поиска
    updateHighlightedMessages(); // Перерисовываем сообщения без выделения
    updateMatchCounts([]); // **Добавлено: Удаляем все счетчики совпадений**
    return;
  }

  performSearch(query); // Выполняем поиск (например, для отображения результатов в выпадающем списке)
  updateHighlightedMessages(); // Перерисовываем сообщения с выделением
}

// Функция для выполнения поиска
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

// Функция для обновления количества совпадений рядом с чатом
function updateMatchCounts(results) {
  // Удаляем предыдущие счетчики
  const existingCounts = document.querySelectorAll(".match-count");
  existingCounts.forEach((count) => count.remove());

  // Добавляем новые счетчики
  results.forEach((result) => {
    const chatListItem = document.querySelector(
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

// Функция для отображения результатов поиска в выпадающем списке
function displaySearchResults(results, query) {
  const searchResults = document.getElementById("headerSearchResults");
  searchResults.innerHTML = "";

  if (results.length === 0) {
    toggleHeaderSearchResults(false);
    renderMessages(); // Перерисовать сообщения без выделения
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
      toggleHeaderSearchResults(false);
    });
    searchResults.appendChild(item);
  });

  toggleHeaderSearchResults(true);
}

// Функция для навигации к конкретному совпадению
function navigateToMatch(chatId, messageIndex, query) {
  // Переключаемся на нужный чат
  switchChat(chatId);

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

// Функция для экранирования специальных символов в регулярных выражениях
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
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
  messageDiv.appendChild(messageContentWrapper);
  messageDiv.appendChild(avatarDiv);

  chatMessages.appendChild(messageDiv);

  // Прокручиваем чат вниз
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Функция для отображения файла в чате (симуляция)
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
  fileIcon.textContent = "📄"; // Иконка файла
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
  messageDiv.appendChild(messageContentWrapper);
  messageDiv.appendChild(avatarDiv);

  chatMessages.appendChild(messageDiv);

  // Прокручиваем чат вниз
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Вызов функций при инициализации страницы
window.onload = () => {
  loadData();
  initializeChat();
  initializeEmojiPicker();
};
