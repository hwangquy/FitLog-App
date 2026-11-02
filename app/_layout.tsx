import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { TamaguiProvider, Theme } from "tamagui";
import tamaguiConfig from "../tamagui.config";
import { LoadingState } from "../src/components/ui";
import { useAppTheme } from "../src/hooks/useAppTheme";
import { initNotifications } from "../src/services/notifications";
import { authService } from "../services/authService";
import { store } from "../src/store";
import { useAppDispatch, useAppSelector } from "../src/store/hooks";
import { fetchGoals } from "../src/store/goalsSlice";
import { useSettingsPersistence } from "../src/store/persist";
import { fetchReminders, syncNotifications } from "../src/store/remindersSlice";
import { fetchAllWorkouts } from "../src/store/workoutsSlice";

function Bootstrap() {
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const hydrated = useSettingsPersistence();
  const reminders = useAppSelector((s) => s.reminders.items);
  const remindersLoaded = useAppSelector((s) => s.reminders.loaded);

  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void initNotifications();
  }, []);

  // 1. Kiểm tra trạng thái Auth mỗi khi thay đổi màn hình (segments)
  useEffect(() => {
    if (!hydrated) return;

    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        // Kiểm tra xem route hiện tại có nằm trong nhóm 'auth' hay không (auth/login, auth/register)
        const inAuthGroup = segments[0] === "auth";

        if (!user && !inAuthGroup) {
          // Chưa đăng nhập mà đang ở ngoài -> Đẩy thẳng vào Login
          router.replace("/auth/login" as any);
        } else if (user && inAuthGroup) {
          // Đã đăng nhập nhưng cố vào Login/Register -> Đẩy vào App chính
          router.replace("/(tabs)");
        }
      } catch (e) {
        console.error("Lỗi kiểm tra Auth:", e);
      } finally {
        setAuthChecked(true);
      }
    };

    void checkAuth();
  }, [hydrated, segments]);

  // 2. Tải dữ liệu Redux từ API
  useEffect(() => {
    if (!hydrated) return;
    void dispatch(fetchAllWorkouts());
    void dispatch(fetchGoals());
    void dispatch(fetchReminders());
  }, [hydrated, dispatch]);

  // 3. Đồng bộ thông báo
  useEffect(() => {
    if (remindersLoaded) void dispatch(syncNotifications(reminders));
  }, [reminders, remindersLoaded, dispatch]);

  if (!hydrated || !authChecked) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
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
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Nhóm Authentication */}
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />

        {/* Nhóm App Chính */}
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
