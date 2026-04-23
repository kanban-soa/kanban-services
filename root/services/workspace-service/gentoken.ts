import jwt from "jsonwebtoken";
import config from "./config/env";

const payload = {
  id: 1,
  email: "admin@test.com",
  role: "admin"
};

const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1d' });

console.log("--- COPY TOKEN ---");
console.log(token);