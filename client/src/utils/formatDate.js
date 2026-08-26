const formatDate = (date, options = {}) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const {
    locale = "en-IN",
    dateStyle = "medium",
    timeStyle = undefined,
  } = options;

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
  }).format(parsedDate);
};

export const formatDateTime = (date, options = {}) => {
  return formatDate(date, {
    ...options,
    dateStyle: options.dateStyle || "medium",
    timeStyle: options.timeStyle || "short",
  });
};

export const formatDateShort = (date) => {
  return formatDate(date, {
    dateStyle: "short",
  });
};

export const formatDateLong = (date) => {
  return formatDate(date, {
    dateStyle: "long",
  });
};

export default formatDate;
