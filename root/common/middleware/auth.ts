import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "@/common/config/env";
import logger from "@/common/utils/logger";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Get token from Header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
      return res.status(401).json({ message: "Missing Token" });
    }
    
    try {
    // 2. Use secret from config file to verify
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 3. Save user information into request for controllers to use
    (req as any).user = decoded; 
    
    next(); // Allow request to go to Controller
  } catch (error) {
    logger.error("Error verifying token", error);
    return res.status(403).json({ message: "Invalid or Expired Token" });
  }
};