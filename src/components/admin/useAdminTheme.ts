import { useEffect } from "react";
import "./admin.css";

/** Switches the whole document (including portals) to the bright admin theme while mounted. */
export function useAdminTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("admin-theme");
    return () => root.classList.remove("admin-theme");
  }, []);
}
