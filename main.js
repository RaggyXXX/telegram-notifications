require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const bodyParser = require("body-parser");
const axios = require("axios"); // Import axios for HTTP requests

const app = express();
const port = process.env.PORT || 3010;

// Zugriff auf die Umgebungsvariablen
const token = process.env.TELEGRAM_BOT_TOKEN;
const domChatId = process.env.DOM_CHAT_ID;
const subChatId = process.env.SUB_CHAT_ID;

// Erstelle ein Array von erlaubten Chat-IDs aus der .env-Datei
const allowedChatIds = process.env.ALLOWED_CHAT_IDS.split(",");

// Initialisiere den Telegram Bot ohne Polling
const bot = new TelegramBot(token, { polling: false });

// Middleware zum Parsen von JSON-Anfragen
app.use(bodyParser.json());

// Setze den Webhook
const url = "https://telegram-service.adaptable.app"; // Ihre Server-URL
bot
  .setWebHook(`${url}/bot${token}`)
  .then(() => {
    console.log("Webhook erfolgreich gesetzt.");
  })
  .catch((err) => {
    console.error("Fehler beim Setzen des Webhooks:", err);
  });

// Route für Telegram Webhooks
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Überprüfe die Berechtigung der eingehenden Nachricht und sende die Chat-ID zurück
bot.on("message", (msg) => {
  const chatId = msg.chat.id.toString();

  if (allowedChatIds.includes(chatId)) {
    const reply = `Deine Chat-ID ist: ${chatId}`;
    bot.sendMessage(chatId, reply);
  } else {
    bot.sendMessage(
      chatId,
      "Entschuldigung, du bist nicht berechtigt, diesen Bot zu verwenden."
    );
  }
});

// HTTP-Endpoint für den Empfang von Nachrichten
app.post("/send-message", async (req, res) => {
  const { message, addressee, imageUrl } = req.body;

  if (!message) {
    return res.status(400).send("Message content missing");
  }

  let targetChatId;

  if (addressee) {
    if (addressee === "DOM") {
      targetChatId = domChatId;
    } else if (addressee === "SUB") {
      targetChatId = subChatId;
    } else {
      return res.status(400).send("Invalid addressee");
    }
  } else {
    return res.status(400).send("Addressee is required");
  }

  try {
    // If imageUrl is provided, download and send the image
    if (imageUrl) {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(response.data, "binary");

      await bot.sendPhoto(targetChatId, imageBuffer, {
        caption: message,
      });
    } else {
      // Send just the message if no imageUrl is provided
      await bot.sendMessage(targetChatId, message);
    }
    res.status(200).send("Message sent");
  } catch (error) {
    console.error("Error sending message or image:", error);
    res.status(500).send("Failed to send message or image");
  }
});

// Starte den Server
app.listen(port, () => {
  console.log(`Server running at https://telegram-notifications.onrender.com`);
});
