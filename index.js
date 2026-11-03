require('dotenv').config();

const { Bot, session } = require('grammy');
const express = require('express');
const app = express();

const { BOT_TOKEN, OWNER_ID, OWNER_NAME } = require('./config');
const { getUserMenu } = require('./keyboards/user');
const { getAdminMenu } = require('./keyboards/admin');
const db = require('./database/db');

// ایمپورت هندلرها
const userHandlers = require('./handlers/user');
const adminHandlers = require('./handlers/admin');
const anonymousHandlers = require('./handlers/anonymous');
const inlineHandlers = require('./handlers/inline'); // 👈 اینجا ایمپورت میشه

if (!BOT_TOKEN || !OWNER_ID) {
  console.error('❌ BOT_TOKEN and OWNER_UUID are required in .env file');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// 👈 فعال‌سازی سیستم Session
bot.use(session({
    initial: () => ({ adminState: null, targetUserId: null })
}));

// ================== استارت (لینک ناشناس) ==================
bot.command('start', async (ctx, next) => {
    const payload = ctx.match;
    if (payload === 'anon') {
        await ctx.reply('👋 به ربات پیام ناشناس خوش آمدی!\n\nبرای ارسال پیام، کافیه همین الان هر متنی که میخوای رو بفرستی.', { 
            reply_markup: { remove_keyboard: true } 
        });
        return;
    }
    return next();
});

// ================== استارت عادی ==================
bot.command('start', async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || '';
  const fullName = ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '');

  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
  if (!user) {
    const now = new Date().toISOString();
    const newUserCode = Math.floor(Math.random() * 90000) + 10000;
    db.prepare('INSERT INTO users (telegram_id, user_code, username, full_name, join_date) VALUES (?, ?, ?, ?, ?)')
      .run(userId, newUserCode, username, fullName, now);
  }

  const startText = db.prepare('SELECT value FROM settings WHERE key = ?').get('start_text')?.value || 'سلام!';
  
  await ctx.reply(startText, {
    reply_markup: {
      keyboard: getUserMenu(userId),
      resize_keyboard: true
    }
  });
});

// ================== دکمه بازگشت ==================
bot.hears('🔙 بازگشت', async (ctx) => {
  ctx.session.adminState = null;
  await ctx.reply('🏠 بازگشت به منوی اصلی', {
    reply_markup: {
      keyboard: getUserMenu(ctx.from.id),
      resize_keyboard: true
    }
  });
});

// ================== لود هندلرها ==================
// نکته مهم: این‌ها باید دقیقاً بعد از تعریف bot باشن
adminHandlers(bot);
userHandlers(bot);
inlineHandlers(bot);
anonymousHandlers(bot);

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
    
    // 👈 اینجا درست بسته شده
    bot.start({
      allowed_updates: ['message', 'callback_query', 'inline_query']
    });

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

startBot();