import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureDefaultContent } from "./controllers/contentController.js";

async function bootstrap() {
  await connectDb();
  await ensureDefaultContent();

  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
