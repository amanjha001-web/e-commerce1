import crypto from "crypto";

/*                           Request ID Middleware                            */

const requestId = (req, res, next) => {
  const id = crypto.randomUUID();

  req.requestId = id;

  res.setHeader("X-Request-Id", id);

  next();
};

export default requestId;
