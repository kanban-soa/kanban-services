import express from "express";
import routes from "@workspace-service/api/routes";
import { authMiddleware } from "@workspace-service/middleware/auth";

const app = express();

app.use(express.json());
app.use(authMiddleware);
app.use("/api/v1/workspaces", routes);

export default app;
