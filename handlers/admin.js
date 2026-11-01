const { InlineKeyboard } = require('grammy');
const db = require('../database/db');
const { OWNER_ID } = require('../config');
const { getAdminMenu, getUsersSubmenu, getSettingsMenu } = require('../keyboards/admin');
const { getBackKeyboard } = require('../keyboards/user');

module.exports = (bot) => {
    // 1. پنل مدیریت
    bot.hears('👑 پنل مدیریت', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        
        await ctx.reply('👑 <b>پنل مدیریت</b>\n\nخوش آمدید.', {
            parse_mode: 'HTML',
            reply_markup: { keyboard: getAdminMenu(), resize_keyboard: true }
        });
    });

    // 2. کاربران
    bot.hears('👥 کاربران', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        
        const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const banned = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get().count;
        
        const text = `👥 <b>مدیریت کاربران</b>\n\n📊 آمار:\n• کل کاربران: <b>${total}</b>\n• مسدود: <b>${banned}</b>`;
        
        await ctx.reply(text, {
            parse_mode: 'HTML',
            reply_markup: { keyboard: getUsersSubmenu(), resize_keyboard: true }
        });
    });

    // 3. آمار ربات
    bot.hears('📊 آمار ربات', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;

        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const bannedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get().count;
        const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
        const repliedMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE status = ?').get('replied').count;

        const text = `
📊 <b>آمار کامل ربات</b>

👥 کل کاربران: <b>${totalUsers}</b>
🚫 کاربران مسدود: <b>${bannedUsers}</b>
📩 کل پیام‌های ناشناس: <b>${totalMessages}</b>
✅ پیام‌های پاسخ داده شده: <b>${repliedMessages}</b>
        `;

        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // 4. تنظیمات
    bot.hears('⚙️ تنظیمات', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        await ctx.reply('⚙️ <b>تنظیمات ربات</b>', {
            parse_mode: 'HTML',
            reply_markup: { keyboard: getSettingsMenu(), resize_keyboard: true }
        });
    });

    // 5. خاموش/روشن
    bot.hears('🔕 خاموش/روشن', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        
        const current = db.prepare('SELECT value FROM settings WHERE key = ?').get('bot_enabled')?.value;
        const newStatus = current === '1' ? '0' : '1';
        db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(newStatus, 'bot_enabled');
        
        await ctx.reply(`✅ وضعیت ربات به <b>${newStatus === '1' ? 'روشن' : 'خاموش'}</b> تغییر یافت.`, {
            parse_mode: 'HTML',
            reply_markup: { keyboard: getAdminMenu(), resize_keyboard: true }
        });
    });

    // 6. پیام‌های دریافتی
    bot.hears('📩 پیام‌های دریافتی', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        
        const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 10').all();
        
        if (messages.length === 0) {
            return ctx.reply('📭 هیچ پیامی وجود ندارد.');
        }

        for (const msg of messages) {
            const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(msg.sender_id);
            const userName = user ? user.full_name : 'ناشناس';
            const date = new Date(msg.created_at).toLocaleDateString('fa-IR');
            
            await ctx.reply(
                `📩 <b>پیام از:</b> ${userName}\n📅 <b>تاریخ:</b> ${date}\n\n💬 <b>متن:</b>\n${msg.text}\n\nوضعیت: ${msg.status === 'replied' ? '✅ پاسخ داده شده' : '⏳ در انتظار پاسخ'}`,
                { parse_mode: 'HTML' }
            );
        }
    });

    // دکمه‌های زیرمنو
    bot.hears('👥 همه کاربران', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        const users = db.prepare('SELECT * FROM users ORDER BY id DESC LIMIT 20').all();
        let text = '👥 <b>لیست ۲۰ کاربر آخر:</b>\n\n';
        users.forEach((u, i) => {
            text += `${i+1}. ${u.full_name} | <code>${u.telegram_id}</code> | ${u.is_banned ? '🚫' : '✅'}\n`;
        });
        await ctx.reply(text, { parse_mode: 'HTML' });
    });
};