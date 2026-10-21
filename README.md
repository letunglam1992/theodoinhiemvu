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
- Dòng mới có ngày thực ở J và chưa có K/L được gửi thư. Không phụ thuộc mốc báo trước 3 ngày của email nhắc hạn hằng ngày; báo mới chạy cả cuối tuần.
- Dòng mới chưa điền hạn hoặc ngày sai (ví dụ `31/02/2026`) chờ bổ sung/sửa ngày; không gửi thư lúc đó. Dòng cũ được sửa hạn không được coi là dòng mới.
- Nhiều nhiệm vụ mới cùng lượt quét được gộp tối đa 30 nhiệm vụ/email. Email có số ký hiệu, cơ quan/ngày ban hành, nội dung, phòng chủ trì, người tham mưu và hạn hoàn thành.
- Cột **Mã thông báo văn bản mới** được thêm sau các cột đang có, không dịch A–O, và ẩn. Tab **Theo dõi báo văn bản mới** lưu các dòng đã gửi. Giữ mã này khi công cụ tự động cập nhật hoặc sắp xếp dòng; xóa nhiệm vụ bằng xóa hẳn dòng.
- LockService tránh hai lần quét gửi đồng thời. Quét lại, sửa nội dung, đổi hạn, dịch dòng hoặc cài lại thông thường không gửi lại nhiệm vụ đã báo. MailApp và Sheet không có giao dịch chung: nếu tiến trình dừng ngay sau khi Google nhận thư nhưng trước khi lưu dấu đã gửi, lần thử lại vẫn có khả năng báo lặp.
- Lỗi gửi hoặc hết hạn mức giữ các nhiệm vụ chưa gửi để thử ở lượt sau; có nhật ký và trạng thái lỗi trên dashboard. Thời điểm nhận phụ thuộc lúc dữ liệu lên Sheet và lịch chạy của Google, không bảo đảm chính xác từng phút.
- Giữ email nhắc hạn hiện có bằng `caiDatNhacHan`; lịch Google Calendar bằng `caiDatDongBoCalendar`. Hai lịch này độc lập với thông báo văn bản mới.

## Kiểm thử

Chạy `node tests/new-document-email.test.js` và `node tests/email-ui.test.js`. Các bài kiểm thử dùng Sheet/MailApp giả lập, không gửi email thật hoặc sửa Google Sheet thật. Mã Apps Script được nhúng trong dashboard phải trùng với `gas-backend/Code.gs`.

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
