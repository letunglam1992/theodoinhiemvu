# Điều hành nhiệm vụ

Dashboard tĩnh trên Vercel/Netlify, kết nối Google Sheet qua CSV và Apps Script. Lối tắt màn hình chính khởi chạy tại `/`.

## Email báo văn bản mới có thời hạn (Apps Script v5)

Gmail báo nhiệm vụ mới được đưa vào Google Sheet; Google Calendar theo dõi các mốc hạn. Chức năng báo mới chạy trên Apps Script, không cần mở dashboard và không phụ thuộc Vercel chạy tác vụ nền.

1. Mở Google Sheet → **Tiện ích mở rộng → Apps Script**. Thay toàn bộ `Code.gs` bằng [gas-backend/Code.gs](gas-backend/Code.gs), hoặc lấy mã từ thẻ **Mã Apps Script** trên dashboard.
2. Giữ `MA_BI_MAT` giống mã hiện đang dùng. Kiểm tra `TEN_SHEET_DU_LIEU` đúng tab dữ liệu nhiệm vụ. Lưu mã; đặt múi giờ dự án thành `Asia/Ho_Chi_Minh`.
3. Chọn hàm `caiDatBaoVanBanMoi` → **Chạy** → cấp quyền. Mặc định nhận thư tại tài khoản Google chạy bước cài đặt; bước này không gửi thư cho dữ liệu đã có.
4. Trong tab **Cấu hình nhắc hạn**, kiểm tra dòng **Email nhận văn bản mới**. Có thể sửa thành một email cá nhân khác; các lần quét sau dùng giá trị mới. Chỉ công bố tab dữ liệu nhiệm vụ, giữ các tab cấu hình/danh bạ/theo dõi nội bộ.
5. **Triển khai → Quản lý các bản triển khai → Sửa → Phiên bản mới → Triển khai**, giữ URL Web App cũ. Trên dashboard, vào **Đồng bộ Google Sheet → Thông báo email → Kiểm tra báo văn bản mới**. Kiểm tra kết nối phải trả phiên bản 5.
6. Thêm một dòng nhiệm vụ mới có nội dung và J là ngày hợp lệ, K/L trống. Chạy `chayBaoVanBanMoi` để kiểm tra ngay, hoặc chờ lịch quét mỗi 5 phút. Tắt bằng `huyBaoVanBanMoi`.

### Quy tắc xử lý

- Dữ liệu đã có lúc cài lần đầu làm mốc và không được báo là văn bản mới.
- Dòng mới có ngày thực ở J và chưa có K/L được gửi thư. Dòng có cột **Vai trò phòng** là «Phòng chủ trì» (kể cả dữ liệu cũ «Phòng tham mưu») hoặc «Cá nhân tham mưu» — việc ứng dụng quét iOffice ghi từ văn bản đến chuyển tới tài khoản người dùng, bút phê giao thẳng thành viên trong phòng, văn bản đi của Sở — được gửi thư **ngay cả khi chưa có hạn** (email ghi «Hạn hoàn thành: Chưa xác định»); «Phòng phối hợp» không gửi. Không phụ thuộc mốc báo trước 3 ngày của email nhắc hạn hằng ngày; báo mới chạy cả cuối tuần.
- Dòng mới chưa điền hạn hoặc ngày sai (ví dụ `31/02/2026`) chờ bổ sung/sửa ngày; không gửi thư lúc đó. Dòng cũ được sửa hạn không được coi là dòng mới.
- **Báo riêng người được giao:** người ở cột M (Người tham mưu) nhận email riêng «[NHIỆM VỤ ĐƯỢC GIAO]» nếu tab **Danh bạ** có tên (tên gọi như ở cột M, hoặc họ tên đầy đủ khai ở tab «Cau hinh quet KHTC»), email hợp lệ và «Nhận nhắc» = Có. Giao lại cho người khác thì người mới được báo; mỗi người một lần mỗi việc. Lần chạy đầu sau khi cập nhật mã chỉ ghi mốc các phân công đang có, không gửi việc cũ. Người nhận email tổng hợp (email nhận văn bản mới) không nhận thêm thư riêng. Việc đã có K/L hoặc «Phòng phối hợp» không báo. Lưu ý: Danh bạ cũng dùng cho email nhắc hạn hằng ngày (nếu đã bật `caiDatNhacHan`).
- Nhiều nhiệm vụ mới cùng lượt quét được gộp tối đa 30 nhiệm vụ/email. Email có số ký hiệu, cơ quan/ngày ban hành, nội dung, phòng chủ trì, người tham mưu và hạn hoàn thành.
- Cột **Mã thông báo văn bản mới** được thêm sau các cột đang có, không dịch A–O, và ẩn. Tab **Theo dõi báo văn bản mới** lưu các dòng đã gửi. Giữ mã này khi công cụ tự động cập nhật hoặc sắp xếp dòng; xóa nhiệm vụ bằng xóa hẳn dòng.
- LockService tránh hai lần quét gửi đồng thời. Quét lại, sửa nội dung, đổi hạn, dịch dòng hoặc cài lại thông thường không gửi lại nhiệm vụ đã báo. MailApp và Sheet không có giao dịch chung: nếu tiến trình dừng ngay sau khi Google nhận thư nhưng trước khi lưu dấu đã gửi, lần thử lại vẫn có khả năng báo lặp.
- Lỗi gửi hoặc hết hạn mức giữ các nhiệm vụ chưa gửi để thử ở lượt sau; có nhật ký và trạng thái lỗi trên dashboard. Thời điểm nhận phụ thuộc lúc dữ liệu lên Sheet và lịch chạy của Google, không bảo đảm chính xác từng phút.
- Giữ email nhắc hạn hiện có bằng `caiDatNhacHan`; lịch Google Calendar bằng `caiDatDongBoCalendar`. Hai lịch này độc lập với thông báo văn bản mới.

## Nhiệm vụ Phòng KHTC theo thành viên (Apps Script v7)

Theo dõi cả nhiệm vụ giao **Phòng Kế hoạch - Tài chính** (chủ trì, tham mưu, phối hợp) và người được phân công trong phòng (Thư, Kiên, Nhung, Tuấn, Hòa, Nga, Thực, Lâm), bên cạnh nhiệm vụ giao riêng người tham mưu.

1. Thay `Code.gs` bằng [gas-backend/Code.gs](gas-backend/Code.gs) (giữ `MA_BI_MAT`), Lưu, **Triển khai → Phiên bản mới**. Kiểm tra kết nối phải trả **phiên bản 7**.
2. Chọn hàm `caiDatTheoDoiKHTC` → **Chạy** một lần. Hàm:
   - thêm cột **P “Vai trò phòng”** ngay sau Ghi chú (O); cột “Văn bản gốc” của ứng dụng Đồng bộ Nhiệm vụ iOffice chuyển sang Q (ứng dụng từ 0.6.0 tìm cột này theo tên). Chạy lại hàm không chuyển cột, có danh sách chọn `Cá nhân tham mưu` / `Phòng chủ trì` / `Phòng tham mưu` / `Phòng phối hợp`. P trống được hiểu là `Cá nhân tham mưu`, nên dữ liệu cũ không phải sửa. Các cột ẩn của Calendar/báo mới dịch sang phải và vẫn được tìm theo tên;
   - tạo tab **Cau hinh quet KHTC**: từ khóa giao phòng (A–C) và thành viên (E–H) để tác vụ quét iOffice đọc mỗi lượt; ô J4 là mốc kích hoạt (không quét bù trước mốc). **Điền cột “Họ tên đầy đủ trên iOffice”** cho từng đồng chí để tránh nhận nhầm người cùng tên;
   - tạo tab chỉ xem **Theo doi phong KHTC** (tổng hợp theo thành viên + danh sách lọc theo người chọn ở K2) và tab ẩn **KHTC tinh toan** bằng công thức `LET/MAP/FILTER`. Không nhập tay vào hai tab này.
   Chạy lại hàm không ghi đè cấu hình đã sửa; chỉ cập nhật lại công thức theo vị trí cột hiện tại.
3. Trên dashboard, lần đồng bộ đầu sau khi thêm cột P sẽ mở bước xác nhận ánh xạ cột (cấu trúc Sheet đã đổi); kiểm tra cột “Vai trò phòng” rồi xác nhận.
4. Menu **Phòng KHTC**: thẻ theo từng đồng chí (quá hạn, sắp hạn ≤ 3 ngày, đang làm, tỷ lệ đúng hạn), cụm **Chưa phân công**, biểu đồ theo người × trạng thái, danh sách và xuất Excel. Công tắc **Của tôi / Cả phòng** trên thanh đầu trang áp dụng cho Tổng quan, Nhiệm vụ, Phân tích, Báo cáo. Danh sách thành viên trên dashboard sửa ở cuối trang Phòng KHTC (lưu trên trình duyệt); nên giữ giống tab cấu hình trên Sheet.

Cột M ghi tên gọi thành viên (vd `Kiên`), `Lê Tùng Lâm` hoặc `Chưa phân công`; tên ngoài danh sách được gộp vào nhóm “Khác”. Prompt tác vụ quét iOffice tương ứng nằm ở repo `phanmemquetvanban`.

## Trợ lý AI trong «Hỏi đáp dữ liệu»

Nút bong bóng ở góc phải dưới mở khung hỏi đáp. Khi bật **Trả lời bằng AI**:

1. Dashboard tự chọn tối đa 12 nhiệm vụ liên quan đến câu hỏi (từ khóa, tên người, quá hạn, sắp hạn, chưa phân công) và một khối số liệu tổng hợp, ngay trên trình duyệt.
2. Gửi câu hỏi và các đoạn đó tới Cloudflare Worker dùng chung (mặc định `https://rasoatvanban.letunglam1992.workers.dev`, giao thức `{messages}` → `{text, model}`, cùng Worker với app Tra cứu TTHC đất đai). Mô hình chỉ được trả lời từ các đoạn đó và ghi nguồn `[n]`; bấm `[n]` để mở nhiệm vụ.
3. Mất mạng hoặc Worker lỗi/hết hạn mức → tự trả lời bằng luật cố định như trước.

Đổi địa chỉ Worker ở **Cấu hình AI** trong khung hỏi đáp (lưu trên trình duyệt). Câu hỏi và các nhiệm vụ liên quan được gửi tới Cloudflare Workers AI — giao diện nhắc không nhập thông tin cá nhân. Khóa API nằm ở Worker, không có trong dashboard.

## Kiểm thử

Chạy `node tests/new-document-email.test.js`, `node tests/email-ui.test.js` `node tests/khtc.test.js` và `node tests/tro-ly-ai.test.js`. Các bài kiểm thử dùng Sheet/MailApp giả lập, không gửi email thật hoặc sửa Google Sheet thật. Mã Apps Script được nhúng trong dashboard phải trùng với `gas-backend/Code.gs`.

## Chuyên đề KH 281 / Công văn 6429

Menu **KH 281 / CV 6429** mở mục theo dõi riêng cho Phòng Kế hoạch - Tài chính. Có 21 phần việc được giao tại Mục II của Công văn 6429/SNNMT-KHTC ngày 21/10/2026 cho 8 phòng, chi cục; gồm cả các phần việc phối hợp, không phải 21 dự án/sản phẩm độc lập. Phần KHTC tại II.8.a được phân biệt với nhiệm vụ nghiên cứu của Chi cục Trồng trọt và BVTV tại II.3.c.

Biểu Google Sheet: https://docs.google.com/spreadsheets/d/1GJDRd2jYhODy239vfDGwQR3pKPpCRIaHFGpyje_Y3gs/edit

- `Cap nhat`: các đơn vị lọc đúng đơn vị và kỳ, nhập các cột E–V; KHTC ghi nhận xét ở X. Có 21 dòng/kỳ cho kế hoạch hành động, báo cáo năm 2026 và quý IV/2026. Kỳ tiếp theo KHTC sao chép nguyên dòng mẫu, đổi mã/kỳ và mở rộng bảng, không ghi đè lịch sử kỳ trước.
- `Tong hop`: KHTC chọn kỳ tại B3 để theo dõi từng đơn vị; số hoàn thành là đơn vị tự khai và phải đối chiếu minh chứng.
- `Nhiem vu`: danh mục và thời hạn nguyên văn, vai trò, sản phẩm theo công văn, căn cứ mục/trang. Phần công văn không nêu hạn hoặc sản phẩm riêng được ghi rõ; không tự đặt ngày hoàn thành cho nhiệm vụ thường xuyên/giai đoạn.
- `Ky bao cao`: hạn đơn vị và KHTC tách riêng. Các ngày cuối 29/10, 26/11, ngày 04 hoặc 09 suy ra từ từ “trước” trong công văn, không tự dời sang ngày làm việc/quý sau.
- `Huong dan`: hướng dẫn nhập, kiểm tra hồ sơ và chia sẻ. Chủ sở hữu cấp quyền Chỉnh sửa cho email các đơn vị; chưa tự gửi hoặc công bố tệp. Cột công thức và phần tổng hợp được bảo vệ. Các đơn vị vẫn có thể sửa các ô nhập liệu của nhau, vì đây là biểu dùng chung, không phải phân quyền theo đơn vị.

Để đọc kết quả thật trên dashboard, cập nhật toàn bộ `gas-backend/Code.gs` vào Apps Script hiện dùng, giữ `MA_BI_MAT` cũ, Lưu và Triển khai **Phiên bản mới**, giữ URL Web App. Kiểm tra kết nối phải trả **phiên bản 6**. `ID_SHEET_KH281` đã điền sẵn, đọc riêng `Nhiem vu`, `Cap nhat`, `Ky bao cao`, không sửa danh sách nhiệm vụ hiện có. Web App đọc biểu dưới quyền người triển khai nên tài khoản đó cần có quyền truy cập biểu. Không cần xuất bản Google Sheet ra CSV công khai.

Dashboard lấy dữ liệu khi mở mục hoặc bấm **Tải kết quả từ Sheet**, rồi tự tải lại mỗi 60 giây khi mục đang hiển thị. Dữ liệu chưa tải được đánh dấu rõ, không hiển thị kết quả khởi tạo như số liệu thực tế. Có lọc phần việc KHTC, lọc theo đơn vị/kỳ/trạng thái, kiểm tra minh chứng, hồ sơ khắc phục chậm tiến độ, nhận diện dòng trùng và xuất CSV tổng hợp theo kỳ/đơn vị. Biểu và API giới hạn 999 dòng cập nhật, cảnh báo nếu vượt.

Chạy thêm `node tests/kh281.test.js` để kiểm tra nghiệp vụ chuyên đề và luồng đọc có xác thực. Dữ liệu nguồn được tóm lược từ công văn người dùng cung cấp; chưa có toàn văn KH 281 và biểu kèm theo để xác minh ngoài các STT được trích dẫn.
