# UI Specification

## Overview

| Item | Value |
|------|-------|
| Styling | Tailwind CSS |
| Icon | lucide-react |
| Chart | Recharts |
| Font | Inter (UI), JetBrains Mono (số liệu) |
| Ngôn ngữ | Tiếng Việt |
| Hỗ trợ | Desktop-first, responsive xuống mobile |

---

## Design Tokens

### Màu

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `primary` | `#2563EB` | Nút chính, link, trạng thái active |
| `primary-hover` | `#1D4ED8` | Hover nút chính |
| `surface` | `#FFFFFF` | Nền thẻ, modal |
| `background` | `#F1F5F9` | Nền trang |
| `border` | `#E2E8F0` | Viền, đường kẻ |
| `text` | `#0F172A` | Chữ chính |
| `text-muted` | `#64748B` | Chữ phụ, mô tả |

### Màu theo trạng thái task

| Status | Nền | Chữ | Nhãn |
|--------|-----|-----|------|
| `todo` | `#F3F4F6` | `#374151` | Cần làm |
| `in_progress` | `#DBEAFE` | `#1D4ED8` | Đang làm |
| `done` | `#D1FAE5` | `#047857` | Hoàn thành |
| `cancelled` | `#F3F4F6` | `#9CA3AF` | Đã huỷ |

### Màu theo độ ưu tiên

| Priority | Màu | Nhãn |
|----------|-----|------|
| `urgent` | `#DC2626` | Khẩn cấp |
| `high` | `#EA580C` | Cao |
| `medium` | `#CA8A04` | Trung bình |
| `low` | `#6B7280` | Thấp |

**Không dùng màu làm tín hiệu duy nhất.** Mỗi badge luôn có chữ kèm theo — người mù màu chiếm khoảng 8% nam giới.

### Chế độ sáng / tối

Switch cạnh chuông thông báo trong header (`ThemeToggle`). Toàn bộ token màu ở trên có bản đối ứng cho nền tối (`:root.dark` trong `index.css`) — mọi utility class tham chiếu qua biến CSS nên tự đổi theo, không cần biến thể `dark:` rải rác trong component. Lựa chọn lưu ở `localStorage`, áp dụng trước khi trang vẽ (script inline trong `index.html`) để không nháy sáng khi tải lại trang.

### Typography

| Token | Size / Weight | Dùng cho |
|-------|---------------|----------|
| `h1` | 24px / 600 | Tiêu đề trang |
| `h2` | 18px / 600 | Tiêu đề khối |
| `body` | 14px / 400 | Nội dung |
| `small` | 12px / 400 | Metadata, timestamp |
| `stat` | 32px / 700 | Con số trong thẻ thống kê |

### Spacing & Shape

| Token | Value |
|-------|-------|
| Spacing scale | 4 / 8 / 12 / 16 / 24 / 32 px |
| Radius | `md` 8px (thẻ, input), `full` (badge, avatar) |
| Shadow | `sm` cho thẻ, `lg` cho modal/dropdown |
| Chiều cao dòng task | 56px (desktop), 64px (mobile — vùng chạm lớn hơn) |

---

## Layout

```
┌────────────────────────────────────────────────────────────┐
│  Header (56px)                                             │
│  [☰] Task Manager   [🔍 Tìm] [🌙 Switch] [🔔 3] [Avatar ▾] │
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│  Sidebar               │  Content                        │
│  (240px)               │  (max-width 1200px, padding 24px)│
│                        │                                 │
│  ▸ Hôm nay             │                                 │
│  ▸ Danh sách công việc │                                 │
│  ▸ Lịch sử             │                                 │
│  ▸ Thống kê            │                                 │
│  ───────────           │                                 │
│  DANH SÁCH             │                                 │
│  • Cá nhân             │                                 │
│  • Công việc           │                                 │
│  + Thêm                │                                 │
│  ───────────           │                                 │
│  ▸ Người dùng          │  ← chỉ hiện khi role = admin    │
│                        │                                 │
└────────────────────────┴─────────────────────────────────┘
```

**Responsive:**

| Breakpoint | Thay đổi |
|------------|----------|
| ≥ 1024px | Layout đầy đủ như trên |
| 768–1023px | Sidebar thu thành icon-only (64px) |
| < 768px | Sidebar thành drawer trượt; bottom nav 4 mục: Hôm nay / Tất cả / Thống kê / Cá nhân |

---

## Screens

| # | Màn hình | Route | Quyền |
|---|----------|-------|-------|
| 1 | Đăng nhập / Đăng ký | `/login`, `/register` | Public |
| 2 | Công việc hôm nay | `/` | Đã đăng nhập |
| 3 | Danh sách công việc | `/tasks`, `/lists/:id` | Đã đăng nhập |
| 4 | Chi tiết công việc | `/tasks/:id` (drawer) | Đã đăng nhập |
| 5 | Thống kê | `/statistic` | Đã đăng nhập |
| 6 | Lịch sử | `/history` | Đã đăng nhập |
| 7 | Quản lý người dùng | `/admin/users` | Admin |

---

### 1. Đăng nhập

```
┌──────────────────────────────────────┐
│                                      │
│           📋 Task Manager            │
│      Quản lý công việc mỗi ngày      │
│                                      │
│   ┌──────────────────────────────┐   │
│   │ Email                        │   │
│   │ [                          ] │   │
│   │                              │   │
│   │ Mật khẩu                     │   │
│   │ [                        👁] │   │
│   │                              │   │
│   │ ⚠ Email hoặc mật khẩu sai    │   │
│   │                              │   │
│   │ [      Đăng nhập      ]      │   │
│   │                              │   │
│   │ Chưa có tài khoản? Đăng ký   │   │
│   └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

- Card 400px, căn giữa, nền `background`
- Lỗi hiển thị **trên nút**, không dùng toast — người dùng đang nhìn vào form
- Nút chuyển sang spinner + disable khi đang gửi
- Đăng ký thêm: Họ tên, Xác nhận mật khẩu, chọn múi giờ (mặc định `Asia/Ho_Chi_Minh`)

---

### 2. Công việc hôm nay

```
┌──────────────────────────────────────────────────────────────┐
│  Hôm nay                                Thứ Sáu, 28/08/2026  │
│                                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐                             │
│  │   5    │ │   2    │ │   1    │                             │
│  │ Hôm nay│ │Đã xong │ │Quá hạn │                             │
│  └────────┘ └────────┘ └────────┘                             │
│                                                                │
│  ☑ Đã chọn 2 công việc              [📅 Bỏ khỏi hôm nay]      │
│                                                                │
│  ⚠ QUÁ HẠN (1)                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │☐│Tiêu đề            │Danh sách│Trạng thái│Ưu tiên│Hạn│Hành động││
│  │▌☐│Gửi báo cáo tháng 7│Công việc│Cần làm   │🔴 Cao │25/8│▶ ✏ 📅││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  HÔM NAY (5)                            [+ Thêm việc]         │
│  ┌──────────────────────────────────────────────────────────┐│
│  │☐│Họp team           │Công việc│Đang làm  │🟡 TB  │28/8│▶ ✏ 📅││
│  │☑│Viết tài liệu API  │Công việc│Hoàn thành│🟠 Cao │28/8│▶ ✏ 📅││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

- Danh sách hiển thị **dạng bảng** (không phải card như trước), dùng chung component bảng với màn "Danh sách công việc" — cột: checkbox chọn, Tiêu đề, Danh sách, Trạng thái, Ưu tiên, Hạn chót, Hành động
- **Quá hạn luôn nằm ở bảng riêng phía trên**, có viền trái đỏ 3px trên ô đầu mỗi dòng
- Cột **Hành động** có 3 nút: ▶ **Bắt đầu làm**, ✏ **Chỉnh sửa**, 📅 **Bỏ khỏi hôm nay**
- **"Bỏ khỏi hôm nay" không phải xoá** — chỉ gỡ hạn chót (`dueDate = null`) khỏi task, task vẫn còn nguyên trong "Danh sách công việc". Nút dùng icon lịch-gạch-chéo và màu xanh (không phải đỏ), dialog xác nhận nói rõ điều này. Có thể chọn nhiều dòng (kể cả xen giữa 2 bảng Quá hạn/Hôm nay) rồi bỏ hàng loạt.
- **▶ Bắt đầu làm**: yêu cầu task đã có "Thời lượng ước tính (phút)" — chưa có thì báo lỗi, không mở gì cả. Có thời lượng thì: (1) tự chuyển trạng thái task sang "Đang làm", (2) mở đồng hồ đếm ngược bằng đúng số phút đó — xem mục "Đồng hồ đếm ngược" bên dưới. Nút bị mờ/disable nếu task đã "Hoàn thành" hoặc "Đã huỷ".
- **"Thêm việc"** không mở form tạo trống — mở drawer chọn từ các task có sẵn (lọc theo trạng thái/ưu tiên/danh sách + tìm kiếm), chọn 1 task sẽ gán hạn chót = hôm nay. Có nút "Tạo mới" thoát sang form tạo thật nếu task cần chưa tồn tại.
- Dữ liệu lấy nguyên từ `GET /tasks/today`, FE không tự lọc theo ngày, và **không phân trang** (trang này vốn dùng để xem hết việc trong ngày, không phải duyệt theo trang)
- Empty state: hình minh hoạ + "Hôm nay không có việc nào. Nghỉ ngơi thôi!" + nút thêm việc

**Đồng hồ đếm ngược (▶ Bắt đầu làm):**

- Ưu tiên hiển thị bằng **Document Picture-in-Picture** (Chrome/Edge) — một cửa sổ nổi thật sự, luôn nằm trên cùng, vẫn hiển thị kể cả khi chuyển sang tab/ứng dụng khác. Trình duyệt bắt buộc hiện một dòng nguồn gốc nhỏ ("localhost:...") trên cửa sổ này vì lý do bảo mật chống giả mạo — không có cách nào tắt được, đây là đánh đổi đã được chấp nhận để có được khả năng nổi xuyên tab.
- Trình duyệt không hỗ trợ Document PiP (Firefox, Safari) → dùng phương án dự phòng: một thẻ nổi kéo-thả tự do ngay trong trang (`position: fixed`), không có thanh địa chỉ nào cả, nhưng chỉ tồn tại trong tab đang mở.
- Đồng hồ có nút Tạm dừng/Tiếp tục, Đặt lại, phát 2 tiếng "bíp" và chuyển viền sang đỏ khi hết giờ.

---

### 3. Danh sách công việc

```
┌──────────────────────────────────────────────────────────────┐
│  Công việc                                    [+ Thêm việc]  │
│                                                                │
│  [🔍 Tìm...] [Trạng thái ▾] [Ưu tiên ▾]                       │
│                                                                │
│  ☑ Đã chọn 2 công việc                    [🗑 Xoá đã chọn]    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │☐│Tiêu đề         │Danh sách│Trạng thái│Ưu tiên│Hạn │Hành động││
│  ├──────────────────────────────────────────────────────────┤│
│  │☑│Thiết kế database│Công việc│Cần làm   │🟠 Cao │30/8│▶ ✏ 🗑││
│  │☑│Viết API spec    │Công việc│Cần làm   │🟡 TB  │31/8│▶ ✏ 🗑││
│  │☐│Dựng CI/CD       │Công việc│Cần làm   │⚪ Thấp│ —  │▶ ✏ 🗑││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  Hiển thị 1–20 / 47   Số dòng/trang [20 ▾]      [‹ 1/3 ›]     │
└──────────────────────────────────────────────────────────────┘
```

- Danh sách là **bảng thật có cột**, không còn card kéo-thả sắp xếp thủ công như trước — cột: checkbox, Tiêu đề, Danh sách, Trạng thái, Ưu tiên, Hạn chót, Hành động
- Cột **Hành động**: ▶ Bắt đầu làm (chuyển "Đang làm" + mở đồng hồ đếm ngược, cần task đã có thời lượng ước tính — xem mục 2), ✏ Chỉnh sửa (mở lại form tạo/sửa), 🗑 Xoá (archive — khác với "Bỏ khỏi hôm nay" ở màn Hôm nay, ở đây xoá thật)
- **Chọn nhiều + xoá nhiều**: tick checkbox nhiều dòng → thanh "Đã chọn N công việc" hiện ra kèm nút xoá hàng loạt, có dialog xác nhận
- **Phân trang thật**: chọn số dòng/trang 10/20/50/100, điều hướng trang trước/sau — cả `page` và `limit` đồng bộ với URL
- Bộ lọc Trạng thái/Ưu tiên/Nhãn hiển thị dạng **nút dropdown** (bấm vào mới xổ ra danh sách chọn nhiều), không phải dãy chip bấm trực tiếp; đồng bộ với URL → link chia sẻ được, F5 không mất
- Empty khi có filter: "Không có việc nào khớp bộ lọc" + nút xoá lọc
- Empty khi chưa có gì: "Chưa có công việc nào" + nút thêm

---

### 4. Chi tiết công việc (Drawer)

```
                    ┌──────────────────────────────┐
                    │  Chi tiết                 ✕  │
                    ├──────────────────────────────┤
                    │  ☐ Thiết kế database         │
                    │                              │
                    │  [Đang làm ▾]  [🟠 Cao ▾]   │
                    │  📅 30/08/2026 17:00         │
                    │  📁 Công việc                │
                    │  👤 Nguyễn Văn A             │
                    │  #DB  #Gấp              [+]  │
                    │                              │
                    │  MÔ TẢ                       │
                    │  Vẽ ERD và viết migration…   │
                    │                              │
                    │  VIỆC CON (1/3)              │
                    │  ☑ Vẽ ERD                    │
                    │  ☐ Viết migration            │
                    │  ☐ Seed dữ liệu mẫu          │
                    │  + Thêm việc con             │
                    │                              │
                    │  ĐÍNH KÈM (2)                │
                    │  📎 erd-v2.png       1.2 MB  │
                    │                              │
                    │  BÌNH LUẬN (3)               │
                    │  ┌────────────────────────┐  │
                    │  │ Viết bình luận…        │  │
                    │  └────────────────────────┘  │
                    │                              │
                    │  LỊCH SỬ                     │
                    │  • Đổi trạng thái → Đang làm │
                    │    Hôm nay 09:12             │
                    └──────────────────────────────┘
```

- Drawer 480px trượt từ phải; mobile thì full màn hình
- Sửa tại chỗ: click tiêu đề/mô tả để sửa, blur thì lưu
- Nếu task cha còn việc con chưa xong mà tick hoàn thành → toast `TASK_005` và checkbox bật lại
- Tab Lịch sử đọc từ `GET /tasks/:id/activities`

---

### 5. Thống kê

```
┌────────────────────────────────────────────────────────┐
│  Thống kê              [01/08 – 28/08 ▾]              │
│                                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│  │  64    │ │  48    │ │   5    │ │  75%   │         │
│  │ Đã tạo │ │Hoàn tất│ │Quá hạn │ │Tỉ lệ HT│         │
│  └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                        │
│  HOÀN THÀNH THEO NGÀY                                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │      ╱╲      ╱╲                                  │ │
│  │  ╱╲╱  ╲╱╲  ╱  ╲╱╲                               │ │
│  │ 01  05  10  15  20  25                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─────────────────────┐ ┌──────────────────────────┐ │
│  │ THEO TRẠNG THÁI     │ │ THEO ĐỘ ƯU TIÊN          │ │
│  │      ◕ Pie          │ │  ▇▇▇▇ Khẩn   4          │ │
│  │                     │ │  ▇▇▇▇▇▇▇ Cao 18         │ │
│  └─────────────────────┘ └──────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

- Khoảng ngày lưu trong URL params
- Chỉ hiện đúng 4 thẻ số — nhiều hơn thì không ai đọc
- Biểu đồ khi không có dữ liệu: khung xám + "Chưa có dữ liệu trong khoảng này"
- Admin có thêm tab "Toàn hệ thống" và bảng hiệu suất theo user

---

### 6. Lịch sử

```
┌────────────────────────────────────────────────────────┐
│  Lịch sử                      [Hành động ▾][Ngày ▾]   │
│                                                        │
│  HÔM NAY                                              │
│  ● 09:12  Hoàn thành  "Viết tài liệu API"            │
│           Đang làm → Hoàn thành                       │
│  ● 08:30  Tạo mới     "Thiết kế database"            │
│                                                        │
│  HÔM QUA                                              │
│  ● 16:45  Bình luận   "Dựng CI/CD"                   │
│  ● 14:02  Đã xoá      "Task cũ"        (không mở được)│
│                                                        │
│                  [Tải thêm]                           │
└────────────────────────────────────────────────────────┘
```

- Timeline dọc, gom nhóm theo ngày
- `useInfiniteQuery`, nút "Tải thêm" thay vì cuộn vô hạn (dễ kiểm soát hơn)
- Task đã xoá (`taskDeleted = true`) hiển thị chữ xám, không có link
- Icon và màu theo `action`: tạo (xanh lá), đổi trạng thái (xanh dương), xoá (đỏ), bình luận (xám)

---

### 7. Quản lý người dùng (Admin)

```
┌────────────────────────────────────────────────────────┐
│  Người dùng                          [+ Thêm user]     │
│                                                        │
│  [🔍 Tìm...] [Vai trò ▾] [Trạng thái ▾]               │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Người dùng      Vai trò  Trạng thái  Đăng nhập  │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ 🅐 Nguyễn Văn A  Admin   ● Hoạt động  Hôm nay ⋮ │ │
│  │    a@example.com                                 │ │
│  │ 🅑 Trần Thị B    Member  ● Hoạt động  2 ngày  ⋮ │ │
│  │ 🅒 Lê Văn C      Member  ○ Đã khoá    30 ngày ⋮ │ │
│  └──────────────────────────────────────────────────┘ │
│  Hiển thị 1–20 / 34             [‹ 1 2 ›]            │
└────────────────────────────────────────────────────────┘
```

- Menu `⋮`: Xem chi tiết / Đổi vai trò / Khoá tài khoản / Đặt lại mật khẩu
- Đổi vai trò và khoá tài khoản đều mở dialog xác nhận, ghi rõ hệ quả: "Người dùng sẽ bị đăng xuất khỏi mọi thiết bị"
- Hàng của chính admin đang đăng nhập: khoá 2 hành động Đổi vai trò và Khoá (`USER_002`, `USER_003`)
- Trang này không xuất hiện trong sidebar nếu `role !== 'admin'`

---

## Component States

Mọi trang có tải dữ liệu **bắt buộc** xử lý đủ 4 trạng thái:

| Trạng thái | Cách hiển thị |
|------------|---------------|
| Loading | Skeleton đúng hình dạng nội dung thật, không dùng spinner toàn trang |
| Error | Icon + "Không tải được dữ liệu" + nút "Thử lại" |
| Empty | Hình minh hoạ + câu giải thích + nút hành động chính |
| Success | Nội dung |

**Phân biệt 2 loại empty:** chưa có dữ liệu (mời tạo mới) khác với lọc không ra kết quả (mời xoá bộ lọc). Dùng chung một câu là trải nghiệm tệ.

---

## Feedback Patterns

| Tình huống | Cách phản hồi |
|------------|---------------|
| Thao tác thành công nhanh (tick, kéo-thả) | Đổi UI ngay, không toast |
| Tạo/sửa/xoá qua form | Toast xanh 3 giây |
| Lỗi từ API | Toast đỏ, nội dung lấy từ `ERROR_MESSAGES[code]` |
| Lỗi validate form | Chữ đỏ ngay dưới ô nhập, không toast |
| Hành động không hoàn tác được | Dialog xác nhận, nút nguy hiểm màu đỏ |
| Đang gửi request | Nút disable + spinner trong nút |

---

## Accessibility

- Mọi nút chỉ có icon phải có `aria-label`
- Checkbox task: `aria-label="Đánh dấu hoàn thành: {tiêu đề}"`
- Modal/drawer: focus trap, `Esc` để đóng, trả focus về nút mở
- Kéo-thả sắp xếp danh sách ở sidebar (dnd-kit) bật sensor bàn phím (Space để nhấc, mũi tên để di chuyển) — bảng công việc ở màn Hôm nay/Danh sách công việc không còn kéo-thả, dùng checkbox + nút Hành động thay thế
- Tương phản chữ/nền tối thiểu 4.5:1
- Vùng chạm tối thiểu 44×44px trên mobile
