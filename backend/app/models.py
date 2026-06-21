from typing import Any

from pydantic import BaseModel, Field


class UserFinance(BaseModel):
    age: int
    monthly_income: float
    monthly_expenses: float
    existing_savings: float = 0
    has_insurance: bool = False
    has_emergency_fund: bool = False
    goal: str = "retirement"


class ChatMessage(BaseModel):
    question: str
    user_context: dict[str, Any] = Field(default_factory=dict)


class ChatReply(BaseModel):
    reply: str
    timestamp: str


class MoneyHealthScore(BaseModel):
    overall_score: int
    breakdown: dict[str, int]
    grade: str
    summary: str
    top_3_actions: list[str]
    fire_age: int


class FirePlanMilestone(BaseModel):
    year: int
    action: str
    target_amount: int


class TaxSavingPlan(BaseModel):
    amount_80c: int = Field(alias="80C_amount")
    nps_amount: int
    total_tax_saved: int


class FireAssetAllocation(BaseModel):
    equity_mf: int
    debt: int
    gold: int
    emergency: int


class FirePlan(BaseModel):
    fire_age: int
    corpus_needed: int
    monthly_sip_recommended: int
    asset_allocation: FireAssetAllocation
    year_wise_milestones: list[FirePlanMilestone]
    tax_saving_plan: TaxSavingPlan