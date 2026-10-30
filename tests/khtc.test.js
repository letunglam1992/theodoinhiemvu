const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const gs = fs.readFileSync(path.join(__dirname, '../gas-backend/Code.gs'), 'utf8');

// ---- Hàm thuần trên dashboard ----
const coreSrc = html.match(/<script id="khtc-core">([\s\S]*?)<\/script>/)[1];
const core = vm.runInNewContext(coreSrc + ';KHTC', {});
const members = core.DEFAULT_CONFIG.members;

// ---- Sheet giả lập cho Apps Script ----
class Sheet {
  constructor(name, id, data = []) { this.name = name; this.id = id; this.data = data.map(r => r.slice()); this.maxColumns = 20; this.maxRows = 1000; this.hidden = false; this.validations = []; this.formulas = {}; }
  getName() { return this.name; } getSheetId() { return this.id; }
  getLastRow() { let n = this.data.length; while (n && !this.data[n - 1].some(x => x !== '' && x != null)) n--; return n; }
  getLastColumn() { return Math.max(1, ...this.data.map(r => { let n = r.length; while (n && (r[n - 1] === '' || r[n - 1] == null)) n--; return n; })); }
  getMaxColumns() { return this.maxColumns; } getMaxRows() { return this.maxRows; }
  insertColumnAfter(col) { this.data.forEach(r => { if (r.length > col) r.splice(col, 0, ''); }); this.maxColumns++; }
  insertColumnsAfter(_, n) { this.maxColumns += n; }
  insertRowsAfter(_, n) { this.maxRows += n; }
  hideColumns() {} hideSheet() { this.hidden = true; } isSheetHidden() { return this.hidden; } setFrozenRows() {}
  getRange(row, col, height = 1, width = 1) {
    const sh = this;
    if (typeof row === 'string') return {a1: row};
    return {
      getDisplayValues() { return Array.from({length: height}, (_, i) => Array.from({length: width}, (_, j) => String(sh.data[row + i - 1]?.[col + j - 1] ?? ''))); },
      setValues(values) { for (let i = 0; i < height; i++) for (let j = 0; j < width; j++) { sh.data[row + i - 1] ??= []; sh.data[row + i - 1][col + j - 1] = values[i][j]; } return this; },
      setValue(v) { sh.data[row - 1] ??= []; sh.data[row - 1][col - 1] = v; return this; },
      setFormula(f) { sh.formulas[row + ',' + col] = f; return this; },
      getDisplayValue() { const f = sh.formulas[row + ',' + col] || ''; return sh.chamPhay && /,/.test(f.replace(/"[^"]*"|'[^']*'/g, '')) ? '#ERROR!' : ''; },
      getSheet() { return sh; }, getA1Notation() { return 'R' + row + 'C' + col; },
      setNumberFormat() { return this; },
      setDataValidation(rule) { sh.validations.push({row, col, height, rule}); return this; }
    };
  }
}
const HEADERS = ['STT', 'Số ký hiệu', 'Trích yếu', 'Loại văn bản', 'Cơ quan ban hành', 'Ngày tháng năm ban hành', 'Nội dung nhiệm vụ', 'Phòng, đơn vị chủ trì', 'Phòng, đơn vị phối hợp', 'Hạn hoàn thành', 'Số văn bản hoàn thành', 'Ngày tháng năm hoàn thành', 'Người tham mưu', 'Lý do chậm', 'Ghi chú'];
const row = (nv, extra = {}) => Object.assign(['1', '12/UBND', 'Trích yếu ' + nv, 'Công văn', 'UBND tỉnh', '01/10/2026', nv, 'Phòng Kế hoạch - Tài chính', '', '20/11/2026', '', '', 'Lê Tùng Lâm', '', 'iOffice-den:1'], extra);
function backend(data, chamPhay = false) {
  const sheet = new Sheet('Danh sach nhiem vu', 123, data);
  const sheets = [sheet]; let counter = 10;
  const ss = {getSheets: () => sheets, getSheetByName: n => sheets.find(s => s.name === n), insertSheet: n => { const s = new Sheet(n, ++counter); s.chamPhay = chamPhay; sheets.push(s); return s; }};
  const builder = () => { const b = {rule: {}}; b.requireValueInList = (v) => { b.rule.list = v; return b; }; b.requireValueInRange = (r) => { b.rule.range = r; return b; }; b.setAllowInvalid = () => b; b.setHelpText = () => b; b.build = () => b.rule; return b; };
  const ctx = {console, Date, Map, Object, JSON, String, Number, Math, Array, Error, Intl,
    SpreadsheetApp: {getActiveSpreadsheet: () => ss, flush() {}, newDataValidation: builder},
    Utilities: {formatDate: () => '30/10/2026 08:00:00'}, Logger: {log() {}}};
  vm.createContext(ctx); vm.runInContext(gs, ctx);
  return {ctx, sheet, ss};
}

let count = 0;
function test(name, run) { try { run(); count++; console.log('PASS', name); } catch (e) { console.error('FAIL', name, e); process.exitCode = 1; } }

test('blank or unknown role falls back to personal assignment', () => {
  assert.equal(core.vaiTroPhong({}), 'Cá nhân tham mưu');
  assert.equal(core.vaiTroPhong({vai_tro_phong: ' phòng chủ trì '}), 'Phòng chủ trì');
});
test('member resolution matches short name, full name and alias without accent loss', () => {
  const m = members.map(x => x.ten === 'Kiên' ? {...x, hoTen: 'Nguyễn Văn Kiên'} : x);
  assert.equal(core.resolveMember('Kiên', m), 'Kiên');
  assert.equal(core.resolveMember('nguyễn văn  kiên', m), 'Kiên');
  assert.equal(core.resolveMember('Tùng Lâm', m), 'Lâm');
  assert.equal(core.resolveMember('Lê Tùng Lâm', m), 'Lâm');
  assert.equal(core.resolveMember('Hoà', m), 'Hòa');
  assert.equal(core.resolveMember('', m), 'Chưa phân công');
  assert.equal(core.resolveMember('Chưa phân công', m), 'Chưa phân công');
  assert.equal(core.resolveMember('Nguyễn Văn B', m), 'Khác');
  assert.equal(core.resolveMember('Kien', m), 'Khác', 'không tự bỏ dấu để tránh nhầm tên');
});
test('"mine" scope keeps personal tasks and department tasks assigned to me only', () => {
  const cfg = core.DEFAULT_CONFIG;
  assert.equal(core.isMine({nguoi_phu_trach: 'Lê Tùng Lâm'}, cfg), true);
  assert.equal(core.isMine({vai_tro_phong: 'Phòng chủ trì', nguoi_phu_trach: 'Lê Tùng Lâm'}, cfg), true);
  assert.equal(core.isMine({vai_tro_phong: 'Phòng chủ trì', nguoi_phu_trach: 'Kiên'}, cfg), false);
  assert.equal(core.isMine({vai_tro_phong: 'Phòng tham mưu', nguoi_phu_trach: ''}, cfg), false);
});
test('member statistics bucket overdue, upcoming, in progress and completion rate', () => {
  const today = '2026-10-30';
  const tasks = [
    {nguoi_phu_trach: 'Kiên', status: 'qua_han_chua_xong', han_iso: '2026-10-20'},
    {nguoi_phu_trach: 'Kiên', status: 'dang_thuc_hien', han_iso: '2026-11-02'},
    {nguoi_phu_trach: 'Kiên', status: 'dang_thuc_hien', han_iso: '2026-11-03'},
    {nguoi_phu_trach: 'Kiên', status: 'dang_thuc_hien', han_iso: '2026-11-20'},
    {nguoi_phu_trach: 'Kiên', status: 'dung_han'},
    {nguoi_phu_trach: 'Kiên', status: 'hoan_thanh_qua_han'},
    {nguoi_phu_trach: '', status: 'khong_yeu_cau_han'},
    {nguoi_phu_trach: 'Người ngoài', status: 'dang_thuc_hien'}
  ];
  const rows = core.memberStats(tasks, members, today);
  const kien = rows.find(r => r.ten === 'Kiên');
  assert.deepEqual([kien.total, kien.overdue, kien.upcoming, kien.progress, kien.ontime, kien.late, kien.rate], [6, 1, 1, 2, 1, 1, 50]);
  assert.equal(rows.find(r => r.ten === 'Chưa phân công').total, 1);
  assert.equal(rows.find(r => r.ten === 'Khác').total, 1);
  assert.equal(rows.find(r => r.ten === 'Thư').total, 0, 'thành viên chưa có việc vẫn hiện');
  assert.equal(core.memberStats([], members, today).some(r => r.ten === 'Khác'), false);
});
test('member list text round-trips and invalid stored config falls back to defaults', () => {
  const parsed = core.parseMembers('Lâm | Lê Tùng Lâm | Tùng Lâm\nKiên | Nguyễn Văn Kiên\n\n | bỏ dòng thiếu tên');
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), [{ten: 'Lâm', hoTen: 'Lê Tùng Lâm', biDanh: ['Tùng Lâm']}, {ten: 'Kiên', hoTen: 'Nguyễn Văn Kiên', biDanh: []}]);
  assert.deepEqual(JSON.parse(JSON.stringify(core.parseMembers(core.formatMembers(parsed)))), JSON.parse(JSON.stringify(parsed)));
  assert.equal(core.sanitizeConfig(null).members.length, 8);
  assert.equal(core.sanitizeConfig({members: parsed, me: 'Không có'}).me, 'Lâm');
});
test('dashboard plumbs role field through sync, import, modal and KHTC page', () => {
  assert.match(html, /const SYNC_FIELDS = \[[^\]]*'vai_tro_phong'\]/);
  assert.match(html, /key:'vai_tro_phong', label:'Vai trò phòng'/);
  assert.match(html, /id="m-vaitro"/);
  assert.match(html, /data-ab-page="khtc"/);
  assert.match(html, /data-scope="mine"/);
  assert.doesNotMatch(html, /(?<![A-Z_])TASKS\.find\(/, 'tra cứu theo mã phải dùng ALL_TASKS để mở được việc ngoài phạm vi');
});

test('Apps Script: missing optional column is not mapped by position and not reported missing', () => {
  const b = backend([[...HEADERS, 'Mã đồng bộ Calendar'], [...row('A'), 'cal-1']]);
  const bang = b.ctx.docBang_(b.sheet);
  assert.equal(bang.map.vai_tro_phong, undefined);
  assert.equal(bang.missingHeaders.length, 0);
  const res = b.ctx.actionUpdate_(bang, [{sync_row: 2, key: {so_hieu_vb: '12/UBND', noi_dung_vb: 'Trích yếu A', nhiem_vu: 'A'}, fields: {vai_tro_phong: 'Phòng chủ trì'}, base: {}}]);
  assert.equal(res.results[0].status, 'ok');
  assert.equal(b.sheet.data[1][15], 'cal-1', 'không ghi đè cột ẩn Calendar');
});
test('Apps Script: setup inserts role column after notes, shifts hidden columns and is idempotent', () => {
  const b = backend([[...HEADERS, 'Mã đồng bộ Calendar'], [...row('A'), 'cal-1']]);
  let r = b.ctx.caiDatTheoDoiKHTC();
  assert.equal(r.themCotVaiTro, true); assert.equal(r.cotVaiTro, 'P'); assert.equal(r.taoCauHinh, true); assert.equal(r.taoTheoDoi, true);
  assert.equal(b.sheet.data[0][15], 'Vai trò phòng'); assert.equal(b.sheet.data[0][16], 'Mã đồng bộ Calendar'); assert.equal(b.sheet.data[1][16], 'cal-1');
  assert.deepEqual([...b.sheet.validations[0].rule.list], ['Cá nhân tham mưu', 'Phòng chủ trì', 'Phòng tham mưu', 'Phòng phối hợp']);
  const cfg = b.ss.getSheetByName('Cau hinh quet KHTC');
  assert.equal(cfg.data[3][0], 'KHTC chủ trì'); assert.equal(cfg.data[3][4], 'Lâm'); assert.equal(cfg.data[3][5], 'Lê Tùng Lâm');
  assert.equal(cfg.data.slice(3).filter(x => x[4]).length, 8);
  const tinh = b.ss.getSheetByName('KHTC tinh toan');
  assert.equal(tinh.hidden, true);
  const f = tinh.formulas['2,1'];
  assert.match(f, /'Danh sach nhiem vu'!P2:P/); assert.match(f, /'Danh sach nhiem vu'!M2:M/); assert.match(f, /'Danh sach nhiem vu'!J2:J/);
  assert.equal((f.match(/\(/g) || []).length, (f.match(/\)/g) || []).length, 'công thức cân ngoặc');
  cfg.data[3][5] = 'Đã sửa tay';
  r = b.ctx.caiDatTheoDoiKHTC();
  assert.equal(r.themCotVaiTro, false); assert.equal(r.taoCauHinh, false); assert.equal(r.taoTheoDoi, false);
  assert.equal(b.sheet.data[0].filter(x => x === 'Vai trò phòng').length, 1);
  assert.equal(cfg.data[3][5], 'Đã sửa tay', 'không ghi đè cấu hình người dùng');
  const bang = b.ctx.docBang_(b.sheet);
  b.ctx.actionUpdate_(bang, [{sync_row: 2, key: {so_hieu_vb: '12/UBND', noi_dung_vb: 'Trích yếu A', nhiem_vu: 'A'}, fields: {vai_tro_phong: 'Phòng chủ trì'}, base: {vai_tro_phong: ''}}]);
  assert.equal(b.sheet.data[1][15], 'Phòng chủ trì');
});
test('Apps Script: summary formulas balance parentheses and refer to the helper tab', () => {
  const b = backend([HEADERS, row('A')]);
  b.ctx.caiDatTheoDoiKHTC();
  const view = b.ss.getSheetByName('Theo doi phong KHTC');
  const fs = Object.values(view.formulas);
  assert.ok(fs.length >= 9);
  fs.forEach(f => assert.equal((f.match(/\(/g) || []).length, (f.match(/\)/g) || []).length, f));
  assert.match(view.formulas['4,3'], /'KHTC tinh toan'!\$M\$2:\$M,"Đang thực hiện"/);
});
test('Apps Script: Vietnamese-locale sheet gets semicolon formulas, strings and tab names untouched', () => {
  const b = backend([HEADERS, row('A')], true);
  const r = b.ctx.caiDatTheoDoiKHTC();
  assert.equal(r.cuPhapCongThuc, 'dấu chấm phẩy');
  const f = b.ss.getSheetByName('KHTC tinh toan').formulas['2,1'];
  assert.doesNotMatch(f.replace(/"[^"]*"|'[^']*'/g, ''), /,/);
  assert.match(f, /"\^\\d\{1,2\}\/\\d\{1,2\}/, 'giữ dấu phẩy trong biểu thức chính quy');
  Object.values(b.ss.getSheetByName('Theo doi phong KHTC').formulas).forEach(x => assert.doesNotMatch(x.replace(/"[^"]*"|'[^']*'/g, ''), /,/));
});
test('Apps Script: LET/LAMBDA names cannot be mistaken for cell references', () => {
  const b = backend([HEADERS, row('A')]);
  b.ctx.caiDatTheoDoiKHTC();
  const all = [b.ss.getSheetByName('KHTC tinh toan').formulas['2,1'], ...Object.values(b.ss.getSheetByName('Theo doi phong KHTC').formulas)].join(' ');
  const names = [...all.matchAll(/(?:LET|LAMBDA)\(([^()"]*?)(?=,(?:'|[A-Z]+\(|LEN|FILTER|TRIM|IF|MAP))/g)].flatMap(m => m[1].split(','));
  [...all.matchAll(/LAMBDA\(([a-z_,]+),/g)].forEach(m => names.push(...m[1].split(',')));
  assert.ok(names.length > 5);
  names.forEach(n => assert.match(n, /_/, 'tên biến phải có dấu _: ' + n));
});
test('Apps Script: keeps chosen layout P = Vai trò phòng, Q = Văn bản gốc on re-run', () => {
  const b = backend([[...HEADERS, 'Vai trò phòng', 'Văn bản gốc', 'Mã đồng bộ Calendar'], [...row('A'), 'Phòng chủ trì', 'https://drive/x', 'cal-1']]);
  const r = b.ctx.caiDatTheoDoiKHTC();
  assert.equal(r.themCotVaiTro, false); assert.equal(r.cotVaiTro, 'P');
  assert.deepEqual(b.sheet.data[0].slice(15, 18), ['Vai trò phòng', 'Văn bản gốc', 'Mã đồng bộ Calendar']);
  assert.deepEqual(b.sheet.data[1].slice(15, 18), ['Phòng chủ trì', 'https://drive/x', 'cal-1']);
});
console.log(`${count} tests passed`);
