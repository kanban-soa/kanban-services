import express from "express";
import v1Router from "@/auth-service/routes/";

const app = express();

app.use(express.json());

app.use("/api", v1Router);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
