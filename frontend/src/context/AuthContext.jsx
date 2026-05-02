import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { carritoService } from "../api/carritoService";
import { clearGuestCart, getGuestCart } from "../lib/guestCart";

const AuthContext = createContext(null);

function normalizeUser(admin = {}) {
  const resolvedRole = admin.rol ?? admin.role ?? admin.rolId ?? admin.ROL_ID;

  return {
    id: admin.id || admin.NUM_ADMIN,
    email: admin.email || admin.EMAIL,
    nombre: admin.nombre || admin.NOMBRE || admin.email || admin.EMAIL,
    rol: resolvedRole,
    status: admin.status || admin.STATUS,
    sessionType: "admin",
  };
}

function normalizeShopUser(usuario = {}) {
  return {
    id: usuario.id || usuario.uid || null,
    email: usuario.email || "",
    nombre:
      usuario.nombre ||
      usuario.displayName ||
      (usuario.email ? String(usuario.email).split("@")[0] : "Cliente"),
    rol: 0,
    status: "activo",
    sessionType: "usuario",
  };
}

function normalizeTokens(tokens = {}) {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: tokens.tokenType || "Bearer",
    expiresIn: tokens.expiresIn,
  };
}

function clearStoredSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("auth");
}

async function migrateGuestCartToUserCart() {
  const guestCart = getGuestCart();
  const items = Array.isArray(guestCart?.items) ? guestCart.items : [];

  if (!items.length) {
    return { moved: 0, failed: 0 };
  }

  let moved = 0;
  let failed = 0;

  for (const item of items) {
    const productId = Number(item?.productId || item?.producto?.id);
    const quantity = Math.max(1, Number(item?.quantity || 1));

    if (!productId) {
      failed += 1;
      continue;
    }

    try {
      await carritoService.addItem(productId, quantity);
      moved += 1;
    } catch (_error) {
      failed += 1;
    }
  }

  if (moved > 0) {
    clearGuestCart();
  }

  return { moved, failed };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem("user");
      const storedAuth = localStorage.getItem("auth");

      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);

        if (!storedAuth) {
          // Sesión de usuario ecommerce (sin refresh token admin)
          setUser(parsedUser);
          setLoading(false);
          return;
        }

        const parsedAuth = JSON.parse(storedAuth);

        if (parsedUser?.sessionType === "usuario") {
          if (!parsedAuth?.accessToken) {
            throw new Error("Missing user access token");
          }
          setUser(parsedUser);
          setLoading(false);
          return;
        }

        if (!parsedAuth?.refreshToken) {
          throw new Error("Missing refresh token");
        }

        const refreshed = await authService.refreshSession(parsedAuth.refreshToken);
        const nextUser = normalizeUser(refreshed.admin || parsedUser);
        const nextTokens = normalizeTokens(refreshed);

        localStorage.setItem("user", JSON.stringify(nextUser));
        localStorage.setItem("auth", JSON.stringify(nextTokens));
        setUser(nextUser);
      } catch (_error) {
        clearStoredSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (tokens, admin) => {
    const userData = normalizeUser(admin || {});
    const tokenData = normalizeTokens(tokens);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("auth", JSON.stringify(tokenData));
    setUser(userData);

    const roleValue = userData?.rol;
    const isAdmin = Number(roleValue) === 1 || Number(roleValue) === 2;
    navigate(isAdmin ? "/admin/dashboard" : "/", { replace: true });
  };

  const loginUsuario = async (usuarioPayload = {}, tokens = {}) => {
    const userData = normalizeShopUser(usuarioPayload);
    const tokenData = normalizeTokens(tokens);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("auth", JSON.stringify(tokenData));
    setUser(userData);

    let migration = { moved: 0, failed: 0 };
    try {
      migration = await migrateGuestCartToUserCart();
    } catch (_error) {
      migration = { moved: 0, failed: 0 };
    }

    navigate("/usuarios/home-sesion", { replace: true });
    return migration;
  };

  const logout = async () => {
    const roleValue = user?.rol ?? user?.role ?? user?.rolId ?? user?.ROL_ID;
    const isAdmin = user?.sessionType === "admin" || Number(roleValue) === 1 || Number(roleValue) === 2;

    try {
      const auth = localStorage.getItem("auth");
      if (auth) {
        const parsed = JSON.parse(auth);
        if (parsed?.refreshToken) {
          await authService.logout(parsed.refreshToken);
        }
      }
    } catch (error) {
      console.error("Logout warning:", error);
    } finally {
      clearStoredSession();
      setUser(null);
      navigate(isAdmin ? "/administradores_bora" : "/", { replace: true });
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, loginUsuario, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
