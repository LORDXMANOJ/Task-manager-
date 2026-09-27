import { Router } from "express";
import * as users from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from "../validators/auth.validators";

const router = Router();

router.use(requireAuth);

router.patch("/me", validate(updateProfileSchema), users.updateProfile);
router.patch("/me/password", authLimiter, validate(changePasswordSchema), users.changePassword);
router.delete("/me", authLimiter, validate(deleteAccountSchema), users.deleteAccount);

export default router;
