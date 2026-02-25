# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import json
from typing import Any, List, Dict

from openai import OpenAI


def _llm_generate_cards_for_insight(insight: dict, api_key: str) -> list[dict[str, Any]]:
  """
  Use an LLM to turn a single Insight into 1–3 Decision Cards.
  Each card: problem, evidence_snippets, recommended_action, impact_level (1–5), effort_estimate (1–5), confidence_score (0–1).
  """
  if not api_key:
    return []
  client = OpenAI(api_key=api_key)
  examples = insight.get("example_snippets") or []
  root = insight.get("root_cause") or {}
  freq = insight.get("frequency") or 0
  avg_feedback = insight.get("avg_feedback") or ""
  prompt = {
    "title": insight.get("title", ""),
    "description": insight.get("description", ""),
    "root_cause": root,
    "frequency": freq,
    "avg_feedback": avg_feedback,
    "example_snippets": examples[:3],
  }
  resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
      {
        "role": "system",
        "content": (
          "You are a senior product manager for an AI SaaS product. "
          "Convert each failure-pattern Insight into 1–3 concrete Decision Cards that a small team can ship THIS WEEK. "
          "No dashboards, no metrics jargon. Each card must be opinionated and shippable.\n\n"
          "Return ONLY valid JSON: an array of objects with keys:\n"
          "problem (string, 1 sentence),\n"
          "evidence_snippets (array of 2–3 short strings),\n"
          "recommended_action (string, specific change this week),\n"
          "impact_level (integer 1–5, 5=highest impact),\n"
          "effort_estimate (integer 1–5, 5=highest effort),\n"
          "confidence_score (float 0–1).\n"
        ),
      },
      {
        "role": "user",
        "content": (
          "Here is one failure-pattern Insight as JSON:\n"
          f"{json.dumps(prompt, ensure_ascii=False)}\n\n"
          "Now output ONLY a JSON array of Decision Cards as described."
        ),
      },
    ],
    temperature=0.3,
  )
  text = (resp.choices[0].message.content or "").strip()
  if text.startswith("```"):
    text = text.split("```")[1].replace("json", "").strip()
  try:
    data = json.loads(text)
  except json.JSONDecodeError:
    return []
  if not isinstance(data, list):
    return []
  cards: list[dict[str, Any]] = []
  for item in data:
    if not isinstance(item, dict):
      continue
    try:
      impact = int(item.get("impact_level", 3))
      effort = int(item.get("effort_estimate", 3))
      conf = float(item.get("confidence_score", 0.6))
    except (TypeError, ValueError):
      impact, effort, conf = 3, 3, 0.6
    cards.append(
      {
        "problem": str(item.get("problem", ""))[:500],
        "evidence_snippets": list(item.get("evidence_snippets") or [])[:3],
        "recommended_action": str(item.get("recommended_action", ""))[:800],
        "impact_level": max(1, min(5, impact)),
        "effort_estimate": max(1, min(5, effort)),
        "confidence_score": max(0.0, min(1.0, conf)),
        "status": "open",
      }
    )
  return cards


def generate_decision_cards_for_account(
  insights: List[Dict[str, Any]],
  existing_cards_by_insight: Dict[str, List[Dict[str, Any]]],
  account_id: str,
  openai_api_key: str,
) -> List[Dict[str, Any]]:
  """
  For each Insight that does NOT already have Decision Cards, ask the LLM for 1–3 cards.
  Returns rows ready to insert into decision_cards.
  """
  all_cards: list[dict[str, Any]] = []
  for insight in insights:
    ins_id = insight.get("id")
    if not ins_id:
      continue
    if ins_id in existing_cards_by_insight and existing_cards_by_insight[ins_id]:
      # Skip if cards already exist for this insight
      continue
    cards = _llm_generate_cards_for_insight(insight, openai_api_key)
    for card in cards:
      all_cards.append(
        {
          "account_id": account_id,
          "insight_id": ins_id,
          "problem": card["problem"],
          "evidence_snippets": card["evidence_snippets"],
          "recommended_action": card["recommended_action"],
          "impact_level": card["impact_level"],
          "effort_estimate": card["effort_estimate"],
          "confidence_score": card["confidence_score"],
          "status": card.get("status", "open"),
        }
      )
  return all_cards

