import { Request, Response, NextFunction } from "express";
import { logger } from "../../../common/utils/logger";

// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         email: string;
//         role: string;
//       };
//     }
//   }
// }

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for CORS preflight requests
  if (req.method === "OPTIONS") {
    return next();
  }

  const userId = req.headers["x-user-id"];
  const userEmail = req.headers["x-user-email"];
  const userRole = req.headers["x-user-role"];

  if (!userId || !userEmail || !userRole) {
    return res.status(401).json({ message: "Missing user identity headers" });
  }

  req.user = {
    id: userId as string,
    email: userEmail as string,
    role: userRole as string,
  };

  logger.info(`Authenticated user ${req.user.email} with role ${req.user.role}`);

  next();
};
