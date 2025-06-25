import express from "express";
import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import client from "prom-client";
import fetch from "node-fetch"; // убедитесь, что установлен: npm install node-fetch

dotenv.config();
const app = express();
app.use(express.json());

// Прометей: метрики
client.collectDefaultMetrics();

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Время обработки HTTP-запросов в секундах',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Общее количество HTTP-запросов',
  labelNames: ['method', 'route', 'status_code'],
});

// Middleware для сбора метрик
app.use((req, res, next) => {
  const end = httpRequestDurationSeconds.startTimer();
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    });
    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

// Kafka
const kafka = new Kafka({
  clientId: "honeypot-sensor",
  brokers: [process.env.REDPANDA_BROKER || "localhost:9092"],
});
const producer = kafka.producer();

async function sendAlert(logData) {
  try {
    await producer.connect();
    await producer.send({
      topic: process.env.REDPANDA_TOPIC || "honeypot-alerts",
      messages: [{ value: JSON.stringify(logData) }],
    });
    console.log("Alert sent to Redpanda:", logData);
  } catch (error) {
    console.error("Error sending alert to Redpanda:", error.message);
  } finally {
    await producer.disconnect();
  }
}

// Telegram alert
// Telegram alert (без parse_mode)
async function sendTelegramAlert(logData) {
  const message = `🚨 Honeypot Triggered!
IP: ${logData.ip}
Port: ${logData.port}
Method: ${logData.method}
URL: ${logData.url}
User-Agent: ${logData.userAgent}
Time: ${logData.timestamp}`;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      }),
    });

    if (!response.ok) {
      console.error("Failed to send Telegram alert:", await response.text());
    }
  } catch (error) {
    console.error("Error sending Telegram alert:", error.message);
  }
}

// Метрики
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// Honeypot ловушка
app.all("*", async (req, res) => {
  const logData = {
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    port: req.socket.remotePort,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers["user-agent"],
    timestamp: new Date().toISOString(),
  };

  console.log("Honeypot triggered:", logData);
  await sendAlert(logData);
  await sendTelegramAlert(logData);

  res.status(404).json({ message: "Not Found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Honeypot running on port ${PORT}`));
