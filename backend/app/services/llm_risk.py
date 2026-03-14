import json
import os
from typing import Any
from urllib import error, request


RESPONSES_API_URL = os.getenv("OPENAI_RESPONSES_URL", "https://api.openai.com/v1/responses")
DEFAULT_MODEL = os.getenv("OPENAI_RISK_MODEL", "gpt-4o-mini")

RISK_SCHEMA = {
    "type": "object",
    "properties": {
        "risk_score": {"type": "number", "minimum": 0, "maximum": 100},
        "risk_label": {"type": "string", "enum": ["Low", "Medium", "High"]},
        "summary": {"type": "string"},
        "reasons": {
            "type": "array",
            "items": {"type": "string"},
            "maxItems": 4,
        },
        "next_action": {"type": "string"},
    },
    "required": ["risk_score", "risk_label", "summary", "reasons", "next_action"],
    "additionalProperties": False,
}


def _build_prompt(
    application_type: str,
    missing_documents: list[str],
    mismatch_warnings: list[str],
    compliance_issues: list[str],
    form_data: dict[str, str],
) -> str:
    payload = {
        "application_type": application_type,
        "missing_documents": missing_documents,
        "mismatch_warnings": mismatch_warnings,
        "compliance_issues": compliance_issues,
        "form_data": form_data,
    }
    return json.dumps(payload, ensure_ascii=True, indent=2)


def assess_risk_with_llm(
    application_type: str,
    missing_documents: list[str],
    mismatch_warnings: list[str],
    compliance_issues: list[str],
    form_data: dict[str, str],
) -> dict[str, Any] | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    body = {
        "model": DEFAULT_MODEL,
        "input": [
            {
                "role": "developer",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "You are a government application risk assessor. "
                            "Assess rejection risk from the supplied application facts only. "
                            "Do not invent missing evidence. "
                            "Use higher risk when critical documents are missing or when identity/address mismatches exist. "
                            "Return concise structured output."
                        ),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": _build_prompt(
                            application_type,
                            missing_documents,
                            mismatch_warnings,
                            compliance_issues,
                            form_data,
                        ),
                    }
                ],
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "risk_assessment",
                "strict": True,
                "schema": RISK_SCHEMA,
            }
        },
    }

    req = request.Request(
        RESPONSES_API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            parsed = json.loads(response.read().decode("utf-8"))
    except (error.HTTPError, error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    output_text = parsed.get("output_text")
    if not output_text:
        return None

    try:
        result = json.loads(output_text)
    except json.JSONDecodeError:
        return None

    return {
        "risk_score": round(float(result["risk_score"]), 2),
        "risk_label": str(result["risk_label"]),
        "summary": str(result["summary"]),
        "reasons": [str(item) for item in result.get("reasons", [])],
        "next_action": str(result["next_action"]),
        "model": DEFAULT_MODEL,
    }
