import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { pool } from '../board-service/config';
import { boardRoutes } from './api/routes/board.route';
import statisticsRoutes from "./api/routes/statistics.route";

dotenv.config({
  debug: true
});

const app = express();

app.use(express.json());

// Middleware to log requests
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/boards', boardRoutes);
app.use("/api/boards/statistics", statisticsRoutes);
console.log('Board service is starting...');

const port = process.env.BOARD_PORT || 9003;

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
