const { InlineKeyboard } = require('grammy');
const { OWNER_ID } = require('../config');
const db = require('../database/db');

function getUserMenu(telegramId) {
    const keyboard = [
        ['👤 پروفایل من', '💰 سکه‌های من'],
        ['🛍️ فروشگاه ربات', '🏦 بانک انتقال'],
        ['🔗 لینک ناشناس من', '🏆 برترین‌های ربات'],
        ['📜 راهنمای ربات', '📩 ارتباط با ادمین'],
        ['💠 حمایت مالی']
    ];

    const isAdmin = telegramId === OWNER_ID || db.prepare('SELECT * FROM admins WHERE telegram_id = ?').get(telegramId);
    if (isAdmin) keyboard.push(['👑 پنل مدیریت']);

    return keyboard;
}

function getAnonymousKeyboard(botUsername) {
    return new InlineKeyboard()
        .url('🚀 ارسال پیام ناشناس', `https://t.me/${botUsername}?start=anon`)
        .row()
        .url('📤 اشتراک‌گذاری لینک', `https://t.me/share/url?url=https://t.me/${botUsername}?start=anon&text=به من پیام ناشناس بفرست!`);
}

function getBackKeyboard() {
    return [['🔙 بازگشت']];
}

module.exports = {
    getUserMenu,
    getAnonymousKeyboard,
    getBackKeyboard
};