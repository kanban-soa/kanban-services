import express from 'express';
import routes from './api/routes';
import { requestLogger } from '../../common/middleware/request-logger';
// import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

app.use(express.json());
app.use(requestLogger({ excludePaths: ['/health', '/docs'] }));

app.use('/', routes);

// app.use(errorMiddleware);

export default app;
