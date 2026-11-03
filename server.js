"use strict";

require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing in .env");
}

if (!ADMIN_CHAT_ID || !/^-?\d+$/.test(ADMIN_CHAT_ID)) {
  throw new Error(
    "Set a valid ADMIN_CHAT_ID in .env before starting"
  );
}


const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});
bot.getMe()
  .then(info => {
    console.log("TELEGRAM CONNECTED!");
    console.log("Bot username:", info.username);
  })
  .catch(error => {
    console.error("TELEGRAM ERROR:", error.message);
  });

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));

app.use(express.static(
  path.join(__dirname, "../frontend")
));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Zbyt wiele prób. Spróbuj ponownie później."
  }
});

function clean(value, maxLength = 1000) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function createLeadId() {
  return "SOLO-" +
    Date.now().toString(36).toUpperCase();
}

async function notifyAdmin(message) {
  await bot.sendMessage(
    ADMIN_CHAT_ID,
    message,
    { parse_mode: "HTML" }
  );
}

app.post(
  "/api/contact",
  contactLimiter,
  async (req, res) => {
    try {
      const name = clean(req.body.name, 100);
      const phone = clean(req.body.phone, 30);
      const email = clean(req.body.email, 150);
      const message = clean(req.body.message, 2000);
      const consent = req.body.consent === true;

    
      if (req.body.website) {
        return res.json({ success: true });
      }

      if (!name || !phone || !consent) {
        return res.status(400).json({
          success: false,
          message: "Nieprawidłowe dane formularza."
        });
      }

      if (!/^\+?[0-9\s().-]{7,25}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Nieprawidłowy numer telefonu."
        });
      }

      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return res.status(400).json({
          success: false,
          message: "Nieprawidłowy adres e-mail."
        });
      }

      const leadId = createLeadId();
      const now = new Date().toLocaleString("pl-PL", {
        timeZone: "Europe/Warsaw"
      });

      const text = [
        "🔔 <b>NOWE ZGŁOSZENIE — SOLO</b>",
        "",
        `🆔 <b>Numer:</b> ${escapeHtml(leadId)}`,
        `📅 <b>Data:</b> ${escapeHtml(now)}`,
        "",
        `👤 <b>Imię:</b> ${escapeHtml(name)}`,
        `📞 <b>Telefon:</b> ${escapeHtml(phone)}`,
        `📧 <b>Email:</b> ${escapeHtml(email || "Nie podano")}`,
        "",
        "💬 <b>Wiadomość:</b>",
        escapeHtml(message || "Brak dodatkowej wiadomości"),
        "",
        "🌐 <b>Źródło:</b> Strona internetowa SOLO"
      ].join("\n");

      await notifyAdmin(text);

      console.log("New website lead:", leadId);

      return res.json({
        success: true,
        leadId,
        message: "Zgłoszenie zostało wysłane."
      });

    } catch (error) {
      console.error("Contact error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Nie udało się wysłać zgłoszenia."
      });
    }
  }
);




bot.on("message", async (msg) => {
  console.log("INCOMING MESSAGE:", msg.text);

  try {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (msg.chat.type !== "private") return;

    if (msg.text && msg.text.startsWith("/start")) {
      console.log("START RECEIVED:", chatId);

      await bot.sendMessage(
        chatId,
        "Witamy w SOLO Sp. z o.o.! 👋\n\nDziękujemy za kontakt!\n\nOpisz, jakiego remontu potrzebujesz. Nasz zespół skontaktuje się z Tobą."
      );

      console.log("START MESSAGE SENT");
      return;
    }

    console.log("CURRENT CHAT ID:", chatId);
console.log("ADMIN CHAT ID:", ADMIN_CHAT_ID);

if (String(chatId) === String(ADMIN_CHAT_ID)) {
  console.log("MESSAGE IGNORED: THIS IS ADMIN");
  return;
}

console.log("MESSAGE IS FROM CLIENT — PROCESSING");

    const firstName = clean(msg.from?.first_name || "Klient", 100);
    const lastName = clean(msg.from?.last_name || "", 100);
    const username = clean(msg.from?.username || "", 100);

    const leadId = createLeadId();

    let content = "";

    if (msg.text) {
      content = clean(msg.text, 3000);
    } else if (msg.photo) {
      content = "Klient przesłał zdjęcie.";
    } else if (msg.document) {
      content = "Klient przesłał dokument: " +
        clean(msg.document.file_name || "plik", 150);
    } else if (msg.voice) {
      content = "Klient przesłał wiadomość głosową.";
    } else if (msg.video) {
      content = "Klient przesłał film.";
    } else if (msg.contact) {
      content = "Klient udostępnił kontakt.";
    } else {
      content = "Klient przesłał wiadomość.";
    }
    console.log("STEP 1: Creating admin message");
    const adminMessage = [
      "📩 <b>NOWA WIADOMOŚĆ TELEGRAM — SOLO</b>",
      "",
      `🆔 <b>Numer:</b> ${escapeHtml(leadId)}`,
      `👤 <b>Klient:</b> ${escapeHtml(firstName + " " + lastName)}`,
      `🔗 <b>Username:</b> ${escapeHtml(username ? "@" + username : "Brak")}`,
      `🕒 <b>Data:</b> ${escapeHtml(new Date().toLocaleString("pl-PL", {
        timeZone: "Europe/Warsaw"
      }))}`,
      "",
      "💬 <b>Treść:</b>",
      escapeHtml(content),
      "",
      `🔐 <b>Chat ID:</b> <code>${userId}</code>`
    ].join("\n");

console.log("ADMIN CHAT ID:", ADMIN_CHAT_ID);
console.log("ADMIN CHAT ID TYPE:", typeof ADMIN_CHAT_ID);
console.log("MESSAGE LENGTH:", adminMessage.length);
console.log("SENDING TO ADMIN...");

try {
  const sent = await bot.sendMessage(
    ADMIN_CHAT_ID,
    adminMessage,
    { parse_mode: "HTML" }
  );

  console.log("ADMIN NOTIFICATION SENT:", sent.message_id);

} catch (error) {
  console.error(
    "ADMIN NOTIFICATION ERROR:",
    error.response?.body || error.message
  );
}
    if (msg.photo || msg.document || msg.voice || msg.video) {
      await bot.forwardMessage(
        ADMIN_CHAT_ID,
        chatId,
        msg.message_id
      );
    }

    console.log("New Telegram message:", leadId);

  } catch (error) {
    console.error(
      "Telegram message error:",
      error.response?.body || error.message
    );
  }
});



bot.on("polling_error", error => {
  console.error("Telegram polling error:", error.message);
});



app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    company: "SOLO Sp. z o.o.",
    bot: "SoloRemontBot",
    status: "running"
  });
});



app.listen(PORT, () => {
  console.log("----------------------------------");
  console.log("SOLO BACKEND STARTED");
  console.log(`Local: http://localhost:${PORT}`);
  console.log("Telegram bot polling enabled");
  console.log("----------------------------------");
});