import AsyncStorage from "@react-native-async-storage/async-storage";

const DEV_IP = "172.19.160.1"; // ⚠️ Thay bằng IP Wi-Fi máy tính của bạn
const BASE_URL = `http://${DEV_IP}:3001`;

export const authService = {
  // 1. Đăng ký tài khoản mới
  register: async (name: string, email: string, password: string) => {
    // Kiểm tra xem email đã tồn tại chưa
    const checkRes = await fetch(`${BASE_URL}/users?email=${email}`);
    const existingUsers = await checkRes.json();
    if (existingUsers.length > 0) {
      throw new Error("Email này đã được sử dụng!");
    }

    // Tạo tài khoản mới
    const response = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) throw new Error("Đăng ký thất bại!");
    const newUser = await response.json();

    // Lưu phiên đăng nhập
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    return newUser;
  },

  // 2. Đăng nhập
  login: async (email: string, password: string) => {
    // Tìm user khớp với email và password trong json-server
    const response = await fetch(
      `${BASE_URL}/users?email=${email}&password=${password}`,
    );
    const users = await response.json();

    if (users.length === 0) {
      throw new Error("Email hoặc mật khẩu không chính xác!");
    }

    const user = users[0];
    // Lưu thông tin đăng nhập vào máy di động
    await AsyncStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  // 3. Đăng xuất
  logout: async () => {
    await AsyncStorage.removeItem("user");
  },

  // 4. Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const userJson = await AsyncStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : null;
  },
};
