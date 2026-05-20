import app from "@activity-service/index";
import config from "@activity-service/config/env";

app.listen(config.port, () => {
  console.log(`Activity service listening on port ${config.port}`);
});

