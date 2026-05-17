import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`[server] Running in ${env.NODE_ENV} mode`);
  console.log(`[server] Listening on http://localhost:${PORT}`);
  console.log(`[server] Health check → http://localhost:${PORT}/health`);
});
