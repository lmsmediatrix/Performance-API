import session from "express-session";
import MongoStore from "connect-mongo";
import { config } from "./common";

const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || config.JWTCONFIG.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || config.DB.URI,
    collectionName: config.DB.COLLECTION,
    ttl: 24 * 60 * 60, // 1 day
  }),
};

export default session(sessionConfig);
