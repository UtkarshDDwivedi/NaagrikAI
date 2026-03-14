CRITICAL_DOCUMENTS = {
    "forest_noc",
    "environment_clearance",
    "land_document",
    "income_certificate",
    "aadhaar_card",
    "caste_certificate",
    "passbook",
}


def build_feature_vector(
    missing_documents: list[str],
    mismatches: list[str],
    compliance_issues: list[str],
    required_document_count: int,
) -> dict[str, int]:
    normalized_missing = {item.strip().lower() for item in missing_documents}
    mismatch_total = len(mismatches)
    critical_missing = sum(1 for item in normalized_missing if item in CRITICAL_DOCUMENTS)
    compliance_total = len(compliance_issues)
    ocr_failure_count = sum(1 for item in compliance_issues if "ocr failed" in item.lower())
    unreadable_document_count = sum(1 for item in compliance_issues if "could not be read clearly" in item.lower())

    return {
        "required_document_count": required_document_count,
        "missing_document_count": len(normalized_missing),
        "mismatch_count": mismatch_total,
        "compliance_issue_count": compliance_total,
        "critical_missing_count": critical_missing,
        "ocr_failure_count": ocr_failure_count,
        "unreadable_document_count": unreadable_document_count,
        "has_address_mismatch": int(any("address mismatch" in item.lower() for item in mismatches)),
        "has_name_mismatch": int(any("name mismatch" in item.lower() for item in mismatches)),
    }


def calculate_risk_score(features: dict[str, int]) -> float:
    required_count = max(features["required_document_count"], 1)
    missing_ratio = features["missing_document_count"] / required_count

    score = 5.0
    score += missing_ratio * 72.0
    score += features["critical_missing_count"] * 7.0
    score += features["mismatch_count"] * 12.0
    score += features["compliance_issue_count"] * 5.0
    score += features["ocr_failure_count"] * 10.0
    score += features["unreadable_document_count"] * 6.0

    if features["has_address_mismatch"]:
        score += 8.0

    if features["has_name_mismatch"]:
        score += 6.0

    return round(min(score, 98.0), 2)


def predict_rejection(
    missing_documents: list[str],
    mismatches: list[str],
    compliance_issues: list[str] | None = None,
    required_document_count: int = 0,
) -> dict[str, float | str | dict[str, int]]:
    features = build_feature_vector(
        missing_documents,
        mismatches,
        compliance_issues or [],
        required_document_count,
    )
    risk_score = calculate_risk_score(features)

    if risk_score >= 70:
        label = "High"
    elif risk_score >= 40:
        label = "Medium"
    else:
        label = "Low"

    return {"risk_score": risk_score, "risk_label": label, "features": features}
