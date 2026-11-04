const { InlineKeyboard } = require('grammy');
const { OWNER_ID } = require('../config');
const db = require('../database/db');

function getUserMenu(userId = null) {
    const keyboard = [
        ['👤 پروفایل من', '💰 سکه‌های من'],
        ['🔗 لینک ناشناس من', '🏆 برترین‌های ربات'],
        ['🪙 سکه روزانه رایگان', '🏦 بانک انتقال'],
        ['🛍️ فروشگاه', '🎁 کد هدیه'],
        ['🚀 ارتقا پنل', '👥 دعوت دوستان'],
        ['🥇 رتبه من', '📜 راهنمای ربات'],
        ['📩 ارتباط با ادمین', '💠 حمایت مالی']
    ];

    let isAdmin = false;
    if (userId) {
        if (userId === OWNER_ID) {
            isAdmin = true;
        } else {
            const dbAdmin = db.prepare('SELECT * FROM admins WHERE telegram_id = ?').get(userId);
            if (dbAdmin) isAdmin = true;
        }
    }

    if (isAdmin) {
        keyboard.push(['👑 پنل مدیریت']);
    }

    return keyboard;
}

module.exports = { getUserMenu };