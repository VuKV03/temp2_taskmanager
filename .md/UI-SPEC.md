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
| `primary` | `#4F46E5` | Nút chính, link, trạng thái active |
| `primary-hover` | `#4338CA` | Hover nút chính |
| `surface` | `#FFFFFF` | Nền thẻ, modal |
| `background` | `#F9FAFB` | Nền trang |
| `border` | `#E5E7EB` | Viền, đường kẻ |
| `text` | `#111827` | Chữ chính |
| `text-muted` | `#6B7280` | Chữ phụ, mô tả |

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
│  [☰] Task Manager        [🔍 Tìm]    [🔔 3]  [Avatar ▾]    │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│  Sidebar      │  Content                                   │
│  (240px)      │  (max-width 1200px, padding 24px)          │
│               │                                            │
│  ▸ Hôm nay    │                                            │
│  ▸ Tất cả     │                                            │
│  ▸ Thống kê   │                                            │
│  ▸ Lịch sử    │                                            │
│  ───────────  │                                            │
│  DANH SÁCH    │                                            │
│  • Cá nhân    │                                            │
│  • Công việc  │                                            │
│  + Thêm       │                                            │
│  ───────────  │                                            │
│  ▸ Người dùng │  ← chỉ hiện khi role = admin               │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
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
┌────────────────────────────────────────────────────────┐
│  Hôm nay                          Thứ Sáu, 28/08/2026  │
│                                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐                     │
│  │   5    │ │   2    │ │   1    │                     │
│  │ Hôm nay│ │Đã xong │ │Quá hạn │                     │
│  └────────┘ └────────┘ └────────┘                     │
│                                                        │
│  ⚠ QUÁ HẠN (1)                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ☐  Gửi báo cáo tháng 7          🔴 Cao          │ │
│  │    Công việc · Quá hạn 3 ngày   #Gấp            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  HÔM NAY (5)                          [+ Thêm việc]   │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ☐  Họp team                     🟡 Trung bình   │ │
│  │    Công việc · 14:00 · 1/3 việc con             │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ ☑  Viết tài liệu API            🟠 Cao          │ │
│  │    ~~Đã hoàn thành lúc 09:12~~                  │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

- **Quá hạn luôn nằm trên**, có viền trái đỏ 3px
- Tick checkbox → gạch ngang + mờ dần, không biến mất khỏi danh sách (người dùng cần thấy mình đã làm gì)
- Dữ liệu lấy nguyên từ `GET /tasks/today`, FE không tự lọc theo ngày
- Empty state: hình minh hoạ + "Hôm nay không có việc nào. Nghỉ ngơi thôi!" + nút thêm việc

---

### 3. Danh sách công việc

```
┌────────────────────────────────────────────────────────┐
│  Công việc                            [+ Thêm việc]    │
│                                                        │
│  [🔍 Tìm...] [Trạng thái ▾][Ưu tiên ▾][Nhãn ▾] [Xoá]  │
│                                                        │
│  ⣿ ☐  Thiết kế database        🟠 Cao   30/08  #DB    │
│  ⣿ ☐  Viết API spec            🟡 TB    31/08         │
│  ⣿ ☐  Dựng CI/CD               ⚪ Thấp   —            │
│                                                        │
│  Hiển thị 1–20 / 47        [‹ 1 2 3 ›]                │
└────────────────────────────────────────────────────────┘
```

- `⣿` là tay cầm kéo-thả (dnd-kit), chỉ hiện khi hover
- Bộ lọc đồng bộ với URL → link chia sẻ được, F5 không mất
- Kéo-thả cập nhật lạc quan; lỗi thì trả về vị trí cũ kèm toast
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
- Kéo-thả dnd-kit bật sensor bàn phím (Space để nhấc, mũi tên để di chuyển)
- Tương phản chữ/nền tối thiểu 4.5:1
- Vùng chạm tối thiểu 44×44px trên mobile
