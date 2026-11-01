const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'bot.db'));

function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER UNIQUE NOT NULL,
            user_code INTEGER UNIQUE, /* کد اختصاصی کاربر */
            username TEXT,
            full_name TEXT NOT NULL,
            join_date TEXT NOT NULL,
            is_banned BOOLEAN DEFAULT 0,
            warnings INTEGER DEFAULT 0,
            is_verified INTEGER DEFAULT 0,
            phone_number TEXT,
            score INTEGER DEFAULT 0, /* سکه */
            invite_count INTEGER DEFAULT 0
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
            status TEXT DEFAULT 'sent',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS admins (
            telegram_id INTEGER PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS shop_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER NOT NULL,
            emoji TEXT,
            tag_emoji TEXT,
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS user_purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            purchased_at TEXT NOT NULL,
            UNIQUE(user_id, item_id)
        );

        CREATE TABLE IF NOT EXISTS coin_transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            fee INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );
    `);
    
    const defaultSettings = {
        'bot_enabled': '1',
        'bot_status_text': 'ربات در حال تعمیر است...',
        'start_text': 'سلام! به ربات پیام ناشناس خوش آمدید.',
        'force_join': '0',
        'force_channel': '',
        'transfer_min': '20',
        'transfer_fee': '2'
    };
    
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(defaultSettings)) {
        stmt.run(key, value);
    }

    // اختصاص کد به کاربرانی که کد ندارن
    const usersWithoutCode = db.prepare('SELECT id FROM users WHERE user_code IS NULL').all();
    const updateCodeStmt = db.prepare('UPDATE users SET user_code = ? WHERE id = ?');
    usersWithoutCode.forEach(u => {
        updateCodeStmt.run(Math.floor(Math.random() * 90000) + 10000, u.id); // کد 5 رقمی
    });

    console.log('✅ Database initialized');
}

initDb();

module.exports = db;