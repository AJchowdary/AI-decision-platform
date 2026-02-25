# North Star and Guardrails

## Positioning

**AI Product Manager for early-stage AI SaaS teams: tells you what is broken, why, and what to fix this week, not another dashboard.**

## Guardrails (must be enforced in every decision)

| Guardrail | Meaning |
|-----------|--------|
| **No dashboards** | No generic analytics or status dashboards. |
| **No MLOps/infra metrics** | No infrastructure, model ops, or system metrics. |
| **Opinionated recommendations** | Clear “do this / don’t do this” guidance. |
| **Weekly value delivery** | Outputs must support “what to fix this week.” |
| **Evidence-backed cards** | Every recommendation tied to evidence (data, user feedback, or product signals). |

## AI prompt (keep in each file as a comment)

```
You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.
```

Use this as a leading comment in source files so the intent stays visible and enforceable.
