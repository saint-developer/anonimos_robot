# Anonymous Message Bot

A Telegram bot that lets people send anonymous messages to a single owner. The sender's identity is hidden from the owner, and the owner can reply directly through the bot without ever learning who sent the message. Built with [grammY](https://grammy.dev/).

## Features

- 📩 Anyone who messages the bot has their message forwarded anonymously to the owner
- ↩️ The owner replies by replying to the forwarded message in Telegram — the bot delivers it back to the original sender
- 👍 Reactions the owner adds to a forwarded message are mirrored back to the sender's original message
- ✅ Confirmation messages let both sender and owner know when a message/reply was delivered

## How It Works

1. A user starts a chat with the bot and sends a message.
2. The bot forwards that message to the owner, tagged as "New message from an anonymous sender."
3. The owner replies to that forwarded message inside Telegram.
4. The bot detects the reply, matches it back to the original sender using an in-memory map, and delivers the reply — the sender never sees the owner's identity, and the owner never sees the sender's.

## Requirements

- Node.js (v18 or later recommended)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Your Telegram numeric chat ID (the owner's ID)

## Setup

1. Clone or download this repository.
2. Install dependencies:
   ```bash
   npm install grammy dotenv
   ```
3. Create a `.env` file in the project root with the following variables:
   ```env
   BOT_TOKEN=your_telegram_bot_token
   OWNER_UUID=your_telegram_chat_id
   OWNER_NAME=Your Display Name
   ```
   - `BOT_TOKEN` — required. Get this from BotFather.
   - `OWNER_UUID` — required. The Telegram chat ID that receives anonymous messages and can reply to them.
   - `OWNER_NAME` — optional. Defaults to `Message Owner` if not set. Shown to senders in the welcome message and in reply notifications.
4. Start the bot:
   ```bash
   node index.js
   ```

You should see console output confirming the bot is running, along with the owner ID and name.

## Usage

- **As a sender:** Start a chat with the bot and send `/start` to see the welcome message, then just type your message.
- **As the owner:** Anonymous messages will arrive in your chat with the bot. Reply directly to a forwarded message to respond, or react to it to send the same reaction back to the sender.

## Notes

- Message-to-sender mappings are stored in memory (`Map`), so they reset if the bot restarts. Long-running deployments may want to swap this for persistent storage (e.g., a database or file) if reply continuity across restarts matters.
- The bot listens for `message` and `message_reaction` updates.
- Stopping the process (Ctrl+C or `SIGTERM`) shuts the bot down gracefully.

## License

MIT

---
