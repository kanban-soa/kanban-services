import express from "express";
import routes from "@workspace-service/api/routes";
import internalRoutes from "@workspace-service/api/routes/internal";
import { authMiddleware } from "@workspace-service/middleware/auth";
import {requestLogger} from "../../common/middleware/request-logger";

const app = express();

app.use(express.json());
app.use(requestLogger({ excludePaths: ["/health", "/docs"] }));

// Internal routes — no auth middleware (service-to-service calls)
app.use("/internal", internalRoutes);

app.use(authMiddleware);
app.use("/api/workspaces", routes);

export default app;
