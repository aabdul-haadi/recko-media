import { useEffect } from "react";
import "./admin.css";
import "./admin-brand.css";

/**
 * Switches the whole document (including portals) to the admin theme while mounted.
 * "light" is the working admin; "dark" is the sign-in screen.
 */
export function useAdminTheme(mode: "light" | "dark" = "light") {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("admin-theme");
    if (mode === "dark") root.classList.add("admin-dark");
    return () => {
      root.classList.remove("admin-theme", "admin-dark");
    };
  }, [mode]);
}
