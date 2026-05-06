import express from "express";
import "dotenv/config";
import { authMiddleware } from "@/common/middleware/auth";
import { v1Routes } from "./api/routes/v1";
import { registerSwaggerDocs } from "./api/docs/swagger";

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 9002;

app.use(express.json());
registerSwaggerDocs(app);
app.use("/api/v1", authMiddleware, v1Routes);

app.listen(port, () => {
  console.log(`🚀 Server is running on port http://localhost:${port}`);
});

export default app;
