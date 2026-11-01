const { InlineKeyboard } = require('grammy');
const db = require('../database/db');
const { OWNER_ID, OWNER_NAME } = require('../config');

module.exports = (bot) => {
    
    // هندلر دریافت پیام متنی از کاربران عادی
    bot.on('message:text', async (ctx, next) => {
        const userId = ctx.from.id;
        const text = ctx.message.text;

        // اگه پیام از طرف ادمین بود یا با دکمه‌های منو شروع میشد، برو هندلرهای بعدی
        if (userId === OWNER_ID) return next();
        if (text.startsWith('/')) return;
        
        const menuButtons = ['👤 پروفایل من', '📜 راهنمای ربات', '📩 ارتباط با ادمین', '💠 حمایت مالی', '🏆 برترین‌های ربات', '👑 پنل مدیریت', '🔙 بازگشت', '👥 کاربران', '📢 پیام همگانی', '📩 پیام‌های دریافتی', '📊 آمار ربات', '⚙️ تنظیمات', '🔕 خاموش/روشن'];
        if (menuButtons.includes(text)) return next();

        // چک کردن مسدود بودن کاربر
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
        if (user && user.is_banned) {
            return ctx.reply('🚫 شما توسط ادمین مسدود شده‌اید و نمی‌توانید پیام بفرستید!');
        }

        // چک کردن روشن بودن ربات
        const botEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('bot_enabled')?.value;
        if (botEnabled === '0') {
            const statusText = db.prepare('SELECT value FROM settings WHERE key = ?').get('bot_status_text')?.value || 'ربات خاموش است.';
            return ctx.reply(`🔕 <b>${statusText}</b>`, { parse_mode: 'HTML' });
        }

        try {
            // ارسال پیام به ادمین
            const sentToOwner = await ctx.api.sendMessage(
                OWNER_ID, 
                `📩 <b>پیام ناشناس جدید:</b>\n\n${text}`, 
                { parse_mode: 'HTML' }
            );

            // ذخیره در دیتابیس برای ریپلای
            const now = new Date().toISOString();
            db.prepare('INSERT INTO messages (sender_id, owner_msg_id, text, created_at) VALUES (?, ?, ?, ?)')
              .run(userId, sentToOwner.message_id, text, now);

            await ctx.reply('✅ پیام شما با موفقیت به صورت ناشناس برای مدیر ارسال شد.');
        } catch (error) {
            console.error('Error sending anonymous message:', error);
            await ctx.reply('❌ خطایی در ارسال پیام پیش آمد. لطفاً بعداً تلاش کنید.');
        }
    });

    // هندلر دریافت ریپلای از طرف ادمین
    bot.on('message:text', async (ctx, next) => {
        const userId = ctx.from.id;
        const text = ctx.message.text;

        if (userId !== OWNER_ID) return next();
        if (text.startsWith('/')) return;

        // چک کردن اینکه ادمین داره به یه پیام ریپلای می‌زنه یا نه
        const repliedTo = ctx.message.reply_to_message;
        if (!repliedTo) return next();

        // پیدا کردن کاربر اصلی بر اساس آیدی پیام ادمین
        const originalMsg = db.prepare('SELECT * FROM messages WHERE owner_msg_id = ?').get(repliedTo.message_id);
        if (!originalMsg) return next();

        try {
            // ارسال پاسخ به کاربر اصلی
            await ctx.api.sendMessage(
                originalMsg.sender_id,
                `📬 <b>پاسخ مدیر به پیام ناشناس شما:</b>\n\n${text}`,
                { parse_mode: 'HTML' }
            );

            // آپدیت دیتابیس
            db.prepare('UPDATE messages SET reply_text = ?, status = ? WHERE id = ?')
              .run(text, 'replied', originalMsg.id);

            await ctx.reply('✅ پاسخ شما برای کاربر ارسال شد.', {
                reply_to_message_id: ctx.message.message_id
            });
        } catch (error) {
            console.error('Error sending owner reply:', error);
            await ctx.reply('❌ خطا در ارسال پاسخ. شاید کاربر ربات را بلاک کرده باشد.');
        }
    });
};