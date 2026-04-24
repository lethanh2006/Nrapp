# Chat Flow Documentation (Nrapp)

## 1) Muc tieu tai lieu

Tai lieu nay giai thich:

- Luong hoat dong cua man hinh chat trong `app/(main)/chat.tsx`
- Cac trach nhiem cua tung component con
- Luong du lieu giua AppContext, SocketContext va UI
- Nhung diem de gay roi va huong tach de code de bao tri hon

## 2) Kien truc tong quan

Man chat duoc compose tu 4 component UI:

- `ChatHeader`: hien thong tin nguoi dang chat + typing state + nut mo sidebar
- `ChatSideBar`: danh sach cuoc tro chuyen, tao chat moi, logout
- `ChatMessages`: hien danh sach tin nhan va auto scroll
- `MessageInput`: nhap text/chon anh/gui tin nhan

File dieu phoi chinh:

- `app/(main)/chat.tsx`

Nguon du lieu toan cuc:

- `context/AppContext.tsx`
  - auth state (`user`, `isAuth`, `loading`)
  - du lieu danh ba (`users`) va danh sach chat (`chats`)
  - ham API (`fetchChats`, `fetchUsers`, `getToken`, `logoutUser`)
- `context/SocketContext.tsx`
  - ket noi Socket.IO
  - danh sach online user IDs (`onlineUsers`)
  - phat realtime events vao UI

## 3) Ownership state (state nam o dau)

### 3.1 State tai man `chat.tsx` (local screen state)

- `selectedUser`: chatId dang duoc mo
- `message`: noi dung text input
- `sidebarOpen`: dong/mo sidebar modal
- `messages`: danh sach message cua chat dang mo
- `chatUser`: thong tin user doi phuong cua chat dang mo
- `showAllUser`: toggle giua mode "chat list" va "all users"
- `isTyping`: trang thai doi phuong dang nhap
- `typingTimeoutRef`: debounce event typingStop

### 3.2 State tai context

- AppContext cung cap:
  - `user` (logged in user)
  - `users` (all users de tao chat)
  - `chats` (chat sidebar list)
- SocketContext cung cap:
  - `socket` instance
  - `onlineUsers`

## 4) Luong khoi dong man chat

1. `chat.tsx` mount.
2. Neu `loading=false` va `isAuth=false` thi redirect sang login.
3. AppContext (tu truoc do) da fetch:
   - profile user (`/user/me`)
   - chat list (`/chat/chat/all`)
   - all users (`/user/user/all`)
4. SocketContext ket noi socket theo `user._id`.
5. Khi socket emit `getOnlineUsers`, UI cap nhat green dot online trong header/sidebar.

## 5) Luong chon chat

1. User chon 1 item trong `ChatSideBar`.
2. `setSelectedUser(chatId)` va dong sidebar.
3. `useEffect([selectedUser])` trong `chat.tsx` goi `fetchChat()`:
   - GET `/chat/message/:chatId`
   - cap nhat `messages`
   - cap nhat `chatUser` (nguoi doi phuong)
   - goi lai `fetchChats()` de dong bo unseen/latest
4. `ChatHeader` hien ten va status cua `chatUser`.
5. `ChatMessages` render danh sach message cua chat vua chon.

## 6) Luong tao chat moi

1. Trong `ChatSideBar`, bat mode `showAllUsers=true`.
2. Tim user qua search.
3. Chon user -> goi `createChat(u)`:
   - POST `/chat/chat/new` voi `{ userId, otherUserId }`
   - nhan `chatId` moi
   - `setSelectedUser(chatId)`
   - tat mode all users
   - refresh `fetchChats()`
4. Sau khi `selectedUser` doi, man hinh tu dong vao luong `fetchChat()`.

## 7) Luong gui tin nhan

### 7.1 Text message

1. User nhap text trong `MessageInput` (thuc chat dang goi `setMessage={handleTyping}`).
2. `handleTyping` cap nhat state `message` va emit socket event:
   - `typing` ngay lap tuc
   - `typingStop` sau 800ms neu khong tiep tuc go
3. Nhan nut send -> `handleMessageSend`:
   - tao `FormData` gom `chatId`, `text`
   - POST `/chat/message`
   - append message moi vao `messages` (co check trung theo `_id`)
   - clear `message`

### 7.2 Image message

1. `MessageInput` xin quyen thu vien anh.
2. Chon anh -> luu `imageUri` local de preview.
3. Nhan send -> goi `handleMessageSend(null, imageUri)`.
4. Hien trang thai thuc te hien tai:
   - UI cho phep chon anh
   - Ham send da nhan tham so `imageUri`
   - Nhung request hien tai moi append `chatId` va `text` vao FormData

Ket luan nho:

- Image flow o mobile chua day du den API (co tham so imageUri nhung chua append file vao FormData).

## 8) Luong realtime (socket events)

Trong `chat.tsx` co dang ky:

- `newMessage`
  - Neu `data.message.chatId === selectedUser`: append vao `messages` (co dedupe theo `_id`)
  - Luon `fetchChats()` de dong bo sidebar
- `userTyping`
  - Neu dung chat va dung nguoi doi phuong: `setIsTyping(true)`
- `userTypingStop`
  - Neu dung chat: `setIsTyping(false)`

Cleanup:

- Unsubscribe cac socket handler trong return useEffect.
- Clear typing timeout khi unmount.

## 9) Trach nhiem tung component

### ChatHeader

Input:

- `user`, `isTyping`, `otherUserId`, `onlineUsers`, `setSidebarOpen`
  Trach nhiem:
- Hien ten nguoi chat (fallback user/email)
- Hien typing text
- Hien online dot
- Trigger open sidebar

### ChatSideBar

Input:

- auth/chat/user states va action (`createChat`, `handleLogout`, `setSelectedUser`)
  Trach nhiem:
- Mode 1: danh sach chat hien co
- Mode 2: danh sach users de tao chat moi
- Search users
- Hien unseen badge, latest message
- Hien online dot va logout action

### ChatMessages

Input:

- `selectedUser`, `messages`, `loggedInUser`
  Trach nhiem:
- Empty state neu chua chon chat
- Dedupe message theo `_id`
- Bubble trai/phai theo sender
- Hien text/image + timestamp + seen check
- Auto scroll xuong cuoi khi co noi dung moi

### MessageInput

Input:

- `selectedUser`, `message`, `setMessage`, `handleMessageSend`
  Trach nhiem:
- Input text
- Pick/remove image preview
- Trigger send
- Disable send khi khong co noi dung

## 10) Vi sao cam giac "hoi loan"

1. Ten bien `selectedUser` thuc te la `chatId`.
2. `chatUser` va `otherUserId` co nhieu dang shape (raw/user.user), can normalize som.
3. Image send flow chua hoan chinh (UI co, payload chua co file).
4. Logic fetch, socket, typing, send dang nam chung trong 1 screen lon.
5. Chat list item phai xu ly fallback du lieu khong dong nhat tu backend.

## 11) De xuat tach gon (uu tien theo buoc)

1. Doi ten bien cho dung nghia:
   - `selectedUser` -> `selectedChatId`
   - `showAllUser` -> `showAllUsers`
2. Tach custom hooks:
   - `useChatData(selectedChatId)` cho fetch message/user
   - `useChatSocket(selectedChatId, otherUserId)` cho events realtime
   - `useTyping(socket, selectedChatId, otherUserId)` cho typing debounce
3. Tao mapper chung cho payload chat/message:
   - normalize 1 lan tai API layer, UI nhan du lieu on dinh
4. Hoan chinh image upload:
   - append file object vao FormData tren mobile
5. Tach "container vs presentational":
   - `chat.tsx` giu orchestration
   - components chat chi giu rendering + callback

## 12) Sequence ngan gon

### Open chat

Sidebar click -> set selectedChatId -> fetchChat -> set messages/chatUser -> render header/messages.

### Send message

Input change -> emit typing -> click send -> POST message -> optimistic append -> socket newMessage sync them clients.

### Receive message

Socket newMessage -> neu dung chat thi append vao message list -> refresh chat list de cap nhat latest/unseen.

## 13) Checklist de review nhanh

- [ ] selected variable names phan anh dung nghia (chatId vs userId)
- [ ] image payload da append dung kieu file chua
- [ ] socket events da cleanup day du
- [ ] normalize data shape o 1 cho duy nhat
- [ ] side effects da tach khoi component UI chua

---

Tai lieu nay tap trung vao luong hien tai de team doc nhanh, sau do moi toi giai doan refactor theo tung buoc nho de tranh vo behavior.

Màn chat chính là container orchestration: giữ state chính, gọi API, nghe socket, rồi truyền props và callback xuống các component con để render.

Điều kiện redirect là loading = false và isAuth = false. Không có token thường dẫn đến trạng thái này, nhưng điều kiện trực tiếp vẫn là isAuth false sau khi hết loading.

AppContext cấp dữ liệu nghiệp vụ nền:

user đăng nhập
danh sách users
danh sách chats
hàm fetchChats, fetchUsers, getToken, logoutUser
SocketContext cấp dữ liệu realtime:

socket instance
danh sách onlineUsers
Chọn chat trong sidebar:
set selected chat id
đóng sidebar
effect theo selected chat id chạy fetchChat
lấy messages và user đối phương
gọi fetchChats để đồng bộ latest và unseen
header và messages render lại theo chat mới
Gọi lại fetchChats để đồng bộ danh sách sidebar: latest message, unseen count, thứ tự chat sau khi có dữ liệu mới.

selectedUser hiện đang chứa chatId, không phải userId. Tên này dễ gây hiểu sai logic và làm code khó đọc khi debug.

isTyping là state hiển thị typing indicator. Bật bởi event userTyping, tắt bởi userTypingStop (và cũng tắt khi đổi ngữ cảnh chat).

Dedupe theo message id để tránh trùng tin nhắn do vừa append local sau send, vừa nhận lại cùng message từ socket.

Nút send disable khi không có text hợp lệ và cũng không có ảnh được chọn.

Cleanup cần có:

bỏ đăng ký tất cả socket listeners đã đăng ký trong effect
clear timeout typing còn treo
ngắt kết nối socket ở provider khi user đổi hoặc unmount
Nếu newMessage thuộc chat khác chat đang mở:
khung messages hiện tại không append
vẫn phải refresh chat list để cập nhật latest/unseen trên sidebar
Timeout trong typing dùng để debounce sự kiện typingStop, tránh spam event và đảm bảo trạng thái đang nhập không bị treo mãi. Bỏ timeout có thể gây quá nhiều emit hoặc trạng thái typing sai.

Image flow chưa hoàn chỉnh end-to-end. UI đã chọn ảnh và giữ imageUri, nhưng payload gửi API hiện mới append chatId và text, chưa append file ảnh đúng chuẩn FormData cho mobile.

Cần normalize sớm để mọi component nhận data shape ổn định, tránh fallback rải rác, giảm bug ẩn và giảm công sửa khi backend đổi nhẹ response.

Component dễ bị ảnh hưởng nhất là sidebar và header vì phụ thuộc nhiều field user/chat. Lỗi hay gặp: tên hiển thị sai, online dot sai user, latest message rỗng, unseen count lệch.

Thứ tự tách hook hợp lý:

useTyping trước (nhỏ, ít rủi ro)
useChatSocket tiếp theo (tách realtime listeners)
useChatData sau cùng (tách fetch và mapping)
Lý do: tách dần từ phần ít phụ thuộc đến phần nhiều side effect.
Điểm dễ race condition nhất là fetchChat khi đổi chat nhanh liên tục: response cũ về sau response mới có thể overwrite messages sai chat nếu không có guard.

Giảm fetchChats quá nhiều bằng:

throttle/debounce refresh sidebar
chỉ refresh khi event liên quan chat list
hoặc cập nhật cục bộ chat list từ payload socket thay vì luôn refetch full
Muốn thêm gửi file tổng quát:
tạo lớp chuẩn hóa attachment
mở rộng messageType thành text, image, file
chuẩn hóa hàm build FormData chung cho mọi loại attachment
giữ MessageInput làm UI, để logic upload ở service hoặc hook riêng
3 điểm review đầu tiên:
tính đúng của state flow và naming (chatId hay userId)
socket lifecycle và cleanup (tránh duplicate listeners)
tính nhất quán dữ liệu và chống duplicate message giữa optimistic update và realtime event
