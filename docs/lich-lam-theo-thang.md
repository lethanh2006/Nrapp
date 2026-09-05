# Đăng ký lịch làm theo tháng

Admin mở một đợt nhận lịch tại **Lịch làm & chấm công → Vận hành → Mở đăng ký theo tháng**. Chọn tháng, ngày bắt đầu và ngày kết thúc trên cùng bảng lịch, rồi lưu. Ngày đã qua không thể chọn. Khi đổi tháng, khoảng ngày được đặt lại trong tháng mới.

Ngày bắt đầu/kết thúc là **thời gian nhận đăng ký**, đồng thời xác định tháng được đăng ký. Ví dụ đợt 29/10–31/10 chỉ nhận lịch tháng 10; đợt 29/10–02/11 không hợp lệ. User chọn bất kỳ ngày chưa qua trong tháng đang mở, kể cả ngày nằm sau hạn nhận đăng ký. Mọi mốc ngày dùng múi giờ Việt Nam.

User và tài khoản đăng ký cá nhân trong khu admin dùng chung luồng:

1. Bảng tháng cố định theo đợt; chạm ngày để chọn nơi làm, ca và ghi chú.
2. Chọn nhanh T2–T6 áp dụng ca cả ngày cho các ngày chưa qua trong tháng; cuối tuần chọn riêng.
3. Nút gửi hiển thị tổng ngày/buổi. Chỉ gửi khi có ít nhất một ngày làm chưa qua.
4. Một tài khoản có một yêu cầu mỗi tháng. Lịch đã gửi hoặc duyệt chỉ xem; lịch từ chối cho sửa và gửi lại khi đợt còn mở.
5. Entry của ngày quá khứ được giữ nguyên khi gửi lại/điều chỉnh, không thêm, sửa hoặc xóa.

Lịch tuần cũ giữ nguyên để xem lại. Những ngày trùng lịch tuần đang chờ/đã duyệt không được đăng ký thêm. Trang chủ lấy lịch đã duyệt của hôm nay/ngày mai, kể cả khi sang tuần hoặc tháng mới.

## Contract API

- `GET /workschedule/policy`: `registration_start`, `registration_end`, `locked`, `schedule_month` do server suy ra (`YYYY-MM`, hoặc `null` nếu cấu hình cũ không hợp lệ).
- `PATCH /workschedule/policy`: gửi thời gian và `locked`; không gửi `schedule_month`.
- `POST /workschedule/schedule/requests`: `{ "month": "2026-10", "entries": [...] }`, tối đa 31 ngày, mỗi ngày chỉ một entry.
- `POST /workschedule/schedule/requests/:id/resubmit` và `PATCH /workschedule/schedule/requests/:id`: `{ "entries": [...] }`, giữ nguyên entry quá khứ.
- Danh sách cá nhân, danh sách quản lý và heatmap dùng query `month=YYYY-MM`. Danh sách quản lý trả kèm `entries` để hiển thị chi tiết từng ngày trên bảng tháng.

BE kiểm tra lại tháng, hạn đăng ký và ngày quá khứ cho mọi vai trò. Không có dữ liệu policy hoặc lỗi tải dữ liệu thì FE khóa gửi và cho tải lại.

## Cập nhật và kiểm tra

Cập nhật `backend/workschedule`, `backend/gateway` và `Nrapp` cùng đợt vì payload tạo lịch đổi từ `week_start` sang `month`. Cấu hình cũ vắt tháng cần được admin mở lại thành một đợt hợp lệ. Dữ liệu lịch tuần không tự biến thành lịch tháng. Khi khởi động, dịch vụ tạo unique index theo `(employee_id, month)` rồi bỏ unique index tuần cũ; cần triển khai các instance dịch vụ lịch cùng phiên bản. Chấm công tự động của lịch tháng gắn với ID yêu cầu để không ảnh hưởng chấm công lịch tuần cũ.

- Nrapp: `npx tsc --noEmit`, `npm run lint`, `node --test scripts/workschedule-date.test.cjs`.
- Chạy thêm test ngày với `TZ=America/Los_Angeles` để kiểm tra thiết bị ở múi giờ khác.
- Backend lịch: `npm test -- --runInBand`, `npm run build`, `npm run lint`.
- Gateway: `npm run build`, `node --test dist/modules/workschedule/dto/monthly-schedule.dto.test.js`.
- Thử trên thiết bị: mở đợt cùng tháng, chọn nhanh/ngày riêng, gửi và gửi lại; ngày quá khứ xám; ngày khác tháng không xuất hiện trong lựa chọn.
