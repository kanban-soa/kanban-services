import { Request, Response, NextFunction } from "express";

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

  next();
};
