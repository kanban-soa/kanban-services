import express from 'express';
import { boardRoutes } from './api/routes/board.route';

const app = express();

app.use(express.json());

app.use('/api', boardRoutes);

const port = process.env.BOARD_PORT || 9003;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

