import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

import app from "./app.js";
import connectDB from "./db/index.js";
import mongoose from "mongoose";

const PORT = Number(process.env.PORT) || 5000;

/*                              Start Server                                  */

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {

      console.log(" ShopSphere API Started Successfully");

      console.log(` Server  : http://localhost:${PORT}`);

      console.log(` Mode    : ${process.env.NODE_ENV || "development"}`);

      console.log(` Started : ${new Date().toLocaleString()}`);

    });

    /*                        Graceful Shutdown                               */

    const shutdown = async (signal) => {
      try {
        console.log(`\n ${signal} received. Shutting down...`);

        server.close(async () => {
          console.log(" HTTP server closed");

          await mongoose.connection.close();

          console.log(" MongoDB connection closed");

          process.exit(0);
        });

        setTimeout(() => {
          console.error(" Forced shutdown due to timeout");

          process.exit(1);
        }, 10000);
      } catch (error) {
        console.error(" Shutdown error:", error);

        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {

    console.error(" Failed to start ShopSphere API");

    console.error(error);


    process.exit(1);
  }
};

/*                         Global Process Errors                             */

process.on("uncaughtException", (error) => {
  console.error(" Uncaught Exception:", error);

  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error(" Unhandled Promise Rejection:", error);

  process.exit(1);
});

/*                               Bootstrap                                    */

startServer();
