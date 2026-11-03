
require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

console.log("Напиши /id своему SoloRemontBot");

bot.on("message", async (msg) => {
  if (msg.text === "/id") {
    console.log("ТВОЙ TELEGRAM ID:", msg.chat.id);

    await bot.sendMessage(
      msg.chat.id,
      "ID найден! Посмотри его в терминале."
    );

    await bot.stopPolling();
    process.exit(0);
  }
});