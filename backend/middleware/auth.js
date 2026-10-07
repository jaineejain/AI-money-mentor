import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authenticate(request, response, next) {
  const token =
    request.cookies?.access_token ||
    request.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    response.status(401).json({ detail: "Authentication required." });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    request.userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ detail: "Invalid or expired session." });
  }
}
