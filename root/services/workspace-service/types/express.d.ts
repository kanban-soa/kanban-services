import { JwtUser } from "./interface";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}