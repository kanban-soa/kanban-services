import express from "express";
import "dotenv/config";
import { v1Routes } from "./api/routes/v1";
import { pool } from "./config/database";

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 9002;

app.use(express.json());
app.use("/api/v1", v1Routes);

app.listen(port, () => {
  console.log(`🚀 Server is running on port http://localhost:${port}`);
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.on("connect", () => {
  console.log("Database connected");
});

export default app;
