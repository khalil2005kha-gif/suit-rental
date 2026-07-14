require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Models
const Suit = require('./models/Suit');
const Booking = require('./models/Booking');
const Settings = require('./models/Settings');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MongoDB Connection ───────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/suit-rental';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🍃 متصل بقاعدة بيانات MongoDB السحابية بنجاح');
    seedDefaultSettings();
  })
  .catch(err => console.error('❌ فشل الاتصال بـ MongoDB:', err));

// ─── Cloudinary Config ────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper: Upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'suit-rental' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Helper: Delete file from Cloudinary by URL
const deleteFromCloudinary = (url) => {
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return;
    
    // Extract public ID including folders but excluding file extension
    const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
    
    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) console.error('Cloudinary delete error:', err);
    });
  } catch (err) {
    console.error('Cloudinary delete parsing error:', err);
  }
};

// ─── Seed default settings if empty ───────────────────────────
async function seedDefaultSettings() {
  try {
    const count = await Settings.countDocuments();
    if (count === 0) {
      const defaultSettings = new Settings({
        storeName: "هاشتاق",
        whatsapp: "972597518416",
        address: "فلسطين",
        password: "123456789"
      });
      await defaultSettings.save();
      console.log('🌱 تم تهيئة الإعدادات الافتراضية بنجاح');
    }
  } catch (err) {
    console.error('❌ خطأ في تهيئة الإعدادات:', err);
  }
}

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static sites
app.use(express.static(path.join(__dirname)));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ─── Multer Config (Memory Storage) ───────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('الصور المسموحة فقط: jpg, png, webp, gif'));
  },
});

// ═══════════════════════════════════════════════════════════════
//   SUITS API
// ═══════════════════════════════════════════════════════════════

// GET all suits
app.get('/api/suits', async (req, res) => {
  try {
    const suits = await Suit.find().sort({ createdAt: -1 });
    res.json({ success: true, suits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single suit
app.get('/api/suits/:id', async (req, res) => {
  try {
    const suit = await Suit.findById(req.params.id);
    if (!suit) return res.status(404).json({ success: false, message: 'البدلة غير موجودة' });
    res.json({ success: true, suit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add suit (with images)
app.post('/api/suits', upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, price, sizes, colors, category, available } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'الاسم والسعر مطلوبان' });
    }

    // Upload files to Cloudinary
    const uploadPromises = (req.files || []).map(f => uploadToCloudinary(f.buffer));
    const images = await Promise.all(uploadPromises);

    const newSuit = new Suit({
      name,
      description: description || '',
      price: parseFloat(price),
      sizes: sizes ? (Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim())) : [],
      colors: colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim())) : [],
      category: category || 'كلاسيك',
      available: available !== 'false',
      images,
    });

    await newSuit.save();
    res.json({ success: true, suit: newSuit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update suit
app.put('/api/suits/:id', upload.array('images', 10), async (req, res) => {
  try {
    const suit = await Suit.findById(req.params.id);
    if (!suit) return res.status(404).json({ success: false, message: 'البدلة غير موجودة' });

    const { name, description, price, sizes, colors, category, available, keepImages } = req.body;

    // Upload new files
    const uploadPromises = (req.files || []).map(f => uploadToCloudinary(f.buffer));
    const newImages = await Promise.all(uploadPromises);

    // Keep old images if requested
    let finalImages = [];
    if (keepImages) {
      const kept = Array.isArray(keepImages) ? keepImages : [keepImages];
      finalImages = [...kept, ...newImages];
    } else {
      finalImages = newImages.length > 0 ? newImages : suit.images;
    }

    suit.name = name || suit.name;
    suit.description = description !== undefined ? description : suit.description;
    suit.price = price ? parseFloat(price) : suit.price;
    suit.sizes = sizes ? (Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim())) : suit.sizes;
    suit.colors = colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim())) : suit.colors;
    suit.category = category || suit.category;
    suit.available = available !== undefined ? available !== 'false' : suit.available;
    suit.images = finalImages;
    suit.updatedAt = new Date();

    await suit.save();
    res.json({ success: true, suit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE suit
app.delete('/api/suits/:id', async (req, res) => {
  try {
    const suit = await Suit.findById(req.params.id);
    if (!suit) return res.status(404).json({ success: false, message: 'البدلة غير موجودة' });

    // Delete image files from Cloudinary
    if (suit.images && suit.images.length > 0) {
      suit.images.forEach(url => deleteFromCloudinary(url));
    }

    await Suit.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//   BOOKINGS API
// ═══════════════════════════════════════════════════════════════

// POST new booking request
app.post('/api/bookings', async (req, res) => {
  try {
    const { suitId, customerName, phone, date, notes } = req.body;
    if (!customerName || !phone) {
      return res.status(400).json({ success: false, message: 'الاسم ورقم الهاتف مطلوبان' });
    }

    const booking = new Booking({
      suitId: suitId || null,
      customerName,
      phone,
      date: date || null,
      notes: notes || '',
      status: 'pending'
    });

    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all bookings (admin)
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update booking status
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'الحجز غير موجود' });

    Object.assign(booking, req.body);
    booking.updatedAt = new Date();
    
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'الحجز غير موجود' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Upload standalone image (Cloudinary) ──────────────────────
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لا يوجد ملف' });
    const url = await uploadToCloudinary(req.file.buffer);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Settings API ──────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/visit', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    if (settings.happyClients === undefined || settings.happyClients === null) {
      settings.happyClients = 1500;
    }
    settings.happyClients += 1;
    await settings.save();
    res.json({ success: true, happyClients: settings.happyClients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Fallback to index ────────────────────────────────────────
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎩 هاشتاق - سيرفر يعمل على:`);
  console.log(`   http://localhost:${PORT}       ← الصفحة الرئيسية`);
  console.log(`   http://localhost:${PORT}/admin/ ← لوحة الإدارة\n`);
});
