import express from 'express';
import dotenv from 'dotenv';
import { routes } from './api/routes';
import errorMiddleware from './middleware/error.middleware';

dotenv.config();
const app = express();

app.use(express.json());

app.use('/api', routes);

// Use the error middleware after all routes
app.use(errorMiddleware);

const port = process.env.BOARD_PORT;

if (!port) {
  throw new Error('BOARD_PORT is not defined');
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
