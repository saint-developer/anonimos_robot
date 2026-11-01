const { InlineKeyboard } = require('grammy');
const db = require('../database/db');

module.exports = (bot) => {
    // 1. دکمه پروفایل من
    bot.hears('👤 پروفایل من', async (ctx) => {
        const userId = ctx.from.id;
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
        
        if (!user) {
            return ctx.reply('❌ شما در دیتابیس ثبت نشده‌اید. لطفاً /start بزنید.');
        }

        if (user.is_banned) {
            return ctx.reply('🚫 شما توسط ادمین مسدود شده‌اید!');
        }

        const text = `
👤 <b>پروفایل شما</b>

🆔 آیدی عددی: <code>${user.telegram_id}</code>
📝 نام: ${user.full_name}
🔹 نام کاربری: ${user.username ? '@' + user.username : 'ندارد'}
📅 تاریخ عضویت: ${new Date(user.join_date).toLocaleDateString('fa-IR')}
⚠️ اخطارها: ${user.warnings} از 3
🚫 وضعیت: ${user.is_banned ? '🔒 مسدود' : '✅ فعال'}
        `;

        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 2. دکمه راهنمای ربات
    bot.hears('📜 راهنمای ربات', async (ctx) => {
        const text = `
📖 <b>راهنمای ربات</b>

🔹 برای ارسال پیام ناشناس، کافیه هر متنی که می‌خوای رو به ربات بفرستی.
🔹 پیامت به صورت ناشناس برای مدیر ارسال میشه.
🔹 وقتی مدیر جواب بده، پاسخ برات ارسال میشه.
🔹 هیچ‌کس (حتی مدیر) نمی‌فهمه پیام از طرف کی بوده!
        `;
        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 3. دکمه ارتباط با ادمین
    bot.hears('📩 ارتباط با ادمین', async (ctx) => {
        await ctx.reply('📩 برای ارسال پیام به ادمین، هر متنی که می‌خواهی رو همینجا بنویس و بفرست:');
    });

    // 4. دکمه حمایت مالی
    bot.hears('💠 حمایت مالی', async (ctx) => {
        const keyboard = new InlineKeyboard()
            .url('💠 حمایت مالی', 'https://reymit.ir/your_link');
        
        await ctx.reply('💠 با حمایت شما، ما می‌تونیم ربات رو بهتر کنیم ❤️', {
            reply_markup: keyboard
        });
    });

    // 5. دکمه برترین‌های ربات
    bot.hears('🏆 برترین‌های ربات', async (ctx) => {
        await ctx.reply('🏆 بخش برترین‌ها به زودی اضافه می‌شه!');
    });
};