import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import generateRouter from "./generate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentRouter);
router.use(generateRouter);

export default router;
