
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../src/config/env";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

function toSafeUser(raw: any): User {
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.email,
    role: raw.role === "admin" ? "admin" : "user",
  };
}

async function saveUser(raw: any): Promise<User> {
  const user = toSafeUser(raw);

  await AsyncStorage.setItem(
    "user",
    JSON.stringify(user)
  );

  return user;
}

export const authService = {
  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<User> => {
    const normalizedEmail = email.trim().toLowerCase();

    const checkRes = await fetch(
      `${API_BASE_URL}/users?email=${encodeURIComponent(normalizedEmail)}`
    );

    if (!checkRes.ok) {
      throw new Error("Không kiểm tra được email.");
    }

    const existingUsers = await checkRes.json();

    if (existingUsers.length > 0) {
      throw new Error("Email đã được đăng ký!");
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "user",
      }),
    });

    if (!response.ok) {
      throw new Error("Đăng ký thất bại!");
    }

    return saveUser(await response.json());
  },

  login: async (
    email: string,
    password: string
  ): Promise<User> => {
    const response = await fetch(
      `${API_BASE_URL}/users?email=${encodeURIComponent(email.trim().toLowerCase())}&password=${encodeURIComponent(password)}`
    );

    if (!response.ok) {
      throw new Error("Không kết nối được máy chủ.");
    }

    const users = await response.json();

    if (!Array.isArray(users) || users.length === 0) {
      throw new Error("Email hoặc mật khẩu không đúng!");
    }

    return saveUser(users[0]);
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem("user");
  },

  getCurrentUser: async (): Promise<User | null> => {
    const userJson = await AsyncStorage.getItem("user");

    if (!userJson) return null;

    let cachedUser: User;

    try {
      cachedUser = toSafeUser(JSON.parse(userJson));
    } catch {
      await AsyncStorage.removeItem("user");
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${encodeURIComponent(cachedUser.id)}`
      );

      if (response.status === 404) {
        await AsyncStorage.removeItem("user");
        return null;
      }

      if (!response.ok) {
        return cachedUser;
      }

      return saveUser(await response.json());
    } catch {
      return cachedUser;
    }
  },
};
