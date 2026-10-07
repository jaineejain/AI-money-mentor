import { body } from "express-validator";

export const profileValidation = [
  body("age").isInt({ min: 0, max: 120 }).toInt(),
  body("monthly_income").isFloat({ min: 0 }).toFloat(),
  body("monthly_expenses").isFloat({ min: 0 }).toFloat(),
  body("existing_savings").optional().isFloat({ min: 0 }).toFloat(),
  body("has_insurance").optional().isBoolean().toBoolean(),
  body("has_emergency_fund").optional().isBoolean().toBoolean(),
  body("goal").optional().isString().trim().isLength({ min: 1, max: 80 }),
];
