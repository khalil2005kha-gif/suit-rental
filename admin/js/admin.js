/* ═══════════════════════════════════════════════════════════
   admin.js — Admin Panel Logic
   ═══════════════════════════════════════════════════════════ */

const API = 'https://script.google.com/macros/s/AKfycbwrWPUU5xH4Y1HXn1-d3YzXObn1FTCL4w22WIF7YKo8Kw1KSCKu82EBsIBlRsSLBTlH/exec';
const ADMIN_PASSWORD_KEY = 'suit_admin_pass';
let currentSuits = [];
let editingId = null;
let existingImages = []; // images kept during edit
let newFilesMap = []; // { file, previewUrl } for new uploads

// Helper for API fetch supporting Node.js or Google Apps Script Web App
async function apiFetch(path, options = {}) {
  const isGAS = API.includes('script.google.com');
  
  let url = `${API}${path}`;
  if (isGAS) {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    url = `${API}?_path=${encodeURIComponent(cleanPath)}`;
  }
  
  if (isGAS && options.method && options.method !== 'GET') {
    let bodyData = {};
    
    if (options.body instanceof FormData) {
      for (let [key, value] of options.body.entries()) {
        if (key === 'images') {
          // Handled separately below
        } else if (key === 'keepImages') {
          if (!bodyData.keepImages) bodyData.keepImages = [];
          bodyData.keepImages.push(value);
        } else {
          bodyData[key] = value;
        }
      }
    } else if (typeof options.body === 'string') {
      bodyData = JSON.parse(options.body);
    } else {
      bodyData = options.body || {};
    }
    
    bodyData._method = options.method;
    
    if (options.body instanceof FormData && typeof newFilesMap !== 'undefined' && newFilesMap.length > 0) {
      bodyData.images = [];
      for (let f of newFilesMap) {
        const base64 = await toBase64(f.file);
        bodyData.images.push({
          name: f.file.name,
          type: f.file.type,
          base64: base64
        });
      }
    }
    
    const gasOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(bodyData)
    };
    
    const res = await fetch(url, gasOptions);
    return res;
  } else {
    return fetch(url, options);
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

// ════════════════════════════════════════════════════════════
//  Init
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
});

function initAdmin() {
  initSidebar();
  initTabs();
  initSuitModal();
  initDeleteModal();
  initUploadZone();
  loadSuitsAdmin();
  loadBookings();
  loadSettingsAdmin();
  document.getElementById('adminSearch')?.addEventListener('input', e => filterAdmin(e.target.value));
}

// ════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════
function initLogin() {
  const stored = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
  if (stored) { showAdmin(); return; }

  const btn = document.getElementById('loginBtn');
  const input = document.getElementById('passwordInput');
  btn.addEventListener('click', doLogin);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

async function doLogin() {
  const pw = document.getElementById('passwordInput').value;
  const err = document.getElementById('loginError');
  err.classList.add('hidden');

  try {
    const res = await apiFetch('/api/settings');
    const data = await res.json();
    const correctPw = String(data.settings?.password || 'admin123');
    if (pw === correctPw) {
      sessionStorage.setItem(ADMIN_PASSWORD_KEY, pw);
      showAdmin();
    } else {
      err.classList.remove('hidden');
    }
  } catch (_) {
    // offline fallback — try both default passwords
    if (pw === 'admin123' || pw === '123456789') { sessionStorage.setItem(ADMIN_PASSWORD_KEY, pw); showAdmin(); }
    else { err.classList.remove('hidden'); }
  }
}

function showAdmin() {
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('adminLayout').classList.remove('hidden');
  initAdmin();
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  location.reload();
});

// ════════════════════════════════════════════════════════════
//  SIDEBAR & TABS
// ════════════════════════════════════════════════════════════
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  toggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
}

const TAB_TITLES = { suits: 'إدارة البدل', bookings: 'الحجوزات', settings: 'الإعدادات' };

function initTabs() {
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      document.querySelectorAll('.sidebar-link[data-tab]').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('hidden'));
      document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
      document.getElementById('pageTitle').textContent = TAB_TITLES[tab] || '';

      // show/hide add suit btn
      document.getElementById('addSuitBtn').style.display = tab === 'suits' ? '' : 'none';
    });
  });
}

// ════════════════════════════════════════════════════════════
//  SUITS — LOAD & RENDER
// ════════════════════════════════════════════════════════════
async function loadSuitsAdmin() {
  try {
    const res = await apiFetch('/api/suits');
    const data = await res.json();
    currentSuits = data.suits || [];
    renderSuitsAdmin(currentSuits);
    updateStats();
  } catch (_) {
    document.getElementById('suitsAdminGrid').innerHTML = `<p style="color:#e74c3c;grid-column:1/-1">تعذّر الاتصال بالسيرفر</p>`;
  }
}

function filterAdmin(q) {
  const filtered = q
    ? currentSuits.filter(s => s.name.toLowerCase().includes(q.toLowerCase()))
    : currentSuits;
  renderSuitsAdmin(filtered);
}

function renderSuitsAdmin(suits) {
  const grid = document.getElementById('suitsAdminGrid');
  if (!suits.length) {
    grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1"><p>لا توجد بدل. اضغط "+ إضافة بدلة" لإضافة أول بدلة.</p></div>`;
    return;
  }
  grid.innerHTML = suits.map(suit => {
    const img = suit.images?.[0];
    return `
    <div class="suit-admin-card">
      ${img
        ? `<img class="sac-img" src="${img}" alt="${suit.name}" loading="lazy" />`
        : `<div class="sac-img-placeholder">👔</div>`
      }
      <span class="avail-badge ${suit.available ? 'yes' : 'no'}">${suit.available ? '✅ متاحة' : '❌ غير متاحة'}</span>
      <div class="sac-body">
        <div class="sac-name">${suit.name}</div>
        <div class="sac-price">${Number(suit.price).toLocaleString('ar')} ₪ / يوم</div>
        <div class="sac-cat">${suit.category} ${suit.images?.length > 1 ? `· 📷 ${suit.images.length}` : ''}</div>
      </div>
      <div class="sac-actions">
        <button class="sac-edit" onclick="openEditModal('${suit.id}')">✏️ تعديل</button>
        <button class="sac-delete" onclick="openDeleteModal('${suit.id}')">🗑️ حذف</button>
      </div>
    </div>`;
  }).join('');
}

function updateStats() {
  document.getElementById('statTotal').textContent = currentSuits.length;
  document.getElementById('statAvail').textContent = currentSuits.filter(s => s.available).length;
  document.getElementById('statUnav').textContent = currentSuits.filter(s => !s.available).length;
}

// ════════════════════════════════════════════════════════════
//  SUIT MODAL (ADD / EDIT)
// ════════════════════════════════════════════════════════════
function initSuitModal() {
  document.getElementById('addSuitBtn')?.addEventListener('click', () => openAddModal());
  document.getElementById('suitModalClose')?.addEventListener('click', closeSuitModal);
  document.getElementById('cancelSuitBtn')?.addEventListener('click', closeSuitModal);
  document.getElementById('suitModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('suitModal')) closeSuitModal();
  });
  document.getElementById('saveSuitBtn')?.addEventListener('click', saveSuit);
}

function openAddModal() {
  editingId = null;
  existingImages = [];
  newFilesMap = [];
  document.getElementById('suitModalTitle').textContent = 'إضافة بدلة جديدة';
  document.getElementById('editSuitId').value = '';
  clearSuitForm();
  renderPreviews();
  document.getElementById('suitSaveSuccess').classList.add('hidden');
  document.getElementById('suitSaveError').classList.add('hidden');
  document.getElementById('suitModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openEditModal(id) {
  const suit = currentSuits.find(s => s.id === id);
  if (!suit) return;
  editingId = id;
  existingImages = [...(suit.images || [])];
  newFilesMap = [];

  document.getElementById('suitModalTitle').textContent = 'تعديل البدلة';
  document.getElementById('editSuitId').value = id;
  document.getElementById('suitName').value = suit.name;
  document.getElementById('suitDesc').value = suit.description || '';
  document.getElementById('suitPrice').value = suit.price;
  document.getElementById('suitCategory').value = suit.category;
  document.getElementById('suitColors').value = (suit.colors || []).join(', ');
  document.getElementById('suitSizes').value = (suit.sizes || []).join(', ');
  document.getElementById('suitAvailable').value = suit.available ? 'true' : 'false';
  document.getElementById('suitSaveSuccess').classList.add('hidden');
  document.getElementById('suitSaveError').classList.add('hidden');

  renderPreviews();
  document.getElementById('suitModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSuitModal() {
  document.getElementById('suitModal').classList.remove('active');
  document.body.style.overflow = '';
  newFilesMap = [];
  existingImages = [];
  editingId = null;
}

function clearSuitForm() {
  ['suitName','suitDesc','suitPrice','suitColors','suitSizes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('suitCategory').value = 'كلاسيك';
  document.getElementById('suitAvailable').value = 'true';
  document.getElementById('imageFiles').value = '';
}

async function saveSuit() {
  const name = document.getElementById('suitName').value.trim();
  const price = document.getElementById('suitPrice').value.trim();
  if (!name || !price) {
    showMsg('suitSaveError', '❌ الاسم والسعر مطلوبان', true);
    return;
  }

  const btn = document.getElementById('saveSuitBtn');
  btn.disabled = true; btn.textContent = '⏳ جاري الحفظ...';

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', document.getElementById('suitDesc').value);
  formData.append('price', price);
  formData.append('category', document.getElementById('suitCategory').value);
  formData.append('colors', document.getElementById('suitColors').value);
  formData.append('sizes', document.getElementById('suitSizes').value);
  formData.append('available', document.getElementById('suitAvailable').value);

  // Existing images to keep
  existingImages.forEach(img => formData.append('keepImages', img));

  // New files
  newFilesMap.forEach(f => formData.append('images', f.file));

  try {
    const path = editingId ? `/api/suits/${editingId}` : `/api/suits`;
    const method = editingId ? 'PUT' : 'POST';
    const res = await apiFetch(path, { method, body: formData });
    const data = await res.json();

    if (data.success) {
      showMsg('suitSaveSuccess', '✅ تم الحفظ بنجاح!');
      loadSuitsAdmin();
      setTimeout(closeSuitModal, 1200);
    } else {
      showMsg('suitSaveError', `❌ ${data.message}`, true);
    }
  } catch (err) {
    showMsg('suitSaveError', '❌ حدث خطأ في الاتصال', true);
  } finally {
    btn.disabled = false; btn.textContent = '💾 حفظ البدلة';
  }
}

// ════════════════════════════════════════════════════════════
//  UPLOAD ZONE
// ════════════════════════════════════════════════════════════
function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('imageFiles');

  zone?.addEventListener('click', (e) => {
    if (!e.target.classList.contains('preview-remove')) input.click();
  });
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone?.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  input?.addEventListener('change', e => handleFiles(e.target.files));
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    newFilesMap.push({ file, previewUrl: url });
  });
  renderPreviews();
}

function renderPreviews() {
  const container = document.getElementById('uploadPreviews');
  const placeholder = document.getElementById('uploadPlaceholder');
  if (!container) return;

  const allPreviews = [
    ...existingImages.map(url => ({ url, isExisting: true })),
    ...newFilesMap.map(f => ({ url: f.previewUrl, isExisting: false })),
  ];

  if (allPreviews.length === 0) {
    placeholder.style.display = '';
    container.innerHTML = '';
    return;
  }
  placeholder.style.display = 'none';

  container.innerHTML = allPreviews.map((item, idx) => `
    <div class="preview-item">
      <img src="${item.url}" alt="preview" />
      <button class="preview-remove" onclick="removePreview(${idx}, ${item.isExisting})">✕</button>
      <span class="preview-label">${item.isExisting ? 'محفوظة' : 'جديدة'}</span>
    </div>
  `).join('');
}

function removePreview(idx, isExisting) {
  if (isExisting) {
    existingImages.splice(idx, 1);
  } else {
    const newIdx = idx - existingImages.length;
    if (newIdx >= 0) {
      URL.revokeObjectURL(newFilesMap[newIdx].previewUrl);
      newFilesMap.splice(newIdx, 1);
    }
  }
  renderPreviews();
}

// ════════════════════════════════════════════════════════════
//  DELETE MODAL
// ════════════════════════════════════════════════════════════
function initDeleteModal() {
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
  document.getElementById('deleteModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
  });
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', doDelete);
}

function openDeleteModal(id) {
  document.getElementById('deleteSuitId').value = id;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
}

async function doDelete() {
  const id = document.getElementById('deleteSuitId').value;
  try {
    const res = await apiFetch(`/api/suits/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { closeDeleteModal(); loadSuitsAdmin(); }
  } catch (_) { alert('حدث خطأ'); }
}

// ════════════════════════════════════════════════════════════
//  BOOKINGS
// ════════════════════════════════════════════════════════════
async function loadBookings() {
  try {
    const res = await apiFetch('/api/bookings');
    const data = await res.json();
    renderBookings(data.bookings || []);
    document.getElementById('statBookings').textContent = (data.bookings || []).length;
  } catch (_) {}
}

function renderBookings(bookings) {
  const tbody = document.getElementById('bookingsTbody');
  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">لا توجد حجوزات بعد</td></tr>`;
    return;
  }
  tbody.innerHTML = bookings.map((b, i) => {
    const statusClass = { pending: 'status-pending', confirmed: 'status-confirmed', cancelled: 'status-cancelled' }[b.status] || 'status-pending';
    const statusLabel = { pending: 'قيد الانتظار', confirmed: 'مؤكد', cancelled: 'ملغى' }[b.status] || 'قيد الانتظار';
    const date = b.date ? new Date(b.date).toLocaleDateString('ar') : '—';
    return `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${b.customerName}</strong>${b.notes ? `<br/><small style="color:var(--text-muted)">${b.notes}</small>` : ''}</td>
      <td><a href="tel:${b.phone}" style="color:var(--gold)">${b.phone}</a></td>
      <td>${date}</td>
      <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
      <td>
        <div class="booking-actions">
          ${b.status !== 'confirmed' ? `<button class="ba-btn ba-confirm" onclick="updateBooking('${b.id}','confirmed')">✅</button>` : ''}
          ${b.status !== 'cancelled' ? `<button class="ba-btn ba-cancel" onclick="updateBooking('${b.id}','cancelled')">❌</button>` : ''}
          <button class="ba-btn ba-delete" onclick="deleteBooking('${b.id}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function updateBooking(id, status) {
  try {
    await apiFetch(`/api/bookings/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadBookings();
  } catch (_) {}
}

async function deleteBooking(id) {
  if (!confirm('حذف هذا الحجز؟')) return;
  try {
    await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
    loadBookings();
  } catch (_) {}
}

// ════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════
async function loadSettingsAdmin() {
  try {
    const res = await apiFetch('/api/settings');
    const data = await res.json();
    const s = data.settings || {};
    if (s.storeName) document.getElementById('settingStoreName').value = s.storeName;
    if (s.whatsapp) document.getElementById('settingWhatsapp').value = s.whatsapp;
    if (s.address) document.getElementById('settingAddress').value = s.address;
  } catch (_) {}
}

document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
  const body = {
    storeName: document.getElementById('settingStoreName').value.trim(),
    whatsapp: document.getElementById('settingWhatsapp').value.trim(),
    address: document.getElementById('settingAddress').value.trim(),
  };
  const pw = document.getElementById('settingPassword').value.trim();
  if (pw) body.password = pw;

  try {
    const res = await apiFetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      showMsg('settingSuccess', '✅ تم حفظ الإعدادات');
      document.getElementById('settingPassword').value = '';
    }
  } catch (_) { alert('حدث خطأ'); }
});

// ─── Helper ────────────────────────────────────────────────
function showMsg(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  if (!isError) setTimeout(() => el.classList.add('hidden'), 3000);
}
