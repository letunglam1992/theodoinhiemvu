# Thiết kế: Theo dõi nhiệm vụ Phòng Kế hoạch - Tài chính theo từng thành viên

Ngày: 30/10/2026 · Phạm vi: repo `theodoinhiemvu` (dashboard + Apps Script) và repo `phanmemquetvanban` (prompt tác vụ quét iOffice).

## 1. Mục tiêu

Ngoài nhiệm vụ giao riêng Lê Tùng Lâm tham mưu (đang có), theo dõi cả nhiệm vụ giao **Phòng KHTC** (chủ trì, tham mưu, phối hợp) và người trong phòng được Lâm phân công tiếp: Thư, Kiên, Nhung, Tuấn, Hòa, Nga, Thực (và chính Lâm).

Tiêu chí thành công:
- Văn bản đến có bút phê chứa từ khóa phòng (người dùng tự sửa được) được ghi vào Sheet với vai trò phòng đúng.
- Bước Lâm chuyển xử lý trên iOffice cho một thành viên được nhận diện và ghi vào cột M; chưa chuyển thì M = `Chưa phân công`, được quét lại ở lượt sau.
- Văn bản đi đã phát hành do thành viên soạn tự đóng nhiệm vụ khớp (quy tắc khớp chặt hiện có).
- Dashboard xem được theo từng thành viên, có công tắc “Của tôi / Cả phòng”.
- Không làm thay đổi/hỏng dữ liệu A–O hiện có, email nhắc hạn, báo văn bản mới, Calendar, KH 281.

Quyết định đã chốt với người dùng:
- Luồng iOffice: văn bản giao phòng về tài khoản Lâm; Lâm “Chuyển xử lý” cho thành viên kèm ý kiến.
- Gộp vào một tab dữ liệu `Danh sach nhiem vu` + tab xem riêng bằng công thức.
- Dashboard mặc định hiển thị toàn bộ, có công tắc phạm vi.
- Phạm vi bổ sung: phòng phối hợp; việc chưa phân công; tự hoàn thành theo VB đi của thành viên. Không làm email nhắc riêng theo thành viên (dùng cơ chế Danh bạ sẵn có).
- Họ tên đầy đủ thành viên: để trống, người dùng tự điền sau trong tab cấu hình.
- Mốc kích hoạt việc của phòng: **ngày triển khai bản mới**, không quét bù.

## 2. Dữ liệu trên Sheet `1QROMv4BEN4sJXsd5iM1MaQcFcz0zCtMc8z1-SrcfagA`

### 2.1 Tab `Danh sach nhiem vu` (nguồn duy nhất)
- A–O giữ nguyên. M (Người tham mưu) = `Lê Tùng Lâm` | tên gọi thành viên theo tab cấu hình (vd `Kiên`) | `Chưa phân công`.
- Thêm cột **P “Vai trò phòng”**, validation: `Cá nhân tham mưu`, `Phòng chủ trì`, `Phòng tham mưu`, `Phòng phối hợp`. P trống ⇒ hiểu là `Cá nhân tham mưu` (tương thích dữ liệu cũ).
- P được chèn ngay sau O; các cột ẩn do Apps Script tự thêm (mã Calendar, mã báo mới) dịch sang phải — an toàn vì mọi nơi ánh xạ theo tên tiêu đề.
- Với `Phòng phối hợp`: H là đơn vị chủ trì thực tế, I chứa Phòng KHTC.

### 2.2 Tab mới `Cau hinh quet KHTC`
- Bảng **Từ khóa** (A3:C): Từ khóa · Vai trò (Chủ trì/Tham mưu/Phối hợp) · Bật (Có/Không). Mặc định: `KHTC chủ trì`, `Phòng KHTC chủ trì`, `KHTC tham mưu`, `KHTC tm`, `P.KHTC tm`, `Phòng Kế hoạch - Tài chính chủ trì`, `Phòng Kế hoạch - Tài chính tham mưu`, `KHTC ph`, `KHTC phối hợp`.
- Bảng **Thành viên** (E3:H): Tên gọi · Họ tên đầy đủ trên iOffice · Bí danh khác (phân cách `;`) · Đang công tác (Có/Không). Mặc định 8 dòng: Lâm (Lê Tùng Lâm), Thư, Kiên, Nhung, Tuấn, Hòa, Nga, Thực (họ tên trống).
- Ô ghi chú mốc kích hoạt KHTC (ngày cài đặt).

### 2.3 Tab mới `Theo doi phong KHTC` (chỉ công thức, không nhập tay)
- Bảng tổng hợp mỗi thành viên + `Chưa phân công`: Tổng · Đang thực hiện · Quá hạn · Sắp đến hạn (≤3 ngày) · Hoàn thành đúng hạn · Hoàn thành trễ.
- Ô chọn thành viên (validation theo danh sách thành viên) + danh sách `FILTER` các dòng của người đó từ tab chính.
- Ngày ở F/J/L là chuỗi `dd/mm/yyyy` ⇒ công thức dùng `DATEVALUE`/tách chuỗi có `IFERROR`.

## 3. Prompt quét iOffice (`phanmemquetvanban`)

Bổ sung mục mới, không bỏ quy tắc cũ:
1. Đầu lượt (khi có mục mới cần xử lý) đọc tab `Cau hinh quet KHTC`; lỗi ⇒ dùng bộ mặc định trong prompt, ghi lỗi vào state.
2. Văn bản đến: chuẩn hóa (bỏ dấu, hoa thường, gộp `P.KHTC`, `KH-TC`, `KHTC`, `Phòng Kế hoạch - Tài chính`) rồi so từ khóa đang bật trong ghi chú bút phê ngay trước bước chuyển tới Lâm/phòng. Ưu tiên: “Lâm tm” ⇒ `Cá nhân tham mưu`; nếu không, theo vai trò từ khóa; nhiều vai trò ⇒ Chủ trì > Tham mưu > Phối hợp.
3. Đọc cây xử lý: bước **từ Lê Tùng Lâm** chuyển cho người thuộc danh sách thành viên. Người nhận xử lý chính / có ý kiến `tham mưu|tm|thm|th|xử lý|chủ trì` ⇒ M; người `ph` ⇒ ghi O. Không có bước chuyển ⇒ M = `Chưa phân công`. Lâm tự xử lý ⇒ M = `Lê Tùng Lâm`.
4. Khớp người: họ tên đầy đủ trùng; hoặc tên gọi/bí danh + người nhận trong cây thuộc Phòng KHTC. Mơ hồ ⇒ `pending_review`, O ghi “Cần xác nhận người được giao”.
5. Mỗi lượt kiểm tra lại các dòng có mã iOffice và M = `Chưa phân công`; khi có bước chuyển mới chỉ sửa M và nối ghi chú O. Không ghi đè M đã do người dùng sửa tay khác với lần ghi trước (lưu giá trị đã ghi trong state để phát hiện).
6. Văn bản đi đã phát hành: người soạn thuộc danh sách thành viên (thay vì chỉ Lâm). Chỉ khớp dòng có M = người soạn hoặc `Chưa phân công`; quy tắc khớp chặt, một VB đi đóng tối đa một dòng như cũ.
7. Mốc kích hoạt KHTC = thời điểm triển khai; baseline ID tại thời điểm đó không nhập. Việc giao riêng Lâm giữ mốc 24/09/2026.
8. Cột P luôn được ghi cho dòng mới. H: `Phòng Kế hoạch - Tài chính` khi chủ trì/tham mưu.

## 4. Dashboard (`index.html`)
- Thêm trường `vai_tro_phong` vào: bộ ánh xạ cột nhập/CSV (synonyms `vai tro phong`, `vai tro`), `SYNC_FIELDS`, form sửa nhiệm vụ (select), xuất Excel/CSV.
- Hàm `vaiTroPhong(t)` trả `Cá nhân tham mưu` khi trống.
- Hàm `laCuaToi(t)`: `vai_tro_phong` = `Cá nhân tham mưu` hoặc M khớp tên người dùng (mặc định `Lê Tùng Lâm`, cấu hình trong Thiết lập).
- Công tắc **Của tôi / Cả phòng** trên topbar, lưu localStorage (try/catch), áp dụng cho Tổng quan, Nhiệm vụ, Phân tích, Báo cáo (lọc trước khi tính).
- Trang mới **Phòng KHTC** (`data-ab-page="khtc"`): thẻ theo thành viên (Tổng, Quá hạn, Sắp hạn, Đúng hạn %), cụm `Chưa phân công`, biểu đồ cột chồng người × trạng thái, bảng nhiệm vụ lọc theo thẻ chọn và vai trò, xuất CSV. Danh sách thành viên mặc định 8 người, sửa được trong Thiết lập; người xuất hiện ở M nhưng ngoài danh sách gộp vào “Khác”.
- Tái sử dụng hàm trạng thái/hạn hiện có để số liệu khớp các trang khác.

## 5. Apps Script `gas-backend/Code.gs` → v7
- `COT_DU_LIEU` thêm `{field:'vai_tro_phong', ten:'Vai trò phòng', pos:16, tuyChon:true}`; cột tùy chọn: thiếu thì đọc rỗng, không ghi, không lỗi “thiếu cột”.
- `caiDatTheoDoiKHTC()` chạy một lần: thêm tiêu đề P nếu thiếu (chèn cột sau O), validation P, tạo 2 tab mới nếu chưa có (không ghi đè nếu đã có). Idempotent.
- `SCRIPT_VERSION = 7`; mã nhúng trong dashboard đồng bộ với `gas-backend/Code.gs`.

## 6. Kiểm thử
- `tests/khtc.test.js`: ánh xạ P; P trống; `laCuaToi`; thống kê theo người (quá hạn/sắp hạn/đúng hạn); `Chưa phân công`; cột tùy chọn trong Apps Script giả lập; `caiDatTheoDoiKHTC` idempotent.
- Chạy lại `tests/new-document-email.test.js`, `tests/email-ui.test.js`, `tests/kh281.test.js`.
- Mở dashboard bằng Playwright, kiểm tra trang Phòng KHTC và công tắc phạm vi ở 375px và 1280px.

## 7. Ngoài phạm vi
- Email nhắc theo thành viên riêng; phân quyền theo thành viên; quét bù trước ngày triển khai; tự động phân công.
