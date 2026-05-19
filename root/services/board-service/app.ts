import express from 'express';
import routes from './api/routes';
// import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

app.use(express.json());

app.use('/', routes);

// app.use(errorMiddleware);

export default app;

