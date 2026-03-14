import re


AADHAAR_PATTERN = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
PAN_PATTERN = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
IFSC_PATTERN = re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b")
INCOME_AMOUNT_PATTERN = re.compile(r"(income|annual income|वार्षिक आय|आय)\D{0,20}(\d[\d,]*)", re.IGNORECASE)


def validate_document_content(document_type: str, extracted_text: str) -> list[str]:
    normalized_type = document_type.strip().lower()
    text = extracted_text or ""
    normalized_text = text.lower()
    issues: list[str] = []
    meaningful_chars = sum(char.isalnum() for char in text)
    word_count = len(normalized_text.split())

    if meaningful_chars < 8 and word_count < 2:
        issues.append(f"{document_type.replace('_', ' ').title()} could not be read clearly. Upload a clearer image or PDF.")
        return issues

    if normalized_type == "aadhaar_card":
        aadhaar_keywords = [
            "aadhaar",
            "government of india",
            "uidai",
            "unique identification",
            "आधार",
            "विशिष्ट पहचान",
            "जन आधार",
        ]
        compact_digits = "".join(char for char in text if char.isdigit())
        has_keyword = any(keyword in normalized_text for keyword in aadhaar_keywords)
        has_number = bool(AADHAAR_PATTERN.search(text)) or len(compact_digits) >= 12
        has_identity_hint = any(keyword in normalized_text for keyword in ["dob", "year of birth", "male", "female", "जन्म", "पुरुष", "महिला"])
        if meaningful_chars < 12 and not has_number:
            issues.append("Uploaded Aadhaar Card could not be read clearly enough to verify Aadhaar details.")
        elif not has_keyword and not has_number and not has_identity_hint:
            issues.append("Uploaded Aadhaar Card does not appear to contain Aadhaar details. The selected file may be unrelated or a screenshot.")
        elif (has_keyword or has_identity_hint) and not has_number:
            issues.append("Uploaded Aadhaar Card is missing a detectable 12-digit Aadhaar number.")

    if normalized_type == "pan_card":
        has_keyword = "income tax" in normalized_text or "permanent account number" in normalized_text or "pan" in normalized_text
        if not has_keyword and not PAN_PATTERN.search(text):
            issues.append("Uploaded PAN Card does not appear to contain PAN details.")

    if normalized_type == "income_certificate":
        income_keywords = [
            "income certificate",
            "annual income",
            "income",
            "certificate",
            "revenue department",
            "tehsildar",
            "आय प्रमाण",
            "आय",
            "प्रमाण पत्र",
            "तहसीलदार",
        ]
        has_income_keyword = any(keyword in normalized_text for keyword in income_keywords)
        has_income_amount = bool(INCOME_AMOUNT_PATTERN.search(text))
        has_certificate_hint = any(keyword in normalized_text for keyword in ["certificate", "certified", "प्रमाण", "प्रमाण पत्र"])
        if not has_income_keyword and not has_income_amount:
            issues.append("Uploaded Income Certificate does not look like an income certificate.")
        elif not has_certificate_hint:
            issues.append("Uploaded document mentions income-related text but does not clearly appear to be an official income certificate.")

    if normalized_type == "passbook":
        if not any(keyword in normalized_text for keyword in ["bank", "account", "passbook", "बैंक", "खाता"]) and not IFSC_PATTERN.search(text):
            issues.append("Uploaded Passbook does not look like a bank passbook.")

    if normalized_type == "caste_certificate":
        if not any(keyword in normalized_text for keyword in ["caste certificate", "scheduled caste", "scheduled tribe", "जाति", "अनुसूचित"]):
            issues.append("Uploaded Caste Certificate does not appear to match the selected document type.")

    return issues
