const { InlineKeyboard } = require('grammy');
const db = require('../database/db');
const { OWNER_ID } = require('../config');
const { getAdminMenu } = require('../keyboards/admin');

module.exports = (bot) => {
    // هندلر دکمه پنل مدیریت
    bot.hears('👑 پنل مدیریت', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return; // فقط ادمین اصلی
        
        await ctx.reply('👑 <b>پنل مدیریت</b>\n\nبه پنل مدیریت خوش آمدید.', {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: getAdminMenu(),
                resize_keyboard: true
            }
        });
    });

    // دکمه آمار ربات
    bot.hears('📊 آمار ربات', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;

        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const bannedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get().count;
        const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;

        const text = `
📊 <b>آمار ربات</b>

👥 کل کاربران: ${totalUsers}
🚫 کاربران مسدود: ${bannedUsers}
📩 کل پیام‌ها: ${totalMessages}
        `;

        await ctx.reply(text, { parse_mode: 'HTML' });
    });
};