require('dotenv').config();

const { Bot } = require('grammy');
const express = require('express');
const app = express();

const { BOT_TOKEN, OWNER_ID, OWNER_NAME } = require('./config');
const { getUserMenu } = require('./keyboards/user');
const { getAdminMenu } = require('./keyboards/admin');
const db = require('./database/db');

if (!BOT_TOKEN || !OWNER_ID) {
  console.error('❌ BOT_TOKEN and OWNER_UUID are required in .env file');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ================== دستور استارت ==================
bot.command('start', async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || '';
  const fullName = ctx.from.full_name || 'کاربر';

  // ثبت کاربر در دیتابیس (اگه جدید باشه)
  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
  if (!user) {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users (telegram_id, username, full_name, join_date) VALUES (?, ?, ?, ?)')
      .run(userId, username, fullName, now);
  }

  const startText = db.prepare('SELECT value FROM settings WHERE key = ?').get('start_text')?.value || 'سلام!';
  
  await ctx.reply(startText, {
    reply_markup: {
      keyboard: getUserMenu(userId),
      resize_keyboard: true
    }
  });
});

// ================== دکمه پنل مدیریت ==================
bot.hears('👑 پنل مدیریت', async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return; // فقط ادمین اصلی
  
  await ctx.reply('👑 پنل مدیریت:', {
    reply_markup: {
      keyboard: getAdminMenu(),
      resize_keyboard: true
    }
  });
});

// ================== دکمه بازگشت ==================
bot.hears('🔙 بازگشت', async (ctx) => {
  await ctx.reply('🏠 بازگشت به منوی اصلی', {
    reply_markup: {
      keyboard: getUserMenu(ctx.from.id),
      resize_keyboard: true
    }
  });
});

// ================== وب‌سرور Render ==================
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('🤖 Anonymous Link Bot is up and running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is listening on port ${PORT}`);
});

// ================== استارت ربات ==================
const startBot = async () => {
  try {
    console.log('🚀 Starting bot...');
    await bot.init();
    console.log(`✅ Bot @${bot.botInfo.username} is running!`);
    
    bot.start({
      allowed_updates: ['message', 'callback_query']
    });
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

startBot();