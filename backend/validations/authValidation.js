import { body } from "express-validator";

export const authValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 8, max: 128 }),
];
