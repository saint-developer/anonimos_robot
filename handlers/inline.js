const { InlineKeyboard } = require('grammy');
const db = require('../database/db');

module.exports = (bot) => {
    bot.on('inline_query', async (ctx) => {
        const query = ctx.inlineQuery.query.trim();
        const userId = ctx.from.id;

        // اگر کاربر تایپ نکرده بود
        if (!query) {
            return await ctx.answerInlineQuery([
                {
                    type: 'article',
                    id: 'empty',
                    title: '✍️ پیام خود را بنویسید...',
                    description: 'متن پیام ناشناس را بعد از نام ربات بنویسید',
                    input_message_content: {
                        message_text: '⚠️ لطفاً متن پیام را وارد کنید.'
                    }
                }
            ]);
        }

        // بررسی وجود کاربر در دیتابیس
        const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
        if (!user) {
            return await ctx.answerInlineQuery([
                {
                    type: 'article',
                    id: 'not_registered',
                    title: '❌ ابتدا ربات را استارت کنید',
                    description: 'برای استفاده از این بخش، ابتدا باید ربات را استارت کنید.',
                    input_message_content: {
                        message_text: '❌ لطفاً ابتدا ربات را استارت کنید.'
                    }
                }
            ]);
        }

        // ثبت پیام در دیتابیس برای پاسخ‌دهی
        const now = new Date().toISOString();
        const msgRecord = db.prepare('INSERT INTO messages (sender_id, text, created_at, status) VALUES (?, ?, ?, ?)')
            .run(userId, query, now, 'inline_sent');
        
        const msgId = msgRecord.lastInsertRowid;

        // دکمه‌های شیشه‌ای
        const keyboard = new InlineKeyboard()
            .text('✍️ پاسخ ناشناس', `reply_inline_${msgId}_${userId}`);

        // نتیجه اینلاین
        const results = [
            {
                type: 'article',
                id: `msg_${msgId}`,
                title: '📩 ارسال پیام ناشناس',
                description: `متن: ${query}`,
                input_message_content: {
                    message_text: `📩 <b>پیام ناشناس جدید:</b>\n\n${query}\n\n<i>برای پاسخ، روی دکمه زیر بزنید.</i>`,
                    parse_mode: 'HTML'
                },
                reply_markup: keyboard
            }
        ];

        await ctx.answerInlineQuery(results, { cache_time: 0 });
    });

    // هندلر دکمه پاسخ به پیام اینلاین
    bot.callbackQuery(/^reply_inline_(\d+)_(\d+)$/, async (ctx) => {
        const msgId = ctx.match[1];
        const receiverId = ctx.match[2];
        
        if (ctx.from.id === parseInt(receiverId)) {
            return ctx.answerCallbackQuery('❌ شما نمی‌توانید به پیام خودتان پاسخ دهید.', { show_alert: true });
        }

        await ctx.answerCallbackQuery('✍️ حالا پاسخ خود را در چت بنویسید.');
        
        ctx.session.replyingToInlineMsg = msgId;
        ctx.session.replyingToUserId = receiverId;
        
        await ctx.reply(`✍️ پاسخ خود را برای این پیام بنویسید:`);
    });

    // هندلر دریافت متن پاسخ برای اینلاین
    bot.on('message:text', async (ctx, next) => {
        if (!ctx.session.replyingToInlineMsg) return next();
        
        const replyText = ctx.message.text;
        const targetUserId = ctx.session.replyingToUserId;
        const msgId = ctx.session.replyingToInlineMsg;

        try {
            await ctx.api.sendMessage(targetUserId, `📬 <b>پاسخ ناشناس به پیام شما:</b>\n\n${replyText}`, { parse_mode: 'HTML' });
            db.prepare('UPDATE messages SET reply_text = ?, status = ? WHERE id = ?').run(replyText, 'replied', msgId);
            await ctx.reply('✅ پاسخ شما ارسال شد.');
        } catch (e) {
            await ctx.reply('❌ خطا در ارسال پاسخ.');
        }

        ctx.session.replyingToInlineMsg = null;
        ctx.session.replyingToUserId = null;
    });
};