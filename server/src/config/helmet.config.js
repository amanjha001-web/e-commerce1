import helmet from "helmet";

const helmetConfig = helmet({
  crossOriginResourcePolicy: false,

  contentSecurityPolicy:
    process.env.NODE_ENV === "production" ? undefined : false,
});

export default helmetConfig;
