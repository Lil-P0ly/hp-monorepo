# Используем официальный образ Node.js
FROM node:18-alpine

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install --only=production

# Копируем исходный код
COPY . .

# Указываем порт
# EXPOSE 3000

# Запускаем сервер
CMD ["node", "server.js"]

