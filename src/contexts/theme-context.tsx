"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("hf-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("hf-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Color tokens ────────────────────────────────────────────────────────────

const DARK_TOKENS = {
  bgPage:       "hsl(240 10% 4%)",
  bgSidebar:    "hsl(240 8% 6%)",
  bgCard:       "hsl(240 7% 9%)",
  bgCardHover:  "hsl(240 6% 13%)",
  bgInput:      "hsl(240 8% 7%)",
  bgSubtle:     "hsl(240 8% 10%)",
  bgTab:        "hsl(240 8% 10%)",
  border:       "hsl(240 4% 16%)",
  borderSubtle: "hsl(240 5% 12%)",
  borderInput:  "hsl(240 5% 14%)",
  text:         "hsl(0 0% 95%)",
  text2:        "hsl(0 0% 85%)",
  textMuted:    "hsl(240 4% 52%)",
  textDim:      "hsl(240 4% 36%)",
  textDimmer:   "hsl(240 4% 32%)",
  navActiveBg:  "hsl(262 80% 65% / 0.15)",
  navActiveText:"hsl(262 80% 72%)",
  navHoverBg:   "hsl(240 6% 13%)",
  navHoverText: "hsl(0 0% 95%)",
  tabActiveBg:  "hsl(262 80% 65% / 0.15)",
  tabActiveText:"hsl(262 80% 72%)",
  tabBorder:    "hsl(240 5% 18%)",
  chartGrid:    "hsl(240 5% 14%)",
  chartTick:    "hsl(240 4% 52%)",
  tooltipBg:    "hsl(240 8% 10%)",
  tooltipBorder:"hsl(240 5% 18%)",
  tooltipText:  "hsl(0 0% 90%)",
  shadow:       "0 2px 16px hsl(240 10% 3% / 0.5)",
  shadowChart:  "0 2px 16px hsl(240 10% 3% / 0.4)",
};

const LIGHT_TOKENS: typeof DARK_TOKENS = {
  bgPage:       "hsl(220 20% 96%)",
  bgSidebar:    "hsl(0 0% 100%)",
  bgCard:       "hsl(0 0% 100%)",
  bgCardHover:  "hsl(220 14% 95%)",
  bgInput:      "hsl(220 14% 96%)",
  bgSubtle:     "hsl(220 14% 94%)",
  bgTab:        "hsl(220 14% 93%)",
  border:       "hsl(220 13% 87%)",
  borderSubtle: "hsl(220 13% 91%)",
  borderInput:  "hsl(220 13% 86%)",
  text:         "hsl(220 20% 10%)",
  text2:        "hsl(220 15% 22%)",
  textMuted:    "hsl(220 10% 44%)",
  textDim:      "hsl(220 10% 40%)",
  textDimmer:   "hsl(220 10% 38%)",
  navActiveBg:  "hsl(262 80% 65% / 0.1)",
  navActiveText:"hsl(262 80% 44%)",
  navHoverBg:   "hsl(220 14% 93%)",
  navHoverText: "hsl(220 20% 10%)",
  tabActiveBg:  "hsl(262 80% 65% / 0.1)",
  tabActiveText:"hsl(262 80% 44%)",
  tabBorder:    "hsl(220 13% 86%)",
  chartGrid:    "hsl(220 13% 88%)",
  chartTick:    "hsl(220 10% 44%)",
  tooltipBg:    "hsl(0 0% 100%)",
  tooltipBorder:"hsl(220 13% 87%)",
  tooltipText:  "hsl(220 20% 10%)",
  shadow:       "0 2px 16px hsl(220 13% 82% / 0.4)",
  shadowChart:  "0 2px 16px hsl(220 13% 82% / 0.3)",
};

export function useColors() {
  const { isDark } = useTheme();
  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;
  return { ...tokens, isDark };
}
