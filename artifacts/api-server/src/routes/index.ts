import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import socialRouter from "./social";
import musicRouter from "./music";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(socialRouter);
router.use(musicRouter);
router.use(analyticsRouter);

export default router;
