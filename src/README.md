# Kiến trúc frontend

Dự án dùng kiến trúc **feature-first (vertical slices)**. `app/` chỉ khai báo
route Expo; mỗi nghiệp vụ tự chứa API, model, screen và UI của chính nó. `admin`
và `user` là biến thể trong cùng một nghiệp vụ, không phải hai cây mã nguồn.

```text
app/                    # Route Expo mỏng, không chứa logic nghiệp vụ
src/
  api/                  # HTTP client và toàn bộ endpoint backend
  application/          # Navigation và kiểm tra role
  components/           # Component dùng ở nhiều màn hình
  entities/
    user/               # Kiểu dữ liệu và API của thực thể user
  features/
    auth/
    chat/
    home/
    todo/
    workschedule/
      api/              # Adapter gọi backend và request runner
      model/            # Type, hằng số và state
      screens/          # Screen được route trong app/ trỏ tới
      ui/               # Component nhỏ theo admin/user/common
      utils/            # Hàm xử lý ngày tháng dùng lại
  shared/
    api/                # Contract tổng quát, không chứa HTTP client
    config/             # Biến môi trường
    hooks/              # Hook kỹ thuật không biết nghiệp vụ
```

## Quy tắc phụ thuộc

- File trong `app/` chỉ map URL sang screen và giữ layout cấp router.
- Một thay đổi nghiệp vụ phải tìm được trong đúng một thư mục `features/<tên>`.
- URL backend chỉ khai báo tại `src/api/endpoints.ts`.
- HTTP client chỉ được khởi tạo tại `src/api/client.ts`.
- `entities` không chứa route/UI và không phụ thuộc vào feature.
- API admin/user của cùng một nghiệp vụ nằm cạnh nhau trong `features/<tên>/api`.
- Chỉ đưa UI vào `shared` khi nó hoàn toàn không biết Chat, Todo hay Workschedule.
- Danh sách role frontend nằm tại `application/access/roles.ts`; backend vẫn là
  nơi quyết định quyền cuối cùng.

Khi một screen bắt đầu trộn gọi API, state và JSX lớn, hãy tách theo thứ tự:
API → hàm dùng lại trong `utils` → component UI theo trách nhiệm. Không tạo thêm
tầng hoặc thư mục nếu chỉ có một nơi sử dụng.
