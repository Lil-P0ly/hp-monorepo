-- Создаем базу данных и заполним ее
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'honeypot') THEN
        CREATE DATABASE honeypot;
    END IF;
END $$;

-- Подключаемся к базе данных honeypot
\connect honeypot

-- Создаем таблицу logs, только если её нет
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    ip VARCHAR(50) NOT NULL,
    port INTEGER NOT NULL,
    method VARCHAR(10),
    url TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP
);
