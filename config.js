require('dotenv').config();

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    OWNER_ID: parseInt(process.env.OWNER_UUID || '0'),
    OWNER_NAME: process.env.OWNER_NAME || 'Message Owner',
};