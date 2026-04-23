import app from "@workspace-service/index";
import config from "@workspace-service/config/env";

app.listen(9005, () => {
  console.log("Workspace service listening on port 9005");
  console.log("Process ID:", process.pid);
  console.log("JWT secret:", config.jwt.secret);
});
