import { startBot } from "./bot.js";

process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

startBot().catch((err) => {
  console.error("[fatal] falha ao iniciar o bot:", err);
  process.exit(1);
});
