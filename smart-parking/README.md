# Smart Parking

Frontend quản lý bãi xe chạy hoàn toàn trên trình duyệt, xây dựng bằng React + TypeScript + Vite. Giao diện tiếng Việt, tông xanh/navy theo ảnh tham chiếu, có đăng nhập và 10 màn hình quản lý liên kết dữ liệu.

## Chạy trên Windows

Yêu cầu Node.js 22.12 trở lên hoặc Node.js 24 và npm. Mở terminal tại thư mục `smart-parking`:

```powershell
npm.cmd install
npm.cmd run dev
```

Mở địa chỉ `Local` do Vite hiển thị, thường là **http://127.0.0.1:5173**. Nếu cổng đã được sử dụng, Vite sẽ chọn cổng kế tiếp. Có thể nhấp đúp `start-smart-parking.cmd` để khởi động. Dùng `Ctrl+C` trong terminal để dừng.

Trong PowerShell sử dụng `npm.cmd` để tránh lỗi chặn tập lệnh `npm.ps1`. Trong Command Prompt có thể sử dụng `npm` thông thường.

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

`dist/` là bản build production. Không mở trực tiếp `dist/index.html` bằng `file://`; dùng `npm.cmd run preview`. Nếu đưa lên máy chủ tĩnh, cấu hình SPA fallback mọi route về `index.html` để tải lại `/vehicles`, `/reports`… hoạt động.

## Tài khoản demo

Mật khẩu ban đầu của tất cả tài khoản: **Admin@123**.

| Tên đăng nhập      | Vai trò                | Màn hình được cấp                              |
| ------------------ | ---------------------- | ---------------------------------------------- |
| `admin`            | Quản trị viên          | Tất cả 10 màn hình và 6 tab cài đặt            |
| `manager`          | Quản lý                | 9 màn hình vận hành, không có cài đặt hệ thống |
| `guard`            | Bảo vệ                 | Tổng quan, giám sát, lịch sử, cảnh báo         |
| `cashier`          | Thu ngân               | Tổng quan, vé, khách hàng, lịch sử, báo cáo    |
| `staff5`…`staff10` | Nhân viên theo vai trò | Theo bảng Tài khoản trong Cài đặt              |

Có thể đăng nhập bằng username hoặc email hiển thị trong danh sách tài khoản. Menu, route và thao tác đều kiểm tra quyền demo. Admin có thể thay đổi quyền xem/thêm/sửa/xóa/xuất. Quyền quản lý hệ thống dành riêng cho Admin để tránh mất quyền quản trị.

## Cấu trúc

```text
smart-parking/
├── public/                 # Logo, ảnh tham chiếu đóng gói cục bộ
├── src/
│   ├── components/
│   │   ├── ui/             # Button và Dialog theo shadcn/ui, dùng Radix
│   │   ├── common/         # DataTable, form, detail, confirm, thống kê
│   │   └── layout/         # Sidebar, Header, MainLayout
│   ├── pages/              # 10 trang quản lý, đăng nhập, hỗ trợ, 404
│   ├── data/seed.ts        # Bộ dữ liệu demo có liên kết
│   ├── stores/             # Zustand, phiên demo, localStorage
│   ├── services/           # Quy tắc nghiệp vụ, phân tích, xuất XLSX, tests
│   ├── routes/             # Bảo vệ route theo vai trò
│   ├── types/              # Các interface dữ liệu
│   ├── utils/              # Ngày giờ, VNĐ, biển số, class names
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css           # Theme, Tailwind, responsive, bản in
├── docs/                   # Báo cáo kiểm tra và ảnh chụp giao diện
├── components.json         # Cấu hình shadcn/ui
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
└── start-smart-parking.cmd
```

## Chức năng

| Route              | Chức năng                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `/login`           | Validation, hiện/ẩn mật khẩu, ghi nhớ phiên, Việt/Anh cho trang đăng nhập                                                     |
| `/forgot-password` | Hướng dẫn liên hệ quản trị viên bằng email/điện thoại                                                                         |
| `/dashboard`       | 6 thống kê từ dữ liệu chung; biểu đồ lưu lượng, doanh thu, loại xe và lấp đầy khu vực; lọc ngày/7/30 ngày; chi tiết hoạt động |
| `/monitoring`      | Camera minh họa, nhận diện mô phỏng, chọn thẻ/làn/khu, xe vào, tính phí, xác nhận thanh toán/xe ra, barrier đóng/mở           |
| `/vehicles`        | Thêm/sửa/xem/xóa, kiểm tra biển số trùng, liên kết khách hàng, lọc và xuất Excel                                              |
| `/tickets`         | Cấp/sửa/khóa/mở khóa/trả thẻ, gia hạn vé tháng có thanh toán, trạng thái theo thời hạn, lọc và xuất Excel                     |
| `/customers`       | CRUD, nhóm khách hàng, nhiều xe/khách, xem phương tiện và lịch sử tương ứng                                                   |
| `/history`         | Khoảng ngày, biển số, loại xe, loại vé, làn, trạng thái; ảnh vào/ra minh họa; thanh toán và nhân viên                         |
| `/reports`         | Doanh thu đã thanh toán, nhóm ngày/tuần/tháng, theo loại xe/vé, chi tiết giao dịch, XLSX và in toàn bộ kết quả đã lọc         |
| `/alerts`          | Tìm kiếm/lọc mức độ, chi tiết, nhập nội dung xử lý và đánh dấu đã xử lý                                                       |
| `/devices`         | CRUD thiết bị demo, lọc kết nối, mô phỏng mất/kết nối lại, tạo cảnh báo tương ứng                                             |
| `/settings`        | Thông tin bãi, logo, sức chứa, biểu phí, 10 tài khoản, quyền, mật khẩu/phiên, nhật ký, khôi phục mẫu                          |

Tất cả bảng dùng cùng thành phần: tìm kiếm không dấu, sắp xếp cột, phân trang, cuộn ngang, trạng thái rỗng và xuất XLSX khi có quyền. Xuất theo **toàn bộ kết quả đang tìm/lọc**, không chỉ trang đang hiển thị. Form dùng React Hook Form + Zod; thông báo dùng Sonner; biểu đồ dùng Recharts; state dùng Zustand; xử lý ngày dùng date-fns; font Inter kèm bộ ký tự tiếng Việt được đóng gói cục bộ.

## Dữ liệu và quy tắc

Bộ mẫu gồm **50 xe, 30 khách hàng, 60 vé/thẻ, 100 lượt gửi, 50 giao dịch, 15 thiết bị, 20 cảnh báo, 10 tài khoản và 10 nhật ký ban đầu**. Thời gian mẫu dựa trên ngày khởi tạo. Không sinh lại dữ liệu khi render. Các thay đổi được ghi ngay vào `smart-parking:data:v1` trong localStorage. Đăng nhập và thao tác có nhật ký nên tổng nhật ký tăng sau lần sử dụng đầu tiên.

- Xe đăng ký, khách hàng, vé/thẻ, lượt gửi và giao dịch có ID riêng. Khách vãng lai có thể gửi xe mà không cần hồ sơ xe/khách hàng.
- Không cho một biển số có hai lượt đang mở, vượt sức chứa khu vực, hoặc vào bằng thẻ không hợp lệ. Biển số đen demo: `51F-999.99`.
- Vé lượt gắn một lượt gửi, không tự hết hạn sau 24 giờ. Vé tháng tự tính hiệu lực theo ngày bắt đầu/hết hạn; thẻ bị khóa/đã trả được ưu tiên.
- Phí vé lượt = `ceil(số giờ / số giờ mỗi block) × đơn giá + phụ phí`, tối thiểu một block. Phụ phí cộng một lần. Vé tháng không thu thêm phí tại làn ra.
- **Chốt biểu phí khi xe vào**. Thay đổi giá chỉ áp dụng cho lượt gửi mới; lượt đang gửi và giao dịch lịch sử giữ nguyên biểu phí/số tiền.
- Xe ra và thanh toán ghi cùng một lần cập nhật dữ liệu để Dashboard, lịch sử và doanh thu đồng bộ. Bấm lần nữa không tạo giao dịch trùng.
- Cấp/gia hạn vé tháng ghi nhận giao dịch thanh toán demo. Doanh thu chỉ cộng trạng thái `Đã thanh toán`.
- Xóa hồ sơ có lịch sử/liên kết bị chặn. Có thể khóa hồ sơ hoặc trả thẻ để bảo toàn dữ liệu. Trả thẻ đang dùng trong bãi bị chặn.
- Tích Ghi nhớ: phiên ở localStorage; bỏ tích: phiên ở sessionStorage. Hết thời hạn thì đăng nhập lại. Thời hạn mặc định 8 giờ, có thể đổi trong Cài đặt → Bảo mật.
- Cài đặt → Thông tin bãi xe → **Khôi phục demo** đưa về dữ liệu mẫu và đăng xuất. Chỉ xóa dữ liệu của ứng dụng này, không xóa localStorage của ứng dụng khác.

## Kiểm tra nhanh

1. Đăng nhập `admin / Admin@123`.
2. Vào Giám sát, nhập `51F-888.88`, chọn loại xe/khu vực, xác nhận xe vào.
3. Thử nhập lại biển số đó: hệ thống chặn lượt đang mở trùng.
4. Chọn phương tiện vừa vào, xác nhận thanh toán & xe ra.
5. Tra `51F-888.88` trong Lịch sử và Doanh thu: mã lượt gửi và số tiền khớp nhau.
6. Thêm/chỉnh sửa một xe, tải lại trình duyệt: dữ liệu và route vẫn giữ nguyên.
7. Đăng nhập `guard`: không có menu/hành động quản lý tài khoản hoặc doanh thu.

Kết quả kiểm tra thực tế được ghi trong `docs/QA.md`.

## Giới hạn demo

Không có backend, cơ sở dữ liệu máy chủ, camera thật, OCR/AI, barrier thật, cổng thanh toán hoặc gửi email/SMS. Ảnh camera là ảnh minh họa được lấy vùng bãi xe của ảnh tham chiếu, không phải bằng chứng nhận diện từng xe. Các nút Google/Apple/điện thoại thông báo chưa kết nối, không giả lập xác thực thành công.

Dữ liệu nằm trên trình duyệt và origin hiện tại: `localhost` khác `127.0.0.1`, thay cổng cũng tạo vùng dữ liệu riêng. Không có đồng bộ nhiều người dùng hoặc khóa giao dịch giữa nhiều tab; dùng một tab vận hành. Mật khẩu và quyền demo không phải bảo mật sản phẩm thật. Không nhập dữ liệu nhạy cảm hoặc mật khẩu thật.

Giao diện quản trị dùng tiếng Việt; tùy chọn tiếng Anh áp dụng cho trang đăng nhập. Xuất Excel tải thư viện theo nhu cầu; bundle ExcelJS tương đối lớn. In dùng hộp thoại trình duyệt và hỗ trợ lưu PDF theo khả năng của trình duyệt.

## Tham khảo

- Ảnh giao diện Smart Parking do người dùng cung cấp, dùng riêng vùng ảnh bãi xe làm nền; toàn bộ ô nhập/nút/card được dựng bằng HTML/CSS/React.
- Tài liệu KzParking của FUTECH do người dùng cung cấp, tham khảo các nghiệp vụ quản lý thẻ, khách hàng, sự kiện, thiết bị và báo cáo.
- Cấu hình theo tài liệu chính thức [Tailwind CSS + Vite](https://tailwindcss.com/docs/installation/using-vite) và [shadcn/ui + Vite](https://ui.shadcn.com/docs/installation/vite).
