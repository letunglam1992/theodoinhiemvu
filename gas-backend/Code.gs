/**
 * =====================================================================================
 *  MÃ GOOGLE APPS SCRIPT — ĐỒNG BỘ 2 CHIỀU DASHBOARD ⇄ GOOGLE SHEET + EMAIL NHẮC HẠN
 *  Phiên bản giao thức: 6  (dashboard kiểm tra qua nút "Kiểm tra kết nối")
 * =====================================================================================
 *
 *  HƯỚNG DẪN CÀI ĐẶT (7 BƯỚC — làm 1 lần, trên chính Google Sheet đang nhập liệu)
 *  1. Mở Google Sheet → menu "Tiện ích mở rộng" (Extensions) → "Apps Script".
 *  2. Xoá toàn bộ mã có sẵn trong tệp Code.gs, dán TOÀN BỘ mã này vào, bấm Lưu (biểu tượng đĩa).
 *  3. Sửa phần CẤU HÌNH ngay bên dưới: đặt MA_BI_MAT giống hệt ô "Mã bí mật" trên dashboard.
 *     Tuỳ chọn: đặt TEST_EMAIL_ALLOWLIST trong Thuộc tính tập lệnh để giới hạn email gửi thử.
 *  4. Bấm "Triển khai" (Deploy) → "Triển khai mới" (New deployment) → biểu tượng bánh răng → "Ứng dụng web"
 *     (Web app) → Thực thi với tư cách (Execute as): "Tôi" (Me) → Người có quyền truy cập (Who has access):
 *     "Bất kỳ ai" (Anyone) → Triển khai → cấp quyền khi Google hỏi → sao chép "URL ứng dụng web" (…/exec)
 *     và dán vào ô "URL Web App" trên dashboard, bấm "Kiểm tra kết nối".
 *     * Nếu trước đây đã triển khai mã bản cũ (v1): KHÔNG tạo triển khai mới mà vào "Triển khai" →
 *       "Quản lý các bản triển khai" (Manage deployments) → biểu tượng bút chì (Edit) → Phiên bản (Version):
 *       "Phiên bản mới" (New version) → Triển khai. Như vậy URL cũ giữ nguyên, dashboard không cần sửa.
 *  5. Bật email nhắc hạn: trong trình soạn Apps Script, chọn hàm "caiDatNhacHan" ở thanh công cụ →
 *     bấm "Chạy" (Run) 1 lần → cấp quyền gửi email. Hàm sẽ tự tạo 2 sheet "Danh bạ" và
 *     "Cấu hình nhắc hạn" nếu chưa có, và đặt lịch gửi hằng ngày. Muốn tắt: chạy hàm "huyNhacHan".
 *  6. Điền sheet "Danh bạ" (Người tham mưu — Email — Nhận nhắc Có/Không) và sheet "Cấu hình nhắc hạn".
 *     Trên dashboard, mục "Nhắc hạn qua email": bấm "Xem trước danh sách nhận", rồi "Gửi thử" tới email của mình.
 *  7. Google Calendar: chọn hàm "caiDatDongBoCalendar" → Chạy → cấp quyền, chỉ cần một lần.
 *     Mã tạo lịch "Hạn nhiệm vụ", đồng bộ các dòng có ngày hợp lệ ở cột J và quét mỗi 15 phút.
 *     Muốn dừng quét tự động: chạy "huyDongBoCalendar"; sự kiện hiện có vẫn được giữ.
 *     Trong Cài đặt dự án, đặt múi giờ thành Asia/Ho_Chi_Minh.
 *  8. Báo văn bản mới có thời hạn: điền "Email nhận văn bản mới" trong sheet "Cấu hình nhắc hạn",
 *     rồi chạy "caiDatBaoVanBanMoi" một lần. Nếu chưa điền email, dùng tài khoản Google chạy hàm cài đặt.
 *     Chức năng lấy các dòng đang có làm mốc (không gửi thư cho dữ liệu cũ), sau đó quét mỗi 5 phút.
 *     Chỉ báo dòng mới có J là ngày hợp lệ, chưa có K/L; dòng chưa điền hạn sẽ chờ bổ sung.
 *     Muốn kiểm tra thủ công: chạy "chayBaoVanBanMoi"; muốn dừng: chạy "huyBaoVanBanMoi".
 *
 *  LƯU Ý QUAN TRỌNG
 *  - KHÔNG xoá / đổi tên các cột tiêu đề của sheet dữ liệu (dòng 1). Mã tìm cột THEO TÊN tiêu đề nên vẫn đúng
 *    khi đổi thứ tự cột; nếu không thấy tên thì mới dùng vị trí mặc định A–O.
 *  - Xoá nhiệm vụ trên dashboard sẽ xoá hẳn dòng trên Sheet nếu dữ liệu dòng chưa thay đổi; các dòng dưới dịch lên.
 *  - Ghi dữ liệu có khoá (LockService) nên nhiều người dùng dashboard cùng lúc không ghi đè lẫn nhau; trước khi
 *    ghi mỗi ô, mã so với giá trị dashboard thấy ở lần đồng bộ trước — nếu người khác đã sửa ô đó trên Sheet thì
 *    KHÔNG ghi mà báo "xung đột" để người dùng tự chọn.
 *  - Hạn mức gửi email của Google: tài khoản Gmail thường khoảng 100 người nhận/ngày, Google Workspace cao hơn
 *    (khoảng 1.500/ngày) — con số cụ thể do Google quy định và có thể thay đổi. Mã kiểm tra hạn mức còn lại
 *    trước mỗi email và dừng + ghi nhật ký khi hết.
 *  - Sau MỖI lần sửa mã này phải triển khai lại phiên bản mới (bước 4, dòng *) thì Web App mới dùng mã mới.
 * =====================================================================================
 */

// ============================== CẤU HÌNH ==============================
var CAU_HINH = {
  MA_BI_MAT: 'DAN_MA_BI_MAT_CUA_BAN_VAO_DAY', // Giữ cách cấu hình cũ; nhập mã hiện đang dùng
  MUI_GIO: 'Asia/Ho_Chi_Minh',
  TEN_SHEET_DANH_BA: 'Danh bạ',
  TEN_SHEET_CAU_HINH: 'Cấu hình nhắc hạn',
  TEN_SHEET_NHAT_KY: 'Nhật ký nhắc hạn',        // sheet ẩn, tự tạo
  // Tên sheet dữ liệu nhiệm vụ dùng cho EMAIL NHẮC HẠN (để trống = sheet đầu tiên của file).
  // Đồng bộ với dashboard thì dashboard tự gửi mã sheet (gid) theo link CSV đã cấu hình.
  TEN_SHEET_DU_LIEU: 'Danh sach nhiem vu',
  TEN_LICH_NHIEM_VU: 'Hạn nhiệm vụ',
  TEN_SHEET_LICH: 'Đồng bộ Calendar', // sheet ẩn để nhớ các sự kiện đã tạo
  TEN_COT_MA_LICH: 'Mã đồng bộ Calendar', // cột riêng, tự thêm và ẩn; không thay đổi A–O
  TEN_SHEET_BAO_MOI: 'Theo dõi báo văn bản mới', // sheet ẩn để chống gửi lại
  TEN_COT_MA_BAO_MOI: 'Mã thông báo văn bản mới', // cột riêng, tự thêm và ẩn
  ID_SHEET_KH281: '1GJDRd2jYhODy239vfDGwQR3pKPpCRIaHFGpyje_Y3gs' // Biểu riêng theo CV 6429; không thay tab nhiệm vụ hiện có
};
// Giá trị mặc định khi sheet "Cấu hình nhắc hạn" chưa có / để trống ô
var MAC_DINH_NHAC_HAN = {
  soNgayBaoTruoc: 3, guiQuaHan: true, gioGui: 7, emailLanhDao: '',
  chiNgayLamViec: true, tenDonVi: 'Đơn vị', linkDashboard: '', emailVanBanMoi: ''
};
// =====================================================================

var SCRIPT_VERSION = 6; // v6: đọc biểu chuyên đề KH 281 / CV 6429 có xác thực

// 15 cột của mẫu nhập liệu: field = tên trường dùng trong giao thức với dashboard
var COT_DU_LIEU = [
  {field: 'stt',                 ten: 'STT',                          pos: 1,  alias: ['stt', 'tt', 'so thu tu']},
  {field: 'so_hieu_vb',          ten: 'Số ký hiệu',                   pos: 2,  alias: ['so ky hieu', 'so hieu van ban']},
  {field: 'noi_dung_vb',         ten: 'Trích yếu',                    pos: 3,  alias: ['trich yeu']},
  {field: 'loai_van_ban',        ten: 'Loại văn bản',                 pos: 4,  alias: ['loai van ban']},
  {field: 'cq_giao',             ten: 'Cơ quan ban hành',             pos: 5,  alias: ['co quan ban hanh']},
  {field: 'ngay_ban_hanh',       ten: 'Ngày tháng năm ban hành',      pos: 6,  alias: ['ngay thang nam ban hanh', 'ngay ban hanh'], ngay: true},
  {field: 'nhiem_vu',            ten: 'Nội dung nhiệm vụ',            pos: 7,  alias: ['noi dung nhiem vu']},
  {field: 'cq_chu_tri',          ten: 'Phòng, đơn vị chủ trì',        pos: 8,  alias: ['phong don vi chu tri']},
  {field: 'cq_phoi_hop',         ten: 'Phòng, đơn vị phối hợp',       pos: 9,  alias: ['phong don vi phoi hop']},
  {field: 'han_iso',             ten: 'Hạn hoàn thành',               pos: 10, alias: ['han hoan thanh'], ngay: true},
  {field: 'so_cv_hoan_thanh',    ten: 'Số văn bản hoàn thành',        pos: 11, alias: ['so van ban hoan thanh']},
  {field: 'ngay_hoan_thanh_iso', ten: 'Ngày tháng năm hoàn thành',    pos: 12, alias: ['ngay thang nam hoan thanh', 'ngay hoan thanh'], ngay: true},
  {field: 'nguoi_phu_trach',     ten: 'Người tham mưu',               pos: 13, alias: ['nguoi tham muu']},
  {field: 'delay_reason',        ten: 'Lý do chậm',                   pos: 14, alias: ['ly do cham']},
  {field: 'ghi_chu',             ten: 'Ghi chú',                      pos: 15, alias: ['ghi chu']}
];
var TRUONG_GHI = COT_DU_LIEU.filter(function (c) { return c.field !== 'stt'; }).map(function (c) { return c.field; });

// ------------------------------ Tiện ích chung ------------------------------
function traJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
// Bỏ dấu, chữ thường, bỏ dấu * và ký tự phân cách — dùng so khớp tên cột
function khongDau_(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
    .replace(/[*:()\[\].,;\/\\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
// Chuẩn hoá giá trị ô để so sánh: gộp khoảng trắng; ngày d/m/yyyy -> dd/mm/yyyy; yyyy-mm-dd -> dd/mm/yyyy
function chuanHoa_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CAU_HINH.MUI_GIO, 'dd/MM/yyyy');
  var s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return ('0' + m[1]).slice(-2) + '/' + ('0' + m[2]).slice(-2) + '/' + m[3];
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  return s;
}
function khoa_(v) { return chuanHoa_(v).toLowerCase(); }

// ------------------------------ Đọc sheet dữ liệu ------------------------------
function laySheetDuLieu_(gid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  if (gid !== undefined && gid !== null && gid !== '') {
    var theoGid = sheets.find(function (s) { return String(s.getSheetId()) === String(gid); });
    if (theoGid) return theoGid;
  }
  if (CAU_HINH.TEN_SHEET_DU_LIEU) {
    var theoTen = ss.getSheetByName(CAU_HINH.TEN_SHEET_DU_LIEU);
    if (theoTen) return theoTen;
  }
  return sheets[0];
}

// Tìm dòng tiêu đề (trong 10 dòng đầu) và ánh xạ cột theo TÊN; thiếu tên thì dùng vị trí A–O.
function docBang_(sheet) {
  var lastRow = sheet.getLastRow(), lastCol = Math.max(sheet.getLastColumn(), 1);
  var values = lastRow ? sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues() : [];
  var best = {row: 1, score: -1, map: {}};
  for (var r = 0; r < Math.min(10, values.length); r++) {
    var map = {}, score = 0;
    values[r].forEach(function (cell, ci) {
      var n = khongDau_(cell);
      if (!n) return;
      COT_DU_LIEU.forEach(function (c) {
        if (map[c.field]) return;
        if (c.alias.indexOf(n) >= 0) { map[c.field] = ci + 1; score++; }
      });
    });
    if (score > best.score) best = {row: r + 1, score: score, map: map};
  }
  if (best.score < 3) best = {row: 1, score: 0, map: {}};
  var map = best.map, headersFound = [], missingHeaders = [], used = {};
  Object.keys(map).forEach(function (f) { used[map[f]] = true; });
  COT_DU_LIEU.forEach(function (c) {
    if (map[c.field]) { headersFound.push(c.ten); return; }
    missingHeaders.push(c.ten);
    if (!used[c.pos]) { map[c.field] = c.pos; used[c.pos] = true; }   // dự phòng theo vị trí A–O
  });
  var bang = {sheet: sheet, headerRow: best.row, map: map, values: values, lastCol: lastCol,
              headersFound: headersFound, missingHeaders: missingHeaders};
  bang.lastDataRow = dongCuoiCoDuLieu_(bang);
  return bang;
}
function giaTri_(bang, row, field) {
  var col = bang.map[field];
  if (!col || row < 1 || row > bang.values.length) return '';
  return bang.values[row - 1][col - 1];
}
function dongCoDuLieu_(bang, row) {
  return TRUONG_GHI.some(function (f) { return chuanHoa_(giaTri_(bang, row, f)) !== ''; });
}
function dongCuoiCoDuLieu_(bang) {
  for (var r = bang.values.length; r > bang.headerRow; r--) if (dongCoDuLieu_(bang, r)) return r;
  return bang.headerRow;
}
function ghiO_(bang, row, field, value) {
  var col = bang.map[field];
  var s = value == null ? '' : String(value);
  var cell = bang.sheet.getRange(row, col);
  cell.setNumberFormat('@');           // giữ dạng Văn bản — Sheets không tự đổi dd/mm/yyyy thành Date
  cell.setValue(s);
  while (bang.values.length < row) bang.values.push(new Array(bang.lastCol).fill(''));
  bang.values[row - 1][col - 1] = s;
}

// ------------------------------ Xác định đúng dòng ------------------------------
// key = {so_hieu_vb, noi_dung_vb, nhiem_vu} — giá trị dashboard thấy ở lần đồng bộ trước.
function khopChinh_(bang, row, key) {
  if (khoa_(giaTri_(bang, row, 'so_hieu_vb')) !== khoa_(key.so_hieu_vb)) return false;
  if (khoa_(key.noi_dung_vb)) return khoa_(giaTri_(bang, row, 'noi_dung_vb')) === khoa_(key.noi_dung_vb);
  return khoa_(giaTri_(bang, row, 'nhiem_vu')) === khoa_(key.nhiem_vu);
}
function khopDayDu_(bang, row, key) {
  return khopChinh_(bang, row, key) && khoa_(giaTri_(bang, row, 'nhiem_vu')) === khoa_(key.nhiem_vu);
}
function timDong_(bang, syncRow, key) {
  key = key || {};
  if (!khoa_(key.so_hieu_vb) && !khoa_(key.noi_dung_vb) && !khoa_(key.nhiem_vu)) {
    return {status: 'not_found', message: 'Thiếu khoá nhận diện (Số ký hiệu / Trích yếu / Nội dung nhiệm vụ).'};
  }
  var r0 = Number(syncRow) || 0, first = bang.headerRow + 1, last = bang.values.length;
  var coTaiDong = r0 >= first && r0 <= last;
  if (coTaiDong && khopDayDu_(bang, r0, key)) return {row: r0};
  var full = [], chinh = [];
  for (var r = first; r <= last; r++) {
    if (!khopChinh_(bang, r, key)) continue;
    chinh.push(r);
    if (khopDayDu_(bang, r, key)) full.push(r);
  }
  if (full.length === 1) return {row: full[0], movedTo: full[0] !== r0 ? full[0] : undefined};
  if (full.length > 1) return {status: 'ambiguous', rows: full, message: 'Có ' + full.length + ' dòng trùng Số ký hiệu + Trích yếu + Nội dung nhiệm vụ (dòng ' + full.join(', ') + ').'};
  // Không dòng nào khớp đủ: có thể người khác đã sửa "Nội dung nhiệm vụ" trên Sheet
  if (coTaiDong && khopChinh_(bang, r0, key)) return {row: r0};
  if (chinh.length === 1) return {row: chinh[0], movedTo: chinh[0] !== r0 ? chinh[0] : undefined};
  if (chinh.length > 1) return {status: 'ambiguous', rows: chinh, message: 'Có ' + chinh.length + ' dòng cùng Số ký hiệu + Trích yếu (dòng ' + chinh.join(', ') + ').'};
  return {status: 'not_found', message: 'Không tìm thấy dòng có Số ký hiệu + Trích yếu tương ứng (có thể đã bị xoá hoặc sửa trên Sheet).'};
}

// ------------------------------ Các action ------------------------------
function actionPing_(bang) {
  var n = 0;
  for (var r = bang.headerRow + 1; r <= bang.values.length; r++) if (dongCoDuLieu_(bang, r)) n++;
  return {ok: true, version: SCRIPT_VERSION, sheetName: bang.sheet.getName(), sheetId: bang.sheet.getSheetId(),
          headerRow: bang.headerRow, dataRows: n, headersFound: bang.headersFound, missingHeaders: bang.missingHeaders};
}

function actionUpdate_(bang, items) {
  var results = (items || []).map(function (it) {
    var out = {sync_row: it.sync_row, id: it.id, status: 'ok', written: [], conflicts: []};
    try {
      var vt = timDong_(bang, it.sync_row, it.key);
      if (!vt.row) { out.status = vt.status; out.message = vt.message; if (vt.rows) out.rows = vt.rows; return out; }
      out.row = vt.row;
      if (vt.movedTo) out.movedTo = vt.movedTo;
      var fields = it.fields || {}, base = it.base || {};
      Object.keys(fields).forEach(function (f) {
        if (TRUONG_GHI.indexOf(f) < 0) return;
        if (!bang.map[f]) { out.conflicts.push({field: f, sheetValue: null, yourValue: fields[f], reason: 'missing_column'}); return; }
        var hienTai = chuanHoa_(giaTri_(bang, vt.row, f));
        var moi = chuanHoa_(fields[f]);
        var goc = chuanHoa_(base[f]);
        if (hienTai === moi) { out.written.push(f); return; }             // đã giống — không cần ghi
        if (hienTai === goc) { ghiO_(bang, vt.row, f, fields[f] == null ? '' : fields[f]); out.written.push(f); return; }
        out.conflicts.push({field: f, sheetValue: giaTri_(bang, vt.row, f), yourValue: fields[f]});
      });
      if (out.conflicts.length) out.status = 'partial';
    } catch (err) {
      out.status = 'error'; out.message = String(err && err.message || err);
    }
    return out;
  });
  return {ok: true, version: SCRIPT_VERSION, sheetName: bang.sheet.getName(), results: results};
}

// Xoá hẳn dòng nhiệm vụ để không để khoảng trống trước dòng do lịch tự động thêm.
// Chỉ xoá khi toàn bộ trường dữ liệu vẫn khớp bản dashboard đã đọc lần cuối.
function actionDelete_(bang, items) {
  var results = (items || []).map(function (it) {
    var out = {id: it.id, status: 'ok'};
    try {
      var vt = timDong_(bang, it.sync_row, it.key);
      if (!vt.row) {
        out.status = vt.status; out.message = vt.message; return out;
      }
      var base = it.base || {};
      var changed = TRUONG_GHI.filter(function (f) {
        return bang.map[f] && chuanHoa_(giaTri_(bang, vt.row, f)) !== chuanHoa_(base[f]);
      });
      if (changed.length) {
        out.status = 'conflict'; out.message = 'Dòng đã thay đổi trên Sheet (' + changed.join(', ') + '); chưa xoá.'; return out;
      }
      bang.sheet.deleteRow(vt.row);
      bang.values.splice(vt.row - 1, 1);
      bang.lastDataRow = dongCuoiCoDuLieu_(bang);
      out.row = vt.row;
    } catch (err) { out.status = 'error'; out.message = String(err && err.message || err); }
    return out;
  });
  return {ok: true, version: SCRIPT_VERSION, sheetName: bang.sheet.getName(), results: results};
}

function actionAppend_(bang, items) {
  var sheet = bang.sheet;
  var results = (items || []).map(function (it) {
    var out = {id: it.id, status: 'ok'};
    try {
      var f = it.fields || {};
      if (!chuanHoa_(f.nhiem_vu)) { out.status = 'error'; out.message = 'Thiếu Nội dung nhiệm vụ.'; return out; }
      // Chống trùng: đã có dòng cùng Số ký hiệu + Trích yếu + Nội dung nhiệm vụ + Hạn hoàn thành
      for (var r = bang.headerRow + 1; r <= bang.values.length; r++) {
        if (khoa_(giaTri_(bang, r, 'so_hieu_vb')) === khoa_(f.so_hieu_vb) &&
            khoa_(giaTri_(bang, r, 'noi_dung_vb')) === khoa_(f.noi_dung_vb) &&
            khoa_(giaTri_(bang, r, 'nhiem_vu')) === khoa_(f.nhiem_vu) &&
            khoa_(giaTri_(bang, r, 'han_iso')) === khoa_(f.han_iso)) {
          out.status = 'duplicate'; out.row = r; return out;
        }
      }
      var row = bang.lastDataRow + 1;
      TRUONG_GHI.forEach(function (k) {
        if (bang.map[k] && f[k] != null && String(f[k]) !== '') ghiO_(bang, row, k, f[k]);
      });
      // STT: nếu ô đã có công thức (mẫu điền sẵn =ROW()-1) thì giữ; dòng trên là công thức thì chép công thức;
      // còn lại điền STT lớn nhất + 1.
      var cSTT = bang.map.stt;
      if (cSTT) {
        var o = sheet.getRange(row, cSTT);
        if (!o.getFormula()) {
          var fTren = row - 1 > bang.headerRow ? sheet.getRange(row - 1, cSTT).getFormulaR1C1() : '';
          if (fTren) o.setFormulaR1C1(fTren);
          else {
            var max = 0;
            for (var r2 = bang.headerRow + 1; r2 < row; r2++) {
              var so = Number(String(giaTri_(bang, r2, 'stt')).replace(',', '.'));
              if (!isNaN(so) && so > max) max = so;
            }
            o.setValue(max + 1);
          }
        }
        bang.values[row - 1][cSTT - 1] = String(o.getDisplayValue());
      }
      bang.lastDataRow = row;
      out.row = row;
    } catch (err) {
      out.status = 'error'; out.message = String(err && err.message || err);
    }
    return out;
  });
  return {ok: true, version: SCRIPT_VERSION, sheetName: sheet.getName(), results: results};
}

// ------------------------------ Web App ------------------------------
function doGet(e) {
  return traJson_({ok: true, version: SCRIPT_VERSION});   // kiểm tra nhanh — không trả dữ liệu
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e && e.postData && e.postData.contents || '{}'); }
  catch (err) { return traJson_({ok: false, version: SCRIPT_VERSION, error: 'bad_request'}); }
  if (!CAU_HINH.MA_BI_MAT || CAU_HINH.MA_BI_MAT === 'DAN_MA_BI_MAT_CUA_BAN_VAO_DAY') {
    return traJson_({ok: false, version: SCRIPT_VERSION, error: 'secret_not_configured'});
  }
  if (String(req.secret || '') !== CAU_HINH.MA_BI_MAT) {
    return traJson_({ok: false, version: SCRIPT_VERSION, error: 'unauthorized'});
  }
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (err) { return traJson_({ok: false, version: SCRIPT_VERSION, error: 'busy', message: 'Sheet đang bận, thử lại sau.'}); }
  try {
    var action = req.action || 'ping';
    if (action === 'kh281Data') return traJson_(docChuyenDeKH281_());
    if (action === 'testReminder' || action === 'reminderPreview') {
      var kq = chayNhacHan_({previewOnly: action === 'reminderPreview', testTo: action === 'testReminder' ? String(req.email || '').trim() : ''});
      return traJson_(kq);
    }
    var bang = docBang_(laySheetDuLieu_(req.gid));
    var res;
    if (action === 'ping') res = actionPing_(bang);
    else if (action === 'update') res = actionUpdate_(bang, req.items);
    else if (action === 'append') res = actionAppend_(bang, req.items);
    else if (action === 'delete') res = actionDelete_(bang, req.items);
    else if (action === 'calendarSync') res = dongBoCalendar_(bang);
    else if (action === 'newDocumentStatus') res = trangThaiBaoVanBanMoi_(bang);
    else res = {ok: false, version: SCRIPT_VERSION, error: 'unknown_action'};
    if (['update', 'append', 'delete'].indexOf(action) >= 0 && PropertiesService.getScriptProperties().getProperty('CALENDAR_NHIEM_VU_ID')) {
      // Sheet đã ghi thành công dù Calendar gặp lỗi; lần quét định kỳ sẽ thử lại.
      try { res.calendar = dongBoCalendar_(docBang_(bang.sheet)); }
      catch (calendarError) { res.calendar = {ok: false, error: String(calendarError && calendarError.message || calendarError)}; }
    }
    SpreadsheetApp.flush();
    return traJson_(res);
  } catch (err) {
    return traJson_({ok: false, version: SCRIPT_VERSION, error: String(err && err.message || err)});
  } finally {
    lock.releaseLock();
  }
}

// =====================================================================================
//  GOOGLE CALENDAR — cột J có ngày hợp lệ → sự kiện cả ngày trong lịch riêng
// =====================================================================================
function layLichNhiemVu_(taoMoi) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CALENDAR_NHIEM_VU_ID');
  var lich = id ? CalendarApp.getCalendarById(id) : null;
  if (id && !lich) throw new Error('Không tìm thấy lịch nhiệm vụ đã cấu hình. Kiểm tra quyền truy cập hoặc chạy lại caiDatDongBoCalendar.');
  if (!lich && taoMoi) {
    lich = CalendarApp.createCalendar(CAU_HINH.TEN_LICH_NHIEM_VU, {timeZone: CAU_HINH.MUI_GIO,
      description: 'Hạn hoàn thành nhiệm vụ được đồng bộ từ Google Sheet.'});
    props.setProperty('CALENDAR_NHIEM_VU_ID', lich.getId());
  }
  return lich;
}

function layCotMaCalendar_(bang) {
  var sheet = bang.sheet, headings = sheet.getRange(bang.headerRow, 1, 1, Math.max(1, sheet.getLastColumn())).getDisplayValues()[0];
  var col = headings.findIndex(function (v) { return v === CAU_HINH.TEN_COT_MA_LICH; }) + 1;
  if (!col) {
    col = sheet.getLastColumn() + 1;
    if (col > sheet.getMaxColumns()) sheet.insertColumnAfter(sheet.getMaxColumns());
    sheet.getRange(bang.headerRow, col).setValue(CAU_HINH.TEN_COT_MA_LICH);
  }
  if (!sheet.isColumnHiddenByUser(col)) sheet.hideColumns(col);
  return col;
}

function layBangCalendar_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), ten = CAU_HINH.TEN_SHEET_LICH;
  var sheet = ss.getSheetByName(ten);
  if (!sheet) {
    sheet = ss.insertSheet(ten);
    sheet.getRange(1, 1, 1, 4).setValues([['Mã nhiệm vụ', 'ID sự kiện', 'ID lịch', 'Nội dung đã đồng bộ']]);
  }
  if (!sheet.isSheetHidden()) sheet.hideSheet();
  var n = sheet.getLastRow();
  var rows = n > 1 ? sheet.getRange(2, 1, n - 1, 4).getValues() : [];
  var map = {};
  rows.forEach(function (r, i) { if (r[0]) map[String(r[0])] = {row: i + 2, eventId: String(r[1] || ''), calendarId: String(r[2] || ''), signature: String(r[3] || '')}; });
  return {sheet: sheet, map: map};
}

function dongBoCalendar_(bang) {
  var lich = layLichNhiemVu_(false);
  if (!lich) return {ok: false, version: SCRIPT_VERSION, error: 'calendar_not_configured',
    message: 'Chạy hàm caiDatDongBoCalendar trong Apps Script một lần để tạo lịch và cấp quyền.'};
  bang = bang || docBang_(laySheetDuLieu_(null));
  var cot = layCotMaCalendar_(bang), soDong = Math.max(0, bang.sheet.getLastRow() - bang.headerRow);
  var ids = soDong ? bang.sheet.getRange(bang.headerRow + 1, cot, soDong, 1).getDisplayValues() : [];
  var reg = layBangCalendar_(), seen = {}, active = {}, made = 0, changed = 0, removed = 0, skipped = 0, errors = [];
  var today = Utilities.formatDate(new Date(), CAU_HINH.MUI_GIO, 'yyyy-MM-dd');
  for (var row = bang.headerRow + 1; row <= bang.values.length; row++) {
    if (!dongCoDuLieu_(bang, row)) continue;
    var id = String((ids[row - bang.headerRow - 1] || [])[0] || '').trim();
    if (id && seen[id]) id = ''; // bản sao dòng phải có danh tính riêng
    var rawDate = chuanHoa_(giaTri_(bang, row, 'han_iso'));
    var ms = parseNgay_(rawDate);
    if (rawDate && ms === null) { skipped++; continue; }
    if (!id && ms === null) continue;
    if (!id) {
      id = Utilities.getUuid();
      bang.sheet.getRange(row, cot).setValue(id);
    }
    seen[id] = true;
    if (ms === null) continue; // J trống: xóa sự kiện tương ứng ở lượt dọn registry bên dưới
    active[id] = true;
    var iso = Utilities.formatDate(new Date(ms), 'UTC', 'yyyy-MM-dd');
    var done = !!(chuanHoa_(giaTri_(bang, row, 'so_cv_hoan_thanh')) || chuanHoa_(giaTri_(bang, row, 'ngay_hoan_thanh_iso')));
    var title = (done ? '✓ ' : '') + 'Hạn: ' + (chuanHoa_(giaTri_(bang, row, 'nhiem_vu')) || chuanHoa_(giaTri_(bang, row, 'noi_dung_vb')) || 'Nhiệm vụ').slice(0, 180);
    var desc = ['Số ký hiệu: ' + chuanHoa_(giaTri_(bang, row, 'so_hieu_vb')),
      'Trích yếu: ' + chuanHoa_(giaTri_(bang, row, 'noi_dung_vb')),
      'Nội dung nhiệm vụ: ' + chuanHoa_(giaTri_(bang, row, 'nhiem_vu')),
      'Phòng chủ trì: ' + chuanHoa_(giaTri_(bang, row, 'cq_chu_tri')),
      'Người tham mưu: ' + chuanHoa_(giaTri_(bang, row, 'nguoi_phu_trach')),
      'Trạng thái: ' + (done ? 'Đã hoàn thành' : iso < today ? 'Quá hạn' : 'Chưa hoàn thành')].join('\n');
    var signature = JSON.stringify([iso, title, desc]);
    try {
      var old = reg.map[id], event = old && old.eventId && old.calendarId === lich.getId() ? lich.getEventById(old.eventId) : null;
      var date = new Date(ms + 12 * 3600000); // giữa ngày, tránh lệch ngày khi múi giờ máy chủ khác
      if (!event) {
        event = lich.createAllDayEvent(title, date, {description: desc});
        if (old) reg.sheet.getRange(old.row, 1, 1, 4).setValues([[id, event.getId(), lich.getId(), signature]]);
        else {
          var rNew = reg.sheet.getLastRow() + 1;
          reg.sheet.getRange(rNew, 1, 1, 4).setValues([[id, event.getId(), lich.getId(), signature]]);
          reg.map[id] = {row: rNew, eventId: event.getId(), calendarId: lich.getId(), signature: signature};
        }
        made++;
      } else if (old.signature !== signature) {
        if (Utilities.formatDate(event.getAllDayStartDate(), CAU_HINH.MUI_GIO, 'yyyy-MM-dd') !== iso) event.setAllDayDate(date);
        if (event.getTitle() !== title) event.setTitle(title);
        if (event.getDescription() !== desc) event.setDescription(desc);
        reg.sheet.getRange(old.row, 4).setValue(signature);
        changed++;
      }
    } catch (err) { errors.push('Dòng ' + row + ': ' + String(err && err.message || err)); }
  }
  // Chỉ xóa sự kiện do chính chức năng này tạo, khi dòng bị xóa hoặc J đã bỏ hạn.
  Object.keys(reg.map).map(function (id) { return {id: id, entry: reg.map[id]}; })
    .sort(function (a, b) { return b.entry.row - a.entry.row; }).forEach(function (item) {
      if (active[item.id]) return;
      try {
        var old = item.entry, calendar = old.calendarId === lich.getId() ? lich : CalendarApp.getCalendarById(old.calendarId);
        var event = calendar && old.eventId ? calendar.getEventById(old.eventId) : null;
        if (event) event.deleteEvent();
        reg.sheet.deleteRow(old.row);
        removed++;
      } catch (err) { errors.push('Sự kiện ' + item.id + ': ' + String(err && err.message || err)); }
    });
  return {ok: errors.length === 0, version: SCRIPT_VERSION, calendarName: lich.getName(),
    calendarId: lich.getId(), created: made, updated: changed, deleted: removed, invalidDates: skipped, errors: errors};
}

// Chạy từ trình soạn Apps Script một lần: tạo lịch riêng, cấp quyền và tự quét mỗi 15 phút.
function caiDatDongBoCalendar() {
  layLichNhiemVu_(true);
  var result = chayDongBoCalendar();
  if (!result.ok) throw new Error('Chưa đồng bộ hết: ' + result.errors.join('; '));
  huyDongBoCalendar();
  ScriptApp.newTrigger('chayDongBoCalendar').timeBased().everyMinutes(15).create();
  Logger.log('Đã tạo lịch "' + result.calendarName + '" và cài tự đồng bộ mỗi 15 phút. ' + JSON.stringify(result));
  return result;
}
function chayDongBoCalendar() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return dongBoCalendar_(docBang_(laySheetDuLieu_(null))); }
  finally { lock.releaseLock(); }
}
function huyDongBoCalendar() {
  var count = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'chayDongBoCalendar') { ScriptApp.deleteTrigger(t); count++; }
  });
  return count; // Giữ các sự kiện đã tạo; chỉ dừng đồng bộ tự động.
}

// =====================================================================================
//  EMAIL NHẮC HẠN
// =====================================================================================
function docCauHinhNhacHan_() {
  var cfg = JSON.parse(JSON.stringify(MAC_DINH_NHAC_HAN));
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CAU_HINH.TEN_SHEET_CAU_HINH);
  if (!sh || sh.getLastRow() < 2) return cfg;
  var rows = sh.getRange(1, 1, sh.getLastRow(), 2).getDisplayValues();
  var co = function (v, d) { var n = khongDau_(v); return n ? (n === 'co' || n === 'yes' || n === 'x' || n === 'true') : d; };
  rows.forEach(function (r) {
    var k = khongDau_(r[0]), v = String(r[1] == null ? '' : r[1]).trim();
    if (!k) return;
    if (k.indexOf('so ngay bao truoc') === 0) { var n = parseInt(v, 10); if (!isNaN(n) && n >= 0) cfg.soNgayBaoTruoc = n; }
    else if (k.indexOf('gui ca nhiem vu da qua han') === 0) cfg.guiQuaHan = co(v, cfg.guiQuaHan);
    else if (k.indexOf('gio gui') === 0) { var h = parseInt(v, 10); if (!isNaN(h) && h >= 0 && h <= 23) cfg.gioGui = h; }
    else if (k.indexOf('email lanh dao') === 0) cfg.emailLanhDao = v;
    else if (k === 'email nhan van ban moi') cfg.emailVanBanMoi = v;
    else if (k.indexOf('chi gui ngay lam viec') === 0) cfg.chiNgayLamViec = co(v, cfg.chiNgayLamViec);
    else if (k.indexOf('ten don vi') === 0) { if (v) cfg.tenDonVi = v; }
    else if (k.indexOf('duong link dashboard') === 0 || k.indexOf('link dashboard') === 0) cfg.linkDashboard = v;
  });
  return cfg;
}

function laEmailHopLe_(s) {
  s = String(s || '').trim();
  return /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(s) && !/^vidu/i.test(s);   // email "vidu…" là dòng ví dụ chưa thay
}
function chuanTen_(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

function docDanhBa_() {
  var out = {};
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CAU_HINH.TEN_SHEET_DANH_BA);
  if (!sh || sh.getLastRow() < 2) return out;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getDisplayValues();
  rows.forEach(function (r) {
    var ten = String(r[0] || '').replace(/\s+/g, ' ').trim();
    if (!ten) return;
    var nhan = khongDau_(r[2]);
    out[chuanTen_(ten)] = {ten: ten, email: String(r[1] || '').trim(), nhan: nhan !== 'khong' && nhan !== 'no'};
  });
  return out;
}

function parseNgay_(s) {
  var m = chuanHoa_(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  var d = +m[1], th = +m[2], y = +m[3];
  if (y < 1900 || y > 9999 || th < 1 || th > 12 || d < 1) return null;
  var utc = Date.UTC(y, th - 1, d), date = new Date(utc);
  return date.getUTCFullYear() === y && date.getUTCMonth() === th - 1 && date.getUTCDate() === d ? utc : null;
}

// Gom nhiệm vụ cần nhắc. Trả {homNay, cfg, nhom:{tenChuan:{ten,email,tasks}}, khongNhan:[], thieuEmail:[], chuaCoNguoi:[], tatCa:[]}
function gomNhiemVu_(cfg) {
  var tz = CAU_HINH.MUI_GIO, now = new Date();
  var homNayStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd').split('-');
  var homNay = Date.UTC(+homNayStr[0], +homNayStr[1] - 1, +homNayStr[2]);
  var bang = docBang_(laySheetDuLieu_(null));
  var danhBa = docDanhBa_();
  var nhom = {}, khongNhan = {}, thieuEmail = {}, chuaCoNguoi = [], tatCa = [];
  for (var r = bang.headerRow + 1; r <= bang.values.length; r++) {
    if (!dongCoDuLieu_(bang, r)) continue;
    if (chuanHoa_(giaTri_(bang, r, 'so_cv_hoan_thanh')) || chuanHoa_(giaTri_(bang, r, 'ngay_hoan_thanh_iso'))) continue;
    var han = parseNgay_(giaTri_(bang, r, 'han_iso'));
    if (han === null) continue;
    var conLai = Math.round((han - homNay) / 86400000);
    if (conLai > cfg.soNgayBaoTruoc) continue;
    if (conLai < 0 && !cfg.guiQuaHan) continue;
    var t = {row: r, soHieu: chuanHoa_(giaTri_(bang, r, 'so_hieu_vb')), trichYeu: chuanHoa_(giaTri_(bang, r, 'noi_dung_vb')),
             nhiemVu: chuanHoa_(giaTri_(bang, r, 'nhiem_vu')), chuTri: chuanHoa_(giaTri_(bang, r, 'cq_chu_tri')) || 'Chưa xác định',
             han: chuanHoa_(giaTri_(bang, r, 'han_iso')), conLai: conLai, nguoi: chuanHoa_(giaTri_(bang, r, 'nguoi_phu_trach'))};
    tatCa.push(t);
    var ten = t.nguoi.split(/[,;\n]+/).map(function (x) { return x.trim(); }).filter(String);
    if (!ten.length) { t.lyDo = 'Chưa có Người tham mưu'; chuaCoNguoi.push(t); continue; }
    var daCoNguoiNhan = false;
    ten.forEach(function (tn) {
      var k = chuanTen_(tn), lh = danhBa[k];
      if (lh && !lh.nhan) { (khongNhan[k] = khongNhan[k] || {ten: lh.ten, soNhiemVu: 0}).soNhiemVu++; daCoNguoiNhan = true; return; }
      if (!lh || !laEmailHopLe_(lh.email)) {
        (thieuEmail[k] = thieuEmail[k] || {ten: tn, soNhiemVu: 0, lyDo: lh ? 'Email chưa hợp lệ / còn là email ví dụ' : 'Chưa có trong Danh bạ'}).soNhiemVu++;
        return;
      }
      (nhom[k] = nhom[k] || {ten: lh.ten, email: lh.email, tasks: []}).tasks.push(t);
      daCoNguoiNhan = true;
    });
    if (!daCoNguoiNhan) { t.lyDo = 'Chưa có email: ' + ten.join(', '); chuaCoNguoi.push(t); }
  }
  var sx = function (a, b) { return a.conLai - b.conLai; };
  Object.keys(nhom).forEach(function (k) { nhom[k].tasks.sort(sx); });
  chuaCoNguoi.sort(sx); tatCa.sort(sx);
  return {homNay: Utilities.formatDate(now, tz, 'dd/MM/yyyy'), thu: Number(Utilities.formatDate(now, tz, 'u')),
          sheetName: bang.sheet.getName(), nhom: nhom,
          khongNhan: Object.keys(khongNhan).map(function (k) { return khongNhan[k]; }),
          thieuEmail: Object.keys(thieuEmail).map(function (k) { return thieuEmail[k]; }),
          chuaCoNguoi: chuaCoNguoi, tatCa: tatCa};
}

// ---- HTML email ----
function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; });
}
function catNgan_(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function tinhTrang_(conLai) {
  if (conLai < 0) return '<span style="display:inline-block;padding:2px 8px;border-radius:6px;background:#fae6e2;color:#a02b20;font-weight:600;white-space:nowrap">Quá hạn ' + (-conLai) + ' ngày</span>';
  if (conLai === 0) return '<span style="display:inline-block;padding:2px 8px;border-radius:6px;background:#f8ecd6;color:#7f520c;font-weight:600;white-space:nowrap">Hết hạn hôm nay</span>';
  return '<span style="display:inline-block;padding:2px 8px;border-radius:6px;background:#f8ecd6;color:#7f520c;font-weight:600;white-space:nowrap">Còn ' + conLai + ' ngày</span>';
}
function bangNhiemVuHtml_(tasks, coNguoi, anPhong) {
  var th = 'style="text-align:left;padding:8px 10px;border-bottom:2px solid #cfcbbd;font-size:12px;color:#5b665f;font-weight:600;background:#f7f6f1"';
  var td = 'style="padding:8px 10px;border-bottom:1px solid #e3e0d5;vertical-align:top;font-size:13px;color:#1c2521"';
  var h = '<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin:6px 0 14px">' +
    '<tr><th ' + th + '>Số ký hiệu</th><th ' + th + '>Trích yếu / Nội dung</th>' + (anPhong ? '' : '<th ' + th + '>Phòng chủ trì</th>') +
    (coNguoi ? '<th ' + th + '>Người tham mưu</th>' : '') + '<th ' + th + '>Hạn</th><th ' + th + '>Tình trạng</th></tr>';
  tasks.forEach(function (t) {
    h += '<tr><td ' + td + ' nowrap>' + esc_(t.soHieu || '—') + '</td><td ' + td + '>' + esc_(catNgan_(t.trichYeu || t.nhiemVu, 180)) +
      (t.trichYeu && t.nhiemVu ? '<div style="color:#5b665f;font-size:12px;margin-top:2px">' + esc_(catNgan_(t.nhiemVu, 160)) + '</div>' : '') +
      '</td>' + (anPhong ? '' : '<td ' + td + '>' + esc_(t.chuTri) + '</td>') + (coNguoi ? '<td ' + td + '>' + esc_(t.nguoi || '—') + '</td>' : '') +
      '<td ' + td + ' nowrap>' + esc_(t.han) + '</td><td ' + td + '>' + tinhTrang_(t.conLai) + '</td></tr>';
  });
  return h + '</table>';
}
function khungEmail_(cfg, tieuDe, noiDung) {
  var link = cfg.linkDashboard ? '<p style="margin:16px 0 0"><a href="' + esc_(cfg.linkDashboard) + '" style="display:inline-block;background:#1d6b50;color:#ffffff;text-decoration:none;padding:9px 16px;border-radius:8px;font-weight:600;font-size:13px">Mở dashboard theo dõi nhiệm vụ</a></p>' : '';
  return '<div style="font-family:Arial,Helvetica,sans-serif;background:#f3f2ec;padding:20px 12px">' +
    '<div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e3e0d5;border-radius:12px;overflow:hidden">' +
    '<div style="background:#0d3327;color:#ffffff;padding:16px 20px"><div style="font-size:12px;opacity:.8">' + esc_(cfg.tenDonVi) + '</div>' +
    '<div style="font-size:17px;font-weight:700;margin-top:2px">' + esc_(tieuDe) + '</div></div>' +
    '<div style="padding:16px 20px;color:#1c2521;font-size:14px;line-height:1.5">' + noiDung + link + '</div>' +
    '<div style="padding:10px 20px;border-top:1px solid #e3e0d5;background:#f7f6f1;color:#6b756e;font-size:11.5px">Email tự động từ Google Sheet theo dõi nhiệm vụ. ' +
    'Nhiệm vụ đã điền "Số văn bản hoàn thành" hoặc "Ngày hoàn thành" sẽ không được nhắc nữa.</div></div></div>';
}
function demQuaHan_(tasks) {
  var q = tasks.filter(function (t) { return t.conLai < 0; }).length;
  return {qua: q, sap: tasks.length - q};
}
function tieuDeNhac_(cfg, tasks, thu) {
  var d = demQuaHan_(tasks), parts = [];
  if (d.qua) parts.push(d.qua + ' nhiệm vụ quá hạn');
  if (d.sap) parts.push(d.sap + ' nhiệm vụ sắp đến hạn');
  if (!parts.length) parts.push('không có nhiệm vụ cần nhắc');
  return (thu ? '[THỬ] ' : '') + '[Nhắc hạn] ' + cfg.tenDonVi + ': ' + parts.join(', ');
}
function emailCaNhan_(cfg, g, homNay) {
  var d = demQuaHan_(g.tasks);
  var nd = '<p style="margin:0 0 10px">Kính gửi đồng chí <b>' + esc_(g.ten) + '</b>,</p>' +
    '<p style="margin:0 0 10px">Tính đến ngày ' + esc_(homNay) + ', đồng chí đang được giao tham mưu <b>' + g.tasks.length + '</b> nhiệm vụ chưa hoàn thành cần chú ý' +
    (d.qua ? ' — trong đó <b style="color:#a02b20">' + d.qua + ' nhiệm vụ đã quá hạn</b>' : '') + ':</p>' +
    bangNhiemVuHtml_(g.tasks, false) +
    '<p style="margin:0;color:#5b665f;font-size:13px">Khi hoàn thành, đề nghị cập nhật "Số văn bản hoàn thành" và "Ngày tháng năm hoàn thành" trên Google Sheet (hoặc dashboard).</p>';
  return khungEmail_(cfg, 'Nhắc hạn nhiệm vụ — ' + g.ten, nd);
}
function emailTongHop_(cfg, gom) {
  var d = demQuaHan_(gom.tatCa);
  var nd = '<p style="margin:0 0 10px">Tổng hợp ngày ' + esc_(gom.homNay) + ': <b>' + gom.tatCa.length + '</b> nhiệm vụ chưa hoàn thành đến hạn trong ' +
    cfg.soNgayBaoTruoc + ' ngày tới' + (cfg.guiQuaHan ? ' hoặc đã quá hạn' : '') + ' (quá hạn: <b style="color:#a02b20">' + d.qua + '</b>, sắp đến hạn: <b>' + d.sap + '</b>).</p>';
  var theoPhong = {};
  gom.tatCa.forEach(function (t) { (theoPhong[t.chuTri] = theoPhong[t.chuTri] || []).push(t); });
  Object.keys(theoPhong).sort(function (a, b) { return theoPhong[b].length - theoPhong[a].length; }).forEach(function (p) {
    nd += '<h3 style="font-size:14px;margin:14px 0 4px;color:#1d6b50">' + esc_(p) + ' — ' + theoPhong[p].length + ' nhiệm vụ</h3>' + bangNhiemVuHtml_(theoPhong[p], true, true);
  });
  if (gom.chuaCoNguoi.length) {
    nd += '<h3 style="font-size:14px;margin:18px 0 4px;color:#a02b20">Chưa có người nhận nhắc — ' + gom.chuaCoNguoi.length + ' nhiệm vụ</h3>' +
      '<p style="margin:0 0 4px;font-size:12.5px;color:#5b665f">Các nhiệm vụ chưa điền "Người tham mưu" hoặc người đó chưa có email trong sheet "Danh bạ".</p>' +
      bangNhiemVuHtml_(gom.chuaCoNguoi, true);
  }
  return khungEmail_(cfg, 'Tổng hợp nhắc hạn nhiệm vụ', nd);
}

function ghiNhatKy_(loai, soEmail, soNhiemVu, ghiChu) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(CAU_HINH.TEN_SHEET_NHAT_KY);
    if (!sh) {
      sh = ss.insertSheet(CAU_HINH.TEN_SHEET_NHAT_KY);
      sh.appendRow(['Thời gian', 'Loại', 'Số email đã gửi', 'Số nhiệm vụ', 'Ghi chú / Lỗi']);
      sh.hideSheet();
    }
    sh.appendRow([Utilities.formatDate(new Date(), CAU_HINH.MUI_GIO, 'dd/MM/yyyy HH:mm:ss'), loai, soEmail, soNhiemVu, ghiChu || '']);
  } catch (e) { /* không để lỗi ghi nhật ký làm hỏng việc gửi */ }
}

// opts: {previewOnly, testTo}
function chayNhacHan_(opts) {
  opts = opts || {};
  var cfg = docCauHinhNhacHan_();
  var gom = gomNhiemVu_(cfg);
  var cuoiTuan = cfg.chiNgayLamViec && gom.thu >= 6;
  var nguoiNhan = Object.keys(gom.nhom).map(function (k) {
    var g = gom.nhom[k], d = demQuaHan_(g.tasks);
    return {ten: g.ten, email: g.email, soNhiemVu: g.tasks.length, quaHan: d.qua, sapDenHan: d.sap};
  }).sort(function (a, b) { return b.soNhiemVu - a.soNhiemVu; });
  var tomTat = {ok: true, version: SCRIPT_VERSION, homNay: gom.homNay, sheetName: gom.sheetName, soNgayBaoTruoc: cfg.soNgayBaoTruoc,
    guiQuaHan: cfg.guiQuaHan, gioGui: cfg.gioGui, tenDonVi: cfg.tenDonVi, emailLanhDao: cfg.emailLanhDao,
    boQuaHomNay: cuoiTuan, tongNhiemVu: gom.tatCa.length, nguoiNhan: nguoiNhan, khongNhan: gom.khongNhan,
    thieuEmail: gom.thieuEmail, chuaCoNguoiNhan: gom.chuaCoNguoi.length, hanMucConLai: MailApp.getRemainingDailyQuota()};
  if (opts.previewOnly) return tomTat;

  var ten = 'Nhắc hạn nhiệm vụ — ' + cfg.tenDonVi;
  if (opts.testTo) {
    if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(opts.testTo)) return {ok: false, version: SCRIPT_VERSION, error: 'Địa chỉ email thử không hợp lệ.'};
    var allowed = String(PropertiesService.getScriptProperties().getProperty('TEST_EMAIL_ALLOWLIST') || '').split(/[,;\s]+/).map(function (s) { return s.toLowerCase(); }).filter(laEmailHopLe_);
    if (allowed.indexOf(opts.testTo.toLowerCase()) < 0) return {ok: false, version: SCRIPT_VERSION, error: 'Email gửi thử chưa có trong TEST_EMAIL_ALLOWLIST.'};
    if (MailApp.getRemainingDailyQuota() < 1) { ghiNhatKy_('Gửi thử', 0, gom.tatCa.length, 'Hết hạn mức gửi email hôm nay'); return {ok: false, version: SCRIPT_VERSION, error: 'Đã hết hạn mức gửi email hôm nay của tài khoản Google.'}; }
    MailApp.sendEmail({to: opts.testTo, subject: tieuDeNhac_(cfg, gom.tatCa, true), htmlBody: emailTongHop_(cfg, gom), name: ten});
    ghiNhatKy_('Gửi thử', 1, gom.tatCa.length, 'Gửi tới ' + opts.testTo);
    tomTat.daGui = 1; tomTat.guiThuToi = opts.testTo;
    return tomTat;
  }
  if (cuoiTuan) { ghiNhatKy_('Tự động', 0, gom.tatCa.length, 'Bỏ qua: cấu hình chỉ gửi ngày làm việc (T2–T6)'); tomTat.daGui = 0; return tomTat; }
  if (!gom.tatCa.length) { ghiNhatKy_('Tự động', 0, 0, 'Không có nhiệm vụ cần nhắc'); tomTat.daGui = 0; return tomTat; }

  var daGui = 0, loi = [];
  var keys = Object.keys(gom.nhom);
  for (var i = 0; i < keys.length; i++) {
    var g = gom.nhom[keys[i]];
    if (MailApp.getRemainingDailyQuota() < 1) { loi.push('Hết hạn mức gửi email — còn ' + (keys.length - i) + ' người chưa gửi'); break; }
    try {
      MailApp.sendEmail({to: g.email, subject: tieuDeNhac_(cfg, g.tasks, false), htmlBody: emailCaNhan_(cfg, g, gom.homNay), name: ten});
      daGui++;
    } catch (e) { loi.push(g.email + ': ' + (e && e.message || e)); }
  }
  var lanhDao = String(cfg.emailLanhDao || '').split(/[,;\s]+/).filter(laEmailHopLe_);
  if (lanhDao.length && !/Hết hạn mức/.test(loi.join(''))) {
    if (MailApp.getRemainingDailyQuota() < lanhDao.length) loi.push('Hết hạn mức gửi email — chưa gửi bản tổng hợp cho lãnh đạo');
    else {
      try {
        MailApp.sendEmail({to: lanhDao.join(','), subject: tieuDeNhac_(cfg, gom.tatCa, false) + ' (tổng hợp)', htmlBody: emailTongHop_(cfg, gom), name: ten});
        daGui++;
      } catch (e2) { loi.push('Tổng hợp: ' + (e2 && e2.message || e2)); }
    }
  }
  ghiNhatKy_('Tự động', daGui, gom.tatCa.length, loi.join(' | ') || ('Chưa có người nhận: ' + gom.chuaCoNguoi.length + ' nhiệm vụ'));
  tomTat.daGui = daGui; tomTat.loi = loi;
  return tomTat;
}

// Hàm được trigger hằng ngày gọi (tham số e của trigger được bỏ qua)
function guiNhacHan(e) {
  return chayNhacHan_({});
}

// Tạo 2 sheet cấu hình nếu chưa có (không ghi đè dữ liệu đã có)
function taoSheetNhacHanNeuThieu_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(CAU_HINH.TEN_SHEET_DANH_BA)) {
    var db = ss.insertSheet(CAU_HINH.TEN_SHEET_DANH_BA);
    db.appendRow(['Người tham mưu', 'Email', 'Nhận nhắc', 'Ghi chú']);
    db.appendRow(['Nguyễn Văn A', 'vidu1@example.com', 'Có', 'DÒNG VÍ DỤ — thay bằng họ tên + email thật']);
    db.setFrozenRows(1);
  }
  if (!ss.getSheetByName(CAU_HINH.TEN_SHEET_CAU_HINH)) {
    var ch = ss.insertSheet(CAU_HINH.TEN_SHEET_CAU_HINH);
    ch.appendRow(['Tham số', 'Giá trị', 'Giải thích']);
    ch.appendRow(['Số ngày báo trước', 3, 'Nhắc các nhiệm vụ có hạn trong N ngày tới']);
    ch.appendRow(['Gửi cả nhiệm vụ đã quá hạn', 'Có', 'Có / Không']);
    ch.appendRow(['Giờ gửi hằng ngày (0–23)', 7, 'Sửa xong phải chạy lại hàm caiDatNhacHan']);
    ch.appendRow(['Email lãnh đạo nhận bản tổng hợp', '', 'Để trống = không gửi; nhiều email cách nhau dấu phẩy']);
    ch.appendRow(['Chỉ gửi ngày làm việc (T2–T6)', 'Có', 'Có / Không']);
    ch.appendRow(['Tên đơn vị hiển thị trong email', MAC_DINH_NHAC_HAN.tenDonVi, '']);
    ch.appendRow(['Đường link dashboard', '', 'Tuỳ chọn — hiện nút "Mở dashboard" trong email']);
    ch.setFrozenRows(1);
  }
}

// CHẠY 1 LẦN từ trình soạn Apps Script để cấp quyền và đặt lịch gửi hằng ngày
function caiDatNhacHan() {
  taoSheetNhacHanNeuThieu_();
  huyNhacHan();
  var cfg = docCauHinhNhacHan_();
  ScriptApp.newTrigger('guiNhacHan').timeBased().atHour(cfg.gioGui).everyDays(1).inTimezone(CAU_HINH.MUI_GIO).create();
  var msg = 'Đã đặt lịch gửi email nhắc hạn lúc ' + cfg.gioGui + 'h hằng ngày (giờ Việt Nam).';
  ghiNhatKy_('Cài đặt', 0, 0, msg);
  Logger.log(msg);
  return msg;
}

function huyNhacHan() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'guiNhacHan') { ScriptApp.deleteTrigger(t); n++; }
  });
  return n;
}

// =====================================================================================
//  BÁO VĂN BẢN MỚI CÓ THỜI HẠN — quét độc lập để nhận cả dữ liệu nhập qua API / lịch tự động
// =====================================================================================
function laySoTheoDoiBaoMoi_(taoMoi) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CAU_HINH.TEN_SHEET_BAO_MOI), created = false;
  if (!sheet && taoMoi) {
    sheet = ss.insertSheet(CAU_HINH.TEN_SHEET_BAO_MOI);
    sheet.appendRow(['Mã dòng', 'Trạng thái', 'Phát hiện lúc', 'Gửi lúc']);
    sheet.hideSheet(); created = true;
  }
  if (!sheet) return null;
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getDisplayValues() : [];
  var map = {};
  rows.forEach(function (r, i) { if (r[0]) map[String(r[0])] = {row: i + 2, state: String(r[1])}; });
  return {sheet: sheet, map: map, created: created};
}

function layCotBaoMoi_(bang) {
  var sheet = bang.sheet, lastCol = sheet.getLastColumn();
  var headings = sheet.getRange(bang.headerRow, 1, 1, Math.max(lastCol, 1)).getDisplayValues()[0];
  var col = headings.indexOf(CAU_HINH.TEN_COT_MA_BAO_MOI) + 1;
  if (!col) {
    col = Math.max(15, lastCol) + 1; // Không chèn vào / dịch các cột A–O mà công cụ quét đang ghi.
    if (col > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), col - sheet.getMaxColumns());
    sheet.getRange(bang.headerRow, col).setValue(CAU_HINH.TEN_COT_MA_BAO_MOI);
  }
  sheet.hideColumns(col);
  return col;
}

function thuThapDongBaoMoi_(bang, reg, baseline) {
  var col = layCotBaoMoi_(bang), n = Math.max(0, bang.values.length - bang.headerRow);
  var ids = n ? bang.sheet.getRange(bang.headerRow + 1, col, n, 1).getDisplayValues() : [];
  var seen = {}, tasks = [], now = new Date();
  var nowText = Utilities.formatDate(now, CAU_HINH.MUI_GIO, 'dd/MM/yyyy HH:mm:ss');
  var today = parseNgay_(Utilities.formatDate(now, CAU_HINH.MUI_GIO, 'dd/MM/yyyy'));
  var prefix = String(bang.sheet.getSheetId()) + ':';
  for (var row = bang.headerRow + 1; row <= bang.values.length; row++) {
    if (!dongCoDuLieu_(bang, row)) continue; // Bỏ qua mẫu STT/công thức có sẵn nhưng chưa có nhiệm vụ.
    var id = String((ids[row - bang.headerRow - 1] || [])[0] || '').trim();
    if (!id || seen[id]) { // Dòng sao chép phải có danh tính riêng.
      id = Utilities.getUuid(); bang.sheet.getRange(row, col).setValue(id);
    }
    seen[id] = true;
    var key = prefix + id, entry = reg.map[key];
    if (!entry) {
      var rNew = reg.sheet.getLastRow() + 1;
      reg.sheet.getRange(rNew, 1, 1, 4).setValues([[key, baseline ? 'baseline' : 'pending', nowText, '']]);
      entry = reg.map[key] = {row: rNew, state: baseline ? 'baseline' : 'pending'};
    }
    if (baseline || entry.state !== 'pending') continue;
    if (chuanHoa_(giaTri_(bang, row, 'so_cv_hoan_thanh')) || chuanHoa_(giaTri_(bang, row, 'ngay_hoan_thanh_iso'))) {
      reg.sheet.getRange(entry.row, 2).setValue('completed'); entry.state = 'completed'; continue;
    }
    var han = parseNgay_(giaTri_(bang, row, 'han_iso'));
    var noiDung = chuanHoa_(giaTri_(bang, row, 'nhiem_vu'));
    var trichYeu = chuanHoa_(giaTri_(bang, row, 'noi_dung_vb'));
    if (han === null || (!noiDung && !trichYeu)) continue; // Đợi công cụ nhập đủ nội dung và ngày thực.
    tasks.push({id: key, registryRow: entry.row, row: row,
      soHieu: chuanHoa_(giaTri_(bang, row, 'so_hieu_vb')), trichYeu: trichYeu, nhiemVu: noiDung,
      coQuan: chuanHoa_(giaTri_(bang, row, 'cq_giao')), ngayBanHanh: chuanHoa_(giaTri_(bang, row, 'ngay_ban_hanh')),
      chuTri: chuanHoa_(giaTri_(bang, row, 'cq_chu_tri')), nguoi: chuanHoa_(giaTri_(bang, row, 'nguoi_phu_trach')),
      han: chuanHoa_(giaTri_(bang, row, 'han_iso')), conLai: Math.round((han - today) / 86400000)});
  }
  SpreadsheetApp.flush(); // Lưu danh tính trước khi gửi email.
  return tasks;
}

function docBangBaoVanBanMoi_() {
  var gid = PropertiesService.getScriptProperties().getProperty('NEW_DOCUMENT_SHEET_ID');
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var sheet = sheets.find(function (s) { return String(s.getSheetId()) === String(gid); });
  if (!sheet) throw new Error('Không tìm thấy sheet đã cài báo văn bản mới. Kiểm tra TEN_SHEET_DU_LIEU rồi chạy caiDatBaoVanBanMoi.');
  return docBang_(sheet);
}

function trangThaiBaoVanBanMoi_(bang) {
  var props = PropertiesService.getScriptProperties(), gid = props.getProperty('NEW_DOCUMENT_SHEET_ID');
  var cfg = docCauHinhNhacHan_();
  var sameSheet = gid === String(bang.sheet.getSheetId());
  return {ok: true, version: SCRIPT_VERSION, enabled: sameSheet && props.getProperty('NEW_DOCUMENT_ENABLED') === 'true',
    configured: sameSheet, email: cfg.emailVanBanMoi || '', intervalMinutes: 5,
    lastCheckedAt: props.getProperty('NEW_DOCUMENT_LAST_CHECK') || '', lastSentAt: props.getProperty('NEW_DOCUMENT_LAST_SENT') || '',
    lastError: props.getProperty('NEW_DOCUMENT_LAST_ERROR') || '',
    message: gid && !sameSheet ? 'Chức năng đang cài cho sheet khác; kiểm tra TEN_SHEET_DU_LIEU trong Apps Script.' : ''};
}

function emailVanBanMoi_(cfg, tasks) {
  var content = '<p>Google Sheet vừa nhận <b>' + tasks.length + ' nhiệm vụ mới có thời hạn</b>, chưa ghi nhận hoàn thành.</p>';
  tasks.forEach(function (t) {
    content += '<div style="border:1px solid #e3e0d5;border-radius:8px;padding:12px;margin-bottom:12px">' +
      '<b>' + esc_(t.soHieu || 'Văn bản chưa có số ký hiệu') + '</b>' +
      '<p style="margin:6px 0">' + esc_(t.trichYeu || t.nhiemVu) + '</p>' +
      (t.trichYeu && t.nhiemVu ? '<p style="margin:6px 0"><b>Nhiệm vụ:</b> ' + esc_(t.nhiemVu) + '</p>' : '') +
      '<div><b>Cơ quan ban hành:</b> ' + esc_(t.coQuan || 'Chưa điền') + '</div>' +
      '<div><b>Ngày ban hành:</b> ' + esc_(t.ngayBanHanh || 'Chưa điền') + '</div>' +
      '<div><b>Phòng chủ trì:</b> ' + esc_(t.chuTri || 'Chưa điền') + '</div>' +
      '<div><b>Người tham mưu:</b> ' + esc_(t.nguoi || 'Chưa điền') + '</div>' +
      '<div style="margin-top:8px"><b>Hạn hoàn thành: ' + esc_(t.han) + '</b> — ' + tinhTrang_(t.conLai) + '</div></div>';
  });
  content += '<p>Thông báo này gửi khi phát hiện nhiệm vụ mới. Email nhắc hạn hằng ngày và Google Calendar vẫn hoạt động theo cấu hình riêng.</p>';
  var safeCfg = Object.assign({}, cfg);
  if (!/^https?:\/\//i.test(safeCfg.linkDashboard || '')) safeCfg.linkDashboard = '';
  return khungEmail_(safeCfg, 'Văn bản mới có thời hạn', content);
}

// CHẠY MỘT LẦN để cấp quyền và lấy dữ liệu hiện có làm mốc; cài lại không gửi lại dữ liệu đã báo.
function caiDatBaoVanBanMoi() {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    taoSheetNhacHanNeuThieu_();
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CAU_HINH.TEN_SHEET_CAU_HINH);
    var rows = sh.getRange(1, 1, sh.getLastRow(), 2).getDisplayValues(), emailRow = 0;
    rows.forEach(function (r, i) { if (khongDau_(r[0]) === 'email nhan van ban moi') emailRow = i + 1; });
    if (!emailRow) {
      sh.appendRow(['Email nhận văn bản mới', '', 'Một email nhận thông báo nhiệm vụ mới có J hợp lệ, quét mỗi 5 phút, kể cả cuối tuần']);
      emailRow = sh.getLastRow();
    }
    var cfg = docCauHinhNhacHan_(), email = cfg.emailVanBanMoi;
    if (!email) email = String(Session.getEffectiveUser().getEmail() || '').trim();
    if (!laEmailHopLe_(email)) throw new Error('Điền một email hợp lệ vào dòng "Email nhận văn bản mới" trong sheet "Cấu hình nhắc hạn", rồi chạy lại caiDatBaoVanBanMoi.');
    MailApp.getRemainingDailyQuota(); // Yêu cầu cấp quyền gửi mail ngay trong bước cài đặt, không gửi thư.
    sh.getRange(emailRow, 2).setValue(email);
    var bang = docBang_(laySheetDuLieu_(null)), props = PropertiesService.getScriptProperties();
    var reg = laySoTheoDoiBaoMoi_(true), gid = String(bang.sheet.getSheetId());
    if (reg.created || props.getProperty('NEW_DOCUMENT_BASELINED_' + gid) !== 'true') {
      thuThapDongBaoMoi_(bang, reg, true);
      props.setProperty('NEW_DOCUMENT_BASELINED_' + gid, 'true');
    }
    huyBaoVanBanMoi();
    ScriptApp.newTrigger('chayBaoVanBanMoi').timeBased().everyMinutes(5).create();
    props.setProperty('NEW_DOCUMENT_SHEET_ID', gid);
    props.setProperty('NEW_DOCUMENT_ENABLED', 'true');
    props.deleteProperty('NEW_DOCUMENT_LAST_ERROR');
    var msg = 'Đã bật báo văn bản mới có thời hạn tới ' + email + ', quét mỗi 5 phút trên sheet "' + bang.sheet.getName() + '". Dữ liệu có sẵn không được gửi thư.';
    ghiNhatKy_('Cài báo văn bản mới', 0, 0, msg); Logger.log(msg);
    return {ok: true, version: SCRIPT_VERSION, email: email, intervalMinutes: 5, message: msg};
  } finally { lock.releaseLock(); }
}

function chayBaoVanBanMoi() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('NEW_DOCUMENT_ENABLED') !== 'true') return {ok: true, disabled: true, sent: 0};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return {ok: false, error: 'busy', sent: 0};
  var sent = 0, notified = 0;
  try {
    var bang = docBangBaoVanBanMoi_(), gid = String(bang.sheet.getSheetId());
    var reg = laySoTheoDoiBaoMoi_(false), cfg = docCauHinhNhacHan_();
    if (!reg || props.getProperty('NEW_DOCUMENT_BASELINED_' + gid) !== 'true') throw new Error('Thiếu mốc dữ liệu / sổ theo dõi. Chạy lại caiDatBaoVanBanMoi trước khi gửi.');
    if (!laEmailHopLe_(cfg.emailVanBanMoi)) throw new Error('Email nhận văn bản mới chưa hợp lệ trong Cấu hình nhắc hạn.');
    var tasks = thuThapDongBaoMoi_(bang, reg, false);
    for (var i = 0; i < tasks.length; i += 30) {
      if (MailApp.getRemainingDailyQuota() < 1) throw new Error('Hết hạn mức gửi email hôm nay; các nhiệm vụ chưa gửi được giữ để thử lại.');
      var batch = tasks.slice(i, i + 30);
      var subject = '[VĂN BẢN MỚI] ' + batch.length + ' nhiệm vụ có thời hạn — ' + cfg.tenDonVi;
      var body = batch.map(function (t) { return [t.soHieu, t.trichYeu, t.nhiemVu, 'Cơ quan ban hành: ' + t.coQuan,
        'Hạn hoàn thành: ' + t.han, 'Người tham mưu: ' + t.nguoi].filter(Boolean).join('\n'); }).join('\n\n');
      MailApp.sendEmail({to: cfg.emailVanBanMoi, subject: subject, body: body, htmlBody: emailVanBanMoi_(cfg, batch), name: 'Điều hành nhiệm vụ — ' + cfg.tenDonVi});
      sent++; notified += batch.length;
      var at = Utilities.formatDate(new Date(), CAU_HINH.MUI_GIO, 'dd/MM/yyyy HH:mm:ss');
      batch.forEach(function (t) { reg.sheet.getRange(t.registryRow, 2).setValue('sent'); reg.sheet.getRange(t.registryRow, 4).setValue(at); });
      SpreadsheetApp.flush();
      props.setProperty('NEW_DOCUMENT_LAST_SENT', at);
    }
    props.setProperty('NEW_DOCUMENT_LAST_CHECK', Utilities.formatDate(new Date(), CAU_HINH.MUI_GIO, 'dd/MM/yyyy HH:mm:ss'));
    props.deleteProperty('NEW_DOCUMENT_LAST_ERROR');
    if (sent) ghiNhatKy_('Báo văn bản mới', sent, notified, 'Đã báo nhiệm vụ mới có thời hạn tới ' + cfg.emailVanBanMoi);
    return {ok: true, version: SCRIPT_VERSION, sent: sent, notified: notified};
  } catch (err) {
    var msg = String(err && err.message || err);
    props.setProperty('NEW_DOCUMENT_LAST_ERROR', msg);
    ghiNhatKy_('Lỗi báo văn bản mới', sent, notified, msg);
    return {ok: false, version: SCRIPT_VERSION, sent: sent, notified: notified, error: msg};
  } finally { lock.releaseLock(); }
}

function huyBaoVanBanMoi() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'chayBaoVanBanMoi') { ScriptApp.deleteTrigger(t); n++; }
  });
  PropertiesService.getScriptProperties().setProperty('NEW_DOCUMENT_ENABLED', 'false');
  return n; // Giữ sổ đã gửi: bật lại không báo trùng các nhiệm vụ cũ.
}

// Đọc biểu chuyên đề riêng, sau kiểm tra mã bí mật tại doPost. Không công bố dữ liệu qua doGet.
function docChuyenDeKH281_() {
  if (!CAU_HINH.ID_SHEET_KH281) throw new Error('Chưa cấu hình ID_SHEET_KH281.');
  var ss = SpreadsheetApp.openById(CAU_HINH.ID_SHEET_KH281);
  function doc(name, width, firstHeader, maxRows) {
    var sh = ss.getSheetByName(name);
    if (!sh) throw new Error('Biểu KH 281 thiếu tab "' + name + '". Không đổi tên các tab mẫu.');
    var last = sh.getLastRow();
    if (last < 1) throw new Error('Tab "' + name + '" chưa có tiêu đề.');
    var range = sh.getRange(1, 1, Math.min(last, maxRows), width);
    var values = range.getDisplayValues();
    // Ngày thực có thể đang hiển thị M/d/yyyy trong bảng Google. Dùng giá trị Date gốc,
    // chuẩn hóa theo múi giờ dự án để không đảo ngày/tháng hoặc mất ngày trên dashboard.
    var dateColumns = name === 'Cap nhat' ? [10, 18, 20] : name === 'Ky bao cao' ? [2, 4] : [];
    if (dateColumns.length) {
      var raw = range.getValues();
      for (var i = 1; i < raw.length; i++) dateColumns.forEach(function (col) {
        if (raw[i][col] instanceof Date && !isNaN(raw[i][col].getTime())) {
          values[i][col] = Utilities.formatDate(raw[i][col], CAU_HINH.MUI_GIO, 'yyyy-MM-dd');
        }
      });
    }
    if (String(values[0][0]).trim() !== firstHeader) throw new Error('Tiêu đề tab "' + name + '" đã thay đổi; cần khôi phục cấu trúc biểu mẫu.');
    return {values: values, truncated: last > maxRows};
  }
  var tasks = doc('Nhiem vu', 10, 'Mã nhiệm vụ', 1000);
  var reports = doc('Cap nhat', 24, 'Mã nhiệm vụ', 1000);
  var periods = doc('Ky bao cao', 6, 'Kỳ báo cáo', 1000);
  return {ok: true, version: SCRIPT_VERSION, spreadsheetUrl: ss.getUrl(), tasks: tasks.values,
    reports: reports.values, periods: periods.values, truncated: tasks.truncated || reports.truncated || periods.truncated,
    fetchedAt: Utilities.formatDate(new Date(), CAU_HINH.MUI_GIO, 'dd/MM/yyyy HH:mm:ss')};
}
