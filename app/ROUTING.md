# Hướng dẫn Routing & Endpoints - React Native / Expo

## 1. File-based Routing (định tuyến theo file)

Expo Router dùng **file-based routing** giống Next.js: cấu trúc thư mục trong `app/` quyết định các route.

### Quy tắc tên file

| File / Thư mục | Route | Ghi chú |
|----------------|-------|---------|
| `app/index.tsx` | `/` | Trang chủ |
| `app/(tabs)/index.tsx` | `/` | Trang chủ (trong nhóm tabs) |
| `app/(tabs)/explore.tsx` | `/explore` | Màn Explore |
| `app/modal.tsx` | `/modal` | Màn Modal |
| `app/(tabs)/_layout.tsx` | — | Layout (không tạo route) |
| `app/_layout.tsx` | — | Layout gốc |

### Cú pháp đặc biệt

- **`(tên)`** – Nhóm route: dấu ngoặc `()` khiến tên không xuất hiện trong URL
  - `(tabs)` → `/`, `/explore` (không có `/tabs` trong URL)
- **`_layout.tsx`** – File layout, không tạo route riêng
- **`index.tsx`** – Màn hình mặc định của thư mục (route = tên thư mục)

### Tạo màn hình mới

1. **Tab mới**: Tạo file `app/(tabs)/ten-moi.tsx` và thêm `<Tabs.Screen name="ten-moi" />` trong `_layout.tsx`
2. **Màn độc lập**: Tạo file `app/ten-moi.tsx` → route tự động là `/ten-moi`
3. **Nhóm mới**: Tạo thư mục `app/(ten-nhom)/` với `_layout.tsx` và các file con

---

## 2. Endpoints – React Native có giống Web không?

**Không.** React Native là app chạy trên điện thoại/máy tính, không phải server.

| Web (Next.js, Express...) | React Native |
|---------------------------|--------------|
| Có API routes (endpoints) như `/api/users` | Không có endpoints |
| Server response JSON/HTML | App gọi API từ backend khác |
| `fetch('/api/...')` gọi API trên cùng server | `fetch('https://api.example.com/...')` gọi API bên ngoài |

### App gọi API như thế nào?

```tsx
// Trong component React Native
const response = await fetch('https://your-backend.com/api/users');
const data = await response.json();
```

App chỉ **gọi** API (qua HTTP/HTTPS), không **tạo** API. Backend (Node, Python, …) mới là nơi định nghĩa endpoints.

### Trong dự án Chatapp

- **Nrapp** (Expo): App mobile – gọi API
- **Backend** (trong thư mục `backend/`): Server cung cấp endpoints
- **Frontendweb** (Next.js): Web app – cũng gọi API tới backend

---

## 3. Điều hướng trong code

```tsx
import { Link, router } from 'expo-router';

// Cách 1: Link component (như thẻ <a>)
<Link href="/modal">Mở Modal</Link>

// Cách 2: Programmatic (trong function)
router.push('/modal');      // Chuyển đến /modal
router.back();             // Quay lại
router.replace('/');       // Thay màn hiện tại bằng /
```
