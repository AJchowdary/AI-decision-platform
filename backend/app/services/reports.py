# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

from datetime import datetime, timezone, timedelta
from typing import Any


def _priority_score(card: dict) -> float:
    impact = int(card.get("impact_level") or 3)
    effort = int(card.get("effort_estimate") or 3)
    conf = float(card.get("confidence_score") or 0.6)
    return impact * 2 + conf * 5 - effort


def _one_thing_not_to_change(cards: list[dict], openai_api_key: str) -> str:
    """Suggest one positive pattern / thing to keep doing (PM voice)."""
    if not openai_api_key or not cards:
        return "Keep focusing on one high-impact fix this week; don't spread effort across everything."
    try:
        from openai import OpenAI
        client = OpenAI(api_key=openai_api_key)
        top_problems = [c.get("problem", "")[:100] for c in cards[:3]]
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior PM. In one short sentence, suggest ONE thing this team should NOT change—a positive pattern or habit to keep. No jargon. Example: 'Your users are giving clear feedback—keep collecting it.'",
                },
                {
                    "role": "user",
                    "content": f"Top issues this week: {top_problems}. What's one thing not to change?",
                },
            ],
            temperature=0.3,
            max_tokens=80,
        )
        text = (resp.choices[0].message.content or "").strip()
        return text[:300] if text else "Keep iterating on the top fix; don't context-switch."
    except Exception:
        return "Keep focusing on one high-impact fix this week; don't spread effort across everything."


def generate_weekly_report(
    cards: list[dict[str, Any]],
    openai_api_key: str = "",
) -> dict[str, Any]:
    """
    Build weekly report: top 3 issues, 1 focus card (thing to fix this week), 1 thing not to change.
    cards: list of decision card dicts (will be sorted by priority; use last 7–14 days in caller).
    """
    sorted_cards = sorted(cards, key=_priority_score, reverse=True)
    top_3 = sorted_cards[:3]
    focus_card = top_3[0] if top_3 else None
    thing_not_to_change = _one_thing_not_to_change(top_3, openai_api_key)

    report = {
        "top_3_issues": [
            {
                "id": c.get("id"),
                "problem": c.get("problem"),
                "recommended_action": c.get("recommended_action"),
                "impact_level": c.get("impact_level"),
                "effort_estimate": c.get("effort_estimate"),
            }
            for c in top_3
        ],
        "focus_fix": {
            "id": focus_card.get("id"),
            "problem": focus_card.get("problem"),
            "recommended_action": focus_card.get("recommended_action"),
        } if focus_card else None,
        "thing_not_to_change": thing_not_to_change,
    }

    # Markdown-like summary for email or copy
    lines = ["# Weekly AI Product Report", ""]
    lines.append("## Top 3 issues")
    for i, c in enumerate(top_3, 1):
        lines.append(f"{i}. **{c.get('problem', '')}**")
        lines.append(f"   → {c.get('recommended_action', '')}")
        lines.append("")
    if focus_card:
        lines.append("## 1 thing to fix this week")
        lines.append(f"**{focus_card.get('problem', '')}**")
        lines.append(focus_card.get("recommended_action", ""))
        lines.append("")
    lines.append("## 1 thing not to change")
    lines.append(thing_not_to_change)
    report["summary_markdown"] = "\n".join(lines)

    # Short standup copy (plain text)
    standup = []
    if focus_card:
        standup.append(f"This week: {focus_card.get('recommended_action', '')}")
    standup.append(f"Keep: {thing_not_to_change}")
    report["standup_copy"] = " ".join(standup)

    return report
