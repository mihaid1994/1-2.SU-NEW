/**
 * GComm_TabOpener
 *
 * Этот модуль позволяет дочерним страницам отправлять команды на открытие вкладок в родительскую страницу.
 * Для этого необходимо добавить специальные атрибуты к ссылкам или кнопкам, которые должны инициировать открытие вкладок.
 *
 * Специальные атрибуты:
 * - data-open-tab="true": Указывает, что элемент должен открывать вкладку.
 * - data-tab-title="Заголовок вкладки": Указывает заголовок для новой вкладки.
 * - data-tab-url="/pages/example.html": Указывает URL для загрузки в новой вкладке.
 */

(function (global) {
  // Уникальный префикс для всех компонентов системы
  const PREFIX = "GComm";

  /**
   * GComm_TabOpener
   *
   * Класс, отвечающий за обнаружение специальных элементов и отправку команд на открытие вкладок.
   */
  class GComm_TabOpener {
    /**
     * Конструктор класса GComm_TabOpener.
     * Инициализирует обработку элементов с атрибутами data-open-tab.
     */
    constructor() {
      this.init();
    }

    /**
     * init
     *
     * Инициализирует обработку специальных элементов.
     */
    init() {
      document.addEventListener("DOMContentLoaded", () => {
        this.handleInternalLinks();
      });
    }

    /**
     * handleInternalLinks
     *
     * Находит все ссылки и кнопки с атрибутом data-open-tab="true" и добавляет им обработчики событий.
     */
    handleInternalLinks() {
      // Делегирование события клика на body для обработки всех текущих и будущих элементов
      document.body.addEventListener("click", (e) => {
        const element = e.target.closest(
          'span[data-open-tab="true"], button[data-open-tab="true"], a[data-open-tab="true"]'
        );
        if (element) {
          e.preventDefault(); // Предотвращаем стандартное поведение ссылки или кнопки

          // Извлекаем заголовок и URL из атрибутов data
          const title =
            element.getAttribute("data-tab-title") ||
            element.textContent.trim() ||
            "Новая вкладка";
          const url =
            element.getAttribute("data-tab-url") ||
            element.getAttribute("href");

          if (url) {
            if (
              global.GComm_MessageBus &&
              typeof global.GComm_MessageBus.GComm_sendCommand === "function"
            ) {
              // Отправляем команду на открытие вкладки в родительской странице
              global.GComm_MessageBus.GComm_sendCommand(
                "GComm_parent",
                "GComm_openTab",
                {
                  title: title,
                  url: url,
                }
              );

              console.log(
                `[${PREFIX}_TabOpener] Команда на открытие вкладки "${title}" отправлена с URL "${url}".`
              );
            } else {
              console.warn(
                `[${PREFIX}_TabOpener] GComm_MessageBus недоступен. Открытие вкладки "${title}" не выполнено.`
              );
              // Альтернативное поведение: открытие ссылки в новом окне или вкладке
              window.open(url, "_blank");
            }
          } else {
            console.error(
              `[${PREFIX}_TabOpener] Элемент не содержит атрибут data-tab-url или href для открытия вкладки.`
            );
          }
        }
      });
    }
  }

  /**
   * Инициализация GComm_TabOpener
   */
  if (global.GComm_MessageBus) {
    global.GComm_TabOpener = new GComm_TabOpener();
  } else {
    console.error(
      `[${PREFIX}_TabOpener] GComm_MessageBus не инициализирован. TabOpener не будет создан.`
    );
  }
})(window); // /js/tabs-from.js
