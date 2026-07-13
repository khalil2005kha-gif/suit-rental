const mongoose = require('mongoose');

const suitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  sizes: [{ type: String }],
  colors: [{ type: String }],
  category: { type: String, default: 'كلاسيك' },
  available: { type: Boolean, default: true },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

module.exports = mongoose.model('Suit', suitSchema);
