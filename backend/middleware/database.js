import mongoose from "mongoose";

export function requireDatabase(request, response, next) {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ detail: "Persistent storage is unavailable." });
    return;
  }
  next();
}
