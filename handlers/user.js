const { InlineKeyboard } = require('grammy');
const db = require('../database/db');

module.exports = (bot) => {
    // 1. پروفایل من
    bot.hears('👤 پروفایل من', async (ctx) => {
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(ctx.from.id);
        if (!user) return ctx.reply('❌ لطفاً /start بزنید.');

        const text = `
👤 <b>پروفایل شما</b>

🆔 کد اختصاصی: <code>${user.user_code || 'در حال ساخت...'}</code>
📝 نام: ${user.full_name}
💰 موجودی سکه: <b>${user.score}</b>
👥 تعداد دعوت‌ها: ${user.invite_count}
🚫 وضعیت: ${user.is_banned ? '🔒 مسدود' : '✅ فعال'}
        `;
        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 2. سکه‌های من
    bot.hears('💰 سکه‌های من', async (ctx) => {
        const user = db.prepare('SELECT score FROM users WHERE telegram_id = ?').get(ctx.from.id);
        await ctx.reply(`💰 موجودی فعلی شما: <b>${user ? user.score : 0}</b> سکه`, { parse_mode: 'HTML' });
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
        await ctx.reply('🏦 <b>بانک انتقال سکه</b>\n\n💡 در حال حاضر این بخش برای انتقال سکه به دوستان است. (به زودی کامل می‌شود)', { parse_mode: 'HTML' });
    });

    // 5. لینک ناشناس
    bot.hears('🔗 لینک ناشناس من', async (ctx) => {
        const botLink = `https://t.me/${ctx.me.username}?start=anon`;
        const keyboard = new InlineKeyboard()
            .url('🚀 ارسال پیام ناشناس', botLink)
            .row()
            .url('📤 اشتراک‌گذاری', `https://t.me/share/url?url=${botLink}&text=به من پیام ناشناس بفرست!`);

        await ctx.reply(`🔗 <b>لینک اختصاصی شما:</b>\n\n<code>${botLink}</code>`, { parse_mode: 'HTML', reply_markup: keyboard });
    });

    // 6. دعوت دوستان
    bot.hears('👥 دعوت دوستان', async (ctx) => {
        const userId = ctx.from.id;
        const inviteLink = `https://t.me/${ctx.me.username}?start=ref_${userId}`;
        
        const keyboard = new InlineKeyboard()
            .url('📤 اشتراک‌گذاری لینک', `https://t.me/share/url?url=${inviteLink}&text=بیا تو ربات پیام ناشناس!`);

        await ctx.reply(`👥 <b>دعوت دوستان</b>\n\nلینک اختصاصی شما:\n<code>${inviteLink}</code>\n\n💰 <b>پاداش:</b> به ازای هر دعوت، ۱۰ سکه دریافت می‌کنید!`, { 
            parse_mode: 'HTML', 
            reply_markup: keyboard 
        });
    });

    // 7. برترین‌ها
    bot.hears('🏆 برترین‌های ربات', async (ctx) => {
        const topUsers = db.prepare('SELECT full_name, score FROM users ORDER BY score DESC LIMIT 10').all();
        
        if (topUsers.length === 0) {
            return ctx.reply('🏆 هنوز کاربری در ربات ثبت‌نام نکرده است.');
        }

        let text = '🏆 <b>برترین‌های ربات</b>\n\n';
        const medals = ['🥇', '🥈', '🥉'];
        
        topUsers.forEach((u, i) => {
            const medal = medals[i] || `${i+1}.`;
            text += `${medal} ${u.full_name} - <b>${u.score}</b> سکه\n`;
        });

        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 8. راهنما
    bot.hears('📜 راهنمای ربات', async (ctx) => {
        await ctx.reply('📖 راهنمای ربات:\n- لینک ناشناس بگیرید و به دوستان بدید.\n- با دعوت دوستان سکه بگیرید.\n- از فروشگاه خرید کنید.', { parse_mode: 'HTML' });
    });

    // 9. ارتباط با ادمین
    bot.hears('📩 ارتباط با ادمین', async (ctx) => {
        await ctx.reply('📩 هر پیامی که می‌خواهی رو همینجا بنویس تا به ادمین ارسال بشه:');
    });

    // 10. حمایت مالی
    bot.hears('💠 حمایت مالی', async (ctx) => {
        const keyboard = new InlineKeyboard().url('💠 حمایت مالی', 'https://reymit.ir/your_link');
        await ctx.reply('💠 با حمایت شما، ما می‌تونیم ربات رو بهتر کنیم ❤️', { reply_markup: keyboard });
    });

    // 11. هندلر خرید محصول
    bot.callbackQuery(/^buy_(\d+)$/, async (ctx) => {
        const itemId = parseInt(ctx.match[1]);
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(ctx.from.id);
        const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);

        if (!item || !user) return ctx.answerCallbackQuery('❌ خطا!');

        if (user.score < item.price) {
            return ctx.answerCallbackQuery('❌ موجودی سکه شما کافی نیست!', { show_alert: true });
        }

        // کسر سکه و ثبت خرید
        db.prepare('UPDATE users SET score = score - ? WHERE telegram_id = ?').run(item.price, ctx.from.id);
        db.prepare('INSERT INTO user_purchases (user_id, item_id, purchased_at) VALUES (?, ?, ?)').run(ctx.from.id, itemId, new Date().toISOString());

        await ctx.answerCallbackQuery('✅ خرید با موفقیت انجام شد!', { show_alert: true });
        await ctx.editMessageText(`🎉 شما محصول <b>${item.name}</b> را خریداری کردید!\n💰 سکه باقیمانده: <b>${user.score - item.price}</b>`, { parse_mode: 'HTML' });
    });
};