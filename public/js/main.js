/* ═══════════════════════════════════════════════════════════
   main.js — Suit Rental Landing Page Logic (Arabic/English)
   ═══════════════════════════════════════════════════════════ */

const API = '';

// ─── State ────────────────────────────────────────────────
let allSuits = [];
let filteredSuits = [];
let currentFilter = 'all';
let lightboxImages = [];
let lightboxIdx = 0;
let whatsappNumber = '970593425031'; // default fallback
let currentLanguage = 'ar';

// ─── Translations Dictionary ──────────────────────────────
const i18n = {
  ar: {
    logoText: "هاشتاق",
    navHome: "الرئيسية",
    navSuits: "البدل",
    navHow: "كيف نعمل",
    navContact: "تواصل",
    adminBtn: "لوحة الإدارة",
    heroTag: "✨ الأناقة في كل مناسبة",
    heroTitleHtml: "بدل فاخرة<br/><span class=\"gradient-text\">لكل مناسبة</span>",
    heroSubtitle: "أجّر أرقى البدل الرجالية بأسعار مناسبة. زفاف، خطوبة، مؤتمرات، وكل المناسبات الخاصة.",
    btnBrowse: "استعرض البدل",
    btnBookNow: "احجز الآن",
    statSuits: "بدلة متاحة",
    statClients: "عميل سعيد",
    statExperience: "سنوات خبرة",
    sectionTagSuits: "مجموعتنا",
    sectionTitleSuits: "اختر بدلتك المثالية",
    sectionSubSuits: "كولكشن فاخر من أرقى البدل لكل مناسباتك",
    filterAll: "الكل",
    filterClassic: "كلاسيك",
    filterWedding: "زفاف",
    filterEvening: "سهرة",
    filterBusiness: "أعمال",
    searchPlaceholder: "ابحث عن بدلة...",
    suitsLoading: "جاري التحميل...",
    suitsEmptyTitle: "لا توجد بدل حالياً",
    suitsEmptyText: "سيتم إضافة البدل قريباً. تواصل معنا للاستفسار.",
    sectionTagHow: "بكل سهولة",
    sectionTitleHow: "كيف تأجر بدلتك؟",
    step1Title: "استعرض المجموعة",
    step1Text: "تصفح مجموعتنا الواسعة من البدل الفاخرة واختر ما يناسبك",
    step2Title: "تواصل معنا",
    step2Text: "أرسل لنا رسالة أو اتصل بنا لتأكيد التوفر وتحديد الموعد",
    step3Title: "القياس والتعديل",
    step3Text: "نأخذ مقاساتك ونعدّل البدلة لتناسبك بشكل مثالي",
    step4Title: "استمتع بمناسبتك",
    step4Text: "احضر مناسبتك بأبهى حلة وعد البدلة بعد الانتهاء",
    contactTag: "تواصل معنا",
    contactTitle: "احجز بدلتك الآن",
    contactDesc: "نحن هنا لمساعدتك في اختيار البدلة المثالية لمناسبتك. تواصل معنا الآن!",
    contactAddressLabel: "الموقع",
    contactWhatsappLabel: "واتساب",
    contactHoursLabel: "أوقات العمل",
    contactHoursVal: "السبت - الخميس: 9 صباحاً - 10 مساءً",
    bookingFormTitle: "أرسل طلب حجز",
    labelFullName: "الاسم الكامل *",
    labelPhone: "رقم الهاتف *",
    labelEventDate: "تاريخ المناسبة",
    labelExtraNotes: "تفاصيل إضافية",
    placeholderName: "اكتب اسمك",
    placeholderPhone: "059XXXXXXXX",
    placeholderNotes: "نوع المناسبة، المقاس المطلوب، أي تفاصيل أخرى...",
    btnSubmitOrder: "إرسال الطلب 🚀",
    bookingSuccess: "✅ تم إرسال طلبك بنجاح! سنتواصل معك قريباً.",
    footerTagline: "أرقى بدل رجالية لكل مناسبة",
    footerQuickLinks: "روابط سريعة",
    footerServices: "خدماتنا",
    footerClassic: "بدل كلاسيك",
    footerWeddingSuit: "بدل زفاف",
    footerEveningSuit: "بدل سهرة",
    footerBusinessSuit: "بدل أعمال",
    footerRights: "© 2025 هاشتاق. جميع الحقوق محفوظة.",
    modalBookSuit: "احجز البدلة",
    modalNotesPlaceholder: "أي تفاصيل إضافية...",
    modalSubmitBtn: "تأكيد الحجز",
    modalSuccessText: "✅ تم إرسال طلبك!",
    suitAvail: "متاحة للإيجار",
    suitUnavail: "غير متاح",
    suitRentPerDay: "يوم",
    suitRentPrice: "₪ / يوم",
  },
  en: {
    logoText: "Hashtag",
    navHome: "Home",
    navSuits: "Suits",
    navHow: "How it works",
    navContact: "Contact",
    adminBtn: "Admin Panel",
    heroTag: "✨ Elegance in every occasion",
    heroTitleHtml: "Luxury Suits<br/><span class=\"gradient-text\">For Every Event</span>",
    heroSubtitle: "Rent the finest men's suits at affordable prices. Weddings, engagements, conferences, and all special occasions.",
    btnBrowse: "Browse Suits",
    btnBookNow: "Book Now",
    statSuits: "Available Suits",
    statClients: "Happy Clients",
    statExperience: "Years Experience",
    sectionTagSuits: "Our Collection",
    sectionTitleSuits: "Choose Your Perfect Suit",
    sectionSubSuits: "Luxury collection of the finest suits for all your occasions",
    filterAll: "All",
    filterClassic: "Classic",
    filterWedding: "Wedding",
    filterEvening: "Evening",
    filterBusiness: "Business",
    searchPlaceholder: "Search for a suit...",
    suitsLoading: "Loading...",
    suitsEmptyTitle: "No suits available at the moment",
    suitsEmptyText: "Suits will be added soon. Contact us for inquiries.",
    sectionTagHow: "Very Simple",
    sectionTitleHow: "How to Rent Your Suit?",
    step1Title: "Browse Collection",
    step1Text: "Browse our wide collection of luxury suits and choose what fits you best",
    step2Title: "Contact Us",
    step2Text: "Send us a message or call to confirm availability and set an appointment",
    step3Title: "Fitting & Tailoring",
    step3Text: "We take your measurements and tailor the suit to fit you perfectly",
    step4Title: "Enjoy Your Occasion",
    step4Text: "Attend your event looking your best and return the suit afterward",
    contactTag: "Contact Us",
    contactTitle: "Book Your Suit Now",
    contactDesc: "We are here to help you choose the perfect suit for your occasion. Contact us now!",
    contactAddressLabel: "Location",
    contactWhatsappLabel: "WhatsApp",
    contactHoursLabel: "Business Hours",
    contactHoursVal: "Saturday - Thursday: 9 AM - 10 PM",
    bookingFormTitle: "Send Rental Request",
    labelFullName: "Full Name *",
    labelPhone: "Phone Number *",
    labelEventDate: "Event Date",
    labelExtraNotes: "Extra Details",
    placeholderName: "Write your name",
    placeholderPhone: "059XXXXXXXX",
    placeholderNotes: "Occasion type, required size, any other details...",
    btnSubmitOrder: "Send Request 🚀",
    bookingSuccess: "✅ Your request was sent successfully! We will contact you soon.",
    footerTagline: "Finest men's suits for every occasion",
    footerQuickLinks: "Quick Links",
    footerServices: "Our Services",
    footerClassic: "Classic Suits",
    footerWeddingSuit: "Wedding Suits",
    footerEveningSuit: "Evening Suits",
    footerBusinessSuit: "Business Suits",
    footerRights: "© 2025 Hashtag. All rights reserved.",
    modalBookSuit: "Book Suit",
    modalNotesPlaceholder: "Any extra details...",
    modalSubmitBtn: "Confirm Booking",
    modalSuccessText: "✅ Your request was sent!",
    suitAvail: "Available for Rent",
    suitUnavail: "Not Available",
    suitRentPerDay: "day",
    suitRentPrice: "₪ / day",
  }
};

// ════════════════════════════════════════════════════════════
//  Init
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  initAOS();
  animateCounters();
  loadSettings();
  loadSuits();
  initFilters();
  initSearch();
  initContactForm();
  initLightbox();
  initBookingModal();
  initHamburger();
  initWhatsappFab();
  initLanguage();
});

// ─── Language Logic ─────────────────────────────────────────
function initLanguage() {
  const savedLang = localStorage.getItem('suit_language') || 'ar';
  setLanguage(savedLang);

  document.getElementById('langToggle')?.addEventListener('click', () => {
    setLanguage(currentLanguage === 'ar' ? 'en' : 'ar');
  });
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('suit_language', lang);

  const html = document.documentElement;
  html.setAttribute('lang', lang);
  if (lang === 'ar') {
    html.setAttribute('dir', 'rtl');
  } else {
    html.setAttribute('dir', 'ltr');
  }

  // Translate DOM elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.setAttribute('placeholder', i18n[lang][key]);
      } else {
        el.textContent = i18n[lang][key];
      }
    }
  });

  // Handle elements with HTML translation
  const heroTitle = document.querySelector('[data-i18n="heroTitleHtml"]');
  if (heroTitle && i18n[lang].heroTitleHtml) {
    heroTitle.innerHTML = i18n[lang].heroTitleHtml;
  }

  // Update button toggle text
  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.textContent = lang === 'ar' ? 'English' : 'العربية';
  }

  // Re-render suits with current language mapping
  renderSuits();
}

function translateCategory(cat) {
  if (currentLanguage === 'ar') return cat;
  const mapping = {
    'كلاسيك': 'Classic',
    'زفاف': 'Wedding',
    'سهرة': 'Evening',
    'أعمال': 'Business'
  };
  return mapping[cat] || cat;
}

// ─── Navbar scroll effect ─────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ─── Hamburger menu ───────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  btn?.addEventListener('click', () => links.classList.toggle('open'));
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

// ─── Hero particles ───────────────────────────────────────
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: ${Math.random() * -20}%;
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: 0;
    `;
    container.appendChild(p);
  }
}

// ─── AOS (animate on scroll) ──────────────────────────────
function initAOS() {
  const els = document.querySelectorAll('.aos');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: .15 });
  els.forEach(el => obs.observe(el));
}

// ─── Counter animation ─────────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const target = parseInt(e.target.dataset.target, 10);
        let current = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          e.target.textContent = current.toLocaleString(currentLanguage === 'ar' ? 'ar' : 'en');
          if (current >= target) clearInterval(timer);
        }, 25);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .5 });
  counters.forEach(c => obs.observe(c));
}

// ─── Load settings ─────────────────────────────────────────
async function loadSettings() {
  try {
    const res = await fetch(`${API}/api/settings`);
    const data = await res.json();
    if (data.settings?.whatsapp) {
      whatsappNumber = data.settings.whatsapp;
    }
    if (data.settings?.storeName) {
      document.querySelectorAll('.logo-text').forEach(el => el.textContent = data.settings.storeName);
      if (currentLanguage === 'ar') {
        document.title = `${data.settings.storeName} - تأجير البدل الرجالية الفاخرة`;
      } else {
        document.title = `${data.settings.storeName} - Luxury Men's Suits Rental`;
      }
    }
    if (data.settings?.address) {
      const el = document.getElementById('contactAddress');
      if (el) el.textContent = data.settings.address;
    }
    const wp = document.getElementById('contactWhatsapp');
    if (wp && data.settings?.whatsapp) wp.textContent = `+${data.settings.whatsapp}`;
    initWhatsappFab();
  } catch (_) {}
}

// ─── Load suits ─────────────────────────────────────────────
async function loadSuits() {
  const grid = document.getElementById('suitsGrid');
  try {
    const res = await fetch(`${API}/api/suits`);
    const data = await res.json();
    allSuits = data.suits || [];
    applyFilter();
  } catch (err) {
    grid.innerHTML = `<p style="color:#e74c3c;grid-column:1/-1;text-align:center;padding:2rem">${currentLanguage === 'ar' ? 'تعذّر الاتصال بالسيرفر. تأكد من تشغيله.' : 'Failed to connect to the server. Make sure it is running.'}</p>`;
  }
}

// ─── Filters ───────────────────────────────────────────────
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilter();
    });
  });
}

function initSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    applyFilter(e.target.value.trim());
  });
}

function applyFilter(search = '') {
  const q = search.toLowerCase();
  filteredSuits = allSuits.filter(s => {
    const matchCat = currentFilter === 'all' || s.category === currentFilter;
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
  renderSuits();
}

// ─── Render suits grid ──────────────────────────────────────
function renderSuits() {
  const grid = document.getElementById('suitsGrid');
  const empty = document.getElementById('emptyState');

  if (!filteredSuits.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = filteredSuits.map((suit, idx) => {
    const mainImg = suit.images?.[0];
    const imgCount = suit.images?.length || 0;
    const price = Number(suit.price).toLocaleString(currentLanguage === 'ar' ? 'ar' : 'en');
    const translatedCat = translateCategory(suit.category);
    const rentText = currentLanguage === 'ar' ? '₪ / يوم' : '₪ / day';

    return `
    <article class="suit-card aos" style="animation-delay:${idx * 0.07}s" data-id="${suit.id}">
      <div class="suit-card-img-wrap">
        ${mainImg
          ? `<img class="suit-card-img" src="${mainImg}" alt="${suit.name}" loading="lazy" />`
          : `<div class="suit-card-img-placeholder">👔</div>`
        }
        <span class="suit-badge ${suit.available ? '' : 'unavailable'}">${translatedCat}</span>
        ${imgCount > 1 ? `<span class="img-count-badge">📷 ${imgCount}</span>` : ''}
      </div>
      <div class="suit-card-body">
        <p class="suit-card-cat">${translatedCat}</p>
        <h3 class="suit-card-name">${suit.name}</h3>
        ${suit.description ? `<p class="suit-card-desc">${suit.description}</p>` : ''}
        <div class="suit-card-tags">
          ${(suit.colors || []).map(c => `<span class="suit-tag">🎨 ${c}</span>`).join('')}
          ${(suit.sizes || []).slice(0,3).map(sz => `<span class="suit-tag">${sz}</span>`).join('')}
        </div>
        <div class="suit-card-footer">
          <div class="suit-price">${price} <small>${rentText}</small></div>
          ${suit.available
            ? `<button class="suit-book-btn" onclick="openBookingModal('${suit.id}', '${suit.name.replace(/'/g,"\\'")}')">${currentLanguage === 'ar' ? 'احجز الآن' : 'Book Now'}</button>`
            : `<span style="color:#e74c3c;font-size:.85rem;font-weight:700;">${currentLanguage === 'ar' ? 'غير متاح' : 'Not Available'}</span>`
          }
        </div>
      </div>
    </article>`;
  }).join('');

  // AOS observer for newly added cards
  initAOS();

  // Click on card image opens lightbox
  grid.querySelectorAll('.suit-card').forEach(card => {
    card.querySelector('.suit-card-img-wrap')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('suit-book-btn')) return;
      const id = card.dataset.id;
      const suit = allSuits.find(s => s.id === id);
      if (suit?.images?.length) openLightbox(suit.images, 0, suit.name);
    });
  });
}

// ════════════════════════════════════════════════════════════
//  Lightbox
// ════════════════════════════════════════════════════════════
function initLightbox() {
  const lb = document.getElementById('lightbox');
  document.getElementById('lbClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lbPrev')?.addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lbNext')?.addEventListener('click', () => navigateLightbox(1));
  lb?.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(1);
    if (e.key === 'ArrowRight') navigateLightbox(-1);
  });
}

function openLightbox(images, startIdx, caption) {
  lightboxImages = images;
  lightboxIdx = startIdx;
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
  updateLightboxImg(caption);
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(dir) {
  lightboxIdx = (lightboxIdx + dir + lightboxImages.length) % lightboxImages.length;
  updateLightboxImg();
}

function updateLightboxImg(caption) {
  const img = document.getElementById('lbImg');
  const cap = document.getElementById('lbCaption');
  img.src = lightboxImages[lightboxIdx];
  if (cap) cap.textContent = caption ? `${caption} (${lightboxIdx + 1}/${lightboxImages.length})` : `${lightboxIdx + 1} / ${lightboxImages.length}`;

  // show/hide arrows
  const prev = document.getElementById('lbPrev');
  const next = document.getElementById('lbNext');
  if (lightboxImages.length <= 1) { prev.style.display = 'none'; next.style.display = 'none'; }
  else { prev.style.display = ''; next.style.display = ''; }
}

// ════════════════════════════════════════════════════════════
//  Booking Modal
// ════════════════════════════════════════════════════════════
function initBookingModal() {
  document.getElementById('modalClose')?.addEventListener('click', closeBookingModal);
  document.getElementById('bookingModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('bookingModal')) closeBookingModal();
  });
  document.getElementById('modalSubmit')?.addEventListener('click', submitBooking);
}

function openBookingModal(suitId, suitName) {
  document.getElementById('modalSuitId').value = suitId;
  const titleText = currentLanguage === 'ar' ? `احجز: ${suitName}` : `Book: ${suitName}`;
  document.getElementById('modalSuitName').textContent = titleText;
  const wa = document.getElementById('modalWhatsapp');
  const prefixMsg = currentLanguage === 'ar' ? 'مرحباً، أريد استئجار بدلة: ' : 'Hello, I want to rent a suit: ';
  if (wa) wa.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`${prefixMsg}${suitName}`)}`;
  document.getElementById('modalSuccess').classList.add('hidden');
  document.getElementById('bookingModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('active');
  document.body.style.overflow = '';
}

async function submitBooking() {
  const name = document.getElementById('modalName').value.trim();
  const phone = document.getElementById('modalPhone').value.trim();
  if (!name || !phone) {
    alert(currentLanguage === 'ar' ? 'الرجاء إدخال الاسم ورقم الهاتف' : 'Please enter your name and phone number');
    return;
  }

  const body = {
    suitId: document.getElementById('modalSuitId').value,
    customerName: name,
    phone,
    date: document.getElementById('modalDate').value,
    notes: document.getElementById('modalNotes').value,
  };

  try {
    const res = await fetch(`${API}/api/bookings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('modalSuccess').classList.remove('hidden');
      // Also open whatsapp
      const suit = allSuits.find(s => s.id === body.suitId);
      const msg = currentLanguage === 'ar'
        ? `مرحباً، أريد استئجار بدلة: ${suit?.name || ''}\nالاسم: ${name}\nالهاتف: ${phone}\nالتاريخ: ${body.date || '-'}`
        : `Hello, I want to rent this suit: ${suit?.name || ''}\nName: ${name}\nPhone: ${phone}\nDate: ${body.date || '-'}`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      setTimeout(closeBookingModal, 2500);
    }
  } catch (_) {
    alert(currentLanguage === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again');
  }
}

// ─── Contact form ──────────────────────────────────────────
function initContactForm() {
  document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.textContent = currentLanguage === 'ar' ? '⏳ جاري الإرسال...' : '⏳ Sending...';
    btn.disabled = true;

    const body = {
      customerName: document.getElementById('custName').value.trim(),
      phone: document.getElementById('custPhone').value.trim(),
      date: document.getElementById('custDate').value,
      notes: document.getElementById('custNotes').value,
    };

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('formSuccess').classList.remove('hidden');
        e.target.reset();
      }
    } catch (_) {
      alert(currentLanguage === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Error connecting to server');
    }
    finally {
      btn.textContent = currentLanguage === 'ar' ? 'إرسال الطلب 🚀' : 'Send Request 🚀';
      btn.disabled = false;
    }
  });
}

// ─── WhatsApp FAB ──────────────────────────────────────────
function initWhatsappFab() {
  const fab = document.getElementById('whatsappFab');
  if (fab) {
    fab.addEventListener('click', () => {
      const msg = currentLanguage === 'ar'
        ? 'مرحباً، أريد الاستفسار عن تأجير البدل'
        : 'Hello, I want to inquire about suit rental';
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }
}
