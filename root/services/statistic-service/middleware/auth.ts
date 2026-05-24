import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"];

  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing x-user-id header",
        from: "Statistic service"
      },
    });
  }

  req.user = {
    id: userId,
    email: typeof req.headers["x-user-email"] === "string" ? req.headers["x-user-email"] : undefined,
    name: typeof req.headers["x-user-name"] === "string" ? req.headers["x-user-name"] : undefined,
    role: typeof req.headers["x-user-role"] === "string" ? req.headers["x-user-role"] : undefined,
  };

  next();
};
