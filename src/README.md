# Kiến trúc frontend

`app/` chỉ khai báo route. Nghiệp vụ nằm trong `src/` và được chia theo khu vực:

- `features/admin`: màn hình và service dành cho các role thuộc khối quản trị.
- `features/user`: màn hình và service dành riêng cho role `user`.
- `features/shared`: UI/model dùng chung, chỉ nhận dependency qua interface và không tự chọn API theo role.
- `core`: chính sách role, điều hướng và hàm chuẩn hoá dữ liệu.

Danh sách role quản trị được cấu hình tập trung tại `core/auth/roles.ts`. Khi BE bổ sung
role hoặc tách endpoint chat, todo, workschedule, chỉ cập nhật policy hoặc service của
khu vực tương ứng; không thêm kiểm tra role rải rác trong component.
