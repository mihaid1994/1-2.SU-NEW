// Функция для обновления списка
function updateStockSelect() {
    const select = document.getElementById('stock-select');
    const createCartOption = select.querySelector('option[value="create-cart"]');
    const defaultOption = select.querySelector('option[value=""]');
    const selectedValue = select.value;

    // Запрос списка корзин у родительского окна
    try {
        window.parent.postMessage({ command: 'getActiveCarts' }, '*');
    } catch (error) {
        console.error('Ошибка отправки сообщения родительскому окну:', error);
        return;
    }

    // Очистка списка
    select.innerHTML = '';
    if (defaultOption) {
        select.appendChild(defaultOption);
    } else {
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Выберите корзину';
        select.appendChild(defaultOpt);
    }

    // Добавление "Создать корзину"
    if (!createCartOption) {
        const createOption = document.createElement('option');
        createOption.value = 'create-cart';
        createOption.textContent = 'Создать корзину';
        select.appendChild(createOption);
    } else {
        select.appendChild(createCartOption);
    }

    // Восстановление выбора
    if (selectedValue && select.querySelector(`option[value="${selectedValue}"]`)) {
        select.value = selectedValue;
    } else {
        select.value = '';
    }
}

// Обработка события выбора
document.getElementById('stock-select').addEventListener('change', (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === 'create-cart') {
        try {
            window.parent.postMessage(
                { command: 'createTab', data: { title: 'Новая корзина', url: '/cart.html', isCart: true } },
                '*'
            );
        } catch (error) {
            console.error('Ошибка при создании новой корзины:', error);
        }
    }
});

// Обработчик сообщений от родительского окна
window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) {
        console.warn('Неправильный источник сообщения:', event.origin);
        return;
    }

    const { command, data } = event.data;

    if (command === 'updateActiveCarts') {
        const select = document.getElementById('stock-select');
        const selectedValue = select.value;

        // Очистка списка
        select.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Выберите корзину';
        select.appendChild(defaultOption);

        // Добавление корзин из обновленного списка
        Object.keys(data).forEach((tabId) => {
            const cartName = data[tabId];
            const option = document.createElement('option');
            option.value = tabId;
            option.textContent = cartName;
            select.appendChild(option);
        });

        // Добавление "Создать корзину"
        const createOption = document.createElement('option');
        createOption.value = 'create-cart';
        createOption.textContent = 'Создать корзину';
        select.appendChild(createOption);

        // Восстановление выбора
        if (selectedValue && select.querySelector(`option[value="${selectedValue}"]`)) {
            select.value = selectedValue;
        } else {
            select.value = '';
        }
    }
});

// Обновление списка при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateStockSelect();

    // Проверка доступности родительского окна и отправка начального запроса
    try {
        window.parent.postMessage({ command: 'getActiveCarts' }, '*');
    } catch (error) {
        console.error('Ошибка при инициализации общения с родительским окном:', error);
    }
});
