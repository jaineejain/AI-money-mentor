import { body } from "express-validator";

const optionalFinanceFields = [
  body("existing_savings").optional().isFloat({ min: 0 }).toFloat(),
  body("has_insurance").optional().isBoolean().toBoolean(),
  body("has_emergency_fund").optional().isBoolean().toBoolean(),
  body("goal").optional().isString().trim().isLength({ min: 1 }),
];

export const financeValidation = [
  body("age").isInt({ min: 0 }).toInt(),
  body("monthly_income").isFloat({ min: 0 }).toFloat(),
  body("monthly_expenses").isFloat({ min: 0 }).toFloat(),
  ...optionalFinanceFields,
];

export const chatValidation = [
  body("question").isString().trim().isLength({ min: 1, max: 1000 }),
  body("user_context").optional().isObject(),
];
