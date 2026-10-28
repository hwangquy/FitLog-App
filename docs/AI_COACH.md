# AI Coach

## Hiện trạng (nói rõ để không nhầm)

| Phần | Trạng thái |
|---|---|
| Phân tích lịch sử và lịch gợi ý theo **quy tắc cố định** (`src/features/coach/rules.ts`) | Hoạt động, có test, dùng dữ liệu thật. **Không phải AI** và được gắn nhãn như vậy trên giao diện. |
| Lớp kết nối AI (`src/services/ai.ts`) + màn hình + đồng ý quyền riêng tư | Đã viết. Chỉ chạy khi có `EXPO_PUBLIC_AI_API_URL`. |
| Backend trung gian (`server/ai-proxy.mjs`) | Viết sẵn dạng tham chiếu. Đã thử các nhánh lỗi cục bộ (404/400/413/204/502); **chưa gọi thử API AI thật** (không có mạng/key). |

Khi chưa cấu hình, nút "Nhờ AI" bị vô hiệu và giao diện nói rõ lý do.

## Vì sao cần backend trung gian

Biến `EXPO_PUBLIC_*` bị đóng gói vào app, ai cũng đọc được. API key của nhà cung cấp AI **không bao giờ** được đặt trong app. App chỉ gọi backend của nhóm; backend giữ key.

## Hợp đồng API

`POST {EXPO_PUBLIC_AI_API_URL}/coach/plan`

Request (chỉ số liệu tổng hợp; **không** có tên buổi tập, ghi chú, vị trí, ảnh, được kiểm thử trong `tests/logic.test.ts`):

```json
{
  "prefs": { "goal": "habit", "daysPerWeek": 3, "level": "beginner" },
  "history": {
    "sessionsLast7": 3, "minutesLast7": 107, "sessionsPrev7": 1,
    "daysSinceLast": 0, "avgMinutes": 35, "favoriteTypes": ["Chạy bộ"],
    "weeks": [{ "weekStart": "2026-10-22", "sessions": 3, "minutes": 107 }]
  }
}
```

Response 200:

```json
{ "summary": "…", "plan": [{ "title": "Đi bộ nhẹ", "minutes": 30, "notes": "…" }] }
```

App kiểm tra phản hồi bằng `parseAiResponse` (1–7 buổi, 5–180 phút); sai định dạng thì báo lỗi, không hiển thị.

## Chạy backend tham chiếu

```bash
ANTHROPIC_API_KEY=<key> AI_MODEL=<tên model> node server/ai-proxy.mjs   # cổng 8787
# rồi đặt EXPO_PUBLIC_AI_API_URL=http://<IP-LAN>:8787 trong .env và chạy lại Expo
```

Proxy giới hạn 20 yêu cầu/giờ/IP, kích thước body 20 KB, timeout 30 giây, không ghi log nội dung người dùng. Trước khi dùng thật: kiểm tra tên model còn hiệu lực, thêm xác thực người dùng, thu hẹp `ALLOWED_ORIGIN`.

## Quyền riêng tư

Lần đầu bấm "Nhờ AI", app hỏi đồng ý. Có thể thu hồi ở tab Cá nhân.
