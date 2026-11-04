const { InlineKeyboard } = require('grammy');
const db = require('../database/db');
const { OWNER_ID } = require('../config');
const { 
    getAdminMenu, 
    getUsersSubmenu, 
    getSettingsMenu, 
    getAdminsMenu 
} = require('../keyboards/admin');

module.exports = (bot) => {
    // منوهای اصلی
    bot.hears('👑 پنل مدیریت', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        ctx.session.adminState = null;
        await ctx.reply('👑 <b>پنل مدیریت</b>', {
            parse_mode: 'HTML',
            reply_markup: { keyboard: getAdminMenu(), resize_keyboard: true }
        });
    });

    bot.hears('👤 مدیریت کاربران', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const banned = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get().count;
        const text = `👤 <b>مدیریت کاربران</b>\n\n📊 آمار:\n• کل کاربران: <b>${total}</b>\n• مسدود: <b>${banned}</b>`;
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { keyboard: getUsersSubmenu(), resize_keyboard: true } });
    });

    bot.hears('👤 ادمین‌ها', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        ctx.session.adminState = null;
        await ctx.reply('👤 <b>مدیریت ادمین‌ها</b>', { parse_mode: 'HTML', reply_markup: { keyboard: getAdminsMenu(), resize_keyboard: true } });
    });

    bot.hears('⚙️ تنظیمات', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        ctx.session.adminState = null;
        await ctx.reply('⚙️ <b>تنظیمات ربات</b>', { parse_mode: 'HTML', reply_markup: { keyboard: getSettingsMenu(), resize_keyboard: true } });
    });

    // دکمه‌های عملیاتی
    bot.hears('💰 مدیریت سکه کاربران', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        ctx.session.adminState = 'waiting_for_coin_user';
        await ctx.reply('💰 <b>مدیریت سکه</b>\n\nلطفاً آیدی عددی کاربر را وارد کنید (یا برای انصراف /start بزنید):', { parse_mode: 'HTML' });
    });

    bot.hears('📊 آمار ربات', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const bannedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get().count;
        const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
        const totalCoins = db.prepare('SELECT SUM(score) as sum FROM users').get().sum || 0;

        const text = `
📊 <b>آمار کامل ربات</b>

👥 کل کاربران: <b>${totalUsers}</b>
🚫 کاربران مسدود: <b>${bannedUsers}</b>
📩 کل پیام‌های ناشناس: <b>${totalMessages}</b>
💰 کل سکه‌های در گردش: <b>${totalCoins}</b>
        `;
        await ctx.reply(text, { parse_mode: 'HTML' });
    });

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

    // مدیریت ادمین‌ها
    bot.hears('➕ افزودن ادمین', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        ctx.session.adminState = 'waiting_for_admin_id';
        await ctx.reply('➕ لطفاً آیدی عددی کاربر را برای ادمین شدن ارسال کنید:');
    });

    bot.hears('📋 لیست مدیران', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        const admins = db.prepare('SELECT * FROM admins').all();
        let text = '📋 <b>لیست ادمین‌ها:</b>\n\n';
        text += `👑 مالک: <code>${OWNER_ID}</code>\n`;
        admins.forEach(a => {
            text += `👤 ادمین: <code>${a.telegram_id}</code>\n`;
        });
        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // زیرمنوها
    bot.hears('👥 همه کاربران', async (ctx) => {
        if (ctx.from.id !== OWNER_ID) return;
        const users = db.prepare('SELECT * FROM users ORDER BY id DESC LIMIT 20').all();
        let text = '👥 <b>لیست ۲۰ کاربر آخر:</b>\n\n';
        users.forEach((u, i) => {
            text += `${i+1}. ${u.full_name} | کد: ${u.user_code} | <code>${u.telegram_id}</code> | ${u.is_banned ? '🚫' : '✅'}\n`;
        });
        await ctx.reply(text, { parse_mode: 'HTML' });
    });

    // هندلر State ادمین
    bot.on('message:text', async (ctx, next) => {
        if (ctx.from.id !== OWNER_ID || !ctx.session.adminState) return next();
        
        const state = ctx.session.adminState;
        const text = ctx.message.text.trim();

        if (text.startsWith('/')) {
            ctx.session.adminState = null;
            return next();
        }

        if (state === 'waiting_for_coin_user') {
            try {
                const targetId = parseInt(text);
                const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(targetId);
                if (!user) return await ctx.reply('❌ کاربری با این آیدی یافت نشد. دوباره تلاش کنید:');
                
                ctx.session.targetUserId = targetId;
                ctx.session.adminState = 'waiting_for_coin_amount';
                await ctx.reply(`👤 کاربر پیدا شد: <b>${user.full_name}</b>\n💰 موجودی فعلی: <b>${user.score}</b>\n\nمقدار سکه برای اضافه/کم کردن را وارد کنید (مثلاً 100 یا -100):`, { parse_mode: 'HTML' });
            } catch (e) {
                await ctx.reply('❌ لطفاً یک آیدی عددی معتبر وارد کنید:');
            }
            return;
        }

        if (state === 'waiting_for_coin_amount') {
            const amount = parseInt(text);
            if (isNaN(amount)) return await ctx.reply('❌ لطفاً یک عدد معتبر وارد کنید:');

            const targetId = ctx.session.targetUserId;
            db.prepare('UPDATE users SET score = score + ? WHERE telegram_id = ?').run(amount, targetId);
            const updatedUser = db.prepare('SELECT score FROM users WHERE telegram_id = ?').get(targetId);
            
            await ctx.reply(`✅ عملیات با موفقیت انجام شد!\n💰 موجودی جدید کاربر: <b>${updatedUser.score}</b> سکه`, { parse_mode: 'HTML', reply_markup: { keyboard: getAdminMenu(), resize_keyboard: true } });
            
            ctx.session.adminState = null;
            ctx.session.targetUserId = null;
            return;
        }

        if (state === 'waiting_for_admin_id') {
            try {
                const newAdminId = parseInt(text);
                db.prepare('INSERT OR IGNORE INTO admins (telegram_id) VALUES (?)').run(newAdminId);
                await ctx.reply(`✅ کاربر <code>${newAdminId}</code> با موفقیت ادمین شد!`, { parse_mode: 'HTML', reply_markup: { keyboard: getAdminMenu(), resize_keyboard: true } });
            } catch (e) {
                await ctx.reply('❌ خطا در افزودن ادمین.');
            }
            ctx.session.adminState = null;
            return;
        }
        return next();
    });
};