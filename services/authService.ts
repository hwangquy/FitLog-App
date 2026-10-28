import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../src/config/env";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export const authService = {
  // 1. Đăng ký tài khoản mới (Mặc định gán role = "user")
  register: async (name: string, email: string, password: string) => {
    // Kiểm tra xem email đã tồn tại trong json-server chưa
    const checkRes = await fetch(
      `${API_BASE_URL}/users?email=${encodeURIComponent(email.trim())}`,
    );
    const existingUsers = await checkRes.json();
    if (existingUsers.length > 0) {
      throw new Error("Email này đã được đăng ký sử dụng!");
    }

    // Tạo tài khoản mới kèm thuộc tính role: "user"
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role: "user", // Mặc định tài khoản mới tạo là user
      }),
    });

    if (!response.ok) throw new Error("Đăng ký thất bại!");
    const newUser: User = await response.json();

    // Tự động lưu phiên đăng nhập
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    return newUser;
  },

  // 2. Đăng nhập
  login: async (email: string, password: string) => {
    const response = await fetch(
      `${API_BASE_URL}/users?email=${encodeURIComponent(email.trim())}&password=${encodeURIComponent(password.trim())}`,
    );
    const users = await response.json();

    if (users.length === 0) {
      throw new Error("Email hoặc mật khẩu không chính xác!");
    }

    const user: User = users[0];
    // Lưu thông tin user (bao gồm id, name, email, role) vào bộ nhớ thiết bị
    await AsyncStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  // 3. Đăng xuất
  logout: async () => {
    await AsyncStorage.removeItem("user");
  },

  // 4. Lấy thông tin user hiện tại (Tự động đồng bộ role mới nhất từ db.json)
  getCurrentUser: async (): Promise<User | null> => {
    const userJson = await AsyncStorage.getItem("user");
    if (!userJson) return null;

    const cachedUser: User = JSON.parse(userJson);

    try {
      // Fetch lại dữ liệu mới nhất từ server dựa theo ID để cập nhật role mới
      const res = await fetch(`${API_BASE_URL}/users/${cachedUser.id}`);
      if (res.ok) {
        const freshUser: User = await res.json();
        // Cập nhật lại AsyncStorage với dữ liệu mới nhất
        await AsyncStorage.setItem("user", JSON.stringify(freshUser));
        return freshUser;
      }
    } catch (e) {
      // Trường hợp không kết nối được API thì fallback lấy dữ liệu cache từ AsyncStorage
      console.log("Không thể làm mới dữ liệu user từ server, sử dụng cache.");
    }

    return cachedUser;
  },
};
