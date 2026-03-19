import rateLimit from "express-rate-limit";
import { config } from "../config/common";

// Create a rate limiter middleware function
const limiter = rateLimit({
  // 15 minutes
  windowMs: 15 * 60 * 1000,
  // limit each IP to 100 requests per windowMs
  max: 100,
  // Message to display when rate limit is exceeded
  message: config.ERROR.RATELIMIT,
});

export default limiter;
