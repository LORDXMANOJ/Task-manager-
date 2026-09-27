import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validators";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), auth.register);
router.post("/login", authLimiter, validate(loginSchema), auth.login);
router.post("/logout", requireAuth, auth.logout);
router.get("/me", requireAuth, auth.me);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), auth.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), auth.resetPassword);

export default router;
