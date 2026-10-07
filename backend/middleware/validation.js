import { validationResult } from "express-validator";

export function validateRequest(request, response, next) {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    response.status(422).json({ detail: errors.array() });
    return;
  }

  next();
}
