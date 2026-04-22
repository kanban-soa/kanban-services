import { Router } from "express";
import { statisticsRoutes } from "./statistics";

export const v1Routes = Router();

v1Routes.use("/statistics", statisticsRoutes);
