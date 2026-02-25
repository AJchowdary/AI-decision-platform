# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import json
from typing import Any

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import normalize

MAX_NEGATIVE_LOGS = 2000
OPENAI_TIMEOUT_SEC = 60


def _get_embeddings(texts: list[str], api_key: str) -> list[list[float]]:
    """OpenAI embeddings. Swap provider by replacing this and env."""
    if not api_key or not texts:
        return []
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, timeout=OPENAI_TIMEOUT_SEC)
        out = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        by_idx = {d.index: d.embedding for d in out.data}
        return [by_idx[i] for i in range(len(texts))]
    except Exception as e:
        raise RuntimeError(f"Embedding API failed: {e}") from e


def _explain_failure_cluster(summary: str, api_key: str) -> dict[str, str]:
    """LLM: non-technical explanation for a failure cluster. Returns failure_cause, user_expectation, system_behavior."""
    if not api_key:
        return {"failure_cause": "", "user_expectation": "", "system_behavior": ""}
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, timeout=OPENAI_TIMEOUT_SEC)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior product manager advising a startup founder. Explain why an AI feature is failing in plain language. No jargon (no 'cluster', 'embedding', 'latency'). Output valid JSON only with keys: failure_cause, user_expectation, system_behavior. One sentence each.",
                },
                {"role": "user", "content": f"Failure pattern summary:\n{summary}\n\nReturn JSON with failure_cause, user_expectation, system_behavior."},
            ],
            temperature=0.3,
        )
        text = (resp.choices[0].message.content or "").strip()
        if text.startswith("```"):
            text = text.split("```")[1].replace("json", "").strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"failure_cause": text[:200], "user_expectation": "", "system_behavior": ""}
    except Exception as e:
        raise RuntimeError(f"LLM API failed: {e}") from e


def _is_negative_feedback(log: dict[str, Any]) -> bool:
    ft = (log.get("feedback_type") or "").lower()
    fv = log.get("feedback_value")
    if ft in ("thumb_down", "thumbs_down", "negative", "down"):
        return True
    if ft in ("thumb_up", "thumbs_up", "positive", "up"):
        return False
    try:
        v = float(fv) if fv is not None else None
        if v is not None and v < 3.0:
            return True
        if v is not None and v >= 3.0:
            return False
    except (TypeError, ValueError):
        pass
    return False


def run_insight_engine(
    logs: list[dict[str, Any]],
    account_id: str,
    openai_api_key: str,
) -> list[dict[str, Any]]:
    """
    Filter to negative feedback, embed input+output, cluster, explain with LLM.
    Returns list of insight dicts ready for DB: title, description, example_snippets, frequency, avg_feedback, root_cause.
    Caps at MAX_NEGATIVE_LOGS (newest first). Never sets n_clusters > n.
    """
    negative = [l for l in logs if _is_negative_feedback(l)]
    if not negative:
        return []
    # Cap workload: newest first, deterministically
    if len(negative) > MAX_NEGATIVE_LOGS:
        negative = sorted(negative, key=lambda x: x.get("timestamp") or "", reverse=True)[:MAX_NEGATIVE_LOGS]

    texts = []
    for log in negative:
        inp = (log.get("input") or "")[:2000]
        out = (log.get("output") or "")[:2000]
        texts.append(f"input: {inp}\noutput: {out}")

    embeddings = _get_embeddings(texts, openai_api_key)
    if len(embeddings) != len(negative):
        return []

    X = np.array(embeddings, dtype=np.float64)
    X = normalize(X, axis=1)
    n = len(X)
    n_clusters = min(10, max(1, n // 3))
    n_clusters = min(n_clusters, n)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X)

    insights = []
    for c in range(n_clusters):
        idx = [i for i in range(n) if labels[i] == c]
        if not idx:
            continue
        cluster_logs = [negative[i] for i in idx]
        snippets = []
        for log in cluster_logs[:5]:
            snippets.append({
                "input": (log.get("input") or "")[:300],
                "output": (log.get("output") or "")[:300],
            })
        fvs = []
        for log in cluster_logs:
            v = log.get("feedback_value")
            try:
                fvs.append(float(v))
            except (TypeError, ValueError):
                pass
        avg_fb = str(round(sum(fvs) / len(fvs), 2)) if fvs else None
        summary = (
            f"Pattern: {len(cluster_logs)} similar conversations with negative feedback. "
            f"Example: user said \"{cluster_logs[0].get('input', '')[:150]}...\" "
            f"and got \"{cluster_logs[0].get('output', '')[:150]}...\""
        )
        root = _explain_failure_cluster(summary, openai_api_key)
        title = (root.get("failure_cause") or "Failure pattern")[:200]
        desc = f"Users expected: {root.get('user_expectation', '')}. System behaved: {root.get('system_behavior', '')}"[:500]
        insights.append({
            "account_id": account_id,
            "title": title or f"Negative feedback pattern ({len(cluster_logs)} conversations)",
            "description": desc or summary[:500],
            "example_snippets": snippets,
            "frequency": len(cluster_logs),
            "avg_feedback": avg_fb,
            "root_cause": root,
        })
    return insights
