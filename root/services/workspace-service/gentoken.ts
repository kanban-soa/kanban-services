import jwt from "jsonwebtoken";
import config from "./config/env";

const payload = {
  id: "5169a843-02f5-442a-9043-95f87b87c703",
  email: "admin@test.com",
  role: "admin"
};

// Using command: npx tsx gentoken.ts to genarate token

const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1d' });

console.log("--- COPY TOKEN ---");
console.log(token);