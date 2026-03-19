import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import mainRoute from "./routes/mainRoute";
import errorHandler from "./middleware/errorHandler";
import conditionalTokenValidation from "./middleware/conditionalTokenValidation";
import { corsOptions, corsMiddleware } from "./config/corsConfig";
import sessionConfig from "./config/sessionConfig";
import connectDb from "./config/dbConnection";
import routes from "./config/routeConfig";
// import limiter from "./middleware/rateLimiter";
import { config } from "./config/common";
import { API_ENDPOINTS } from "./config/endpointsConfig";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { loggingMiddleware } from "./middleware/loggingMiddleware";
import swaggerRoute from "./routes/swaggerRoute";

dotenv.config();
const app = express();
app.use(loggingMiddleware);
const port = process.env.PORT || config.PORT;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).io = io;
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err: any, req: Request, _res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && (err as any).status === 400 && "body" in err) {
    req.body = {};
    return next();
  }
  next(err);
});
corsMiddleware(app);
app.use(sessionConfig);
app.use("/exports", express.static("exports"));
app.use("/api/docs", swaggerRoute);
app.use(conditionalTokenValidation);
// app.use(limiter);
Object.values(routes).forEach((route) => {
  app.use(API_ENDPOINTS.MAIN.DEFAULT, route);
});
app.use(mainRoute);
app.use(errorHandler);
connectDb()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`${config.SUCCESS.SERVER} ${port}`);
      console.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
    });
  })
  .catch((error) => {
    console.error(`${config.ERROR.CONNECTION_FAILED}`, error);
  });
