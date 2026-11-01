const { InlineKeyboard } = require('grammy');
const { OWNER_ID } = require('../config');
const db = require('../database/db');

// منوی اصلی کاربر (Reply Keyboard)
function getUserMenu(telegramId) {
    const keyboard = [
        ['👤 پروفایل من', '📩 ارتباط با ادمین'],
        ['🏆 برترین‌های ربات', '📜 راهنمای ربات'],
        ['💠 حمایت مالی']
    ];

    // چک کردن ادمین بودن برای نمایش دکمه پنل مدیریت
    const isAdmin = telegramId === OWNER_ID || db.prepare('SELECT * FROM admins WHERE telegram_id = ?').get(telegramId);
    
    if (isAdmin) {
        keyboard.push(['👑 پنل مدیریت']);
    }

    return keyboard;
}

// کیبورد بازگشت
function getBackKeyboard() {
    return [['🔙 بازگشت']];
}

module.exports = {
    getUserMenu,
    getBackKeyboard
};