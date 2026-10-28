# FitLog – Nhật ký luyện tập

Ứng dụng theo dõi luyện tập xây bằng **Expo SDK 54 + React Native + TypeScript + Expo Router + Tamagui + Redux Toolkit**, dữ liệu qua **json-server**.

> Trạng thái kiểm thử: xem [docs/TESTING.md](docs/TESTING.md). Bản này chưa được chạy trên thiết bị/emulator trong môi trường phát triển (không có mạng). Hãy làm theo mục "Chạy lần đầu" và báo lại lỗi nếu có.

## Chức năng

| Khu vực | Nội dung |
|---|---|
| **Tổng quan** | Ngày hôm nay, mục tiêu hiện tại, số liệu tuần này, gợi ý hôm nay, buổi tập gần đây. Chỉ hiển thị số liệu tính từ dữ liệu thật. |
| **Nhật ký** | Danh sách `FlatList` phân trang từ server, tìm kiếm có debounce, lọc theo loại, pull-to-refresh, loading/empty/error. |
| **Buổi tập** | Thêm, xem, sửa, xoá (có xác nhận). Ngày theo giờ địa phương, ảnh (expo-image-picker), vị trí (expo-location + mở bản đồ). |
| **Mục tiêu** | CRUD. Chỉ tiêu theo số buổi / phút / km / calories đã nhập, theo tuần hoặc tháng, theo loại hoạt động. Tiến độ tính từ buổi tập thật. |
| **Nhắc lịch** | CRUD lưu ở API. Thông báo cục bộ thật (Expo Notifications): hằng ngày hoặc theo thứ, xử lý quyền, bật/tắt/sửa/xoá huỷ và đặt lại đúng. Huy hiệu hiển thị trạng thái thật trên máy. |
| **Tiến độ** | 7 ngày / 4 tuần, biểu đồ cột, so sánh kỳ trước, thống kê theo loại, empty state. |
| **AI Coach** | Phân tích lịch sử + lịch gợi ý **theo quy tắc** (không phải AI). Nút "Nhờ AI" chỉ hoạt động khi bạn cấu hình backend AI ([docs/AI_COACH.md](docs/AI_COACH.md)). |
| **Cá nhân** | Theme Sáng / Tối / Theo hệ thống (lưu AsyncStorage), kiểm tra kết nối API, quyền gửi số liệu cho AI. |

## Yêu cầu

- Node.js 20 trở lên, npm
- Expo Go (SDK 54) trên điện thoại, hoặc Android Emulator / iOS Simulator

## Chạy lần đầu

```bash
npm install
npx expo install --fix   # căn chỉnh phiên bản gói theo Expo SDK 54
npx expo-doctor          # kiểm tra cấu hình, đọc kỹ cảnh báo
npm run typecheck        # tsc --noEmit (cần sau khi cài gói; sau lần chạy Expo đầu tiên nếu thiếu expo-env.d.ts)
npm test                 # test logic thuần bằng Node
```

### 1. Chạy backend (json-server 0.17.4)

```bash
npm run api              # json-server --watch db.json --host 0.0.0.0 --port 3001
npm run validate:db      # (tuỳ chọn) kiểm tra db.json
```

`--host 0.0.0.0` để điện thoại cùng Wi-Fi truy cập được. Kiểm tra: mở `http://localhost:3001/workouts` trên máy tính.

### 2. Cấu hình địa chỉ API

App chọn địa chỉ theo thứ tự (mã ở `src/config/env.ts`):

1. Biến `EXPO_PUBLIC_API_URL` (tạo file `.env` từ `.env.example`).
2. Địa chỉ máy đang chạy Expo dev server + cổng 3001 (tự chạy trên điện thoại thật qua Expo Go cùng Wi-Fi).
3. Android Emulator `http://10.0.2.2:3001`, iOS Simulator và web `http://localhost:3001`.

Nếu điện thoại không kết nối được: đặt `EXPO_PUBLIC_API_URL=http://<IP-LAN-của-máy-tính>:3001` (Windows: `ipconfig`, macOS/Linux: `ifconfig`), kiểm tra tường lửa cho cổng 3001, rồi khởi động lại Expo (`npx expo start -c`). Tab **Cá nhân → Kiểm tra kết nối** cho biết kết quả thật.

### 3. Chạy app

```bash
npx expo start           # quét QR bằng Expo Go; nhấn a (Android) / i (iOS) / w (web)
```

## Cấu trúc

```text
app/                       Expo Router: (tabs)/ + workout/, goals/, reminders/
src/components/ui/         Hệ thống UI dùng chung (Screen, nút, input, thẻ, trạng thái, Tamagui styled)
src/components/{charts,workouts,goals,reminders}/
src/features/              Logic thuần, có test: goals/progress, stats, coach/rules, reminders/schedule
src/services/              http (client thuần), api (json-server), notifications, ai, storage
src/store/                 Redux Toolkit: workouts, goals, reminders, settings (+ persist)
src/theme/ + tamagui.config.ts   Tokens và 2 theme (light/dark) từ một bảng màu
src/utils/                 date (giờ địa phương), normalize, validation, format
server/ai-proxy.mjs        Backend AI tham chiếu (tuỳ chọn)
tests/  scripts/  docs/
```

Chi tiết: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API_AND_DATA.md](docs/API_AND_DATA.md).

## Quyết định chính

- **Một nguồn dữ liệu:** dữ liệu nghiệp vụ chỉ nằm ở API (Redux giữ bản đang dùng). AsyncStorage chỉ lưu cài đặt (theme, đồng ý AI) nên không có hai bản sao lệch nhau.
- **Không có dữ liệu giả:** API lỗi thì UI hiện lỗi và nút thử lại; không bao giờ báo "đã lưu" khi chưa lưu.
- **Ngày = chuỗi `YYYY-MM-DD` giờ địa phương** (sửa lỗi UTC của bản cũ làm lệch ngày trước 7h sáng ở Việt Nam).
- **json-server ghim 0.17.4** theo tài liệu môn học (phân trang `_page/_limit` + header `X-Total-Count`); bản 1.0 beta dùng cách phân trang khác.
- **Goals không lưu `current`:** tiến độ luôn tính lại từ buổi tập nên không thể lệch.

## Giới hạn đã biết

- Chưa chạy trên thiết bị thật/emulator; chưa chạy `tsc` đầy đủ (cần `npm install`). Xem docs/TESTING.md.
- Không có `package-lock.json` (bản gốc cũng không có); sẽ được tạo khi `npm install`.
- Ảnh buổi tập chỉ lưu đường dẫn cục bộ của thiết bị (json-server không lưu file).
- AI thật cần backend riêng; chưa kiểm thử với API thật.
- Bấm vào thông báo chưa điều hướng tới màn hình nào. Web không hỗ trợ thông báo cục bộ.
- Chưa có đăng nhập/hồ sơ người dùng (ngoài phạm vi đã xác nhận). Gesture Handler mới chỉ bọc ở gốc, chưa có cử chỉ tuỳ biến; Reanimated dùng cho hiệu ứng xuất hiện của thẻ.
- `react-native-svg` còn trong dependencies từ bản gốc nhưng chưa được dùng (biểu đồ vẽ bằng View).

## Build (EAS)

`eas.json` giữ nguyên từ bản gốc. Xem https://docs.expo.dev/build/introduction/. Chưa build thử.
