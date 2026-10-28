import { AI_API_URL } from '../config/env';
import { parseAiResponse } from '../features/coach/rules';
import type { AiPayload, AiPlan } from '../features/coach/rules';
import { ApiError, createHttpClient } from './http';

export const isAiConfigured = (): boolean => AI_API_URL !== null;

/**
 * Gọi backend trung gian (xem docs/AI_COACH.md và server/ai-proxy.mjs).
 * App KHÔNG chứa API key của nhà cung cấp AI; chỉ gửi số liệu tổng hợp tới backend của nhóm.
 */
export async function requestAiPlan(payload: AiPayload): Promise<AiPlan> {
  if (!AI_API_URL) throw new ApiError('network', 'AI chưa được cấu hình (thiếu EXPO_PUBLIC_AI_API_URL).');
  const client = createHttpClient({ baseUrl: AI_API_URL, timeoutMs: 45000 });
  const r = await client.post<unknown>('/coach/plan', payload);
  const parsed = parseAiResponse(r.data);
  if (!parsed) throw new ApiError('parse', 'AI trả về định dạng không hợp lệ.');
  return parsed;
}
