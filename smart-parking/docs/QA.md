# Kiểm tra Smart Parking

Ngày kiểm tra: 29/10/2026 (Asia/Bangkok).

## Công cụ và kiểm thử tự động

- Windows, Node.js 24.22.0, npm 11.19.1.
- `npm.cmd install`: thành công; dependency được khóa trong `package-lock.json`.
- `npm.cmd run typecheck`: thành công, không có lỗi TypeScript.
- `npm.cmd test`: **27/27 kiểm thử đạt**, hai tệp test.
- `npm.cmd run build`: thành công. Vite có cảnh báo kích thước chunk (ExcelJS) và chú thích tối ưu của thư viện Zod; không phải lỗi build.
- Các trang quản lý được chia bundle theo route. ExcelJS được tải khi xuất file.
- `npm.cmd run preview` tại cổng 4173: đăng nhập thành công; đủ 10 route production mở được, không ghi nhận lỗi JavaScript. Xuất báo cáo production tải được tệp XLSX gồm 50 giao dịch.

27 kiểm thử bao phủ số lượng và liên kết seed; ID; vé lượt/vé tháng; hạn/khóa thẻ; tính phí và phụ phí; doanh thu hợp lệ; xe vãng lai vào–ra; ngăn lượt mở trùng; kiểm tra sức chứa; biển số đen; biểu phí mới không sửa phí lịch sử; gia hạn; trả thẻ đang dùng; CRUD và bảo vệ liên kết; xe trùng; mất kết nối tạo cảnh báo; sai mật khẩu; lưu phiên theo lựa chọn; quyền bảo vệ/thu ngân; khóa phiên; reset dữ liệu; sắp xếp ngày/thời lượng/số tiền.

## Kiểm tra trực tiếp trên Edge

| Hạng mục | Kết quả |
|---|---|
| Đăng nhập thiếu trường | Hiển thị lỗi tại trường |
| Đăng nhập sai mật khẩu | Thông báo sai thông tin; không vào Dashboard |
| `admin / Admin@123` | Vào Dashboard |
| 10 route quản lý | Mỗi route hiển thị đúng tiêu đề và nội dung, không có lỗi JavaScript trong lượt kiểm tra |
| 6 tab Cài đặt | Thông tin, biểu phí, tài khoản, quyền, bảo mật, nhật ký đều mở được |
| Thêm/sửa xe | Tạo hồ sơ kiểm thử `51F-888.88`, đổi tên chủ xe thành công |
| Tìm kiếm | Lọc đúng hồ sơ vừa tạo |
| Tải lại `/vehicles` | Giữ route, phiên và tên chủ xe đã sửa |
| Xóa hồ sơ thử | Hiện xác nhận, xóa thành công hồ sơ không có lịch sử |
| Xe vãng lai vào | Tạo `SES0101`, tăng số xe từ 20 lên 21; chỗ trống giảm 100 xuống 99 |
| Thanh toán/xe ra | Thu 20.000 VNĐ; đóng lượt, số xe trở về 20 |
| Đồng bộ lịch sử/doanh thu | `SES0101` liên kết `TRX0051`, cùng biển số và 20.000 VNĐ |
| Xuất XLSX | Tệp tải xuống thật; mở bằng ExcelJS có hàng tiêu đề + hàng lọc, số tiền là số 20000 |
| Gia hạn vé tháng | `TKT0002` đổi hạn sang 07/12/2026, tạo giao dịch và nhật ký |
| Mất/kết nối lại thiết bị | `DEV0001` chuyển Mất kết nối → Trực tuyến, tạo `ALT0021` |
| Xử lý cảnh báo | Lưu ghi chú, trạng thái Đã xử lý và người xử lý |
| Tài khoản `guard` | Chỉ hiện Tổng quan/Giám sát/Lịch sử/Cảnh báo |
| Bảo vệ truy cập `/settings` | Hiển thị Không có quyền truy cập |
| Reset demo | Khôi phục bộ mẫu và đăng xuất |

## Bố cục

- 1366×768: trang đăng nhập được tinh chỉnh để toàn bộ card nằm trong màn hình (đáy card khoảng 699 px); không cuộn ngang trang. Bảng dài cuộn trong vùng bảng.
- 1600×900: Dashboard hiển thị thống kê, biểu đồ và bảng; chiều rộng nội dung không vượt viewport.
- 1920×1080: màn giám sát chia hai làn, ảnh và biểu mẫu hiển thị đúng; chiều rộng document khớp body.
- 390×844: Dashboard xuống hàng; menu thu gọn; không tràn ngang document. Đây là kiểm tra bổ sung, desktop vẫn là ưu tiên.
- Dialog giới hạn chiều cao và có cuộn nội dung; focus/đóng bằng Radix Dialog.

Ảnh chụp trong thư mục này dùng để ghi nhận giao diện. Ảnh camera trên trang là ảnh minh họa, không phải dữ liệu camera thật.

## Giới hạn xác minh

- Không kiểm tra máy in vật lý hoặc kết nối phần cứng, vì ứng dụng không tích hợp những dịch vụ đó.
- Không kiểm tra nhiều người dùng/nhiều tab ghi đồng thời; demo chủ đích vận hành một tab.
- Google/Apple/điện thoại chưa có OAuth/SMS; chỉ thông báo chưa được kết nối theo yêu cầu.
- Công cụ chờ sự kiện tải tệp của trình duyệt bị timeout một lần; tệp XLSX vẫn tải thành công và được mở kiểm tra trực tiếp trên filesystem.

Các dữ liệu CRUD và giao dịch tạo trong lượt kiểm thử đã được dọn bằng chức năng Khôi phục demo.
