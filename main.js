require("dotenv").config(); // dotenv importieren und konfigurieren

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const port = 3010;

// Zugriff auf die Umgebungsvariablen
const token = process.env.TELEGRAM_BOT_TOKEN;
const domChatId = process.env.DOM_CHAT_ID;
const subChatId = process.env.SUB_CHAT_ID;

// Erstelle ein Array von erlaubten Chat-IDs aus der .env-Datei
const allowedChatIds = process.env.ALLOWED_CHAT_IDS.split(",");

// Initialisiere den Telegram Bot
const bot = new TelegramBot(token, { polling: true });

// Middleware zum Parsen von JSON-Anfragen
app.use(express.json());

// Überprüfe die Berechtigung der eingehenden Nachricht und sende die Chat-ID zurück
bot.on("message", (msg) => {
  const chatId = msg.chat.id.toString(); // Konvertiere chatId in einen String zur Überprüfung

  // Prüfe, ob die Chat-ID in der Liste der erlaubten IDs ist
  if (allowedChatIds.includes(chatId)) {
    const reply = `Deine Chat-ID ist: ${chatId}`;

    // Sende die Chat-ID als Antwort
    bot.sendMessage(chatId, reply);
  } else {
    // Falls die Chat-ID nicht erlaubt ist
    bot.sendMessage(
      chatId,
      "Entschuldigung, du bist nicht berechtigt, diesen Bot zu verwenden."
    );
  }
});

// HTTP-Endpoint für den Empfang von Nachrichten
app.post("/send-message", (req, res) => {
  const { message, chatId, addressee } = req.body; // Extrahiere Nachricht, Chat-ID und Adressaten aus dem Anfragekörper

  if (!message) {
    return res.status(400).send("Message content missing");
  }

  let targetChatId;

  if (chatId) {
    // Prüfe, ob die Chat-ID in der Liste der erlaubten IDs ist
    if (!allowedChatIds.includes(chatId.toString())) {
      return res.status(403).send("Access denied");
    }
    targetChatId = chatId;
  } else if (addressee) {
    // Verwende die Adresse (DOM oder SUB), um die Ziel-Chat-ID zu bestimmen
    if (addressee === "DOM") {
      targetChatId = domChatId;
    } else if (addressee === "SUB") {
      targetChatId = subChatId;
    } else {
      return res.status(400).send("Invalid addressee");
    }
  } else {
    return res.status(400).send("Either chat ID or addressee is required");
  }

  // Sende die Nachricht über den Bot
  bot
    .sendMessage(targetChatId, message)
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
