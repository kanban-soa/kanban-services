import express from "express";
import routes from "@activity-service/api/routes";
import { requestLogger } from "../../common/middleware/request-logger";

const app = express();

app.use(express.json());
app.use(requestLogger({ excludePaths: ["/health", "/docs"] }));
app.use(routes);

export default app;
