const { InlineKeyboard } = require('grammy');
const { OWNER_ID } = require('../config');
const db = require('../database/db');

function getUserMenu(telegramId) {
    const keyboard = [
        ['👤 پروفایل من', '💰 سکه‌های من'],
        ['🛍️ فروشگاه ربات', '🏦 بانک انتقال'],
        ['🔗 لینک ناشناس من', '🏆 برترین‌های ربات'],
        ['👥 دعوت دوستان', '📜 راهنمای ربات'],
        ['📩 ارتباط با ادمین', '💠 حمایت مالی']
    ];

    // بررسی ادمین بودن برای نمایش دکمه پنل
    const isAdmin = telegramId === OWNER_ID || db.prepare('SELECT * FROM admins WHERE telegram_id = ?').get(telegramId);
    
    if (isAdmin) {
        keyboard.push(['👑 پنل مدیریت']);
    }

    return keyboard;
}

module.exports = { getUserMenu };