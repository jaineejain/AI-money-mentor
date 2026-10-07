import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { apiRateLimit } from "./middleware/rateLimit.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.frontendOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", apiRateLimit);
app.use(routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
