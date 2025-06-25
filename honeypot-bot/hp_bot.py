import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, CallbackQueryHandler
import os

BOT_TOKEN = os.getenv("BOT_TOKEN", "7523125795:AAEAV0ORU9Pid0gxE9YE8iidYMaIhW_uefg")
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://gjbr9xxc-8080.euw.devtunnels.ms/")

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отправляет сообщение с кнопкой для запуска Mini App."""
    keyboard = [
        [InlineKeyboardButton("Open Honeypot Mini App", url=MINI_APP_URL)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Welcome to the Honeypot Monitoring Bot!", reply_markup=reply_markup)

async def handle_callback_query(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обрабатывает данные, отправленные из Mini App (через callback_query)."""
    query = update.callback_query
    await query.answer()

    data_from_mini_app = query.data  

    if query.from_user.id != query.message.chat.id:
        await query.edit_message_text("Error: Invalid data source.")
        return

    # Обработка данных (пример)
    if data_from_mini_app:
        logging.info(f"Received data from Mini App: {data_from_mini_app}")
        await query.edit_message_text(f"Received from Mini App: {data_from_mini_app}")
    else:
        await query.edit_message_text("No data received from Mini App.")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
  """Обрабатывает обычные сообщения, чтобы отлавливать данные, если они отправлены как текст."""
  message_text = update.message.text
  logging.info(f"Received message: {message_text}")
  await update.message.reply_text(f"Received your message: {message_text}")


def main():
    application = ApplicationBuilder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))

    application.add_handler(CallbackQueryHandler(handle_callback_query))

    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Запуск бота
    application.run_polling()

if __name__ == '__main__':
    from telegram.ext import MessageHandler, filters
    main()