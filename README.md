# Nrapp

Ứng dụng Expo/React Native cho hai khu vực quản trị và nhân viên.

## Chạy dự án

```bash
npm install
npm start
```

Tạo `.env.local` và cấu hình:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

Có thể cấu hình thêm `EXPO_PUBLIC_SOCKET_URL`, `EXPO_PUBLIC_SOCKET_PATH` và
`EXPO_PUBLIC_API_TIMEOUT_MS`. Production build bắt buộc có
`EXPO_PUBLIC_API_URL`.

## Kiến trúc

- `app/`: route Expo Router, route layout và screen composition.
- `src/application/`: navigation và access policy toàn ứng dụng.
- `src/entities/`: model/API của thực thể dùng bởi nhiều feature.
- `src/features/`: vertical slice theo nghiệp vụ.
- `src/shared/`: HTTP client, config và hook kỹ thuật không biết nghiệp vụ.

Xem quy tắc chi tiết tại [`src/README.md`](src/README.md).

## Kiểm tra

```bash
npm run lint
npx tsc --noEmit
EXPO_PUBLIC_API_URL=http://localhost:3000/api npx expo export --platform web
```
