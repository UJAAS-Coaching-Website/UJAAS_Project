import app from "./app.js";
import { port } from "./config/index.js";

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
