const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'هاشتاق' },
  whatsapp: { type: String, default: '972597518416' },
  address: { type: String, default: 'فلسطين' },
  password: { type: String, default: '123456789' },
  happyClients: { type: Number, default: 1500 }
});

module.exports = mongoose.model('Settings', settingsSchema);
