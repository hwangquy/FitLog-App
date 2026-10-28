# Kiểm thử

Môi trường phát triển bản này **không có mạng** nên không thể `npm install`, chạy Expo hay json-server. Dưới đây tách bạch phần đã chạy và phần chưa.

## Đã chạy (kết quả thật)

| Kiểm tra | Lệnh | Kết quả |
|---|---|---|
| Test đơn vị phần logic thuần (Node 22) | `npm test` | **26/26 đạt** |
| Kiểm tra cú pháp TS/TSX toàn project | TypeScript `transpileModule` | **61 file, 0 lỗi cú pháp** |
| Kiểm kiểu `strict` cho module thuần logic | `tsc` | **0 lỗi** (types, utils, http, features, theme) |
| Liên kết import/export giữa các file của project | `tsc` lọc TS2305/2307/2304/2552… | **0 lỗi** (các lỗi còn lại chỉ là thư viện ngoài chưa cài) |
| Schema `db.json` | `npm run validate:db` | Hợp lệ (4 workouts, 1 goal, 1 reminder) |
| Backend AI tham chiếu: nhánh không cần mạng | curl cục bộ, key giả | 404/400/400/413/204 đúng; yêu cầu hợp lệ không có mạng trả 502 gọn |

### Phạm vi 26 test

- **Ngày/giờ** (`date.test.ts`, chạy ở múi giờ UTC+7): tái hiện lỗi cũ `toISOString` (05:30 sáng thành ngày hôm trước), tuần bắt đầu Thứ Hai, ranh giới tháng/năm, ngày không tồn tại.
- **Chuẩn hoá & validation**: bản ghi hỏng/thiếu, tương thích dữ liệu cũ, số thập phân dấu phẩy, ngày tương lai, từng lỗi theo trường.
- **HTTP client** (`http.test.ts`, server thật trên localhost): thành công + `X-Total-Count`, 404/500, JSON hỏng, server tắt (network), không phản hồi (timeout), PUT gửi đúng body, DELETE body rỗng.
- **Logic**: trigger thông báo (daily/weekly, weekday Expo), tiến độ mục tiêu (tuần/tháng, lọc loại, calories chỉ tính số đã nhập, vượt 100%), thống kê và so sánh kỳ trước, luật gợi ý, **payload AI không chứa dữ liệu riêng tư**, kiểm tra phản hồi AI.

## CHƯA chạy được (cần bạn thực hiện)

| Hạng mục | Lý do chưa chạy | Cách kiểm tra |
|---|---|---|
| `npm install`, `npx expo install --fix`, `npx expo-doctor` | Không có mạng | Chạy theo README. Phiên bản gói trong `package.json` do mình điền theo SDK 54, **chưa được xác minh bằng Expo** |
| `npm run typecheck` (kiểm kiểu đầy đủ UI/Redux/Tamagui) | Thiếu type của thư viện | Sau `npm install`. Có thể còn lỗi kiểu ở màn hình/component |
| Khởi động Expo / bundle Metro | Như trên | `npx expo start`. Nghi vấn lớn nhất: tương thích Tamagui ^1.125 với React 19.1/RN 0.81 |
| json-server 0.17.4 (khởi động, phân trang, `q`, `_sort` nhiều trường) | Không có gói | `npm run api` rồi thử các URL ở docs/API_AND_DATA.md |
| CRUD qua giao diện (buổi tập, mục tiêu, nhắc nhở) | Không có thiết bị | Checklist bên dưới |
| Thông báo cục bộ (lên lịch, huỷ, quyền Android 13+/iOS) | Cần thiết bị | Checklist bên dưới |
| Chọn ảnh, lấy vị trí, mở bản đồ | Cần thiết bị | Checklist bên dưới |
| Giao diện sáng/tối, tai thỏ, bàn phím, màn hình nhỏ | Cần thiết bị | Quan sát thủ công |
| AI proxy gọi API AI thật | Không có mạng/key | Xem docs/AI_COACH.md |

## Checklist kiểm thử thủ công

1. **API**: `npm run api`; Cá nhân → Kiểm tra kết nối báo thành công. Tắt json-server rồi mở lại tab Nhật ký: phải thấy lỗi và nút Thử lại (không có dữ liệu giả).
2. **Buổi tập**: thêm (kiểm tra ngày hôm nay đúng giờ địa phương), sửa (xoá trống calories rồi lưu → calories biến mất), xoá (có hộp xác nhận), tìm kiếm gõ nhanh (chỉ gọi sau ~0,4 giây), lọc theo loại, cuộn xuống để tải trang tiếp (thêm >10 buổi vào `db.json`).
3. **Lưu khi API tắt**: tắt json-server, thử lưu: phải báo lỗi và giữ nguyên nội dung form.
4. **Mục tiêu**: tạo "5 buổi/tuần", ghi buổi tập và xem tiến độ tăng; xoá một buổi thì tiến độ giảm; sửa chỉ tiêu.
5. **Nhắc lịch**: tạo nhắc sau 2 phút từ bây giờ cho đúng hôm nay → nhận thông báo; tắt → không nhận; sửa giờ → giờ mới; xoá → huỷ. Từ chối quyền → nhắc được lưu ở trạng thái tắt và có hướng dẫn mở cài đặt.
6. **Theme**: đổi Sáng/Tối/Theo hệ thống, thoát và mở lại app (phải giữ lựa chọn).
7. **Tiến độ/Dashboard**: với `db.json` rỗng các collection phải ra empty state, không có số giả.
8. **AI Coach**: chưa cấu hình → nút "Nhờ AI" bị vô hiệu và có giải thích.
