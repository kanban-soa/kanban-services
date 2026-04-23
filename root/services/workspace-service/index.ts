import express from "express";
import routes from "@workspace-service/api/routes";

const app = express();

app.use(express.json());
app.use("/workspaces", routes);

export default app;
