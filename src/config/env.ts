import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 3001;

/**
 * Thứ tự ưu tiên:
 * 1. EXPO_PUBLIC_API_URL (khuyến nghị khi chạy điện thoại thật nếu tự suy ra không đúng)
 * 2. Địa chỉ máy đang chạy Expo dev server (hostUri), dùng cổng json-server 3001.
 *    Cách này chạy được trên điện thoại thật qua Expo Go khi cùng Wi-Fi, không hard-code IP.
 * 3. Android Emulator: 10.0.2.2. iOS Simulator / web: localhost.
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && Platform.OS !== 'web') return `http://${host}:${API_PORT}`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}`;
  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Backend trung gian cho AI Coach. null = chưa cấu hình. */
export const AI_API_URL: string | null = process.env.EXPO_PUBLIC_AI_API_URL?.trim().replace(/\/+$/, '') || null;
