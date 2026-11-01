const { InlineKeyboard } = require('grammy');
const db = require('../database/db');

module.exports = (bot) => {
    // 1. پروفایل من
    bot.hears('👤 پروفایل من', async (ctx) => {
        const userId = ctx.from.id;
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
        
        if (!user) return ctx.reply('❌ لطفاً /start بزنید.');
        if (user.is_banned) return ctx.reply('🚫 شما مسدود شده‌اید!');

        const text = `
👤 <b>پروفایل شما</b>

🆔 کد اختصاصی: <code>${user.user_code || 'در حال ساخت...'}</code>
📝 نام: ${user.full_name}
🔹 نام کاربری: ${user.username ? '@' + user.username : 'ندارد'}
💰 موجودی سکه: <b>${user.score}</b>
👥 تعداد دعوت‌ها: ${user.invite_count}
📅 تاریخ عضویت: ${new Date(user.join_date).toLocaleDateString('fa-IR')}
🚫 وضعیت: ${user.is_banned ? '🔒 مسدود' : '✅ فعال'}
        `;

        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 2. سکه‌های من
    bot.hears('💰 سکه‌های من', async (ctx) => {
        const user = db.prepare('SELECT score FROM users WHERE telegram_id = ?').get(ctx.from.id);
        await ctx.reply(`💰 موجودی فعلی شما: <b>${user ? user.score : 0}</b> سکه\n\n💡 برای دریافت سکه رایگان، از فروشگاه یا دعوت دوستان استفاده کنید.`, { parse_mode: 'HTML' });
    });

    // 3. فروشگاه
    bot.hears('🛍️ فروشگاه ربات', async (ctx) => {
        const items = db.prepare('SELECT * FROM shop_items WHERE is_active = 1').all();
        if (items.length === 0) return ctx.reply('📭 فروشگاه در حال حاضر خالی است.');

        const keyboard = new InlineKeyboard();
        items.forEach(item => {
            keyboard.text(`${item.emoji || '🛍️'} ${item.name} - ${item.price} سکه`, `buy_${item.id}`).row();
        });

        await ctx.reply('🛍️ <b>به فروشگاه خوش آمدید!</b>\n\nبرای خرید، روی محصول مورد نظر کلیک کنید:', {
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    });

    // 4. بانک انتقال
    bot.hears('🏦 بانک انتقال', async (ctx) => {
        await ctx.reply('🏦 <b>بانک انتقال سکه</b>\n\n💡 به زودی در آپدیت بعدی...', { parse_mode: 'HTML' });
    });

    // 5. لینک ناشناس
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

    // 6. راهنما
    bot.hears('📜 راهنمای ربات', async (ctx) => {
        const text = `
📖 <b>راهنمای ربات لینک ناشناس</b>

🔹 برای ساخت لینک اختصاصی، روی دکمه «🔗 لینک ناشناس من» بزن.
🔹 لینک رو برای دوستات بفرست تا بتونن بهت پیام ناشناس بدن.
🔹 می‌تونی سکه جمع کنی و از فروشگاه خرید کنی.
        `;
        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 7. ارتباط با ادمین
    bot.hears('📩 ارتباط با ادمین', async (ctx) => {
        await ctx.reply('📩 هر پیامی که می‌خواهی رو همینجا بنویس تا به ادمین ارسال بشه:');
    });

    // 8. حمایت مالی
    bot.hears('💠 حمایت مالی', async (ctx) => {
        const keyboard = new InlineKeyboard().url('💠 حمایت مالی', 'https://reymit.ir/your_link');
        await ctx.reply('💠 با حمایت شما، ما می‌تونیم ربات رو بهتر کنیم ❤️', { reply_markup: keyboard });
    });

    // 9. برترین‌ها
    bot.hears('🏆 برترین‌های ربات', async (ctx) => {
        await ctx.reply('🏆 بخش برترین‌ها به زودی اضافه می‌شه!');
    });

    // هندلر خرید محصول (Callback Query)
    bot.callbackQuery(/^buy_(\d+)$/, async (ctx) => {
        const itemId = parseInt(ctx.match[1]);
        const userId = ctx.from.id;
        
        const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);

        if (!item || !user) return ctx.answerCallbackQuery('❌ خطا!');

        if (user.score < item.price) {
            return ctx.answerCallbackQuery('❌ موجودی سکه شما کافی نیست!', { show_alert: true });
        }

        // کسر سکه
        db.prepare('UPDATE users SET score = score - ? WHERE telegram_id = ?').run(item.price, userId);
        // ثبت خرید
        db.prepare('INSERT INTO user_purchases (user_id, item_id, purchased_at) VALUES (?, ?, ?)').run(userId, itemId, new Date().toISOString());

        await ctx.answerCallbackQuery('✅ خرید با موفقیت انجام شد!', { show_alert: true });
        await ctx.editMessageText(`🎉 شما محصول <b>${item.name}</b> را خریداری کردید!\n💰 سکه باقیمانده: <b>${user.score - item.price}</b>`, { parse_mode: 'HTML' });
    });
};