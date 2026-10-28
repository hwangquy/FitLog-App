# Kiến trúc

## Luồng dữ liệu

`Màn hình` → `thunk (Redux Toolkit)` → `src/services/api.ts` → `http.ts` → json-server.
Phản hồi đi qua `normalize*` (loại bản ghi hỏng, điền giá trị thiếu) trước khi vào store.

- `workouts.list`: danh sách phân trang cho tab Nhật ký (bộ lọc `query`, `type` gửi lên server).
- `workouts.all`: toàn bộ buổi tập, dùng cho Dashboard, Tiến độ, Mục tiêu, AI Coach. Thêm/sửa/xoá cập nhật cả hai và làm mới danh sách phân trang.
- Chống race: mỗi lần tải danh sách lưu `requestId`; kết quả của yêu cầu cũ bị bỏ.
- `reminders.device`: trạng thái thông báo **trên thiết bị** (`scheduled | off | permission_denied | unsupported | error`).

## Nhắc lịch

`Bootstrap` (app/_layout.tsx) gọi `syncNotifications(items)` mỗi khi danh sách nhắc nhở đổi, nhưng chỉ sau khi đã tải thành công ít nhất một lần (tránh huỷ nhầm lịch khi API tắt). `reconcileReminderNotifications` huỷ mọi thông báo của FitLog (đánh dấu `data.reminderId`) rồi lên lịch lại theo dữ liệu API, chạy tuần tự qua hàng đợi nên bật/tắt nhanh không sinh trùng. `days` dùng `Date.getDay()` (0 = Chủ nhật); Expo weekday = `day + 1`. Đủ 7 ngày = 1 trigger `DAILY`, ngược lại mỗi ngày 1 trigger `WEEKLY`.

## Theme

`src/theme/colors.ts` là nguồn màu duy nhất. `tamagui.config.ts` nạp vào 2 theme `light`/`dark`; `useAppTheme()` trả cùng bảng màu cho phần React Native thuần (tab bar, biểu đồ). Chế độ lưu ở `settings.themeMode` (`system | light | dark`).

## Tách logic để kiểm thử

Mọi thứ không cần React Native nằm ở file riêng không import thư viện native: `utils/*`, `features/*`, `services/http.ts`. Nhờ đó chạy được bằng `node --test` (xem `tests/`).
