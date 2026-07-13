const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  suitId: { type: String, default: null }, // we can keep it as string to map the old uuid or the new objectid string
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, default: null },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
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

module.exports = mongoose.model('Booking', bookingSchema);
