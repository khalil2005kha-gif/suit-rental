const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Ensure directories exist ─────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
const dbPath = path.join(__dirname, 'database.json');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Database helpers ─────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(dbPath)) {
    const initial = {
      suits: [],
      bookings: [],
      settings: {
        storeName: "هاشتاق",
        whatsapp: "970593425031",
        address: "فلسطين"
      }
    };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Multer Config ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

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
app.get('/api/suits', (req, res) => {
  const db = readDB();
  res.json({ success: true, suits: db.suits });
});

// GET single suit
app.get('/api/suits/:id', (req, res) => {
  const db = readDB();
  const suit = db.suits.find(s => s.id === req.params.id);
  if (!suit) return res.status(404).json({ success: false, message: 'البدلة غير موجودة' });
  res.json({ success: true, suit });
});

// POST add suit (with images)
app.post('/api/suits', upload.array('images', 10), (req, res) => {
  try {
    const { name, description, price, sizes, colors, category, available } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'الاسم والسعر مطلوبان' });
    }

    const images = (req.files || []).map(f => `/uploads/${f.filename}`);
    const newSuit = {
      id: uuidv4(),
      name,
      description: description || '',
      price: parseFloat(price),
      sizes: sizes ? (Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim())) : [],
      colors: colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim())) : [],
      category: category || 'كلاسيك',
      available: available !== 'false',
      images,
      createdAt: new Date().toISOString(),
    };

    const db = readDB();
    db.suits.unshift(newSuit);
    writeDB(db);

    res.json({ success: true, suit: newSuit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update suit
app.put('/api/suits/:id', upload.array('images', 10), (req, res) => {
  try {
    const db = readDB();
    const idx = db.suits.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'البدلة غير موجودة' });

    const { name, description, price, sizes, colors, category, available, keepImages } = req.body;
    const existing = db.suits[idx];

    // New uploaded images
    const newImages = (req.files || []).map(f => `/uploads/${f.filename}`);

    // Keep old images if requested
    let finalImages = [];
    if (keepImages) {
      const kept = Array.isArray(keepImages) ? keepImages : [keepImages];
      finalImages = [...kept, ...newImages];
    } else {
      finalImages = newImages.length > 0 ? newImages : existing.images;
    }

    db.suits[idx] = {
      ...existing,
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      price: price ? parseFloat(price) : existing.price,
      sizes: sizes ? (Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim())) : existing.sizes,
      colors: colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim())) : existing.colors,
      category: category || existing.category,
      available: available !== undefined ? available !== 'false' : existing.available,
      images: finalImages,
      updatedAt: new Date().toISOString(),
    };

    writeDB(db);
    res.json({ success: true, suit: db.suits[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE suit
app.delete('/api/suits/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = db.suits.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'البدلة غير موجودة' });

    // Delete image files
    const suit = db.suits[idx];
    suit.images.forEach(imgPath => {
      const fullPath = path.join(__dirname, imgPath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });

    db.suits.splice(idx, 1);
    writeDB(db);

    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//   BOOKINGS API
// ═══════════════════════════════════════════════════════════════

// POST new booking request
app.post('/api/bookings', (req, res) => {
  try {
    const { suitId, customerName, phone, date, notes } = req.body;
    if (!customerName || !phone) {
      return res.status(400).json({ success: false, message: 'الاسم ورقم الهاتف مطلوبان' });
    }

    const db = readDB();
    const booking = {
      id: uuidv4(),
      suitId: suitId || null,
      customerName,
      phone,
      date: date || null,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.bookings.unshift(booking);
    writeDB(db);

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all bookings (admin)
app.get('/api/bookings', (req, res) => {
  const db = readDB();
  res.json({ success: true, bookings: db.bookings });
});

// PUT update booking status
app.put('/api/bookings/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = db.bookings.findIndex(b => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'الحجز غير موجود' });
    db.bookings[idx] = { ...db.bookings[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeDB(db);
    res.json({ success: true, booking: db.bookings[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE booking
app.delete('/api/bookings/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = db.bookings.findIndex(b => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'الحجز غير موجود' });
    db.bookings.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Upload standalone image ───────────────────────────────────
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'لا يوجد ملف' });
  res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// ─── Settings API ──────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json({ success: true, settings: db.settings || {} });
});

app.put('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...(db.settings || {}), ...req.body };
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// ─── Fallback to index ────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎩 هاشتاق - سيرفر يعمل على:`);
  console.log(`   http://localhost:${PORT}       ← الصفحة الرئيسية`);
  console.log(`   http://localhost:${PORT}/admin  ← لوحة الإدارة\n`);
});
