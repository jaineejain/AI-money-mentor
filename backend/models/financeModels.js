import mongoose from "mongoose";

const { Schema } = mongoose;

export const userFinanceSchema = new Schema(
  {
    age: { type: Number, required: true, min: 0 },
    monthly_income: { type: Number, required: true, min: 0 },
    monthly_expenses: { type: Number, required: true, min: 0 },
    existing_savings: { type: Number, default: 0, min: 0 },
    has_insurance: { type: Boolean, default: false },
    has_emergency_fund: { type: Boolean, default: false },
    goal: { type: String, default: "retirement" },
  },
  { _id: false },
);

export const chatMessageSchema = new Schema(
  {
    question: { type: String, required: true },
    user_context: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    finance: { type: userFinanceSchema, default: undefined },
  },
  { timestamps: true },
);

const transactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 240 },
    transactionDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

const budgetSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    category: { type: String, default: "overall", trim: true, maxlength: 80 },
    limit: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: true },
);

budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
export const Transaction = mongoose.model("Transaction", transactionSchema);
export const Budget = mongoose.model("Budget", budgetSchema);

const goalSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    expectedReturn: { type: Number, default: 8, min: 0, max: 100 },
  },
  { timestamps: true },
);

const holdingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const Goal = mongoose.model("Goal", goalSchema);
export const Asset = mongoose.model("Asset", holdingSchema);
export const Liability = mongoose.model("Liability", holdingSchema);

const knowledgeChunkSchema = new Schema(
  {
    documentId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], default: undefined },
    title: { type: String, required: true },
    source: { type: String, required: true },
    url: { type: String, required: true },
    category: { type: String, required: true },
    version: { type: String, default: "" },
  },
  { timestamps: true },
);

knowledgeChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

const financialSnapshotSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    snapshotDate: { type: Date, required: true },
    income: { type: Number, default: 0, min: 0 },
    expenses: { type: Number, default: 0, min: 0 },
    savings: { type: Number, default: 0 },
    netWorth: { type: Number, default: 0 },
    investments: { type: Number, default: 0, min: 0 },
    healthScore: { type: Number, default: 0, min: 0, max: 100 },
    fireProjection: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

financialSnapshotSchema.index({ user: 1, snapshotDate: -1 });
financialSnapshotSchema.index({ user: 1, snapshotDate: 1 }, { unique: true });

export const KnowledgeChunk = mongoose.model(
  "KnowledgeChunk",
  knowledgeChunkSchema,
);
export const FinancialSnapshot = mongoose.model(
  "FinancialSnapshot",
  financialSnapshotSchema,
);
export const userFinanceModel = User;
