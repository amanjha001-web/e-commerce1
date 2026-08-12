
/*                                 Logger                                     */

const getTime = () => {
  return new Date().toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "medium",
  });
};

/*                           Message Formatter                                */

const formatMessage = (messages) => {
  return messages
    .map((message) => {
      if (message instanceof Error) {
        return message.stack || message.message;
      }

      if (typeof message === "object" && message !== null) {
        return JSON.stringify(message, null, 2);
      }

      return String(message);
    })
    .join(" ");
};

/*                                Logger                                      */

const log = (label, color, method, messages) => {
  method(`${color}[${label}]\x1b[0m ${getTime()} : ${formatMessage(messages)}`);
};

const info = (...messages) => {
  log("INFO", "\x1b[36m", console.log, messages);
};

const success = (...messages) => {
  log("SUCCESS", "\x1b[32m", console.log, messages);
};

const warn = (...messages) => {
  log("WARNING", "\x1b[33m", console.warn, messages);
};

const error = (...messages) => {
  log("ERROR", "\x1b[31m", console.error, messages);
};

const http = (...messages) => {
  log("HTTP", "\x1b[35m", console.log, messages);
};

/*                                  Export                                    */

export default {
  info,
  success,
  warn,
  error,
  http,
};
