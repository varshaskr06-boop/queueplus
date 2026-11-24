import app from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 QueuePulse AI Backend listening on port ${config.port} (${config.nodeEnv})`);
  console.log(`📍 API Base: http://localhost:${config.port}/api`);
  console.log(`📍 Health Check: http://localhost:${config.port}/api/health`);
});

export default app;
export { server };
