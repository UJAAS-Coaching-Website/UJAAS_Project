import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import { checkDb } from "./server.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: true }));

app.get("/", async (req, res) => {
  try {
    const status = await checkDb();
    const label = status.ok ? "UP" : "DOWN";
    res.status(status.ok ? 200 : 503).send(`Database is ${label}`);
  } catch {
    res.status(503).send("Database is DOWN");
  }
});

app.listen(port, () => {
  // Intentionally minimal: no DB status in console.
  console.log(`Backend listening on port ${port}`);
});
