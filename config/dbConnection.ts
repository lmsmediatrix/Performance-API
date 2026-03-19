import mongoose from "mongoose";
import { config } from "./common";

// Database Connection
// Connect to MongoDB
const connectDb = async (): Promise<typeof mongoose> => {
  try {
    const MONGODB_URI: string = process.env.DB_URI || config.DB.URI;
    if (!MONGODB_URI) throw new Error(config.ERROR.MONGODB_NOT_DEFINE);
    const connect = await mongoose.connect(MONGODB_URI);
    console.log(
      `${config.SUCCESS.DATABASE} ${connect.connection.host}, ${connect.connection.name}`
    );
    return connect;
  } catch (error) {
    console.error(config.ERROR.CONNECTION_FAILED, error);
    process.exit(1);
  }
};

export default connectDb;
