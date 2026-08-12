
/*                           Request Timeout Middleware                       */

const timeout = (milliseconds = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        return res.status(408).json({
          success: false,
          message: "Request Timeout",
        });
      }
    }, milliseconds);

    res.on("finish", () => {
      clearTimeout(timer);
    });

    res.on("close", () => {
      clearTimeout(timer);
    });

    next();
  };
};

export default timeout;
