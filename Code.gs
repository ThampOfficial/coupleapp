/**
 * Couple App — Google Apps Script backend
 * ข้อมูลอยู่ใน Google Sheet "Couple App Data" (แท็บ Moments, Settings)
 * รูปอยู่ในโฟลเดอร์ Drive "Couple App/Photos"
 * หน้าแอปอยู่ที่ GitHub Pages (index.html) ไฟล์นี้เป็น API ที่ต้องใส่รหัสผ่าน
 * รหัสผ่านอยู่ในแท็บ Settings แถว password
 */
const SHEET_ID = '1D3QrHrBOj_SUZCK-Y8hEyevaUVAjEHPbpRfn2LjW9ZQ';
const COLS = ['id','date','type','title','note','place','lat','lng','photos','repeat','createdAt','updatedAt'];

const APP_URL = 'https://thampofficial.github.io/coupleapp/';

// แอปอยู่ที่ GitHub Pages ไฟล์นี้เป็น API อย่างเดียว
function doGet(e) {
  if (e && e.parameter && e.parameter.action) return handle_(e.parameter);
  return HtmlService.createHtmlOutput('<p style="font:16px sans-serif">เปิดแอปที่ <a href="' + APP_URL + '" target="_top">' + APP_URL + '</a></p>');
}
function doPost(e) {
  let p = {};
  try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  return handle_(p);
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function handle_(p) {
  try {
    checkPw_(p.pw);
    let result;
    switch (p.action) {
      case 'getData': result = getData(); break;
      case 'saveSettings': result = saveSettings(p.settings || {}); break;
      case 'saveMoment': result = saveMoment(p.moment || {}); break;
      case 'deleteMoment': result = deleteMoment(p.id); break;
      case 'uploadPhoto': result = uploadPhoto(p.base64, p.name); break;
      case 'placeName': result = placeName(Number(p.lat), Number(p.lng)); break;
      case 'ping': result = true; break;
      default: throw new Error('ไม่รู้จักคำสั่ง ' + p.action);
    }
    return json_({ result: result });
  } catch (err) {
    return json_({ error: String(err && err.message || err), code: err && err.code || '' });
  }
}

function checkPw_(pw) {
  const real = readSettings_().password;
  if (!real || String(pw || '') !== String(real)) {
    const e = new Error('รหัสผ่านไม่ถูกต้อง'); e.code = 'auth'; throw e;
  }
}

// cache ไว้ให้โหลดเร็ว ล้างทุกครั้งที่มีการแก้ข้อมูล
function cache_() { return CacheService.getScriptCache(); }
function clearCache_() { cache_().removeAll(['settings', 'data']); }

function ss_() { return SpreadsheetApp.openById(SHEET_ID); }
function sheet_(name) { return ss_().getSheetByName(name); }

function readSettings_() {
  const hit = cache_().get('settings');
  if (hit) return JSON.parse(hit);
  const rows = sheet_('Settings').getDataRange().getDisplayValues().slice(1);
  const s = {};
  rows.forEach(r => { if (r[0]) s[r[0]] = r[1]; });
  cache_().put('settings', JSON.stringify(s), 600);
  return s;
}

function getData() {
  const hit = cache_().get('data');
  if (hit) return JSON.parse(hit);
  const settings = Object.assign({}, readSettings_());
  delete settings.photoFolderId; delete settings.password;
  const rows = sheet_('Moments').getDataRange().getDisplayValues().slice(1);
  const moments = rows.filter(r => r[0]).map(r => {
    const o = {}; COLS.forEach((c, i) => o[c] = r[i]);
    const lat = parseFloat(o.lat), lng = parseFloat(o.lng);
    return {
      id: o.id, date: o.date, type: o.type || 'other', title: o.title, note: o.note,
      place: (o.place || !isNaN(lat)) ? { name: o.place || 'ไม่ระบุชื่อ', lat: isNaN(lat) ? null : lat, lng: isNaN(lng) ? null : lng } : null,
      photos: o.photos ? o.photos.split(',').map(s => s.trim()).filter(String).map(id => ({ id })) : [],
      repeat: String(o.repeat).toUpperCase() === 'TRUE',
      createdAt: Number(o.createdAt) || 0, updatedAt: Number(o.updatedAt) || 0
    };
  });
  const out = { settings, moments };
  try { cache_().put('data', JSON.stringify(out), 600); } catch (e) {}
  return out;
}

function saveSettings(s) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_('Settings');
    const data = sh.getDataRange().getDisplayValues();
    ['nameA', 'nameB', 'start', 'wedding'].forEach(k => {
      const v = s[k] == null ? '' : String(s[k]);
      const i = data.findIndex(r => r[0] === k);
      if (i >= 0) sh.getRange(i + 1, 2).setValue(v);
      else { sh.appendRow([k, v, '']); data.push([k, v, '']); }
    });
  } finally { clearCache_(); lock.releaseLock(); }
  return true;
}

function toRow_(m, now) {
  const p = m.place || {};
  return [
    m.id, m.date || '', m.type || 'other', m.title || '', m.note || '',
    p.name || '', p.lat == null ? '' : String(p.lat), p.lng == null ? '' : String(p.lng),
    (m.photos || []).map(x => x.id).filter(String).join(','),
    m.repeat ? 'TRUE' : 'FALSE', String(m.createdAt || now), String(now)
  ];
}

function saveMoment(m) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_('Moments');
    const now = Date.now();
    if (!m.id) { m.id = Utilities.getUuid().replace(/-/g, '').slice(0, 20); m.createdAt = now; }
    const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(r => r[0]);
    const i = ids.indexOf(m.id);
    const row = toRow_(m, now);
    if (i > 0) {
      const old = sh.getRange(i + 1, 11).getDisplayValue();
      if (old) row[10] = old;
      sh.getRange(i + 1, 1, 1, COLS.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }
    return m.id;
  } finally { clearCache_(); lock.releaseLock(); }
}

function deleteMoment(id) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_('Moments');
    const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(r => r[0]);
    const i = ids.indexOf(id);
    if (i > 0) sh.deleteRow(i + 1);
    return true;
  } finally { clearCache_(); lock.releaseLock(); }
}

// แปลงพิกัดจากรูปเป็นชื่อสถานที่ (ใช้ Google Maps ใน Apps Script)
function placeName(lat, lng) {
  try {
    const res = Maps.newGeocoder().setLanguage('th').reverseGeocode(lat, lng).results || [];
    if (!res.length) return '';
    const comps = res[0].address_components || [];
    const find = t => { const c = comps.find(c => c.types.indexOf(t) >= 0); return c ? c.long_name : ''; };
    let poi = '';
    for (const r of res) {
      const c = (r.address_components || []).find(c => /point_of_interest|establishment|park|natural_feature|tourist_attraction/.test(c.types.join(',')));
      if (c) { poi = c.long_name; break; }
    }
    const area = find('locality') || find('sublocality') || find('administrative_area_level_2') || find('administrative_area_level_1');
    const country = find('country');
    return [poi, area, poi ? '' : country].filter(String).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  } catch (e) { return ''; }
}

function uploadPhoto(base64, name) {
  const folderId = readSettings_().photoFolderId;
  const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', name || ('photo-' + Date.now() + '.jpg'));
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getId();
}

