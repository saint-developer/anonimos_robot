const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'bot.db'));

// راه‌اندازی جداول
function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER UNIQUE NOT NULL,
            username TEXT,
            full_name TEXT NOT NULL,
            join_date TEXT NOT NULL,
            is_banned BOOLEAN DEFAULT 0,
            warnings INTEGER DEFAULT 0,
            is_verified INTEGER DEFAULT 0,
            phone_number TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            owner_msg_id INTEGER,
            text TEXT NOT NULL,
            reply_text TEXT,
            status TEXT DEFAULT 'sent', -- sent, replied, deleted
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS admins (
            telegram_id INTEGER PRIMARY KEY
        );
    `);
    
    // تنظیمات پیش‌فرض
    const defaultSettings = {
        'bot_enabled': '1',
        'bot_status_text': 'ربات در حال تعمیر است...',
        'start_text': 'سلام! به ربات پیام ناشناس خوش آمدید.',
        'force_join': '0', // 0 = خاموش، 1 = روشن
        'force_channel': '',
    };
    
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(defaultSettings)) {
        stmt.run(key, value);
    }

    console.log('✅ Database initialized');
}

initDb();

module.exports = db;