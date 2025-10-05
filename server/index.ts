import 'dotenv/config';
import { setupVite, serveStatic, log } from "./vite";
import { createApp } from './app';
import http from 'http';
import logger from './logger'; // Import logger

(async () => {
  logger.info("Server starting up..."); // Test logger statement
  const { app } = await createApp();
  const server = http.createServer(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "localhost",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
