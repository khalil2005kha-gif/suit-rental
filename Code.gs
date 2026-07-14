// ==============================================================================
// Google Apps Script - نظام تشغيل الـ API وإدارة البدل والطلبات عبر جداول البيانات
// ==============================================================================

// ─── استقبال الطلبات (GET) ──────────────────────────────────────────────────
function doGet(e) {
  try {
    var path = e.parameter._path || e.pathInfo || "";
    var result;
    
    if (path === "api/suits") {
      result = { success: true, suits: getSuits() };
    } else if (path.indexOf("api/suits/") === 0) {
      var id = path.substring("api/suits/".length);
      result = { success: true, suit: getSuitById(id) };
    } else if (path === "api/bookings") {
      result = { success: true, bookings: getBookings() };
    } else if (path === "api/settings") {
      result = { success: true, settings: getSettings() };
    } else {
      result = { success: false, message: "لم يتم العثور على المسار: " + path };
    }
    
    return _json(result);
  } catch (err) {
    return _json({ success: false, message: err.toString() });
  }
}

// ─── استقبال الطلبات (POST / PUT / DELETE) ──────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var path = e.parameter._path || e.pathInfo || "";
    var method = data._method || "POST";
    var result;
    
    if (path === "api/suits") {
      if (method === "POST") {
        result = createSuit(data);
      } else {
        result = { success: false, message: "الطريقة غير مدعومة على هذا المسار" };
      }
    } else if (path.indexOf("api/suits/") === 0) {
      var id = path.substring("api/suits/".length);
      if (method === "PUT") {
        result = updateSuit(id, data);
      } else if (method === "DELETE") {
        result = deleteSuit(id);
      } else {
        result = { success: false, message: "الطريقة غير مدعومة على هذا المسار" };
      }
    } else if (path === "api/bookings") {
      if (method === "POST") {
        result = createBooking(data);
      } else {
        result = { success: false, message: "الطريقة غير مدعومة على هذا المسار" };
      }
    } else if (path.indexOf("api/bookings/") === 0) {
      var id = path.substring("api/bookings/".length);
      if (method === "PUT") {
        result = updateBooking(id, data);
      } else if (method === "DELETE") {
        result = deleteBooking(id);
      } else {
        result = { success: false, message: "الطريقة غير مدعومة على هذا المسار" };
      }
    } else if (path === "api/settings") {
      if (method === "PUT") {
        result = updateSettings(data);
      } else {
        result = { success: false, message: "الطريقة غير مدعومة على هذا المسار" };
      }
    } else {
      result = { success: false, message: "لم يتم العثور على المسار: " + path };
    }
    
    return _json(result);
  } catch (err) {
    return _json({ success: false, message: err.toString() });
  }
}

// ─── إرجاع النتيجة بصيغة JSON مع السماح بـ CORS ─────────────────────────────
function _json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
//  دوال التحكم في البدل (SUITS)
// ==============================================================================

function getSuits() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateSuitsSheet(ss);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // فقط العناوين
  
  var suits = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    suits.push({
      _id: row[0].toString(),
      id: row[0].toString(),
      name: row[1],
      description: row[2],
      price: Number(row[3]),
      category: row[4],
      colors: row[5] ? row[5].toString().split(',').map(function(s){return s.trim();}) : [],
      sizes: row[6] ? row[6].toString().split(',').map(function(s){return s.trim();}) : [],
      available: row[7] === true || row[7].toString().toLowerCase() === 'true',
      images: row[8] ? row[8].toString().split(',').map(function(s){return s.trim();}) : []
    });
  }
  return suits;
}

function getSuitById(id) {
  var suits = getSuits();
  for (var i = 0; i < suits.length; i++) {
    if (suits[i]._id === id) return suits[i];
  }
  return null;
}

function createSuit(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateSuitsSheet(ss);
  var id = Utilities.getUuid();
  
  // رفع الصور إلى Google Drive
  var imageUrls = [];
  if (data.images && data.images.length > 0) {
    for (var i = 0; i < data.images.length; i++) {
      var img = data.images[i];
      try {
        var url = uploadToGoogleDrive(img.base64, img.name, img.type);
        imageUrls.push(url);
      } catch (e) {
        Logger.log("فشل الرفع لـ " + img.name + ": " + e.toString());
      }
    }
  }
  
  var row = [
    id,
    data.name,
    data.description || "",
    Number(data.price),
    data.category || "كلاسيك",
    data.colors || "",
    data.sizes || "",
    data.available === undefined ? "true" : data.available.toString(),
    imageUrls.join(",")
  ];
  
  sheet.appendRow(row);
  return { success: true, suit: { _id: id } };
}

function updateSuit(id, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateSuitsSheet(ss);
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id) {
      rowIndex = i + 1; // رقم السطر 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, message: "البدلة غير موجودة" };
  }
  
  // رفع الصور الجديدة إلى Google Drive
  var newUrls = [];
  if (data.images && data.images.length > 0) {
    for (var i = 0; i < data.images.length; i++) {
      var img = data.images[i];
      try {
        var url = uploadToGoogleDrive(img.base64, img.name, img.type);
        newUrls.push(url);
      } catch (e) {
        Logger.log("فشل الرفع لـ " + img.name + ": " + e.toString());
      }
    }
  }
  
  // دمج الصور المحتفظ بها والصور الجديدة
  var keptImages = data.keepImages;
  if (typeof keptImages === 'string') {
    keptImages = keptImages.split(',').map(function(s){return s.trim();}).filter(Boolean);
  } else if (!keptImages) {
    keptImages = [];
  }
  
  var finalImages = keptImages.concat(newUrls).join(",");
  
  sheet.getRange(rowIndex, 2).setValue(data.name);
  sheet.getRange(rowIndex, 3).setValue(data.description || "");
  sheet.getRange(rowIndex, 4).setValue(Number(data.price));
  sheet.getRange(rowIndex, 5).setValue(data.category || "كلاسيك");
  sheet.getRange(rowIndex, 6).setValue(data.colors || "");
  sheet.getRange(rowIndex, 7).setValue(data.sizes || "");
  sheet.getRange(rowIndex, 8).setValue(data.available === undefined ? "true" : data.available.toString());
  sheet.getRange(rowIndex, 9).setValue(finalImages);
  
  return { success: true };
}

function deleteSuit(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateSuitsSheet(ss);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: "البدلة غير موجودة" };
}

// ==============================================================================
//  دوال التحكم في الحجوزات (BOOKINGS)
// ==============================================================================

function getBookings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateBookingsSheet(ss);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var bookings = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    bookings.push({
      _id: row[0].toString(),
      id: row[0].toString(),
      suitId: row[1],
      suitName: row[2],
      customerName: row[3],
      fullname: row[3],
      phone: row[4],
      date: row[5],
      eventDate: row[5],
      notes: row[6],
      status: row[7] || "pending",
      createdAt: row[8]
    });
  }
  return bookings;
}

function createBooking(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateBookingsSheet(ss);
  var id = Utilities.getUuid();
  var dateStr = new Date().toLocaleString('ar-SA');
  
  var customerName = data.customerName || data.fullname || "غير محدد";
  var eventDate = data.date || data.eventDate || "";
  
  var row = [
    id,
    data.suitId || "",
    data.suitName || "",
    customerName,
    data.phone,
    eventDate,
    data.notes || "",
    "pending",
    dateStr
  ];
  sheet.appendRow(row);
  return { success: true, booking: { _id: id } };
}

function updateBooking(id, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateBookingsSheet(ss);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id) {
      sheet.getRange(i + 1, 8).setValue(data.status); // العمود الثامن هو الحالة
      return { success: true };
    }
  }
  return { success: false, message: "الحجز غير موجود" };
}

function deleteBooking(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateBookingsSheet(ss);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: "الحجز غير موجود" };
}

// ==============================================================================
//  دوال التحكم في الإعدادات (SETTINGS)
// ==============================================================================

function getSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateSettingsSheet(ss);
  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 0; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  // تحويل القيم الرقمية لنصوص لتجنب مشاكل المقارنة في JavaScript
  if (settings.password !== undefined) settings.password = String(settings.password);
  if (settings.whatsapp !== undefined) settings.whatsapp = String(settings.whatsapp);
  return settings;
}

function updateSettings(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateSettingsSheet(ss);
  
  sheet.clearContents();
  var rows = [
    ['storeName', data.storeName || "هاشتاق"],
    ['whatsapp', data.whatsapp || "972597518416"],
    ['address', data.address || "فلسطين"],
    ['password', data.password || "123456789"],
    ['cloudinary_cloud_name', data.cloudinary_cloud_name || ""],
    ['cloudinary_api_key', data.cloudinary_api_key || ""],
    ['cloudinary_api_secret', data.cloudinary_api_secret || ""]
  ];
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  return { success: true };
}

// ==============================================================================
//  دوال الخدمات والرفع السحابي لـ Cloudinary
// ==============================================================================

// ==============================================================================
//  رفع الصور عبر Google Drive (مجاني بدون إعدادات خارجية)
// ==============================================================================

function uploadToGoogleDrive(base64, filename, mimeType) {
  // الحصول على مجلد الصور أو إنشاؤه
  var folder = _getOrCreateDriveFolder();
  
  // تحويل Base64 إلى Blob
  var decoded = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(decoded, mimeType, filename);
  
  // رفع الملف
  var file = folder.createFile(blob);
  
  // جعل الملف عاماً (للعرض فقط)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // إرجاع رابط مباشر للصورة
  var fileId = file.getId();
  return "https://lh3.googleusercontent.com/d/" + fileId;
}

function _getOrCreateDriveFolder() {
  var folderName = "suit-rental-images";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  // إنشاء مجلد جديد
  var folder = DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

// ==============================================================================
//  دوال تهيئة الجداول وتأمين وجودها
// ==============================================================================

function _getOrCreateSuitsSheet(ss) {
  var sheet = ss.getSheetByName('البدل');
  if (!sheet) {
    sheet = ss.insertSheet('البدل');
    sheet.appendRow(['ID', 'Name', 'Description', 'Price', 'Category', 'Colors', 'Sizes', 'Available', 'Images']);
    // تلوين العناوين لتنظيم المظهر
    sheet.getRange("A1:I1").setBackground("#2ec4b6").setFontColor("#ffffff").setFontWeight("bold");
  }
  return sheet;
}

function _getOrCreateBookingsSheet(ss) {
  var sheet = ss.getSheetByName('الطلبات');
  if (!sheet) {
    sheet = ss.insertSheet('الطلبات');
    sheet.appendRow(['ID', 'Suit ID', 'Suit Name', 'Fullname', 'Phone', 'Event Date', 'Notes', 'Status', 'Date Created']);
    sheet.getRange("A1:I1").setBackground("#e05555").setFontColor("#ffffff").setFontWeight("bold");
  }
  return sheet;
}

function _getOrCreateSettingsSheet(ss) {
  var sheet = ss.getSheetByName('الإعدادات');
  if (!sheet) {
    sheet = ss.insertSheet('الإعدادات');
    var defaults = [
      ['storeName', 'هاشتاق'],
      ['whatsapp', '972597518416'],
      ['address', 'فلسطين'],
      ['password', '123456789'],
      ['cloudinary_cloud_name', 'YOUR_CLOUD_NAME'],
      ['cloudinary_api_key', 'YOUR_API_KEY'],
      ['cloudinary_api_secret', 'YOUR_API_SECRET']
    ];
    sheet.getRange(1, 1, defaults.length, 2).setValues(defaults);
    sheet.getRange("A1:B7").setFontWeight("bold");
  }
  return sheet;
}
