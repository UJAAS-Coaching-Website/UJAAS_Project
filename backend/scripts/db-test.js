import "./load-env.js";
import { checkDb } from "../src/server.js";

async function run() {
  try {
    const status = await checkDb();
    if (status.ok) {
      console.log(`DB UP (latency ${status.latencyMs}ms)`);
      process.exit(0);
    }
    console.log("DB DOWN");
    process.exit(1);
  } catch (err) {
    console.log("DB DOWN");
    process.exit(1);
  }
}

run();
