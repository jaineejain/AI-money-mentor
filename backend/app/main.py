import os
from datetime import datetime
import json
import re
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

from app.models import ChatMessage, ChatReply, FirePlan, MoneyHealthScore, UserFinance

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

if GROQ_API_KEY:
    genai.configure(api_key=GROQ_API_KEY)

app = FastAPI(
    title="AI Money Mentor Backend",
    description="FastAPI backend for an AI-powered Indian personal finance advisor.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FinanceAdviceResponse(ChatMessage):
    response: str


SYSTEM_PROMPT = """
You are an AI-powered Indian personal finance advisor.

Guidelines:
- Give practical, beginner-friendly, and India-specific financial guidance.
- Consider Indian products, taxes, and terminology where relevant.
- Be clear about tradeoffs and avoid extreme or speculative advice.
- If information is missing, ask concise follow-up questions.
- Do not claim to be a licensed financial advisor.
- Encourage users to verify important decisions with a qualified professional.
""".strip()


CHAT_PROMPT_TEMPLATE = """
You are a friendly SEBI-registered Indian financial advisor.

User context summary:
{user_context_summary}

User question:
{question}

Write a conversational reply under 120 words.
Include specific rupee amounts where useful.
Suggest actionable next steps.
Keep the answer warm, practical, and India-specific.
Do not include bullets, headings, markdown, or disclaimers.
""".strip()


SCORE_PROMPT_TEMPLATE = """
You are evaluating a user's money health in the Indian financial context.

Input data:
- Age: {age}
- Monthly income: {monthly_income}
- Monthly expenses: {monthly_expenses}
- Existing savings: {existing_savings}
- Has insurance: {has_insurance}
- Has emergency fund: {has_emergency_fund}
- Goal: {goal}
- Savings rate: {savings_rate:.2f}%

Return ONLY valid JSON with exactly these keys:
- overall_score: integer from 0 to 100
- breakdown: object with exactly these 6 integer keys from 0 to 100:
  emergency_fund, insurance, investments, debt_health, tax_efficiency, retirement_readiness
- grade: one of A, B, C, D
- summary: short string
- top_3_actions: array of 3 strings
- fire_age: integer

Use Indian financial context and mention relevant concepts such as 80C, NPS, and ELSS where appropriate.
Be practical and specific.
Do not include markdown fences or any extra commentary.
""".strip()


FIRE_PLAN_PROMPT_TEMPLATE = """
You are creating a complete FIRE (Financial Independence Retire Early) roadmap for an Indian user.

Input data:
- Age: {age}
- Monthly income: {monthly_income}
- Monthly expenses: {monthly_expenses}
- Existing savings: {existing_savings}
- Has insurance: {has_insurance}
- Has emergency fund: {has_emergency_fund}
- Goal: {goal}

Return ONLY valid JSON with exactly these keys:
- fire_age: integer
- corpus_needed: integer in rupees
- monthly_sip_recommended: integer in rupees
- asset_allocation: object with exactly these 4 integer percentage keys:
    equity_mf, debt, gold, emergency
- year_wise_milestones: array of exactly 5 objects, each with year, action, target_amount
- tax_saving_plan: object with 80C_amount, NPS_amount, total_tax_saved

Use Indian context and mention SIP, mutual funds, PPF, and NPS where appropriate.
Keep recommendations realistic and practical for an Indian salaried user.
Do not include markdown fences or extra commentary.
""".strip()


def _extract_json_payload(text: str) -> dict:
    cleaned_text = text.strip()

    if cleaned_text.startswith("```"):
        cleaned_text = re.sub(r"^```(?:json)?\s*", "", cleaned_text)
        cleaned_text = re.sub(r"\s*```$", "", cleaned_text)

    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned_text, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _build_user_context_summary(user_context: dict) -> str:
    age = user_context.get("age", "not provided")
    monthly_income = user_context.get("monthly_income", "not provided")
    existing_savings = user_context.get("existing_savings", "not provided")
    return (
        f"Age: {age}; Monthly income: INR {monthly_income}; "
        f"Existing savings: INR {existing_savings}."
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatReply)
def chat_with_advisor(payload: ChatMessage) -> ChatReply:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Add it to backend/.env before calling this endpoint.",
        )

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    prompt = CHAT_PROMPT_TEMPLATE.format(
        user_context_summary=_build_user_context_summary(payload.user_context),
        question=payload.question.strip(),
    )

    try:
        result = model.generate_content(prompt)
        response_text = (result.text or "").strip()
    except Exception as exc:  # pragma: no cover - defensive wrapper around external API
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    if not response_text:
        raise HTTPException(status_code=502, detail="Gemini returned an empty response.")

    return ChatReply(
        reply=response_text,
        timestamp=datetime.now().astimezone().isoformat(timespec="seconds"),
    )


@app.post("/api/advice", response_model=FinanceAdviceResponse)
def get_finance_advice(payload: ChatMessage) -> FinanceAdviceResponse:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Add it to backend/.env before calling this endpoint.",
        )

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    prompt_parts: List[str] = [
        f"User question: {payload.question.strip()}",
    ]
    if payload.user_context:
        prompt_parts.append(f"User context: {payload.user_context}")

    prompt_parts.append(
        "Respond with concise, actionable personal finance advice tailored to India."
    )

    try:
        result = model.generate_content("\n\n".join(prompt_parts))
        response_text = (result.text or "").strip()
    except Exception as exc:  # pragma: no cover - defensive wrapper around external API
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    if not response_text:
        raise HTTPException(status_code=502, detail="Gemini returned an empty response.")

    return FinanceAdviceResponse(
        question=payload.question,
        user_context=payload.user_context,
        response=response_text,
    )


@app.post("/api/score", response_model=MoneyHealthScore)
def get_money_health_score(payload: UserFinance) -> MoneyHealthScore:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Add it to backend/.env before calling this endpoint.",
        )

    income = payload.monthly_income
    expenses = payload.monthly_expenses
    savings_rate = 0.0 if income <= 0 else ((income - expenses) / income) * 100

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction="You generate strict JSON only.",
    )

    prompt = SCORE_PROMPT_TEMPLATE.format(
        age=payload.age,
        monthly_income=payload.monthly_income,
        monthly_expenses=payload.monthly_expenses,
        existing_savings=payload.existing_savings,
        has_insurance=payload.has_insurance,
        has_emergency_fund=payload.has_emergency_fund,
        goal=payload.goal,
        savings_rate=savings_rate,
    )

    try:
        result = model.generate_content(prompt)
        response_text = (result.text or "").strip()
        parsed_json = _extract_json_payload(response_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Gemini returned invalid JSON: {exc}") from exc
    except Exception as exc:  # pragma: no cover - defensive wrapper around external API
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    try:
        score = MoneyHealthScore.model_validate(parsed_json)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini JSON did not match expected schema: {exc}") from exc

    return score


@app.post("/api/fire-plan", response_model=FirePlan)
def get_fire_plan(payload: UserFinance) -> FirePlan:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Add it to backend/.env before calling this endpoint.",
        )

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction="You generate strict JSON only.",
    )

    prompt = FIRE_PLAN_PROMPT_TEMPLATE.format(
        age=payload.age,
        monthly_income=payload.monthly_income,
        monthly_expenses=payload.monthly_expenses,
        existing_savings=payload.existing_savings,
        has_insurance=payload.has_insurance,
        has_emergency_fund=payload.has_emergency_fund,
        goal=payload.goal,
    )

    try:
        result = model.generate_content(prompt)
        response_text = (result.text or "").strip()
        parsed_json = _extract_json_payload(response_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Gemini returned invalid JSON: {exc}") from exc
    except Exception as exc:  # pragma: no cover - defensive wrapper around external API
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    try:
        fire_plan = FirePlan.model_validate(parsed_json)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini JSON did not match expected schema: {exc}") from exc

    return fire_plan
