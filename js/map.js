(async () => {
  const apiKey = "a7065fcf-b8c8-4e99-9b6f-705afee5611b"; // Вставьте новый API-ключ здесь
  const geocodeUrl = "https://geocode-maps.yandex.ru/1.x/";

  // Функция для геокодирования адреса
  async function geocode(address) {
    const url = `${geocodeUrl}?apikey=${apiKey}&format=json&geocode=${encodeURIComponent(
      address
    )}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const pos =
        data.response.GeoObjectCollection.featureMember[0]?.GeoObject.Point.pos;
      if (pos) {
        const [longitude, latitude] = pos.split(" ").map(Number);
        return { latitude, longitude };
      } else {
        console.warn(`Координаты не найдены для адреса: ${address}`);
        return null;
      }
    } catch (error) {
      console.error(`Ошибка при геокодировании адреса "${address}":`, error);
      return null;
    }
  }

  // Функция для загрузки JSON файла
  async function loadJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Ошибка при загрузке файла ${url}:`, error);
      return null;
    }
  }

  // Функция для скачивания файла
  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Загрузка исходных данных
  const contacts = await loadJSON("/data/contacts.json");
  if (!contacts) {
    console.error("Не удалось загрузить исходные данные.");
    return;
  }

  const updatedContacts = JSON.parse(JSON.stringify(contacts)); // Клонирование объекта

  // Итерация по всем записям и добавление координат
  for (const [letter, cities] of Object.entries(updatedContacts)) {
    for (const city of cities) {
      if (city.address) {
        // Формирование полного адреса (можно добавить город для точности)
        const fullAddress = `${city.address}, ${city.name}`;
        const coords = await geocode(fullAddress);
        if (coords) {
          city.coordinates = coords;
        } else {
          city.coordinates = null;
        }
        // Задержка между запросами для избежания превышения лимитов API
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 секунда
      } else {
        console.warn(`Пропущен город без адреса: ${city.name}`);
        city.coordinates = null;
      }
    }
  }

  // Скачивание обновлённого JSON файла
  downloadJSON(updatedContacts, "contacts_with_coordinates.json");
})();
