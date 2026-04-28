import app from "./index";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.AUTH_PORT || 9001;

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
