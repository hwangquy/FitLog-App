# API và mô hình dữ liệu

Backend: **json-server 0.17.4** (`npm run api`, cổng 3001).

## Endpoint đang dùng

| Method | Đường dẫn | Dùng cho |
|---|---|---|
| GET | `/workouts?_sort=date,createdAt&_order=desc,desc&_page=N&_limit=10[&q=…][&type=…]` | Nhật ký (phân trang; tổng ở header `X-Total-Count`) |
| GET | `/workouts?_sort=…` | Toàn bộ buổi tập cho thống kê |
| GET / POST / PUT / DELETE | `/workouts[/:id]` | Xem, thêm, sửa (PUT thay cả bản ghi để xoá được trường tuỳ chọn), xoá |
| GET / POST / PUT / DELETE | `/goals[/:id]` | Mục tiêu |
| GET / POST / PUT / PATCH / DELETE | `/reminders[/:id]` | Nhắc nhở (PATCH `{enabled}` khi bật/tắt) |

Lưu ý: CORS đã được json-server bật sẵn cho web.

## Schema

**workout**: `id`, `title`, `type` (Chạy bộ | Gym | Đạp xe | Đi bộ | Yoga | Khác), `date` (`YYYY-MM-DD`, giờ địa phương), `duration` (phút), `distance` (km, 0 nếu không có), `calories?` (chỉ khi người dùng nhập), `note?`, `location?`, `coords? {latitude, longitude}`, `image?` (URI cục bộ), `createdAt?`.

**goal**: `id`, `title`, `metric` (sessions | minutes | distance | calories), `target` (> 0), `period` (week | month), `workoutType` (loại hoặc `all`), `createdAt?`.

**reminder**: `id`, `title`, `time` (`HH:mm`), `days` (mảng 0–6, 0 = Chủ nhật), `enabled`, `createdAt?`.

## Thay đổi so với `db.json` gốc

- `goals`: bỏ `current` và `unit` (giá trị suy ra được nên không lưu), thêm `metric`, `period`, `workoutType`, `createdAt`. Dữ liệu cũ `{unit:"buổi/tuần"}` vẫn được `normalizeGoal` hiểu là "số buổi / tuần".
- `reminders`: thêm `days`, `createdAt`.
- `workouts`: thêm `createdAt` ở dữ liệu mẫu.

## Chuẩn hoá phía client

`normalizeWorkout/Goal/Reminder` loại bản ghi thiếu `id`, ngày/giờ sai, `target ≤ 0`; điền mặc định cho trường thiếu (`type` lạ → "Khác"). `npm run validate:db` báo bản ghi nào trong `db.json` sẽ bị app bỏ qua.
