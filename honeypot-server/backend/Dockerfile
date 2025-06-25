# Используем Python 3.11
FROM python:3.9-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Обновляем pip и setuptools
RUN pip install --upgrade pip setuptools

# Копируем файл с зависимостями в контейнер
COPY requirements.txt /app/

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект в контейнер
COPY . /app/

# Открываем порт для Flask приложения
EXPOSE 5000

# Запускаем Flask приложение
CMD ["python", "app.py"]

