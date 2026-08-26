import { useCallback, useEffect, useMemo, useState } from "react";

import ThemeContext from "./ThemeContext";

const STORAGE_KEY = "shopsphere-theme";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", theme === "dark");

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }, []);

  const setLightTheme = useCallback(() => {
    setTheme("light");
  }, []);

  const setDarkTheme = useCallback(() => {
    setTheme("dark");
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      isLight: theme === "light",
      toggleTheme,
      setLightTheme,
      setDarkTheme,
    }),
    [theme, toggleTheme, setLightTheme, setDarkTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
