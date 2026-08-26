# Nrapp

Nrapp là ứng dụng Expo/React Native dành cho hai nhóm người dùng:

- **Khối quản trị**: các role `admin`, `manager`, `chef`.
- **Nhân viên**: role `user` và các role không thuộc khối quản trị.

Ứng dụng có các chức năng chính: đăng nhập bằng OTP, chat realtime, quản lý
công việc, đăng ký lịch làm việc, duyệt lịch và chấm công bằng QR.

Tài liệu này giải thích từ ngoài vào trong: cách chạy dự án, cơ chế routing,
luồng dữ liệu và nhiệm vụ của từng thư mục, từng file.

## 1. Cách hiểu nhanh kiến trúc

Luồng thông thường của một chức năng:

```text
URL
  ↓
app/.../route.tsx
  ↓
src/features/.../Screen hoặc View
  ↓
src/services/<nghiệp vụ>/<nghiệp vụ>.service.ts
  ↓
Axios → Backend
```

Các phần có trách nhiệm rõ ràng:

- `app/` quyết định URL nào mở màn hình nào.
- `src/features/` chứa state và giao diện của từng chức năng.
- `src/services/` chứa hàm gọi backend và định nghĩa dữ liệu.
- `src/application/` chứa quy tắc role, quyền truy cập và đường dẫn dùng chung.
- `src/components/` chứa component khung dùng ở nhiều màn hình.
- `src/utils/` chứa Axios, địa chỉ server và helper HTTP.

## 2. Cài đặt và chạy dự án

```bash
npm install
npm start
```

Các lệnh chạy theo nền tảng:

```bash
# Android Emulator: dùng localhost + ADB reverse, ổn định hơn LAN
npm run android

# Thiết bị Android thật cùng Wi-Fi
npm run android:lan

# Thiết bị thật không truy cập được máy qua LAN/firewall
npm run android:tunnel

npm run ios
npm run web
```

`npm start` cũng mặc định dùng `localhost` cho emulator. Nếu cần quét QR bằng
thiết bị thật, dùng `npm run start:lan` hoặc `npm run start:tunnel`.

Tạo `.env.local` hoặc cấu hình biến môi trường:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_PATH=/socket.io
EXPO_PUBLIC_API_TIMEOUT_MS=10000
```

Ý nghĩa:

- `EXPO_PUBLIC_API_URL`: địa chỉ gốc của REST API. Production bắt buộc có.
- `EXPO_PUBLIC_SOCKET_URL`: địa chỉ Socket.IO; nếu bỏ trống sẽ suy ra từ API.
- `EXPO_PUBLIC_SOCKET_PATH`: đường dẫn Socket.IO, mặc định `/socket.io`.
- `EXPO_PUBLIC_API_TIMEOUT_MS`: timeout Axios, mặc định 10 giây.

Khi chạy trên thiết bị thật mà không khai báo URL, `src/utils/ip.ts` cố lấy IP
của máy chạy Expo. Android Emulator dùng `10.0.2.2`.

## 3. Cơ chế routing của Expo Router

### 3.1 Tại sao mỗi route phải có một file?

Expo Router dùng **file-based routing**: cây file trong `app/` chính là bảng
route. Tên file không chỉ để chứa code, nó còn tạo URL.

Ví dụ:

```text
app/(main)/user/chat.tsx → /user/chat
app/(main)/admin/todo.tsx → /admin/todo
```

Vì vậy các route file chỉ có vài dòng là bình thường. Chúng làm đúng một việc:
trỏ URL sang component thật trong `src/features/`. Logic nghiệp vụ không đặt
trong những file này.

### 3.2 Các quy tắc đặt tên

- `_layout.tsx`: layout bao quanh toàn bộ route con trong cùng thư mục.
- `index.tsx`: route mặc định của thư mục.
- `[id].tsx`: route động; `id` được lấy từ URL.
- `(auth)` và `(main)`: route group. Dấu ngoặc giúp nhóm file nhưng tên group
  không xuất hiện trong URL hiển thị.
- `router.push(...)`: mở route mới và vẫn cho phép quay lại.
- `router.replace(...)`: thay route hiện tại, thường dùng khi đăng nhập hoặc
  redirect để người dùng không quay lại màn cũ.
- `<Slot />`: vị trí Expo Router render route con phù hợp.
- `<Stack />`: điều khiển nhóm màn hình theo kiểu stack navigation.

Trong `src/features/<nghiệp vụ>/`, giao diện sau đăng nhập tuân theo ba nhánh:

- `admin/`: màn hình, hook và UI chỉ dành cho khối quản trị.
- `user/`: màn hình, hook và UI chỉ dành cho khối người dùng.
- `shared/`: logic hoặc component được cả hai nhánh sử dụng.

Route admin chỉ import màn hình từ nhánh `admin`, route user chỉ import màn hình
từ nhánh `user`. ESLint chặn import chéo giữa `admin/` và `user/`; mã cần dùng
chung phải được chuyển vào `shared/`.

### 3.3 Bảng URL hiện tại

| File route | URL | Component được mở |
| --- | --- | --- |
| `app/index.tsx` | `/` | Kiểm tra phiên đăng nhập rồi redirect |
| `app/(auth)/login.tsx` | `/login` | Màn đăng nhập |
| `app/(auth)/register.tsx` | `/register` | Màn đăng ký |
| `app/(auth)/verify.tsx` | `/verify?email=...` | Nhập OTP và lưu phiên |
| `app/(main)/admin/home.tsx` | `/admin/home` | `AdminHomeScreen` |
| `app/(main)/admin/chat.tsx` | `/admin/chat` | `AdminChatScreen` |
| `app/(main)/admin/todo.tsx` | `/admin/todo` | `AdminTodoScreen` |
| `app/(main)/admin/workschedule.tsx` | `/admin/workschedule` | `AdminWorkscheduleScreen` |
| `app/(main)/user/home.tsx` | `/user/home` | `UserHomeScreen` |
| `app/(main)/user/chat.tsx` | `/user/chat` | `UserChatScreen` |
| `app/(main)/user/todo.tsx` | `/user/todo` | `UserTodoScreen` |
| `app/(main)/user/workschedule/index.tsx` | `/user/workschedule` | `UserWorkscheduleScreen` |

Trong code có thể dùng đường dẫn kèm group như `/(main)/user/home`. Expo Router
dùng group để chọn đúng layout nhưng URL người dùng thấy vẫn là `/user/home`.

### 3.4 Thứ tự layout được chạy

Khi mở `/user/chat`, cây render là:

```text
app/_layout.tsx
  └── app/(main)/_layout.tsx
      └── app/(main)/user/_layout.tsx
          └── app/(main)/user/chat.tsx
              └── src/features/chat/user/screens/UserChatScreen.tsx
                  └── src/features/chat/shared/ui/ChatView.tsx
```

Ý nghĩa:

1. Root layout tạo Auth Context, Socket Context, theme và safe area.
2. Main layout kiểm tra đăng nhập, vẽ header, bottom bar và các modal chung.
3. User layout dùng `AreaGuard` để chặn tài khoản admin vào khu user và ngược
   lại.
4. File `chat.tsx` map route sang giao diện Chat.

### 3.5 Luồng redirect khi mở ứng dụng

```text
Mở app
  ↓
AuthSessionProvider đọc token
  ↓
Có token? ── không ──→ /login
  │
  có
  ↓
GET /user/me
  ↓
getAreaForRole(role)
  ├── admin/manager/chef → /admin/home
  └── role khác          → /user/home
```

`AreaGuard` kiểm tra lại quyền tại layout. Đây là lớp bảo vệ thứ hai nếu người
dùng tự nhập URL không đúng khu vực.

## 4. Cây thư mục và nhiệm vụ từng file

### 4.1 Thư mục `app/` — route và layout

#### Cấp gốc

- `app/_layout.tsx`: layout cao nhất. Import CSS, cấu hình Reanimated, bọc app
  bằng `SafeAreaProvider`, `AuthSessionProvider`, `ChatSocketProvider`, theme và
  khai báo ba stack `index`, `(auth)`, `(main)`.
- `app/index.tsx`: màn trung gian khi mở `/`. Chờ Auth Context kiểm tra token,
  sau đó redirect đến login hoặc trang chủ phù hợp với role. Trong lúc chờ chỉ
  hiện loading.

#### Nhóm `app/(auth)/`

- `app/(auth)/_layout.tsx`: stack riêng cho login, register và verify; tắt header
  mặc định của navigation.
- `app/(auth)/login.tsx`: quản lý form email/mật khẩu, gọi `loginUser`, sau đó
  chuyển email sang màn OTP. Nếu đã đăng nhập thì tự về trang chủ đúng role.
- `app/(auth)/register.tsx`: kiểm tra form đăng ký và mật khẩu xác nhận, gọi
  `registerUser`, rồi quay về login.
- `app/(auth)/verify.tsx`: đọc `email` từ query params, quản lý sáu ô OTP, gọi
  `verifyOtp`, lưu token, cập nhật Auth Context và redirect theo role.

#### Nhóm `app/(main)/`

- `app/(main)/_layout.tsx`: khung chung sau đăng nhập. Nó chứa stack admin/user,
  header, thanh điều hướng dưới, modal quét QR và bảng thông tin cá nhân. Nếu
  phiên đăng nhập mất thì redirect về login.

#### Khu `app/(main)/admin/`

- `app/(main)/admin/_layout.tsx`: gọi `AreaGuard area="admin"`; chỉ role thuộc
  khối quản trị được render route con.
- `app/(main)/admin/home.tsx`: mở `AdminHomeScreen`.
- `app/(main)/admin/chat.tsx`: mở `AdminChatScreen`.
- `app/(main)/admin/todo.tsx`: mở `AdminTodoScreen`, cho phép tạo, giao và
  xóa công việc.
- `app/(main)/admin/workschedule.tsx`: mở `AdminWorkscheduleScreen` để
  hiển thị màn quản trị lịch, chính sách, QR và báo cáo.

#### Khu `app/(main)/user/`

- `app/(main)/user/_layout.tsx`: gọi `AreaGuard area="user"`; chỉ nhân viên được
  render route con.
- `app/(main)/user/home.tsx`: mở `UserHomeScreen`.
- `app/(main)/user/chat.tsx`: mở `UserChatScreen`.
- `app/(main)/user/todo.tsx`: mở `UserTodoScreen`; nhân viên chỉ xem task
  được giao và cập nhật trạng thái.
- `app/(main)/user/workschedule/index.tsx`: mở `UserWorkscheduleScreen`
  cho lịch nhân viên.

### 4.2 `src/application/` — quy tắc toàn ứng dụng

#### `src/application/access/`

- `roles.ts`: định nghĩa khu `admin/user`, danh sách role quản trị và các hàm
  `isAdminRole`, `getAreaForRole`, `canAccessArea`.
- `AreaGuard.tsx`: đọc user từ Auth Context. Khi đang tải thì hiện spinner; chưa
  đăng nhập thì về login; sai khu vực thì chuyển sang home đúng role; hợp lệ thì
  render `<Slot />`.

#### `src/application/navigation/`

- `routes.ts`: nơi khai báo tập trung đường dẫn login, home, chat, todo và
  workschedule. `createAreaRoutes` tạo cùng cấu trúc route cho admin/user;
  `getAreaRoutes(area)` trả bộ route đúng khu vực.

### 4.3 `src/components/layout/` — giao diện khung dùng chung

- `MainBottomBar.tsx`: thanh dưới của khu vực đăng nhập. Nút trái về home, nút
  giữa mở máy quét QR, nút phải mở profile. Route home được chọn theo area.

### 4.4 `src/services/` — gọi backend và định nghĩa dữ liệu

Mỗi nghiệp vụ có đúng hai file:

```text
<nghiệp vụ>/
├── <nghiệp vụ>.service.ts  # Chỉ chứa hàm Axios
└── constant.ts             # Type, interface và giá trị cố định
```

Service có dạng thống nhất:

```ts
export async function someRequest(token: string, payload: Payload) {
  return axios.patch(
    `${ipNR}/endpoint`,
    payload,
    getAuthHeader(token),
  );
}
```

#### `src/services/auth/`

- `constant.ts`: chứa `TOKEN_KEY`, key token cũ, payload register/login/OTP,
  message response và `AuthSessionResponse`.
- `auth.service.ts`: chứa `registerUser`, `loginUser`, `verifyOtp`; đồng thời
  lưu, đọc và xóa token bằng AsyncStorage.

#### `src/services/user/`

- `constant.ts`: định nghĩa role và cấu trúc `User` dùng trên toàn app.
- `user.service.ts`: `getUserProfile(token)` lấy user hiện tại và
  `getAllUsers(token)` lấy danh sách user cho Chat/Todo admin.

#### `src/services/chat/`

- `constant.ts`: định nghĩa user trong chat, file ảnh upload, bản ghi chat,
  chat đã normalize và message.
- `chat.service.ts`: tạo chat, lấy danh sách chat, gửi message và lấy message
  theo chat ID. File này cũng tạo `FormData` cho ảnh trên web/mobile.

#### `src/services/todo/`

- `constant.ts`: định nghĩa trạng thái, độ ưu tiên, task, payload tạo task và
  các map dùng để hiển thị label/màu/icon.
- `todo.service.ts`: lấy task admin, lấy task của user, tạo task, giao task, cập
  nhật trạng thái và xóa task.

#### `src/services/workschedule/`

- `constant.ts`: chứa toàn bộ kiểu lịch, entry, policy, request admin, attendance,
  heatmap, query, kết quả scan và danh sách lựa chọn hiển thị lịch.
- `workschedule.service.ts`: chứa toàn bộ REST endpoint của lịch làm việc:
  policy, lịch cá nhân, tạo/sửa/nộp/xóa request, danh sách admin, duyệt/từ chối,
  duyệt hàng loạt, heatmap, QR, chấm công và báo cáo.

### 4.5 `src/features/auth/`

- `model/AuthSessionContext.tsx`: nguồn trạng thái đăng nhập chung của app. Khi
  khởi động, context đọc token và gọi `getUserProfile`. Nó cung cấp `user`,
  `isAuth`, `loading`, `getToken`, setter dùng sau OTP và hàm logout.

### 4.6 Danh bạ, hồ sơ và dữ liệu người dùng

- `src/shared/model/normalize-user.ts`: chuẩn hóa dữ liệu user không đồng nhất
  từ backend để mọi feature nhận `_id`, `name`, `email`, `role` ổn định.
- `src/features/directory/admin/screens/AdminDirectoryScreen.tsx`: điểm vào danh
  bạ của admin.
- `src/features/directory/user/screens/UserDirectoryScreen.tsx`: điểm vào danh
  bạ của user.
- `src/features/directory/shared/screens/DirectoryScreen.tsx`: giao diện danh bạ
  dùng chung, nhận `AppArea` để áp dụng quyền và màu phù hợp.
- `src/features/profile/admin/` và `src/features/profile/user/`: điểm vào hồ sơ
  riêng theo vai trò; giao diện dùng chung nằm trong `profile/shared/`.

### 4.7 `src/features/chat/`

#### Admin/user entry

- `admin/screens/AdminChatScreen.tsx`: điểm vào Chat của route admin.
- `user/screens/UserChatScreen.tsx`: điểm vào Chat của route user.

#### Shared

- `shared/model/ChatSocketContext.tsx`: sau khi có user và token, tạo kết nối Socket.IO;
  giữ socket cùng danh sách user online; đăng ký log lỗi/kết nối và tự disconnect
  khi unmount hoặc đổi user.
- `shared/ui/ChatView.tsx`: component điều phối chính. Nó tải danh sách user/chat,
  chọn cuộc trò chuyện, tải message, tạo chat, gửi text/ảnh, xử lý typing và các
  event realtime `newMessage`, `userTyping`, `messagesSeen`.
- `shared/ui/ChatHeader.tsx`: header của cuộc trò chuyện đang mở; hiển thị tên, online
  và trạng thái đang nhập.
- `shared/ui/ChatSideBar.tsx`: danh sách cuộc trò chuyện và danh sách nhân viên để tạo
  chat mới; hỗ trợ tìm kiếm, unseen badge và refresh.
- `shared/ui/ChatMessages.tsx`: loại message trùng, render bubble trái/phải, ảnh, thời
  gian, trạng thái seen và tự cuộn xuống message mới nhất.
- `shared/ui/MessageInput.tsx`: nhập nội dung, chọn/xóa ảnh preview và gửi message; tự
  khóa nút trong lúc đang gửi.

### 4.8 `src/features/home/`

- `admin/screens/AdminHomeScreen.tsx` và `user/screens/UserHomeScreen.tsx`: hai
  điểm vào riêng cho route admin/user.
- `shared/ui/HomeDashboard.tsx`: trang tổng quan dùng chung cho hai area. Hiển thị user,
  ngày hiện tại, shortcut tới Chat/Todo/Workschedule. Với nhân viên, màn hình tải
  lịch tuần hiện tại để hiển thị lịch hôm nay và ngày mai.

### 4.9 `src/features/todo/`

- `admin/screens/AdminTodoScreen.tsx` và `user/screens/UserTodoScreen.tsx`: điểm
  vào riêng theo vai trò và quyết định quyền thao tác.
- `shared/ui/TodoView.tsx`: component điều phối Todo. Nhận `AppArea`, chọn API theo khu
  vực và quản lý loading/refresh/form, danh sách user cùng các thao tác CRUD.
- `shared/ui/TodoIntroCard.tsx`: phần giới thiệu khác nhau giữa admin và user.
- `shared/ui/TodoCreateTaskCard.tsx`: form admin tạo task, chọn deadline, độ ưu tiên và
  người được giao.
- `shared/ui/TodoTaskListCard.tsx`: render danh sách task, trạng thái, người giao/nhận;
  hiển thị nút giao việc, đổi trạng thái hoặc xóa theo quyền.

### 4.10 `src/features/workschedule/`

#### Nhánh admin

- `admin/screens/`: toàn bộ điểm vào route lịch, tiện ích, lịch tháng, đơn từ và
  thống kê của admin. `AdminWorkscheduleScreen` tự kiểm tra quyền quản lý lịch.
- `admin/hooks/useWorkscheduleAdmin.ts`: thao tác policy, pending/all schedules,
  duyệt/từ chối, heatmap, QR, attendance và report.
- `admin/model/AdminWorkscheduleContext.tsx`: kho state của màn quản trị lịch.
- `admin/ui/`: dashboard, policy, QR, duyệt lịch, duyệt đơn và báo cáo admin.

#### Nhánh user

- `user/screens/`: toàn bộ điểm vào route lịch, tiện ích, lịch tháng, đơn từ và
  thống kê của user. Các file này chỉ kết nối route user với màn hình phù hợp.

#### Nhánh dùng chung

- `shared/hooks/usePersonalWorkschedule.ts`: tải policy, lịch và chấm công cá nhân.
- `shared/hooks/useWorkRequests.ts`: tạo và tải các đơn từ của người đang đăng nhập.
- `shared/screens/PersonalWorkscheduleScreen.tsx`: lịch cá nhân dùng được ở cả
  hai area khi tài khoản không có quyền quản lý.
- `shared/screens/WorkCalendarScreen.tsx`, `MonthlyOverviewScreen.tsx` và
  `WorkRequestHubScreen.tsx`: các màn hình dữ liệu cá nhân dùng chung.
- `shared/ui/AttendanceScannerModal.tsx`: quét QR chấm công toàn ứng dụng.
- `shared/ui/DayScheduleEditor.tsx`, `WeekPicker.tsx`: UI chỉnh lịch cá nhân.
- `shared/utils/date.ts`: xử lý ngày, tuần, policy và định dạng tiếng Việt.

### 4.11 `src/shared/`

- `hooks/useColorScheme.ts`: dùng color scheme gốc của React Native trên mobile.
- `hooks/useColorScheme.web.ts`: đợi web hydrate rồi mới trả color scheme, tránh
  giao diện server/client không khớp khi static rendering.

### 4.12 `src/utils/`

- `axios.ts`: tạo Axios instance chung, đặt timeout và header `Accept`.
- `ip.ts`: tạo `ipNR`, `socketUrl`, `socketPath` từ biến môi trường hoặc môi
  trường Expo/Android Emulator.
- `apiHelper.ts`: `getAuthHeader(token)` tạo Bearer header;
  `getApiErrorMessage` đọc message lỗi Axios và trả fallback dễ hiển thị.

### 4.13 `assets/images/`

- `icon.png`: icon ứng dụng chính.
- `splash-icon.png`: ảnh màn hình splash.
- `favicon.png`: favicon bản web.
- `android-icon-foreground.png`: lớp trước của adaptive icon Android.
- `android-icon-background.png`: lớp nền của adaptive icon Android.
- `android-icon-monochrome.png`: icon đơn sắc Android.
- `bg1.png`: ảnh nền được `HomeDashboard` sử dụng.

### 4.14 `docs/`

- `docs/chat-flow.md`: tài liệu Chat được viết từ kiến trúc cũ. Phần khái niệm
  REST/Socket vẫn hữu ích nhưng một số tên context và đường dẫn đã cũ; khi đọc
  hãy ưu tiên source hiện tại và phần Chat trong README này.

### 4.15 File cấu hình ở thư mục gốc

- `.env.example`: mẫu các biến môi trường cần cấu hình.
- `.gitignore`: danh sách file sinh tự động hoặc bí mật không commit vào Git.
- `app.json`: cấu hình Expo: tên app, scheme, icon, splash, Android/iOS/web,
  plugin, typed routes và React Compiler.
- `package.json`: dependency và các npm script của dự án.
- `package-lock.json`: khóa đúng phiên bản dependency để mọi máy cài giống nhau;
  không sửa tay.
- `tsconfig.json`: bật TypeScript strict và alias `@/*` trỏ từ root dự án.
- `babel.config.js`: Babel preset của Expo, tích hợp NativeWind và Reanimated.
- `metro.config.js`: cấu hình Metro đọc NativeWind từ `global.css`.
- `tailwind.config.js`: cấu hình class Tailwind/NativeWind.
- `global.css`: khai báo Tailwind base, components và utilities.
- `eslint.config.js`: cấu hình ESLint Expo và bỏ qua thư mục build `dist`.
- `expo-env.d.ts`: khai báo type môi trường Expo Router cho TypeScript.
- `nativewind-env.d.ts`: khai báo type NativeWind cho prop `className`.
- `scripts/reset-project.js`: script mẫu của Expo để đưa dự án về trạng thái
  trắng. **Không chạy trong dự án hiện tại** vì nó có thể di chuyển hoặc xóa
  thư mục `app`.
- `src/README.md`: bản quy tắc kiến trúc rút gọn dành cho lúc phát triển.
- `README.md`: tài liệu tổng thể mà bạn đang đọc.

### 4.16 Thư mục được sinh tự động

- `node_modules/`: package được npm cài; không sửa và không commit.
- `.expo/`: cache/trạng thái Expo trên máy local.
- `dist/`: kết quả `expo export`; có thể tạo lại, không viết source tại đây.

## 5. Luồng Auth chi tiết

### Đăng nhập

```text
login.tsx
  → loginUser(email, password)
  → backend gửi OTP
  → router.push(/verify?email=...)
  → verifyOtp(email, otp)
  → saveAuthSession(token)
  → cập nhật AuthSessionContext
  → redirect theo role
```

### Khởi động lại ứng dụng

```text
AuthSessionProvider
  → getStoredToken()
  → getUserProfile(token)
  → normalizeUser(response)
  → setUser + setIsAuth(true)
```

### Đăng xuất

```text
ProfileScreen
  → logoutUser()
  → clearAuthSession()
  → xóa user/isAuth trong context
  → router.replace(/login)
```

## 6. Luồng REST API

Ví dụ người dùng cập nhật trạng thái Todo:

```text
TodoTaskListCard
  → callback của TodoView
  → getToken()
  → updateTodoStatus(token, taskId, status)
  → axios.patch(url, payload, getAuthHeader(token))
  → backend
  → loadTasks() để tải lại giao diện
```

Nguyên tắc:

- UI không tự viết URL backend.
- URL và Axios nằm trong `*.service.ts`.
- Dữ liệu/type nằm trong `constant.ts` cùng nghiệp vụ.
- Token được truyền rõ ràng vào service.
- Lỗi Axios được chuyển thành text bằng `getApiErrorMessage`.

## 7. Luồng Chat realtime

REST API chịu trách nhiệm tải/tạo dữ liệu; Socket.IO chịu trách nhiệm báo thay
đổi tức thời:

```text
Mở ChatView
  ├── getAllUsers(token)
  ├── getChats(token)
  └── ChatSocketContext kết nối socket

Chọn chat
  → getChatMessages(token, chatId)

Gửi tin
  → sendChatMessage(...)
  → cập nhật danh sách local
  → socket phát newMessage cho client liên quan
```

Các event chính: `newMessage`, `userTyping`, `userTypingStop`, `messagesSeen`,
`getOnlineUsers`.

## 8. Cách thêm một route mới

Ví dụ thêm `/user/notification`:

1. Tạo giao diện thật tại `src/features/notification/...`.
2. Tạo `app/(main)/user/notification.tsx` và return giao diện đó.
3. Nếu admin cũng dùng, tạo route admin mỏng trỏ vào cùng component.
4. Thêm đường dẫn vào `src/application/navigation/routes.ts` nếu nhiều nơi cần
   điều hướng đến nó.
5. Không đặt gọi API hoặc state lớn trong file route.

## 9. Cách thêm một endpoint mới

Ví dụ thêm API hủy Todo:

1. Nếu cần type/payload mới, thêm vào `src/services/todo/constant.ts`.
2. Thêm một hàm rõ tên trong `src/services/todo/todo.service.ts`.

```ts
export async function cancelTodoTask(token: string, taskId: string) {
  return axios.patch(
    `${ipNR}/todo/${encodeURIComponent(taskId)}/cancel`,
    {},
    getAuthHeader(token),
  );
}
```

3. Import hàm đó tại View hoặc hook cần dùng.
4. Lấy token bằng `useAuthSession().getToken()`.
5. Gọi lại hàm load sau khi request thành công nếu cần đồng bộ UI.

## 10. Cách tìm code khi sửa lỗi

- Sai URL hoặc payload: xem `src/services/<nghiệp vụ>/*.service.ts`.
- Sai type/label/trạng thái: xem `src/services/<nghiệp vụ>/constant.ts`.
- Sai redirect hoặc URL frontend: xem `app/` và `application/navigation`.
- User vào nhầm khu admin/user: xem `application/access`.
- Sai loading, Alert hoặc trình tự gọi request: xem hook hoặc View chính.
- Sai bố cục/hiển thị riêng theo vai trò: xem
  `features/<nghiệp vụ>/<admin|user>/`; phần dùng chung xem
  `features/<nghiệp vụ>/shared/`.
- Chat không realtime: xem `ChatSocketContext.tsx` và listener trong
  `ChatView.tsx`.
- Lịch admin không đồng bộ: xem `AdminWorkscheduleContext.tsx`.

## 11. Kiểm tra trước khi commit

```bash
npm run lint
npx tsc --noEmit
EXPO_PUBLIC_API_URL=http://localhost:3000/api npx expo export --platform web
```

- `lint`: kiểm tra import, React hook và quy tắc code.
- `tsc`: kiểm tra type mà không tạo file build.
- `expo export`: kiểm tra Metro bundle và toàn bộ route có build được không.

Không sửa source trong `dist/` hoặc `node_modules/` vì hai thư mục này đều có
thể được tạo lại.
