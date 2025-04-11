import rateLimit from "express-rate-limit";
import { config } from "../config.js";

export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.requestLimit,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
}); 