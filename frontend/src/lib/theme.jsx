// Lightweight theme provider with localStorage + system fallback.
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        if (typeof window === "undefined") return "light";
        const stored = localStorage.getItem("tagit_theme");
        if (stored) return stored;
        return window.matchMedia?.("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") root.classList.add("dark");
        else root.classList.remove("dark");
        try {
            localStorage.setItem("tagit_theme", theme);
        } catch (err) {
            // localStorage may be unavailable (Safari private mode, SSR). Theme still
            // works in-memory — just won't survive a reload.
            console.warn("Theme persist skipped:", err?.message || err);
        }
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,
            setTheme,
            toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        }),
        [theme],
    );
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}
