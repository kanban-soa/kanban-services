import express from 'express';
import { boardRoutes } from './api/routes/board.route';
import { cardsRoutes } from './api/routes/card.route';
import { listRoutes } from './api/routes/list.route';


const app = express();

app.use(express.json());

app.use('/boards', boardRoutes);
app.use('/cards', cardsRoutes);
app.use('/lists', listRoutes);

const port = process.env.BOARD_PORT || 9003;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

