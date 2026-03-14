SUGGESTION_MAP = {
    "forest_noc": (
        "Forest NOC is required for this application. Please upload the certificate from the Forest Department.",
        "Forest NOC अपलोड नहीं किया गया है। कृपया इसे अपलोड करें।",
    ),
    "kml_file": (
        "Upload the KML file with accurate project boundary coordinates.",
        "कृपया सही प्रोजेक्ट सीमा निर्देशांकों के साथ KML फ़ाइल अपलोड करें।",
    ),
    "affidavit": (
        "A signed affidavit is required before submission.",
        "जमा करने से पहले हस्ताक्षरित हलफनामा आवश्यक है।",
    ),
    "drone_video": (
        "Drone video evidence is missing. Attach the geo-tagged site recording.",
        "ड्रोन वीडियो उपलब्ध नहीं है। कृपया जियो-टैग्ड साइट रिकॉर्डिंग अपलोड करें।",
    ),
}


def build_suggestions(missing_documents: list[str], mismatch_warnings: list[str]) -> list[dict[str, str]]:
    suggestions: list[dict[str, str]] = []
    for document in missing_documents:
        english, hindi = SUGGESTION_MAP.get(
            document,
            (
                f"Upload the required document: {document.replace('_', ' ').title()}.",
                f"कृपया आवश्यक दस्तावेज़ अपलोड करें: {document.replace('_', ' ').title()}।",
            ),
        )
        suggestions.append({"type": "missing_document", "english": english, "hindi": hindi})

    for warning in mismatch_warnings:
        suggestions.append(
            {
                "type": "consistency_warning",
                "english": f"Resolve the inconsistency before submission: {warning}",
                "hindi": f"सबमिशन से पहले विसंगति ठीक करें: {warning}",
            }
        )

    if not suggestions:
        suggestions.append(
            {
                "type": "ready",
                "english": "All primary checks passed. Review once and proceed to submit.",
                "hindi": "मुख्य जांच पूरी हो गई है। एक बार समीक्षा करें और सबमिट करें।",
            }
        )
    return suggestions
