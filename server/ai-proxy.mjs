// Backend trung gian THAM CHIẾU cho AI Coach. Chưa được kiểm thử với API thật trong môi trường phát triển
// (không có mạng/API key). Xem docs/AI_COACH.md trước khi dùng.
//
// Chạy:  ANTHROPIC_API_KEY=... AI_MODEL=... node server/ai-proxy.mjs
// Không bao giờ đặt API key trong app Expo (biến EXPO_PUBLIC_* bị đóng gói vào app).
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.AI_MODEL ?? 'claude-sonnet-5-5';
const ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';
const MAX_BODY = 20_000;
const RATE_LIMIT = 20; // yêu cầu / giờ / IP
if (!API_KEY) {
  console.error('Thiếu biến môi trường ANTHROPIC_API_KEY');
  process.exit(1);
}

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 3_600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

const SYSTEM = `Bạn là huấn luyện viên thể dục thân thiện, trả lời bằng tiếng Việt.
Dựa trên số liệu tổng hợp người dùng gửi, đề xuất lịch tập cho tuần tới gồm 2 đến 5 buổi.
Quy tắc: tăng khối lượng tối đa khoảng 10% so với mức gần đây; ưu tiên an toàn và đều đặn; không chẩn đoán bệnh, không tư vấn y tế, không nhắc thuốc hay chế độ ăn.
Chỉ trả về JSON hợp lệ, không kèm văn bản khác, đúng dạng:
{"summary": string (tối đa 3 câu), "plan": [{"title": string, "minutes": number (10-90), "notes": string}]}`;

function validPayload(p) {
  return p && typeof p === 'object' && p.prefs && p.history && typeof p.history.sessionsLast7 === 'number' && Array.isArray(p.history.weeks);
}

function parseModelJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const out = JSON.parse(cleaned);
  if (typeof out.summary !== 'string' || !Array.isArray(out.plan) || out.plan.length < 1 || out.plan.length > 7) throw new Error('shape');
  for (const p of out.plan) if (typeof p.title !== 'string' || typeof p.minutes !== 'number' || p.minutes < 5 || p.minutes > 180) throw new Error('shape');
  return out;
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST' || req.url !== '/coach/plan') return send(res, 404, { error: 'not_found' });
  if (limited(req.socket.remoteAddress ?? 'unknown')) return send(res, 429, { error: 'rate_limited' });

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) return send(res, 413, { error: 'too_large' });
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return send(res, 400, { error: 'bad_json' });
  }
  if (!validPayload(payload)) return send(res, 400, { error: 'bad_payload' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 800, system: SYSTEM, messages: [{ role: 'user', content: JSON.stringify(payload) }] }),
      signal: AbortSignal.timeout(30_000)
    });
    if (!r.ok) return send(res, 502, { error: 'upstream_error', status: r.status });
    const data = await r.json();
    const text = data?.content?.find(b => b.type === 'text')?.text ?? '';
    return send(res, 200, parseModelJson(text));
  } catch (e) {
    console.error('AI proxy error:', e?.message ?? e); // không log nội dung người dùng
    return send(res, 502, { error: 'upstream_failed' });
  }
}).listen(PORT, () => console.log(`AI proxy đang chạy ở cổng ${PORT} (model: ${MODEL})`));
