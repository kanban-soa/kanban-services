import express from "express";
import "dotenv/config";
import { authMiddleware } from "./middleware/auth";
import { v1Routes } from "./api/routes/v1";
import { registerSwaggerDocs } from "./api/docs/swagger";
import { requestLogger } from "../../common/middleware/request-logger";

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 9002;

app.use(express.json());
app.use(requestLogger({ excludePaths: ["/health", "/docs"] }));
registerSwaggerDocs(app);
app.use("/api", authMiddleware, v1Routes);

app.listen(port, () => {
  console.log(`🚀 Server is running on port http://localhost:${port}`);
});

export default app;
