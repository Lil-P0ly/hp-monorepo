# Этап 1: сборка фронтенда
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальные исходники и собираем приложение
COPY . .

# ENV REACT_APP_API_URL=${REACT_APP_API_URL}


ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

# Этап 2: финальный образ с nginx
FROM nginx:1.27-alpine

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Устанавливаем права и копируем статические файлы из сборки
COPY --from=builder /app/build /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html
