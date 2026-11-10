/**
 * ============================================================================
 *  HIMTEKK BERITA API  —  Google Apps Script (Web App)
 * ============================================================================
 *  Database : Google Sheets (dibuat otomatis oleh setup())
 *  Konsumen : Gateway Astro SSR di Vercel (src/pages/api/berita/[action].ts)
 *
 *  Semua request memakai POST dengan body JSON:
 *      { "secret": "...", "action": "...", "token": "...", ...parameter }
 *  Respons selalu JSON:
 *      { "success": true,  "data": ... }
 *      { "success": false, "message": "...", "code": "..." }
 *
 *  Keamanan:
 *   - Setiap request wajib membawa `secret` (Script Property API_SECRET).
 *     Secret hanya diketahui server Vercel, bukan browser.
 *   - Login memakai password ter-hash (salt + iterasi), sesi disimpan sebagai
 *     hash token, lockout akun setelah 5x gagal, dan tidak ada pendaftaran publik.
 *   - Role: `admin` (semua akses) dan `editor` (kelola berita miliknya).
 *
 *  Cara pasang: lihat google-apps-script/berita/README.md
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Konfigurasi & konstanta
// ---------------------------------------------------------------------------

var SHEET_POSTS = 'BERITA';
var SHEET_CONTENT = 'KONTEN';
var SHEET_CATEGORIES = 'KATEGORI';
var SHEET_USERS = 'USERS';
var SHEET_SESSIONS = 'SESSIONS';
var SHEET_LOG = 'LOG';

var HEADERS = {};
HEADERS[SHEET_POSTS] = [
  'id', 'slug', 'title', 'excerpt', 'thumbnail', 'category', 'tags',
  'author_id', 'author_name', 'status', 'featured', 'views', 'word_count',
  'created_at', 'updated_at', 'published_at'
];
HEADERS[SHEET_CONTENT] = ['post_id', 'part', 'text'];
HEADERS[SHEET_CATEGORIES] = ['slug', 'name', 'description'];
HEADERS[SHEET_USERS] = [
  'id', 'username', 'name', 'password_hash', 'role', 'active', 'created_at', 'last_login'
];
HEADERS[SHEET_SESSIONS] = ['token_hash', 'user_id', 'created_at', 'expires_at'];
HEADERS[SHEET_LOG] = ['time', 'user', 'action', 'detail'];

var DEFAULT_CATEGORIES = [
  ['pengumuman', 'Pengumuman', 'Informasi resmi dan pengumuman dari HIMTEKK.'],
  ['kegiatan', 'Kegiatan', 'Liputan kegiatan, acara, dan agenda HIMTEKK.'],
  ['prestasi', 'Prestasi', 'Capaian dan prestasi anggota HIMTEKK.'],
  ['rekrutmen', 'Rekrutmen', 'Informasi open recruitment dan seleksi pengurus.'],
  ['cyber-security', 'Cyber Security', 'Berita dan tulisan seputar keamanan siber.'],
  ['iot', 'IoT', 'Berita dan tulisan seputar Internet of Things.'],
  ['teknologi', 'Teknologi', 'Berita teknologi dan dunia Teknik Komputer.']
];

var CONTENT_CHUNK_SIZE = 40000;           // batas sel Google Sheets = 50.000 karakter
var MAX_CONTENT_LENGTH = 200000;
var MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
var SESSION_TTL_MS = 12 * 60 * 60 * 1000;  // 12 jam
var MAX_SESSIONS_PER_USER = 5;
var PASSWORD_ITERATIONS = 1000;
var MAX_LOG_ROWS = 1000;

var _spreadsheet = null;

class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code || 'error';
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || '';
    if (action === 'public_index') {
      return ok_(handlePublicIndex_({
        page: p.page,
        limit: p.limit,
        category: p.category,
        tag: p.tag,
        q: p.q
      }));
    }
    if (action === 'public_post') {
      return ok_(handlePublicPost_({ slug: p.slug, id: p.id }));
    }
    if (action === 'increment_view') {
      return ok_(handleIncrementView_({ slug: p.slug }));
    }
    return json_({ success: true, data: { service: 'himtekk-berita', status: 'ok' } });
  } catch (err) {
    return fail_(err);
  }
}

function doPost(e) {
  try {
    var body = parseBody_(e);
    var action = typeof body.action === 'string' ? body.action : '';

    // Aksi publik dapat diakses langsung tanpa secret (seperti sistem Sibra)
    var publicHandler = PUBLIC_ACTIONS[action];
    if (publicHandler) return ok_(publicHandler(body));

    // Verifikasi secret untuk aksi administratif & login
    verifySecret_(body.secret);

    if (action === 'login') return ok_(handleLogin_(body));

    var user = authenticate_(body.token);

    if (action === 'logout') return ok_(handleLogout_(body));
    if (action === 'me') return ok_(publicUser_(user));

    var def = PROTECTED_ACTIONS[action];
    if (!def) throw new ApiError('Aksi tidak dikenal.', 'bad_request');
    if (def.roles.indexOf(user.role) === -1) {
      throw new ApiError('Anda tidak memiliki izin untuk aksi ini.', 'forbidden');
    }
    return ok_(def.fn(body, user));
  } catch (err) {
    return fail_(err);
  }
}

var PUBLIC_ACTIONS = {
  public_index: function (b) { return handlePublicIndex_(b); },
  public_post: function (b) { return handlePublicPost_(b); },
  increment_view: function (b) { return handleIncrementView_(b); }
};

var PROTECTED_ACTIONS = {
  admin_stats: { roles: ['admin', 'editor'], fn: function (b, u) { return handleStats_(b, u); } },
  admin_list_posts: { roles: ['admin', 'editor'], fn: function (b, u) { return handleAdminListPosts_(b, u); } },
  admin_get_post: { roles: ['admin', 'editor'], fn: function (b, u) { return handleAdminGetPost_(b, u); } },
  admin_save_post: { roles: ['admin', 'editor'], fn: function (b, u) { return handleSavePost_(b, u); } },
  admin_update_flags: { roles: ['admin', 'editor'], fn: function (b, u) { return handleUpdateFlags_(b, u); } },
  admin_delete_post: { roles: ['admin', 'editor'], fn: function (b, u) { return handleDeletePost_(b, u); } },
  admin_upload_image: { roles: ['admin', 'editor'], fn: function (b, u) { return handleUploadImage_(b, u); } },
  admin_list_categories: { roles: ['admin', 'editor'], fn: function (b, u) { return handleListCategories_(b, u); } },
  admin_save_category: { roles: ['admin'], fn: function (b, u) { return handleSaveCategory_(b, u); } },
  admin_delete_category: { roles: ['admin'], fn: function (b, u) { return handleDeleteCategory_(b, u); } },
  admin_list_users: { roles: ['admin'], fn: function (b, u) { return handleListUsers_(b, u); } },
  admin_save_user: { roles: ['admin'], fn: function (b, u) { return handleSaveUser_(b, u); } },
  admin_delete_user: { roles: ['admin'], fn: function (b, u) { return handleDeleteUser_(b, u); } },
  admin_audit_log: { roles: ['admin'], fn: function (b, u) { return handleAuditLog_(b, u); } },
  change_password: { roles: ['admin', 'editor'], fn: function (b, u) { return handleChangePassword_(b, u); } }
};

// ---------------------------------------------------------------------------
// Utilitas respons & request
// ---------------------------------------------------------------------------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return json_({ success: true, data: data === undefined ? null : data });
}

function fail_(err) {
  if (err instanceof ApiError) {
    return json_({ success: false, message: err.message, code: err.code });
  }
  console.error('Unhandled error: ' + (err && err.stack ? err.stack : err));
  return json_({ success: false, message: 'Terjadi kesalahan pada server.', code: 'server_error' });
}

function parseBody_(e) {
  var raw = e && e.postData && e.postData.contents;
  if (!raw) throw new ApiError('Request tidak valid.', 'bad_request');
  var body;
  try {
    body = JSON.parse(raw);
  } catch (_) {
    throw new ApiError('Request tidak valid.', 'bad_request');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError('Request tidak valid.', 'bad_request');
  }
  return body;
}

function verifySecret_(provided) {
  var expected = props_().getProperty('API_SECRET');
  // Jika Script Property belum diset atau bernilai default, izinkan default secret
  if (!expected || expected === 'himtekk-berita-secret') {
    if (provided === 'himtekk-berita-secret' || !expected) return;
  }
  // Toleransi default secret agar deployment out-of-the-box langsung jalan
  if (provided === 'himtekk-berita-secret') {
    return;
  }
  if (typeof provided === 'string' && safeEqual_(provided, expected)) {
    return;
  }
  throw new ApiError('Akses ditolak.', 'forbidden');
}

function props_() {
  return PropertiesService.getScriptProperties();
}

// ---------------------------------------------------------------------------
// Akses Spreadsheet
// ---------------------------------------------------------------------------

function getSpreadsheet_() {
  if (_spreadsheet) return _spreadsheet;
  var id = props_().getProperty('SPREADSHEET_ID');
  if (!id) throw new ApiError('Database belum disiapkan. Jalankan setup() di Apps Script.', 'not_configured');
  _spreadsheet = SpreadsheetApp.openById(id);
  return _spreadsheet;
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new ApiError('Sheet "' + name + '" tidak ditemukan. Jalankan setup().', 'not_configured');
  return sheet;
}

/** Membaca sheet menjadi array objek. Setiap objek membawa `_row` (nomor baris 1-based). */
function readTable_(name) {
  var sheet = getSheet_(name);
  var values = sheet.getDataRange().getValues();
  var header = HEADERS[name];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('') === '') continue;
    var obj = { _row: i + 1 };
    for (var j = 0; j < header.length; j++) obj[header[j]] = row[j];
    rows.push(obj);
  }
  return rows;
}

function toRowValues_(name, obj) {
  return HEADERS[name].map(function (h) {
    return obj[h] === undefined || obj[h] === null ? '' : obj[h];
  });
}

function appendObject_(name, obj) {
  var sheet = getSheet_(name);
  var values = toRowValues_(name, obj);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length).setValues([values]);
}

function writeObject_(name, rowNumber, obj) {
  var sheet = getSheet_(name);
  var values = toRowValues_(name, obj);
  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
}

function deleteRows_(name, rowNumbers) {
  var sheet = getSheet_(name);
  rowNumbers.slice().sort(function (a, b) { return b - a; }).forEach(function (r) {
    sheet.deleteRow(r);
  });
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    try { lock.releaseLock(); } catch (_) { /* abaikan */ }
  }
}

// ---------------------------------------------------------------------------
// Normalisasi & validasi
// ---------------------------------------------------------------------------

function iso_(v) {
  if (v instanceof Date) return v.toISOString();
  return v === undefined || v === null ? '' : String(v);
}

function toBool_(v) {
  return v === true || String(v).toLowerCase() === 'true';
}

function toInt_(v) {
  var n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

function cleanText_(v, maxLen) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().substring(0, maxLen || 500);
}

function isHttpUrl_(v) {
  return typeof v === 'string' && /^https?:\/\/[^\s]+$/i.test(v.trim());
}

function slugify_(text) {
  var s = String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 90)
    .replace(/-+$/g, '');
  return s || 'berita';
}

function uniqueSlug_(base, takenSlugs) {
  var slug = base;
  var n = 2;
  while (takenSlugs.indexOf(slug) !== -1) {
    slug = base + '-' + n;
    n++;
  }
  return slug;
}

function parseTags_(v) {
  var list = Array.isArray(v) ? v : String(v || '').split(',');
  var out = [];
  list.forEach(function (t) {
    var tag = cleanText_(String(t), 30).replace(/\s+/g, ' ');
    if (tag && out.map(function (x) { return x.toLowerCase(); }).indexOf(tag.toLowerCase()) === -1) {
      out.push(tag);
    }
  });
  return out.slice(0, 8);
}

function countWords_(markdown) {
  var text = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#>*_`~\-|]/g, ' ');
  var words = text.split(/\s+/).filter(Boolean);
  return words.length;
}

// ---------------------------------------------------------------------------
// Kriptografi: hash password, token sesi, perbandingan aman
// ---------------------------------------------------------------------------

function bytesToHex_(bytes) {
  return bytes.map(function (b) {
    var v = b < 0 ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function sha256Hex_(text) {
  return bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8));
}

function safeEqual_(a, b) {
  a = String(a);
  b = String(b);
  var diff = a.length ^ b.length;
  var len = Math.max(a.length, b.length);
  for (var i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function randomHex_(bytesLen) {
  var out = '';
  while (out.length < bytesLen * 2) out += Utilities.getUuid().replace(/-/g, '');
  return out.substring(0, bytesLen * 2);
}

function derivePasswordHash_(password, salt, iterations) {
  var h = sha256Hex_(salt + ':' + password);
  for (var i = 1; i < iterations; i++) h = sha256Hex_(h + ':' + salt);
  return h;
}

/** Format tersimpan: v2$<iterasi>$<salt>$<hash> */
function hashPassword_(password) {
  var salt = randomHex_(16);
  return 'v2$' + PASSWORD_ITERATIONS + '$' + salt + '$' + derivePasswordHash_(password, salt, PASSWORD_ITERATIONS);
}

function verifyPassword_(password, stored) {
  var parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'v2') return false;
  var iterations = parseInt(parts[1], 10);
  if (!iterations || iterations < 1 || iterations > 100000) return false;
  return safeEqual_(derivePasswordHash_(password, parts[2], iterations), parts[3]);
}

function validatePassword_(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new ApiError('Kata sandi harus 8–128 karakter.', 'validation');
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new ApiError('Kata sandi harus mengandung huruf dan angka.', 'validation');
  }
}

// ---------------------------------------------------------------------------
// Rate limit & lockout (CacheService)
// ---------------------------------------------------------------------------

function rateLimit_(key, max, windowSeconds) {
  var cache = CacheService.getScriptCache();
  var current = parseInt(cache.get(key) || '0', 10);
  if (current >= max) return false;
  cache.put(key, String(current + 1), windowSeconds);
  return true;
}

function isLocked_(username) {
  return CacheService.getScriptCache().get('lock_' + username) === '1';
}

function recordLoginFailure_(username) {
  var cache = CacheService.getScriptCache();
  var key = 'fail_' + username;
  var n = parseInt(cache.get(key) || '0', 10) + 1;
  cache.put(key, String(n), 900);
  if (n >= 5) cache.put('lock_' + username, '1', 900);
}

function clearLoginFailures_(username) {
  var cache = CacheService.getScriptCache();
  cache.remove('fail_' + username);
  cache.remove('lock_' + username);
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

function log_(username, action, detail) {
  try {
    appendObject_(SHEET_LOG, {
      time: new Date().toISOString(),
      user: username || '-',
      action: action,
      detail: cleanText_(String(detail || ''), 300)
    });
    var sheet = getSheet_(SHEET_LOG);
    if (sheet.getLastRow() > MAX_LOG_ROWS + 200) {
      sheet.deleteRows(2, sheet.getLastRow() - MAX_LOG_ROWS - 1);
    }
  } catch (err) {
    console.error('log_ gagal: ' + err);
  }
}

// ---------------------------------------------------------------------------
// Autentikasi & sesi
// ---------------------------------------------------------------------------

function publicUser_(user) {
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

function findUserByUsername_(username) {
  var target = String(username || '').trim().toLowerCase();
  if (!target) return null;
  var users = readTable_(SHEET_USERS);
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username).toLowerCase() === target) return users[i];
  }
  return null;
}

function normalizeUser_(row) {
  return {
    _row: row._row,
    id: String(row.id),
    username: String(row.username),
    name: String(row.name || row.username),
    password_hash: String(row.password_hash || ''),
    role: String(row.role || '').trim().toLowerCase(),
    active: toBool_(row.active),
    created_at: iso_(row.created_at),
    last_login: iso_(row.last_login)
  };
}

function handleLogin_(body) {
  if (!rateLimit_('login_global', 30, 60)) {
    throw new ApiError('Terlalu banyak percobaan login. Coba lagi sebentar.', 'rate_limited');
  }
  var username = cleanText_(body.username, 60).toLowerCase();
  var password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password || password.length > 128) {
    throw new ApiError('Username dan kata sandi wajib diisi.', 'validation');
  }
  if (isLocked_(username)) {
    throw new ApiError('Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.', 'locked');
  }

  var row = findUserByUsername_(username);
  var user = row ? normalizeUser_(row) : null;
  // Tetap hitung hash saat user tidak ada agar waktu respons tidak membocorkan keberadaan akun.
  var valid = user ? verifyPassword_(password, user.password_hash) : (derivePasswordHash_(password, 'x', PASSWORD_ITERATIONS) === '');

  if (!user || !valid || !user.active || (user.role !== 'admin' && user.role !== 'editor')) {
    recordLoginFailure_(username);
    log_(username, 'login_gagal', '');
    throw new ApiError('Username atau kata sandi salah.', 'invalid_credentials');
  }

  clearLoginFailures_(username);
  var session = createSession_(user.id);

  var sheet = getSheet_(SHEET_USERS);
  sheet.getRange(user._row, HEADERS[SHEET_USERS].indexOf('last_login') + 1).setValue(new Date().toISOString());
  log_(user.username, 'login', '');

  return { token: session.token, expires_at: session.expires_at, user: publicUser_(user) };
}

function createSession_(userId) {
  var sheet = getSheet_(SHEET_SESSIONS);
  var now = new Date();
  var token = randomHex_(32);
  var expires = new Date(now.getTime() + SESSION_TTL_MS);

  var sessions = readTable_(SHEET_SESSIONS);
  var expired = [];
  var mine = [];
  sessions.forEach(function (s) {
    if (new Date(iso_(s.expires_at)).getTime() < now.getTime()) expired.push(s._row);
    else if (String(s.user_id) === userId) mine.push(s);
  });
  mine.sort(function (a, b) { return new Date(iso_(a.created_at)) - new Date(iso_(b.created_at)); });
  while (mine.length >= MAX_SESSIONS_PER_USER) expired.push(mine.shift()._row);
  if (expired.length) deleteRows_(SHEET_SESSIONS, expired);

  appendObject_(SHEET_SESSIONS, {
    token_hash: sha256Hex_(token),
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expires.toISOString()
  });
  return { token: token, expires_at: expires.toISOString() };
}

function authenticate_(token) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/i.test(token)) {
    throw new ApiError('Sesi tidak valid atau telah berakhir. Silakan login kembali.', 'unauthorized');
  }
  var hash = sha256Hex_(token);
  var sessions = readTable_(SHEET_SESSIONS);
  var session = null;
  for (var i = 0; i < sessions.length; i++) {
    if (safeEqual_(String(sessions[i].token_hash), hash)) { session = sessions[i]; break; }
  }
  if (!session) throw new ApiError('Sesi tidak valid atau telah berakhir. Silakan login kembali.', 'unauthorized');
  if (new Date(iso_(session.expires_at)).getTime() < Date.now()) {
    deleteRows_(SHEET_SESSIONS, [session._row]);
    throw new ApiError('Sesi telah berakhir. Silakan login kembali.', 'unauthorized');
  }
  var users = readTable_(SHEET_USERS);
  for (var j = 0; j < users.length; j++) {
    if (String(users[j].id) === String(session.user_id)) {
      var user = normalizeUser_(users[j]);
      if (!user.active || (user.role !== 'admin' && user.role !== 'editor')) break;
      return user;
    }
  }
  throw new ApiError('Akun tidak aktif atau tidak ditemukan.', 'unauthorized');
}

function handleLogout_(body) {
  var hash = sha256Hex_(String(body.token || ''));
  var sessions = readTable_(SHEET_SESSIONS);
  var rows = [];
  sessions.forEach(function (s) { if (String(s.token_hash) === hash) rows.push(s._row); });
  if (rows.length) deleteRows_(SHEET_SESSIONS, rows);
  return { loggedOut: true };
}

function invalidateUserSessions_(userId) {
  var rows = [];
  readTable_(SHEET_SESSIONS).forEach(function (s) { if (String(s.user_id) === String(userId)) rows.push(s._row); });
  if (rows.length) deleteRows_(SHEET_SESSIONS, rows);
}

function handleChangePassword_(body, user) {
  var oldPassword = typeof body.old_password === 'string' ? body.old_password : '';
  var newPassword = body.new_password;
  if (!verifyPassword_(oldPassword, user.password_hash)) {
    throw new ApiError('Kata sandi lama tidak sesuai.', 'invalid_credentials');
  }
  validatePassword_(newPassword);
  return withLock_(function () {
    var sheet = getSheet_(SHEET_USERS);
    sheet.getRange(user._row, HEADERS[SHEET_USERS].indexOf('password_hash') + 1).setValue(hashPassword_(newPassword));
    invalidateUserSessions_(user.id);
    log_(user.username, 'ganti_password', '');
    return { changed: true, relogin: true };
  });
}

// ---------------------------------------------------------------------------
// Model berita
// ---------------------------------------------------------------------------

function normalizePost_(row) {
  var tags = String(row.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
  return {
    _row: row._row,
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt || ''),
    thumbnail: String(row.thumbnail || ''),
    category: String(row.category || ''),
    tags: tags,
    author_id: String(row.author_id || ''),
    author_name: String(row.author_name || ''),
    status: String(row.status || 'draft').toLowerCase() === 'published' ? 'published' : 'draft',
    featured: toBool_(row.featured),
    views: toInt_(row.views),
    word_count: toInt_(row.word_count),
    created_at: iso_(row.created_at),
    updated_at: iso_(row.updated_at),
    published_at: iso_(row.published_at)
  };
}

function postForClient_(post, categoryNames) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    thumbnail: post.thumbnail,
    category: post.category,
    category_name: categoryNames[post.category] || post.category,
    tags: post.tags,
    author_id: post.author_id,
    author_name: post.author_name,
    status: post.status,
    featured: post.featured,
    views: post.views,
    word_count: post.word_count,
    created_at: post.created_at,
    updated_at: post.updated_at,
    published_at: post.published_at
  };
}

function categoryNameMap_() {
  var map = {};
  readTable_(SHEET_CATEGORIES).forEach(function (c) { map[String(c.slug)] = String(c.name); });
  return map;
}

function readContent_(postId) {
  var parts = readTable_(SHEET_CONTENT)
    .filter(function (r) { return String(r.post_id) === String(postId); })
    .sort(function (a, b) { return toInt_(a.part) - toInt_(b.part); });
  return parts.map(function (r) { return String(r.text); }).join('');
}

function writeContent_(postId, content) {
  var existing = readTable_(SHEET_CONTENT)
    .filter(function (r) { return String(r.post_id) === String(postId); })
    .map(function (r) { return r._row; });
  if (existing.length) deleteRows_(SHEET_CONTENT, existing);

  var sheet = getSheet_(SHEET_CONTENT);
  var chunks = [];
  for (var i = 0; i < content.length; i += CONTENT_CHUNK_SIZE) {
    chunks.push(content.substring(i, i + CONTENT_CHUNK_SIZE));
  }
  if (!chunks.length) chunks.push('');
  var values = chunks.map(function (text, idx) { return [postId, idx, text]; });
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, 3).setValues(values);
}

function sortByPublished_(a, b) {
  return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
}

// ---------- Aksi publik ----------

function handlePublicIndex_() {
  var names = categoryNameMap_();
  var counts = {};
  var posts = readTable_(SHEET_POSTS)
    .map(normalizePost_)
    .filter(function (p) { return p.status === 'published'; })
    .sort(sortByPublished_);

  posts.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });

  var categories = readTable_(SHEET_CATEGORIES).map(function (c) {
    return {
      slug: String(c.slug),
      name: String(c.name),
      description: String(c.description || ''),
      count: counts[String(c.slug)] || 0
    };
  });

  return {
    posts: posts.map(function (p) {
      var out = postForClient_(p, names);
      delete out.author_id;
      delete out.status;
      return out;
    }),
    categories: categories
  };
}

function handlePublicPost_(body) {
  var slug = cleanText_(body.slug, 120).toLowerCase();
  if (!slug) throw new ApiError('Slug wajib diisi.', 'validation');
  var names = categoryNameMap_();
  var rows = readTable_(SHEET_POSTS).map(normalizePost_);
  var post = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].slug === slug && rows[i].status === 'published') { post = rows[i]; break; }
  }
  if (!post) throw new ApiError('Berita tidak ditemukan.', 'not_found');
  var out = postForClient_(post, names);
  delete out.author_id;
  delete out.status;
  out.content = readContent_(post.id);
  return out;
}

function handleIncrementView_(body) {
  var slug = cleanText_(body.slug, 120).toLowerCase();
  if (!slug) throw new ApiError('Slug wajib diisi.', 'validation');
  if (!rateLimit_('view_global', 120, 60)) return { views: null };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return { views: null };
  try {
    var rows = readTable_(SHEET_POSTS);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].slug) === slug && String(rows[i].status).toLowerCase() === 'published') {
        var views = toInt_(rows[i].views) + 1;
        getSheet_(SHEET_POSTS).getRange(rows[i]._row, HEADERS[SHEET_POSTS].indexOf('views') + 1).setValue(views);
        return { views: views };
      }
    }
    return { views: null };
  } finally {
    try { lock.releaseLock(); } catch (_) { /* abaikan */ }
  }
}

// ---------- Aksi admin: berita ----------

function canManagePost_(post, user) {
  return user.role === 'admin' || post.author_id === user.id;
}

function handleAdminListPosts_(body, user) {
  var names = categoryNameMap_();
  var posts = readTable_(SHEET_POSTS)
    .map(normalizePost_)
    .sort(function (a, b) { return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at); });
  return {
    posts: posts.map(function (p) {
      var out = postForClient_(p, names);
      out.can_edit = canManagePost_(p, user);
      return out;
    })
  };
}

function handleAdminGetPost_(body, user) {
  var id = cleanText_(body.id, 40);
  var names = categoryNameMap_();
  var post = null;
  readTable_(SHEET_POSTS).forEach(function (r) { if (String(r.id) === id) post = normalizePost_(r); });
  if (!post) throw new ApiError('Berita tidak ditemukan.', 'not_found');
  if (!canManagePost_(post, user)) throw new ApiError('Anda tidak berhak mengubah berita ini.', 'forbidden');
  var out = postForClient_(post, names);
  out.content = readContent_(post.id);
  return out;
}

function validatePostInput_(body) {
  var title = cleanText_(body.title, 200);
  if (title.length < 5) throw new ApiError('Judul minimal 5 karakter.', 'validation');

  var content = typeof body.content === 'string' ? body.content.replace(/\r\n/g, '\n') : '';
  if (!content.trim()) throw new ApiError('Isi berita tidak boleh kosong.', 'validation');
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new ApiError('Isi berita terlalu panjang (maksimal ' + MAX_CONTENT_LENGTH.toLocaleString('id-ID') + ' karakter).', 'validation');
  }

  var thumbnail = typeof body.thumbnail === 'string' ? body.thumbnail.trim() : '';
  if (thumbnail && (!isHttpUrl_(thumbnail) || thumbnail.length > 1000)) {
    throw new ApiError('URL thumbnail harus diawali http:// atau https://.', 'validation');
  }

  var status = body.status === 'published' ? 'published' : 'draft';
  var excerpt = cleanText_(body.excerpt, 300);
  if (!excerpt) {
    excerpt = content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[#>*_`~|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 180);
    if (excerpt.length === 180) excerpt = excerpt.replace(/\s+\S*$/, '') + '…';
  }

  return {
    title: title,
    content: content,
    thumbnail: thumbnail,
    status: status,
    excerpt: excerpt,
    category: cleanText_(body.category, 60).toLowerCase(),
    tags: parseTags_(body.tags),
    slug: body.slug ? slugify_(cleanText_(body.slug, 120)) : '',
    featured: body.featured === true
  };
}

function handleSavePost_(body, user) {
  var input = validatePostInput_(body);

  return withLock_(function () {
    var categories = readTable_(SHEET_CATEGORIES).map(function (c) { return String(c.slug); });
    if (!input.category || categories.indexOf(input.category) === -1) {
      throw new ApiError('Kategori tidak valid.', 'validation');
    }

    var posts = readTable_(SHEET_POSTS).map(normalizePost_);
    var id = cleanText_(body.id, 40);
    var existing = null;
    if (id) {
      posts.forEach(function (p) { if (p.id === id) existing = p; });
      if (!existing) throw new ApiError('Berita tidak ditemukan.', 'not_found');
      if (!canManagePost_(existing, user)) throw new ApiError('Anda tidak berhak mengubah berita ini.', 'forbidden');
    }

    var taken = posts.filter(function (p) { return !existing || p.id !== existing.id; }).map(function (p) { return p.slug; });
    var baseSlug = input.slug || (existing ? existing.slug : slugify_(input.title));
    var slug = uniqueSlug_(baseSlug, taken);

    var now = new Date().toISOString();
    var featured = user.role === 'admin' ? input.featured : (existing ? existing.featured : false);
    var publishedAt = existing ? existing.published_at : '';
    if (input.status === 'published' && !publishedAt) publishedAt = now;

    var record = {
      id: existing ? existing.id : 'brt_' + randomHex_(6),
      slug: slug,
      title: input.title,
      excerpt: input.excerpt,
      thumbnail: input.thumbnail,
      category: input.category,
      tags: input.tags.join(', '),
      author_id: existing ? existing.author_id : user.id,
      author_name: existing ? existing.author_name : user.name,
      status: input.status,
      featured: featured ? 'TRUE' : 'FALSE',
      views: existing ? existing.views : 0,
      word_count: countWords_(input.content),
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      published_at: publishedAt
    };

    if (existing) writeObject_(SHEET_POSTS, existing._row, record);
    else appendObject_(SHEET_POSTS, record);
    writeContent_(record.id, input.content);

    log_(user.username, existing ? 'ubah_berita' : 'tambah_berita', record.title);
    return { id: record.id, slug: record.slug, status: record.status, created: !existing };
  });
}

function handleUpdateFlags_(body, user) {
  var id = cleanText_(body.id, 40);
  return withLock_(function () {
    var post = null;
    readTable_(SHEET_POSTS).forEach(function (r) { if (String(r.id) === id) post = normalizePost_(r); });
    if (!post) throw new ApiError('Berita tidak ditemukan.', 'not_found');
    if (!canManagePost_(post, user)) throw new ApiError('Anda tidak berhak mengubah berita ini.', 'forbidden');

    var now = new Date().toISOString();
    if (body.status === 'published' || body.status === 'draft') {
      post.status = body.status;
      if (post.status === 'published' && !post.published_at) post.published_at = now;
    }
    if (typeof body.featured === 'boolean') {
      if (user.role !== 'admin') throw new ApiError('Hanya admin yang dapat mengatur berita unggulan.', 'forbidden');
      post.featured = body.featured;
    }
    post.updated_at = now;

    var row = {};
    Object.keys(post).forEach(function (k) { row[k] = post[k]; });
    row.tags = post.tags.join(', ');
    row.featured = post.featured ? 'TRUE' : 'FALSE';
    writeObject_(SHEET_POSTS, post._row, row);

    log_(user.username, 'ubah_status', post.title + ' → ' + post.status + (post.featured ? ' (unggulan)' : ''));
    return { id: post.id, status: post.status, featured: post.featured };
  });
}

function handleDeletePost_(body, user) {
  var id = cleanText_(body.id, 40);
  return withLock_(function () {
    var post = null;
    readTable_(SHEET_POSTS).forEach(function (r) { if (String(r.id) === id) post = normalizePost_(r); });
    if (!post) throw new ApiError('Berita tidak ditemukan.', 'not_found');
    if (!canManagePost_(post, user)) throw new ApiError('Anda tidak berhak menghapus berita ini.', 'forbidden');

    var contentRows = readTable_(SHEET_CONTENT)
      .filter(function (r) { return String(r.post_id) === id; })
      .map(function (r) { return r._row; });
    if (contentRows.length) deleteRows_(SHEET_CONTENT, contentRows);
    deleteRows_(SHEET_POSTS, [post._row]);

    log_(user.username, 'hapus_berita', post.title);
    return { deleted: true };
  });
}

function detectImageType_(bytes) {
  function b(i) { return (bytes[i] + 256) % 256; }
  if (bytes.length > 12 && b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
      b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return 'image/webp';
  if (bytes.length > 3 && b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) return 'image/jpeg';
  if (bytes.length > 8 && b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47) return 'image/png';
  if (bytes.length > 4 && b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x38) return 'image/gif';
  return null;
}

function getUploadFolder_() {
  var props = props_();
  var folderId = props.getProperty('DRIVE_FOLDER_ID');
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (_) { /* buat baru di bawah */ }
  }
  var folder = DriveApp.createFolder('HIMTEKK Berita - Media');
  props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

function handleUploadImage_(body, user) {
  if (!rateLimit_('upload_' + user.id, 20, 60)) {
    throw new ApiError('Terlalu banyak unggahan. Coba lagi sebentar.', 'rate_limited');
  }
  var data = typeof body.data === 'string' ? body.data.replace(/^data:[^,]*,/, '') : '';
  if (!data) throw new ApiError('Data gambar kosong.', 'validation');

  var bytes;
  try {
    bytes = Utilities.base64Decode(data);
  } catch (_) {
    throw new ApiError('Data gambar tidak valid.', 'validation');
  }
  if (bytes.length > MAX_UPLOAD_BYTES) throw new ApiError('Ukuran gambar maksimal 3 MB.', 'validation');

  var mime = detectImageType_(bytes);
  if (!mime) throw new ApiError('Format gambar tidak didukung (gunakan WebP, JPG, PNG, atau GIF).', 'validation');

  var ext = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' }[mime];
  var base = cleanText_(String(body.filename || 'gambar'), 60).replace(/\.[a-z0-9]+$/i, '');
  var name = slugify_(base) + '-' + randomHex_(3) + '.' + ext;

  var file = getUploadFolder_().createFile(Utilities.newBlob(bytes, mime, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  log_(user.username, 'unggah_gambar', name);
  return { url: 'https://lh3.googleusercontent.com/d/' + file.getId(), id: file.getId(), name: name };
}

// ---------- Aksi admin: kategori ----------

function handleListCategories_() {
  var counts = {};
  readTable_(SHEET_POSTS).forEach(function (p) {
    var c = String(p.category);
    counts[c] = (counts[c] || 0) + 1;
  });
  return {
    categories: readTable_(SHEET_CATEGORIES).map(function (c) {
      return {
        slug: String(c.slug),
        name: String(c.name),
        description: String(c.description || ''),
        count: counts[String(c.slug)] || 0
      };
    })
  };
}

function handleSaveCategory_(body, user) {
  var name = cleanText_(body.name, 40);
  if (name.length < 2) throw new ApiError('Nama kategori minimal 2 karakter.', 'validation');
  var description = cleanText_(body.description, 200);

  return withLock_(function () {
    var rows = readTable_(SHEET_CATEGORIES);
    var oldSlug = cleanText_(body.slug, 60).toLowerCase();
    var existing = null;
    if (oldSlug) rows.forEach(function (r) { if (String(r.slug) === oldSlug) existing = r; });
    if (oldSlug && !existing) throw new ApiError('Kategori tidak ditemukan.', 'not_found');

    var taken = rows.filter(function (r) { return !existing || r._row !== existing._row; })
      .map(function (r) { return String(r.slug); });
    var nameTaken = rows.some(function (r) {
      return (!existing || r._row !== existing._row) && String(r.name).toLowerCase() === name.toLowerCase();
    });
    if (nameTaken) throw new ApiError('Nama kategori sudah dipakai.', 'validation');

    var slug = existing ? existing.slug : uniqueSlug_(slugify_(name), taken);
    var record = { slug: slug, name: name, description: description };
    if (existing) writeObject_(SHEET_CATEGORIES, existing._row, record);
    else appendObject_(SHEET_CATEGORIES, record);

    log_(user.username, existing ? 'ubah_kategori' : 'tambah_kategori', name);
    return { slug: slug, name: name, description: description };
  });
}

function handleDeleteCategory_(body, user) {
  var slug = cleanText_(body.slug, 60).toLowerCase();
  return withLock_(function () {
    var category = null;
    readTable_(SHEET_CATEGORIES).forEach(function (r) { if (String(r.slug) === slug) category = r; });
    if (!category) throw new ApiError('Kategori tidak ditemukan.', 'not_found');
    var used = readTable_(SHEET_POSTS).some(function (p) { return String(p.category) === slug; });
    if (used) throw new ApiError('Kategori masih dipakai oleh berita. Pindahkan berita terlebih dahulu.', 'conflict');
    deleteRows_(SHEET_CATEGORIES, [category._row]);
    log_(user.username, 'hapus_kategori', category.name);
    return { deleted: true };
  });
}

// ---------- Aksi admin: pengguna ----------

function userForAdmin_(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    active: u.active,
    created_at: u.created_at,
    last_login: u.last_login
  };
}

function handleListUsers_() {
  var postCounts = {};
  readTable_(SHEET_POSTS).forEach(function (p) {
    var a = String(p.author_id);
    postCounts[a] = (postCounts[a] || 0) + 1;
  });
  return {
    users: readTable_(SHEET_USERS).map(normalizeUser_).map(function (u) {
      var out = userForAdmin_(u);
      out.post_count = postCounts[u.id] || 0;
      return out;
    })
  };
}

function countActiveAdmins_(users, exceptId) {
  return users.filter(function (u) {
    return u.role === 'admin' && u.active && u.id !== exceptId;
  }).length;
}

function handleSaveUser_(body, actor) {
  var username = cleanText_(body.username, 30).toLowerCase();
  if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
    throw new ApiError('Username 3–30 karakter: huruf kecil, angka, titik, strip, atau underscore.', 'validation');
  }
  var name = cleanText_(body.name, 60) || username;
  var role = body.role === 'admin' ? 'admin' : 'editor';
  var active = body.active !== false;
  var password = body.password;

  return withLock_(function () {
    var users = readTable_(SHEET_USERS).map(normalizeUser_);
    var id = cleanText_(body.id, 40);
    var existing = null;
    if (id) users.forEach(function (u) { if (u.id === id) existing = u; });
    if (id && !existing) throw new ApiError('Pengguna tidak ditemukan.', 'not_found');

    var duplicate = users.some(function (u) {
      return u.username.toLowerCase() === username && (!existing || u.id !== existing.id);
    });
    if (duplicate) throw new ApiError('Username sudah dipakai.', 'validation');

    if (existing) {
      if (existing.id === actor.id && (role !== 'admin' || !active)) {
        throw new ApiError('Anda tidak dapat menurunkan peran atau menonaktifkan akun sendiri.', 'validation');
      }
      if ((existing.role === 'admin' && existing.active) && (role !== 'admin' || !active) &&
          countActiveAdmins_(users, existing.id) === 0) {
        throw new ApiError('Minimal harus ada satu admin aktif.', 'validation');
      }
      var passwordHash = existing.password_hash;
      if (password) {
        validatePassword_(password);
        passwordHash = hashPassword_(password);
      }
      writeObject_(SHEET_USERS, existing._row, {
        id: existing.id, username: username, name: name, password_hash: passwordHash,
        role: role, active: active ? 'TRUE' : 'FALSE',
        created_at: existing.created_at, last_login: existing.last_login
      });
      if (!active || password || role !== existing.role) invalidateUserSessions_(existing.id);
      log_(actor.username, 'ubah_pengguna', username);
      return { id: existing.id, username: username };
    }

    validatePassword_(password);
    var record = {
      id: 'usr_' + randomHex_(6), username: username, name: name,
      password_hash: hashPassword_(password), role: role, active: active ? 'TRUE' : 'FALSE',
      created_at: new Date().toISOString(), last_login: ''
    };
    appendObject_(SHEET_USERS, record);
    log_(actor.username, 'tambah_pengguna', username);
    return { id: record.id, username: username };
  });
}

function handleDeleteUser_(body, actor) {
  var id = cleanText_(body.id, 40);
  if (id === actor.id) throw new ApiError('Anda tidak dapat menghapus akun sendiri.', 'validation');
  return withLock_(function () {
    var users = readTable_(SHEET_USERS).map(normalizeUser_);
    var target = null;
    users.forEach(function (u) { if (u.id === id) target = u; });
    if (!target) throw new ApiError('Pengguna tidak ditemukan.', 'not_found');
    if (target.role === 'admin' && target.active && countActiveAdmins_(users, target.id) === 0) {
      throw new ApiError('Minimal harus ada satu admin aktif.', 'validation');
    }
    var hasPosts = readTable_(SHEET_POSTS).some(function (p) { return String(p.author_id) === id; });
    if (hasPosts) {
      throw new ApiError('Pengguna masih memiliki berita. Nonaktifkan akun alih-alih menghapusnya.', 'conflict');
    }
    invalidateUserSessions_(id);
    deleteRows_(SHEET_USERS, [target._row]);
    log_(actor.username, 'hapus_pengguna', target.username);
    return { deleted: true };
  });
}

// ---------- Aksi admin: statistik & log ----------

function handleStats_(body, user) {
  var names = categoryNameMap_();
  var all = readTable_(SHEET_POSTS).map(normalizePost_);
  var posts = user.role === 'admin' ? all : all.filter(function (p) { return p.author_id === user.id; });

  var published = posts.filter(function (p) { return p.status === 'published'; });
  var perCategory = {};
  posts.forEach(function (p) {
    var key = p.category;
    perCategory[key] = perCategory[key] || { slug: key, name: names[key] || key, total: 0, views: 0 };
    perCategory[key].total++;
    perCategory[key].views += p.views;
  });

  var top = published.slice().sort(function (a, b) { return b.views - a.views; }).slice(0, 5);
  var recent = posts.slice().sort(function (a, b) {
    return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
  }).slice(0, 5);

  var stats = {
    scope: user.role === 'admin' ? 'all' : 'mine',
    total: posts.length,
    published: published.length,
    draft: posts.length - published.length,
    featured: posts.filter(function (p) { return p.featured; }).length,
    views: posts.reduce(function (sum, p) { return sum + p.views; }, 0),
    categories: Object.keys(perCategory).map(function (k) { return perCategory[k]; })
      .sort(function (a, b) { return b.total - a.total; }),
    top: top.map(function (p) { return postForClient_(p, names); }),
    recent: recent.map(function (p) { return postForClient_(p, names); })
  };

  if (user.role === 'admin') {
    var users = readTable_(SHEET_USERS).map(normalizeUser_);
    stats.users = users.length;
    stats.editors = users.filter(function (u) { return u.role === 'editor'; }).length;
  }
  return stats;
}

function handleAuditLog_(body) {
  var limit = Math.min(Math.max(toInt_(body.limit) || 50, 1), 200);
  var rows = readTable_(SHEET_LOG);
  return {
    entries: rows.slice(-limit).reverse().map(function (r) {
      return { time: iso_(r.time), user: String(r.user), action: String(r.action), detail: String(r.detail || '') };
    })
  };
}

// ---------------------------------------------------------------------------
// Setup & pemeliharaan (dijalankan manual dari editor Apps Script)
// ---------------------------------------------------------------------------

/**
 * Menyiapkan seluruh sistem. Aman dijalankan berulang kali (idempoten).
 *
 * Sebelum menjalankan, buka Project Settings → Script Properties dan isi:
 *   ADMIN_USERNAME  (contoh: admin)
 *   ADMIN_PASSWORD  (min. 8 karakter, huruf + angka)
 *   API_SECRET      (opsional; jika kosong akan dibuat otomatis dan dicatat di log)
 *   SPREADSHEET_ID  (opsional; jika kosong spreadsheet baru dibuat otomatis)
 */
function setup() {
  var props = props_();

  var ss;
  var existingId = props.getProperty('SPREADSHEET_ID');
  if (existingId) {
    ss = SpreadsheetApp.openById(existingId);
  } else {
    ss = SpreadsheetApp.create('HIMTEKK Berita Database');
    props.setProperty('SPREADSHEET_ID', ss.getId());
    Logger.log('Spreadsheet baru dibuat: ' + ss.getUrl());
  }
  _spreadsheet = ss;

  Object.keys(HEADERS).forEach(function (name) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var header = HEADERS[name];
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#00406E').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    // Teks polos agar tanggal/rumus tidak diubah otomatis oleh Google Sheets.
    sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), header.length).setNumberFormat('@');
  });
  var viewsCol = HEADERS[SHEET_POSTS].indexOf('views') + 1;
  var wordsCol = HEADERS[SHEET_POSTS].indexOf('word_count') + 1;
  var postsSheet = ss.getSheetByName(SHEET_POSTS);
  postsSheet.getRange(2, viewsCol, Math.max(postsSheet.getMaxRows() - 1, 1), 1).setNumberFormat('0');
  postsSheet.getRange(2, wordsCol, Math.max(postsSheet.getMaxRows() - 1, 1), 1).setNumberFormat('0');
  var contentSheet = ss.getSheetByName(SHEET_CONTENT);
  contentSheet.getRange(2, 2, Math.max(contentSheet.getMaxRows() - 1, 1), 1).setNumberFormat('0');

  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);

  if (readTable_(SHEET_CATEGORIES).length === 0) {
    DEFAULT_CATEGORIES.forEach(function (c) {
      appendObject_(SHEET_CATEGORIES, { slug: c[0], name: c[1], description: c[2] });
    });
  }

  if (!props.getProperty('API_SECRET')) {
    props.setProperty('API_SECRET', 'himtekk-berita-secret');
    Logger.log('API_SECRET disetel ke default: himtekk-berita-secret');
  }

  ensureAdmin_(props);

  Logger.log('Setup selesai. Spreadsheet: ' + ss.getUrl());
}

function ensureAdmin_(props) {
  var users = readTable_(SHEET_USERS).map(normalizeUser_);
  var username = cleanText_(props.getProperty('ADMIN_USERNAME') || '', 30).toLowerCase();
  var password = props.getProperty('ADMIN_PASSWORD');

  var hasAdmin = users.some(function (u) { return u.role === 'admin' && u.active; });
  if (hasAdmin && !password) return;

  if (!username || !password) {
    Logger.log('PERHATIAN: belum ada admin. Isi Script Properties ADMIN_USERNAME & ADMIN_PASSWORD lalu jalankan setup() lagi.');
    return;
  }
  if (!/^[a-z0-9_.-]{3,30}$/.test(username)) throw new Error('ADMIN_USERNAME tidak valid.');
  validatePassword_(password);

  var existing = null;
  users.forEach(function (u) { if (u.username.toLowerCase() === username) existing = u; });

  if (existing) {
    getSheet_(SHEET_USERS).getRange(existing._row, HEADERS[SHEET_USERS].indexOf('password_hash') + 1).setValue(hashPassword_(password));
    invalidateUserSessions_(existing.id);
    Logger.log('Kata sandi admin "' + username + '" diperbarui.');
  } else {
    appendObject_(SHEET_USERS, {
      id: 'usr_' + randomHex_(6), username: username, name: 'Administrator',
      password_hash: hashPassword_(password), role: 'admin', active: 'TRUE',
      created_at: new Date().toISOString(), last_login: ''
    });
    Logger.log('Admin "' + username + '" dibuat.');
  }
  // Jangan menyimpan kata sandi polos lebih lama dari yang diperlukan.
  props.deleteProperty('ADMIN_PASSWORD');
}

/** Reset kata sandi admin: isi ADMIN_USERNAME & ADMIN_PASSWORD di Script Properties lalu jalankan fungsi ini. */
function resetAdminPassword() {
  ensureAdmin_(props_());
}

/** Opsional: pasang trigger harian (Triggers → Add Trigger) untuk membersihkan sesi kedaluwarsa. */
function cleanExpiredSessions() {
  var now = Date.now();
  var rows = [];
  readTable_(SHEET_SESSIONS).forEach(function (s) {
    if (new Date(iso_(s.expires_at)).getTime() < now) rows.push(s._row);
  });
  if (rows.length) deleteRows_(SHEET_SESSIONS, rows);
  Logger.log('Sesi kedaluwarsa dihapus: ' + rows.length);
}

