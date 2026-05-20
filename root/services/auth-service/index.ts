import express from "express";
import v1Router from "@/auth-service/routes/";
import { requestLogger } from "./lib/request-logger.lib";

const app = express();

app.use(requestLogger());
app.use(express.json());

app.use("/api", v1Router);
app.use("/internal/v1/auth", v1Router);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
