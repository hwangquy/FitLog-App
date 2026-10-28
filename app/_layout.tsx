import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { TamaguiProvider, Theme } from 'tamagui';
import tamaguiConfig from '../tamagui.config';
import { LoadingState } from '../src/components/ui';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { initNotifications } from '../src/services/notifications';
import { store } from '../src/store';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { fetchGoals } from '../src/store/goalsSlice';
import { useSettingsPersistence } from '../src/store/persist';
import { fetchReminders, syncNotifications } from '../src/store/remindersSlice';
import { fetchAllWorkouts } from '../src/store/workoutsSlice';

function Bootstrap() {
  const dispatch = useAppDispatch();
  const { scheme, colors } = useAppTheme();
  const hydrated = useSettingsPersistence();
  const reminders = useAppSelector(s => s.reminders.items);
  const remindersLoaded = useAppSelector(s => s.reminders.loaded);

  useEffect(() => {
    void initNotifications();
  }, []);

  // Tải dữ liệu từ API một lần khi mở app. Từng màn hình tự hiển thị trạng thái lỗi nếu API không có.
  useEffect(() => {
    if (!hydrated) return;
    void dispatch(fetchAllWorkouts());
    void dispatch(fetchGoals());
    void dispatch(fetchReminders());
  }, [hydrated, dispatch]);

  // Mỗi lần danh sách nhắc nhở đổi (tải xong, thêm, sửa, bật/tắt, xoá) thì đối chiếu lại thông báo trên máy.
  // Không chạy khi chưa tải được lần nào để API lỗi không làm mất lịch đã đặt.
  useEffect(() => {
    if (remindersLoaded) void dispatch(syncNotifications(reminders));
  }, [reminders, remindersLoaded, dispatch]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <LoadingState message="Đang khởi động FitLog..." />
      </View>
    );
  }

  return <AppNavigation />;
}

function AppNavigation() {
  const { scheme, colors } = useAppTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/[id]" />
        <Stack.Screen name="workout/form" />
        <Stack.Screen name="goals/index" />
        <Stack.Screen name="goals/form" />
        <Stack.Screen name="reminders/index" />
        <Stack.Screen name="reminders/form" />
      </Stack>
    </>
  );
}

function AppShell() {
  const { scheme } = useAppTheme();
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme}>
      <Theme name={scheme}>
        <Bootstrap />
      </Theme>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppShell />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
