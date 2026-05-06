import app from "@workspace-service/index";
import config from "@workspace-service/config/env";
import { logger } from "@workspace-service/utils/logger";

app.listen(config.port, () => {
  logger.info(`Workspace service listening on port ${config.port}`);
  logger.info(`JWT secret: ${config.jwt.secret}`);
  logger.info(`Workspace service started in ${config.nodeEnv} mode`);
  logger.info(`Process ID: ${process.pid}`);
});

export default app;