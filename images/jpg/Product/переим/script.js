document.addEventListener("DOMContentLoaded", function () {
  const gallery = document.getElementById("gallery");
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modalImg");
  const close = document.getElementById("close");
  const overlay = document.getElementById("overlay");
  const nav = document.querySelector("nav"); // Выбираем навигацию

  // Отключаем стандартное перетаскивание изображения
  modalImg.setAttribute("draggable", "false");

  // Предотвращаем стандартное поведение touchmove
  modalImg.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );

  // Базовый адрес ресурса
  const baseURL = "https://zykova-nat.ru/Image/";

  // Массив с путями к изображениям
  const images = [
    "Image/33.jpg",
    "Image/171.jpg",
    "Image/49.jpg",
    "Image/84.jpg",
    "Image/163.jpg",
    "Image/39.jpg",
    "Image/164.jpg",
    "Image/22.jpg",
    "Image/75.jpg",
    "Image/178.jpg",
    "Image/174.jpg",
    "Image/162.jpg",
    "Image/13.jpg",
    "Image/92.jpg",
    "Image/14.jpg",
    "Image/57.jpg",
    "Image/96.jpg",
    "Image/140.jpg",
    "Image/155.jpg",
    "Image/87.jpg",
    "Image/79.jpg",
    "Image/156.jpg",
    "Image/34.jpg",
    "Image/108.jpg",
    "Image/27.jpg",
    "Image/18.jpg",
    "Image/59.jpg",
    "Image/58.jpg",
    "Image/157.jpg",
    "Image/65.jpg",
    "Image/120.jpg",
    "Image/74.jpg",
    "Image/86.jpg",
    "Image/138.jpg",
    "Image/64.jpg",
    "Image/119.jpg",
    "Image/161.jpg",
    "Image/130.jpg",
    "Image/73.jpg",
    "Image/26.jpg",
    "Image/66.jpg",
    "Image/154.jpg",
    "Image/104.jpg",
    "Image/165.jpg",
    "Image/12.jpg",
    "Image/158.jpg",
    "Image/97.jpg",
    "Image/89.jpg",
    "Image/124.jpg",
    "Image/63.jpg",
    "Image/36.jpg",
    "Image/71.jpg",
    "Image/98.jpg",
    "Image/167.jpg",
    "Image/9.jpg",
    "Image/16.jpg",
    "Image/93.jpg",
    "Image/23.jpg",
    "Image/19.jpg",
    "Image/143.jpg",
    "Image/175.jpg",
    "Image/11.jpg",
    "Image/141.jpg",
    "Image/99.jpg",
    "Image/94.jpg",
    "Image/17.jpg",
    "Image/85.jpg",
    "Image/153.jpg",
    "Image/114.jpg",
    "Image/105.jpg",
    "Image/180.jpg",
    "Image/81.jpg",
    "Image/28.jpg",
    "Image/30.jpg",
    "Image/131.jpg",
    "Image/136.jpg",
    "Image/160.jpg",
    "Image/7.jpg",
    "Image/38.jpg",
    "Image/88.jpg",
    "Image/62.jpg",
    "Image/21.jpg",
    "Image/144.jpg",
    "Image/133.jpg",
    "Image/41.jpg",
    "Image/139.jpg",
    "Image/67.jpg",
    "Image/82.jpg",
    "Image/4.jpg",
    "Image/152.jpg",
    "Image/60.jpg",
    "Image/76.jpg",
    "Image/181.jpg",
    "Image/150.jpg",
    "Image/101.jpg",
    "Image/100.jpg",
    "Image/147.jpg",
    "Image/121.jpg",
    "Image/2.jpg",
    "Image/129.jpg",
    "Image/3.jpg",
    "Image/10.jpg",
    "Image/137.jpg",
    "Image/83.jpg",
    "Image/159.jpg",
    "Image/142.jpg",
    "Image/48.jpg",
    "Image/169.jpg",
    "Image/52.jpg",
    "Image/8.jpg",
    "Image/80.jpg",
    "Image/44.jpg",
    "Image/103.jpg",
    "Image/172.jpg",
    "Image/55.jpg",
    "Image/115.jpg",
    "Image/173.jpg",
    "Image/118.jpg",
    "Image/132.jpg",
    "Image/111.jpg",
    "Image/117.jpg",
    "Image/47.jpg",
    "Image/69.jpg",
    "Image/20.jpg",
    "Image/61.jpg",
    "Image/125.jpg",
    "Image/35.jpg",
    "Image/146.jpg",
    "Image/95.jpg",
    "Image/112.jpg",
    "Image/179.jpg",
    "Image/90.jpg",
    "Image/46.jpg",
    "Image/170.jpg",
    "Image/6.jpg",
    "Image/126.jpg",
    "Image/37.jpg",
    "Image/54.jpg",
    "Image/42.jpg",
    "Image/149.jpg",
    "Image/25.jpg",
    "Image/134.jpg",
    "Image/68.jpg",
    "Image/72.jpg",
    "Image/106.jpg",
    "Image/40.jpg",
    "Image/31.jpg",
    "Image/113.jpg",
    "Image/151.jpg",
    "Image/168.jpg",
    "Image/110.jpg",
    "Image/107.jpg",
    "Image/109.jpg",
    "Image/70.jpg",
    "Image/29.jpg",
    "Image/51.jpg",
    "Image/135.jpg",
    "Image/91.jpg",
    "Image/116.jpg",
    "Image/123.jpg",
    "Image/53.jpg",
    "Image/77.jpg",
    "Image/177.jpg",
    "Image/145.jpg",
    "Image/43.jpg",
    "Image/102.jpg",
    "Image/56.jpg",
    "Image/127.jpg",
    "Image/122.jpg",
    "Image/166.jpg",
    "Image/148.jpg",
    "Image/15.jpg",
    "Image/78.jpg",
    "Image/32.jpg",
    "Image/176.jpg",
    "Image/128.jpg",
    "Image/5.jpg",
    "Image/45.jpg",
    "Image/50.jpg",
    "Image/24.jpg",
  ];

  // Текущий индекс отображаемого изображения
  let currentIndex = -1;
  // Координата начала касания или нажатия
  let startX = null;

  // Функция анимированного перелистывания изображения (эффект слайда)
  function slideToImage(newIndex, direction) {
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    currentIndex = newIndex;

    const fileName = images[currentIndex].split("/").pop();
    const finalUrl = `${baseURL}${fileName}`;

    modalImg.style.transition = "transform 0.3s ease-out";
    modalImg.style.transform =
      direction === "next" ? "translateX(-100%)" : "translateX(100%)";

    setTimeout(() => {
      modalImg.src = finalUrl;
      modalImg.style.transition = "none";
      modalImg.style.transform =
        direction === "next" ? "translateX(100%)" : "translateX(-100%)";
      void modalImg.offsetWidth;
      modalImg.style.transition = "transform 0.3s ease-out";
      modalImg.style.transform = "translateX(0)";
    }, 300);
  }

  // Функция для закрытия модального окна
  function closeModal() {
    modal.classList.remove("show");
    overlay.classList.remove("show");
    overlay.style.backdropFilter = "";
    setTimeout(() => {
      modalImg.src = "";
    }, 300);
    nav.classList.remove("hidden-nav");
    close.classList.remove("show"); // Скрываем крестик
  }

  // Формирование галереи: создаём элемент <img> для каждого изображения
  images.forEach((src, index) => {
    const fileName = src.split("/").pop();
    const finalUrl = `${baseURL}${fileName}`;

    let img = document.createElement("img");
    img.src = finalUrl;
    img.alt = "Gallery Image";
    img.classList.add("gallery-item");
    img.setAttribute("draggable", "false");
    gallery.appendChild(img);

    img.addEventListener("error", function () {
      console.error("Ошибка загрузки изображения:", finalUrl);
    });

    // При клике открываем модальное окно и запоминаем текущий индекс
    img.addEventListener("click", function () {
      currentIndex = index;
      modalImg.src = `${baseURL}${fileName}`;
      overlay.classList.add("show");
      modal.classList.add("show");
      nav.classList.add("hidden-nav");
      overlay.style.backdropFilter = "blur(10px)";
      close.classList.add("show"); // Показываем крестик при открытии фото
    });
  });

  // Закрытие модального окна по клику на оверлей и по клику на крестик
  overlay.addEventListener("click", closeModal);
  close.addEventListener("click", closeModal);

  // Обработка клавиш для навигации
  document.addEventListener("keydown", function (event) {
    if (!modal.classList.contains("show")) return;
    if (event.key === "ArrowLeft") {
      slideToImage(currentIndex - 1, "prev");
    } else if (event.key === "ArrowRight") {
      slideToImage(currentIndex + 1, "next");
    } else if (event.key === "Escape") {
      closeModal();
    }
  });

  // Обработка событий для мыши (десктоп)
  modalImg.addEventListener("mousedown", function (e) {
    startX = e.clientX;
    e.preventDefault();
  });
  document.addEventListener("mouseup", function (e) {
    if (startX === null) return;
    let dx = e.clientX - startX;
    if (dx === 0) {
      // Ничего не делаем
    } else if (dx > 0) {
      slideToImage(currentIndex - 1, "prev");
    } else {
      slideToImage(currentIndex + 1, "next");
    }
    startX = null;
  });

  // Обработка событий для touch (мобильные устройства)
  modalImg.addEventListener("touchstart", function (e) {
    startX = e.touches[0].clientX;
  });
  modalImg.addEventListener("touchend", function (e) {
    if (startX === null) return;
    let dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 10) {
      // Тап по фото не закрывает окно
    } else if (dx > 10) {
      slideToImage(currentIndex - 1, "prev");
    } else if (dx < -10) {
      slideToImage(currentIndex + 1, "next");
    }
    startX = null;
  });
  modalImg.addEventListener("touchcancel", function () {
    startX = null;
  });
});
