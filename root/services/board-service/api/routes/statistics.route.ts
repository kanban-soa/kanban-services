import { Router } from "express";
import { statisticsController } from "../controllers/statistics.controller";

const router = Router();

router.get("/metrics", statisticsController.metrics.bind(statisticsController));
router.get("/activities", statisticsController.activities.bind(statisticsController));
router.get("/priorities", statisticsController.priorities.bind(statisticsController));
router.get("/workloads", statisticsController.workloads.bind(statisticsController));

export default router;

