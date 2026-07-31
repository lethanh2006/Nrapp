# Kiến trúc frontend đơn giản

Luồng code chính: **màn hình → file API nghiệp vụ → Axios → backend**.
Không dùng factory, repository hay lớp API tổng quát để người mới dễ lần theo.

```text
app/                    # Route Expo mỏng, không chứa logic nghiệp vụ
  (auth)/               # Đăng nhập, đăng ký, xác thực
  (main)/
    admin/              # Route chat, todo, workschedule của admin
    user/               # Route chat, todo, workschedule của user
src/
  api/
    client.ts           # Cấu hình Axios, token và xử lý lỗi
    auth.api.ts         # API đăng nhập, đăng ký, xác thực
    user.api.ts         # API thông tin người dùng
    chat.api.ts         # API chat của admin và user
    todo.api.ts         # CRUD todo của admin và user
    workschedule.api.ts # CRUD lịch làm việc và chấm công
  application/          # Navigation và kiểm tra role
  components/           # Component dùng ở nhiều màn hình
  features/
    auth/                # State đăng nhập và kiểu dữ liệu
    chat/                # Model và giao diện chat
    home/                # Giao diện trang chủ
    todo/                # Model và giao diện todo
    user/                # Model người dùng
    workschedule/
      hooks/            # Loading, thông báo và gọi workschedule.api
      model/            # Type, hằng số và state
      screens/          # Screen được route trong app/ trỏ tới
      ui/               # Component nhỏ theo admin/user/common
      utils/            # Hàm xử lý ngày tháng dùng lại
  shared/
    config/             # Biến môi trường
    hooks/              # Hook kỹ thuật không biết nghiệp vụ
```

## Quy tắc phụ thuộc

- File trong `app/` chỉ map URL sang screen và giữ layout cấp router.
- Muốn xem API nào, mở thẳng `src/api/<tên>.api.ts`.
- Endpoint được viết ngay trong file API nghiệp vụ để mở một file là thấy trọn
  luồng request.
- HTTP client chỉ được khởi tạo tại `src/api/client.ts`.
- API admin/user của cùng một nghiệp vụ nằm chung một file, nhưng tách thành hai
  object có tên rõ ràng, ví dụ `adminTodoApi` và `userTodoApi`.
- Chỉ đưa UI vào `shared` khi nó hoàn toàn không biết Chat, Todo hay Workschedule.
- Danh sách role frontend nằm tại `application/access/roles.ts`; backend vẫn là
  nơi quyết định quyền cuối cùng.

Khi một screen bắt đầu trộn gọi API, state và JSX lớn, hãy tách theo thứ tự:
API → hook quản lý trạng thái → component UI. Không tạo thêm tầng hoặc thư mục
nếu chỉ có một nơi sử dụng.
