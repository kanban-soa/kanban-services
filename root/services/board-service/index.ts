import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import routes from '@/board-service/api/routes';
import { errorHandler } from '@/board-service/middlewares/error.middleware';
import { pool } from '../board-service/config';
import statisticsRoutes from "./api/routes/statistics.route";

dotenv.config({
  debug: true,
});

const app = express();

app.use(express.json());

app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api', routes);
app.use("/api/boards/statistics", statisticsRoutes);
console.log('Board service is starting...');

const port = process.env.BOARD_PORT || 9003;

app.listen(Number(port), () => {
  console.log(`Board service listening on port ${port} (base path /api)`);
});

pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
