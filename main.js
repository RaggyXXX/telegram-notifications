require("dotenv").config(); // dotenv importieren und konfigurieren

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const port = 3010;

// Zugriff auf die Umgebungsvariablen
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.CHAT_ID;

// Initialisiere den Telegram Bot
const bot = new TelegramBot(token, { polling: true });

// Middleware zum Parsen von JSON-Anfragen
app.use(express.json());

// HTTP-Endpoint für den Empfang von Nachrichten
app.post("/send-message", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send("Message content missing");
  }

  // Sende die Nachricht über den Bot
  bot
    .sendMessage(chatId, message)
    .then(() => {
      res.status(200).send("Message sent");
    })
    .catch((error) => {
      console.error("Error sending message:", error);
      res.status(500).send("Failed to send message");
    });
});

// Starte den Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
