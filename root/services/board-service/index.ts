import express from "express";
import "dotenv/config";
import { pool } from "@/board-service/config";
import statisticsRouter from "./api/routes/statistics.route";

const app = express();

app.use(express.json());

app.use("/api/internal/statistics", statisticsRouter);

const port = process.env.BOARD_PORT || "9003";

app.listen(Number(port), () => {
  console.log(`Server is running on port ${port}`);
});

pool.on("connect", () => {
  console.log("Database connected");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});
