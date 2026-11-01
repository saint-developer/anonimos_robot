const { InlineKeyboard } = require('grammy');
const db = require('../database/db');
const { getAnonymousKeyboard } = require('../keyboards/user');

module.exports = (bot) => {
    // 1. پروفایل من
    bot.hears('👤 پروفایل من', async (ctx) => {
        const userId = ctx.from.id;
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
        
        if (!user) return ctx.reply('❌ لطفاً /start بزنید.');
        if (user.is_banned) return ctx.reply('🚫 شما مسدود شده‌اید!');

        const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE sender_id = ?').get(userId).count;

        const text = `
👤 <b>پروفایل شما</b>

🆔 آیدی عددی: <code>${user.telegram_id}</code>
📝 نام: ${user.full_name}
🔹 نام کاربری: ${user.username ? '@' + user.username : 'ندارد'}
📅 تاریخ عضویت: ${new Date(user.join_date).toLocaleDateString('fa-IR')}
📩 پیام‌های ارسالی: ${totalMessages}
⚠️ اخطارها: ${user.warnings} از 3
🚫 وضعیت: ${user.is_banned ? '🔒 مسدود' : '✅ فعال'}
        `;

        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 2. راهنمای ربات
    bot.hears('📜 راهنمای ربات', async (ctx) => {
        const text = `
📖 <b>راهنمای ربات لینک ناشناس</b>

🔹 برای ساخت لینک اختصاصی، روی دکمه «🔗 لینک ناشناس من» بزن.
🔹 لینک رو برای دوستات بفرست تا بتونن بهت پیام ناشناس بدن.
🔹 پیام‌ها بدون اینکه فرستنده رو بشناسی بهت می‌رسن.
🔹 می‌تونی به پیام‌ها ریپلای کنی و جوابشون رو بدی.
        `;
        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 3. لینک ناشناس من
    bot.hears('🔗 لینک ناشناس من', async (ctx) => {
        const botUsername = ctx.me.username;
        const botLink = `https://t.me/${botUsername}?start=anon`;
        
        const keyboard = new InlineKeyboard()
            .url('🚀 ارسال پیام ناشناس', botLink)
            .row()
            .url('📤 اشتراک‌گذاری', `https://t.me/share/url?url=${botLink}&text=به من پیام ناشناس بفرست!`);

        await ctx.reply(
            `🔗 <b>لینک اختصاصی شما:</b>\n\n<code>${botLink}</code>\n\nاین لینک رو برای دوستات بفرست تا بتونن بهت پیام ناشناس بدن.`,
            { parse_mode: 'HTML', reply_markup: keyboard }
        );
    });

    // 4. ارتباط با ادمین
    bot.hears('📩 ارتباط با ادمین', async (ctx) => {
        await ctx.reply('📩 هر پیامی که می‌خواهی رو همینجا بنویس تا به ادمین ارسال بشه:');
    });

    // 5. حمایت مالی
    bot.hears('💠 حمایت مالی', async (ctx) => {
        const keyboard = new InlineKeyboard().url('💠 حمایت مالی', 'https://reymit.ir/your_link');
        await ctx.reply('💠 با حمایت شما، ما می‌تونیم ربات رو بهتر کنیم ❤️', { reply_markup: keyboard });
    });

    // 6. برترین‌ها
    bot.hears('🏆 برترین‌های ربات', async (ctx) => {
        await ctx.reply('🏆 بخش برترین‌ها به زودی اضافه می‌شه!');
    });
};