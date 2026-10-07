import { Router } from "express";
import {
  adviceController,
  chatController,
  firePlanController,
  scoreController,
} from "../controllers/financeController.js";
import {
  currentUserController,
  loginController,
  logoutController,
  registerController,
} from "../controllers/authController.js";
import {
  createBudgetController,
  createTransactionController,
  createGoalController,
  createHoldingController,
  deleteGoalController,
  getDashboardController,
  getFinanceProfileController,
  listGoalsController,
  listHoldingsController,
  listBudgetsController,
  listTransactionsController,
  updateGoalController,
  updateFinanceProfileController,
  listSnapshotsController,
  createSnapshotController,
} from "../controllers/financeDataController.js";
import { queryKnowledgeController } from "../controllers/knowledgeController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { requireDatabase } from "../middleware/database.js";
import { validateRequest } from "../middleware/validation.js";
import { aiRateLimit } from "../middleware/rateLimit.js";
import { authValidation } from "../validations/authValidation.js";
import {
  chatValidation,
  financeValidation,
} from "../validations/financeValidation.js";
import { profileValidation } from "../validations/profileValidation.js";
import {
  budgetValidation,
  transactionValidation,
} from "../validations/transactionValidation.js";

const router = Router();

router.get("/health", (request, response) => response.json({ status: "ok" }));
router.post(
  "/api/auth/register",
  requireDatabase,
  authValidation,
  validateRequest,
  asyncHandler(registerController),
);
router.post(
  "/api/auth/login",
  requireDatabase,
  authValidation,
  validateRequest,
  asyncHandler(loginController),
);
router.post("/api/auth/logout", logoutController);
router.get(
  "/api/auth/me",
  requireDatabase,
  authenticate,
  asyncHandler(currentUserController),
);
router.get(
  "/api/finance/profile",
  requireDatabase,
  authenticate,
  asyncHandler(getFinanceProfileController),
);
router.put(
  "/api/finance/profile",
  requireDatabase,
  authenticate,
  profileValidation,
  validateRequest,
  asyncHandler(updateFinanceProfileController),
);
router.get(
  "/api/transactions",
  requireDatabase,
  authenticate,
  asyncHandler(listTransactionsController),
);
router.post(
  "/api/transactions",
  requireDatabase,
  authenticate,
  transactionValidation,
  validateRequest,
  asyncHandler(createTransactionController),
);
router.get(
  "/api/budgets",
  requireDatabase,
  authenticate,
  asyncHandler(listBudgetsController),
);
router.post(
  "/api/budgets",
  requireDatabase,
  authenticate,
  budgetValidation,
  validateRequest,
  asyncHandler(createBudgetController),
);
router.get(
  "/api/dashboard",
  requireDatabase,
  authenticate,
  asyncHandler(getDashboardController),
);
router.get(
  "/api/snapshots",
  requireDatabase,
  authenticate,
  asyncHandler(listSnapshotsController),
);
router.post(
  "/api/snapshots",
  requireDatabase,
  authenticate,
  asyncHandler(createSnapshotController),
);
router.post(
  "/api/knowledge/query",
  aiRateLimit,
  requireDatabase,
  authenticate,
  chatValidation,
  validateRequest,
  asyncHandler(queryKnowledgeController),
);
router.get(
  "/api/goals",
  requireDatabase,
  authenticate,
  asyncHandler(listGoalsController),
);
router.post(
  "/api/goals",
  requireDatabase,
  authenticate,
  asyncHandler(createGoalController),
);
router.put(
  "/api/goals/:id",
  requireDatabase,
  authenticate,
  asyncHandler(updateGoalController),
);
router.delete(
  "/api/goals/:id",
  requireDatabase,
  authenticate,
  asyncHandler(deleteGoalController),
);
router.get(
  "/api/assets",
  requireDatabase,
  authenticate,
  asyncHandler(listHoldingsController),
);
router.post(
  "/api/assets",
  requireDatabase,
  authenticate,
  asyncHandler(createHoldingController),
);
router.get(
  "/api/liabilities",
  requireDatabase,
  authenticate,
  asyncHandler(listHoldingsController),
);
router.post(
  "/api/liabilities",
  requireDatabase,
  authenticate,
  asyncHandler(createHoldingController),
);
router.post(
  "/api/chat",
  aiRateLimit,
  requireDatabase,
  authenticate,
  chatValidation,
  validateRequest,
  asyncHandler(chatController),
);
router.post(
  "/api/advice",
  aiRateLimit,
  requireDatabase,
  authenticate,
  chatValidation,
  validateRequest,
  asyncHandler(adviceController),
);
router.post(
  "/api/score",
  financeValidation,
  validateRequest,
  asyncHandler(scoreController),
);
router.post(
  "/api/fire-plan",
  financeValidation,
  validateRequest,
  asyncHandler(firePlanController),
);

export default router;
