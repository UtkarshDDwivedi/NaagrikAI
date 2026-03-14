from collections.abc import Iterable


APPLICATION_CHECKLISTS = {
    "Income Certificate": [
        "aadhaar_card",
        "passbook",
        "marksheet",
        "pan_card",
    ],
    "Pension Scheme": [
        "aadhaar_card",
        "income_certificate",
        "passbook",
        "caste_certificate",
    ],
    "Sand Mining": [
        "processing_fee",
        "pre_feasibility_report",
        "emp",
        "land_document",
        "gram_panchayat_noc",
        "200m_certificate",
        "500m_certificate",
        "mining_plan",
        "forest_noc",
        "kml_file",
        "affidavit",
        "drone_video",
    ],
    "Brick Kiln": [
        "processing_fee",
        "land_document",
        "consent_to_establish",
        "site_plan",
        "affidavit",
        "kml_file",
    ],
    "Infrastructure Project": [
        "processing_fee",
        "land_document",
        "forest_noc",
        "environment_clearance",
        "project_report",
        "kml_file",
        "affidavit",
        "drone_video",
    ],
    "Limestone": [
        "processing_fee",
        "pre_feasibility_report",
        "emp",
        "land_document",
        "mining_plan",
        "forest_noc",
        "kml_file",
        "affidavit",
        "drone_video",
    ],
}


def normalize_doc_name(name: str) -> str:
    return name.strip().lower().replace(" ", "_")


def get_required_documents(application_type: str) -> list[str]:
    return APPLICATION_CHECKLISTS.get(application_type, [])


def validate_checklist(application_type: str, uploaded_documents: Iterable[str]) -> dict[str, list[str]]:
    required_documents = {normalize_doc_name(item) for item in get_required_documents(application_type)}
    uploaded = {normalize_doc_name(item) for item in uploaded_documents}
    missing_documents = sorted(required_documents - uploaded)
    return {
        "required_documents": sorted(required_documents),
        "uploaded_documents": sorted(uploaded),
        "missing_documents": missing_documents,
    }
