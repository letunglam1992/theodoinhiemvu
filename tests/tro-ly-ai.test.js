const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const T = vm.runInNewContext(html.match(/<script id="ai-core">([\s\S]*?)<\/script>/)[1] + ';TROLY', {});

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const today = '2026-11-01';
const tasks = [
  {ma: 'a', so_hieu_vb: '5726/STC-QLĐTNNS', noi_dung_vb: 'Rà soát nhu cầu kinh phí năm 2027', nhiem_vu: 'Tổng hợp nhu cầu kinh phí', nguoi_phu_trach: 'Hòa', vai_tro_phong: 'Phòng chủ trì', han_iso: '2026-11-03', status: 'dang_thuc_hien'},
  {ma: 'b', so_hieu_vb: '05/CQTT', noi_dung_vb: 'Xin ý kiến dự thảo Kế hoạch BCĐ 480', nhiem_vu: 'Tham gia ý kiến', nguoi_phu_trach: 'Thư', han_iso: '2026-10-20', status: 'qua_han_chua_xong'},
  {ma: 'c', so_hieu_vb: '101/TTr', noi_dung_vb: 'Điều hành kinh phí mô hình chăn nuôi', nhiem_vu: 'Thẩm định', nguoi_phu_trach: 'Chưa phân công', vai_tro_phong: 'Phòng chủ trì', status: 'chua_ro_han'},
  {ma: 'd', so_hieu_vb: '4903/STC', noi_dung_vb: 'Rà soát dự án Tà Xùa', nhiem_vu: 'Rà soát', nguoi_phu_trach: 'Lê Tùng Lâm', han_iso: '2026-09-29', ngay_hoan_thanh_iso: '2026-09-28', so_cv_hoan_thanh: '5890/SNNMT-KHTC', status: 'hoan_thanh_truoc_han'}
];
const o = {today, daXong: t => /hoan_thanh|dung_han/.test(t.status), nguoi: t => t.nguoi_phu_trach, nhan: t => t.status};
let count = 0;
async function test(name, run) { try { await run(); count++; console.log('PASS', name); } catch (e) { console.error('FAIL', name, e); process.exitCode = 1; } }

(async () => {
  await test('mặc định trỏ tới Worker Workers AI dùng chung của anh Lâm, bật sẵn', () => {
    assert.equal(T.MAC_DINH.diaChi, 'https://rasoatvanban.letunglam1992.workers.dev');
    assert.equal(T.MAC_DINH.bat, true);
  });
  await test('chọn nhiệm vụ: theo tên người, theo ý định quá hạn / chưa phân công / từ khóa; câu chung → việc cần chú ý', () => {
    assert.equal(T.timNhiemVu('Đ/c Hòa đang phụ trách những việc nào?', tasks, o)[0].ma, 'a');
    assert.equal(T.timNhiemVu('Việc nào quá hạn?', tasks, o)[0].ma, 'b');
    assert.equal(T.timNhiemVu('Những việc chưa phân công', tasks, o)[0].ma, 'c');
    assert.equal(T.timNhiemVu('dự án Tà Xùa đã xong chưa', tasks, o)[0].ma, 'd');
    const chung = T.timNhiemVu('Tóm tắt tình hình', tasks, o).map(t => t.ma);
    assert.deepEqual(chung, ['b', 'a'], 'chưa xong, có hạn, gấp nhất trước');
    assert.ok(T.timNhiemVu('x', Array.from({length: 40}, (_, i) => ({...tasks[1], ma: 'q' + i})), o).length <= 12, 'tối đa 12 nhiệm vụ');
  });
  await test('ngữ cảnh: [1] tổng hợp, [2…] nhiệm vụ rút gọn có số ký hiệu, người, hạn dd/mm/yyyy, trạng thái, hoàn thành', () => {
    const ng = T.dungNguCanh([tasks[3]], 'Tổng số nhiệm vụ: 4.', o);
    assert.equal(ng[0].ma, null);
    assert.match(ng[0].noiDung, /Tổng số nhiệm vụ: 4/);
    assert.equal(ng[1].ma, 'd');
    assert.match(ng[1].noiDung, /Số ký hiệu: 4903\/STC/);
    assert.match(ng[1].noiDung, /Hạn: 29\/09\/2026/);
    assert.match(ng[1].noiDung, /Hoàn thành: 5890\/SNNMT-KHTC ngày 28\/09\/2026/);
    assert.ok(ng[1].noiDung.length <= 900);
  });
  await test('gọi Worker: giao thức {messages} → {text, model}; chỉ dẫn chỉ dùng dữ liệu, dẫn nguồn, ngày hôm nay', async () => {
    let gui;
    const fetchGia = async (url, op) => { gui = {url, body: JSON.parse(op.body)}; return {ok: true, status: 200, json: async () => ({text: 'Đ/c Hòa phụ trách 5726 [2].', model: '@cf/aisingapore/gemma-sea-lion-v4-27b-it'})}; };
    const ng = T.dungNguCanh([tasks[0]], 'Tổng hợp', o);
    const d = await T.hoi({diaChi: 'https://w.example/', moHinh: ''}, 'Hòa làm gì?', ng, '01/11/2026', fetchGia);
    assert.equal(gui.url, 'https://w.example');
    assert.equal(gui.body.messages[0].role, 'system');
    assert.match(gui.body.messages[0].content, /Chỉ dùng thông tin trong các ĐOẠN DỮ LIỆU/);
    assert.match(gui.body.messages[0].content, /Hôm nay là 01\/11\/2026/);
    assert.match(gui.body.messages[1].content, /^ĐOẠN DỮ LIỆU:\n\[1\] Tổng hợp/);
    assert.match(gui.body.messages[1].content, /CÂU HỎI: Hòa làm gì\?$/);
    assert.equal(gui.body.model, undefined, 'để Worker tự chọn mô hình');
    assert.equal(d.moHinh, 'gemma-sea-lion-v4-27b-it');
  });
  await test('lỗi Worker: hết hạn mức (429) và không có nội dung được giải thích dễ hiểu', async () => {
    const f429 = async () => ({ok: false, status: 429, json: async () => ({error: 'capacity'})});
    await assert.rejects(T.hoi({diaChi: 'x'}, 'q', [], '01/11/2026', f429), /hết hạn mức Workers AI/);
    const rong = async () => ({ok: true, status: 200, json: async () => ({text: ''})});
    await assert.rejects(T.hoi({diaChi: 'x'}, 'q', [], '01/11/2026', rong), /không trả nội dung/);
  });
  await test('hiển thị: thoát HTML, [n] → nút mở nhiệm vụ (n≥2), [1] tổng hợp không có liên kết, [99] không có nguồn giữ nguyên', () => {
    const ng = [{tieuDe: 'Tổng hợp', ma: null}, {tieuDe: 'Nhiệm vụ 5726', ma: 'a'}];
    const h = T.veTraLoi('<script>x</script> Có 4 việc [1].\n- Hòa: 5726 [2]\n- Khác [99]', ng, esc);
    assert.doesNotMatch(h, /<script>/);
    assert.match(h, /<button type="button" class="ai-cite" data-ma="a"/);
    assert.match(h, /<span class="ai-cite" title="Tổng hợp">\[1\]<\/span>/);
    assert.match(h, /<ul><li>Hòa: 5726 <button/);
    assert.match(h, /\[99\]/);
  });
  await test('giao diện: khung hỏi đáp có công tắc AI, cấu hình địa chỉ, lời nhắc gửi dữ liệu tới Cloudflare', () => {
    assert.match(html, /id="chat-ai-bat"/);
    assert.match(html, /id="chat-ai-url"/);
    assert.match(html, /được gửi tới Cloudflare Workers AI — không nhập thông tin cá nhân/);
  });
  console.log(`${count} tests passed`);
})();
