import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/financeModels.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function createToken(userId) {
  if (!env.jwtSecret) {
    const error = new Error("JWT_SECRET is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign({}, env.jwtSecret, {
    subject: userId.toString(),
    expiresIn: "7d",
  });
}

function publicUser(user) {
  return { id: user._id, email: user.email };
}

function setSession(response, user) {
  response.cookie("access_token", createToken(user._id), cookieOptions);
  return response.json({ user: publicUser(user) });
}

export async function registerController(request, response) {
  const { email, password } = request.body;
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    response
      .status(409)
      .json({ detail: "An account already exists for this email." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email: normalizedEmail, passwordHash });
  setSession(response.status(201), user);
}

export async function loginController(request, response) {
  const user = await User.findOne({
    email: request.body.email.trim().toLowerCase(),
  }).select("+passwordHash");
  const validPassword =
    user && (await bcrypt.compare(request.body.password, user.passwordHash));

  if (!validPassword) {
    response.status(401).json({ detail: "Invalid email or password." });
    return;
  }

  setSession(response, user);
}

export async function currentUserController(request, response) {
  const user = await User.findById(request.userId);
  if (!user) {
    response.status(401).json({ detail: "Account no longer exists." });
    return;
  }
  response.json({ user: publicUser(user) });
}

export function logoutController(request, response) {
  response.clearCookie("access_token", cookieOptions).json({ ok: true });
}
