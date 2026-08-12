import mongoose from "mongoose";

/*                            MongoDB Events                                  */

mongoose.connection.on("connected", () => {
  console.log(" MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.warn(" MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log(" MongoDB reconnected");
});

mongoose.connection.on("error", (error) => {
  console.error(" MongoDB Error:", error.message);
});

/*                            Connect MongoDB                                 */

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in environment variables");
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,

      serverSelectionTimeoutMS: 5000,

      socketTimeoutMS: 45000,
    });

   
    console.log("*******************************");
    
    console.log(" MongoDB Connected Successfully");

    console.log(` Host     : ${connection.connection.host}`);

    console.log(` Database : ${connection.connection.name}`);

   

    return connection;
  } catch (error) {

    console.error("MongoDB Connection Failed");

    console.error(error.message);


    throw error;
  }
};

export default connectDB;
