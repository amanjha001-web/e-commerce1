export const isEmpty = (value) => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  return false;
};

export const isNotEmpty = (value) => {
  return !isEmpty(value);
};

export const getInitials = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

export const truncateText = (text = "", maxLength = 100) => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
};

export const capitalize = (text = "") => {
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const capitalizeWords = (text = "") => {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => capitalize(word))
    .join(" ");
};

export const slugify = (text = "") => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const debounce = (callback, delay = 300) => {
  let timer;

  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export const calculatePercentage = (value, total) => {
  if (!total || total === 0) {
    return 0;
  }

  return (value / total) * 100;
};

export const getPercentageChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

export const sleep = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

export const removeEmptyValues = (object = {}) => {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
};

export const parseJSON = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
