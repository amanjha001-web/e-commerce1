import morgan from "morgan";
import logger from "../utils/logger.js";

/*                            Morgan Stream                                   */

const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

/*                           Morgan Middleware                                */

const requestLogger = morgan(
  ":method :url :status :response-time ms :res[content-length] bytes - :remote-addr",
  {
    stream,
  },
);

export {requestLogger};
