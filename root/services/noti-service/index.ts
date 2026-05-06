import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { pool } from '@/noti-service/config';
import { notificationRouter } from '@/noti-service/routes/';

dotenv.config({
  debug: true
});

const app = express();

app.use(express.json());

// Routes
app.use('/api/notifications', notificationRouter);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Notification service is running' });
});

const port = process.env.NOTI_PORT;

if (!port) {
    throw new Error('NOTI_PORT is not defined');
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

pool.on('connect', () => {
    console.log('Database connected');
});
