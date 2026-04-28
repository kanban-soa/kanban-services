import dotenv from 'dotenv';
dotenv.config({
  debug: true
});
import express from 'express';
import { pool } from '@/board-service/config/database';

const app = express();

app.use(express.json());

const port = process.env.BOARD_PORT;

if (!port) {
    throw new Error('BOARD_PORT is not defined');
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

//Kiểm tra kết nối DB ngay khi khởi động
pool.query('SELECT 1')
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error('Database connection failed:', err));

pool.on('connect', () => {
    console.log('A new database client connected');
});
