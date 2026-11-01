const { InlineKeyboard } = require('grammy');
const db = require('../database/db');
const { OWNER_ID, OWNER_NAME } = require('../config');

module.exports = (bot) => {
    
    // هندلر دریافت عکس، ویدیو، ویس
bot.on(['message:photo', 'message:video', 'message:voice'], async (ctx, next) => {
    const userId = ctx.from.id;
    if (userId === OWNER_ID) return next();

    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
    if (!user || user.is_banned) return;

    try {
        let caption = `📩 <b>پیام ناشناس جدید (رسانه):</b>\n\n`;
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
        db.prepare('INSERT INTO messages (sender_id, text, created_at, status) VALUES (?, ?, ?, ?)').run(userId, '[رسانه]', now, 'sent');

        await ctx.reply('✅ رسانه شما ناشناس ارسال شد.');
    } catch (e) {
        await ctx.reply('❌ خطا در ارسال رسانه.');
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