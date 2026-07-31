# Kiến trúc frontend

Dự án dùng kiến trúc **feature-first (vertical slices)**: mỗi nghiệp vụ tự chứa API,
model, UI và screen của chính nó. `admin` và `user` chỉ là biến thể bên trong
nghiệp vụ, không phải hai cây mã nguồn độc lập.

```text
app/                    # Chỉ khai báo route Expo Router
src/
  application/          # Layout, provider wiring, navigation, access policy
  entities/
    user/               # Kiểu dữ liệu và API của thực thể user
  features/
    auth/
    chat/
    home/
    todo/
    workschedule/
  shared/
    api/                # HTTP client và contract dùng chung
    config/             # Biến môi trường
    hooks/              # Hook kỹ thuật không biết nghiệp vụ
```

## Quy tắc phụ thuộc

- File trong `app/` chỉ re-export screen hoặc khai báo layout route.
- Một thay đổi nghiệp vụ phải tìm được trong đúng một thư mục `features/<tên>`.
- `shared` không được import ngược từ `features`, `entities` hay `application`.
- `entities` không chứa screen và không phụ thuộc vào feature.
- API admin/user của cùng một nghiệp vụ nằm cạnh nhau trong `features/<tên>/api`.
- Chỉ đưa UI vào `shared` khi nó hoàn toàn không biết Chat, Todo hay Workschedule.
- Role dùng để chọn khu vực; quyền thao tác chi tiết nên lấy từ permission của BE.

Danh sách role quản trị được quản lý tập trung tại `src/application/access/roles.ts`.
