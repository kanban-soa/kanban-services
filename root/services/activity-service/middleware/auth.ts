import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Missing user identity headers",
    });
  }

  req.user = {
    id: userId as string,
    email: req.headers["x-user-email"] as string | undefined,
    role: req.headers["x-user-role"] as string | undefined,
  };

  next();
};

