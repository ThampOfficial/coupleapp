/**
 * Couple App — Google Apps Script backend
 * ข้อมูลอยู่ใน Google Sheet "Couple App Data" (แท็บ Moments, Settings)
 * รูปอยู่ในโฟลเดอร์ Drive "Couple App/Photos"
 */
const SHEET_ID = '1D3QrHrBOj_SUZCK-Y8hEyevaUVAjEHPbpRfn2LjW9ZQ';
const COLS = ['id','date','type','title','note','place','lat','lng','photos','repeat','createdAt','updatedAt'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('บันทึกของเราสองคน')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ss_() { return SpreadsheetApp.openById(SHEET_ID); }
function sheet_(name) { return ss_().getSheetByName(name); }

function readSettings_() {
  const rows = sheet_('Settings').getDataRange().getDisplayValues().slice(1);
  const s = {};
  rows.forEach(r => { if (r[0]) s[r[0]] = r[1]; });
  return s;
}

function getData() {
  const settings = readSettings_();
  const folder = settings.photoFolderId; delete settings.photoFolderId;
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
  return { settings, moments };
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
  } finally { lock.releaseLock(); }
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
  } finally { lock.releaseLock(); }
}

function deleteMoment(id) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet_('Moments');
    const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(r => r[0]);
    const i = ids.indexOf(id);
    if (i > 0) sh.deleteRow(i + 1);
    return true;
  } finally { lock.releaseLock(); }
}

function uploadPhoto(base64, name) {
  const folderId = readSettings_().photoFolderId;
  const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', name || ('photo-' + Date.now() + '.jpg'));
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getId();
}
