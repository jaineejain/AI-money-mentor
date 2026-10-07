import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

try {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`AI Money Mentor API listening on port ${env.port}.`);
  });
} catch (error) {
  console.error("Unable to start the server.", error);
  process.exitCode = 1;
}
