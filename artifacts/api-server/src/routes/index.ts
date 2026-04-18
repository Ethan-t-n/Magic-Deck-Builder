import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import decksRouter from "./decks";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use(decksRouter);

export default router;
