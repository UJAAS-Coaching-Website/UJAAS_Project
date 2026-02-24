import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "coaching-backend", time: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({ message: "Backend is running. See /health." });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
