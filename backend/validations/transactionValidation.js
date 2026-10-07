import { body, param } from "express-validator";

export const transactionValidation = [
  body("type").isIn(["income", "expense"]),
  body("amount").isFloat({ min: 0.01 }).toFloat(),
  body("category").isString().trim().isLength({ min: 1, max: 80 }),
  body("description").optional().isString().trim().isLength({ max: 240 }),
  body("transactionDate").optional().isISO8601().toDate(),
];

export const budgetValidation = [
  body("month").matches(/^\\d{4}-(0[1-9]|1[0-2])$/),
  body("category").optional().isString().trim().isLength({ min: 1, max: 80 }),
  body("limit").isFloat({ min: 0.01 }).toFloat(),
];

export const idValidation = [param("id").isMongoId()];
