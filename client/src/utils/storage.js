const isBrowser = typeof window !== "undefined";

const storage = {
  set: (key, value) => {
    if (!isBrowser) return false;

    try {
      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);

      localStorage.setItem(key, serializedValue);

      return true;
    } catch (error) {
      console.error("Storage set error:", error);
      return false;
    }
  },

  get: (key, defaultValue = null) => {
    if (!isBrowser) return defaultValue;

    try {
      const value = localStorage.getItem(key);

      if (value === null) {
        return defaultValue;
      }

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error("Storage get error:", error);
      return defaultValue;
    }
  },

  remove: (key) => {
    if (!isBrowser) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Storage remove error:", error);
      return false;
    }
  },

  clear: () => {
    if (!isBrowser) return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Storage clear error:", error);
      return false;
    }
  },

  has: (key) => {
    if (!isBrowser) return false;

    return localStorage.getItem(key) !== null;
  },
};

export const sessionStorageUtil = {
  set: (key, value) => {
    if (!isBrowser) return false;

    try {
      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);

      sessionStorage.setItem(key, serializedValue);

      return true;
    } catch (error) {
      console.error("Session storage set error:", error);
      return false;
    }
  },

  get: (key, defaultValue = null) => {
    if (!isBrowser) return defaultValue;

    try {
      const value = sessionStorage.getItem(key);

      if (value === null) {
        return defaultValue;
      }

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error("Session storage get error:", error);
      return defaultValue;
    }
  },

  remove: (key) => {
    if (!isBrowser) return false;

    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Session storage remove error:", error);
      return false;
    }
  },

  clear: () => {
    if (!isBrowser) return false;

    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error("Session storage clear error:", error);
      return false;
    }
  },
};

export default storage;
