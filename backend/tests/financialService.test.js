import assert from "node:assert/strict";
import {
  calculateEmergencyFund,
  calculateFIRE,
  calculateGoal,
  calculateNetWorth,
  calculateSIP,
  calculateSavings,
} from "../services/financialService.js";

assert.equal(calculateSavings(100000, 60000).savings, 40000);
assert.equal(calculateSavings(100000, 60000).savingsRate, 40);
assert.equal(calculateEmergencyFund(50000, 6).recommended, 300000);
assert.equal(
  calculateNetWorth([{ amount: 100 }], [{ amount: 30 }]).netWorth,
  70,
);
assert.ok(
  calculateSIP({ monthlyInvestment: 10000, years: 10 }).projectedCorpus >
    1200000,
);
assert.equal(calculateFIRE({ monthlyExpenses: 50000 }).corpusNeeded, 15000000);
assert.ok(
  calculateGoal({
    targetAmount: 120000,
    currentAmount: 20000,
    targetDate: "2030-01-01",
  }).requiredMonthlyContribution >= 0,
);
console.log("financialService tests passed");
