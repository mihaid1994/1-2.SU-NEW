// Функция инициализации внутри переданного root
window.initRegisterFunction = function (root) {
  const step1 = root.getElementById("step-1");
  const step2 = root.getElementById("step-2");
  const step3 = root.getElementById("step-3");

  const getCodeButton = root.getElementById("get-code-button");
  const phoneNumberInput = root.getElementById("phone-number");
  // Удалены:
  // const termsCheckbox = root.getElementById("terms-checkbox");
  // const termsMessage = root.getElementById("terms-message");

  const displayPhone = root.getElementById("display-phone");
  const verificationCodeInput = root.getElementById("verification-code");
  const timerSpan = root.getElementById("timer");
  const resendCodeButton = root.getElementById("resend-code-button");
  const codeMessage = root.getElementById("code-message");

  const tabButtons = root.querySelectorAll(".tab-button");
  const clientForm = root.getElementById("client-form");
  const companyForm = root.getElementById("company-form");

  const clientPhoneInput = root.getElementById("client-phone");
  const companyPhoneInput = root.getElementById("company-phone");

  const clientRegistrationForm = root.getElementById(
    "client-registration-form"
  );
  const registrationForm = root.getElementById("registration-form");

  const clientPersonalDataCheckbox = root.getElementById(
    "client-personal-data"
  );
  const clientDataMessage = root.getElementById("client-data-message");
  const companyPersonalDataCheckbox = root.getElementById("personal-data");
  const companyDataMessage = root.getElementById("company-data-message");

  // Новые элементы для сторонних сервисов и альтернативного входа
  const vkLogin = root.getElementById("vk-login");
  const yandexLogin = root.getElementById("yandex-login");
  const loginButton = root.getElementById("login-button");
  const toggleAlternativeLoginButton = root.getElementById(
    "toggle-alternative-login"
  );
  const alternativeLogin = root.getElementById("alternative-login");
  const usernameInput = root.getElementById("username");
  const passwordInput = root.getElementById("password");

  // Этап 1: Получение кода
  getCodeButton.addEventListener("click", function () {
    const phone = phoneNumberInput.value.trim();
    if (!validatePhone(phone)) {
      showMessage(
        // Используйте соответствующий элемент для отображения сообщений, если требуется
        // Например, можно создать отдельное сообщение для ошибок телефона
        codeMessage, // Или другой элемент, который отображает ошибки на этапе 1
        "Пожалуйста, введите корректный номер телефона."
      );
      return;
    }
    // Удалена проверка согласия:
    // if (!termsCheckbox.classList.contains("checked")) {
    //   showMessage(
    //     termsMessage,
    //     "Требуется согласие с условиями использования."
    //   );
    //   return;
    // }

    // Здесь должен быть AJAX запрос на сервер для отправки SMS
    // Например: sendSMS(phone).then(...)

    // Переход к этапу 2
    displayPhone.textContent = "+7 " + phone;
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    startTimer();
  });

  // Этап 2: Верификация кода
  verificationCodeInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, ""); // Удаляем все нецифровые символы

    if (value.length > 3) {
      value = value.slice(0, 6); // Ограничиваем до 6 цифр
      value = value.slice(0, 3) + "-" + value.slice(3);
    }

    e.target.value = value;

    if (value.length === 7) {
      // 6 цифр + дефис
      // Здесь должен быть AJAX запрос на сервер для проверки кода
      // Например: verifySMSCode(value.replace('-', '')).then(...)

      // Переход к этапу 3
      step2.classList.add("hidden");
      step3.classList.remove("hidden");

      // Установка номера телефона в формы
      clientPhoneInput.value = phoneNumberInput.value;
      companyPhoneInput.value = phoneNumberInput.value;
    }
  });

  function startTimer() {
    let timeLeft = 30; // 30 секунд
    resendCodeButton.classList.add("unclickable"); // Делаем кнопку некликабельной
    resendCodeButton.textContent = `Запросить новый код через 00:${timeLeft}`; // Обновляем текст

    const timerInterval = setInterval(() => {
      timeLeft--;
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      timerSpan.textContent = `${mins}:${secs}`;
      resendCodeButton.textContent = `Запросить новый код через ${mins}:${secs}`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        resendCodeButton.classList.remove("unclickable"); // Убираем некликабельность
        resendCodeButton.textContent = "Отправить повторно"; // Возвращаем текст
        resendCodeButton.disabled = false; // На всякий случай активируем кнопку
      }
    }, 1000);
  }

  resendCodeButton.addEventListener("click", function () {
    if (resendCodeButton.classList.contains("unclickable")) {
      console.log("Кнопка уже некликабельна");
      return;
    }

    console.log("Кнопка становится некликабельной");
    resendCodeButton.classList.add("unclickable"); // Добавляем класс
    resendCodeButton.style.backgroundColor = "#d3d3d3"; // Серая кнопка (для надежности)
    startTimer();
  });

  // Обработка вкладок "ДА" и "НЕТ"
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Удаляем активный класс у всех кнопок
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      // Добавляем активный класс текущей кнопке
      this.classList.add("active");

      if (this.getAttribute("data-value") === "yes") {
        clientForm.classList.remove("hidden");
        companyForm.classList.add("hidden");
      } else {
        clientForm.classList.add("hidden");
        companyForm.classList.remove("hidden");
      }
    });
  });

  // Валидация и отправка формы регистрации для клиентов
  clientRegistrationForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Проверка чекбокса согласия
    if (!clientPersonalDataCheckbox.classList.contains("checked")) {
      showMessage(
        clientDataMessage,
        "Пожалуйста, согласитесь на обработку персональных данных."
      );
      return;
    }

    // Сбор данных формы
    const formData = new FormData(clientRegistrationForm);
    // Здесь должен быть AJAX запрос на сервер для регистрации клиента
    // Например: registerClient(formData).then(...)

    alert("Заявка успешно отправлена!");
    // Перезагрузка или перенаправление
    window.location.reload();
  });

  // Валидация и отправка формы регистрации для юридических лиц
  registrationForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Проверка чекбокса согласия
    if (!companyPersonalDataCheckbox.classList.contains("checked")) {
      showMessage(
        companyDataMessage,
        "Пожалуйста, согласитесь на обработку персональных данных."
      );
      return;
    }

    // Сбор данных формы
    const formData = new FormData(registrationForm);
    // Здесь должен быть AJAX запрос на сервер для регистрации
    // Например: registerCompany(formData).then(...)

    alert("Регистрация успешно завершена!");
    // Перезагрузка или перенаправление
    window.location.reload();
  });

  // Автоформатирование номера телефона
  const phoneInputs = root.querySelectorAll(".phone-number");
  phoneInputs.forEach((input) => {
    input.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");
      if (value.startsWith("7")) {
        value = value.substring(1);
      }
      let formatted = "";
      if (value.length > 0) {
        formatted += value.substring(0, 3);
      }
      if (value.length >= 4) {
        formatted += " " + value.substring(3, 6);
      }
      if (value.length >= 7) {
        formatted += "-" + value.substring(6, 8);
      }
      if (value.length >= 9) {
        formatted += "-" + value.substring(8, 10);
      }
      e.target.value = formatted;
    });
  });

  // Функции валидации
  function validatePhone(phone) {
    const phoneRegex = /^\d{3}\s\d{3}-\d{2}-\d{2}$/;
    return phoneRegex.test(phone);
  }

  // Функция обновления таймера
  function updateTimerDisplay(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    timerSpan.textContent = `${mins}:${secs}`;
  }

  // Устанавливаем вкладку "ДА" по умолчанию
  const defaultTab = root.querySelector('.tab-button[data-value="yes"]');
  if (defaultTab) {
    defaultTab.click();
  }

  // Функция для отображения сообщений
  function showMessage(element, message) {
    element.textContent = message;
    element.classList.remove("hidden");
    setTimeout(() => {
      element.classList.add("hidden");
    }, 3000);
  }

  // Обработка кастомных чекбоксов
  const customCheckboxes = root.querySelectorAll(".custom-checkbox");
  customCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("click", function () {
      this.classList.toggle("checked");
      this.classList.toggle("unchecked");
    });
  });

  // Обработчики для сторонних сервисов входа
  vkLogin.addEventListener("click", function () {
    simulateThirdPartyLogin();
  });

  yandexLogin.addEventListener("click", function () {
    simulateThirdPartyLogin();
  });

  // Обработчик для альтернативного входа с логином и паролем
  loginButton.addEventListener("click", function () {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username !== "" && password !== "") {
      // Изменил условие с || на &&
      simulateLogin();
    } else {
      alert("Пожалуйста, введите логин и пароль.");
    }
  });

  // Обработчик для кнопки "Войти, используя логин и пароль"
  toggleAlternativeLoginButton.addEventListener("click", function () {
    alternativeLogin.classList.toggle("hidden");
  });

  // Функция имитации успешного входа через альтернативный метод
  function simulateLogin() {
    // Здесь можно добавить дополнительные действия при успешном входе
    window.location.reload();

    // Установка номера телефона в формы регистрации
    const phone = phoneNumberInput.value.trim();
    clientPhoneInput.value = phone || "000 000-00-00";
    companyPhoneInput.value = phone || "000 000-00-00";
  }

  // Функция имитации успешного входа через сторонние сервисы
  function simulateThirdPartyLogin() {
    // Здесь можно добавить дополнительные действия при успешном входе
    window.location.reload();

    // Установка номера телефона в формы регистрации (можно оставить пустым или задать дефолтное значение)
    clientPhoneInput.value = "000 000-00-00";
    companyPhoneInput.value = "000 000-00-00";
  }
};

/**
 * Обёрточная функция, которую вызовет GComm_TabManager.
 * Она просто пробрасывает shadowRoot внутрь initRegisterFunction.
 */
window.initRegisterShadow = async function (shadowRoot) {
  await window.initRegisterFunction(shadowRoot);
};
