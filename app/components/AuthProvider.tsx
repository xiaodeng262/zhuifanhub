"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/*
 * 全局登录态 Context
 * 业务动机：SiteHeader 在 layout 里常驻，跨路由不会卸载。
 * 如果每个消费者各自 fetch /me，登录成功后 Header 不会知道要刷新。
 * 解决：把 user state 提到 Provider，由登录页调用 setUser() 即可让全站同步。
 *
 * 暴露：
 * - user:     当前用户，null 表示未登录
 * - loaded:   初次 /me 拉取是否完成（用于避免闪烁）
 * - setUser:  登录/注册成功后由页面直接写入，不必再发一次 /me
 * - refresh:  手动重新拉取（比如轮询或外部动作后）
 * - logout:   调用登出接口并清空本地 state
 */

export interface PublicUser {
  id: string;
  username: string;
  // role 由 /api/auth/me 返回，用于前端区分管理员可见入口
  // 可选以兼容老调用（如注册/登录返回仅 id + username 的场景）
  role?: "user" | "admin";
}

interface AuthContextValue {
  user: PublicUser | null;
  loaded: boolean;
  setUser: (u: PublicUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: PublicUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  // 首次挂载拉一次，后续由登录/登出主动调用 setUser 同步
  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loaded, setUser, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 消费 hook：非 Provider 子树调用会抛错，及早暴露编程问题
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth 必须在 <AuthProvider> 子树内使用");
  }
  return ctx;
}
