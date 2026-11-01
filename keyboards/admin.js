function getAdminMenu() {
    return [
        ['👥 کاربران', '📢 پیام همگانی'],
        ['📩 پیام‌های دریافتی', '📊 آمار ربات'],
        ['⚙️ تنظیمات', '🔕 خاموش/روشن'],
        ['🔙 بازگشت']
    ];
}

function getUsersSubmenu() {
    return [
        ['👥 همه کاربران', '🚫 کاربران مسدود'],
        ['🔎 سرچ کاربران'],
        ['🔙 بازگشت']
    ];
}

function getSettingsMenu() {
    return [
        ['📝 تنظیم متن استارت', '🔗 تنظیم کانال جوین اجباری'],
        ['🔙 بازگشت']
    ];
}

module.exports = {
    getAdminMenu,
    getUsersSubmenu,
    getSettingsMenu
};