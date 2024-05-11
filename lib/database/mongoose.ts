import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;
// as next js is serverless,so we need to connect mongodb with each request or server actions,as next js is serverless,it starts the server and stops right after,so each requests can be handled seperately
// but if we do not cache our connections,then there will be too many mongodb connections for each server side request

interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached: MongooseConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URL) throw new Error("MONGODB_URL is not set");
  cached.promise =
    cached.promise ||
    mongoose.connect(MONGODB_URL, {
      dbName: "AmazeAI",
      bufferCommands: false,
    });
  cached.conn = await cached.promise;
  return cached.conn;
};
