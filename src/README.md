# Kiến trúc frontend đơn giản

Luồng code chính: **màn hình → service → Axios → backend**.
Mỗi endpoint là một hàm `export async function` độc lập. Mở file service là
thấy ngay URL, payload và header giống cách gọi Axios thông thường.

```text
app/                    # Route Expo mỏng, không chứa logic nghiệp vụ
  (auth)/               # Đăng nhập, đăng ký, xác thực
  (main)/
    admin/              # Route chat, todo, workschedule của admin
    user/               # Route chat, todo, workschedule của user
src/
  services/
    auth/
      auth.service.ts       # Hàm Axios đăng nhập, đăng ký, xác thực
      constant.ts           # Payload, response và key token
    user/
      user.service.ts       # Hàm Axios người dùng
      constant.ts           # User và role
    chat/
      chat.service.ts       # Hàm Axios chat
      constant.ts           # Chat, message và kiểu upload
    todo/
      todo.service.ts       # Hàm Axios todo
      constant.ts           # Task, trạng thái và độ ưu tiên
    workschedule/
      workschedule.service.ts # Hàm Axios lịch làm việc
      constant.ts             # Lịch, chấm công và các lựa chọn cố định
  utils/
    axios.ts            # Cấu hình Axios
    ip.ts               # Địa chỉ API và socket
    apiHelper.ts        # Tạo Authorization header và đọc lỗi API
  application/          # Navigation và kiểm tra role
  components/           # Component dùng ở nhiều màn hình
  features/
    auth/                # State đăng nhập
    chat/                # Socket và giao diện chat
    home/                # Giao diện trang chủ
    todo/                # Giao diện todo
    user/                # Chuẩn hóa dữ liệu người dùng
    workschedule/
      hooks/            # Loading, thông báo và gọi workschedule.service
      model/            # State dùng chung của màn admin
      screens/          # Screen được route trong app/ trỏ tới
      ui/               # Component nhỏ theo admin/user/common
      utils/            # Hàm xử lý ngày tháng dùng lại
  shared/
    hooks/              # Hook kỹ thuật không biết nghiệp vụ
```

## Quy tắc phụ thuộc

- File trong `app/` chỉ map URL sang screen và giữ layout cấp router.
- Muốn xem API nào, mở `src/services/<tên>/<tên>.service.ts`.
- Type, interface và giá trị cố định của nghiệp vụ nằm trong
  `src/services/<tên>/constant.ts`.
- Mỗi hàm service nhận `token` rõ ràng và gọi `getAuthHeader(token)`.
- Không gom endpoint vào object, không dùng factory và không dùng interceptor
  tự gắn token.
- Chỉ đưa UI vào `shared` khi nó hoàn toàn không biết Chat, Todo hay Workschedule.
- Danh sách role frontend nằm tại `application/access/roles.ts`; backend vẫn là
  nơi quyết định quyền cuối cùng.

Khi một screen bắt đầu trộn gọi service, state và JSX lớn, hãy tách theo thứ tự:
service → hook quản lý trạng thái → component UI. Không tạo thêm tầng hoặc thư mục
nếu chỉ có một nơi sử dụng.
