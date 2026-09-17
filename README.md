# Nrapp

## Tải ứng dụng Android

**[Tải APK mới nhất](https://github.com/lethanh2006/Nrapp/releases/latest/download/Nrapp.apk)**

Bản 1.0.3: khoảng 31,5 MB, Android 7.0 trở lên. Tải xong mở file `.apk`
và cho phép cài ứng dụng từ trình duyệt nếu Android yêu cầu.
[Thông tin bản phát hành mới nhất](https://github.com/lethanh2006/Nrapp/releases/latest).

Nrapp là frontend Expo/React Native kết nối với Service Gateway cho các nghiệp
vụ nội bộ: xác thực OTP, danh bạ, hồ sơ, chat realtime, công việc, căn tin,
lịch làm, đơn nhân sự và chấm công QR.

Ứng dụng có hai khu giao diện tách biệt:

- Khu admin: `admin`, `manager`, `chef`, `cashier`, `waiter`.
- Khu user: `user`, `vip`; role chưa biết hiện cũng được đưa về khu user.

## Tài liệu nên đọc

- [Kiến trúc và luồng hoạt động](docs/kien-truc-va-luong-hoat-dong.md): tài
  liệu nguồn chuẩn, giải thích chi tiết từng thư mục, route, role, feature,
  service, endpoint và vị trí cần sửa.
- [Luồng Chat realtime](docs/chat-flow.md): tài liệu chuyên sâu cho REST,
  Socket.IO, typing, seen và upload ảnh.

Nếu README và source có khác biệt, ưu tiên source. Khi thay đổi route, role hoặc
hợp đồng Gateway, hãy cập nhật tài liệu kiến trúc trong cùng commit.

## Kiến trúc nhanh

```text
URL / thao tác người dùng
  → route mỏng trong app/
  → screen riêng trong src/features/<feature>/<admin|user>/
  → hook/context nếu feature cần
  → service trong src/services/<domain>/
  → Axios hoặc Socket.IO
  → Service Gateway
```

Các lớp chính:

| Vị trí | Trách nhiệm |
| --- | --- |
| `app/` | Expo Router, layout, URL và route guard |
| `src/application/` | Phân khu role, quyền và route constants |
| `src/features/` | Screen, UI, hook và state theo tính năng |
| `src/services/` | REST endpoint, payload, response và domain type |
| `src/shared/` | Hạ tầng thật sự dùng chung toàn ứng dụng |
| `src/components/` | Component khung dùng ở nhiều tính năng |
| `src/utils/` | URL Gateway, Axios và chuẩn hóa lỗi HTTP |

Luồng khởi động:

```text
expo-router/entry
  → app/_layout.tsx
  → AuthSessionProvider khôi phục phiên
  → app/index.tsx chọn khu theo role
  → /admin/home hoặc /user/home
```

## Ranh giới admin và user

Một feature có thể có cấu trúc:

```text
src/features/<feature>/
├── admin/
│   ├── screens/       # màn hoàn chỉnh chỉ khu admin
│   └── ui/            # component mang phong cách admin
├── user/
│   ├── screens/       # màn hoàn chỉnh chỉ khu user
│   └── ui/            # component mang phong cách user
└── shared/
    ├── hooks/         # nghiệp vụ trung lập về vai trò
    ├── model/         # context/model trung lập
    ├── config/        # metadata thuần
    └── utils/         # hàm tính toán thuần
```

Quy tắc bắt buộc:

- Admin không import screen/UI của user và ngược lại.
- `shared` không phụ thuộc ngược vào `admin` hoặc `user`.
- Không đặt một giao diện dùng chung vào `shared` rồi cho hai role cùng render.
- Chỉ chia sẻ type, service, hook hoặc hàm thuần khi chúng không mang bố cục của
  một vai trò.
- Route trong `app/` chỉ nối URL tới screen, không chứa nghiệp vụ lớn.

`eslint.config.js` kiểm tra các ranh giới import này.

## Role và quyền frontend

| Role | Khu UI | Tài khoản | Task | Lịch/chấm công |
| --- | --- | --- | --- | --- |
| `admin` | admin | Quản lý | Quản lý | Quản lý |
| `manager` | admin | Chỉ xem | Quản lý | Quản lý |
| `chef` | admin | Chỉ xem | Quản lý | Quản lý |
| `cashier` | admin | Chỉ xem | Cá nhân | Cá nhân |
| `waiter` | admin | Chỉ xem | Cá nhân | Cá nhân |
| `user`, `vip` | user | Chỉ xem | Cá nhân | Cá nhân |

Đây chỉ là lớp điều hướng và ẩn/hiện thao tác ở frontend. Gateway/backend vẫn
phải kiểm tra quyền cho từng endpoint.

## Chạy dự án

Yêu cầu: Node.js, npm và môi trường Expo phù hợp với nền tảng cần chạy.

```bash
npm install
npm start
```

Các lệnh thường dùng:

```bash
# Android Emulator; script hỗ trợ khởi động máy ảo và ADB reverse
npm run android

# Android thật cùng mạng LAN
npm run android:lan

# Android thật qua Expo tunnel
npm run android:tunnel

npm run ios
npm run web
```

Không chạy `npm run reset-project` trên source đang phát triển; đây là script
mẫu của Expo có thể di chuyển hoặc xóa cây `app/` hiện tại.

## Cấu hình Gateway

Sao chép `.env.example` thành `.env.local`, sau đó điền địa chỉ phù hợp:

```env
EXPO_PUBLIC_API_URL=http://YOUR_GATEWAY_HOST:3000/api
EXPO_PUBLIC_API_TIMEOUT_MS=10000
EXPO_PUBLIC_SOCKET_URL=http://YOUR_SOCKET_HOST:3000
EXPO_PUBLIC_SOCKET_PATH=/socket.io
```

- Production bắt buộc có `EXPO_PUBLIC_API_URL`.
- Mọi nền tảng, gồm Android Emulator, ưu tiên `EXPO_PUBLIC_API_URL` khi biến này
  được cấu hình.
- Android Emulator chỉ dùng `10.0.2.2` với
  `EXPO_PUBLIC_API_PORT`/`EXPO_PUBLIC_API_PATH` khi thiếu URL cấu hình.
- Thiết bị thật cần truy cập được IP máy đang chạy Gateway.
- Nếu không đặt `EXPO_PUBLIC_SOCKET_URL`, app suy ra Socket origin từ API URL.
- Biến `EXPO_PUBLIC_*` được đóng gói vào client, không đặt secret trong đó.

## APK cài thử trên điện thoại Android

Build bản `preview` bằng `eas build --platform android --profile preview` và chia sẻ
đúng link **APK** do EAS trả về. File `.aab` của bản `production` dành cho Google
Play, không thể bấm để cài trực tiếp. Cấu hình build hiện chỉ đóng gói thư viện
ARM cho điện thoại (`armeabi-v7a`, `arm64-v8a`), đồng thời bật R8, thu gọn
tài nguyên và nén thư viện native để giảm dung lượng tải. Máy giả lập x86/x86_64
cần build riêng với kiến trúc tương ứng.

Khi thay APK đã cài, phải dùng cùng khóa ký và `versionCode` không thấp hơn bản
trên máy. Không trộn APK build ở máy cá nhân với APK EAS vì hai bản có thể dùng
khóa ký khác nhau. Nếu Android báo không thể cài đặt, hãy kiểm tra file đã tải
đủ dung lượng và dùng `adb install -r ten-file.apk` để xem mã lỗi cụ thể.
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` là lỗi khác khóa ký; khi không có khóa cũ,
cần gỡ bản cũ rồi cài bản mới (dữ liệu app trên máy sẽ bị xóa).

Nếu phát hành qua website, link tải cần trỏ thẳng tới file APK, trả đúng
`Content-Length` và hỗ trợ tải tiếp bằng HTTP Range; tránh đưa file vào Git
repository hoặc phục vụ qua trang trung gian có giới hạn băng thông. Kiểm tra
SHA-256 sau khi tải để phát hiện file bị cắt hoặc hỏng.

## Cập nhật ứng dụng không cần build lại APK

Dự án dùng EAS Update để phát hành thay đổi JavaScript/TypeScript, giao diện và
asset qua mạng. Mỗi lần push vào nhánh `main`, workflow
`.github/workflows/eas-update.yml` tự xuất bản bản Android mới lên channel
`production`. Ứng dụng kiểm tra bản mới khi mở, chờ tối đa 5 giây để áp dụng
ngay; nếu mạng chậm, bản đã tải sẽ được dùng ở lần mở tiếp theo.

Repository cần có Actions secret `EXPO_TOKEN`, được tạo tại Expo access tokens.
Không commit token vào source.

Người dùng phải cài APK `1.0.2` hoặc mới hơn một lần để có `expo-updates`.
APK `1.0.0`/`1.0.1` không thể tự nhận OTA. Khi chỉ sửa JS/TS/UI/asset,
giữ nguyên `expo.version` để bản cập nhật khớp runtime của APK đã cài.

EAS Update không thay thế APK khi có thay đổi native. Khi thêm hoặc nâng cấp
native module, đổi quyền Android, icon/splash, package ID hoặc Expo SDK, cần tăng
`expo.version` và `android.versionCode`, sau đó build và phát hành APK mới.

## Xác thực và token

```text
/login
  → POST /auth/login, backend gửi OTP
  → /verify
  → POST /auth/verify
  → lưu access token + refresh token
  → cập nhật AuthSessionContext
  → chuyển home theo role
```

- Web lưu token bằng AsyncStorage.
- Native lưu token bằng SecureStore.
- Khi request trả `401`, interceptor dùng refresh token và retry đúng một lần.
- Nhiều lỗi `401` đồng thời dùng chung một request refresh.
- User object không persist; app mở lại sẽ gọi `GET /user/me`.

## Điều hướng chính

Mỗi tính năng chính có route tương ứng ở cả hai khu:

```text
/<area>/home
/<area>/chat
/<area>/todo
/<area>/canteen
/<area>/directory
/<area>/profile
/<area>/workschedule
/<area>/utilities
```

Trong đó `<area>` là `admin` hoặc `user`. Các route con của tiện ích gồm
`calendar`, `overview`, `requests` và `requests/create`. Bảng ánh xạ đầy đủ đến
từng route file/screen nằm trong tài liệu kiến trúc.

## Thêm hoặc sửa tính năng

1. Sửa type/payload tại `src/services/<domain>/constant.ts`.
2. Sửa endpoint tại `src/services/<domain>/*.service.ts`.
3. Tạo hoặc sửa screen/UI riêng trong nhánh `admin` và/hoặc `user`.
4. Chỉ đưa phần trung lập về vai trò vào `shared`.
5. Tạo route mỏng trong `app/(main)/<area>/`.
6. Thêm route constant nếu đường dẫn được dùng ở nhiều nơi.
7. Kiểm tra lint, TypeScript và bundle trước khi commit.

## Kiểm tra trước khi commit

```bash
npm run lint
npx tsc --noEmit
EXPO_PUBLIC_API_URL=http://localhost:3000/api npx expo export --platform web
```

Không sửa source trong `dist/`, `.expo/` hoặc `node_modules/`; đây là các thư
mục được sinh lại.
