// منوی اصلی ادمین
function getAdminMenu() {
    return [
        ['👥 کاربران', '📢 پیام همگانی'],
        ['📩 پیام‌های دریافتی', '📊 آمار ربات'],
        ['⚙️ تنظیمات', '🔕 خاموش/روشن'],
        ['🔙 بازگشت']
    ];
}

// زیرمنوی کاربران
function getUsersSubmenu() {
    return [
        ['👥 همه کاربران', '🚫 کاربران مسدود'],
        ['🔎 سرچ کاربران'],
        ['🔙 بازگشت']
    ];
}

// زیرمنوی تنظیمات
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