import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { AppButton, AppText, Card, Chip, Icon, Screen, ScreenHeader, SectionTitle } from '../../src/components/ui';
import { API_BASE_URL } from '../../src/config/env';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { isAiConfigured } from '../../src/services/ai';
import { pingApi } from '../../src/services/api';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setAiConsent, setThemeMode } from '../../src/store/settingsSlice';
import type { ThemeMode } from '../../src/theme/colors';
import { errorMessage } from '../../src/utils/format';

const MODES: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'Theo hệ thống' },
  { mode: 'light', label: 'Sáng' },
  { mode: 'dark', label: 'Tối' }
];

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { colors, mode } = useAppTheme();
  const consent = useAppSelector(s => s.settings.aiConsent);
  const [check, setCheck] = useState<{ status: 'idle' | 'loading' | 'ok' | 'error'; text?: string }>({ status: 'idle' });

  const testConnection = async () => {
    setCheck({ status: 'loading' });
    try {
      const ms = await pingApi();
      setCheck({ status: 'ok', text: `Kết nối thành công (${ms} ms).` });
    } catch (e) {
      setCheck({ status: 'error', text: errorMessage(e) });
    }
  };

  const link = (icon: 'flag-outline' | 'alarm-outline', title: string, subtitle: string, path: '/goals' | '/reminders') => (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => router.push(path)}>
      <Card pressable flexDirection="row" alignItems="center" gap="$3">
        <Icon name={icon} size={24} color={colors.brand} />
        <View style={{ flex: 1 }}>
          <AppText weight="bold">{title}</AppText>
          <AppText tone="muted" size="xs">{subtitle}</AppText>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );

  return (
    <Screen>
      <ScreenHeader eyebrow="Tài khoản" title="Cá nhân" />

      {link('flag-outline', 'Mục tiêu', 'Tạo, sửa, xoá và theo dõi mục tiêu', '/goals')}
      {link('alarm-outline', 'Nhắc lịch tập', 'Thông báo hằng ngày hoặc theo thứ', '/reminders')}

      <Card>
        <SectionTitle title="Giao diện" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MODES.map(m => <Chip key={m.mode} label={m.label} selected={mode === m.mode} onPress={() => dispatch(setThemeMode(m.mode))} />)}
        </View>
      </Card>

      <Card>
        <SectionTitle title="Kết nối máy chủ" />
        <AppText tone="muted" size="sm" selectable>API: {API_BASE_URL}</AppText>
        <AppButton label="Kiểm tra kết nối" icon="pulse" variant="secondary" size="sm" loading={check.status === 'loading'} onPress={testConnection} />
        {check.text ? <AppText tone={check.status === 'ok' ? 'success' : 'danger'} size="sm" accessibilityLiveRegion="polite">{check.text}</AppText> : null}
        <AppText tone="muted" size="xs">Điện thoại thật: đặt EXPO_PUBLIC_API_URL thành địa chỉ IP LAN của máy chạy json-server (xem README).</AppText>
      </Card>

      <Card>
        <SectionTitle title="AI Coach" />
        <AppText tone="muted" size="sm">Trạng thái: {isAiConfigured() ? 'đã cấu hình backend AI' : 'chưa cấu hình backend AI'}.</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText weight="semi">Cho phép gửi số liệu tổng hợp tới AI</AppText>
            <AppText tone="muted" size="xs">Không gồm tên buổi tập, ghi chú, vị trí, ảnh.</AppText>
          </View>
          <Switch accessibilityLabel="Cho phép gửi số liệu tới AI" value={consent} onValueChange={v => dispatch(setAiConsent(v))} trackColor={{ true: colors.brand, false: colors.borderColor }} thumbColor="#FFFFFF" />
        </View>
      </Card>

      <AppText tone="muted" size="xs" style={{ textAlign: 'center' }}>FitLog {Constants.expoConfig?.version ?? ''}</AppText>
    </Screen>
  );
}
