import pandas as pd
import json
import os
import glob
from openpyxl import load_workbook
from PIL import Image, ImageOps
from io import BytesIO

# Получить текущую директорию, где находится скрипт
current_dir = os.path.dirname(os.path.abspath(__file__))
output_json_path = os.path.join(current_dir, "data.json")
images_dir = os.path.join(current_dir, "images")

# Создать папку для изображений, если её нет
os.makedirs(images_dir, exist_ok=True)

# Найти все файлы .xlsx в текущей директории
xlsx_files = glob.glob(os.path.join(current_dir, "*.xlsx"))

# Подготовка списка для JSON данных
all_data = []

# Обработать каждый файл .xlsx
for file_path in xlsx_files:
    try:
        # Загрузить данные из текущего Excel-файла
        excel_data = pd.read_excel(file_path)

        # Загрузить файл с помощью openpyxl для обработки изображений
        workbook = load_workbook(file_path)
        sheet = workbook.active

        # Перебор строк таблицы и извлечение данных
        for i, row in excel_data.iterrows():
            row_data = {
                "№": i + 1,
                "Изображение": "",
                "Код": row.get("Код", ""),
                "Наименование": row.get("Наименование", ""),
                "Прайс": row.get("ПрайсМин.Цена", ""),
                "Вход. Цена": row.get("Вх.ЦенаИнс", ""),
                "Отказ %": row.get("Откл. %", ""),
                "Цена": row.get("Цена", ""),
                "Наличие": row.get("Наличие", ""),
                "Логистика": row.get("Логистика", ""),
                "Кол.": row.get("Кол.", ""),
                "Мин. Кол.": row.get("Мин.Кол.", ""),
                "Сумма": row.get("Сумма", "")
            }

            # Проверка наличия изображения, связанного с этой строкой
            article = str(row_data["Код"])
            for image in sheet._images:  # Получаем изображения из файла
                if image.anchor._from.row - 1 == i:  # Связь изображения с текущей строкой
                    # Создаем уникальное имя файла для изображения
                    image_filename = f"{article}.jpg"
                    image_path = os.path.join(images_dir, image_filename)

                    # Сохраняем изображение как JPEG
                    img = Image.open(BytesIO(image._data()))
                    img = img.convert("RGB")

                    # Приведение изображения к квадратному формату
                    if img.width != img.height:
                        # Определяем максимальный размер стороны
                        max_side = max(img.width, img.height)
                        # Создаем новый квадратный холст с белым фоном
                        new_img = Image.new("RGB", (max_side, max_side), (255, 255, 255))
                        # Вставляем оригинальное изображение по центру
                        new_img.paste(img, ((max_side - img.width) // 2, (max_side - img.height) // 2))
                        img = new_img
                    
                    # Изменение размера до 1600x1600
                    img = img.resize((1600, 1600), Image.LANCZOS)
                    img.save(image_path, "JPEG")

                    # Добавляем путь к изображению в JSON данные
                    row_data["Изображение"] = os.path.join("images", image_filename).replace("\\", "/")
                    break

            # Добавить данные строки в общий список
            all_data.append(row_data)

    except Exception as e:
        print(f"Ошибка при обработке файла {file_path}: {e}")
        continue  # Переход к следующему файлу при ошибке

# Сохранить все данные в один JSON-файл
with open(output_json_path, "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=4)

print(f"Данные успешно сохранены в {output_json_path}")
