document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById('imageContainer');
    const indicatorsContainer = document.getElementById('indicatorsContainer');
    const article = "628210"; // Артикул
    const imagesFolder = "images/"; // Путь к папке с изображениями

    // Функция для проверки наличия файла
    async function fileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    // Функция для загрузки всех доступных изображений
    async function loadImages(article, maxImages = 50) {
        const images = [];
        for (let i = 0; i < maxImages; i++) {
            const imageName = i === 0
                ? `${article}.jpg`
                : `${article}_${i}.jpg`;
            const imagePath = `${imagesFolder}${imageName}`;

            if (await fileExists(imagePath)) {
                images.push(imagePath);
            } else {
                break;
            }
        }
        return images;
    }

    // Функция рендера изображений
    async function renderImages() {
        const images = await loadImages(article);

        if (images.length === 0) {
            container.innerHTML = "<p>Нет изображений для данного артикула.</p>";
            return;
        }

        // Создаём элементы <img> для всех найденных изображений
        images.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            if (index === 0) img.classList.add('active');
            container.appendChild(img);
        });

        // Создаём индикаторы
        indicatorsContainer.innerHTML = '';
        images.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'indicator';
            indicator.textContent = index === 0 ? '●' : '○'; // Заполненный или пустой кружочек
            if (index === 0) indicator.classList.add('active');
            indicatorsContainer.appendChild(indicator);
        });

        // Добавляем обработчики событий для индикаторов
        indicatorsContainer.querySelectorAll('.indicator').forEach((ind, i) => {
            ind.addEventListener('click', () => {
                // Обновляем активное изображение
                container.querySelectorAll('img').forEach(img => img.classList.remove('active'));
                container.querySelectorAll('img')[i].classList.add('active');

                // Обновляем индикаторы
                indicatorsContainer.querySelectorAll('.indicator').forEach(ind => ind.classList.remove('active'));
                ind.classList.add('active');
            });
        });

        // Добавляем обработчик события мыши
        container.addEventListener('mousemove', function (e) {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left; // Позиция курсора внутри контейнера
            const segmentWidth = rect.width / images.length; // Ширина одного сегмента
            const index = Math.min(
                Math.floor(x / segmentWidth), // Определяем сегмент
                images.length - 1 // Не выходим за пределы массива
            );

            // Обновляем активное изображение
            container.querySelectorAll('img').forEach(img => img.classList.remove('active'));
            container.querySelectorAll('img')[index].classList.add('active');

            // Обновляем индикаторы
            indicatorsContainer.querySelectorAll('.indicator').forEach((ind, i) => {
                ind.classList.toggle('active', i === index);
                ind.textContent = i === index ? '●' : '○'; // Обновляем символ
            });
        });

        // Показываем индикаторы при входе мыши
        container.addEventListener('mouseenter', () => {
            indicatorsContainer.classList.remove('hidden');
        });

        // Скрываем индикаторы при выходе мыши
        container.addEventListener('mouseleave', () => {
            indicatorsContainer.classList.add('hidden');
        });
    }

    renderImages();
});

document.addEventListener('contextmenu', function (event) {
    if (event.target.tagName === 'IMG') {
        event.preventDefault(); // Отключает стандартное контекстное меню
    }
});