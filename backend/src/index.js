import app from "./app.js";
import { port } from "./config/index.js";
import { startTestStatusScheduler } from "./services/testStatusScheduler.js";

const stopTestStatusScheduler = startTestStatusScheduler();

const server = app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

const shutdown = () => {
  stopTestStatusScheduler();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
