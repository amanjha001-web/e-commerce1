import { useCallback, useEffect, useMemo, useState } from "react";

import ThemeContext from "./ThemeContext";

const STORAGE_KEY = "shopsphere-theme";

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", "light");
    root.classList.remove("dark");
    root.style.colorScheme = "light";

    localStorage.setItem(STORAGE_KEY, "light");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme("light");
  }, []);

  const setLightTheme = useCallback(() => {
    setTheme("light");
  }, []);

  const setDarkTheme = useCallback(() => {
    setTheme("light");
  }, []);

  const value = useMemo(
    () => ({
      theme: "light",
      isDark: false,
      isLight: true,
      toggleTheme,
      setLightTheme,
      setDarkTheme,
    }),
    [toggleTheme, setLightTheme, setDarkTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
