import express from 'express';
import { boardRoutes } from './api/routes/board.route';
import statisticsRoutes from "./api/routes/statistics.route";

const app = express();

app.use(express.json());

app.use('/api', boardRoutes);
app.use("/api/boards/statistics", statisticsRoutes);

const port = process.env.BOARD_PORT || 9003;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
