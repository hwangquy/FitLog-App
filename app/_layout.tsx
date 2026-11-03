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
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void initNotifications();
  }, []);

//Chưa xác nhận đăng nhập: không tải dữ liệu.
//Đăng nhập thành công: bắt đầu tải dữ liệu.
//Chưa có tài khoản: không tự tải danh sách của json-server
useEffect(() => {
  if (!hydrated) return;

  let cancelled = false;

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();

      if (cancelled) return;

      setUserId(user?.id ?? null);

      const inAuthGroup = segments[0] === "auth";

      if (!user && !inAuthGroup) {
        router.replace("/auth/login");
      } else if (user && inAuthGroup) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      if (cancelled) return;

      console.error("Lỗi Auth:", error);
      setUserId(null);
      router.replace("/auth/login");
    } finally {
      if (!cancelled) {
        setAuthChecked(true);
      }
    }
  };

  void checkAuth();

  return () => {
    cancelled = true;
  };
}, [hydrated, segments, router]);


useEffect(() => {
  if (!hydrated || !authChecked || !userId) {
    return;
  }

  void dispatch(fetchAllWorkouts());
  void dispatch(fetchGoals());
  void dispatch(fetchReminders());
}, [hydrated, authChecked, userId, dispatch]);

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
