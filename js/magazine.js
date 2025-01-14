// Функция инициализации внутри переданного root
window.initMagazineFunction = function (root) {
  const magazineGrid = root.getElementById("magazineGrid");
  const modal = root.getElementById("imageModal");
  const modalImg = root.getElementById("modalImage");
  const captionText = root.getElementById("caption");
  const closeBtn = root.querySelector(".close");

  const issues = [
    {
      title: "Энергомикс №3(48)/2024",
      image: "https://energomix.ru/images/journals/2024/3(48)2024/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2024_348.pdf",
    },
    {
      title: "Энергомикс №2(47)/2024",
      image: "https://energomix.ru/images/journals/2024/2(47)2024/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2024_247.pdf",
    },
    {
      title: "Энергомикс №1(46)/2024",
      image: "https://energomix.ru/images/journals/2024/1(46)2024/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2024_146.pdf",
    },
    {
      title: "Энергомикс №4(45)/2023",
      image: "https://energomix.ru/images/journals/2023/4(45)2023/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2023_445.pdf",
    },
    {
      title: "Энергомикс №3(44)/2023",
      image: "https://energomix.ru/images/journals/2023/3(44)2023/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2023_344.pdf",
    },
    {
      title: "Энергомикс №2(43)/2023",
      image: "https://energomix.ru/images/journals/2023/2(43)2023/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2023_243.pdf",
    },
    {
      title: "Энергомикс №1(42)/2023",
      image: "https://energomix.ru/images/journals/2023/1(42)2023/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2023_142.pdf",
    },
    {
      title: "Энергомикс №4(41)/2022",
      image: "https://energomix.ru/images/journals/2022/4(41)2022/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2022_441.pdf",
    },
    {
      title: "Энергомикс №3(40)/2022",
      image: "https://energomix.ru/images/journals/2022/3(40)2022/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2022_340.pdf",
    },
    {
      title: "Энергомикс №2(39)/2022",
      image: "https://energomix.ru/images/journals/2022/2(39)2022/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2022_239.pdf",
    },
    {
      title: "Энергомикс №1(38)/2022",
      image: "https://energomix.ru/images/journals/2022/1(38)2022/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2022_138.pdf",
    },
    {
      title: "Энергомикс №4(37)/2021",
      image: "https://energomix.ru/images/journals/2021/4(37)2021/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2021_437.pdf",
    },
    {
      title: "Энергомикс №3(36)/2021",
      image: "https://energomix.ru/images/journals/2021/3(36)2021/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2021_336.pdf",
    },
    {
      title: "Энергомикс №2(35)/2021",
      image: "https://energomix.ru/images/journals/2021/2(35)2021/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2021_235.pdf",
    },
    {
      title: "ЭнергоMIX №1(34)/2021",
      image: "https://energomix.ru/images/journals/2021/1(34)2021/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2021_134.pdf",
    },
    {
      title: "ЭнергоMIX №4(33)/2020",
      image: "https://energomix.ru/images/journals/2020/4(33)2020/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2020_433.pdf",
    },
    {
      title: "ЭнергоMIX №3(32)/2020",
      image: "https://energomix.ru/images/journals/2020/3(32)2020/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2020_332.pdf",
    },
    {
      title: "ЭнергоMIX №1(30)-2(31)/2020",
      image:
        "https://energomix.ru/images/journals/2020/1(30)-2(31)2020/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2020_130-231.pdf",
    },
    {
      title: "ЭнергоMIX №4(29)/2019",
      image: "https://energomix.ru/images/journals/2019/4(29)2019/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2019_429.pdf",
    },
    {
      title: "ЭнергоMIX №3(28)/2019",
      image: "https://energomix.ru/images/journals/2019/3(28)2019/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2019_328.pdf",
    },
    {
      title: "ЭнергоMIX №2(27)/2019",
      image: "https://energomix.ru/images/journals/2019/2(27)2019/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2019_227.pdf",
    },
    {
      title: "ЭнергоMIX №1(26)/2019",
      image: "https://energomix.ru/images/journals/2019/1(26)2019/shot.png",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2019_126.pdf",
    },
    {
      title: "ЭнергоMIX №4(25)/2018.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2018_425.pdf",
    },
    {
      title: "ЭнергоMIX №3(24)/2018.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2018_324.pdf",
    },
    {
      title: "ЭнергоMIX №2(23)/2018.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2018_223.pdf",
    },
    {
      title: "ЭнергоMIX №1(22)/2018.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2018_122.pdf",
    },
    {
      title: "ЭнергоMIX №4(21)/2017.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2017_421.pdf",
    },
    {
      title: "ЭнергоMIX №3(20)/2017.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2017_320.pdf",
    },
    {
      title: "ЭнергоMIX №2(19)/2017.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2017_219.pdf",
    },
    {
      title: "ЭнергоMIX №1(18)/2017.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2017_118.pdf",
    },
    {
      title: "ЭнергоMIX №4(17)/2016.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2016_417.pdf",
    },
    {
      title: "ЭнергоMIX №3(16)/2016.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2016_316.pdf",
    },
    {
      title: "ЭнергоMIX №2(15)/2016.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2016_215.pdf",
    },
    {
      title: "ЭнергоMIX №1(14)/2016.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2016_114.pdf",
    },
    {
      title: "ЭнергоMIX №4(13)/2015.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2015_413.pdf",
    },
    {
      title: "ЭнергоMIX №3(12)/2015.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2015_312.pdf",
    },
    {
      title: "ЭнергоMIX №2(11)/2015.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2015_211.pdf",
    },
    {
      title: "ЭнергоMIX №1(10)/2015.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2015_110.pdf",
    },
    {
      title: "ЭнергоMIX №4(9)/2014.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2014_49.pdf",
    },
    {
      title: "ЭнергоMIX №3(8)/2014.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2014_38.pdf",
    },
    {
      title: "ЭнергоMIX №2(7)/2014.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2014_27.pdf",
    },
    {
      title: "ЭнергоMIX №1(6)/2014.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2014_16.pdf",
    },
    {
      title: "ЭнергоMIX №4(5)/2013.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2013_45.pdf",
    },
    {
      title: "ЭнергоMIX №3(4)/2013.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2013_34.pdf",
    },
    {
      title: "ЭнергоMIX №2(3)/2013.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2013_23.pdf",
    },
    {
      title: "ЭнергоMIX №1(2)/2013.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2013_12.pdf",
    },
    {
      title: "ЭнергоMIX №1(1)/2012.pdf",
      image: "",
      pdf: "https://energomix.ru/images/files/_attachments/journals/energomiks-2012_11.pdf",
    },
  ];

  // Создаем функцию для создания одной карточки
  function createCard(issue) {
    const card = document.createElement("div");
    card.className = "magazine-card";
    let linkURL;
    if (issue.image) {
      linkURL = issue.image.replace(/shot\.png$/, "");
    } else {
      linkURL = issue.pdf;
      card.classList.add("small-card");
    }

    if (issue.image) {
      const linkImg = document.createElement("a");
      linkImg.href = linkURL;
      linkImg.target = "_blank";
      linkImg.rel = "noopener noreferrer";
      linkImg.className = "pop-up_img";

      const img = document.createElement("img");
      img.src = issue.image;
      img.alt = issue.title;
      img.title = issue.title;
      img.onerror = function () {
        this.src = "/images/default-cover.png";
      };

      linkImg.appendChild(img);
      card.appendChild(linkImg);
    }

    const cardInfo = document.createElement("div");
    cardInfo.className = "card-info";

    const linkTitle = document.createElement("a");
    linkTitle.href = linkURL;
    linkTitle.target = "_blank";
    linkTitle.rel = "noopener noreferrer";
    linkTitle.className = "card-title";
    linkTitle.textContent = issue.title;

    const linkPdf = document.createElement("a");
    linkPdf.href = issue.pdf;
    linkPdf.target = "_blank";
    linkPdf.rel = "noopener noreferrer";
    linkPdf.className = "btn btn_pdf";
    linkPdf.textContent = ".pdf";

    cardInfo.appendChild(linkTitle);
    cardInfo.appendChild(linkPdf);
    card.appendChild(cardInfo);
    return card;
  }

  // Логика размещения: если карточка без изображения, то 4 таких надо поместить в один "большой" блок
  const smallCardsBuffer = [];
  issues.forEach((issue) => {
    if (!issue.image) {
      // Сохраняем small-card во временный массив
      smallCardsBuffer.push(createCard(issue));
      // Когда накопим 4, создаем специальный контейнер и добавляем в него эти 4 small-card
      if (smallCardsBuffer.length === 4) {
        const wrapper = document.createElement("div");
        wrapper.className = "magazine-card big-container-for-small";
        smallCardsBuffer.forEach((sc) => wrapper.appendChild(sc));
        magazineGrid.appendChild(wrapper);
        smallCardsBuffer.length = 0;
      }
    } else {
      // Если это "большая" карточка с изображением, выводим сразу
      magazineGrid.appendChild(createCard(issue));
    }
  });

  // Если вдруг после прохода остались less than 4 small-cards, тоже их выведем в отдельный блок
  if (smallCardsBuffer.length > 0) {
    const wrapper = document.createElement("div");
    wrapper.className = "magazine-card big-container-for-small";
    smallCardsBuffer.forEach((sc) => wrapper.appendChild(sc));
    magazineGrid.appendChild(wrapper);
  }

  const imageElements = root.querySelectorAll(".pop-up_img img");
  imageElements.forEach((img) => {
    img.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "block";
      modalImg.src = img.src;
      modalImg.alt = img.alt;
      captionText.textContent = img.alt;
    });
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  root.addEventListener("click", (e) => {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  });
};

/**
 * Обёрточная функция, которую вызовет GComm_TabManager.
 * Она просто пробрасывает shadowRoot внутрь initMagazineFunction.
 */
window.initMagazineShadow = async function (shadowRoot) {
  await window.initMagazineFunction(shadowRoot);
};
