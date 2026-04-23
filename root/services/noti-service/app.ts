const express = require('express');

const app = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
});

const port = process.env.NOTI_PORT || 9004;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
