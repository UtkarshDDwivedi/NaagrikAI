import re
from typing import Any


ADDRESS_PATTERN = re.compile(r"(?:address|addr)[:\s]+([A-Za-z0-9,\-\s]+)", re.IGNORECASE)
NAME_PATTERN = re.compile(r"(?:name|applicant)[:\s]+([A-Za-z\s]+)", re.IGNORECASE)
CERT_PATTERN = re.compile(r"(?:certificate\s*no|certificate_number|cert no)[:\s]+([A-Za-z0-9\-\/]+)", re.IGNORECASE)
AADHAAR_PATTERN = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
NAME_LINE_PATTERN = re.compile(r"^[A-Za-z][A-Za-z .'-]{2,}$")
AADHAAR_ANCHOR_PATTERN = re.compile(r"(dob|year of birth|male|female|महिला|पुरुष|जन्म)", re.IGNORECASE)
HEADER_SKIP_PATTERN = re.compile(
    r"(government of india|uidai|unique identification|aadhaar|आधार|भारत सरकार|my aadhaar)",
    re.IGNORECASE,
)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def normalize_aadhaar(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


def display_doc_name(doc_type: str) -> str:
    return doc_type.replace("_", " ").title()


def extract_name_from_lines(lines: list[str]) -> str | None:
    cleaned_lines = [line.strip() for line in lines if line.strip()]
    if not cleaned_lines:
        return None

    for index, line in enumerate(cleaned_lines):
        if not AADHAAR_ANCHOR_PATTERN.search(line):
            continue

        # Aadhaar cards often place the name just above DOB/gender lines.
        for candidate_index in range(max(0, index - 2), index):
            candidate = cleaned_lines[candidate_index]
            if HEADER_SKIP_PATTERN.search(candidate):
                continue
            if any(char.isdigit() for char in candidate):
                continue
            if NAME_LINE_PATTERN.match(candidate):
                return candidate

    for line in cleaned_lines:
        if HEADER_SKIP_PATTERN.search(line):
            continue
        if any(char.isdigit() for char in line):
            continue
        if NAME_LINE_PATTERN.match(line):
            return line

    return None


def extract_structured_fields(text: str) -> dict[str, Any]:
    data: dict[str, Any] = {}
    if match := NAME_PATTERN.search(text):
        data["name"] = match.group(1).strip()
    elif inferred_name := extract_name_from_lines(text.splitlines()):
        data["name"] = inferred_name
    if match := ADDRESS_PATTERN.search(text):
        data["address"] = match.group(1).strip()
    if match := CERT_PATTERN.search(text):
        data["certificate_number"] = match.group(1).strip()
    if match := AADHAAR_PATTERN.search(text):
        data["aadhaar_number"] = normalize_aadhaar(match.group(0))
    affidavit_lines = [line.strip() for line in text.splitlines() if "affidavit" in line.lower()]
    if affidavit_lines:
        data["affidavit_statements"] = affidavit_lines
    return data


def compare_documents(form_data: dict[str, str], extracted_documents: dict[str, dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    form_fields = {
        "name": normalize_text(form_data.get("name", "")),
        "address": normalize_text(form_data.get("address", "")),
        "aadhaar_number": normalize_aadhaar(form_data.get("aadhaar_number", "")),
    }

    comparable_fields = {
        "name": "Applicant name",
        "address": "Address",
        "aadhaar_number": "Aadhaar number",
    }

    normalized_documents: dict[str, dict[str, str]] = {}
    for doc_type, doc_data in extracted_documents.items():
        normalized_documents[doc_type] = {
            "name": normalize_text(str(doc_data.get("name", ""))),
            "address": normalize_text(str(doc_data.get("address", ""))),
            "aadhaar_number": normalize_aadhaar(str(doc_data.get("aadhaar_number", ""))),
        }

    for doc_type, doc_fields in normalized_documents.items():
        for field, label in comparable_fields.items():
            form_value = form_fields[field]
            doc_value = doc_fields[field]
            if form_value and doc_value and form_value != doc_value:
                warnings.append(f"{label} mismatch detected between application form and {display_doc_name(doc_type)}.")

    doc_types = list(normalized_documents.keys())
    for index, left_doc in enumerate(doc_types):
        for right_doc in doc_types[index + 1 :]:
            for field, label in comparable_fields.items():
                left_value = normalized_documents[left_doc][field]
                right_value = normalized_documents[right_doc][field]
                if left_value and right_value and left_value != right_value:
                    warnings.append(
                        f"{label} mismatch detected between {display_doc_name(left_doc)} and {display_doc_name(right_doc)}."
                    )

    return sorted(set(warnings))
