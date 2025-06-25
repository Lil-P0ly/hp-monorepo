# HP Monorepo

## Getting started

Проект **HP-MONOREPO** представляет собой honeypot-систему с микросервисной архитектурой. Репозиторий организован в виде монорепозитория, содержащего два основных сервиса: 
- **honeypot-bait** (приманка) [Ссылка на файл](./honeypot-bait/server.js)
- **honeypot-server** (сервер обработки данных) [Ссылка на папку](./honeypot-server/)

## Структура проекта

```
HP-MONOREPO/
├── honeypot-bait
│   └── server.js            # Сервер-приманка на Express.js
│
├── honeypot-server
│   ├── backend
│   │   └── app.py           # Flask-бэкенд для обработки данных
│   ├── database
│        └── init.sql         # Скрипт инициализации базы данных
│── docker-compose.yml       # Развертывание микросервисов в Docker Compose
└── README.md                # Описание проекта и инструкции по развёртыванию
```

## Описание компонентов

### honeypot-bait
Этот сервис эмулирует уязвимую систему и собирает информацию о попытках несанкционированного доступа.

- **`server.js`** — серверная часть, реализованная на Exporess.js.
- **`v.18`** — Используемая версия NodeJS.

### honeypot-server
Этот сервис отвечает за обработку данных, поступающих от honeypot-bait, 

- **`app.py`** — Flask-приложение, предоставляющее API для обработки данных и взаимодействия с базой данных.
- **`3.9`** — Используемая версия Python


### db
Базы данных PostgreSQL:15 отвечает за хранение информации о попытках атак и предоставление аналитики.

- **`init.sql`** — SQL-скрипт для создания и инициализации схемы базы данных.

## RedPanda

Этот сервис очереди сообщений
- **`v.24.3`** — Используемая версия Redpanda

## honeypot-frontend

Frontend honeypot работающий в Telegram-MiniAps

## запуск бота через docker
```
FROM python:3.9
WORKDIR hp-monorepo/honeypot-bot/
COPY . hp-monorepo/honeypot-bot/
RUN pip install logging
RUN pip install telegram
RUN pip install pytelegrambotapi
CMD ["python", "hp_bot.py"]
```

## Запуск проекта

1. **Склонируйте репозиторий:**
   ```bash
   git clone <репозиторий>
   cd HP-MONOREPO
   ```

2. **Запуск**
   ```bash
   docker-compose up --build -d
   ```

