import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import decksRouter from "./decks";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/openai", openaiRouter);
router.use(decksRouter);

export default router;
