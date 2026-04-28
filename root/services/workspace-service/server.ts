import app from "@workspace-service/index";
import config from "@workspace-service/config/env";

app.listen(config.port, () => {
  console.log("Workspace service listening on port", config.port);
  console.log("Process ID:", process.pid);
  console.log("JWT secret:", config.jwt.secret);
});

export default app;