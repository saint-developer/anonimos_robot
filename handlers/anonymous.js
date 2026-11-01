const { InlineKeyboard } = require('grammy');
const db = require('../database/db');
const { OWNER_ID, OWNER_NAME } = require('../config');

module.exports = (bot) => {
    
    // 1. هندلر دریافت پیام متنی از کاربران (پیام ناشناس)
    bot.on('message:text', async (ctx, next) => {
        const userId = ctx.from.id;
        const text = ctx.message.text;

        // اگه پیام از طرف ادمین بود یا دستور بود، برو بعدی
        if (userId === OWNER_ID) return next();
        if (text.startsWith('/')) return;

        // لیست دکمه‌های منو (که نباید به عنوان پیام ناشناس ارسال بشن)
        const menuButtons = [
            '👤 پروفایل من', '💰 سکه‌های من', '🛍️ فروشگاه ربات', '🏦 بانک انتقال',
            '🔗 لینک ناشناس من', '🏆 برترین‌های ربات', '👥 دعوت دوستان',
            '📜 راهنمای ربات', '📩 ارتباط با ادمین', '💠 حمایت مالی',
            '👑 پنل مدیریت', '🔙 بازگشت'
        ];
        
        if (menuButtons.includes(text)) return next();

        // بررسی مسدود بودن کاربر
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
        if (user && user.is_banned) {
            return ctx.reply('🚫 شما توسط ادمین مسدود شده‌اید و نمی‌توانید پیام بفرستید!');
        }

        // بررسی روشن بودن ربات
        const botEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('bot_enabled')?.value;
        if (botEnabled === '0') {
            const statusText = db.prepare('SELECT value FROM settings WHERE key = ?').get('bot_status_text')?.value || 'ربات خاموش است.';
            return ctx.reply(`🔕 <b>${statusText}</b>`, { parse_mode: 'HTML' });
        }

        try {
            // ارسال پیام به ادمین
            const senderCode = user && user.user_code ? user.user_code : userId;
            
            const sentToOwner = await ctx.api.sendMessage(
                OWNER_ID, 
                `📩 <b>پیام ناشناس جدید (کاربر #${senderCode}):</b>\n\n${text}`, 
                { parse_mode: 'HTML' }
            );

            // ذخیره در دیتابیس برای ریپلای
            const now = new Date().toISOString();
            db.prepare('INSERT INTO messages (sender_id, owner_msg_id, text, created_at, status) VALUES (?, ?, ?, ?, ?)')
              .run(userId, sentToOwner.message_id, text, now, 'sent');

            await ctx.reply('✅ پیام شما با موفقیت به صورت ناشناس برای مدیر ارسال شد.');
        } catch (error) {
            console.error('Error sending anonymous message:', error);
            await ctx.reply('❌ خطایی در ارسال پیام پیش آمد. لطفاً بعداً تلاش کنید.');
        }
    });

    // 2. هندلر دریافت ریپلای از طرف ادمین
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

    // 3. هندلر دریافت رسانه (عکس، ویدیو، ویس)
    bot.on(['message:photo', 'message:video', 'message:voice'], async (ctx, next) => {
        const userId = ctx.from.id;
        if (userId === OWNER_ID) return next();

        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
        if (!user || user.is_banned) return;

        try {
            const senderCode = user.user_code || userId;
            let caption = `📩 <b>پیام ناشناس جدید (رسانه) از کاربر #${senderCode}:</b>\n\n`;
            if (ctx.message.caption) {
                caption += `💬 متن: ${ctx.message.caption}\n\n`;
            }

            if (ctx.message.photo) {
                const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;
                await ctx.api.sendPhoto(OWNER_ID, photo, { caption, parse_mode: 'HTML' });
            } else if (ctx.message.video) {
                await ctx.api.sendVideo(OWNER_ID, ctx.message.video.file_id, { caption, parse_mode: 'HTML' });
            } else if (ctx.message.voice) {
                await ctx.api.sendVoice(OWNER_ID, ctx.message.voice.file_id, { caption, parse_mode: 'HTML' });
            }

            // ذخیره در دیتابیس
            const now = new Date().toISOString();
            db.prepare('INSERT INTO messages (sender_id, text, created_at, status) VALUES (?, ?, ?, ?)')
              .run(userId, '[رسانه]', now, 'sent');

            await ctx.reply('✅ رسانه شما ناشناس ارسال شد.');
        } catch (e) {
            await ctx.reply('❌ خطا در ارسال رسانه.');
        }
    });
};