require('dotenv').config();

const { Bot } = require('grammy');
const express = require('express');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_UUID = process.env.OWNER_UUID;
const OWNER_NAME = process.env.OWNER_NAME || 'Message Owner';

if (!BOT_TOKEN || !OWNER_UUID) {
  console.error('❌ BOT_TOKEN and OWNER_UUID are required in .env file');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);
const messageMap = new Map();

bot.command('start', async (ctx) => {
  const welcomeMessage = `
Hi there! You're sending a message to ${OWNER_NAME}, and this way they won't know who you are 🥰

Write your message below:
  `;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'HTML'
  });
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;

  if (String(ctx.chat.id) === String(OWNER_UUID)) {
    const repliedTo = ctx.message.reply_to_message;
    if (!repliedTo) return;

    const original = messageMap.get(repliedTo.message_id);
    if (!original) return;

    try {
      await ctx.api.sendMessage(
        original.chatId,
        `${OWNER_NAME} replied to you:\n${text}`,
        { reply_to_message_id: original.messageId }
      );
      await ctx.reply('✅️ Your reply was sent successfully', {
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      console.error('Error sending owner reply to sender:', error);
    }
    return;
  }

  if (text.startsWith('/')) return;

  try {
    const sentToOwner = await ctx.api.sendMessage(OWNER_UUID, `📩 New message from an anonymous sender:\n\n${text}`, {
      parse_mode: 'HTML'
    });

    messageMap.set(sentToOwner.message_id, {
      chatId: ctx.chat.id,
      messageId: ctx.message.message_id
    });

    await ctx.reply(`Your message was sent successfully ✅️`, {
      parse_mode: 'HTML'
    });

  } catch (error) {
    console.error('Error sending message:', error);
  }
});

bot.on('message_reaction', async (ctx) => {
  const reaction = ctx.messageReaction;
  if (!reaction) return;
  if (String(reaction.chat.id) !== String(OWNER_UUID)) return;

  const original = messageMap.get(reaction.message_id);
  if (!original) return;

  try {
    await ctx.api.setMessageReaction(
      original.chatId,
      original.messageId,
      reaction.new_reaction
    );
  } catch (error) {
    console.error('Error mirroring reaction to sender:', error);
  }
});

// --- وب سرور برای زنده نگه داشتن Render ---
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('🤖 Anonymous Link Bot is up and running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is listening on port ${PORT}`);
});
// ------------------------------------------

const startBot = async () => {
  try {
    console.log('🚀 Starting bot...');
    await bot.init();
    console.log(`✅ Bot @${bot.botInfo.username} is running!`);
    console.log(`👤 Owner ID: ${OWNER_UUID}`);
    console.log(`📝 Owner Name: ${OWNER_NAME}`);
    console.log('📨 Waiting for messages...');
    
    bot.start({
      allowed_updates: ['message', 'message_reaction']
    });
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

startBot();

process.on('SIGINT', () => {
  console.log('🛑 Bot stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Bot stopped');
  process.exit(0);
});