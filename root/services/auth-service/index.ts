import express from "express";
import v1Router from "./routes/v1";

const app = express();

app.use(express.json());

app.use("/v1", v1Router);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
