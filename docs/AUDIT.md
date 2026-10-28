# Audit và kết quả xử lý

Audit tĩnh bản gốc `fitlog-mobile-project.zip` (SHA-256 `7fbe7f53…41b86`, giữ nguyên, không bị ghi đè). Cột "Xử lý" mô tả thay đổi đã làm trong mã; cột "Xác minh" nói rõ đã kiểm tra bằng cách nào.

| # | Vấn đề ở bản gốc | Xử lý | Xác minh |
|---|---|---|---|
| 1 | `babel.config.js`: `tamagui/babel-plugin` đặt trong `presets`, `jsxImportSource: "tamagui"` | Về cấu hình chuẩn `babel-preset-expo` | Chưa chạy Metro |
| 2 | Thiếu `react-native-worklets`, `expo-linking`, `expo-constants` | Thêm vào `package.json` | Chưa cài. Chạy `npx expo install --fix` |
| 3 | `createWorkout` trả bản ghi `demo-…` và báo "Đã lưu" khi API lỗi; `getWorkouts` nuốt lỗi | Bỏ toàn bộ dữ liệu demo; `ApiError` có kiểu network/timeout/http/parse; UI hiện lỗi | Test HTTP với server thật trên localhost |
| 4 | Ngày dùng `toISOString()` (UTC) | `toLocalISODate` | Test ở TZ Asia/Ho_Chi_Minh tái hiện lỗi cũ |
| 5 | Số liệu giả: 3/5 buổi, 60%, biểu đồ `[35,55,…]`, calories = phút × 7, ngày cứng | Mọi số tính từ dữ liệu thật; calories chỉ là số người dùng nhập | Test `stats`, `goalProgress` |
| 6 | URL API cứng `10.0.2.2` | `src/config/env.ts` + `EXPO_PUBLIC_API_URL` | Chưa thử trên thiết bị |
| 7 | json-server `^1.0.0-beta` khác tài liệu môn học | Ghim `0.17.4`; client dùng `_page/_limit/_sort/q` | Chưa chạy json-server |
| 8 | `getWorkoutById` tải 50 bản ghi rồi `find` | `GET /workouts/:id` | Đọc mã |
| 9 | Không dùng SafeArea | `Screen` dùng `SafeAreaView`; bỏ chiều cao cố định của tab bar | Chưa thử trên thiết bị có tai thỏ |
| 10 | Theme tối không hoạt động | 2 theme Tamagui + `useAppTheme`, lưu AsyncStorage | Chưa chạy |
| 11 | Danh sách dùng `ScrollView` + "Tải thêm" | `FlatList` + `onEndReached` + phân trang server, chống kết quả cũ (requestId) | Đọc mã, chưa chạy |
| 12 | Nhắc lịch ở Profile chỉ là demo | CRUD `/reminders` + đối chiếu thông báo thật | Chưa thử trên thiết bị |
| 13 | README nói có tính năng không tồn tại | README viết lại theo đúng thực tế | — |
| 14 | Không có sửa/xoá, Goals, Reminders, store | Đã triển khai | Một phần qua test; UI chưa chạy |
